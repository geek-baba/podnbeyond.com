const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { integrationsConfig, validateGupshupConfig } = require('../lib/integrations');
const { findOrCreateThread, linkMessageToThread } = require('./thread-linking');

const prisma = new PrismaClient();
const config = integrationsConfig.gupshup;

/**
 * Normalize phone number (remove spaces, add country code if needed)
 */
function normalizePhoneNumber(phone) {
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, '');
  
  // If number doesn't start with country code, assume India (+91)
  if (normalized.length === 10) {
    normalized = '91' + normalized;
  }
  
  return normalized;
}

/**
 * Send WhatsApp message via Gupshup
 */
async function sendWhatsAppMessage({
  phone,
  message,
  templateId,
  templateParams = [],
  metadata = {},
}) {
  const validation = validateGupshupConfig();
  if (!validation.enabled) {
    return {
      success: false,
      error: 'Gupshup is not enabled',
    };
  }
  
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  
  try {
    // Create message log entry
    const messageLog = await prisma.messageLog.create({
      data: {
        channel: 'WHATSAPP',
        direction: 'OUTBOUND',
        status: 'PENDING',
        phone: normalizedPhone,
        message: message || null,
        templateId: templateId || null,
        templateParams: templateParams.length > 0 ? templateParams : null,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
      },
    });

    // Prepare Gupshup API request
    // Gupshup WhatsApp Business API format (matches curl example)
    const url = `${config.apiBaseUrl}/msg`;
    
    // Format message as JSON string (Gupshup expects JSON-encoded message)
    const messagePayload = message ? JSON.stringify({
      type: 'text',
      text: message,
    }) : JSON.stringify({
      type: 'text',
      text: '',
    });

    // If template is provided, use template format
    let finalMessage = messagePayload;
    if (templateId) {
      finalMessage = JSON.stringify({
        type: 'template',
        template: {
          id: templateId,
          params: templateParams,
        },
      });
    }

    const payload = {
      channel: 'whatsapp',
      source: config.source,
      destination: normalizedPhone,
      message: finalMessage,
      'src.name': config.appName,
    };

    // Make API call with API key authentication
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apikey': config.apiKey,
        'Cache-Control': 'no-cache',
      },
    });

    const providerMessageId = response.data?.messageId || response.data?.id || null;
    const providerStatus = response.data?.status || 'sent';

    // Update message log
    await prisma.messageLog.update({
      where: { id: messageLog.id },
      data: {
        providerMessageId,
        providerStatus,
        status: 'SENT',
        sentAt: new Date(),
        metadata: {
          ...(messageLog.metadata || {}),
          gupshupResponse: response.data,
        },
      },
    });

    // Upsert contact
    await upsertContact(normalizedPhone);

    // Link to thread if booking/property metadata exists
    if (metadata.bookingId || metadata.propertyId) {
      const contact = await prisma.contact.findUnique({ where: { phone: normalizedPhone } });
      const thread = await findOrCreateThread({
        phone: normalizedPhone,
        email: contact?.email || null,
        propertyId: metadata.propertyId || null,
        bookingId: metadata.bookingId || null,
        subject: `WhatsApp conversation with ${normalizedPhone}`,
      });
      await linkMessageToThread(messageLog.id, thread.id);
    }

    return {
      success: true,
      messageId: messageLog.id,
      providerMessageId,
      status: providerStatus,
    };
  } catch (error) {
    console.error('Gupshup WhatsApp send error:', error);
    
    // Update message log with error
    try {
      await prisma.messageLog.update({
        where: { id: messageLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message || 'Failed to send message',
          metadata: {
            error: error.response?.data || error.message,
          },
        },
      });
    } catch (updateError) {
      console.error('Failed to update message log:', updateError);
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to send WhatsApp message',
      code: error.response?.status,
    };
  }
}

/**
 * Send SMS via Gupshup
 */
async function sendSMS({
  phone,
  message,
  metadata = {},
}) {
  const validation = validateGupshupConfig();
  if (!validation.enabled) {
    return {
      success: false,
      error: 'Gupshup is not enabled',
    };
  }
  
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  
  try {
    // Create message log entry
    const messageLog = await prisma.messageLog.create({
      data: {
        channel: 'SMS',
        direction: 'OUTBOUND',
        status: 'PENDING',
        phone: normalizedPhone,
        message,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
      },
    });

    // Prepare Gupshup API request for SMS
    const url = `${config.apiBaseUrl}/msg`;
    const payload = {
      channel: 'sms',
      source: config.source,
      destination: normalizedPhone,
      message,
      'src.name': config.appName,
      appName: config.appName,
    };

    // Make API call with API key authentication
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apikey': config.apiKey,
        'Accept': 'application/json',
      },
    });

    const providerMessageId = response.data?.messageId || response.data?.id || null;
    const providerStatus = response.data?.status || 'sent';

    // Update message log
    await prisma.messageLog.update({
      where: { id: messageLog.id },
      data: {
        providerMessageId,
        providerStatus,
        status: 'SENT',
        sentAt: new Date(),
        metadata: {
          ...(messageLog.metadata || {}),
          gupshupResponse: response.data,
        },
      },
    });

    // Upsert contact
    await upsertContact(normalizedPhone);

    // Link to thread if booking/property metadata exists
    if (metadata.bookingId || metadata.propertyId) {
      const contact = await prisma.contact.findUnique({ where: { phone: normalizedPhone } });
      const thread = await findOrCreateThread({
        phone: normalizedPhone,
        email: contact?.email || null,
        propertyId: metadata.propertyId || null,
        bookingId: metadata.bookingId || null,
        subject: `SMS conversation with ${normalizedPhone}`,
      });
      await linkMessageToThread(messageLog.id, thread.id);
    }

    return {
      success: true,
      messageId: messageLog.id,
      providerMessageId,
      status: providerStatus,
    };
  } catch (error) {
    console.error('Gupshup SMS send error:', error);
    
    // Update message log with error
    try {
      await prisma.messageLog.update({
        where: { id: messageLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message || 'Failed to send message',
          metadata: {
            error: error.response?.data || error.message,
          },
        },
      });
    } catch (updateError) {
      console.error('Failed to update message log:', updateError);
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to send SMS',
      code: error.response?.status,
    };
  }
}

