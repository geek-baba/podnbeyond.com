const express = require('express');
const { handleWebhook: handleGupshupWebhook } = require('../services/gupshup');
const { handleWebhook: handleExotelWebhook } = require('../services/exotel');
const { integrationsConfig } = require('../lib/integrations');
const { createHash } = require('crypto');

const router = express.Router();

/**
 * Middleware to validate webhook secret (optional but recommended)
 */
function validateWebhookSecret(secret, providedSecret) {
  if (!secret) {
    // If no secret configured, allow (for development)
    return true;
  }
  
  if (!providedSecret) {
    return false;
  }
  
  // Simple comparison (in production, use constant-time comparison)
  return secret === providedSecret;
}

/**
 * POST /webhooks/gupshup
 * Handle inbound webhooks from Gupshup
 * Supports both Gupshup format (v2) and Meta format (v3)
 */
router.post('/gupshup', async (req, res) => {
  try {
    // Log incoming webhook for debugging
    console.log('Gupshup webhook received:', {
      headers: req.headers,
      body: req.body,
      query: req.query,
    });

    // Optional: Validate webhook secret
    // Gupshup may send secret in headers or query params
    const webhookSecret = req.headers['x-webhook-secret'] || 
                         req.headers['x-gupshup-secret'] ||
                         req.query.secret ||
                         req.body.secret;
    const configSecret = integrationsConfig.gupshup.webhookSecret;
    
    // Only validate if secret is configured
    if (configSecret && !validateWebhookSecret(configSecret, webhookSecret)) {
      console.warn('Invalid webhook secret for Gupshup');
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    // Handle webhook - Gupshup may send different formats
    const result = await handleGupshupWebhook(req.body);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        ...result,
      });
    } else {
      console.error('Gupshup webhook processing failed:', result.error);
      // Still return 200 to acknowledge receipt, but log the error
      return res.status(200).json({
        success: false,
        error: result.error,
        acknowledged: true,
      });
    }
  } catch (error) {
    console.error('Gupshup webhook error:', error);
    // Return 200 to acknowledge receipt even on error
    // This prevents Gupshup from retrying failed requests
    return res.status(200).json({
      error: 'Internal server error',
      message: error.message,
      acknowledged: true,
    });
  }
});

/**
 * POST /webhooks/exotel
 * Handle inbound webhooks from Exotel
 */
router.post('/exotel', async (req, res) => {
  try {
    // Optional: Validate webhook secret
    const webhookSecret = req.headers['x-webhook-secret'] || req.query.secret;
    const configSecret = integrationsConfig.exotel.webhookSecret;
    
    if (!validateWebhookSecret(configSecret, webhookSecret)) {
      console.warn('Invalid webhook secret for Exotel');
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    // Handle webhook
    const result = await handleExotelWebhook(req.body);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        ...result,
      });
    } else {
      console.error('Exotel webhook processing failed:', result.error);
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Exotel webhook error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /webhooks/gupshup (for webhook verification)
 * Gupshup may send GET requests to verify the webhook URL
 */
router.get('/gupshup', (req, res) => {
  // Gupshup webhook verification - respond with 200 OK
  return res.status(200).json({
    status: 'ok',
    message: 'Gupshup webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
});

/**
 * HEAD /webhooks/gupshup (for webhook verification)
 * Some providers use HEAD requests for validation
 */
router.head('/gupshup', (req, res) => {
  return res.status(200).end();
});

/**
 * GET /webhooks/exotel (for webhook verification)
 */
router.get('/exotel', (req, res) => {
  // Some providers send GET requests for webhook verification
  return res.status(200).json({
    status: 'ok',
    message: 'Exotel webhook endpoint is active',
  });
});

module.exports = router;

