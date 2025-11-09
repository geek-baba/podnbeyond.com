const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { createHash, randomUUID } = require('crypto');
const {
  normalizeDate,
  getDateRange,
  ensureInventoryRow,
  updateInventoryWithHold,
  updateInventoryWithConfirmation,
  releaseInventory,
  MAX_BOOKING_RANGE_DAYS,
} = require('../lib/inventoryUtils');

const router = express.Router();
const prisma = new PrismaClient();

const HOLD_TTL_MINUTES = parseInt(process.env.BOOKING_HOLD_TTL_MINUTES || '15', 10);

const BOOKING_STATUSES_REQUIRING_RELEASE = new Set(['HOLD', 'PENDING', 'CONFIRMED']);

/**
 * Util helpers
 */
async function getExistingIdempotency(prismaClient, key) {
  if (!key) return null;
  return prismaClient.idempotencyKey.findUnique({ where: { key } });
}

async function persistIdempotency(prismaClient, key, method, path, requestHash, statusCode, responseBody, propertyId) {
  if (!key) return;
  await prismaClient.idempotencyKey.upsert({
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

function hashRequestBody(body) {
  return createHash('sha256').update(JSON.stringify(body || {})).digest('hex');
}

async function ensureLoyaltyAccount(tx, email) {
  if (!email) return null;
  const existing = await tx.loyaltyAccount.findUnique({ where: { userId: email } });
  if (existing) {
    return tx.loyaltyAccount.update({
      where: { userId: email },
      data: { lastUpdated: new Date() },
    });
  }

  return tx.loyaltyAccount.create({
    data: {
      userId: email,
      points: 0,
      tier: 'SILVER',
      lastUpdated: new Date(),
    },
  });
}

/**
 * GET /bookings
 * Basic list endpoint (admin).
 */
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        property: true,
        roomType: true,
        ratePlan: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
});

/**
 * GET /bookings/:id
 */
router.get('/bookings/:id', async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: {
        property: true,
        roomType: true,
        ratePlan: true,
        payments: true,
        loyaltyAccount: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch booking' });
  }
});

/**
 * Legacy compatibility: GET /rooms returns room types with aggregated data.
 */
