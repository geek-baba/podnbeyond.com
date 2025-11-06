const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { sendEmail } = require('../lib/postmarkClient');

const prisma = new PrismaClient();

// Rate limiting map (in-memory, simple)
const rateLimits = new Map();

/**
 * POST /api/otp/send
 * Generate and send OTP code to email
 */
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Simple rate limiting: Max 3 OTP requests per email per hour
    const rateKey = `otp_${email}`;
    const now = Date.now();
    const rateLimit = rateLimits.get(rateKey) || { count: 0, resetAt: now + 3600000 };
    
    if (now > rateLimit.resetAt) {
      rateLimit.count = 0;
      rateLimit.resetAt = now + 3600000;
    }
    
    if (rateLimit.count >= 3) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetAt - now) / 1000)
      });
    }
    
    rateLimit.count++;
    rateLimits.set(rateKey, rateLimit);

    // Delete any existing OTP for this email
    await prisma.oTPCode.deleteMany({
      where: { email }
    });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP before storing
    const codeHash = crypto.createHash('sha256').update(otp).digest('hex');
    
    // Store in database
    await prisma.oTPCode.create({
      data: {
        email,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      }
    });

    // Send email via Postmark
    const emailResult = await sendEmail({
      to: email,
      subject: 'Your POD N BEYOND Admin Login Code',
      htmlBody: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 0;">POD N BEYOND</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 8px;">Admin Portal</p>
          </div>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 32px; text-align: center;">
            <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 16px 0;">Your Login Code</h2>
            <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">Enter this code to sign in to the admin portal</p>
            
            <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1e293b; margin: 0 auto; max-width: 280px;">
              ${otp}
            </div>
            
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">This code expires in 10 minutes</p>
          </div>
          
          <div style="margin-top: 32px; text-align: center; color: #94a3b8; font-size: 12px;">
            <p>If you didn't request this code, you can safely ignore this email.</p>
            <p style="margin-top: 8px;">POD N BEYOND GROUP · India's First Multi-Brand Pod Hotel</p>
          </div>
        </div>
      `,
      textBody: `POD N BEYOND Admin Portal\n\nYour login code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.\n\n---\nPOD N BEYOND GROUP\nIndia's First Multi-Brand Pod Hotel`,
      tag: 'otp-login',
    });

    // Check if email was sent successfully
    if (!emailResult.success) {
      console.error('❌ Failed to send OTP email:', emailResult.error);
      throw new Error(`Email delivery failed: ${emailResult.error}`);
    }

    console.log(`✅ OTP sent successfully to: ${email} (MessageID: ${emailResult.messageId})`);

    res.json({
      success: true,
      message: 'OTP sent to your email',
      expiresIn: 600, // 10 minutes in seconds
    });

  } catch (error) {
    console.error('OTP send error:', error);
    res.status(500).json({
      error: 'Failed to send OTP',
      details: error.message,
    });
  }
});

/**
 * POST /api/otp/verify
 * Verify OTP and create session
 */
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Find OTP record
    const otpRecord = await prisma.oTPCode.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return res.status(404).json({ error: 'No OTP found. Please request a new one.' });
    }

    // Check expiration
    if (new Date() > otpRecord.expiresAt) {
      await prisma.oTPCode.delete({ where: { id: otpRecord.id } });
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      await prisma.oTPCode.delete({ where: { id: otpRecord.id } });
      return res.status(429).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify OTP
    const codeHash = crypto.createHash('sha256').update(otp).digest('hex');
    
    if (codeHash !== otpRecord.codeHash) {
      // Increment attempts
      await prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 }
      });
      
      return res.status(400).json({ 
        error: 'Invalid OTP code',
        attemptsLeft: 3 - (otpRecord.attempts + 1)
      });
    }

    // OTP is valid! Delete it
    await prisma.oTPCode.delete({ where: { id: otpRecord.id } });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
      include: { userRoles: true, loyaltyAccount: true }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          emailVerified: new Date(),
        },
        include: { userRoles: true, loyaltyAccount: true }
      });

      // Create default MEMBER role
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleKey: 'MEMBER',
          scopeType: 'ORG',
          scopeId: 1
        }
      });

      // Create loyalty account
      await prisma.loyaltyAccount.create({
        data: {
          userId: user.id,
          points: 0,
          tier: 'SILVER'
        }
      });

      // Refresh user data
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { userRoles: true, loyaltyAccount: true }
      });
    }

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }
    });

    console.log(`✅ OTP verified for: ${email}`);

    // In production, set httpOnly cookie
    // In development, return token for localStorage (cross-origin issue workaround)
    if (process.env.NODE_ENV === 'production') {
      res.cookie('pod-session', session.sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/',
      });
    }

    res.json({
      success: true,
      sessionToken: session.sessionToken, // Always return for localStorage
      user: {
        id: user.id,
        email: user.email,
        roles: user.userRoles.map(ur => ur.roleKey),
      },
      redirectTo: '/admin'
    });

  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({
      error: 'Failed to verify OTP',
      details: error.message,
    });
  }
});

/**
 * POST /api/otp/resend
 * Resend OTP code
 */
router.post('/resend', async (req, res) => {
  // Just call the send endpoint
  return router.handle(
    Object.assign(req, { url: '/api/otp/send' }),
    res
  );
});

module.exports = router;

