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
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

let prisma;
try {
  prisma = new PrismaClient();
} catch (error) {
  console.error('⚠️  Could not create Prisma Client, using raw SQL instead');
  prisma = null;
}

async function checkDatabaseState() {
  console.log('🔍 Checking database state...');
  
  try {
    if (!prisma) {
      // Use raw SQL via psql if Prisma Client is not available
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is required');
      }
      
      // Extract connection details from DATABASE_URL
      const url = new URL(databaseUrl);
      const dbName = url.pathname.slice(1);
      const dbUser = url.username;
      const dbPassword = url.password;
      const dbHost = url.hostname;
      const dbPort = url.port || '5432';
      
      // Check if BookingSource_new enum exists
      const checkEnumQuery = `SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BookingSource_new') as exists;`;
      const { stdout: enumCheck } = await execAsync(
        `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -t -c "${checkEnumQuery}"`
      );
      
      if (enumCheck.trim() === 't') {
        console.log('⚠️  Found BookingSource_new enum (partial migration detected)');
        return { hasPartialMigration: true, enumName: 'BookingSource_new' };
      }
      
      console.log('✓ No partial migration detected');
      return { hasPartialMigration: false };
    }
    
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
    // If Prisma Client fails, assume no partial migration and try to resolve
    console.log('⚠️  Could not check database state, assuming clean state');
    return { hasPartialMigration: false };
  }
}

async function cleanupPartialMigration() {
  console.log('🧹 Cleaning up partial migration...');
  
  try {
    if (!prisma) {
      // Use raw SQL via psql if Prisma Client is not available
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is required');
      }
      
      // Extract connection details from DATABASE_URL
      const url = new URL(databaseUrl);
      const dbName = url.pathname.slice(1);
      const dbUser = url.username;
      const dbPassword = url.password;
      const dbHost = url.hostname;
      const dbPort = url.port || '5432';
      
      // Drop BookingSource_new enum if it exists
      const dropEnumQuery = `DROP TYPE IF EXISTS "BookingSource_new" CASCADE;`;
      await execAsync(
        `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c "${dropEnumQuery}"`
      );
      console.log('✓ Dropped BookingSource_new enum (if it existed)');
    } else {
      // Drop BookingSource_new enum if it exists
      await prisma.$executeRawUnsafe(`
        DROP TYPE IF EXISTS "BookingSource_new" CASCADE;
      `);
      console.log('✓ Dropped BookingSource_new enum (if it existed)');
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
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

main();

