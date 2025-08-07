const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Helper function to calculate price using RatePlan if applicable
async function calculatePrice(roomId, checkInDate, checkOutDate, basePrice) {
  try {
    // Check if there's a rate plan for the given dates
    const ratePlan = await prisma.ratePlan.findFirst({
      where: {
        roomId: roomId,
        startDate: { lte: checkInDate },
        endDate: { gte: checkOutDate }
      }
    });

    if (ratePlan) {
      console.log(`Using seasonal rate plan: $${ratePlan.seasonalPrice}/night`);
      return ratePlan.seasonalPrice;
    }

    console.log(`Using base price: $${basePrice}/night`);
    return basePrice;
  } catch (error) {
    console.error('Error calculating price:', error);
    return basePrice; // Fallback to base price
  }
}

// Helper function to check room availability
async function checkRoomAvailability(roomId, checkInDate, checkOutDate) {
  try {
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        roomId: roomId,
        status: {
          notIn: ['CANCELLED', 'COMPLETED'] // Only check active bookings
        },
        OR: [
          // Case 1: New booking starts during an existing booking
          {
            AND: [
              { checkIn: { lte: checkInDate } },
              { checkOut: { gt: checkInDate } }
            ]
          },
          // Case 2: New booking ends during an existing booking
          {
            AND: [
              { checkIn: { lt: checkOutDate } },
              { checkOut: { gte: checkOutDate } }
            ]
          },
          // Case 3: New booking completely contains an existing booking
          {
            AND: [
              { checkIn: { gte: checkInDate } },
              { checkOut: { lte: checkOutDate } }
            ]
          },
          // Case 4: New booking is completely contained within an existing booking
          {
            AND: [
              { checkIn: { lte: checkInDate } },
              { checkOut: { gte: checkOutDate } }
            ]
          }
        ]
      }
    });

    return {
      isAvailable: conflictingBookings.length === 0,
      conflictingBookings: conflictingBookings
    };
  } catch (error) {
    console.error('Error checking room availability:', error);
    throw error;
  }
}

// Helper function to calculate loyalty points (1 point per ₹100 spent)
function calculateLoyaltyPoints(totalPrice) {
  // Convert to rupees if price is in dollars (assuming 1 USD = 75 INR for calculation)
  const priceInRupees = totalPrice * 75; // Adjust conversion rate as needed
  const points = Math.floor(priceInRupees / 100);
  console.log(`Calculating loyalty points: ₹${priceInRupees} spent = ${points} points`);
  return points;
}

// Helper function to determine tier based on total points
function determineTier(totalPoints) {
  if (totalPoints >= 10000) {
    return 'PLATINUM';
  } else if (totalPoints >= 5000) {
    return 'GOLD';
  } else {
    return 'SILVER';
  }
}

// Helper function to update loyalty account with points and tier
async function updateLoyaltyAccount(loyaltyAccountId, pointsToAdd, totalPrice) {
  try {
    // Get current loyalty account
    const currentAccount = await prisma.loyaltyAccount.findUnique({
      where: { id: loyaltyAccountId }
    });

    if (!currentAccount) {
      throw new Error('Loyalty account not found');
    }

    // Calculate new total points
    const newTotalPoints = currentAccount.points + pointsToAdd;
    
    // Determine new tier
    const newTier = determineTier(newTotalPoints);
    
    // Check if tier has changed
    const tierUpgraded = newTier !== currentAccount.tier;

    // Update loyalty account
    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { id: loyaltyAccountId },
      data: {
        points: newTotalPoints,
        tier: newTier,
        lastUpdated: new Date()
      }
    });

    console.log(`Loyalty account updated: ${pointsToAdd} points added`);
    console.log(`Total points: ${currentAccount.points} → ${newTotalPoints}`);
    
    if (tierUpgraded) {
      console.log(`Tier upgraded: ${currentAccount.tier} → ${newTier}`);
    }

    return {
      updatedAccount,
      pointsAdded: pointsToAdd,
      totalPoints: newTotalPoints,
      tierUpgraded,
      newTier,
      previousTier: currentAccount.tier
    };
  } catch (error) {
    console.error('Error updating loyalty account:', error);
    throw error;
  }
}

