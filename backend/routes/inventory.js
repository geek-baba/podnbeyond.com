const express = require('express');
const { PrismaClient } = require('@prisma/client');
const {
  getDateRange,
  normalizeDate,
  calculateFreeToSell,
  ensureInventoryRow,
} = require('../lib/inventoryUtils');

const router = express.Router();

// Initialize Prisma client lazily to avoid startup issues
let prisma;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

router.get('/availability', async (req, res) => {
  const { propertyId, roomTypeId, start, end } = req.query;

  if (!propertyId || !start || !end) {
    return res.status(400).json({
      success: false,
      error: 'propertyId, start, and end are required',
    });
  }

  try {
    const property = await getPrisma().property.findUnique({
      where: { id: parseInt(propertyId, 10) },
      include: { roomTypes: { where: { isActive: true } } },
    });

    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid start or end date' });
    }

    const dates = getDateRange(startDate, endDate);
    const roomTypeFilter = roomTypeId
      ? property.roomTypes.filter((rt) => rt.id === parseInt(roomTypeId, 10))
      : property.roomTypes;

    if (!roomTypeFilter.length) {
      return res.status(404).json({ success: false, error: 'No active room types found' });
    }

    const response = [];

    for (const roomType of roomTypeFilter) {
      const inventories = await getPrisma().inventory.findMany({
        where: {
          roomTypeId: roomType.id,
          date: {
            gte: normalizeDate(startDate),
            lt: normalizeDate(endDate),
          },
        },
        orderBy: { date: 'asc' },
      });

      const inventoryByDate = new Map(
        inventories.map((inv) => [normalizeDate(inv.date).toISOString(), inv])
      );

      const availability = [];
      let totalFreeToSell = 0;
      let totalBooked = 0;
      let totalHolds = 0;

      for (const date of dates) {
        const key = normalizeDate(date).toISOString();
        let inventory = inventoryByDate.get(key);

        if (!inventory) {
          inventory = await ensureInventoryRow(getPrisma(), property, roomType, date);
          inventoryByDate.set(key, inventory);
        }

        availability.push({
          date: normalizeDate(date).toISOString(),
          baseAvailable: inventory.baseAvailable,
          bufferPercent: inventory.bufferPercent,
          sellable: inventory.sellable,
          booked: inventory.booked,
          holds: inventory.holds,
          freeToSell: inventory.freeToSell,
        });

        totalFreeToSell += inventory.freeToSell;
        totalBooked += inventory.booked;
        totalHolds += inventory.holds;
      }

      response.push({
        roomTypeId: roomType.id,
        name: roomType.name,
        capacity: roomType.capacity,
        baseRooms: roomType.baseRooms,
        bufferDefault: property.defaultBuffer,
        availability,
        summary: {
          totalFreeToSell,
          totalBooked,
          totalHolds,
        },
      });
    }

    res.json({
      success: true,
      property: {
        id: property.id,
        name: property.name,
      timezone: property.timezone,
      defaultBuffer: property.defaultBuffer,
      },
      range: {
        start: normalizeDate(startDate).toISOString(),
        end: normalizeDate(endDate).toISOString(),
        nights: dates.length,
      },
      roomTypes: response,
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch availability',
    });
  }
});

module.exports = router;

