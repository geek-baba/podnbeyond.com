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

    // Calculate total price
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
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
