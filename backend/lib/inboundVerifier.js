const crypto = require('crypto');

/**
 * Verify Postmark inbound webhook signature
 */
function verifyPostmarkSignature(payload, signature, secret = process.env.POSTMARK_WEBHOOK_SECRET || '') {
  if (!secret) {
    console.warn('⚠️  POSTMARK_WEBHOOK_SECRET not set - skipping verification in development');
    return true; // Allow in development
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('base64');
    
    return signature === calculatedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Extract email domain from email address
 */
function getEmailDomain(email) {
  const parts = email.split('@');
  return parts.length > 1 ? parts[1] : '';
}

/**
 * Check if email is in suppression list
 */
async function isEmailSuppressed(email, prisma) {
  const suppression = await prisma.suppression.findUnique({
    where: { email: email.toLowerCase() },
  });
  return !!suppression;
}

/**
 * Add email to suppression list
 */
async function suppressEmail(email, reason, origin, prisma) {
  await prisma.suppression.upsert({
    where: { email: email.toLowerCase() },
    update: {
      reason,
      origin,
      suppressedAt: new Date(),
    },
    create: {
      email: email.toLowerCase(),
      reason,
      origin,
      suppressedAt: new Date(),
    },
  });
}

module.exports = {
  verifyPostmarkSignature,
  getEmailDomain,
  isEmailSuppressed,
  suppressEmail,
};

