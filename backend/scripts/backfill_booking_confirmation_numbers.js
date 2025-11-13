const { PrismaClient } = require('@prisma/client');
const { generateConfirmationNumber } = require('../services/bookingService');

const prisma = new PrismaClient();

/**
 * Backfill Confirmation Numbers
 * Generates confirmation numbers for existing bookings that don't have them
 */
async function backfillConfirmationNumbers() {
  console.log('🔄 Backfilling confirmation numbers for existing bookings...');

  try {
    // Get all bookings without confirmation numbers
    const bookings = await prisma.booking.findMany({
      where: {
        confirmationNumber: null
      },
      select: {
        id: true,
        propertyId: true,
        confirmationNumber: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    console.log(`Found ${bookings.length} bookings without confirmation numbers`);

    let successCount = 0;
    let errorCount = 0;

    for (const booking of bookings) {
      try {
        // Generate confirmation number
        const confirmationNumber = generateConfirmationNumber(booking.propertyId, booking.id);

        // Check if confirmation number already exists
        const existing = await prisma.booking.findUnique({
          where: { confirmationNumber },
          select: { id: true }
        });

        if (existing) {
          console.log(`  ⚠️  Confirmation number ${confirmationNumber} already exists for booking ${booking.id}, skipping...`);
          continue;
        }

        // Update booking with confirmation number
        await prisma.booking.update({
          where: { id: booking.id },
          data: { confirmationNumber }
        });

        console.log(`  ✓ Generated confirmation number for booking ${booking.id}: ${confirmationNumber}`);
        successCount++;
      } catch (error) {
        console.error(`  ✗ Error generating confirmation number for booking ${booking.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Backfill complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Total: ${bookings.length}`);
  } catch (error) {
    console.error('Error backfilling confirmation numbers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await backfillConfirmationNumbers();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { backfillConfirmationNumbers };

