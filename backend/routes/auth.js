const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { getAccessibleProperties } = require('../lib/rbac');

const prisma = new PrismaClient();

/**
 * GET /api/auth/me
 * Returns current user's session, roles, scopes, and accessible properties
 */
router.get('/me', async (req, res) => {
  try {
    // Get session token from cookie or header
    const sessionToken = req.cookies['__Secure-next-auth.session-token'] || 
                        req.cookies['next-auth.session-token'] ||
                        req.headers['x-session-token'];

    if (!sessionToken) {
      return res.json({
        authenticated: false,
        user: null,
        roles: [],
        accessibleProperties: []
      });
    }

    // Find session
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
      return res.json({
        authenticated: false,
        user: null,
        roles: [],
        accessibleProperties: []
      });
    }

    // Get accessible properties for this user
    const accessibleProperties = await getAccessibleProperties(session.user.id);

    // Format response
    return res.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        phone: session.user.phone,
        loyaltyAccount: session.user.loyaltyAccount ? {
          id: session.user.loyaltyAccount.id,
          points: session.user.loyaltyAccount.points,
          tier: session.user.loyaltyAccount.tier
        } : null
      },
      roles: session.user.userRoles.map(ur => ({
        key: ur.roleKey,
        name: ur.role.name,
        scopeType: ur.scopeType,
        scopeId: ur.scopeId,
        permissions: ur.role.permissions
      })),
      accessibleProperties,
      session: {
        expires: session.expires
      }
    });

  } catch (error) {
    console.error('Error fetching user session:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user session'
    });
  }
});

/**
 * POST /api/auth/logout
 * Destroy session
 */
router.post('/logout', async (req, res) => {
  try {
    const sessionToken = req.cookies['__Secure-next-auth.session-token'] || 
                        req.cookies['next-auth.session-token'];

    if (sessionToken) {
      await prisma.session.delete({
        where: { sessionToken }
      }).catch(() => {
        // Session might not exist
      });
    }

    // Clear cookies
    res.clearCookie('__Secure-next-auth.session-token');
    res.clearCookie('next-auth.session-token');

    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

module.exports = router;

