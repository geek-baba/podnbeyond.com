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
    const { points, lifetimeStays, tier } = req.body;

    // Validate tier
    const validTiers = ['SILVER', 'GOLD', 'PLATINUM'];
    if (tier && !validTiers.includes(tier)) {
      return res.status(400).json({
        error: 'Invalid tier',
        details: 'Tier must be SILVER, GOLD, or PLATINUM'
      });
    }

    // Update loyalty account
    const updateData = {};
    if (points !== undefined) updateData.points = parseInt(points);
    if (lifetimeStays !== undefined) updateData.lifetimeStays = parseInt(lifetimeStays);
    if (tier) updateData.tier = tier;
    updateData.lastUpdated = new Date();

    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { id: parseInt(id) },
      data: updateData,
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
