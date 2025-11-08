const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * GET /api/auth/session
 * Get current user session
 */
router.get('/session', async (req, res) => {
  try {
    // Check for session token in Authorization header (local dev) or cookie (prod)
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader?.replace('Bearer ', '') || req.cookies['pod-session'];
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Find session in database
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true
              }
            },
            loyaltyAccount: true
          }
        }
      }
    });

    if (!session || session.expires < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }

    // Return user data
    res.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        phone: session.user.phone, // Add phone field
        roles: session.user.userRoles.map(ur => ({
          key: ur.roleKey,
          name: ur.role?.name || ur.roleKey,
          scopeType: ur.scopeType,
          scopeId: ur.scopeId
        })),
        // Include full loyalty account object
        loyaltyAccount: session.user.loyaltyAccount ? {
          memberNumber: session.user.loyaltyAccount.memberNumber,
          tier: session.user.loyaltyAccount.tier,
          points: session.user.loyaltyAccount.points,
          lifetimeStays: session.user.loyaltyAccount.lifetimeStays
        } : null,
        // Keep backwards compatibility
        loyaltyTier: session.user.loyaltyAccount?.tier || 'SILVER',
        loyaltyPoints: session.user.loyaltyAccount?.points || 0
      },
      expires: session.expires
    });

  } catch (error) {
    console.error('Session fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch session', details: error.message });
  }
});

/**
 * POST /api/auth/signout
 * Sign out and delete session
 */
router.post('/signout', async (req, res) => {
  try {
    // Check for session token in Authorization header (local dev) or cookie (prod)
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader?.replace('Bearer ', '') || req.cookies['pod-session'];
    
    if (sessionToken) {
      // Delete session from database
      await prisma.session.deleteMany({
        where: { sessionToken }
      });
    }

    // Clear cookie
    res.clearCookie('pod-session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.json({ success: true, message: 'Signed out successfully' });

  } catch (error) {
    console.error('Sign out error:', error);
    res.status(500).json({ error: 'Failed to sign out', details: error.message });
  }
});

module.exports = router;
