/**
 * Migration script to migrate third-party integration configs from environment variables to database
 * Run: node scripts/migrate-integrations-from-env.js
 */

const { PrismaClient } = require('@prisma/client');
const { initializeFromEnv } = require('../lib/integrationConfig');
const { encryptConfig } = require('../lib/encryption');

const prisma = new PrismaClient();

const SENSITIVE_FIELDS_BY_PROVIDER = {
  RAZORPAY: ['keySecret'],
  POSTMARK: ['serverToken', 'webhookSecret'],
  GUPSHUP: ['apiKey', 'webhookSecret'],
  EXOTEL: ['apiKey', 'apiToken', 'webhookSecret'],
  GO_MMT: ['apiKey', 'apiSecret'],
  BOOKING_COM: ['apiKey', 'apiSecret'],
  EASEMYTRIP: ['apiKey', 'apiSecret'],
  CLEARTRIP: ['apiKey', 'apiSecret'],
};

async function migrate() {
  console.log('🔄 Starting migration of integrations from environment variables to database...\n');

  try {
    const integrations = await initializeFromEnv();
    
    if (integrations.length === 0) {
      console.log('⚠️  No integrations found in environment variables to migrate.');
      return;
    }

    console.log(`📦 Found ${integrations.length} integration(s) to migrate:\n`);

    for (const integration of integrations) {
      console.log(`  - ${integration.name} (${integration.provider})`);

      // Check if already exists
      const existing = await prisma.thirdPartyIntegration.findUnique({
        where: { provider: integration.provider }
      });

      if (existing) {
        console.log(`    ⚠️  Already exists, skipping...`);
        continue;
      }

      // Encrypt sensitive fields
      const sensitiveFields = SENSITIVE_FIELDS_BY_PROVIDER[integration.provider] || [];
      const encryptedConfig = encryptConfig(integration.config, sensitiveFields);

      // Create integration
      await prisma.thirdPartyIntegration.create({
        data: {
          provider: integration.provider,
          name: integration.name,
          category: integration.category,
          enabled: integration.enabled || false,
          config: encryptedConfig,
          description: integration.description,
          testMode: integration.testMode || false,
          status: integration.enabled ? 'ACTIVE' : 'INACTIVE',
        }
      });

      console.log(`    ✅ Migrated successfully`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Review integrations in the admin UI: /admin/integrations');
    console.log('   2. Test each integration to verify configuration');
    console.log('   3. Once verified, you can remove environment variables (optional)');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrate();