// Get all available rooms
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        status: 'ACTIVE' // Only show active rooms
      },
      orderBy: { pricePerNight: 'asc' }
    });
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get all rooms (including inactive) for admin
router.get('/rooms/all', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { pricePerNight: 'asc' }
    });
    res.json({ rooms });
  } catch (error) {
    console.error('Error fetching all rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Create a new room
router.post('/rooms', async (req, res) => {
  try {
    const { name, type, capacity, description, pricePerNight, status = 'ACTIVE' } = req.body;

    if (!name || !type || !capacity || !pricePerNight) {
      return res.status(400).json({ error: 'Name, type, capacity, and pricePerNight are required' });
    }

    const room = await prisma.room.create({
      data: {
        name,
        type,
        capacity: parseInt(capacity),
        description: description || null,
        pricePerNight: parseFloat(pricePerNight),
        status
      }
    });

    res.status(201).json({ success: true, room });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Update a room
router.put('/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, capacity, description, pricePerNight, status } = req.body;

    const room = await prisma.room.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(capacity && { capacity: parseInt(capacity) }),
        ...(description !== undefined && { description }),
        ...(pricePerNight && { pricePerNight: parseFloat(pricePerNight) }),
        ...(status && { status })
      }
    });

    res.json({ success: true, room });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete a room (soft delete by setting status to INACTIVE)
router.delete('/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if room has any bookings
    const existingBookings = await prisma.booking.findFirst({
      where: { roomId: parseInt(id) }
    });

    if (existingBookings) {
      return res.status(400).json({ 
        error: 'Cannot delete room with existing bookings. Set status to INACTIVE instead.' 
      });
    }

    // Soft delete by setting status to INACTIVE
    const room = await prisma.room.update({
      where: { id: parseInt(id) },
      data: { status: 'INACTIVE' }
    });

    res.json({ success: true, message: 'Room deactivated successfully', room });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Get room by ID
router.get('/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id: parseInt(id) },
      include: {
        bookings: {
          include: {
            loyaltyAccount: true
          },
          orderBy: { createdAt: 'desc' }
        },
        ratePlans: {
          orderBy: { startDate: 'asc' }
        }
      }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ success: true, room });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Check room availability for specific dates
router.get('/availability', async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'Check-in and check-out dates are required' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }

    // Get all active rooms with their availability status
    const rooms = await prisma.room.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        bookings: {
          where: {
            status: {
              notIn: ['CANCELLED', 'COMPLETED']
            },
            OR: [
              {
                AND: [
                  { checkIn: { lte: checkInDate } },
                  { checkOut: { gt: checkInDate } }
                ]
              },
              {
                AND: [
                  { checkIn: { lt: checkOutDate } },
                  { checkOut: { gte: checkOutDate } }
                ]
              },
              {
                AND: [
                  { checkIn: { gte: checkInDate } },
                  { checkOut: { lte: checkOutDate } }
                ]
              },
              {
                AND: [
                  { checkIn: { lte: checkInDate } },
                  { checkOut: { gte: checkOutDate } }
                ]
              }
            ]
          }
        },
        ratePlans: {
          where: {
            startDate: { lte: checkInDate },
            endDate: { gte: checkOutDate }
          }
        }
      },
      orderBy: { pricePerNight: 'asc' }
    });

    // Add availability status and calculated price to each room
    const roomsWithAvailability = rooms.map(room => {
      const isAvailable = room.bookings.length === 0;
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      const pricePerNight = room.ratePlans.length > 0 ? room.ratePlans[0].seasonalPrice : room.pricePerNight;
      const totalPrice = nights * pricePerNight;

      return {
        ...room,
        isAvailable,
        conflictingBookings: room.bookings,
        calculatedPrice: {
          pricePerNight,
          totalPrice,
          nights,
          hasSeasonalRate: room.ratePlans.length > 0
        }
      };
    });

    res.json(roomsWithAvailability);
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// Create a temporary booking (PENDING status) - will be confirmed after payment
router.post('/book', async (req, res) => {
  try {
    const {
      guestName,
      email,
      phone,
      checkIn,
      checkOut,
      guests,
      roomId, // Changed from roomType to roomId for more precise booking
      specialRequests
    } = req.body;

    // Validate required fields
    if (!guestName || !email || !checkIn || !checkOut || !roomId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the room by ID
    const room = await prisma.room.findUnique({
      where: { id: parseInt(roomId) }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if room is active
    if (room.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Room is not available for booking' });
    }

    // Check if room capacity is sufficient
    if (guests > room.capacity) {
      return res.status(400).json({ 
        error: `This room can only accommodate ${room.capacity} guests` 
      });
    }

    // Convert dates for comparison
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Validate dates
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ 
        error: 'Check-out date must be after check-in date' 
      });
    }

    // Check if room is available for the selected dates
    const availability = await checkRoomAvailability(room.id, checkInDate, checkOutDate);

    if (!availability.isAvailable) {
      const conflictingBooking = availability.conflictingBookings[0];
      return res.status(409).json({ 
        error: `Room is not available for the selected dates. Conflicting booking exists from ${conflictingBooking.checkIn.toISOString().split('T')[0]} to ${conflictingBooking.checkOut.toISOString().split('T')[0]}`,
        conflictingDates: {
          checkIn: conflictingBooking.checkIn.toISOString().split('T')[0],
          checkOut: conflictingBooking.checkOut.toISOString().split('T')[0]
        }
      });
    }

    // Calculate price using RatePlan if applicable
    const pricePerNight = await calculatePrice(room.id, checkInDate, checkOutDate, room.pricePerNight);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * pricePerNight;

    // Create or update loyalty account
    let loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { userId: email } // Using email as userId
    });

    if (!loyaltyAccount) {
      loyaltyAccount = await prisma.loyaltyAccount.create({
        data: {
          userId: email,
          points: 0,
          tier: 'SILVER',
          lastUpdated: new Date()
        }
      });
    } else {
      // Update last activity
      loyaltyAccount = await prisma.loyaltyAccount.update({
        where: { userId: email },
        data: {
          lastUpdated: new Date()
        }
      });
    }

    // Create the booking with PENDING status (will be confirmed after payment)
    const booking = await prisma.booking.create({
      data: {
        guestName,
        email,
        phone: phone || null,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
        totalPrice,
        specialRequests: specialRequests || null,
        roomId: room.id,
        loyaltyAccountId: loyaltyAccount.id,
        status: 'PENDING' // Explicitly set to PENDING
      },
      include: {
        room: true,
        loyaltyAccount: true
      }
    });

    res.status(201).json({
      message: 'Temporary booking created successfully. Payment required to confirm.',
      booking: {
        id: booking.id,
        guestName: booking.guestName,
        email: booking.email,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        totalPrice: booking.totalPrice,
        pricePerNight: pricePerNight,
        nights: nights,
        roomName: booking.room.name,
        roomType: booking.room.type,
        status: booking.status, // Will be PENDING
        loyaltyAccount: {
          userId: booking.loyaltyAccount.userId,
          points: booking.loyaltyAccount.points,
          tier: booking.loyaltyAccount.tier
        }
      },
      paymentRequired: true,
      nextStep: 'Create payment order using /api/payment/create-order with this booking ID'
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Confirm booking after payment success (called by payment webhook)
router.post('/confirm/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentId, paymentAmount } = req.body;

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        room: true,
        loyaltyAccount: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: 'Booking is not in pending status' });
    }

    // Verify payment amount matches booking amount
    if (paymentAmount && paymentAmount !== booking.totalPrice) {
      console.warn(`Payment amount mismatch: Expected ${booking.totalPrice}, got ${paymentAmount}`);
    }

    // Update booking status to CONFIRMED
    const confirmedBooking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: { 
        status: 'CONFIRMED',
        updatedAt: new Date()
      },
      include: {
        room: true,
        loyaltyAccount: true
      }
    });

    // Calculate and add loyalty points after payment confirmation
    const loyaltyPoints = calculateLoyaltyPoints(booking.totalPrice);
    const loyaltyUpdate = await updateLoyaltyAccount(booking.loyaltyAccountId, loyaltyPoints, booking.totalPrice);

    console.log(`Booking ${bookingId} confirmed after payment success`);
    console.log(`Loyalty points added: ${loyaltyPoints} points`);

    res.json({
      message: 'Booking confirmed successfully after payment',
      booking: {
        id: confirmedBooking.id,
        guestName: confirmedBooking.guestName,
        email: confirmedBooking.email,
        checkIn: confirmedBooking.checkIn,
        checkOut: confirmedBooking.checkOut,
        guests: confirmedBooking.guests,
        totalPrice: confirmedBooking.totalPrice,
        roomName: confirmedBooking.room.name,
        roomType: confirmedBooking.room.type,
        status: confirmedBooking.status,
        loyaltyAccount: {
          userId: loyaltyUpdate.updatedAccount.userId,
          points: loyaltyUpdate.updatedAccount.points,
          tier: loyaltyUpdate.updatedAccount.tier,
          pointsAdded: loyaltyUpdate.pointsAdded,
          tierUpgraded: loyaltyUpdate.tierUpgraded,
          newTier: loyaltyUpdate.newTier,
          previousTier: loyaltyUpdate.previousTier
        }
      }
    });

  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({ error: 'Failed to confirm booking' });
  }
});

