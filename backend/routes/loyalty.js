const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client lazily to avoid startup issues
let prisma;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * GET /api/loyalty/accounts
 * Get all loyalty accounts (admin only)
 */
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await getPrisma().loyaltyAccount.findMany({
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
    const { email, phone, addPoints, addStays, reason, tier } = req.body;

    // Validate tier
    const validTiers = ['SILVER', 'GOLD', 'PLATINUM'];
    if (tier && !validTiers.includes(tier)) {
      return res.status(400).json({
        error: 'Invalid tier',
        details: 'Tier must be SILVER, GOLD, or PLATINUM'
      });
    }

    // Get the loyalty account first
    const loyaltyAccount = await getPrisma().loyaltyAccount.findUnique({
      where: { id: parseInt(id) },
      include: { user: true }
    });

    if (!loyaltyAccount) {
      return res.status(404).json({ error: 'Loyalty account not found' });
    }

    // Update user info (email, phone) if provided
    if (email || phone !== undefined) {
      const userUpdateData = {};
      if (email) userUpdateData.email = email;
      if (phone !== undefined) userUpdateData.phone = phone || null;

      await getPrisma().user.update({
        where: { id: loyaltyAccount.userId },
        data: userUpdateData
      });
    }

    // Update loyalty account (ADD points/stays, not replace)
    const loyaltyUpdateData = {};
    if (addPoints && addPoints > 0) {
      loyaltyUpdateData.points = loyaltyAccount.points + parseInt(addPoints);
      
      // Create points ledger entry for audit trail
      await getPrisma().pointsLedger.create({
        data: {
          userId: loyaltyAccount.userId,
          points: parseInt(addPoints),
          reason: reason || 'Admin bonus adjustment',
          balanceAfter: loyaltyAccount.points + parseInt(addPoints)
        }
      });
    }
    if (addStays && addStays > 0) {
      loyaltyUpdateData.lifetimeStays = loyaltyAccount.lifetimeStays + parseInt(addStays);
    }
    if (tier) loyaltyUpdateData.tier = tier;
    loyaltyUpdateData.lastUpdated = new Date();

    const updatedAccount = await getPrisma().loyaltyAccount.update({
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

    // Log the changes
    if (addPoints && addPoints > 0) {
      console.log(`✅ Added ${addPoints} bonus points to Member #${updatedAccount.memberNumber} (${updatedAccount.user.email})`);
    }
    if (addStays && addStays > 0) {
      console.log(`✅ Added ${addStays} bonus stays to Member #${updatedAccount.memberNumber} (${updatedAccount.user.email})`);
    }

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
