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

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function checkDatabaseState() {
  console.log('🔍 Checking database state...');
  
  try {
    // Check if BookingSource_new enum exists
    const enumExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 
        FROM pg_type 
        WHERE typname = 'BookingSource_new'
      ) as exists
    `;
    
    if (enumExists[0].exists) {
      console.log('⚠️  Found BookingSource_new enum (partial migration detected)');
      return { hasPartialMigration: true, enumName: 'BookingSource_new' };
    }
    
    // Check if source column is text type (partial migration)
    const columnType = await prisma.$queryRaw`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_name = 'source'
    `;
    
    if (columnType.length > 0 && columnType[0].data_type === 'text') {
      console.log('⚠️  Found source column as text type (partial migration detected)');
      return { hasPartialMigration: true, columnType: 'text' };
    }
    
    console.log('✓ No partial migration detected');
    return { hasPartialMigration: false };
  } catch (error) {
    console.error('❌ Error checking database state:', error.message);
    throw error;
  }
}

async function cleanupPartialMigration() {
  console.log('🧹 Cleaning up partial migration...');
  
  try {
    // Drop BookingSource_new enum if it exists
    await prisma.$executeRawUnsafe(`
      DROP TYPE IF EXISTS "BookingSource_new" CASCADE;
    `);
    console.log('✓ Dropped BookingSource_new enum (if it existed)');
    
    // If source column is text, convert it back to the original BookingSource enum
    // But first check if the original enum still exists
    const originalEnumExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 
        FROM pg_type 
        WHERE typname = 'BookingSource'
      ) as exists
    `;
    
    if (originalEnumExists[0].exists) {
      // Check current column type
      const columnType = await prisma.$queryRaw`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'source'
      `;
      
      if (columnType.length > 0 && columnType[0].data_type === 'text') {
        console.log('⚠️  Source column is text type, attempting to restore...');
        // Try to restore to original enum type
        // This is tricky - we need to know what the original values were
        // For now, we'll leave it as text and let the migration handle it
        console.log('⚠️  Leaving source column as text - migration will handle conversion');
      }
    }
    
    console.log('✓ Cleanup complete');
  } catch (error) {
    console.error('❌ Error cleaning up partial migration:', error.message);
    throw error;
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
  } finally {
    await prisma.$disconnect();
  }
}

main();

