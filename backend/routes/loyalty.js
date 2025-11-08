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

/**
 * PATCH /api/loyalty/accounts/:id
 * Update loyalty account (admin only)
 */
router.patch('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone, points, lifetimeStays, tier } = req.body;

    // Validate tier
    const validTiers = ['SILVER', 'GOLD', 'PLATINUM'];
    if (tier && !validTiers.includes(tier)) {
      return res.status(400).json({
        error: 'Invalid tier',
        details: 'Tier must be SILVER, GOLD, or PLATINUM'
      });
    }

    // Get the loyalty account first to find the user
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true }
    });

    if (!loyaltyAccount) {
      return res.status(404).json({ error: 'Loyalty account not found' });
    }

    // Update user info (email, phone) if provided
    if (email || phone !== undefined) {
      const userUpdateData = {};
      if (email) userUpdateData.email = email;
      if (phone !== undefined) userUpdateData.phone = phone || null;

      await prisma.user.update({
        where: { id: loyaltyAccount.userId },
        data: userUpdateData
      });
    }

    // Update loyalty account (points, stays, tier)
    const loyaltyUpdateData = {};
    if (points !== undefined) loyaltyUpdateData.points = parseInt(points);
    if (lifetimeStays !== undefined) loyaltyUpdateData.lifetimeStays = parseInt(lifetimeStays);
    if (tier) loyaltyUpdateData.tier = tier;
    loyaltyUpdateData.lastUpdated = new Date();

    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { id: parseInt(id) },
      data: loyaltyUpdateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true
          }
        }
      }
    });

    res.json({
      success: true,
      account: {
        id: updatedAccount.id,
        memberNumber: updatedAccount.memberNumber,
        userId: updatedAccount.userId,
        userName: updatedAccount.user.name,
        userEmail: updatedAccount.user.email,
        userPhone: updatedAccount.user.phone,
        points: updatedAccount.points,
        lifetimeStays: updatedAccount.lifetimeStays,
        tier: updatedAccount.tier,
        lastUpdated: updatedAccount.lastUpdated,
        createdAt: updatedAccount.createdAt,
        updatedAt: updatedAccount.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating loyalty account:', error);
    res.status(500).json({
      error: 'Failed to update loyalty account',
      details: error.message
    });
  }
});

module.exports = router;
