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
  await prisma.loyaltyAccount.deleteMany({});
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
      name: 'Capsule Pod Hotel',
      slug: 'capsule-pod-hotel-kasidih',
      location: 'Kasidih',
      address: 'Near Jamshedpur Bus Stand',
      city: 'Jamshedpur',
      state: 'Jharkhand',
      phone: '(91) 82350 71333',
      email: 'info@podnbeyond.com',
      rating: 4.5,
      totalRatings: 524,
      description: 'Experience India\'s first capsule pod hotel with world-class facilities at affordable rates.',
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
      name: 'Pod n Beyond Smart Hotel @Bistupur',
      slug: 'pod-n-beyond-bistupur',
      location: 'Bistupur',
      address: 'Bistupur Main Road',
      city: 'Jamshedpur',
      state: 'Jharkhand',
      phone: '(91) 82350 72333',
      email: 'bistupur@podnbeyond.com',
      rating: 4.6,
      totalRatings: 836,
      description: 'Premium smart hotel in the heart of Bistupur with modern amenities and excellent connectivity.',
      amenities: ['Free WiFi', 'Hot Breakfast', 'Free Cancellation', 'Self-Service Laundry', 'Local Calls', 'E-Library', 'Business Center'],
      features: ['Smart Pods', 'Premium Location', 'Business Center', 'Magazine Stand', 'Music Corner'],
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
    {
      name: 'Pod n Beyond Smart Hotel @Sakchi',
      slug: 'pod-n-beyond-sakchi',
      location: 'Sakchi',
      address: 'New Kalimati Road, Near Howrah Bridge, Sakchi',
      city: 'Jamshedpur',
      state: 'Jharkhand',
      phone: '(91) 82350 74555',
      email: 'sakchi@podnbeyond.com',
      rating: 4.4,
      totalRatings: 1002,
      description: 'Stay in the heart of Steel City with world-class ambiance. Our flagship property with 10 different pod options.',
      amenities: ['Free WiFi', 'Hot Breakfast', 'Free Cancellation', '20% F&B Discount', 'Self-Service Laundry', 'Local Calls', 'E-Library', 'Game Zones'],
      features: ['10 Pod Types', 'Flagship Property', 'Near Howrah Bridge', 'E-Library', 'Magazine Stand', 'Music Corner', 'Game Zones'],
      images: ['/uploads/podnbeyond-gallery-5.jpg', '/uploads/podnbeyond-gallery-6.jpg', '/uploads/podnbeyond-gallery-7.jpg'],
      defaultBuffer: 20,
      timezone: 'Asia/Kolkata',
      roomTypes: [
        {
          name: 'Capsule Pod',
          code: 'CAPSULE',
          baseRooms: 15,
          capacity: 1,
          price: 999,
          description: 'Compact capsule pod with essentials and privacy shade.',
        },
        {
          name: 'Single Pod',
          code: 'SINGLE',
          baseRooms: 12,
          capacity: 1,
          price: 1299,
          description: 'Private single pod with workspace and locker.',
        },
        {
          name: 'Double Pod',
          code: 'DOUBLE',
          baseRooms: 10,
          capacity: 2,
          price: 1899,
          description: 'Double pod for couples with storage and premium bedding.',
        },
        {
          name: 'Queen Pod',
          code: 'QUEEN',
          baseRooms: 8,
          capacity: 2,
          price: 2999,
          description: 'Queen pod with premium finishes and city view.',
        },
        {
          name: 'King Pod',
          code: 'KING',
          baseRooms: 6,
          capacity: 2,
          price: 3699,
          description: 'Flagship king pod with lounge access and priority services.',
        },
        {
          name: 'Business Suite',
          code: 'SUITE',
          baseRooms: 4,
          capacity: 3,
          price: 4299,
          description: 'Spacious suite for business travellers with meeting nook.',
        },
        {
          name: 'Deluxe Pod',
          code: 'DELUXE',
          baseRooms: 5,
          capacity: 2,
          price: 2499,
          description: 'Deluxe pod with enhanced amenities and comfort.',
        },
        {
          name: 'Executive Pod',
          code: 'EXEC',
          baseRooms: 4,
          capacity: 2,
          price: 3499,
          description: 'Executive pod with premium features and workspace.',
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
      // Make room type code unique by prefixing with property slug
      const uniqueCode = `${propertyData.slug.toUpperCase().replace(/-/g, '_')}_${roomTypeData.code}`;
      const roomType = await prisma.roomType.create({
        data: {
          ...roomTypeData,
          code: uniqueCode,
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

      console.log(`    📅 Seeded BAR rate plan`);
    }
  }

  // Ensure admin user has correct name
  const adminUser = await prisma.user.findUnique({
    where: { email: 'shwet@thedesi.email' },
  });
  if (adminUser) {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { name: 'Shwet Prabhat' },
    });
    console.log('✅ Updated admin user name: Shwet Prabhat');
  }

  // Create 4 loyalty users with real Indian names
  const loyaltyUsers = [
    { name: 'Rahul Khanna', email: 'rahul.khanna@example.com', phone: '+91 98765 43210', tier: 'GOLD', points: 2500, lifetimeStays: 5 },
    { name: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '+91 98765 43211', tier: 'SILVER', points: 1200, lifetimeStays: 3 },
    { name: 'Amit Patel', email: 'amit.patel@example.com', phone: '+91 98765 43212', tier: 'PLATINUM', points: 5000, lifetimeStays: 10 },
    { name: 'Anjali Singh', email: 'anjali.singh@example.com', phone: '+91 98765 43213', tier: 'GOLD', points: 2800, lifetimeStays: 6 },
  ];

  const createdLoyaltyAccounts = [];
  for (let i = 0; i < loyaltyUsers.length; i++) {
    const userData = loyaltyUsers[i];
    const memberNumber = String(i + 1).padStart(6, '0');
    
    // Create user
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { name: userData.name, phone: userData.phone },
      create: {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
      },
    });

    // Create loyalty account
    const loyaltyAccount = await prisma.loyaltyAccount.create({
      data: {
        userId: user.id,
        memberNumber,
        points: userData.points,
        lifetimeStays: userData.lifetimeStays,
        tier: userData.tier,
      },
    });

    createdLoyaltyAccounts.push(loyaltyAccount);
    console.log(`👤 Created loyalty user: ${userData.name} (${memberNumber}) - ${userData.tier}`);
  }

  // Create 8 realistic bookings with Indian names
  // 4 from loyalty users, 4 regular guests
  const allProperties = await prisma.property.findMany({ include: { roomTypes: { include: { ratePlans: true } } } });
  const regularGuests = [
    { name: 'Vikram Mehta', email: 'vikram.mehta@example.com', phone: '+91 98765 43220' },
    { name: 'Sneha Reddy', email: 'sneha.reddy@example.com', phone: '+91 98765 43221' },
    { name: 'Rajesh Kumar', email: 'rajesh.kumar@example.com', phone: '+91 98765 43222' },
    { name: 'Meera Nair', email: 'meera.nair@example.com', phone: '+91 98765 43223' },
  ];

  const bookingConfigs = [
    // Loyalty user bookings (4)
    { guest: loyaltyUsers[0], propertyIndex: 0, roomTypeIndex: 1, checkInOffset: 2, nights: 2, loyaltyAccount: createdLoyaltyAccounts[0] },
    { guest: loyaltyUsers[1], propertyIndex: 1, roomTypeIndex: 0, checkInOffset: 5, nights: 3, loyaltyAccount: createdLoyaltyAccounts[1] },
    { guest: loyaltyUsers[2], propertyIndex: 2, roomTypeIndex: 3, checkInOffset: 7, nights: 2, loyaltyAccount: createdLoyaltyAccounts[2] },
    { guest: loyaltyUsers[3], propertyIndex: 0, roomTypeIndex: 2, checkInOffset: 10, nights: 1, loyaltyAccount: createdLoyaltyAccounts[3] },
    // Regular guest bookings (4)
    { guest: regularGuests[0], propertyIndex: 1, roomTypeIndex: 1, checkInOffset: 3, nights: 2 },
    { guest: regularGuests[1], propertyIndex: 2, roomTypeIndex: 0, checkInOffset: 6, nights: 2 },
    { guest: regularGuests[2], propertyIndex: 0, roomTypeIndex: 0, checkInOffset: 8, nights: 1 },
    { guest: regularGuests[3], propertyIndex: 2, roomTypeIndex: 2, checkInOffset: 12, nights: 3 },
  ];

  for (const bookingConfig of bookingConfigs) {
    const property = allProperties[bookingConfig.propertyIndex];
    const roomType = property.roomTypes[bookingConfig.roomTypeIndex];
    const ratePlan = roomType.ratePlans[0]; // Use first rate plan (BAR)
    
    const checkIn = addDays(today, bookingConfig.checkInOffset);
    const checkOut = addDays(checkIn, bookingConfig.nights);
    const totalPrice = ratePlan.seasonalPrice * bookingConfig.nights;

    // Create user if doesn't exist
    const user = await prisma.user.upsert({
      where: { email: bookingConfig.guest.email },
      update: { name: bookingConfig.guest.name, phone: bookingConfig.guest.phone },
      create: {
        name: bookingConfig.guest.name,
        email: bookingConfig.guest.email,
        phone: bookingConfig.guest.phone,
      },
    });

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        guestName: bookingConfig.guest.name,
        email: bookingConfig.guest.email,
        phone: bookingConfig.guest.phone,
        checkIn,
        checkOut,
        guests: Math.min(roomType.capacity, 2),
        rooms: 1,
        totalPrice,
        status: 'CONFIRMED',
        propertyId: property.id,
        roomTypeId: roomType.id,
        ratePlanId: ratePlan.id,
        source: 'DIRECT',
        currency: 'INR',
        netAmount: totalPrice,
        taxAmount: 0,
        loyaltyAccountId: bookingConfig.loyaltyAccount?.id,
      },
    });

    // Update inventory
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

    const loyaltyNote = bookingConfig.loyaltyAccount ? ` (Loyalty: ${bookingConfig.loyaltyAccount.memberNumber})` : '';
    console.log(`📅 Created booking: ${bookingConfig.guest.name} - ${property.name}${loyaltyNote}`);
  }

  const propertyCount = await prisma.property.count();
  const roomTypeCount = await prisma.roomType.count();
  const inventoryRows = await prisma.inventory.count();
  const bookingCount = await prisma.booking.count();
  const loyaltyAccountCount = await prisma.loyaltyAccount.count();
  const loyaltyBookingsCount = await prisma.booking.count({
    where: { loyaltyAccountId: { not: null } },
  });

  console.log('\n📈 Seed summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Properties: ${propertyCount}`);
  console.log(`Room types: ${roomTypeCount}`);
  console.log(`Inventory rows: ${inventoryRows}`);
  console.log(`Loyalty accounts: ${loyaltyAccountCount}`);
  console.log(`Bookings: ${bookingCount} (${loyaltyBookingsCount} from loyalty members)`);
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