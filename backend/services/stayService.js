const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Stay Service
 * Handles stay operations and stay management
 */

/**
 * Calculate nightly rates for a stay
 * @param {Object} stayData - Stay data (checkInDate, checkOutDate, ratePlan, etc.)
 * @param {Object} options - Options (taxConfig, etc.)
 * @returns {Promise<Object>} - Nightly rates breakdown
 */
function calculateNightlyRates(stayData, options = {}) {
  const { checkInDate, checkOutDate, ratePlan, baseRate } = stayData;
  const { taxConfig = null } = options;

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const nightlyRates = {};

  // Calculate number of nights
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

  // Get base rate from rate plan or provided base rate
  const rate = ratePlan?.seasonalPrice || baseRate || 0;

  // Calculate tax percentage (default 18% GST in India)
  const taxPercentage = taxConfig?.percentage || 18;

  // Calculate rates for each night
  for (let i = 0; i < nights; i++) {
    const date = new Date(checkIn);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format

    const base = rate;
    const tax = (base * taxPercentage) / 100;
    const total = base + tax;

    nightlyRates[dateKey] = {
      base: base,
      tax: tax,
      total: total,
      currency: ratePlan?.currency || 'INR',
      taxPercentage: taxPercentage
    };
  }

  return nightlyRates;
}

/**
 * Create stay record for a booking
 * @param {number} bookingId - Booking ID
 * @param {Object} stayData - Stay data
 * @returns {Promise<Object>} - Created stay record
 */
async function createStay(bookingId, stayData) {
  const {
    roomTypeId,
    roomId = null,
    checkInDate,
    checkOutDate,
    numGuests = 1,
    ratePlanId = null,
    nightlyRates = null,
    status = 'PENDING'
  } = stayData;

  // Validate required fields
  if (!roomTypeId || !checkInDate || !checkOutDate) {
    throw new Error('roomTypeId, checkInDate, and checkOutDate are required');
  }

  // Check if booking exists
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      roomType: true,
      ratePlan: true
    }
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  // Get rate plan if not provided
  const ratePlan = ratePlanId
    ? await prisma.ratePlan.findUnique({
        where: { id: ratePlanId },
        include: { roomType: true }
      })
    : booking.ratePlan;

  // Calculate nightly rates if not provided
  const calculatedNightlyRates = nightlyRates || calculateNightlyRates(
    {
      checkInDate,
      checkOutDate,
      ratePlan: ratePlan || booking.ratePlan,
      baseRate: ratePlan?.seasonalPrice || booking.totalPrice
    },
    {
      taxConfig: ratePlan?.taxConfig || null
    }
  );

  // Create stay record
  return await prisma.stay.create({
    data: {
      bookingId: bookingId,
      roomTypeId: roomTypeId,
      roomId: roomId,
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      numGuests: numGuests,
      ratePlanId: ratePlanId || ratePlan?.id || null,
      nightlyRates: calculatedNightlyRates,
      status: status,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    include: {
      roomType: true,
      room: true,
      ratePlan: true
    }
  });
}

/**
 * Create multiple stays for a booking (multi-room booking)
 * @param {number} bookingId - Booking ID
 * @param {Array<Object>} staysData - Array of stay data
 * @returns {Promise<Array<Object>>} - Created stay records
 */
async function createStays(bookingId, staysData) {
  const stays = [];

  for (const stayData of staysData) {
    const stay = await createStay(bookingId, stayData);
    stays.push(stay);
  }

  return stays;
}

/**
 * Update stay record
 * @param {number} stayId - Stay ID
 * @param {Object} stayData - Updated stay data
 * @returns {Promise<Object>} - Updated stay record
 */
