const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { encryptConfig, decryptConfig } = require('../lib/encryption');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all integrations routes
router.use(authenticate);
// Initialize Prisma client lazily to avoid startup issues
let prisma;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// Sensitive fields that should be encrypted for each provider
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

/**
 * Get all integrations
 */
router.get('/', async (req, res) => {
  try {
    const integrations = await getPrisma().thirdPartyIntegration.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    // Decrypt sensitive fields for display (but mask secrets)
    const sanitized = integrations.map(integration => {
      const config = decryptConfig(integration.config, SENSITIVE_FIELDS_BY_PROVIDER[integration.provider] || []);
      
      // Mask sensitive values for security
      const maskedConfig = { ...config };
      const sensitiveFields = SENSITIVE_FIELDS_BY_PROVIDER[integration.provider] || [];
      sensitiveFields.forEach(field => {
        if (maskedConfig[field]) {
          const value = maskedConfig[field];
          if (value && value.length > 8) {
            maskedConfig[field] = value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
          } else {
            maskedConfig[field] = '••••••••';
          }
        }
      });

      return {
        ...integration,
        config: maskedConfig
      };
    });

    res.json({ success: true, integrations: sanitized });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch integrations' });
  }
});

/**
 * Get a single integration by provider
 */
router.get('/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    
    const integration = await getPrisma().thirdPartyIntegration.findUnique({
      where: { provider: provider.toUpperCase() }
    });

    if (!integration) {
      return res.status(404).json({ success: false, error: 'Integration not found' });
    }

    // Decrypt sensitive fields
    const config = decryptConfig(integration.config, SENSITIVE_FIELDS_BY_PROVIDER[integration.provider] || []);

    res.json({ 
      success: true, 
      integration: {
        ...integration,
        config
      }
    });
  } catch (error) {
    console.error('Error fetching integration:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch integration' });
  }
});

/**
 * Create or update an integration
 */
router.post('/', async (req, res) => {
  try {
    const {
      provider,
      name,
      category,
      enabled = false,
      config,
      description,
      documentationUrl,
      webhookUrl,
      testMode = false,
      createdBy
    } = req.body;

    if (!provider || !name || !category) {
      return res.status(400).json({ 
        success: false, 
        error: 'Provider, name, and category are required' 
      });
    }

    const providerUpper = provider.toUpperCase();
    const sensitiveFields = SENSITIVE_FIELDS_BY_PROVIDER[providerUpper] || [];

    // Encrypt sensitive fields before storing
    const encryptedConfig = encryptConfig(config || {}, sensitiveFields);

    // Check if integration already exists
      const existing = await getPrisma().thirdPartyIntegration.findUnique({
      where: { provider: providerUpper }
    });

    let integration;
    
    if (existing) {
      // Update existing
      integration = await getPrisma().thirdPartyIntegration.update({
        where: { provider: providerUpper },
        data: {
          name,
          category,
          enabled,
          config: encryptedConfig,
          description,
          documentationUrl,
          webhookUrl,
          testMode,
          status: enabled ? 'ACTIVE' : 'INACTIVE',
          createdBy,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new
      integration = await getPrisma().thirdPartyIntegration.create({
        data: {
          provider: providerUpper,
          name,
          category,
          enabled,
          config: encryptedConfig,
          description,
          documentationUrl,
          webhookUrl,
          testMode,
          status: enabled ? 'ACTIVE' : 'INACTIVE',
          createdBy
        }
      });
    }

    // Return sanitized response (masked secrets)
    const decryptedConfig = decryptConfig(integration.config, sensitiveFields);
    const maskedConfig = { ...decryptedConfig };
    sensitiveFields.forEach(field => {
      if (maskedConfig[field]) {
        const value = maskedConfig[field];
        if (value && value.length > 8) {
          maskedConfig[field] = value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
        } else {
          maskedConfig[field] = '••••••••';
        }
      }
    });

    res.json({ 
      success: true, 
      integration: {
        ...integration,
        config: maskedConfig
      }
    });
  } catch (error) {
    console.error('Error saving integration:', error);
    res.status(500).json({ success: false, error: 'Failed to save integration' });
  }
});

/**
 * Update integration status (enable/disable)
 */
router.patch('/:provider/toggle', async (req, res) => {
  try {
    const { provider } = req.params;
    const { enabled } = req.body;

    // Get current integration first
    const current = await getPrisma().thirdPartyIntegration.findUnique({
      where: { provider: provider.toUpperCase() }
    });

    if (!current) {
      return res.status(404).json({ success: false, error: 'Integration not found' });
    }

    const newEnabled = enabled !== undefined ? enabled : !current.enabled;

    const integration = await getPrisma().thirdPartyIntegration.update({
      where: { provider: provider.toUpperCase() },
      data: {
        enabled: newEnabled,
        status: newEnabled ? 'ACTIVE' : 'INACTIVE',
        updatedAt: new Date()
      }
    });

    res.json({ success: true, integration });
  } catch (error) {
    console.error('Error toggling integration:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle integration' });
  }
});

/**
 * Test integration connection
 */
router.post('/:provider/test', async (req, res) => {
  try {
    const { provider } = req.params;
    
    const integration = await getPrisma().thirdPartyIntegration.findUnique({
      where: { provider: provider.toUpperCase() }
    });

    if (!integration) {
      return res.status(404).json({ success: false, error: 'Integration not found' });
    }

    // Decrypt config for testing
    const config = decryptConfig(integration.config, SENSITIVE_FIELDS_BY_PROVIDER[integration.provider] || []);

    // Update status to testing
    await getPrisma().thirdPartyIntegration.update({
      where: { id: integration.id },
      data: {
        status: 'TESTING',
        lastTestedAt: new Date()
      }
    });

    // Perform provider-specific test
    let testResult = { success: false, message: 'Test not implemented' };
    
    try {
      switch (integration.provider) {
        case 'RAZORPAY':
          testResult = await testRazorpay(config);
          break;
        case 'POSTMARK':
          testResult = await testPostmark(config);
          break;
        case 'GUPSHUP':
          testResult = await testGupshup(config);
          break;
        case 'EXOTEL':
          testResult = await testExotel(config);
          break;
        default:
          testResult = { success: true, message: 'Test skipped for this provider' };
      }
    } catch (error) {
      testResult = { success: false, message: error.message };
    }

    // Update integration with test result
    await getPrisma().thirdPartyIntegration.update({
      where: { id: integration.id },
      data: {
        status: testResult.success ? 'ACTIVE' : 'ERROR',
        lastTestedAt: new Date(),
        lastError: testResult.success ? null : testResult.message
      }
    });

    res.json({ success: true, testResult });
  } catch (error) {
    console.error('Error testing integration:', error);
    res.status(500).json({ success: false, error: 'Failed to test integration' });
  }
});

/**
 * Delete an integration
 */
router.delete('/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    
    await getPrisma().thirdPartyIntegration.delete({
      where: { provider: provider.toUpperCase() }
    });

    // Clear cache
    const { clearCache } = require('../lib/integrationConfig');
    clearCache(provider.toUpperCase());

    res.json({ success: true, message: 'Integration deleted successfully' });
  } catch (error) {
    console.error('Error deleting integration:', error);
    res.status(500).json({ success: false, error: 'Failed to delete integration' });
  }
});

