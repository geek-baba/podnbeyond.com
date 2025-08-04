const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing rooms first
  await prisma.room.deleteMany({});

  // Create initial rooms
  const rooms = [
    {
      type: 'Standard Room',
      price: 120.00,
      capacity: 2,
    },
    {
      type: 'Deluxe Room',
      price: 180.00,
      capacity: 3,
    },
    {
      type: 'Suite',
      price: 280.00,
      capacity: 4,
    },
    {
      type: 'Presidential Suite',
      price: 500.00,
      capacity: 6,
    },
  ];

  const createdRooms = await prisma.room.createMany({
    data: rooms,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${createdRooms.count} rooms`);

  // Display created rooms
  const allRooms = await prisma.room.findMany();
  allRooms.forEach(room => {
    console.log(`  - ${room.type}: $${room.price}/night (${room.capacity} guests)`);
  });

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 