// Get all bookings
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        room: true,
        loyaltyAccount: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Update booking status
router.patch('/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: { status },
      include: { 
        room: true,
        loyaltyAccount: true
      }
    });

    res.json({
      message: 'Booking status updated successfully',
      booking
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Get booking by ID
router.get('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: {
        room: true,
        loyaltyAccount: true,
        payments: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Search bookings
router.get('/bookings/search', async (req, res) => {
  try {
    const { 
      guestName, 
      email, 
      status, 
      checkInFrom, 
      checkInTo, 
      roomType,
      limit = 50,
      offset = 0
    } = req.query;

    const where = {};

    if (guestName) {
      where.guestName = { contains: guestName, mode: 'insensitive' };
    }

    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    if (checkInFrom || checkInTo) {
      where.checkIn = {};
      if (checkInFrom) where.checkIn.gte = new Date(checkInFrom);
      if (checkInTo) where.checkIn.lte = new Date(checkInTo);
    }

    if (roomType) {
      where.room = {
        type: { contains: roomType, mode: 'insensitive' }
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: true,
        loyaltyAccount: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.booking.count({ where });

    res.json({
      bookings,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error searching bookings:', error);
    res.status(500).json({ error: 'Failed to search bookings' });
  }
});

// Update booking details
router.put('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      guestName, 
      email, 
      phone, 
      checkIn, 
      checkOut, 
      guests, 
      totalPrice, 
      specialRequests 
    } = req.body;

    const booking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: {
        ...(guestName && { guestName }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(checkIn && { checkIn: new Date(checkIn) }),
        ...(checkOut && { checkOut: new Date(checkOut) }),
        ...(guests && { guests: parseInt(guests) }),
        ...(totalPrice && { totalPrice: parseFloat(totalPrice) }),
        ...(specialRequests !== undefined && { specialRequests })
      },
      include: {
        room: true,
        loyaltyAccount: true
      }
    });

    res.json({
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Delete booking (soft delete by setting status to CANCELLED)
router.delete('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: { status: 'CANCELLED' },
      include: {
        room: true,
        loyaltyAccount: true
      }
    });

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

module.exports = router;
