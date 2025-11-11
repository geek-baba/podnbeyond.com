const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { callReception } = require('../services/exotel');
const { createHash } = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Get existing idempotency or null
 */
async function getExistingIdempotency(key) {
  if (!key) return null;
  return prisma.idempotencyKey.findUnique({ where: { key } });
}

/**
 * Persist idempotency key
 */
async function persistIdempotency(key, method, path, requestHash, statusCode, responseBody, propertyId) {
  if (!key) return;
  await prisma.idempotencyKey.upsert({
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
 * POST /api/voice/call-reception
 * Initiate a bridged call between guest and reception
 */
router.post('/call-reception', async (req, res) => {
  try {
    const { guestPhone, receptionPhone, bookingId, propertyId } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];

    // Validate required fields
    if (!guestPhone) {
      return res.status(400).json({
        error: 'Missing required field: guestPhone',
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

    // Get property reception number if propertyId provided
    let reception = receptionPhone;
    if (!reception && propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: parseInt(propertyId) },
      });
      if (property && property.phone) {
        reception = property.phone;
      }
    }

    // Initiate call
    const result = await callReception({
      guestPhone,
      receptionPhone: reception,
      bookingId: bookingId ? parseInt(bookingId) : null,
      metadata: {
        propertyId: propertyId ? parseInt(propertyId) : null,
      },
    });

    // Link call log to booking if provided
    if (result.success && result.callId && bookingId) {
      await prisma.callLog.update({
        where: { id: result.callId },
        data: { bookingId: parseInt(bookingId) },
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
        '/api/voice/call-reception',
        requestHash,
        result.success ? 200 : 500,
        result,
        propertyId ? parseInt(propertyId) : null
      );
    }

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Call initiated successfully',
        callId: result.callId,
        providerCallId: result.providerCallId,
        status: result.status,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to initiate call',
      });
    }
  } catch (error) {
    console.error('Call reception error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;

