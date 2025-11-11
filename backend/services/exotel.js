const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { integrationsConfig, validateExotelConfig } = require('../lib/integrations');
const { normalizePhoneNumber } = require('./gupshup');

const prisma = new PrismaClient();
const config = integrationsConfig.exotel;

/**
 * Initiate a bridged call via Exotel (connects two numbers)
 */
async function initiateCall({
  fromNumber,
  toNumber,
  flowId = null,
  customData = {},
  metadata = {},
}) {
  const validation = validateExotelConfig();
  if (!validation.enabled) {
    return {
      success: false,
      error: 'Exotel is not enabled',
    };
  }
  
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  const normalizedFrom = normalizePhoneNumber(fromNumber);
  const normalizedTo = normalizePhoneNumber(toNumber);
  
  try {
    // Create call log entry
    const callLog = await prisma.callLog.create({
      data: {
        direction: 'OUTBOUND',
        status: 'INITIATED',
        fromNumber: normalizedFrom,
        toNumber: normalizedTo,
        flowId: flowId || null,
        metadata: {
          ...(Object.keys(customData).length > 0 && { customData }),
          ...(Object.keys(metadata).length > 0 && { metadata }),
        },
        initiatedAt: new Date(),
      },
    });

    // Prepare Exotel API request
    const apiUrl = config.apiBaseUrl(config.subdomain) + '/Calls/connect.json';
    
    const payload = {
      From: normalizedFrom,
      To: normalizedTo,
      CallerId: config.fromNumber,
      ...(flowId && { FlowId: flowId }),
      ...(Object.keys(customData).length > 0 && { CustomData: JSON.stringify(customData) }),
    };

    // Make API call
    const response = await axios.post(apiUrl, payload, {
      auth: {
        username: config.apiKey,
        password: config.apiToken,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const providerCallId = response.data?.Call?.Sid || response.data?.CallSid || null;
    const providerStatus = response.data?.Call?.Status || 'initiated';

    // Update call log
    await prisma.callLog.update({
      where: { id: callLog.id },
      data: {
        providerCallId,
        providerStatus,
        status: 'RINGING',
        metadata: {
          ...callLog.metadata,
          exotelResponse: response.data,
        },
      },
    });

    // Upsert contacts
    await upsertContact(normalizedFrom);
    await upsertContact(normalizedTo);

    return {
      success: true,
      callId: callLog.id,
      providerCallId,
      status: providerStatus,
    };
  } catch (error) {
    console.error('Exotel call initiation error:', error);
    
    // Update call log with error
    try {
      await prisma.callLog.update({
        where: { id: callLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message || 'Failed to initiate call',
          metadata: {
            error: error.response?.data || error.message,
          },
        },
      });
    } catch (updateError) {
      console.error('Failed to update call log:', updateError);
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to initiate call',
      code: error.response?.status,
    };
  }
}

/**
 * Initiate a call to reception/concierge (bridged call)
 */
async function callReception({
  guestPhone,
  receptionPhone = null,
  bookingId = null,
  metadata = {},
}) {
  // Default reception number from config or use provided
  const reception = receptionPhone || config.fromNumber;
  
  return await initiateCall({
    fromNumber: guestPhone,
    toNumber: reception,
    customData: {
      type: 'reception_call',
      bookingId,
    },
    metadata: {
      ...metadata,
      bookingId,
    },
  });
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
 * Handle webhook from Exotel
 */
async function handleWebhook(webhookData) {
  try {
    const { CallSid, CallStatus, From, To, Direction, Duration, RecordingUrl } = webhookData;
    
    if (!CallSid) {
      return { success: false, error: 'Missing CallSid' };
    }

    // Find call log by provider call ID
    const callLog = await prisma.callLog.findUnique({
      where: { providerCallId: CallSid },
    });

    if (!callLog) {
      // Create new call log for inbound calls
      const normalizedFrom = normalizePhoneNumber(From);
      const normalizedTo = normalizePhoneNumber(To);
      
      const newCallLog = await prisma.callLog.create({
        data: {
          direction: Direction === 'inbound' ? 'INBOUND' : 'OUTBOUND',
          status: mapExotelStatus(CallStatus),
          fromNumber: normalizedFrom,
          toNumber: normalizedTo,
          providerCallId: CallSid,
          providerStatus: CallStatus,
          duration: Duration ? parseInt(Duration) : null,
          recordingUrl: RecordingUrl || null,
          initiatedAt: new Date(),
          ...(CallStatus === 'completed' && { completedAt: new Date() }),
          ...(CallStatus === 'answered' && { answeredAt: new Date() }),
          metadata: webhookData,
        },
      });

      // Upsert contacts
      await upsertContact(normalizedFrom);
      await upsertContact(normalizedTo);

      return {
        success: true,
        callLogId: newCallLog.id,
        created: true,
      };
    }

    // Update existing call log
    const updateData = {
      providerStatus: CallStatus,
      status: mapExotelStatus(CallStatus),
      ...(Duration && { duration: parseInt(Duration) }),
      ...(RecordingUrl && { recordingUrl: RecordingUrl }),
      ...(CallStatus === 'answered' && !callLog.answeredAt && { answeredAt: new Date() }),
      ...(CallStatus === 'completed' && !callLog.completedAt && { completedAt: new Date() }),
      metadata: {
        ...(callLog.metadata || {}),
        lastWebhook: webhookData,
      },
    };

    await prisma.callLog.update({
      where: { id: callLog.id },
      data: updateData,
    });

    return {
      success: true,
      callLogId: callLog.id,
      updated: true,
    };
  } catch (error) {
    console.error('Exotel webhook handling error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process webhook',
    };
  }
}

/**
 * Map Exotel call status to our CallStatus enum
 */
function mapExotelStatus(exotelStatus) {
  const statusMap = {
    'initiated': 'INITIATED',
    'ringing': 'RINGING',
    'answered': 'ANSWERED',
    'completed': 'COMPLETED',
    'busy': 'BUSY',
    'failed': 'FAILED',
    'no-answer': 'NO_ANSWER',
    'cancelled': 'CANCELLED',
  };
  
  return statusMap[exotelStatus?.toLowerCase()] || 'INITIATED';
}

/**
 * Get call details from Exotel
 */
async function getCallDetails(providerCallId) {
  const validation = validateExotelConfig();
  if (!validation.enabled || !validation.valid) {
    return {
      success: false,
      error: 'Exotel is not configured',
    };
  }

  try {
    const apiUrl = config.apiBaseUrl(config.subdomain) + `/Calls/${providerCallId}.json`;
    
    const response = await axios.get(apiUrl, {
      auth: {
        username: config.apiKey,
        password: config.apiToken,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Exotel get call details error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get call details',
    };
  }
}

module.exports = {
  initiateCall,
  callReception,
  handleWebhook,
  getCallDetails,
  mapExotelStatus,
};

