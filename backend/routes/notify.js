const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { sendWhatsAppMessage, sendSMS } = require('../services/gupshup');
const { renderTemplate } = require('../services/template-engine');
const { createHash } = require('crypto');

const router = express.Router();

// Initialize Prisma client lazily to avoid startup issues
let prisma;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * Get existing idempotency or null
 */
async function getExistingIdempotency(key) {
  if (!key) return null;
  return getPrisma().idempotencyKey.findUnique({ where: { key } });
}

/**
 * Persist idempotency key
 */
async function persistIdempotency(key, method, path, requestHash, statusCode, responseBody, propertyId) {
  if (!key) return;
  await getPrisma().idempotencyKey.upsert({
    where: { key },
    update: {
      requestHash,
      responseBody,
      statusCode,
      lastUsedAt: new Date(),
      propertyId: propertyId || undefined,
    },
    create: {
      key,
      method,
      path,
      requestHash,
      responseBody,
      statusCode,
      propertyId: propertyId || undefined,
    },
  });
}

/**
 * POST /api/notify/booking
 * Send WhatsApp/SMS notification for booking or direct message
 */
router.post('/booking', async (req, res) => {
  try {
    const { bookingId, phone, message, channel = 'whatsapp', templateId, templateParams = [] } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];

    // Support both booking-based and direct messaging
    let targetPhone = phone;
    let booking = null;
    let propertyId = null;

    if (bookingId) {
      // Get booking details
      booking = await getPrisma().booking.findUnique({
        where: { id: parseInt(bookingId) },
        include: {
          property: true,
          roomType: true,
        },
      });

      if (!booking) {
        return res.status(404).json({
          error: 'Booking not found',
        });
      }

      if (!booking.phone) {
        return res.status(400).json({
          error: 'Booking does not have a phone number',
        });
      }

      targetPhone = booking.phone;
      propertyId = booking.propertyId;
    } else if (!phone) {
      return res.status(400).json({
        error: 'Missing required field: phone or bookingId',
      });
    }

    // Handle idempotency
    if (idempotencyKey) {
      const requestHash = createHash('sha256')
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      const existing = await getExistingIdempotency(idempotencyKey);
      if (existing && existing.requestHash === requestHash) {
        return res.status(existing.statusCode || 200).json(existing.responseBody || {});
      }
    }

    // Prepare message content - use template if templateId provided or auto-find booking confirmation template
    let messageContent = message;
    let templateUsed = null;
    
    if (templateId && bookingId) {
      // Use specific template
      const template = await getPrisma().messageTemplate.findUnique({
        where: { id: parseInt(templateId) },
      });
      
      if (template && template.isActive) {
        try {
          const rendered = await renderTemplate(template.body, template.subject, bookingId);
          messageContent = rendered.body;
          templateUsed = template;
        } catch (error) {
          console.error('Error rendering template:', error);
          // Fall back to default message
        }
      }
    } else if (bookingId && !message) {
      // Auto-find booking confirmation template
      const template = await getPrisma().messageTemplate.findFirst({
        where: {
          type: 'BOOKING_CONFIRMATION',
          channel: channel === 'whatsapp' ? 'WHATSAPP' : 'SMS',
          isActive: true,
          OR: [
            { propertyId: propertyId },
            { propertyId: null }, // Global templates
          ],
        },
        orderBy: [
          { propertyId: 'desc' }, // Property-specific first
          { createdAt: 'desc' },
        ],
      });
      
      if (template) {
        try {
          const rendered = await renderTemplate(template.body, template.subject, bookingId);
          messageContent = rendered.body;
          templateUsed = template;
        } catch (error) {
          console.error('Error rendering auto-template:', error);
          // Fall back to default message
        }
      }
    }
    
    // Fallback to default message if no template was used
    if (!messageContent && booking) {
      messageContent = `Your booking #${booking.id} at ${booking.property.name} is confirmed.\n\n` +
        `Check-in: ${new Date(booking.checkIn).toLocaleDateString()}\n` +
        `Check-out: ${new Date(booking.checkOut).toLocaleDateString()}\n` +
        `Room: ${booking.roomType.name}\n` +
        `Total: ₹${booking.totalPrice}\n\n` +
        `Thank you for choosing ${booking.property.name}!`;
    }
    
    if (!messageContent) {
      return res.status(400).json({
        error: 'Missing required field: message',
      });
    }

    // Send message based on channel
    let result;
    if (channel.toLowerCase() === 'sms') {
      result = await sendSMS({
        phone: targetPhone,
        message: messageContent,
        metadata: {
          ...(booking && { bookingId: booking.id }),
          ...(propertyId && { propertyId }),
        },
      });
    } else {
      result = await sendWhatsAppMessage({
        phone: targetPhone,
        message: templateId ? null : messageContent,
        templateId: templateId || null,
        templateParams: templateParams.length > 0 ? templateParams : [],
        metadata: {
          ...(booking && { bookingId: booking.id }),
          ...(propertyId && { propertyId }),
        },
      });
    }

    // Link message log to booking if provided
    if (result.success && result.messageId && booking) {
      await getPrisma().messageLog.update({
        where: { id: result.messageId },
        data: { bookingId: booking.id },
      });
    }

    // Persist idempotency
    if (idempotencyKey) {
      const requestHash = createHash('sha256')
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      await persistIdempotency(
        idempotencyKey,
        'POST',
        '/api/notify/booking',
        requestHash,
        result.success ? 200 : 500,
        result,
        propertyId
      );
    }

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Notification sent successfully',
        messageId: result.messageId,
        providerMessageId: result.providerMessageId,
        templateUsed: templateUsed ? { id: templateUsed.id, name: templateUsed.name } : null,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to send notification',
      });
    }
  } catch (error) {
    console.error('Booking notification error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;