async function updateStay(stayId, stayData) {
  const {
    roomTypeId,
    roomId,
    checkInDate,
    checkOutDate,
    numGuests,
    ratePlanId,
    nightlyRates,
    status
  } = stayData;

  const updateData = {};
  if (roomTypeId !== undefined) updateData.roomTypeId = roomTypeId;
  if (roomId !== undefined) updateData.roomId = roomId;
  if (checkInDate !== undefined) updateData.checkInDate = new Date(checkInDate);
  if (checkOutDate !== undefined) updateData.checkOutDate = new Date(checkOutDate);
  if (numGuests !== undefined) updateData.numGuests = numGuests;
  if (ratePlanId !== undefined) updateData.ratePlanId = ratePlanId;
  if (nightlyRates !== undefined) updateData.nightlyRates = nightlyRates;
  if (status !== undefined) updateData.status = status;
  updateData.updatedAt = new Date();

  // Recalculate nightly rates if dates or rate plan changed
  if (checkInDate || checkOutDate || ratePlanId) {
    const stay = await prisma.stay.findUnique({
      where: { id: stayId },
      include: {
        ratePlan: true,
        booking: true
      }
    });

    if (stay) {
      const newCheckIn = checkInDate ? new Date(checkInDate) : stay.checkInDate;
      const newCheckOut = checkOutDate ? new Date(checkOutDate) : stay.checkOutDate;
      const newRatePlan = ratePlanId
        ? await prisma.ratePlan.findUnique({ where: { id: ratePlanId } })
        : stay.ratePlan;

      updateData.nightlyRates = calculateNightlyRates(
        {
          checkInDate: newCheckIn,
          checkOutDate: newCheckOut,
          ratePlan: newRatePlan,
          baseRate: newRatePlan?.seasonalPrice || stay.booking.totalPrice
        },
        {
          taxConfig: newRatePlan?.taxConfig || null
        }
      );
    }
  }

  return await prisma.stay.update({
    where: { id: stayId },
    data: updateData,
    include: {
      roomType: true,
      room: true,
      ratePlan: true
    }
  });
}

/**
 * Get stay by ID
 * @param {number} stayId - Stay ID
 * @returns {Promise<Object>} - Stay record
 */
async function getStay(stayId) {
  return await prisma.stay.findUnique({
    where: { id: stayId },
    include: {
      booking: {
        include: {
          property: true,
          roomType: true
        }
      },
      roomType: true,
      room: true,
      ratePlan: true,
      roomAssignments: {
        include: {
          room: true,
          assignedByUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  });
}

/**
 * Get stays for a booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise<Array<Object>>} - Stay records
 */
async function getStaysByBooking(bookingId) {
  return await prisma.stay.findMany({
    where: { bookingId: bookingId },
    include: {
      roomType: true,
      room: true,
      ratePlan: true,
      roomAssignments: {
        include: {
          room: true,
          assignedByUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: {
      checkInDate: 'asc'
    }
  });
}

/**
 * Assign room to stay
 * @param {number} stayId - Stay ID
 * @param {number} roomId - Room ID
 * @param {Object} context - Context (assignedBy, etc.)
 * @returns {Promise<Object>} - Updated stay record
 */
async function assignRoom(stayId, roomId, context = {}) {
  const { assignedBy } = context;

  // Verify room exists
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, roomTypeId: true }
  });

  if (!room) {
    throw new Error(`Room ${roomId} not found`);
  }

  // Get stay
  const stay = await prisma.stay.findUnique({
    where: { id: stayId },
    select: { id: true, roomTypeId: true, bookingId: true }
  });

  if (!stay) {
    throw new Error(`Stay ${stayId} not found`);
  }

  // Verify room type matches
  if (room.roomTypeId && room.roomTypeId !== stay.roomTypeId) {
    throw new Error('Room type does not match stay room type');
  }

  // Update stay with room assignment
  const updatedStay = await prisma.stay.update({
    where: { id: stayId },
    data: {
      roomId: roomId,
      updatedAt: new Date()
    }
  });

  // Create room assignment record
  await prisma.roomAssignment.create({
    data: {
      bookingId: stay.bookingId,
      stayId: stayId,
      roomId: roomId,
      assignedBy: assignedBy || null,
      assignedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  return updatedStay;
}

/**
 * Update stay status
 * @param {number} stayId - Stay ID
 * @param {string} status - New status
 * @returns {Promise<Object>} - Updated stay record
 */
async function updateStayStatus(stayId, status) {
  return await prisma.stay.update({
    where: { id: stayId },
    data: {
      status: status,
      updatedAt: new Date()
    }
  });
}

module.exports = {
  calculateNightlyRates,
  createStay,
  createStays,
  updateStay,
  getStay,
  getStaysByBooking,
  assignRoom,
  updateStayStatus
};

