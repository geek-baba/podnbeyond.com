const express = require('express');
const { PrismaClient } = require('@prisma/client');
const {
  normalizeDate,
  calculateSellable,
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

const DAYS_OF_INVENTORY = parseInt(process.env.SEED_INVENTORY_DAYS || '60', 10);
const INVENTORY_SUMMARY_WINDOW_DAYS = parseInt(process.env.INVENTORY_SUMMARY_WINDOW_DAYS || '7', 10);

function sanitizeName(name) {
  return (name || '').trim();
}

function buildBaseCode(property, name) {
  const propertySlug = property.slug || property.name || `property_${property.id}`;
  const normalizedName = sanitizeName(name)
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/(^_+|_+$)/g, '')
    .toUpperCase();

  const normalizedProperty = propertySlug
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/(^_+|_+$)/g, '')
    .toUpperCase();

  const combined = `${normalizedProperty}_${normalizedName || 'TYPE'}`;
  return combined.slice(0, 48) || `PROPERTY_${property.id}_${Date.now()}`;
}

async function ensureUniqueCode(tx, baseCode, ignoreId) {
  let candidate = baseCode;
  let attempt = 1;

  while (true) { // eslint-disable-line no-constant-condition
    const existing = await tx.roomType.findUnique({
      where: { code: candidate },
      select: { id: true },
    });

    if (!existing || (ignoreId && existing.id === ignoreId)) {
      return candidate;
    }

    attempt += 1;
    const suffix = `_${attempt}`;
    candidate = `${baseCode.slice(0, Math.max(0, 48 - suffix.length))}${suffix}`;
  }
}

async function seedAndSyncInventory(tx, property, roomType) {
  const today = normalizeDate(new Date());

  for (let i = 0; i < DAYS_OF_INVENTORY; i += 1) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() + i);

    const inventory = await ensureInventoryRow(tx, property, roomType, date);
    const bufferPercent = inventory.bufferPercent ?? property.defaultBuffer ?? 0;
    const sellable = calculateSellable(roomType.baseRooms || 0, bufferPercent);
    const freeToSell = calculateFreeToSell(sellable, inventory.booked || 0, inventory.holds || 0);

    await tx.inventory.update({
      where: { id: inventory.id },
      data: {
        baseAvailable: roomType.baseRooms || 0,
        sellable,
        freeToSell,
        updatedAt: new Date(),
      },
    });
  }
}

async function upsertBarRatePlan(tx, property, roomType, price) {
  const safePrice = Number.isFinite(price) ? Number(price) : 0;
  const existing = await tx.ratePlan.findFirst({
    where: {
      propertyId: property.id,
      roomTypeId: roomType.id,
      name: 'BAR',
    },
  });

  if (existing) {
    return tx.ratePlan.update({
      where: { id: existing.id },
      data: {
        seasonalPrice: safePrice,
        currency: property.currency || existing.currency || 'INR',
      },
    });
  }

  return tx.ratePlan.create({
    data: {
      propertyId: property.id,
      roomTypeId: roomType.id,
      name: 'BAR',
      code: `${roomType.code || roomType.id}-BAR`,
      refundable: true,
      seasonalPrice: safePrice,
      currency: property.currency || 'INR',
      minLOS: 1,
      maxLOS: 14,
    },
  });
}

async function fetchPropertyRoomTypes(tx, propertyId) {
  const property = await tx.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      defaultBuffer: true,
      currency: true,
      checkInCutoffMinutes: true,
      overbookingEnabled: true,
    },
  });

  if (!property) {
    return null;
  }

  const roomTypes = await tx.roomType.findMany({
    where: { propertyId },
    include: {
      ratePlans: {
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' },
    ],
  });

  const today = normalizeDate(new Date());
  const horizon = new Date(today);
  horizon.setUTCDate(horizon.getUTCDate() + INVENTORY_SUMMARY_WINDOW_DAYS);

  const enriched = [];
  for (const roomType of roomTypes) {
    const inventories = await tx.inventory.findMany({
      where: {
        roomTypeId: roomType.id,
        date: {
          gte: today,
          lt: horizon,
        },
      },
      orderBy: { date: 'asc' },
    });

    const totalFreeToSell = inventories.reduce((sum, inv) => sum + (inv.freeToSell || 0), 0);
    const totalBooked = inventories.reduce((sum, inv) => sum + (inv.booked || 0), 0);
    const totalHolds = inventories.reduce((sum, inv) => sum + (inv.holds || 0), 0);
    const todayInventory = inventories.find((inv) => inv.date.getTime() === today.getTime());

    enriched.push({
      id: roomType.id,
      name: roomType.name,
      code: roomType.code,
      baseRooms: roomType.baseRooms,
      capacity: roomType.capacity,
      isActive: roomType.isActive,
      description: roomType.description,
      sortOrder: roomType.sortOrder,
      ratePlan: roomType.ratePlans?.[0]
        ? {
            id: roomType.ratePlans[0].id,
            name: roomType.ratePlans[0].name,
            seasonalPrice: roomType.ratePlans[0].seasonalPrice,
            currency: roomType.ratePlans[0].currency,
          }
        : null,
      inventorySummary: {
        totalFreeToSell,
        totalBooked,
        totalHolds,
        today: todayInventory
          ? {
              date: todayInventory.date,
              sellable: todayInventory.sellable,
              freeToSell: todayInventory.freeToSell,
              booked: todayInventory.booked,
              holds: todayInventory.holds,
            }
          : null,
      },
    });
  }

  return { property, roomTypes: enriched };
}

