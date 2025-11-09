const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const {
  normalizeDate,
  calculateSellable,
  calculateFreeToSell,
} = require('../lib/inventoryUtils');

const prisma = new PrismaClient();

const DAYS_OF_INVENTORY = parseInt(process.env.SEED_INVENTORY_DAYS || '60', 10);

async function backfillRoomTypes() {
  console.log('🌱 Backfilling room types and inventories...');

  const properties = await prisma.property.findMany({
    include: {
      rooms: true,
      roomTypes: {
        include: {
          ratePlans: true,
        },
      },
    },
  });

  const today = normalizeDate(new Date());

  for (const property of properties) {
    if (!property.rooms || property.rooms.length === 0) {
      console.log(`ℹ️  Property ${property.id} (${property.name}) has no legacy rooms; skipping.`);
      continue;
    }

    console.log(`🏨 Processing property: ${property.name}`);

    const roomTypesByName = new Map();

    property.rooms.forEach((room) => {
      const key = (room.type || 'Default').trim();
      if (!roomTypesByName.has(key)) {
        roomTypesByName.set(key, []);
      }
      roomTypesByName.get(key).push(room);
    });

    for (const [typeName, rooms] of roomTypesByName.entries()) {
      const existing = property.roomTypes.find(
        (rt) => rt.name.toLowerCase() === typeName.toLowerCase()
      );

      const capacity = rooms[0]?.capacity || 1;
      const pricePerNight = rooms[0]?.pricePerNight || 0;
      const description = rooms[0]?.description || null;
      const code =
        rooms[0]?.typeCode ||
        typeName
          .replace(/[^a-zA-Z0-9]+/g, '_')
          .replace(/(^_+|_+$)/g, '')
          .toUpperCase();

      let roomType = existing;

      if (existing) {
        roomType = await prisma.roomType.update({
          where: { id: existing.id },
          data: {
            baseRooms: rooms.length,
            capacity,
            description,
            isActive: true,
          },
        });
        console.log(`  🔁 Updated room type: ${typeName} (${roomType.id})`);
      } else {
        roomType = await prisma.roomType.create({
          data: {
            propertyId: property.id,
            name: typeName,
            code,
            baseRooms: rooms.length,
            capacity,
            description,
            isActive: true,
          },
        });
        console.log(`  ✅ Created room type: ${typeName} (${roomType.id})`);
      }

      await prisma.room.updateMany({
        where: { id: { in: rooms.map((room) => room.id) } },
        data: { roomTypeId: roomType.id },
      });

      const existingRatePlan = await prisma.ratePlan.findFirst({
        where: {
          roomTypeId: roomType.id,
          propertyId: property.id,
        },
      });

      if (!existingRatePlan) {
        await prisma.ratePlan.create({
          data: {
            propertyId: property.id,
            roomTypeId: roomType.id,
            name: 'BAR',
            code: `${code || roomType.id}-BAR`,
            seasonalPrice: pricePerNight,
            refundable: true,
            currency: 'INR',
            minLOS: 1,
            maxLOS: 14,
          },
        });
        console.log(`    💵 Created BAR rate plan for ${typeName}`);
      }

      for (let i = 0; i < DAYS_OF_INVENTORY; i++) {
        const date = new Date(today);
        date.setUTCDate(date.getUTCDate() + i);
        const bufferPercent = property.defaultBuffer || 0;
        const sellable = calculateSellable(roomType.baseRooms, bufferPercent);
        const freeToSell = calculateFreeToSell(sellable, 0, 0);

        await prisma.inventory.upsert({
          where: {
            roomTypeId_date: {
              roomTypeId: roomType.id,
              date,
            },
          },
          update: {
            baseAvailable: roomType.baseRooms,
            bufferPercent,
            sellable,
            freeToSell,
            updatedAt: new Date(),
          },
          create: {
            propertyId: property.id,
            roomTypeId: roomType.id,
            date,
            baseAvailable: roomType.baseRooms,
            bufferPercent,
            sellable,
            booked: 0,
            holds: 0,
            freeToSell,
          },
        });
      }
    }
  }

  console.log('✅ Backfill complete.');
}

backfillRoomTypes()
  .catch((error) => {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
