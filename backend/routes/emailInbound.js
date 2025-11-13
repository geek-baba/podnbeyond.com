const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { verifyPostmarkSignature, getEmailDomain } = require('../lib/inboundVerifier');

const prisma = new PrismaClient();

/**
 * POST /api/email/inbound
 * Receive inbound emails from Postmark
 */
router.post('/', async (req, res) => {
  try {
    const signature = req.headers['x-postmark-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!verifyPostmarkSignature(payload, signature, process.env.POSTMARK_WEBHOOK_SECRET)) {
      console.warn('⚠️  Invalid Postmark signature - rejecting webhook');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const inbound = req.body;

    console.log(`📨 Inbound email received:`, {
      from: inbound.FromFull?.Email,
      to: inbound.ToFull?.[0]?.Email,
      subject: inbound.Subject,
      messageId: inbound.MessageID,
    });

    // Find or create thread based on subject/participants
    const participants = [
      inbound.FromFull?.Email,
      ...(inbound.ToFull || []).map((t) => t.Email),
      ...(inbound.CcFull || []).map((c) => c.Email),
    ].filter(Boolean);

    // Try to find existing thread by matching subject or In-Reply-To header
    let thread = null;
    
    // Check if this is a reply (In-Reply-To header or Re: in subject)
    const inReplyTo = inbound.Headers?.find((h) => h.Name === 'In-Reply-To')?.Value;
    if (inReplyTo) {
      // Try to find original email by messageId
      const originalEmail = await prisma.email.findFirst({
        where: { postmarkId: inReplyTo },
        include: { thread: true },
      });
      if (originalEmail) {
        thread = originalEmail.thread;
      }
    }

    // If no thread found, create new one
    if (!thread) {
      thread = await prisma.thread.create({
        data: {
          subject: inbound.Subject,
          participants,
          lastMessageAt: new Date(inbound.Date || Date.now()),
        },
      });
    }

    // Create email record
    const email = await prisma.email.create({
      data: {
        threadId: thread.id,
        messageId: inbound.MessageID,
        direction: 'INBOUND',
        status: 'DELIVERED',
        fromEmail: inbound.FromFull?.Email || inbound.From,
        fromName: inbound.FromFull?.Name,
        toEmails: (inbound.ToFull || []).map((t) => t.Email),
        ccEmails: (inbound.CcFull || []).map((c) => c.Email),
        subject: inbound.Subject,
        htmlBody: inbound.HtmlBody,
        textBody: inbound.TextBody || inbound.StrippedTextReply,
        replyTo: inbound.ReplyTo,
        tag: inbound.Tag,
        metadata: {
          headers: inbound.Headers,
          messageStream: inbound.MessageStream,
        },
      },
    });

    // Handle attachments
    if (inbound.Attachments && inbound.Attachments.length > 0) {
      for (const attachment of inbound.Attachments) {
        await prisma.attachment.create({
          data: {
            emailId: email.id,
            filename: attachment.Name,
            contentType: attachment.ContentType,
            size: attachment.ContentLength || 0,
            postmarkUrl: attachment.ContentID ? `cid:${attachment.ContentID}` : null,
            storageUrl: null, // TODO: Download and store if needed
          },
        });
      }
    }

    // Update thread's last message time
    await prisma.thread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date(inbound.Date || Date.now()) },
    });

    // Log delivery event
    await prisma.emailEvent.create({
      data: {
        emailId: email.id,
        eventType: 'DELIVERY',
        timestamp: new Date(inbound.Date || Date.now()),
        recipient: inbound.ToFull?.[0]?.Email,
        details: {
          fromEmail: inbound.FromFull?.Email,
          fromName: inbound.FromFull?.Name,
        },
      },
    });

    console.log(`✅ Inbound email stored: Email ID ${email.id}, Thread ID ${thread.id}`);

    res.json({
      success: true,
      email: { id: email.id, threadId: thread.id },
    });
  } catch (error) {
    console.error('Inbound email processing error:', error);
    res.status(500).json({
      error: 'Failed to process inbound email',
      details: error.message,
    });
  }
});

module.exports = router;

