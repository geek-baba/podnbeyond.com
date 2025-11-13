/**
 * Shared configuration module for communication integrations
 * Gupshup (WhatsApp/SMS) + Exotel (Voice/IVR)
 * Now uses database configs with fallback to environment variables
 */

const { getGupshupConfig, getExotelConfig } = require('./integrationConfig');

// Cache for configs (to avoid repeated async calls)
let gupshupConfigCache = null;
let exotelConfigCache = null;
let configCacheTimestamp = 0;
const CONFIG_CACHE_TTL = 60000; // 1 minute

/**
 * Get integrations config (with caching)
 */
async function getIntegrationsConfig() {
  const now = Date.now();
  
  // Return cached configs if still valid
  if (gupshupConfigCache && exotelConfigCache && (now - configCacheTimestamp) < CONFIG_CACHE_TTL) {
    return {
      gupshup: gupshupConfigCache,
      exotel: exotelConfigCache
    };
  }

  // Fetch from database (with env fallback)
  const gupshupDb = await getGupshupConfig();
  const exotelDb = await getExotelConfig();

  // Fallback to env variables if database config not available
  const gupshupConfig = gupshupDb || {
    enabled: process.env.GUPSHUP_ENABLED === 'true',
    apiKey: process.env.GUPSHUP_API_KEY || '',
    appId: process.env.GUPSHUP_APP_ID || '',
    appName: process.env.GUPSHUP_APP_NAME || '',
    source: process.env.GUPSHUP_SOURCE || '',
    webhookSecret: process.env.GUPSHUP_WEBHOOK_SECRET || '',
    webhookUrl: process.env.GUPSHUP_WEBHOOK_URL || '',
    apiBaseUrl: 'https://api.gupshup.io/wa/api/v1',
  };

  const exotelConfig = exotelDb || {
    enabled: process.env.EXOTEL_ENABLED === 'true',
    sid: process.env.EXOTEL_SID || '',
    apiKey: process.env.EXOTEL_API_KEY || '',
    apiToken: process.env.EXOTEL_API_TOKEN || '',
    subdomain: process.env.EXOTEL_SUBDOMAIN || '',
    fromNumber: process.env.EXOTEL_FROM_NUMBER || '',
    webhookSecret: process.env.EXOTEL_WEBHOOK_SECRET || '',
    webhookUrl: process.env.EXOTEL_WEBHOOK_URL || '',
    apiBaseUrl: (subdomain) => `https://${subdomain || process.env.EXOTEL_SUBDOMAIN}.exotel.com/v1/Accounts/${process.env.EXOTEL_SID}`,
  };

  // Update cache
  gupshupConfigCache = gupshupConfig;
  exotelConfigCache = exotelConfig;
  configCacheTimestamp = now;

  return {
    gupshup: gupshupConfig,
    exotel: exotelConfig
  };
}

// Synchronous getter for backward compatibility (uses env vars or cached values)
const integrationsConfig = {
  get gupshup() {
    // Return cached value if available, otherwise return env-based config
    if (gupshupConfigCache) {
      return gupshupConfigCache;
    }
    return {
      enabled: process.env.GUPSHUP_ENABLED === 'true',
      apiKey: process.env.GUPSHUP_API_KEY || '',
      appId: process.env.GUPSHUP_APP_ID || '',
      appName: process.env.GUPSHUP_APP_NAME || '',
      source: process.env.GUPSHUP_SOURCE || '',
      webhookSecret: process.env.GUPSHUP_WEBHOOK_SECRET || '',
      webhookUrl: process.env.GUPSHUP_WEBHOOK_URL || '',
      apiBaseUrl: 'https://api.gupshup.io/wa/api/v1',
    };
  },
  get exotel() {
    // Return cached value if available, otherwise return env-based config
    if (exotelConfigCache) {
      return exotelConfigCache;
    }
    return {
      enabled: process.env.EXOTEL_ENABLED === 'true',
      sid: process.env.EXOTEL_SID || '',
      apiKey: process.env.EXOTEL_API_KEY || '',
      apiToken: process.env.EXOTEL_API_TOKEN || '',
      subdomain: process.env.EXOTEL_SUBDOMAIN || '',
      fromNumber: process.env.EXOTEL_FROM_NUMBER || '',
      webhookSecret: process.env.EXOTEL_WEBHOOK_SECRET || '',
      webhookUrl: process.env.EXOTEL_WEBHOOK_URL || '',
      apiBaseUrl: (subdomain) => `https://${subdomain || process.env.EXOTEL_SUBDOMAIN}.exotel.com/v1/Accounts/${process.env.EXOTEL_SID}`,
    };
  }
};

/**
 * Validate Gupshup configuration
 */
async function validateGupshupConfig() {
  const configs = await getIntegrationsConfig();
  const config = configs.gupshup;
  
  if (!config.enabled) {
    return { valid: true, enabled: false };
  }
  
  const missing = [];
  if (!config.apiKey) missing.push('apiKey');
  if (!config.appId) missing.push('appId');
  if (!config.source) missing.push('source');
  
  if (missing.length > 0) {
    return {
      valid: false,
      enabled: true,
      error: `Missing Gupshup configuration: ${missing.join(', ')}`,
    };
  }
  
  return { valid: true, enabled: true };
}

/**
 * Validate Exotel configuration
 */
async function validateExotelConfig() {
  const configs = await getIntegrationsConfig();
  const config = configs.exotel;
  
  if (!config.enabled) {
    return { valid: true, enabled: false };
  }
  
  const missing = [];
  if (!config.sid) missing.push('sid');
  if (!config.apiKey) missing.push('apiKey');
  if (!config.apiToken) missing.push('apiToken');
  if (!config.subdomain) missing.push('subdomain');
  if (!config.fromNumber) missing.push('fromNumber');
  
  if (missing.length > 0) {
    return {
      valid: false,
      enabled: true,
      error: `Missing Exotel configuration: ${missing.join(', ')}`,
    };
  }
  
  return { valid: true, enabled: true };
}

module.exports = {
  integrationsConfig,
  getIntegrationsConfig,
  validateGupshupConfig,
  validateExotelConfig,
};