router.get('/:propertyId/room-types', async (req, res) => {
  const propertyId = parseInt(req.params.propertyId, 10);
  if (Number.isNaN(propertyId)) {
    return res.status(400).json({ success: false, error: 'Invalid property id' });
  }

  try {
    const payload = await fetchPropertyRoomTypes(getPrisma(), propertyId);
    if (!payload) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    return res.json({ success: true, data: payload });
  } catch (error) {
    console.error('Failed to fetch property room types:', error);
    return res.status(500).json({ success: false, error: 'Failed to load property room types' });
  }
});

router.put('/:propertyId/room-types', async (req, res) => {
  const propertyId = parseInt(req.params.propertyId, 10);
  if (Number.isNaN(propertyId)) {
    return res.status(400).json({ success: false, error: 'Invalid property id' });
  }

  const incomingRoomTypes = Array.isArray(req.body.roomTypes) ? req.body.roomTypes : null;
  if (!incomingRoomTypes) {
    return res.status(400).json({ success: false, error: 'roomTypes array is required' });
  }

  try {
    const payload = await getPrisma().$transaction(async (tx) => {
      const property = await tx.property.findUnique({ where: { id: propertyId } });
      if (!property) {
        throw Object.assign(new Error('Property not found'), { statusCode: 404 });
      }

      const existing = await tx.roomType.findMany({
        where: { propertyId },
        include: { ratePlans: true },
      });
      const existingById = new Map(existing.map((rt) => [rt.id, rt]));
      const processedIds = new Set();

      for (const payloadRoomType of incomingRoomTypes) {
        const name = sanitizeName(payloadRoomType.name);
        if (!name) {
          throw Object.assign(new Error('Room type name is required'), { statusCode: 400 });
        }

        const baseRooms = Math.max(0, parseInt(payloadRoomType.baseRooms ?? 0, 10) || 0);
        const capacity = Math.max(1, parseInt(payloadRoomType.capacity ?? 1, 10) || 1);
        const isActive = payloadRoomType.isActive !== false;
        const description = payloadRoomType.description?.trim() || null;
        const sortOrder = Number.isInteger(payloadRoomType.sortOrder)
          ? payloadRoomType.sortOrder
          : existing.length;

        let roomTypeRecord;
        if (payloadRoomType.id) {
          const current = existingById.get(payloadRoomType.id);
          if (!current) {
            throw Object.assign(new Error(`Room type ${payloadRoomType.id} not found`), { statusCode: 404 });
          }

          const updateData = {
            name,
            baseRooms,
            capacity,
            isActive,
            description,
            sortOrder,
          };

          if (payloadRoomType.code && payloadRoomType.code.trim()) {
            const sanitizedCode = payloadRoomType.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
            updateData.code = await ensureUniqueCode(tx, sanitizedCode.slice(0, 48), current.id);
          }

          roomTypeRecord = await tx.roomType.update({
            where: { id: payloadRoomType.id },
            data: updateData,
          });
        } else {
          const baseCode = payloadRoomType.code && payloadRoomType.code.trim()
            ? payloadRoomType.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_').slice(0, 48)
            : buildBaseCode(property, name);
          const uniqueCode = await ensureUniqueCode(tx, baseCode, null);

          roomTypeRecord = await tx.roomType.create({
            data: {
              propertyId,
              name,
              code: uniqueCode,
              baseRooms,
              capacity,
              description,
              isActive,
              sortOrder,
            },
          });
        }

        processedIds.add(roomTypeRecord.id);

        const ratePlanPrice = payloadRoomType.ratePlanPrice ?? payloadRoomType?.ratePlan?.seasonalPrice ?? null;
        if (ratePlanPrice !== null && ratePlanPrice !== '' && Number.isFinite(Number(ratePlanPrice))) {
          await upsertBarRatePlan(tx, property, roomTypeRecord, Number(ratePlanPrice));
        }

        await seedAndSyncInventory(tx, property, roomTypeRecord);
      }

      const toDeactivate = existing.filter((rt) => !processedIds.has(rt.id));
      for (const roomType of toDeactivate) {
        if (roomType.isActive) {
          await tx.roomType.update({
            where: { id: roomType.id },
            data: { isActive: false },
          });
        }
      }

      return fetchPropertyRoomTypes(tx, propertyId);
    });

    if (!payload) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    return res.json({ success: true, data: payload });
  } catch (error) {
    console.error('Failed to upsert room types:', error);
    const status = error.statusCode || (error.code === 'P2002' ? 409 : 500);
    const message =
      error.statusCode === 404
        ? error.message
        : status === 409
        ? 'Room type code must be unique'
        : error.message || 'Failed to save room types';

    return res.status(status).json({ success: false, error: message });
  }
});

module.exports = router;
