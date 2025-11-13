const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBookings() {
  try {
    const total = await prisma.booking.count();
    console.log('Total bookings:', total);
    
    const byStatus = await prisma.booking.groupBy({
      by: ['status'],
      _count: { _all: true }
    });
    
    console.log('\nBy status:');
    byStatus.forEach(s => {
      console.log(`  - ${s.status}: ${s._count._all}`);
    });
    
    const sample = await prisma.booking.findMany({
      take: 5,
      include: {
        property: {
          select: { name: true }
        },
        roomType: {
          select: { name: true }
        }
      }
    });
    
    console.log('\nSample bookings:');
    sample.forEach(b => {
      console.log(`  - ID: ${b.id}, Guest: ${b.guestName}, Property: ${b.property?.name}, Status: ${b.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookings();

