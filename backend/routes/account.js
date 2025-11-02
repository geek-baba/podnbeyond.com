const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * GET /api/account/bookings
 * Get all bookings for the authenticated user
 */
router.get('/bookings', async (req, res) => {
  try {
    // Get session token from cookie
    const sessionToken = req.cookies['__Secure-next-auth.session-token'] || 
                        req.cookies['next-auth.session-token'];

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Find session and user
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: { include: { loyaltyAccount: true } } }
    });

    if (!session || session.expires < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Session expired'
      });
    }

    // Get user's bookings via loyalty account or email
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { email: session.user.email },
          { loyaltyAccountId: session.user.loyaltyAccount?.id }
        ]
      },
      include: {
        room: {
          include: {
            property: {
              select: {
                name: true,
                city: true
              }
            }
          }
        },
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json({
      success: true,
      bookings: bookings.map(b => ({
        ...b,
        checkIn: b.checkIn.toISOString(),
        checkOut: b.checkOut.toISOString(),
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      }))
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
});

/**
 * GET /api/account/points-ledger
 * Get points transaction history for the authenticated user
 */
router.get('/points-ledger', async (req, res) => {
  try {
    // Get session token from cookie
    const sessionToken = req.cookies['__Secure-next-auth.session-token'] || 
                        req.cookies['next-auth.session-token'];

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Find session and user
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });

    if (!session || session.expires < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Session expired'
      });
    }

    // Get points ledger for this user
    const ledger = await prisma.pointsLedger.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json({
      success: true,
      ledger: ledger.map(entry => ({
        ...entry,
        createdAt: entry.createdAt.toISOString()
      }))
    });

  } catch (error) {
    console.error('Error fetching points ledger:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch points ledger'
    });
  }
});

/**
 * GET /api/account/profile
 * Get user profile information
 */
router.get('/profile', async (req, res) => {
  try {
    const sessionToken = req.cookies['__Secure-next-auth.session-token'] || 
                        req.cookies['next-auth.session-token'];

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { 
        user: {
          include: {
            loyaltyAccount: true,
            userRoles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    if (!session || session.expires < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Session expired'
      });
    }

    return res.json({
      success: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        phone: session.user.phone,
        image: session.user.image,
        emailVerified: session.user.emailVerified,
        createdAt: session.user.createdAt.toISOString(),
        loyaltyAccount: session.user.loyaltyAccount ? {
          points: session.user.loyaltyAccount.points,
          tier: session.user.loyaltyAccount.tier
        } : null,
        roles: session.user.userRoles.map(ur => ({
          key: ur.roleKey,
          name: ur.role.name,
          scopeType: ur.scopeType,
          scopeId: ur.scopeId
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

module.exports = router;

