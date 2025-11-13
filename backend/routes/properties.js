const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Get all properties
router.get('/', async (req, res) => {
  try {
    const { status, city, location } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (location) where.location = { contains: location, mode: 'insensitive' };

    const properties = await prisma.property.findMany({
      where,
      include: {
        _count: {
          select: { rooms: true }
        }
      },
      orderBy: { rating: 'desc' }
    });

    res.json({
      success: true,
      count: properties.length,
      properties
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Get property by ID or slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const isNumeric = /^\d+$/.test(identifier);

    const property = await prisma.property.findUnique({
      where: isNumeric ? { id: parseInt(identifier) } : { slug: identifier },
      include: {
        rooms: {
          where: { status: 'ACTIVE' },
          orderBy: { pricePerNight: 'asc' }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json({
      success: true,
      property
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// Get rooms for a specific property
router.get('/:id/rooms', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const where = { propertyId: parseInt(id) };
    if (status) where.status = status;

    const rooms = await prisma.room.findMany({
      where,
      orderBy: { pricePerNight: 'asc' }
    });

    res.json({
      success: true,
      count: rooms.length,
      rooms
    });
  } catch (error) {
    console.error('Error fetching property rooms:', error);
    res.status(500).json({ error: 'Failed to fetch property rooms' });
  }
});

// Check availability for property rooms
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'Check-in and check-out dates are required' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }

    // Get all active rooms for this property
    const rooms = await prisma.room.findMany({
      where: {
        propertyId: parseInt(id),
        status: 'ACTIVE'
      },
      include: {
        bookings: {
          where: {
            status: { notIn: ['CANCELLED', 'COMPLETED'] },
            OR: [
              { AND: [{ checkIn: { lte: checkInDate } }, { checkOut: { gt: checkInDate } }] },
              { AND: [{ checkIn: { lt: checkOutDate } }, { checkOut: { gte: checkOutDate } }] },
              { AND: [{ checkIn: { gte: checkInDate } }, { checkOut: { lte: checkOutDate } }] },
              { AND: [{ checkIn: { lte: checkInDate } }, { checkOut: { gte: checkOutDate } }] }
            ]
          }
        }
      },
      orderBy: { pricePerNight: 'asc' }
    });

    // Calculate availability and pricing
    const roomsWithAvailability = rooms.map(room => {
      const isAvailable = room.bookings.length === 0;
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      const totalPrice = nights * room.pricePerNight;

      return {
        ...room,
        isAvailable,
        calculatedPrice: {
          pricePerNight: room.pricePerNight,
          totalPrice,
          nights
        }
      };
    });

    res.json({
      success: true,
      propertyId: parseInt(id),
      checkIn,
      checkOut,
      rooms: roomsWithAvailability.filter(r => r.isAvailable)
    });
  } catch (error) {
    console.error('Error checking property availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// Create new property (admin only)
router.post('/', async (req, res) => {
  try {
    const property = await prisma.property.create({
      data: req.body
    });

    res.status(201).json({
      success: true,
      property
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// Update property (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const property = await prisma.property.update({
      where: { id: parseInt(id) },
      data: req.body
    });

    res.json({
      success: true,
      property
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

module.exports = router;

