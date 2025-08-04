const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Get all available rooms
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { price: 'asc' }
    });
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
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

    // Get all rooms with their availability status
    const rooms = await prisma.room.findMany({
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
        }
      },
      orderBy: { price: 'asc' }
    });

    // Add availability status to each room
    const roomsWithAvailability = rooms.map(room => ({
      ...room,
      isAvailable: room.bookings.length === 0,
      conflictingBookings: room.bookings
    }));

    res.json(roomsWithAvailability);
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// Create a new booking
router.post('/book', async (req, res) => {
  try {
    const {
      guestName,
      email,
      phone,
      checkIn,
      checkOut,
      guests,
      roomType,
      specialRequests
    } = req.body;

    // Validate required fields
    if (!guestName || !email || !checkIn || !checkOut || !roomType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the room by type
    const room = await prisma.room.findFirst({
      where: { type: roomType }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room type not found' });
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

    // Check for double-booking (conflicting bookings)
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        roomId: room.id,
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

    if (conflictingBookings.length > 0) {
      const conflictingBooking = conflictingBookings[0];
      return res.status(409).json({ 
        error: `Room is not available for the selected dates. Conflicting booking exists from ${conflictingBooking.checkIn.toISOString().split('T')[0]} to ${conflictingBooking.checkOut.toISOString().split('T')[0]}`,
        conflictingDates: {
          checkIn: conflictingBooking.checkIn.toISOString().split('T')[0],
          checkOut: conflictingBooking.checkOut.toISOString().split('T')[0]
        }
      });
    }

    // Calculate total price
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * room.price;

    // Create the booking
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
        roomId: room.id
      },
      include: {
        room: true
      }
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        guestName: booking.guestName,
        email: booking.email,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        totalPrice: booking.totalPrice,
        roomType: booking.room.type,
        status: booking.status
      }
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get all bookings
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        room: true
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
      include: { room: true }
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

module.exports = router;
