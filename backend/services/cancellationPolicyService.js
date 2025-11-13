const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Cancellation Policy Service
 * Handles cancellation policy operations and fee calculations
 */

/**
 * Calculate cancellation fee based on policy
 * @param {Object} policy - Cancellation policy
 * @param {Object} booking - Booking object
 * @param {Date} cancellationDate - Date of cancellation
 * @returns {Object} - Cancellation fee details
 */
function calculateCancellationFee(policy, booking, cancellationDate = new Date()) {
  if (!policy || !policy.rules) {
    throw new Error('Policy and policy rules are required');
  }

  const { rules } = policy;
  const checkInDate = new Date(booking.checkIn);
  const hoursUntilCheckIn = (checkInDate - cancellationDate) / (1000 * 60 * 60);

  // Check if cancellation is free
  if (hoursUntilCheckIn >= rules.freeUntilHours) {
    return {
      fee: 0,
      percentage: 0,
      amount: 0,
      isFree: true,
      reason: `Cancellation is free as it's more than ${rules.freeUntilHours} hours before check-in`
    };
  }

  // Calculate fee based on policy type
  let fee = 0;
  let percentage = 0;
  let amount = 0;

  switch (rules.type) {
    case 'FREE_CANCELLATION':
      fee = 0;
      percentage = 0;
      amount = 0;
      break;

    case 'FIRST_NIGHT_PENALTY':
      if (rules.firstNightPenalty) {
        // Calculate first night cost
        const nightlyRates = booking.stays?.[0]?.nightlyRates || {};
        const firstNightDate = new Date(checkInDate);
        firstNightDate.setHours(0, 0, 0, 0);
        const firstNightKey = firstNightDate.toISOString().split('T')[0];
        const firstNightRate = nightlyRates[firstNightKey];

        if (firstNightRate) {
          amount = firstNightRate.total || firstNightRate.base || 0;
        } else {
          // Fallback to total price / nights
          const nights = Math.ceil((new Date(booking.checkOut) - checkInDate) / (1000 * 60 * 60 * 24));
          amount = booking.totalPrice / nights;
        }

        percentage = 100;
        fee = amount;
      }
      break;

    case 'PARTIAL_REFUND':
      percentage = rules.percentage || 0;
      amount = (booking.totalPrice * percentage) / 100;
      fee = amount;
      break;

    case 'NON_REFUNDABLE':
      percentage = 100;
      amount = booking.totalPrice;
      fee = amount;
      break;

    case 'FULL_REFUND':
      fee = 0;
      percentage = 0;
      amount = 0;
      break;

    default:
      // Default: percentage-based fee
      percentage = rules.percentage || 100;
      amount = (booking.totalPrice * percentage) / 100;
      fee = amount;
  }

  return {
    fee: fee,
    percentage: percentage,
    amount: amount,
    isFree: fee === 0,
    reason: fee === 0
      ? 'Cancellation is free'
      : `Cancellation fee: ${percentage}% of total booking amount (${hoursUntilCheckIn.toFixed(1)} hours before check-in)`,
    hoursUntilCheckIn: hoursUntilCheckIn,
    refundAmount: booking.totalPrice - fee
  };
}

/**
 * Get cancellation policy for a booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise<Object|null>} - Cancellation policy
 */