/**
 * Upsert contact record
 */
async function upsertContact(phone, name = null, email = null) {
  try {
    return await prisma.contact.upsert({
      where: { phone },
      update: {
        ...(name && { name }),
        ...(email && { email }),
        updatedAt: new Date(),
      },
      create: {
        phone,
        ...(name && { name }),
        ...(email && { email }),
      },
    });
  } catch (error) {
    console.error('Failed to upsert contact:', error);
    return null;
  }
}

/**
 * Handle inbound webhook from Gupshup
 */
async function handleWebhook(webhookData) {
  try {
    const { type, payload } = webhookData;
    
    // Handle different webhook types
    switch (type) {
      case 'message':
        return await handleInboundMessage(payload);
      case 'delivery':
        return await handleDeliveryStatus(payload);
      case 'read':
        return await handleReadStatus(payload);
      default:
        console.log('Unknown webhook type:', type);
        return { success: true, message: 'Webhook received but not processed' };
    }
  } catch (error) {
    console.error('Gupshup webhook handling error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process webhook',
    };
  }
}

/**
 * Handle inbound message
 */
async function handleInboundMessage(payload) {
  const { phone, message, messageId, timestamp } = payload;
  const normalizedPhone = normalizePhoneNumber(phone);

  // Upsert contact
  const contact = await upsertContact(normalizedPhone);

  // Create message log
  const messageLog = await prisma.messageLog.create({
    data: {
      channel: payload.channel === 'sms' ? 'SMS' : 'WHATSAPP',
      direction: 'INBOUND',
      status: 'DELIVERED',
      phone: normalizedPhone,
      message: message || null,
      providerMessageId: messageId || null,
      providerStatus: 'delivered',
      sentAt: timestamp ? new Date(timestamp) : new Date(),
      deliveredAt: timestamp ? new Date(timestamp) : new Date(),
      metadata: payload,
      contactId: contact?.id || null,
    },
  });

  // Find or create thread and link message
  // Try to find booking/property from contact metadata or recent messages
  let propertyId = null;
  let bookingId = null;

  if (contact?.metadata) {
    propertyId = contact.metadata.propertyId || null;
    bookingId = contact.metadata.bookingId || null;
  }

  // If not in contact metadata, check recent outbound messages
  if (!propertyId && !bookingId) {
    const recentOutbound = await prisma.messageLog.findFirst({
      where: {
        phone: normalizedPhone,
        direction: 'OUTBOUND',
        metadata: { path: ['propertyId'], not: null },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (recentOutbound?.metadata) {
      propertyId = recentOutbound.metadata.propertyId || null;
      bookingId = recentOutbound.metadata.bookingId || null;
    }
  }

  const thread = await findOrCreateThread({
    phone: normalizedPhone,
    email: contact?.email || null,
    propertyId,
    bookingId,
    subject: `Conversation with ${contact?.name || normalizedPhone}`,
  });

  await linkMessageToThread(messageLog.id, thread.id);

  return {
    success: true,
    messageLogId: messageLog.id,
    threadId: thread.id,
  };
}

/**
 * Handle delivery status update
 */
async function handleDeliveryStatus(payload) {
  const { messageId, status, timestamp } = payload;

  if (!messageId) {
    return { success: false, error: 'Missing messageId' };
  }

  const messageLog = await prisma.messageLog.findUnique({
    where: { providerMessageId: messageId },
  });

  if (!messageLog) {
    return { success: false, error: 'Message log not found' };
  }

  const updateData = {
    providerStatus: status,
    ...(status === 'delivered' && { 
      status: 'DELIVERED',
      deliveredAt: timestamp ? new Date(timestamp) : new Date(),
    }),
    ...(status === 'failed' && { 
      status: 'FAILED',
      errorMessage: payload.error || 'Delivery failed',
    }),
  };

  await prisma.messageLog.update({
    where: { id: messageLog.id },
    data: updateData,
  });

  return {
    success: true,
    messageLogId: messageLog.id,
  };
}

/**
 * Handle read status update
 */
async function handleReadStatus(payload) {
  const { messageId, timestamp } = payload;

  if (!messageId) {
    return { success: false, error: 'Missing messageId' };
  }

  const messageLog = await prisma.messageLog.findUnique({
    where: { providerMessageId: messageId },
  });

  if (!messageLog) {
    return { success: false, error: 'Message log not found' };
  }

  await prisma.messageLog.update({
    where: { id: messageLog.id },
    data: {
      status: 'READ',
      readAt: timestamp ? new Date(timestamp) : new Date(),
      providerStatus: 'read',
    },
  });

  return {
    success: true,
    messageLogId: messageLog.id,
  };
}

module.exports = {
  sendWhatsAppMessage,
  sendSMS,
  handleWebhook,
  normalizePhoneNumber,
};

