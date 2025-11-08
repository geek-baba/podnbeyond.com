const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/loyalty/accounts
 * Get all loyalty accounts (admin only)
 */
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await prisma.loyaltyAccount.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform data to include user info at top level
    const transformedAccounts = accounts.map(acc => ({
      id: acc.id,
      memberNumber: acc.memberNumber,
      userId: acc.userId,
      userName: acc.user.name,
      userEmail: acc.user.email,
      userPhone: acc.user.phone,
      points: acc.points,
      lifetimeStays: acc.lifetimeStays,
      tier: acc.tier,
      lastUpdated: acc.lastUpdated,
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt
    }));

    res.json({
      success: true,
      accounts: transformedAccounts
    });
  } catch (error) {
    console.error('Error fetching loyalty accounts:', error);
    res.status(500).json({
      error: 'Failed to fetch loyalty accounts',
      details: error.message
    });
  }
});

module.exports = router;
