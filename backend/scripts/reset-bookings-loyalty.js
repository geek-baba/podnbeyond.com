#!/usr/bin/env node

/**
 * Reset Bookings and Loyalty Data
 * 
 * This script deletes ALL bookings and loyalty accounts from the database.
 * Use this to clean up production before going live.
 * 
 * Usage:
 *   node scripts/reset-bookings-loyalty.js [--confirm]
 * 
 * Options:
 *   --confirm    Required to actually delete data
 */

const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client lazily
let prisma;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

async function resetData() {
  const db = getPrisma();
  
  console.log('🧹 Resetting bookings and loyalty data...\n');

  try {
    // Get counts before deletion
    const bookingCount = await db.booking.count();
    const loyaltyCount = await db.loyaltyAccount.count();
    const pointsLedgerCount = await db.pointsLedger.count();
    const holdLogCount = await db.holdLog.count();

    console.log('📊 Current data:');
    console.log(`   - Bookings: ${bookingCount}`);
    console.log(`   - Loyalty accounts: ${loyaltyCount}`);
    console.log(`   - Points ledger entries: ${pointsLedgerCount}`);
    console.log(`   - Hold logs: ${holdLogCount}\n`);

    // Delete in correct order (respecting foreign keys)
    console.log('🗑️  Deleting data...');

    // 1. Delete hold logs (references bookings)
    const deletedHoldLogs = await db.holdLog.deleteMany({});
    console.log(`   ✓ Deleted ${deletedHoldLogs.count} hold logs`);

    // 2. Delete points ledger (references loyalty accounts)
    const deletedPointsLedger = await db.pointsLedger.deleteMany({});
    console.log(`   ✓ Deleted ${deletedPointsLedger.count} points ledger entries`);

    // 3. Delete bookings
    const deletedBookings = await db.booking.deleteMany({});
    console.log(`   ✓ Deleted ${deletedBookings.count} bookings`);

    // 4. Delete loyalty accounts
    const deletedLoyalty = await db.loyaltyAccount.deleteMany({});
    console.log(`   ✓ Deleted ${deletedLoyalty.count} loyalty accounts`);

    console.log('\n✅ Reset completed successfully!');
    
    // Verify
    const finalBookingCount = await db.booking.count();
    const finalLoyaltyCount = await db.loyaltyAccount.count();
    
    console.log('\n📊 Final counts:');
    console.log(`   - Bookings: ${finalBookingCount}`);
    console.log(`   - Loyalty accounts: ${finalLoyaltyCount}`);

  } catch (error) {
    console.error('\n❌ Error during reset:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const hasConfirm = args.includes('--confirm');

  console.log('🧹 Reset Bookings and Loyalty Data\n');
  console.log('⚠️  WARNING: This will delete ALL bookings and loyalty accounts!');
  console.log('⚠️  This action cannot be undone.\n');

  if (!hasConfirm) {
    console.log('❌ Safety check: Use --confirm flag to proceed');
    console.log('   Example: node scripts/reset-bookings-loyalty.js --confirm');
    process.exit(1);
  }

  await resetData();
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

