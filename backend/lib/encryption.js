/**
 * Encryption utility for sensitive third-party integration credentials
 * Uses AES-256-GCM encryption with a key derived from environment variable
 */

const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.INTEGRATION_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Derive encryption key from environment variable
 */
function getKey() {
  return crypto
    .createHash('sha256')
    .update(ENCRYPTION_KEY)
    .digest();
}

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted string (base64 encoded)
 */
function encrypt(text) {
  if (!text) return null;
  
  try {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine salt + iv + tag + encrypted
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Encrypted string (base64 encoded)
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  
  try {
    const key = getKey();
    const combined = Buffer.from(encryptedText, 'base64');
    
    // Extract components
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, TAG_POSITION);
    const tag = combined.slice(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = combined.slice(ENCRYPTED_POSITION);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt an object's sensitive fields
 * @param {object} config - Configuration object
 * @param {string[]} sensitiveFields - Array of field names to encrypt
 * @returns {object} - Object with encrypted sensitive fields
 */
function encryptConfig(config, sensitiveFields = ['apiKey', 'apiSecret', 'keySecret', 'webhookSecret', 'apiToken', 'password']) {
  if (!config || typeof config !== 'object') return config;
  
  const encrypted = { ...config };
  
  for (const field of sensitiveFields) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }
  
  return encrypted;
}

/**
 * Decrypt an object's sensitive fields
 * @param {object} config - Configuration object with encrypted fields
 * @param {string[]} sensitiveFields - Array of field names to decrypt
 * @returns {object} - Object with decrypted sensitive fields
 */
function decryptConfig(config, sensitiveFields = ['apiKey', 'apiSecret', 'keySecret', 'webhookSecret', 'apiToken', 'password']) {
  if (!config || typeof config !== 'object') return config;
  
  const decrypted = { ...config };
  
  for (const field of sensitiveFields) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = decrypt(decrypted[field]);
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        // Keep encrypted value if decryption fails
      }
    }
  }
  
  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
  encryptConfig,
  decryptConfig,
};

