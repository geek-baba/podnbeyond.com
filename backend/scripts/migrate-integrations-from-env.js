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

  // Debug: Show what env vars are available
  console.log('📋 Checking environment variables...\n');
  const envChecks = {
    'RAZORPAY_KEY_ID': !!process.env.RAZORPAY_KEY_ID,
    'RAZORPAY_KEY_SECRET': !!process.env.RAZORPAY_KEY_SECRET,
    'POSTMARK_SERVER_TOKEN': !!process.env.POSTMARK_SERVER_TOKEN,
    'GUPSHUP_API_KEY': !!process.env.GUPSHUP_API_KEY,
    'GUPSHUP_ENABLED': process.env.GUPSHUP_ENABLED,
    'EXOTEL_SID': !!process.env.EXOTEL_SID,
    'EXOTEL_ENABLED': process.env.EXOTEL_ENABLED,
  };
  Object.entries(envChecks).forEach(([key, value]) => {
    console.log(`  ${key}: ${value ? '✅ Set' : '❌ Not set'}`);
  });
  console.log('');

  try {
    // Also check directly for Gupshup and Exotel (in case enabled flag logic prevents them)
    const integrations = await initializeFromEnv();
    
    // Manually check for Gupshup if not in list (check directly, don't rely on enabled flag)
    if (process.env.GUPSHUP_API_KEY) {
      const gupshupExists = integrations.find(i => i.provider === 'GUPSHUP');
      if (!gupshupExists) {
        console.log('  ℹ️  Found GUPSHUP_API_KEY, adding Gupshup integration...');
        integrations.push({
          provider: 'GUPSHUP',
          name: 'Gupshup WhatsApp/SMS',
          category: 'MESSAGING',
          enabled: process.env.GUPSHUP_ENABLED === 'true',
          config: {
            apiKey: process.env.GUPSHUP_API_KEY,
            appId: process.env.GUPSHUP_APP_ID || '',
            appName: process.env.GUPSHUP_APP_NAME || '',
            source: process.env.GUPSHUP_SOURCE || '',
            webhookSecret: process.env.GUPSHUP_WEBHOOK_SECRET || '',
            webhookUrl: process.env.GUPSHUP_WEBHOOK_URL || ''
          }
        });
      }
    } else {
      console.log('  ⚠️  GUPSHUP_API_KEY not found in environment variables');
    }

    // Manually check for Exotel if not in list (check directly, don't rely on enabled flag)
    if (process.env.EXOTEL_SID) {
      const exotelExists = integrations.find(i => i.provider === 'EXOTEL');
      if (!exotelExists) {
        console.log('  ℹ️  Found EXOTEL_SID, adding Exotel integration...');
        integrations.push({
          provider: 'EXOTEL',
          name: 'Exotel Voice/SMS',
          category: 'VOICE',
          enabled: process.env.EXOTEL_ENABLED === 'true',
          config: {
            sid: process.env.EXOTEL_SID,
            apiKey: process.env.EXOTEL_API_KEY || '',
            apiToken: process.env.EXOTEL_API_TOKEN || '',
            subdomain: process.env.EXOTEL_SUBDOMAIN || '',
            fromNumber: process.env.EXOTEL_FROM_NUMBER || '',
            webhookSecret: process.env.EXOTEL_WEBHOOK_SECRET || '',
            webhookUrl: process.env.EXOTEL_WEBHOOK_URL || ''
          }
        });
      }
    } else {
      console.log('  ⚠️  EXOTEL_SID not found in environment variables');
    }
    
    console.log('');
    
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

