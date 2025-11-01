const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedRoomsAndBookings() {
  try {
    console.log('🏨 Seeding POD N BEYOND rooms and bookings...\n');

    // Delete existing data
    console.log('🗑️  Cleaning existing data...');
    await prisma.booking.deleteMany({});
    await prisma.room.deleteMany({});
    console.log('✅ Cleaned existing data\n');

    // Create the 8 pod types
    const podTypes = [
      {
        name: 'Capsule Pod',
        description: 'Compact and efficient capsule-style pod perfect for solo travelers. Features include reading light, power outlet, and secure locker. Complimentary Wi-Fi, Hot Breakfast, Self-Service Laundry.',
        type: 'Capsule',
        capacity: 1,
        pricePerNight: 999,
        status: 'ACTIVE'
      },
      {
        name: 'Single Pod',
        description: 'Private single pod with comfortable bed and modern amenities. Perfect for budget-conscious travelers. Includes Wi-Fi, TV, Work Desk, Private Bathroom, Hot Breakfast.',
        type: 'Single',
        capacity: 1,
        pricePerNight: 1299,
        status: 'ACTIVE'
      },
      {
        name: 'Double Pod',
        description: 'Spacious double pod with queen-size bed for couples or friends traveling together. Features Wi-Fi, TV, Work Desk, Private Bathroom, Hot Breakfast, Mini Fridge.',
        type: 'Double',
        capacity: 2,
        pricePerNight: 1899,
        status: 'ACTIVE'
      },
      {
        name: 'Bunk Pod',
        description: 'Unique bunk-style pod perfect for friends or family. Features two comfortable bunks with privacy curtains. Includes Wi-Fi, Reading Lights, Shared Bathroom, Lockers.',
        type: 'Bunk',
        capacity: 2,
        pricePerNight: 1599,
        status: 'ACTIVE'
      },
      {
        name: 'Tri Pod',
        description: 'Three-person pod ideal for small groups or families. Comfortable and affordable with Wi-Fi, TV, Private Bathroom, Hot Breakfast, Seating Area.',
        type: 'Tri',
        capacity: 3,
        pricePerNight: 2499,
        status: 'ACTIVE'
      },
      {
        name: 'Quadra Pod',
        description: 'Spacious four-person pod perfect for families. Features separate sleeping areas and ample space. Includes Wi-Fi, TV, Work Desk, Private Bathroom, Hot Breakfast, Mini Fridge.',
        type: 'Quadra',
        capacity: 4,
        pricePerNight: 3299,
        status: 'ACTIVE'
      },
      {
        name: 'Queen Pod',
        description: 'Luxurious queen pod with premium amenities and extra space. Perfect for a comfortable stay. Features Wi-Fi, Smart TV, Work Desk, Premium Bathroom, Hot Breakfast, Mini Fridge, Coffee Maker.',
        type: 'Queen',
        capacity: 2,
        pricePerNight: 2799,
        status: 'ACTIVE'
      },
      {
        name: 'King Pod',
        description: 'Our most spacious and luxurious pod with king-size bed and premium facilities. Ultimate comfort with Wi-Fi, Smart TV, Work Station, Premium Bathroom, Hot Breakfast, Mini Fridge, Coffee Maker, City View.',
        type: 'King',
        capacity: 2,
        pricePerNight: 3499,
        status: 'ACTIVE'
      }
    ];

    const createdRooms = [];
    
    for (const podType of podTypes) {
      const room = await prisma.room.create({
        data: podType
      });
      createdRooms.push(room);
      console.log(`✅ Created: ${room.name} - ₹${room.pricePerNight}/night (Capacity: ${room.capacity})`);
    }

    console.log(`\n📊 Total rooms created: ${createdRooms.length}\n`);

    // Create sample bookings for testing
    console.log('📝 Creating sample bookings for testing...\n');

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const sampleBookings = [
      {
        roomId: createdRooms[0].id, // Capsule Pod
        guestName: 'Rajesh Kumar',
        email: 'rajesh.kumar@example.com',
        phone: '+91 98765 43210',
        checkIn: today,
        checkOut: tomorrow,
        guests: 1,
        status: 'CONFIRMED',
        totalPrice: 999,
        specialRequests: 'Early check-in if possible'
      },
      {
        roomId: createdRooms[2].id, // Double Pod
        guestName: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+91 99876 54321',
        checkIn: tomorrow,
        checkOut: new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000),
        guests: 2,
        status: 'CONFIRMED',
        totalPrice: 3798,
        specialRequests: 'Honeymoon package'
      },
      {
        roomId: createdRooms[5].id, // Quadra Pod
        guestName: 'Amit Patel',
        email: 'amit.patel@example.com',
        phone: '+91 97654 32109',
        checkIn: nextWeek,
        checkOut: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
        guests: 4,
        status: 'PENDING',
        totalPrice: 9897,
        specialRequests: 'Family with 2 kids, need extra pillows'
      },
      {
        roomId: createdRooms[7].id, // King Pod
        guestName: 'Sneha Reddy',
        email: 'sneha.reddy@example.com',
        phone: '+91 96543 21098',
        checkIn: nextMonth,
        checkOut: new Date(nextMonth.getTime() + 1 * 24 * 60 * 60 * 1000),
        guests: 2,
        status: 'CONFIRMED',
        totalPrice: 3499,
        specialRequests: 'Anniversary celebration'
      },
      {
        roomId: createdRooms[1].id, // Single Pod
        guestName: 'Vikram Singh',
        email: 'vikram.singh@example.com',
        phone: '+91 95432 10987',
        checkIn: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        checkOut: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        guests: 1,
        status: 'COMPLETED',
        totalPrice: 1299,
        specialRequests: null
      }
    ];

    for (const bookingData of sampleBookings) {
      const booking = await prisma.booking.create({
        data: bookingData
      });
      console.log(`✅ Booking: ${booking.guestName} - ${booking.status} (₹${booking.totalAmount})`);
    }

    console.log(`\n📊 Total bookings created: ${sampleBookings.length}\n`);

    // Summary
    console.log('📈 DATABASE SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const totalRooms = await prisma.room.count();
    const totalBookings = await prisma.booking.count();
    const confirmedBookings = await prisma.booking.count({ where: { status: 'CONFIRMED' } });
    const pendingBookings = await prisma.booking.count({ where: { status: 'PENDING' } });
    
    console.log(`Total Pod Types: ${totalRooms}`);
    console.log(`Total Bookings: ${totalBookings}`);
    console.log(`  - Confirmed: ${confirmedBookings}`);
    console.log(`  - Pending: ${pendingBookings}`);
    console.log(`  - Completed: ${await prisma.booking.count({ where: { status: 'COMPLETED' } })}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n💡 You can now:');
    console.log('  - Test booking workflow on http://localhost:3000');
    console.log('  - View admin dashboard at http://localhost:3000/admin');
    console.log('  - See bookings and manage rooms\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedRoomsAndBookings();

