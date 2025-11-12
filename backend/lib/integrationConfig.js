/**
 * Integration Configuration Service
 * Fetches and caches third-party integration configurations from database
 */

const { PrismaClient } = require('@prisma/client');
const { decryptConfig } = require('./encryption');

// Initialize Prisma client lazily to avoid startup issues
let prisma;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// Cache for integration configs (refreshed every 5 minutes)
const configCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Sensitive fields that should be decrypted for each provider
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
 * Get integration configuration from database
 * @param {string} provider - Provider name (e.g., 'RAZORPAY', 'POSTMARK')
 * @param {boolean} forceRefresh - Force refresh from database (skip cache)
 * @returns {object|null} - Integration config or null if not found/disabled
 */
async function getIntegrationConfig(provider, forceRefresh = false) {
  const cacheKey = provider.toUpperCase();
  const cached = configCache.get(cacheKey);
  
  // Return cached config if valid and not forcing refresh
  if (!forceRefresh && cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.config;
  }

  try {
    const integration = await getPrisma().thirdPartyIntegration.findUnique({
      where: { provider: cacheKey }
    });

    if (!integration || !integration.enabled) {
      // Cache null result to avoid repeated DB queries
      configCache.set(cacheKey, { config: null, timestamp: Date.now() });
      return null;
    }

    // Decrypt sensitive fields
    const sensitiveFields = SENSITIVE_FIELDS_BY_PROVIDER[cacheKey] || [];
    const decryptedConfig = decryptConfig(integration.config, sensitiveFields);

    const config = {
      enabled: integration.enabled,
      testMode: integration.testMode,
      status: integration.status,
      ...decryptedConfig
    };

    // Update cache
    configCache.set(cacheKey, { config, timestamp: Date.now() });

    return config;
  } catch (error) {
    console.error(`Error fetching integration config for ${provider}:`, error);
    return null;
  }
}

/**
 * Get Razorpay configuration
 */
async function getRazorpayConfig() {
  const config = await getIntegrationConfig('RAZORPAY');
  if (!config) return null;
  
  return {
    enabled: config.enabled,
    keyId: config.keyId,
    keySecret: config.keySecret,
    testMode: config.testMode || false
  };
}

/**
 * Get Postmark configuration
 */
async function getPostmarkConfig() {
  const config = await getIntegrationConfig('POSTMARK');
  if (!config) return null;
  
  return {
    enabled: config.enabled,
    serverToken: config.serverToken,
    webhookSecret: config.webhookSecret,
    mailFrom: config.mailFrom
  };
}

/**
 * Get Gupshup configuration
 */
async function getGupshupConfig() {
  const config = await getIntegrationConfig('GUPSHUP');
  if (!config) return null;
  
  return {
    enabled: config.enabled,
    apiKey: config.apiKey,
    appId: config.appId,
    appName: config.appName,
    source: config.source,
    webhookSecret: config.webhookSecret,
    webhookUrl: config.webhookUrl,
    apiBaseUrl: config.apiBaseUrl || 'https://api.gupshup.io/wa/api/v1'
  };
}

/**
 * Get Exotel configuration
 */
async function getExotelConfig() {
  const config = await getIntegrationConfig('EXOTEL');
  if (!config) return null;
  
  return {
    enabled: config.enabled,
    sid: config.sid,
    apiKey: config.apiKey,
    apiToken: config.apiToken,
    subdomain: config.subdomain,
    fromNumber: config.fromNumber,
    webhookSecret: config.webhookSecret,
    webhookUrl: config.webhookUrl,
    apiBaseUrl: (subdomain) => `https://${subdomain || config.subdomain}.exotel.com/v1/Accounts/${config.sid}`
  };
}

/**
 * Get OTA configuration
 */
async function getOTAConfig(provider) {
  const config = await getIntegrationConfig(provider);
  if (!config) return null;
  
  return {
    enabled: config.enabled,
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
    hotelId: config.hotelId,
    apiBaseUrl: config.apiBaseUrl
  };
}

/**
 * Clear cache for a specific provider or all providers
 */
function clearCache(provider = null) {
  if (provider) {
    configCache.delete(provider.toUpperCase());
  } else {
    configCache.clear();
  }
}

/**
 * Initialize integrations from environment variables (migration helper)
 * This can be run once to migrate existing env-based configs to database
 */
async function initializeFromEnv() {
  const integrations = [];

  // Razorpay
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    integrations.push({
      provider: 'RAZORPAY',
      name: 'Razorpay Payment Gateway',
      category: 'PAYMENT',
      enabled: true,
      config: {
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET
      },
      testMode: process.env.RAZORPAY_KEY_ID.includes('test') || process.env.RAZORPAY_KEY_ID.includes('rzp_test')
    });
  }

  // Postmark
  if (process.env.POSTMARK_SERVER_TOKEN) {
    integrations.push({
      provider: 'POSTMARK',
      name: 'Postmark Email Service',
      category: 'EMAIL',
      enabled: true,
      config: {
        serverToken: process.env.POSTMARK_SERVER_TOKEN,
        webhookSecret: process.env.POSTMARK_WEBHOOK_SECRET || '',
        mailFrom: process.env.MAIL_FROM || 'support@capsulepodhotel.com'
      }
    });
  }

  // Gupshup
  if (process.env.GUPSHUP_API_KEY && process.env.GUPSHUP_ENABLED === 'true') {
    integrations.push({
      provider: 'GUPSHUP',
      name: 'Gupshup WhatsApp/SMS',
      category: 'MESSAGING',
      enabled: true,
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

  // Exotel
  if (process.env.EXOTEL_SID && process.env.EXOTEL_ENABLED === 'true') {
    integrations.push({
      provider: 'EXOTEL',
      name: 'Exotel Voice/SMS',
      category: 'VOICE',
      enabled: true,
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

  // OTA Integrations
  const otaProviders = [
    { env: 'GO_MMT', name: 'Go-MMT', key: 'GOIBIBO', envPrefix: 'GOIBIBO' },
    { env: 'BOOKING_COM', name: 'Booking.com', key: 'BOOKING_COM', envPrefix: 'BOOKING_COM' },
    { env: 'EASEMYTRIP', name: 'EaseMyTrip.com', key: 'EASEMYTRIP', envPrefix: 'EASEMYTRIP' },
    { env: 'CLEARTRIP', name: 'Cleartrip.com', key: 'CLEARTRIP', envPrefix: 'CLEARTRIP' }
  ];

  for (const ota of otaProviders) {
    const enabledKey = `${ota.envPrefix}_ENABLED`;
    const apiKey = `${ota.envPrefix}_API_KEY`;
    const apiSecret = `${ota.envPrefix}_API_SECRET`;
    const hotelId = `${ota.envPrefix}_HOTEL_ID`;

    if (process.env[enabledKey] === 'true' && process.env[apiKey]) {
      integrations.push({
        provider: ota.env,
        name: ota.name,
        category: 'OTA',
        enabled: true,
        config: {
          apiKey: process.env[apiKey],
          apiSecret: process.env[apiSecret] || '',
          hotelId: process.env[hotelId] || ''
        }
      });
    }
  }

  return integrations;
}

module.exports = {
  getIntegrationConfig,
  getRazorpayConfig,
  getPostmarkConfig,
  getGupshupConfig,
  getExotelConfig,
  getOTAConfig,
  clearCache,
  initializeFromEnv
};

