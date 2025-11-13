const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');

const prisma = new PrismaClient();

/**
 * Booking Service
 * Handles booking operations, state transitions, and business logic
 */

/**
 * Valid state transitions
 */
const VALID_TRANSITIONS = {
  HOLD: ['CONFIRMED', 'CANCELLED', 'REJECTED', 'FAILED'],
  PENDING: ['CONFIRMED', 'CANCELLED', 'REJECTED', 'FAILED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW', 'REJECTED'],
  CHECKED_IN: ['CHECKED_OUT'],
  CHECKED_OUT: ['COMPLETED'],
  // Terminal states have no transitions
  CANCELLED: [],
  NO_SHOW: [],
  REJECTED: [],
  COMPLETED: [],
  FAILED: [],
};

/**
 * Check if a state transition is valid
 * @param {string} fromState - Current booking status
 * @param {string} toState - Target booking status
 * @returns {boolean} - True if transition is valid
 */
function canTransition(fromState, toState) {
  return VALID_TRANSITIONS[fromState]?.includes(toState) || false;
}

/**
 * Generate a unique confirmation number
 * Format: PNB-{propertyId}-{bookingId}-{random}
 * @param {number} propertyId - Property ID
 * @param {number} bookingId - Booking ID
 * @returns {string} - Confirmation number
 */
function generateConfirmationNumber(propertyId, bookingId) {
  const random = randomBytes(4).toString('hex').toUpperCase();
  return `PNB-${propertyId}-${bookingId}-${random}`;
}

/**
 * Generate confirmation number for a booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise<string>} - Confirmation number
 */
async function generateConfirmationNumberForBooking(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, propertyId: true, confirmationNumber: true }
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  if (booking.confirmationNumber) {
    return booking.confirmationNumber;
  }

  let confirmationNumber;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    confirmationNumber = generateConfirmationNumber(booking.propertyId, booking.id);
    const existing = await prisma.booking.findUnique({
      where: { confirmationNumber },
      select: { id: true }
    });

    if (!existing) {
      break;
    }

    attempts++;
    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique confirmation number');
    }
  } while (true);

  // Update booking with confirmation number
  await prisma.booking.update({
    where: { id: bookingId },
    data: { confirmationNumber }
  });

  return confirmationNumber;
}

/**
 * Calculate commission amount for OTA bookings
 * @param {number} totalAmount - Total booking amount
 * @param {number} commissionPct - Commission percentage
 * @returns {number} - Commission amount
 */
function calculateCommission(totalAmount, commissionPct) {
  if (!commissionPct || commissionPct <= 0) {
    return 0;
  }
  return (totalAmount * commissionPct) / 100;
}

/**
 * Validate state transition
 * @param {Object} booking - Booking object
 * @param {string} toState - Target state
 * @param {Object} context - Context (user, reason, etc.)
 * @returns {Promise<boolean>} - True if transition is valid
 */
async function validateTransition(booking, toState, context = {}) {
  // Check if transition is valid
  if (!canTransition(booking.status, toState)) {
    throw new Error(
      `Invalid state transition: ${booking.status} → ${toState}. ` +
      `Valid transitions from ${booking.status}: ${VALID_TRANSITIONS[booking.status]?.join(', ') || 'none'}`
    );
  }

  // Additional business rule validations
  if (toState === 'CONFIRMED' && booking.status === 'HOLD') {
    // Check if hold has expired
    if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
      throw new Error('Hold has expired. Cannot confirm booking.');
    }
  }

  if (toState === 'CHECKED_IN') {
    // Check if check-in date has arrived
    const checkInDate = new Date(booking.checkIn);
    const now = new Date();
    if (checkInDate > now) {
      // Allow early check-in with warning (can be overridden)
      console.warn(`Early check-in: Check-in date is ${checkInDate}, current time is ${now}`);
    }
  }

  if (toState === 'CHECKED_OUT') {
    // Check if check-out date has arrived
    const checkOutDate = new Date(booking.checkOut);
    const now = new Date();
    if (checkOutDate > now) {
      // Allow early check-out with warning (can be overridden)
      console.warn(`Early check-out: Check-out date is ${checkOutDate}, current time is ${now}`);
    }
  }

  return true;
}

/**
 * Execute state transition
 * @param {number} bookingId - Booking ID
 * @param {string} toState - Target state
 * @param {Object} context - Context (user, reason, meta, etc.)
 * @returns {Promise<Object>} - Updated booking
 */