/**
 * Clear integration config cache
 */
router.post('/clear-cache', async (req, res) => {
  try {
    const { clearCache } = require('../lib/integrationConfig');
    const { provider } = req.body;
    
    clearCache(provider);
    
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ success: false, error: 'Failed to clear cache' });
  }
});

/**
 * Migrate integrations from environment variables to database
 */
router.post('/migrate-from-env', async (req, res) => {
  try {
    const { initializeFromEnv } = require('../lib/integrationConfig');
    const { encryptConfig } = require('../lib/encryption');
    const prisma = getPrisma();
    
    const integrations = await initializeFromEnv();
    
    if (integrations.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No integrations found in environment variables to migrate',
        migrated: 0,
        skipped: 0
      });
    }

    let migrated = 0;
    let skipped = 0;
    const results = [];

    for (const integration of integrations) {
      // Check if already exists
      const existing = await prisma.thirdPartyIntegration.findUnique({
        where: { provider: integration.provider }
      });

      if (existing) {
        skipped++;
        results.push({
          provider: integration.provider,
          name: integration.name,
          status: 'skipped',
          reason: 'Already exists in database'
        });
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

      migrated++;
      results.push({
        provider: integration.provider,
        name: integration.name,
        status: 'migrated'
      });
    }

    // Clear cache to refresh configs
    const { clearCache } = require('../lib/integrationConfig');
    clearCache();

    res.json({ 
      success: true, 
      message: `Migration completed: ${migrated} migrated, ${skipped} skipped`,
      migrated,
      skipped,
      results
    });
  } catch (error) {
    console.error('Error migrating integrations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to migrate integrations',
      details: error.message 
    });
  }
});

// Test functions for each provider
async function testRazorpay(config) {
  const Razorpay = require('razorpay');
  const razorpay = new Razorpay({
    key_id: config.keyId,
    key_secret: config.keySecret
  });
  
  // Test by fetching account details
  await razorpay.accounts.fetch();
  return { success: true, message: 'Razorpay connection successful' };
}

async function testPostmark(config) {
  const { ServerClient } = require('postmark');
  const client = new ServerClient(config.serverToken);
  
  // Test by fetching server info
  await client.getServer();
  return { success: true, message: 'Postmark connection successful' };
}

async function testGupshup(config) {
  const axios = require('axios');
  
  // Test by making a simple API call
  const response = await axios.get('https://api.gupshup.io/wa/api/v1/app', {
    headers: {
      'apikey': config.apiKey
    }
  });
  
  return { success: true, message: 'Gupshup connection successful' };
}

async function testExotel(config) {
  const axios = require('axios');
  const auth = Buffer.from(`${config.apiKey}:${config.apiToken}`).toString('base64');
  
  // Test by fetching account details
  await axios.get(`https://${config.subdomain}.exotel.com/v1/Accounts/${config.sid}`, {
    headers: {
      'Authorization': `Basic ${auth}`
    }
  });
  
  return { success: true, message: 'Exotel connection successful' };
}

module.exports = router;

