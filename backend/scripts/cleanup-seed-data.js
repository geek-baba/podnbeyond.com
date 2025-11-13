#!/usr/bin/env node

/**
 * Cleanup Seed Data Script
 * 
 * This script safely removes seed/test data from production database:
 * - Bookings with test emails (@example.com) or test identifiers
 * - Loyalty accounts for test users
 * - Test users (only if they have no real bookings)
 * 
 * Usage:
 *   node scripts/cleanup-seed-data.js [--dry-run] [--confirm]
 * 
 * Options:
 *   --dry-run    Preview what will be deleted without actually deleting
 *   --confirm    Skip confirmation prompt (use with caution!)
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

// Test email patterns
const TEST_EMAIL_PATTERNS = [
  /@example\.com$/i,
  /@test\./i,
  /tester@/i,
  /seed@/i,
  /fake@/i,
  /dummy@/i,
];

// Test guest name patterns
const TEST_NAME_PATTERNS = [
  /tester/i,
  /seed/i,
  /test/i,
  /fake/i,
  /dummy/i,
  /demo/i,
];

// Test identifiers
const TEST_IDENTIFIERS = {
  holdToken: 'SEED-HOLD-TOKEN',
};

/**
 * Check if an email is a test email
 */
function isTestEmail(email) {
  if (!email) return false;
  return TEST_EMAIL_PATTERNS.some(pattern => pattern.test(email));
}

/**
 * Check if a name is a test name
 */
function isTestName(name) {
  if (!name) return false;
  return TEST_NAME_PATTERNS.some(pattern => pattern.test(name));
}

/**
 * Check if a booking is test data
 */
function isTestBooking(booking) {
  return (
    isTestEmail(booking.email) ||
    isTestName(booking.guestName) ||
    booking.holdToken === TEST_IDENTIFIERS.holdToken
  );
}

/**
 * Preview what will be deleted (dry run)
 */
