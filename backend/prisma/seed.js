const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DAYS_OF_INVENTORY = parseInt(process.env.SEED_INVENTORY_DAYS || '60', 10);

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function calculateSellable(baseRooms, bufferPercent) {
  return Math.floor(baseRooms * (1 + bufferPercent / 100));
}

async function resetInventoryDependentTables() {
  await prisma.inventoryLock.deleteMany({});
  await prisma.inventoryAudit.deleteMany({});
  await prisma.holdLog.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.bufferRule.deleteMany({});
  await prisma.ratePlan.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.roomType.deleteMany({});
  await prisma.oTAMapping.deleteMany({});
  await prisma.property.deleteMany({});
}

async function seed() {
  console.log('🌱 Starting multi-property inventory seed...');

  await resetInventoryDependentTables();

  const today = startOfDay(new Date());

  const propertyConfigs = [
    {
      name: 'Pod & Beyond Capsule Hub',
      slug: 'pod-beyond-capsule-hub',
      location: 'Kasidih',
      address: 'Near Jamshedpur Bus Stand',
      city: 'Jamshedpur',
      state: 'Jharkhand',
      phone: '(91) 82350 71333',
      email: 'capsule@podnbeyond.com',
      rating: 4.5,
      totalRatings: 524,
      description: 'Budget-friendly capsule hub with shared amenities and fast check-in.',
      amenities: ['Free WiFi', 'Hot Breakfast', 'Self-Service Laundry', 'Local Calls', '24/7 Check-in'],
      features: ['Capsule Pods', 'Budget Friendly', '3.7 km to Bus Stand'],
      images: ['/uploads/podnbeyond-gallery-1.jpg', '/uploads/podnbeyond-gallery-2.jpg'],
      defaultBuffer: 10,
      timezone: 'Asia/Kolkata',
      roomTypes: [
        {
          name: 'Capsule Pod',
          code: 'CAPSULE',
          baseRooms: 40,
          capacity: 1,
          price: 999,
          description: 'Compact capsule pod with essentials and privacy shade.',
        },
        {
          name: 'Single Pod',
          code: 'SINGLE',
          baseRooms: 20,
          capacity: 1,
          price: 1299,
          description: 'Private single pod with workspace and locker.',
        },
        {
          name: 'Double Pod',
          code: 'DOUBLE',
          baseRooms: 12,
          capacity: 2,
          price: 1899,
          description: 'Double pod for couples with storage and premium bedding.',
        },
      ],
    },
    {
      name: 'Pod & Beyond Smart Hotel Bistupur',
      slug: 'pod-beyond-smart-bistupur',
      location: 'Bistupur',
      address: 'Bistupur Main Road',
      city: 'Jamshedpur',
      state: 'Jharkhand',
      phone: '(91) 82350 72333',
      email: 'bistupur@podnbeyond.com',
      rating: 4.6,
      totalRatings: 836,
      description: 'Premium location with smart pods, business amenities, and concierge.',
      amenities: ['Free WiFi', 'Hot Breakfast', 'Business Center', 'Concierge', 'Airport Shuttle'],
      features: ['Smart Pods', 'Premium Location', 'Meeting Rooms'],
      images: ['/uploads/podnbeyond-gallery-3.jpg', '/uploads/podnbeyond-gallery-4.jpg'],
      defaultBuffer: 15,
      timezone: 'Asia/Kolkata',
      roomTypes: [
        {
          name: 'Queen Pod',
          code: 'QUEEN',
          baseRooms: 18,
          capacity: 2,
          price: 2999,
          description: 'Queen pod with premium finishes and city view.',
        },
        {
          name: 'King Pod',
          code: 'KING',
          baseRooms: 10,
          capacity: 2,
          price: 3699,
          description: 'Flagship king pod with lounge access and priority services.',
        },
        {
          name: 'Business Suite',
          code: 'SUITE',
          baseRooms: 6,
          capacity: 3,
          price: 4299,
          description: 'Spacious suite for business travellers with meeting nook.',
        },
      ],
    },
  ];

  for (const propertyConfig of propertyConfigs) {
    const { roomTypes, defaultBuffer, ...propertyData } = propertyConfig;

    const property = await prisma.property.create({
      data: {
        ...propertyData,
        defaultBuffer,
      },
    });

    console.log(`🏨 Created property: ${property.name} (buffer ${defaultBuffer}%)`);

    await prisma.bufferRule.create({
      data: {
        propertyId: property.id,
        startDate: today,
        endDate: addDays(today, DAYS_OF_INVENTORY),
        percent: defaultBuffer,
        notes: 'Default property buffer',
      },
    });

    for (const roomTypeConfig of roomTypes) {
      const { price, ...roomTypeData } = roomTypeConfig;
      const roomType = await prisma.roomType.create({
        data: {
          ...roomTypeData,
          propertyId: property.id,
          isActive: true,
          sortOrder: 0,
          images: [],
          amenities: [],
          features: [],
        },
      });

      console.log(`  🛏️  Room type ${roomType.name} (${roomType.baseRooms} base rooms)`);

      const ratePlan = await prisma.ratePlan.create({
        data: {
          propertyId: property.id,
          roomTypeId: roomType.id,
          name: 'BAR',
          code: `${roomType.code || roomType.name}-BAR`,
          seasonalPrice: price,
          refundable: true,
          currency: 'INR',
          minLOS: 1,
          maxLOS: 14,
        },
      });

      const inventories = [];
      for (let i = 0; i < DAYS_OF_INVENTORY; i++) {
        const date = addDays(today, i);
        const bufferPercent = defaultBuffer;
        const sellable = calculateSellable(roomType.baseRooms, bufferPercent);
        inventories.push({
          propertyId: property.id,
          roomTypeId: roomType.id,
          date,
          baseAvailable: roomType.baseRooms,
          bufferPercent,
          sellable,
          booked: 0,
          holds: 0,
          freeToSell: sellable,
        });
      }

      await prisma.inventory.createMany({ data: inventories });

      // Sample confirmed booking for each room type
      const checkIn = addDays(today, 3);
      const checkOut = addDays(today, 5);
      const booking = await prisma.booking.create({
        data: {
          guestName: `Sample Guest ${roomType.code}`,
          email: `${roomType.code?.toLowerCase() || 'guest'}@example.com`,
          checkIn,
          checkOut,
          guests: Math.min(roomType.capacity, 2),
          rooms: 1,
          totalPrice: ratePlan.seasonalPrice * 2,
          status: 'CONFIRMED',
          propertyId: property.id,
          roomTypeId: roomType.id,
          ratePlanId: ratePlan.id,
          source: 'DIRECT',
          currency: 'INR',
          netAmount: ratePlan.seasonalPrice * 2,
          taxAmount: 0,
        },
      });

      await prisma.inventory.updateMany({
        where: {
          roomTypeId: roomType.id,
          date: {
            gte: checkIn,
            lt: checkOut,
          },
        },
        data: {
          booked: { increment: 1 },
          freeToSell: { decrement: 1 },
        },
      });

      console.log(`    📅 Seeded BAR rate plan & confirmed booking #${booking.id}`);
    }
  }

  const propertyCount = await prisma.property.count();
  const roomTypeCount = await prisma.roomType.count();
  const inventoryRows = await prisma.inventory.count();
  const bookingCount = await prisma.booking.count();

  console.log('\n📈 Seed summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Properties: ${propertyCount}`);
  console.log(`Room types: ${roomTypeCount}`);
  console.log(`Inventory rows: ${inventoryRows}`);
  console.log(`Bookings: ${bookingCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🎉 Multi-property inventory seed completed!');

  await prisma.$disconnect();
}

module.exports = { seed };

if (require.main === module) {
  seed()
    .catch((error) => {
      console.error('❌ Error during seeding:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}