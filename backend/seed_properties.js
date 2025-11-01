const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedProperties() {
  try {
    console.log('🏨 Seeding POD N BEYOND properties and rooms...\n');

    // Clean existing data
    console.log('🗑️  Cleaning existing data...');
    await prisma.booking.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.room.deleteMany({});
    await prisma.property.deleteMany({});
    console.log('✅ Cleaned existing data\n');

    // Create the 3 POD N BEYOND properties
    const properties = [
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
        status: 'ACTIVE'
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
        status: 'ACTIVE'
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
        status: 'ACTIVE'
      }
    ];

    const createdProperties = [];
    
    for (const propertyData of properties) {
      const property = await prisma.property.create({
        data: propertyData
      });
      createdProperties.push(property);
      console.log(`✅ Created: ${property.name} (${property.location}) - Rating: ${property.rating}/5`);
    }

    console.log(`\n📊 Total properties created: ${createdProperties.length}\n`);

    // Create rooms for each property
    console.log('🛏️  Creating rooms for each property...\n');

    // Property 1: Capsule Pod Hotel (Budget-focused, capsule-heavy)
    const property1Rooms = [
      { name: 'Capsule Pod', type: 'Capsule', capacity: 1, pricePerNight: 999, description: 'Compact capsule-style pod with all essentials' },
      { name: 'Single Pod', type: 'Single', capacity: 1, pricePerNight: 1299, description: 'Private single pod with modern amenities' },
      { name: 'Bunk Pod', type: 'Bunk', capacity: 2, pricePerNight: 1599, description: 'Bunk-style pod for friends or family' }
    ];

    for (const roomData of property1Rooms) {
      await prisma.room.create({
        data: { ...roomData, propertyId: createdProperties[0].id, status: 'ACTIVE' }
      });
      console.log(`  ✅ ${createdProperties[0].name}: ${roomData.name} - ₹${roomData.pricePerNight}`);
    }

    // Property 2: Bistupur (Premium, business-focused)
    const property2Rooms = [
      { name: 'Single Pod', type: 'Single', capacity: 1, pricePerNight: 1499, description: 'Premium single pod with business amenities' },
      { name: 'Double Pod', type: 'Double', capacity: 2, pricePerNight: 1999, description: 'Spacious double pod for couples' },
      { name: 'Queen Pod', type: 'Queen', capacity: 2, pricePerNight: 2999, description: 'Luxurious queen pod with premium facilities' },
      { name: 'King Pod', type: 'King', capacity: 2, pricePerNight: 3699, description: 'Our most premium pod with king-size bed' }
    ];

    for (const roomData of property2Rooms) {
      await prisma.room.create({
        data: { ...roomData, propertyId: createdProperties[1].id, status: 'ACTIVE' }
      });
      console.log(`  ✅ ${createdProperties[1].name}: ${roomData.name} - ₹${roomData.pricePerNight}`);
    }

    // Property 3: Sakchi (Flagship - all 10 pod types)
    const property3Rooms = [
      { name: 'Capsule Pod', type: 'Capsule', capacity: 1, pricePerNight: 999, description: 'Compact capsule pod with essentials' },
      { name: 'Single Pod', type: 'Single', capacity: 1, pricePerNight: 1299, description: 'Private single pod' },
      { name: 'Double Pod', type: 'Double', capacity: 2, pricePerNight: 1899, description: 'Comfortable double pod' },
      { name: 'Bunk Pod', type: 'Bunk', capacity: 2, pricePerNight: 1599, description: 'Bunk-style pod with privacy curtains' },
      { name: 'Tri Pod', type: 'Tri', capacity: 3, pricePerNight: 2499, description: 'Three-person pod for small groups' },
      { name: 'Quadra Pod', type: 'Quadra', capacity: 4, pricePerNight: 3299, description: 'Four-person pod for families' },
      { name: 'Queen Pod', type: 'Queen', capacity: 2, pricePerNight: 2799, description: 'Luxurious queen pod' },
      { name: 'King Pod', type: 'King', capacity: 2, pricePerNight: 3499, description: 'Premium king pod with city view' }
    ];

    for (const roomData of property3Rooms) {
      await prisma.room.create({
        data: { ...roomData, propertyId: createdProperties[2].id, status: 'ACTIVE' }
      });
      console.log(`  ✅ ${createdProperties[2].name}: ${roomData.name} - ₹${roomData.pricePerNight}`);
    }

    console.log('\n📈 DATABASE SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const totalProperties = await prisma.property.count();
    const totalRooms = await prisma.room.count();
    
    console.log(`Total Properties: ${totalProperties}`);
    console.log(`Total Rooms: ${totalRooms}`);
    
    for (const prop of createdProperties) {
      const roomCount = await prisma.room.count({ where: { propertyId: prop.id } });
      console.log(`  - ${prop.name}: ${roomCount} rooms`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎉 Multi-property database seeding completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('  - Properties API: GET /api/properties');
    console.log('  - Property rooms: GET /api/properties/:id/rooms');
    console.log('  - Update frontend to show property selector\n');

  } catch (error) {
    console.error('❌ Error seeding properties:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedProperties();

