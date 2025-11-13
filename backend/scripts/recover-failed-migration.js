/**
 * Recovery script for failed booking_module_phase1 migration
 * 
 * This script helps recover from a failed migration by:
 * 1. Attempting to mark the migration as rolled back
 * 2. If that fails, providing clear manual recovery instructions
 * 
 * Usage:
 *   export DATABASE_URL="your-database-url"
 *   node scripts/recover-failed-migration.js
 */

const { execSync } = require('child_process');

const MIGRATION_NAME = '20251112220044_booking_module_phase1';

function main() {
  console.log('🚀 Starting migration recovery...');
  console.log(`Migration: ${MIGRATION_NAME}`);
  console.log('');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is required');
    console.error('');
    console.error('Usage:');
    console.error('  export DATABASE_URL="your-database-url"');
    console.error('  node scripts/recover-failed-migration.js');
    process.exit(1);
  }
  
  try {
    // Try to mark migration as rolled back
    console.log('🔄 Attempting to mark migration as rolled back...');
    console.log('');
    
    try {
      execSync(`npx prisma migrate resolve --rolled-back "${MIGRATION_NAME}"`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      console.log('');
      console.log('✅ Migration marked as rolled back successfully!');
      console.log('You can now retry the deployment.');
      process.exit(0);
    } catch (error) {
      console.error('');
      console.error('⚠️  Could not automatically resolve the migration');
      console.error('');
      console.error('The migration may have partially succeeded.');
      console.error('');
      console.error('Manual recovery steps:');
      console.error('');
      console.error('1. Check migration status:');
      console.error('   npx prisma migrate status');
      console.error('');
      console.error('2. If the migration partially succeeded, check database state:');
      console.error('   - Check if BookingSource_new enum exists:');
      console.error('     SELECT * FROM pg_type WHERE typname = \'BookingSource_new\';');
      console.error('   - Check if source column is text type:');
      console.error('     SELECT data_type FROM information_schema.columns WHERE table_name = \'bookings\' AND column_name = \'source\';');
      console.error('');
      console.error('3. Clean up partial migration (if needed):');
      console.error('   - Drop BookingSource_new enum if it exists:');
      console.error('     DROP TYPE IF EXISTS "BookingSource_new" CASCADE;');
      console.error('   - If source column is text, the migration will handle conversion');
      console.error('');
      console.error('4. Mark migration as rolled back:');
      console.error(`   npx prisma migrate resolve --rolled-back "${MIGRATION_NAME}"`);
      console.error('');
      console.error('5. Or if the migration partially succeeded and you want to keep it:');
      console.error(`   npx prisma migrate resolve --applied "${MIGRATION_NAME}"`);
      console.error('   (Then manually fix any remaining issues)');
      console.error('');
      console.error('6. After resolving, retry the deployment');
      console.error('');
      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error('❌ Recovery failed:', error.message);
    console.error('');
    process.exit(1);
  }
}

main();
