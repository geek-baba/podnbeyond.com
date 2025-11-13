const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Guest Service
 * Handles guest operations and guest management
 */

/**
 * Create guest record for a booking
 * @param {number} bookingId - Booking ID
 * @param {Object} guestData - Guest data
 * @param {Object} options - Options (isPrimary, etc.)
 * @returns {Promise<Object>} - Created guest record
 */
async function createGuest(bookingId, guestData, options = {}) {
  const { name, email, phone, country, age, loyaltyAccountId } = guestData;
  const { isPrimary = false } = options;

  // Validate required fields
  if (!name) {
    throw new Error('Guest name is required');
  }

  // Check if booking exists
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true }
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  // If this is the primary guest and one already exists, update it
  if (isPrimary) {
    const existingPrimary = await prisma.bookingGuest.findFirst({
      where: {
        bookingId: bookingId,
        isPrimary: true
      }
    });

    if (existingPrimary) {
      // Update existing primary guest
      return await prisma.bookingGuest.update({
        where: { id: existingPrimary.id },
        data: {
          name,
          email,
          phone,
          country,
          age,
          loyaltyAccountId,
          updatedAt: new Date()
        }
      });
    }
  }

  // Create new guest record
  return await prisma.bookingGuest.create({
    data: {
      bookingId: bookingId,
      name,
      email,
      phone,
      country,
      age,
      isPrimary,
      loyaltyAccountId,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
}

/**
 * Create multiple guests for a booking
 * @param {number} bookingId - Booking ID
 * @param {Array<Object>} guestsData - Array of guest data
 * @returns {Promise<Array<Object>>} - Created guest records
 */
async function createGuests(bookingId, guestsData) {
  const guests = [];

  for (let i = 0; i < guestsData.length; i++) {
    const guestData = guestsData[i];
    const isPrimary = i === 0; // First guest is primary

    const guest = await createGuest(bookingId, guestData, { isPrimary });
    guests.push(guest);
  }

  return guests;
}

/**
 * Update guest record
 * @param {number} guestId - Guest ID
 * @param {Object} guestData - Updated guest data
 * @returns {Promise<Object>} - Updated guest record
 */
async function updateGuest(guestId, guestData) {
  const { name, email, phone, country, age, loyaltyAccountId } = guestData;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (country !== undefined) updateData.country = country;
  if (age !== undefined) updateData.age = age;
  if (loyaltyAccountId !== undefined) updateData.loyaltyAccountId = loyaltyAccountId;
  updateData.updatedAt = new Date();

  return await prisma.bookingGuest.update({
    where: { id: guestId },
    data: updateData
  });
}

/**
 * Get guest by ID
 * @param {number} guestId - Guest ID
 * @returns {Promise<Object>} - Guest record
 */
async function getGuest(guestId) {
  return await prisma.bookingGuest.findUnique({
    where: { id: guestId },
    include: {
      booking: {
        include: {
          property: true,
          roomType: true
        }
      },
      loyaltyAccount: {
        include: {
          user: true
        }
      }
    }
  });
}

/**
 * Get guests for a booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise<Array<Object>>} - Guest records
 */
async function getGuestsByBooking(bookingId) {
  return await prisma.bookingGuest.findMany({
    where: { bookingId: bookingId },
    include: {
      loyaltyAccount: {
        include: {
          user: true
        }
      }
    },
    orderBy: [
      { isPrimary: 'desc' },
      { createdAt: 'asc' }
    ]
  });
}

/**
 * Get primary guest for a booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise<Object|null>} - Primary guest record
 */
async function getPrimaryGuest(bookingId) {
  return await prisma.bookingGuest.findFirst({
    where: {
      bookingId: bookingId,
      isPrimary: true
    },
    include: {
      loyaltyAccount: {
        include: {
          user: true
        }
      }
    }
  });
}

/**
 * Delete guest record
 * @param {number} guestId - Guest ID
 * @returns {Promise<Object>} - Deleted guest record
 */
async function deleteGuest(guestId) {
  // Check if this is the primary guest
  const guest = await prisma.bookingGuest.findUnique({
    where: { id: guestId },
    select: { id: true, isPrimary: true, bookingId: true }
  });

  if (!guest) {
    throw new Error(`Guest ${guestId} not found`);
  }

  if (guest.isPrimary) {
    throw new Error('Cannot delete primary guest. Update booking instead.');
  }

  return await prisma.bookingGuest.delete({
    where: { id: guestId }
  });
}

/**
 * Link guest to loyalty account
 * @param {number} guestId - Guest ID
 * @param {number} loyaltyAccountId - Loyalty account ID
 * @returns {Promise<Object>} - Updated guest record
 */
async function linkLoyaltyAccount(guestId, loyaltyAccountId) {
  // Verify loyalty account exists
  const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
    where: { id: loyaltyAccountId },
    select: { id: true }
  });

  if (!loyaltyAccount) {
    throw new Error(`Loyalty account ${loyaltyAccountId} not found`);
  }

  return await prisma.bookingGuest.update({
    where: { id: guestId },
    data: {
      loyaltyAccountId: loyaltyAccountId,
      updatedAt: new Date()
    }
  });
}

/**
 * Find guest by email or phone
 * @param {string} email - Email address
 * @param {string} phone - Phone number
 * @returns {Promise<Array<Object>>} - Guest records
 */
async function findGuestByContact(email = null, phone = null) {
  if (!email && !phone) {
    throw new Error('Email or phone is required');
  }

  const where = {};
  if (email) where.email = email;
  if (phone) where.phone = phone;

  return await prisma.bookingGuest.findMany({
    where: where,
    include: {
      booking: {
        include: {
          property: true,
          roomType: true
        }
      },
      loyaltyAccount: {
        include: {
          user: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

module.exports = {
  createGuest,
  createGuests,
  updateGuest,
  getGuest,
  getGuestsByBooking,
  getPrimaryGuest,
  deleteGuest,
  linkLoyaltyAccount,
  findGuestByContact
};