async function getPolicyForBooking(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      cancellationPolicy: true,
      property: true,
      ratePlan: true,
      stays: {
        include: {
          roomType: true,
          ratePlan: true
        }
      }
    }
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  // If booking has a specific policy, use it
  if (booking.cancellationPolicy) {
    return booking.cancellationPolicy;
  }

  // Otherwise, get property-specific policy
  if (booking.propertyId) {
    const propertyPolicy = await prisma.cancellationPolicy.findFirst({
      where: {
        propertyId: booking.propertyId,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (propertyPolicy) {
      return propertyPolicy;
    }
  }

  // Finally, get global policy
  const globalPolicy = await prisma.cancellationPolicy.findFirst({
    where: {
      propertyId: null,
      isActive: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return globalPolicy;
}

/**
 * Calculate cancellation fee for a booking
 * @param {number} bookingId - Booking ID
 * @param {Date} cancellationDate - Date of cancellation
 * @returns {Promise<Object>} - Cancellation fee details
 */
async function calculateFeeForBooking(bookingId, cancellationDate = new Date()) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      cancellationPolicy: true,
      property: true,
      ratePlan: true,
      stays: {
        include: {
          roomType: true,
          ratePlan: true
        }
      }
    }
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const policy = await getPolicyForBooking(bookingId);

  if (!policy) {
    // Default: no fee if no policy
    return {
      fee: 0,
      percentage: 0,
      amount: 0,
      isFree: true,
      reason: 'No cancellation policy found. Cancellation is free.',
      policy: null
    };
  }

  const feeDetails = calculateCancellationFee(policy, booking, cancellationDate);

  return {
    ...feeDetails,
    policy: {
      id: policy.id,
      name: policy.name,
      description: policy.description,
      humanReadable: policy.humanReadable
    }
  };
}

/**
 * Get cancellation policy by ID
 * @param {number} policyId - Policy ID
 * @returns {Promise<Object>} - Cancellation policy
 */
async function getPolicy(policyId) {
  return await prisma.cancellationPolicy.findUnique({
    where: { id: policyId },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });
}

/**
 * Get all cancellation policies
 * @param {Object} filters - Filters (propertyId, isActive, etc.)
 * @returns {Promise<Array<Object>>} - Cancellation policies
 */
async function getPolicies(filters = {}) {
  const { propertyId = null, isActive = true } = filters;

  const where = {};
  if (propertyId !== null) {
    where.propertyId = propertyId;
  }
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  return await prisma.cancellationPolicy.findMany({
    where: where,
    include: {
      property: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

/**
 * Create cancellation policy
 * @param {Object} policyData - Policy data
 * @returns {Promise<Object>} - Created policy
 */
async function createPolicy(policyData) {
  const {
    name,
    description,
    rules,
    humanReadable,
    isActive = true,
    propertyId = null
  } = policyData;

  // Validate required fields
  if (!name || !rules) {
    throw new Error('name and rules are required');
  }

  // Validate rules structure
  if (!rules.type) {
    throw new Error('rules.type is required');
  }

  return await prisma.cancellationPolicy.create({
    data: {
      name,
      description,
      rules: rules,
      humanReadable: humanReadable || generateHumanReadable(rules),
      isActive,
      propertyId,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
}

/**
 * Update cancellation policy
 * @param {number} policyId - Policy ID
 * @param {Object} policyData - Updated policy data
 * @returns {Promise<Object>} - Updated policy
 */
async function updatePolicy(policyId, policyData) {
  const {
    name,
    description,
    rules,
    humanReadable,
    isActive,
    propertyId
  } = policyData;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (rules !== undefined) {
    updateData.rules = rules;
    // Regenerate human-readable if rules changed
    if (!humanReadable) {
      updateData.humanReadable = generateHumanReadable(rules);
    }
  }
  if (humanReadable !== undefined) updateData.humanReadable = humanReadable;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (propertyId !== undefined) updateData.propertyId = propertyId;
  updateData.updatedAt = new Date();

  return await prisma.cancellationPolicy.update({
    where: { id: policyId },
    data: updateData
  });
}

/**
 * Delete cancellation policy
 * @param {number} policyId - Policy ID
 * @returns {Promise<Object>} - Deleted policy
 */
async function deletePolicy(policyId) {
  // Check if policy is being used by any bookings
  const bookingsCount = await prisma.booking.count({
    where: {
      cancellationPolicyId: policyId
    }
  });

  if (bookingsCount > 0) {
    throw new Error(`Cannot delete policy: ${bookingsCount} booking(s) are using this policy`);
  }

  return await prisma.cancellationPolicy.delete({
    where: { id: policyId }
  });
}

/**
 * Generate human-readable description from policy rules
 * @param {Object} rules - Policy rules
 * @returns {string} - Human-readable description
 */
function generateHumanReadable(rules) {
  const { type, freeUntilHours, firstNightPenalty, percentage } = rules;

  switch (type) {
    case 'FREE_CANCELLATION':
      return `Free cancellation up to ${freeUntilHours} hours before check-in. No charges applied.`;

    case 'FIRST_NIGHT_PENALTY':
      if (firstNightPenalty) {
        return `Free cancellation up to ${freeUntilHours} hours before check-in. Cancellation within ${freeUntilHours} hours will incur a charge of 100% of the first night.`;
      }
      return `Free cancellation up to ${freeUntilHours} hours before check-in.`;

    case 'PARTIAL_REFUND':
      return `Free cancellation up to ${freeUntilHours} hours before check-in. Cancellation within ${freeUntilHours} hours will incur a charge of ${percentage}% of the total booking amount.`;

    case 'NON_REFUNDABLE':
      return 'This is a non-refundable booking. No cancellation or refund is available.';

    case 'FULL_REFUND':
      return `Full refund available if cancelled ${freeUntilHours} hours or more before check-in. Cancellation within ${freeUntilHours} hours will incur a charge of 100% of the total booking amount.`;

    default:
      return `Cancellation policy: ${percentage}% fee if cancelled within ${freeUntilHours} hours of check-in.`;
  }
}

module.exports = {
  calculateCancellationFee,
  calculateFeeForBooking,
  getPolicyForBooking,
  getPolicy,
  getPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
  generateHumanReadable
};

