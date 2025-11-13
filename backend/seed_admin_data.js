const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAdminData() {
  console.log('🎨 Seeding admin test data...\n');

  try {
    // Create sample bookings
    console.log('📅 Creating sample bookings...');
    
    const rooms = await prisma.room.findMany({ take: 5 });
    
    const bookingsData = [
      {
        guestName: 'Rajesh Kumar',
        email: 'rajesh.k@example.com',
        phone: '+91 98765 43210',
        checkIn: new Date('2025-11-05'),
        checkOut: new Date('2025-11-07'),
        guests: 2,
        totalPrice: 3998,
        status: 'CONFIRMED',
        roomId: rooms[0]?.id || 1,
        specialRequests: 'Early check-in if possible'
      },
      {
        guestName: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+91 87654 32109',
        checkIn: new Date('2025-11-10'),
        checkOut: new Date('2025-11-12'),
        guests: 1,
        totalPrice: 1999,
        status: 'PENDING',
        roomId: rooms[1]?.id || 2,
        specialRequests: null
      },
      {
        guestName: 'Amit Patel',
        email: 'amit.p@example.com',
        phone: '+91 76543 21098',
        checkIn: new Date('2025-11-03'),
        checkOut: new Date('2025-11-04'),
        guests: 1,
        totalPrice: 1299,
        status: 'COMPLETED',
        roomId: rooms[2]?.id || 3,
        specialRequests: 'Late checkout requested'
      },
      {
        guestName: 'Sneha Gupta',
        email: 'sneha.gupta@example.com',
        phone: '+91 65432 10987',
        checkIn: new Date('2025-11-15'),
        checkOut: new Date('2025-11-18'),
        guests: 3,
        totalPrice: 8997,
        status: 'CONFIRMED',
        roomId: rooms[3]?.id || 4,
        specialRequests: 'Need 3 adjacent pods'
      },
      {
        guestName: 'Vikram Singh',
        email: 'vikram.s@example.com',
        phone: '+91 54321 09876',
        checkIn: new Date('2025-11-08'),
        checkOut: new Date('2025-11-09'),
        guests: 1,
        totalPrice: 999,
        status: 'CONFIRMED',
        roomId: rooms[0]?.id || 1,
        externalBookingId: 'BKG-MMT-12345',
        externalChannel: 'MakeMyTrip'
      }
    ];

    for (const bookingData of bookingsData) {
      await prisma.booking.create({ data: bookingData });
      console.log(`   ✅ Booking: ${bookingData.guestName} - ${bookingData.status}`);
    }

    // Create sample loyalty accounts
    console.log('\n💎 Creating loyalty accounts...');
    
    const loyaltyData = [
      {
        userId: 'user_rajesh_001',
        points: 3998,
        tier: 'GOLD'
      },
      {
        userId: 'user_priya_002',
        points: 1250,
        tier: 'SILVER'
      },
      {
        userId: 'user_amit_003',
        points: 8500,
        tier: 'PLATINUM'
      }
    ];

    for (const loyaltyAccountData of loyaltyData) {
      await prisma.loyaltyAccount.upsert({
        where: { userId: loyaltyAccountData.userId },
        update: loyaltyAccountData,
        create: loyaltyAccountData
      });
      console.log(`   ✅ Loyalty: ${loyaltyAccountData.userId} - ${loyaltyAccountData.tier} (${loyaltyAccountData.points} pts)`);
    }

    console.log('\n📊 Admin Data Summary:');
    const bookingCount = await prisma.booking.count();
    const loyaltyCount = await prisma.loyaltyAccount.count();
    const propertyCount = await prisma.property.count();
    const roomCount = await prisma.room.count();
    const brandCount = await prisma.brand.count();

    console.log(`   Bookings: ${bookingCount}`);
    console.log(`   Loyalty Accounts: ${loyaltyCount}`);
    console.log(`   Brands: ${brandCount}`);
    console.log(`   Properties: ${propertyCount}`);
    console.log(`   Rooms: ${roomCount}`);

    console.log('\n✨ Admin data seeding completed!\n');

  } catch (error) {
    console.error('❌ Error seeding admin data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAdminData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

