/**
 * Recovery script for failed booking_module_phase1 migration
 * 
 * This script helps recover from a failed migration by:
 * 1. Checking database state
 * 2. Cleaning up partial migration changes
 * 3. Marking migration as rolled back
 * 
 * Usage:
 *   node scripts/recover-failed-migration.js
 */

const { execSync } = require('child_process');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function checkDatabaseState() {
  console.log('🔍 Checking database state...');
  
  try {
    // Use Prisma CLI to execute raw SQL (doesn't require Prisma Client)
    const checkEnumQuery = `SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BookingSource_new') as exists;`;
    
    try {
      const { stdout } = await execAsync(
        `npx prisma db execute --stdin <<< "${checkEnumQuery}"`,
        { encoding: 'utf8' }
      );
      
      // Parse output (format: "exists\nt\n" or "exists\nf\n")
      if (stdout.includes('\tt\n') || stdout.includes('t\n')) {
        console.log('⚠️  Found BookingSource_new enum (partial migration detected)');
        return { hasPartialMigration: true, enumName: 'BookingSource_new' };
      }
    } catch (error) {
      // If Prisma CLI fails, assume no partial migration
      console.log('⚠️  Could not check database state, assuming clean state');
      return { hasPartialMigration: false };
    }
    
    console.log('✓ No partial migration detected');
    return { hasPartialMigration: false };
  } catch (error) {
    console.error('❌ Error checking database state:', error.message);
    // Assume no partial migration and try to resolve
    console.log('⚠️  Could not check database state, assuming clean state');
    return { hasPartialMigration: false };
  }
}

async function cleanupPartialMigration() {
  console.log('🧹 Cleaning up partial migration...');
  
  try {
    // Use Prisma CLI to execute raw SQL (doesn't require Prisma Client)
    const dropEnumQuery = `DROP TYPE IF EXISTS "BookingSource_new" CASCADE;`;
    
    try {
      await execAsync(
        `echo "${dropEnumQuery}" | npx prisma db execute --stdin`,
        { encoding: 'utf8' }
      );
      console.log('✓ Dropped BookingSource_new enum (if it existed)');
    } catch (error) {
      // If cleanup fails, log but don't throw - we can still try to resolve
      console.log('⚠️  Could not drop enum (may not exist):', error.message);
    }
    
    console.log('✓ Cleanup complete');
  } catch (error) {
    console.error('❌ Error cleaning up partial migration:', error.message);
    // Don't throw - we can still try to resolve the migration
    console.log('⚠️  Cleanup failed, but will continue with migration resolution');
  }
}

async function markMigrationAsRolledBack() {
  console.log('🔄 Marking migration as rolled back...');
  
  try {
    execSync('npx prisma migrate resolve --rolled-back "20251112220044_booking_module_phase1"', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('✓ Migration marked as rolled back');
  } catch (error) {
    console.error('❌ Error marking migration as rolled back:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting migration recovery...');
  console.log('');
  
  try {
    // Check database state
    const state = await checkDatabaseState();
    console.log('');
    
    // If partial migration detected, clean it up
    if (state.hasPartialMigration) {
      console.log('⚠️  Partial migration detected. Cleaning up...');
      await cleanupPartialMigration();
      console.log('');
    }
    
    // Mark migration as rolled back
    await markMigrationAsRolledBack();
    console.log('');
    
    console.log('✅ Migration recovery complete!');
    console.log('You can now retry the deployment.');
  } catch (error) {
    console.error('');
    console.error('❌ Migration recovery failed:', error.message);
    console.error('');
    console.error('Manual recovery steps:');
    console.error('1. Check database state:');
    console.error('   SELECT * FROM pg_type WHERE typname LIKE \'BookingSource%\';');
    console.error('   SELECT data_type FROM information_schema.columns WHERE table_name = \'bookings\' AND column_name = \'source\';');
    console.error('');
    console.error('2. Clean up partial migration:');
    console.error('   DROP TYPE IF EXISTS "BookingSource_new" CASCADE;');
    console.error('');
    console.error('3. Mark migration as rolled back:');
    console.error('   npx prisma migrate resolve --rolled-back "20251112220044_booking_module_phase1"');
    console.error('');
    process.exit(1);
  }
}

main();

