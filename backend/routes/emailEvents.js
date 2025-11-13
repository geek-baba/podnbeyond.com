const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { verifyPostmarkSignature, suppressEmail } = require('../lib/inboundVerifier');

const prisma = new PrismaClient();

/**
 * POST /api/email/events
 * Handle Postmark delivery/bounce/open/complaint events
 */
router.post('/', async (req, res) => {
  try {
    const signature = req.headers['x-postmark-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!verifyPostmarkSignature(payload, signature, process.env.POSTMARK_WEBHOOK_SECRET)) {
      console.warn('⚠️  Invalid Postmark signature - rejecting event webhook');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const recordType = event.RecordType; // Delivery, Bounce, SpamComplaint, Open, Click

    console.log(`📬 Postmark event received: ${recordType} for ${event.MessageID}`);

    // Find email by Postmark MessageID
    const email = await prisma.email.findUnique({
      where: { postmarkId: event.MessageID },
    });

    if (!email) {
      console.warn(`⚠️  Email not found for Postmark ID: ${event.MessageID}`);
      return res.status(404).json({ error: 'Email not found' });
    }

    // Map Postmark event types to our enum
    let eventType;
    let emailStatus = email.status;

    switch (recordType) {
      case 'Delivery':
        eventType = 'DELIVERY';
        emailStatus = 'DELIVERED';
        break;
      case 'Bounce':
        eventType = 'BOUNCE';
        emailStatus = 'BOUNCED';
        
        // Hard bounces should suppress the email
        if (event.Type === 'HardBounce') {
          await suppressEmail(event.Email, 'HARD_BOUNCE', email.messageId, prisma);
          console.log(`🚫 Suppressed email due to hard bounce: ${event.Email}`);
        }
        break;
      case 'SpamComplaint':
        eventType = 'SPAM_COMPLAINT';
        
        // Spam complaints should suppress the email
        await suppressEmail(event.Email, 'SPAM_COMPLAINT', email.messageId, prisma);
        console.log(`🚫 Suppressed email due to spam complaint: ${event.Email}`);
        break;
      case 'Open':
        eventType = 'OPEN';
        break;
      case 'Click':
        eventType = 'CLICK';
        break;
      case 'LinkClick':
        eventType = 'LINK_CLICK';
        break;
      default:
        console.warn(`⚠️  Unknown event type: ${recordType}`);
        return res.json({ success: true, message: 'Event type not tracked' });
    }

    // Create event record
    await prisma.emailEvent.create({
      data: {
        emailId: email.id,
        eventType,
        timestamp: new Date(event.DeliveredAt || event.BouncedAt || event.ReceivedAt || Date.now()),
        recipient: event.Email || event.Recipient,
        details: {
          type: event.Type,
          description: event.Description,
          bounceId: event.ID,
          tag: event.Tag,
          serverID: event.ServerID,
          metadata: event.Metadata,
          // Bounce-specific
          canActivate: event.CanActivate,
          inactive: event.Inactive,
          // Link click-specific
          originalLink: event.OriginalLink,
          clickedLink: event.ClickedLink,
        },
        userAgent: event.UserAgent,
        ip: event.RecordType === 'Open' ? event.Geo?.IP : null,
      },
    });

    // Update email status
    if (emailStatus !== email.status) {
      await prisma.email.update({
        where: { id: email.id },
        data: { status: emailStatus },
      });
    }

    console.log(`✅ Event recorded: ${eventType} for Email ID ${email.id}`);

    res.json({ success: true });
  } catch (error) {
    console.error('Event processing error:', error);
    res.status(500).json({
      error: 'Failed to process event',
      details: error.message,
    });
  }
});

/**
 * GET /api/email/suppressions
 * List suppressed emails
 */
router.get('/suppressions', async (req, res) => {
  try {
    const suppressions = await prisma.suppression.findMany({
      orderBy: { suppressedAt: 'desc' },
      take: 100,
    });

    res.json({ suppressions });
  } catch (error) {
    console.error('Suppressions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch suppressions' });
  }
});

/**
 * DELETE /api/email/suppressions/:email
 * Remove email from suppression list
 */
router.delete('/suppressions/:email', async (req, res) => {
  try {
    await prisma.suppression.delete({
      where: { email: req.params.email.toLowerCase() },
    });

    console.log(`✅ Removed suppression for: ${req.params.email}`);

    res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Email not found in suppression list' });
    }
    console.error('Suppression removal error:', error);
    res.status(500).json({ error: 'Failed to remove suppression' });
  }
});

module.exports = router;

