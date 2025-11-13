const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { sendEmail } = require('../lib/postmarkClient');
const { queueEmail, getQueueStats } = require('../lib/queue');
const { isEmailSuppressed } = require('../lib/inboundVerifier');

const prisma = new PrismaClient();

/**
 * POST /api/email/send
 * Send an email via Postmark
 */
router.post('/send', async (req, res) => {
  try {
    const {
      to,
      cc,
      bcc,
      replyTo,
      subject,
      htmlBody,
      textBody,
      tag,
      metadata,
      threadId, // Optional: link to existing thread
      bookingId, // Optional: link to booking
      propertyId, // Optional: link to property
      userId, // Optional: link to user
    } = req.body;

    // Validation
    if (!to || !subject || (!htmlBody && !textBody)) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject, and htmlBody or textBody',
      });
    }

    // Check suppression list
    const toArray = Array.isArray(to) ? to : [to];
    for (const email of toArray) {
      const suppressed = await isEmailSuppressed(email, prisma);
      if (suppressed) {
        return res.status(400).json({
          error: `Email ${email} is suppressed and cannot receive emails`,
        });
      }
    }

    // Create or find thread
    let thread;
    if (threadId) {
      thread = await prisma.thread.findUnique({ where: { id: parseInt(threadId) } });
    } else {
      // Create new thread
      thread = await prisma.thread.create({
        data: {
          subject,
          participants: [process.env.MAIL_FROM || 'support@capsulepodhotel.com', ...toArray],
          userId,
          bookingId: bookingId ? parseInt(bookingId) : null,
          propertyId: propertyId ? parseInt(propertyId) : null,
        },
      });
    }

    // Create email record
    const email = await prisma.email.create({
      data: {
        threadId: thread.id,
        messageId: `outbound-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        direction: 'OUTBOUND',
        status: 'QUEUED',
        fromEmail: process.env.MAIL_FROM || 'support@capsulepodhotel.com',
        fromName: 'POD N BEYOND',
        toEmails: toArray,
        ccEmails: cc ? (Array.isArray(cc) ? cc : [cc]) : [],
        bccEmails: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [],
        replyTo,
        subject,
        htmlBody,
        textBody,
        tag,
        metadata: metadata || {},
      },
    });

    // Queue for sending
    await queueEmail(email.id, {
      to,
      cc,
      bcc,
      replyTo,
      subject,
      htmlBody,
      textBody,
      tag,
      metadata,
    });

    // Update thread's last message time
    await prisma.thread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date() },
    });

    res.json({
      success: true,
      email: {
        id: email.id,
        threadId: thread.id,
        messageId: email.messageId,
        status: 'QUEUED',
      },
    });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message,
    });
  }
});

/**
 * GET /api/email/threads
 * List email threads
 */
router.get('/threads', async (req, res) => {
  try {
    const { userId, bookingId, propertyId, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (userId) where.userId = userId;
    if (bookingId) where.bookingId = parseInt(bookingId);
    if (propertyId) where.propertyId = parseInt(propertyId);

    const threads = await prisma.thread.findMany({
      where,
      include: {
        emails: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Latest email in thread
        },
        _count: {
          select: { emails: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    res.json({ threads });
  } catch (error) {
    console.error('Threads fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

/**
 * GET /api/email/threads/:id
 * Get single thread with all emails
 */
router.get('/threads/:id', async (req, res) => {
  try {
    const thread = await prisma.thread.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        emails: {
          include: {
            attachments: true,
            events: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: { id: true, email: true, name: true },
        },
        booking: {
          select: { id: true, guestName: true, email: true },
        },
        property: {
          select: { id: true, name: true },
        },
      },
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    res.json({ thread });
  } catch (error) {
    console.error('Thread fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
});

/**
 * GET /api/email/queue/stats
 * Get email queue statistics
 */
router.get('/queue/stats', async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.json({ stats });
  } catch (error) {
    console.error('Queue stats error:', error);
    res.status(500).json({ error: 'Failed to get queue stats' });
  }
});

module.exports = router;

