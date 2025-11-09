const { PrismaClient } = require('@prisma/client');
const { seed } = require('./prisma/seed');

async function seedRoomsAndBookings() {
  await seed();

  const prisma = new PrismaClient();

  try {
    console.log('\n🛏️  Enriching dataset with hold and cancelled bookings...\n');

    const roomTypes = await prisma.roomType.findMany({
      include: { property: true, ratePlans: true },
      orderBy: { id: 'asc' },
    });

    if (!roomTypes.length) {
      console.warn('⚠️  No room types found after primary seed; skipping additional bookings.');
      return;
    }

    const targetRoomType = roomTypes[0];
    const ratePlan = targetRoomType.ratePlans[0];
    const basePrice = ratePlan?.seasonalPrice || 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const holdCheckIn = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000);
    const holdCheckOut = new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000);

    const holdBooking = await prisma.booking.create({
      data: {
        guestName: 'Hold Reservation Tester',
        email: 'hold.tester@example.com',
        checkIn: holdCheckIn,
        checkOut: holdCheckOut,
        guests: 1,
        rooms: 1,
        totalPrice: basePrice * 2,
        status: 'HOLD',
        holdToken: 'SEED-HOLD-TOKEN',
        holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        propertyId: targetRoomType.propertyId,
        roomTypeId: targetRoomType.id,
        ratePlanId: ratePlan?.id ?? null,
        source: 'DIRECT',
        currency: 'INR',
      },
    });

    await prisma.inventory.updateMany({
      where: {
        roomTypeId: targetRoomType.id,
        date: {
          gte: holdBooking.checkIn,
          lt: holdBooking.checkOut,
        },
      },
      data: {
        holds: { increment: 1 },
        freeToSell: { decrement: 1 },
      },
    });

    await prisma.holdLog.create({
      data: {
        bookingId: holdBooking.id,
        holdToken: holdBooking.holdToken,
        roomTypeId: targetRoomType.id,
        propertyId: targetRoomType.propertyId,
        checkIn: holdBooking.checkIn,
        checkOut: holdBooking.checkOut,
        rooms: holdBooking.rooms,
        guests: holdBooking.guests,
        status: 'ACTIVE',
        expiresAt: holdBooking.holdExpiresAt,
      },
    });

    const cancelledBooking = await prisma.booking.create({
      data: {
        guestName: 'Cancelled Seed Booking',
        email: 'cancelled.tester@example.com',
        checkIn: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
        checkOut: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
        guests: 2,
        rooms: 1,
        totalPrice: basePrice * 2,
        status: 'CANCELLED',
        propertyId: targetRoomType.propertyId,
        roomTypeId: targetRoomType.id,
        ratePlanId: ratePlan?.id ?? null,
        source: 'DIRECT',
        currency: 'INR',
      },
    });

    console.log(`✅ Created HOLD booking #${holdBooking.id} and CANCELLED booking #${cancelledBooking.id}`);

    const summary = await prisma.booking.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    console.log('\n📊 Booking breakdown after enrichment:');
    summary.forEach((row) => {
      console.log(`  - ${row.status}: ${row._count._all}`);
    });
  } catch (error) {
    console.error('❌ Error seeding additional bookings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedRoomsAndBookings()
  .catch((error) => {
    console.error('❌ An unexpected error occurred:', error);
    process.exit(1);
  });