async function transitionState(bookingId, toState, context = {}) {
  const { user, reason, meta = {} } = context;

  // Get booking with lock
  const booking = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.findUnique({
      where: { id: bookingId }
    });

    if (!b) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    // Lock the booking row
    await tx.$executeRaw`SELECT id FROM "bookings" WHERE "id" = ${bookingId} FOR UPDATE`;

    return b;
  });

  // Validate transition
  await validateTransition(booking, toState, context);

  // Execute transition
  const updatedBooking = await prisma.$transaction(async (tx) => {
    const updateData = {
      status: toState,
      updatedAt: new Date()
    };

    // Generate confirmation number if transitioning to CONFIRMED
    if (toState === 'CONFIRMED' && !booking.confirmationNumber) {
      updateData.confirmationNumber = generateConfirmationNumber(booking.propertyId, booking.id);
    }

    // Clear hold token if transitioning from HOLD
    if (booking.status === 'HOLD' && toState === 'CONFIRMED') {
      updateData.holdExpiresAt = null;
    }

    // Update booking
    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: updateData
    });

    // Create audit log entry
    await tx.bookingAuditLog.create({
      data: {
        bookingId: bookingId,
        performedBy: user?.id || 'system',
        action: `TRANSITION_${toState}`,
        meta: {
          fromState: booking.status,
          toState: toState,
          reason: reason || null,
          ...meta
        },
        timestamp: new Date()
      }
    });

    return updated;
  });

  return updatedBooking;
}

/**
 * Create audit log entry
 * @param {number} bookingId - Booking ID
 * @param {string} action - Action performed
 * @param {Object} context - Context (user, meta, etc.)
 * @returns {Promise<Object>} - Created audit log entry
 */
async function createAuditLog(bookingId, action, context = {}) {
  const { user, meta = {} } = context;

  return await prisma.bookingAuditLog.create({
    data: {
      bookingId: bookingId,
      performedBy: user?.id || 'system',
      action: action,
      meta: meta,
      timestamp: new Date()
    }
  });
}

/**
 * Get booking with all related data
 * @param {number} bookingId - Booking ID
 * @returns {Promise<Object>} - Booking with related data
 */
async function getBookingWithDetails(bookingId) {
  return await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      property: true,
      roomType: true,
      ratePlan: true,
      cancellationPolicy: true,
      payments: {
        orderBy: { createdAt: 'desc' }
      },
      loyaltyAccount: {
        include: {
          user: true
        }
      },
      stays: {
        include: {
          roomType: true,
          room: true,
          ratePlan: true,
          roomAssignments: {
            include: {
              room: true,
              assignedByUser: true
            }
          }
        }
      },
      bookingGuests: {
        include: {
          loyaltyAccount: true
        },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }]
      },
      bookingAuditLogs: {
        include: {
          performedByUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      },
      roomAssignments: {
        include: {
          room: true,
          stay: true,
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
 * Update booking commission
 * @param {number} bookingId - Booking ID
 * @param {number} commissionPct - Commission percentage
 * @returns {Promise<Object>} - Updated booking
 */
async function updateCommission(bookingId, commissionPct) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, totalPrice: true }
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const commissionAmount = calculateCommission(booking.totalPrice, commissionPct);

  return await prisma.booking.update({
    where: { id: bookingId },
    data: {
      sourceCommissionPct: commissionPct,
      commissionAmount: commissionAmount
    }
  });
}

/**
 * Update booking notes
 * @param {number} bookingId - Booking ID
 * @param {Object} notes - Notes object { internal, guest }
 * @param {Object} context - Context (user, etc.)
 * @returns {Promise<Object>} - Updated booking
 */
async function updateNotes(bookingId, notes, context = {}) {
  const { user } = context;
  const updateData = {};

  if (notes.internal !== undefined) {
    updateData.notesInternal = notes.internal;
  }

  if (notes.guest !== undefined) {
    updateData.notesGuest = notes.guest;
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: updateData
  });

  // Create audit log
  await createAuditLog(bookingId, 'UPDATE_NOTES', {
    user,
    meta: {
      notesUpdated: Object.keys(notes),
      ...notes
    }
  });

  return updated;
}

module.exports = {
  canTransition,
  validateTransition,
  transitionState,
  generateConfirmationNumber,
  generateConfirmationNumberForBooking,
  calculateCommission,
  updateCommission,
  updateNotes,
  createAuditLog,
  getBookingWithDetails,
  VALID_TRANSITIONS
};

