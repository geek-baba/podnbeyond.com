/**
 * Shared configuration module for communication integrations
 * Gupshup (WhatsApp/SMS) + Exotel (Voice/IVR)
 */

const integrationsConfig = {
  gupshup: {
    enabled: process.env.GUPSHUP_ENABLED === 'true',
    apiKey: process.env.GUPSHUP_API_KEY || '',
    appId: process.env.GUPSHUP_APP_ID || '',
    appName: process.env.GUPSHUP_APP_NAME || '',
    source: process.env.GUPSHUP_SOURCE || '', // WhatsApp Business number
    webhookSecret: process.env.GUPSHUP_WEBHOOK_SECRET || '',
    webhookUrl: process.env.GUPSHUP_WEBHOOK_URL || '',
    apiBaseUrl: 'https://api.gupshup.io/wa/api/v1', // WhatsApp Business API endpoint
  },
  exotel: {
    enabled: process.env.EXOTEL_ENABLED === 'true',
    sid: process.env.EXOTEL_SID || '',
    apiKey: process.env.EXOTEL_API_KEY || '',
    apiToken: process.env.EXOTEL_API_TOKEN || '',
    subdomain: process.env.EXOTEL_SUBDOMAIN || '',
    fromNumber: process.env.EXOTEL_FROM_NUMBER || '',
    webhookSecret: process.env.EXOTEL_WEBHOOK_SECRET || '',
    webhookUrl: process.env.EXOTEL_WEBHOOK_URL || '',
    apiBaseUrl: (subdomain) => `https://${subdomain}.exotel.com/v1/Accounts/${process.env.EXOTEL_SID}`,
  },
};

/**
 * Validate Gupshup configuration
 */
function validateGupshupConfig() {
  const config = integrationsConfig.gupshup;
  if (!config.enabled) {
    return { valid: true, enabled: false };
  }
  
  const missing = [];
  if (!config.apiKey) missing.push('GUPSHUP_API_KEY');
  if (!config.appId) missing.push('GUPSHUP_APP_ID');
  if (!config.source) missing.push('GUPSHUP_SOURCE');
  
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
function validateExotelConfig() {
  const config = integrationsConfig.exotel;
  if (!config.enabled) {
    return { valid: true, enabled: false };
  }
  
  const missing = [];
  if (!config.sid) missing.push('EXOTEL_SID');
  if (!config.apiKey) missing.push('EXOTEL_API_KEY');
  if (!config.apiToken) missing.push('EXOTEL_API_TOKEN');
  if (!config.subdomain) missing.push('EXOTEL_SUBDOMAIN');
  if (!config.fromNumber) missing.push('EXOTEL_FROM_NUMBER');
  
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
  validateGupshupConfig,
  validateExotelConfig,
};