async function previewCleanup() {
  const db = getPrisma();
  
  console.log('🔍 DRY RUN MODE - Previewing what will be deleted...\n');

  // Find test bookings
  const allBookings = await db.booking.findMany({
    include: {
      property: { select: { name: true } },
      roomType: { select: { name: true } },
    },
  });

  const testBookings = allBookings.filter(isTestBooking);
  
  console.log(`📋 Found ${testBookings.length} test bookings to delete:`);
  testBookings.forEach(booking => {
    console.log(`   - Booking #${booking.id}: ${booking.guestName} (${booking.email}) - ${booking.status}`);
  });

  // Find test loyalty accounts
  const allLoyaltyAccounts = await db.loyaltyAccount.findMany({
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  const testLoyaltyAccounts = allLoyaltyAccounts.filter(account => 
    isTestEmail(account.user?.email)
  );

  console.log(`\n💎 Found ${testLoyaltyAccounts.length} test loyalty accounts to delete:`);
  testLoyaltyAccounts.forEach(account => {
    console.log(`   - Member #${account.memberNumber}: ${account.user?.name} (${account.user?.email}) - ${account.tier} (${account.points} pts)`);
  });

  // Find test users (only those with no real bookings)
  const testUserIds = new Set([
    ...testBookings.map(b => b.email),
    ...testLoyaltyAccounts.map(a => a.userId),
  ]);

  const testUsers = await db.user.findMany({
    where: {
      OR: [
        { email: { in: Array.from(testUserIds) } },
        { email: { contains: '@example.com' } },
      ],
    },
    include: {
      _count: {
        select: {
          emailThreads: true,
          assignedThreads: true,
          conversationNotes: true,
        },
      },
    },
  });

  // Filter to only users with no real bookings
  const usersToDelete = [];
  for (const user of testUsers) {
    const realBookings = await db.booking.count({
      where: {
        email: user.email,
        NOT: {
          OR: [
            { email: { contains: '@example.com' } },
            { guestName: { contains: 'test' } },
            { guestName: { contains: 'seed' } },
          ],
        },
      },
    });

    if (realBookings === 0 && isTestEmail(user.email)) {
      usersToDelete.push(user);
    }
  }

  console.log(`\n👤 Found ${usersToDelete.length} test users to delete (no real bookings):`);
  usersToDelete.forEach(user => {
    console.log(`   - ${user.name || 'N/A'} (${user.email})`);
  });

  console.log('\n📊 Summary:');
  console.log(`   - Test bookings: ${testBookings.length}`);
  console.log(`   - Test loyalty accounts: ${testLoyaltyAccounts.length}`);
  console.log(`   - Test users: ${usersToDelete.length}`);

  return {
    bookings: testBookings,
    loyaltyAccounts: testLoyaltyAccounts,
    users: usersToDelete,
  };
}

/**
 * Perform the actual cleanup
 */
async function performCleanup() {
  const db = getPrisma();
  
  console.log('🧹 Starting cleanup of seed data...\n');

  try {
    // Step 1: Delete test bookings and related data
    console.log('1️⃣  Deleting test bookings...');
    
    const allBookings = await db.booking.findMany();
    const testBookings = allBookings.filter(isTestBooking);
    const testBookingIds = testBookings.map(b => b.id);

    if (testBookingIds.length > 0) {
      // Delete hold logs for test bookings
      await db.holdLog.deleteMany({
        where: { bookingId: { in: testBookingIds } },
      });
      console.log(`   ✓ Deleted hold logs for ${testBookingIds.length} bookings`);

      // Delete bookings
      const deleteResult = await db.booking.deleteMany({
        where: { id: { in: testBookingIds } },
      });
      console.log(`   ✓ Deleted ${deleteResult.count} test bookings`);
    } else {
      console.log('   ✓ No test bookings found');
    }

    // Step 2: Delete test loyalty accounts
    console.log('\n2️⃣  Deleting test loyalty accounts...');
    
    const allLoyaltyAccounts = await db.loyaltyAccount.findMany({
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    const testLoyaltyAccounts = allLoyaltyAccounts.filter(account => 
      isTestEmail(account.user?.email)
    );

    if (testLoyaltyAccounts.length > 0) {
      const testLoyaltyIds = testLoyaltyAccounts.map(a => a.id);
      
      // Delete points ledger entries
      await db.pointsLedger.deleteMany({
        where: { loyaltyAccountId: { in: testLoyaltyIds } },
      });
      console.log(`   ✓ Deleted points ledger entries`);

      // Delete loyalty accounts (cascade will handle user deletion if no other relations)
      const deleteResult = await db.loyaltyAccount.deleteMany({
        where: { id: { in: testLoyaltyIds } },
      });
      console.log(`   ✓ Deleted ${deleteResult.count} test loyalty accounts`);
    } else {
      console.log('   ✓ No test loyalty accounts found');
    }

    // Step 3: Delete test users (only those with no real bookings)
    console.log('\n3️⃣  Deleting test users...');
    
    const testUsers = await db.user.findMany({
      where: {
        email: { contains: '@example.com' },
      },
      include: {
        _count: {
          select: {
            emailThreads: true,
            assignedThreads: true,
            conversationNotes: true,
          },
        },
      },
    });

    let deletedUsers = 0;
    for (const user of testUsers) {
      // Check if user has any real bookings
      const realBookings = await db.booking.count({
        where: {
          email: user.email,
          NOT: {
            OR: [
              { email: { contains: '@example.com' } },
              { guestName: { contains: 'test' } },
              { guestName: { contains: 'seed' } },
            ],
          },
        },
      });

      // Only delete if no real bookings and no important relations
      if (realBookings === 0 && 
          user._count.emailThreads === 0 && 
          user._count.assignedThreads === 0 &&
          user._count.conversationNotes === 0) {
        await db.user.delete({
          where: { id: user.id },
        });
        deletedUsers++;
      }
    }

    console.log(`   ✓ Deleted ${deletedUsers} test users`);

    console.log('\n✅ Cleanup completed successfully!');
    
    // Show final counts
    const finalBookingCount = await db.booking.count();
    const finalLoyaltyCount = await db.loyaltyAccount.count();
    const finalUserCount = await db.user.count();
    
    console.log('\n📊 Final counts:');
    console.log(`   - Bookings: ${finalBookingCount}`);
    console.log(`   - Loyalty accounts: ${finalLoyaltyCount}`);
    console.log(`   - Users: ${finalUserCount}`);

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const skipConfirm = args.includes('--confirm');

  console.log('🧹 Seed Data Cleanup Script\n');
  console.log('This script will remove:');
  console.log('  - Bookings with test emails (@example.com) or test identifiers');
  console.log('  - Loyalty accounts for test users');
  console.log('  - Test users (only if they have no real bookings)\n');

  if (isDryRun) {
    await previewCleanup();
    console.log('\n💡 Run without --dry-run to perform the actual cleanup');
    process.exit(0);
  }

  // Preview first
  const preview = await previewCleanup();

  if (preview.bookings.length === 0 && 
      preview.loyaltyAccounts.length === 0 && 
      preview.users.length === 0) {
    console.log('\n✅ No seed data found to clean up!');
    process.exit(0);
  }

  // Confirmation prompt
  if (!skipConfirm) {
    console.log('\n⚠️  WARNING: This will permanently delete the data listed above!');
    console.log('⚠️  Make sure you have a database backup before proceeding.\n');
    
    // In a real script, you'd use readline for confirmation
    // For now, we'll require --confirm flag for safety
    console.log('❌ Safety check: Use --confirm flag to proceed with deletion');
    console.log('   Example: node scripts/cleanup-seed-data.js --confirm');
    process.exit(1);
  }

  // Perform cleanup
  await performCleanup();

  // Disconnect
  await getPrisma().$disconnect();
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