router.get('/rooms', async (req, res) => {
  try {
    const roomTypes = await prisma.roomType.findMany({
      where: { isActive: true },
      include: {
        property: true,
        ratePlans: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: [{ propertyId: 'asc' }, { sortOrder: 'asc' }],
    });

    const formatted = roomTypes.map((roomType) => ({
      id: roomType.id,
      name: roomType.name,
      type: roomType.code || roomType.name,
      baseRooms: roomType.baseRooms,
      capacity: roomType.capacity,
      description: roomType.description,
      pricePerNight: roomType.ratePlans?.[0]?.seasonalPrice || 0,
      ratePlanId: roomType.ratePlans?.[0]?.id || null,
      ratePlanName: roomType.ratePlans?.[0]?.name || null,
      status: roomType.isActive ? 'ACTIVE' : 'INACTIVE',
      property: {
        id: roomType.property.id,
        name: roomType.property.name,
        city: roomType.property.city,
      },
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching room types:', error);
    res.status(500).json({ error: 'Failed to fetch room types' });
  }
});

/**
 * POST /bookings/hold
 * Idempotent hold creation, increments inventory holds.
 */
router.post('/bookings/hold', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  const requestHash = hashRequestBody(req.body);

  try {
    if (!idempotencyKey) {
      return res.status(400).json({ success: false, error: 'Idempotency-Key header is required' });
    }

    const existingKey = await getExistingIdempotency(prisma, idempotencyKey);
    if (existingKey) {
      if (existingKey.requestHash !== requestHash) {
        return res.status(409).json({ success: false, error: 'Conflicting idempotency key with different payload' });
      }
      if (existingKey.responseBody) {
        return res.status(existingKey.statusCode || 200).json(existingKey.responseBody);
      }
    }

    const {
      propertyId,
      roomTypeId,
      ratePlanId,
      guestName,
      email,
      phone,
      checkIn,
      checkOut,
      guests = 1,
      rooms = 1,
      specialRequests,
      source = 'DIRECT',
    } = req.body;

    if (!propertyId || !roomTypeId || !checkIn || !checkOut || !guestName || !email) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid check-in or check-out date' });
    }

    const stayNights = getDateRange(checkInDate, checkOutDate);
    if (stayNights.length > MAX_BOOKING_RANGE_DAYS) {
      return res.status(400).json({ success: false, error: `Stay cannot exceed ${MAX_BOOKING_RANGE_DAYS} nights` });
    }

    const { booking, property, roomType, inventories } = await prisma.$transaction(async (tx) => {
      const property = await tx.property.findUnique({
        where: { id: parseInt(propertyId, 10) },
      });

      if (!property) {
        throw Object.assign(new Error('Property not found'), { statusCode: 404 });
      }

      const roomType = await tx.roomType.findFirst({
        where: {
          id: parseInt(roomTypeId, 10),
          propertyId: property.id,
          isActive: true,
        },
        include: {
          ratePlans: true,
        },
      });

      if (!roomType) {
        throw Object.assign(new Error('Room type not found or inactive'), { statusCode: 404 });
      }

      if (guests > roomType.capacity * rooms) {
        throw Object.assign(
          new Error(`Capacity exceeded. Room type supports ${roomType.capacity} guests per room`),
          { statusCode: 400 }
        );
      }

      const selectedRatePlan = ratePlanId
        ? await tx.ratePlan.findFirst({
            where: {
              id: parseInt(ratePlanId, 10),
              roomTypeId: roomType.id,
            },
          })
        : roomType.ratePlans.find((plan) => !plan.startDate || plan.startDate <= checkInDate);

      const loyaltyAccount = await ensureLoyaltyAccount(tx, email);

      const holdToken = randomUUID();
      const holdExpiresAt = new Date(Date.now() + HOLD_TTL_MINUTES * 60 * 1000);

      const booking = await tx.booking.create({
      data: {
        guestName,
        email,
        phone: phone || null,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
          rooms,
          totalPrice: selectedRatePlan?.seasonalPrice
            ? selectedRatePlan.seasonalPrice * stayNights.length * rooms
            : 0,
        specialRequests: specialRequests || null,
          status: 'HOLD',
          propertyId: property.id,
          roomTypeId: roomType.id,
          ratePlanId: selectedRatePlan?.id ?? null,
          holdToken,
          holdExpiresAt,
          source,
          loyaltyAccountId: loyaltyAccount?.id ?? null,
        },
      });

      const inventories = [];
      for (const date of stayNights) {
        const inventory = await ensureInventoryRow(tx, property, roomType, date);
        const updatedInventory = await updateInventoryWithHold(tx, inventory, rooms, booking.id, holdToken);
        inventories.push(updatedInventory);
      }

      await tx.holdLog.create({
        data: {
          bookingId: booking.id,
          holdToken: booking.holdToken,
          roomTypeId: roomType.id,
          propertyId: property.id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          rooms,
          guests,
          status: 'ACTIVE',
          expiresAt: booking.holdExpiresAt,
          metadata: {
            ratePlanId: selectedRatePlan?.id || null,
          },
        },
      });

      return { booking, property, roomType, inventories, selectedRatePlan };
    }, { isolationLevel: 'Serializable' });

    const responseBody = {
      success: true,
      message: 'Hold created successfully',
      booking: {
        id: booking.id,
        status: booking.status,
        holdToken: booking.holdToken,
        holdExpiresAt: booking.holdExpiresAt,
        propertyId: booking.propertyId,
        roomTypeId: booking.roomTypeId,
        ratePlanId: booking.ratePlanId,
        totalPrice: booking.totalPrice,
        guests: booking.guests,
        rooms: booking.rooms,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
      },
    };

    await persistIdempotency(
      prisma,
      idempotencyKey,
      req.method,
      req.path,
      requestHash,
      201,
      responseBody,
      propertyId
    );

    res.status(201).json(responseBody);
  } catch (error) {
    console.error('Error creating booking hold:', error);

    const statusCode = error.statusCode || (error.code === 'INSUFFICIENT_INVENTORY' ? 409 : 500);
    const responseBody = { success: false, error: error.message || 'Failed to create booking hold' };

    if (statusCode !== 500 && req.headers['idempotency-key']) {
      await persistIdempotency(
        prisma,
        req.headers['idempotency-key'],
        req.method,
        req.path,
        hashRequestBody(req.body),
        statusCode,
        responseBody
      );
    }

    res.status(statusCode).json(responseBody);
  }
});

/**
 * POST /bookings/confirm
 * Confirm hold after payment/webhook.
 */
router.post('/bookings/confirm', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  const requestHash = hashRequestBody(req.body);

  try {
    if (!idempotencyKey) {
      return res.status(400).json({ success: false, error: 'Idempotency-Key header is required' });
    }

    const existingKey = await getExistingIdempotency(prisma, idempotencyKey);
    if (existingKey) {
      if (existingKey.requestHash !== requestHash) {
        return res.status(409).json({ success: false, error: 'Conflicting idempotency key with different payload' });
      }
      if (existingKey.responseBody) {
        return res.status(existingKey.statusCode || 200).json(existingKey.responseBody);
      }
    }

    const { bookingId, holdToken, paymentId, paymentAmount, paymentMeta } = req.body;

    if (!bookingId && !holdToken) {
      return res.status(400).json({ success: false, error: 'Provide bookingId or holdToken' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: bookingId
          ? { id: parseInt(bookingId, 10) }
          : { holdToken },
        include: {
          property: true,
          roomType: true,
        },
    });

    if (!booking) {
        throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
      }

      await tx.$queryRaw`SELECT id FROM "bookings" WHERE "id" = ${booking.id} FOR UPDATE`;

      if (booking.status === 'CONFIRMED') {
        return { booking, payment: null, inventories: [] };
      }

      if (booking.status !== 'HOLD') {
        throw Object.assign(new Error('Booking is not in HOLD status'), { statusCode: 400 });
      }

      if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
        throw Object.assign(new Error('Hold has expired'), { statusCode: 410 });
      }

      const stayNights = getDateRange(booking.checkIn, booking.checkOut);
      const inventories = [];
      for (const date of stayNights) {
        const inventory = await ensureInventoryRow(tx, booking.property, booking.roomType, date);
        const updatedInventory = await updateInventoryWithConfirmation(
          tx,
          inventory,
          booking.rooms,
          booking.id,
          booking.holdToken,
          booking.property
        );
        inventories.push(updatedInventory);
      }

      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
      data: { 
        status: 'CONFIRMED',
          holdExpiresAt: null,
          updatedAt: new Date(),
        },
      });

      await tx.holdLog.updateMany({
        where: { holdToken: booking.holdToken },
        data: { status: 'CONFIRMED', updatedAt: new Date() },
      });

      let paymentRecord = null;
      if (paymentId || paymentAmount) {
        paymentRecord = await tx.payment.create({
          data: {
            bookingId: booking.id,
            razorpayPaymentId: paymentId || null,
            amount: paymentAmount || booking.totalPrice,
            status: 'COMPLETED',
            metadata: paymentMeta || null,
          },
        }).catch(() => null);
      }

      return { booking: updatedBooking, inventories, payment: paymentRecord };
    }, { isolationLevel: 'Serializable' });

    const responseBody = {
      success: true,
      message: 'Booking confirmed successfully',
      booking: result.booking,
      payment: result.payment,
    };

    await persistIdempotency(
      prisma,
      idempotencyKey,
      req.method,
      req.path,
      requestHash,
      200,
      responseBody,
      result.booking.propertyId
    );

    res.status(200).json(responseBody);
  } catch (error) {
    console.error('Error confirming booking:', error);
    const statusCode = error.statusCode || 500;
    const responseBody = { success: false, error: error.message || 'Failed to confirm booking' };

    if (statusCode !== 500 && req.headers['idempotency-key']) {
      await persistIdempotency(
        prisma,
        req.headers['idempotency-key'],
        req.method,
        req.path,
        requestHash,
        statusCode,
        responseBody
      );
    }

    res.status(statusCode).json(responseBody);
  }
});

/**
 * POST /bookings/cancel
 */
router.post('/bookings/cancel', async (req, res) => {
  const { bookingId, reason = 'guest_request' } = req.body;

  if (!bookingId) {
    return res.status(400).json({ success: false, error: 'bookingId is required' });
  }

  try {
    const { booking } = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: parseInt(bookingId, 10) },
      include: {
          property: true,
          roomType: true,
        },
    });

    if (!booking) {
        throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
      }

      await tx.$queryRaw`SELECT id FROM "bookings" WHERE "id" = ${booking.id} FOR UPDATE`;

      if (!BOOKING_STATUSES_REQUIRING_RELEASE.has(booking.status)) {
        return { booking };
      }

      const stayNights = getDateRange(booking.checkIn, booking.checkOut);
      for (const date of stayNights) {
        const inventory = await ensureInventoryRow(tx, booking.property, booking.roomType, date);
        await releaseInventory(
          tx,
          inventory,
          booking.rooms,
          booking.id,
          booking.holdToken,
          booking.status
        );
      }

      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
          externalConfirmation: {
            ...(booking.externalConfirmation || {}),
            cancelReason: reason,
          },
        },
      });

      await tx.holdLog.updateMany({
        where: { holdToken: booking.holdToken },
        data: { status: 'RELEASED', updatedAt: new Date(), metadata: { reason } },
      });

      await tx.inventoryLock.updateMany({
        where: { bookingId: booking.id, type: 'HOLD', releasedAt: null },
        data: { releasedAt: new Date() },
      });

      return { booking: updatedBooking };
    }, { isolationLevel: 'Serializable' });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, error: error.message || 'Failed to cancel booking' });
  }
});

module.exports = router;
