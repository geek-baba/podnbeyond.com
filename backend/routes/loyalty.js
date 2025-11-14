const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const loyaltyService = require('../services/loyaltyService');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../lib/rbac');

// Initialize Prisma client lazily to avoid startup issues
let prisma;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * GET /api/loyalty/member/:id
 * Get member profile with tier progress
 * Public endpoint (can be accessed by member or admin)
 */
router.get('/member/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const loyaltyAccountId = parseInt(id, 10);

    if (isNaN(loyaltyAccountId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid loyalty account ID',
      });
    }

    const profile = await loyaltyService.getMemberProfile(loyaltyAccountId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error fetching member profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member profile',
      details: error.message,
    });
  }
});

/**
 * GET /api/loyalty/member-by-email/:email
 * Get member profile by email
 * Public endpoint
 */
router.get('/member-by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const user = await getPrisma().user.findUnique({
      where: { email },
      include: { loyaltyAccount: true },
    });

    if (!user || !user.loyaltyAccount) {
      return res.status(404).json({
        success: false,
        error: 'Loyalty account not found for this email',
      });
    }

    const profile = await loyaltyService.getMemberProfile(user.loyaltyAccount.id);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error fetching member profile by email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member profile',
      details: error.message,
    });
  }
});

/**
 * GET /api/loyalty/tier-progress/:id
 * Get tier progress for a member
 * Public endpoint
 */
router.get('/tier-progress/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const loyaltyAccountId = parseInt(id, 10);

    if (isNaN(loyaltyAccountId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid loyalty account ID',
      });
    }

    const account = await getPrisma().loyaltyAccount.findUnique({
      where: { id: loyaltyAccountId },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Loyalty account not found',
      });
    }

    const tierProgress = await loyaltyService.calculateTierProgress(account);

    res.json({
      success: true,
      data: tierProgress,
    });
  } catch (error) {
    console.error('Error calculating tier progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate tier progress',
      details: error.message,
    });
  }
});

/**
 * POST /api/loyalty/calculate-points
 * Calculate points for a booking (before completion)
 * Public endpoint (used during booking flow)
 */
router.post('/calculate-points', async (req, res) => {
  try {
    const {
      loyaltyAccountId,
      bookingId,
      roomRevenue,
      addOnRevenue = 0,
      checkIn,
      checkOut,
      bookingSource,
      propertyId,
      roomTypeId,
      isPrepaid = false,
      roomTypeCategory,
    } = req.body;

    if (!loyaltyAccountId || !roomRevenue || !checkIn || !checkOut || !bookingSource || !propertyId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: loyaltyAccountId, roomRevenue, checkIn, checkOut, bookingSource, propertyId',
      });
    }

    const pointsCalculation = await loyaltyService.calculatePoints({
      loyaltyAccountId: parseInt(loyaltyAccountId, 10),
      bookingId: bookingId ? parseInt(bookingId, 10) : null,
      roomRevenue: parseFloat(roomRevenue),
      addOnRevenue: parseFloat(addOnRevenue),
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      bookingSource,
      propertyId: parseInt(propertyId, 10),
      roomTypeId: roomTypeId ? parseInt(roomTypeId, 10) : null,
      isPrepaid: Boolean(isPrepaid),
      roomTypeCategory,
    });

    res.json({
      success: true,
      data: pointsCalculation,
    });
  } catch (error) {
    console.error('Error calculating points:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate points',
      details: error.message,
    });
  }
});

/**
 * GET /api/loyalty/points-history/:id
 * Get points history for a member
 * Public endpoint
 */
router.get('/points-history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const loyaltyAccountId = parseInt(id, 10);

    if (isNaN(loyaltyAccountId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid loyalty account ID',
      });
    }

    const account = await getPrisma().loyaltyAccount.findUnique({
      where: { id: loyaltyAccountId },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Loyalty account not found',
      });
    }

    const ledgerEntries = await getPrisma().pointsLedger.findMany({
      where: { loyaltyAccountId },
      include: {
        booking: {
          select: {
            id: true,
            confirmationNumber: true,
            checkIn: true,
            checkOut: true,
          },
        },
        rule: {
          select: {
            id: true,
            name: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        referral: {
          select: {
            id: true,
            referralCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10),
      skip: parseInt(offset, 10),
    });

    const total = await getPrisma().pointsLedger.count({
      where: { loyaltyAccountId },
    });

    res.json({
      success: true,
      data: {
        entries: ledgerEntries,
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      },
    });
  } catch (error) {
    console.error('Error fetching points history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch points history',
      details: error.message,
    });
  }
});

/**
 * GET /api/loyalty/tier-configs
 * Get all tier configurations
 * Public endpoint
 */
router.get('/tier-configs', async (req, res) => {
  try {
    const tierConfigs = await getPrisma().tierConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({
      success: true,
      data: tierConfigs,
    });
  } catch (error) {
    console.error('Error fetching tier configs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tier configurations',
      details: error.message,
    });
  }
});

/**
 * GET /api/loyalty/tier-config/:tier
 * Get specific tier configuration
 * Public endpoint
 */
router.get('/tier-config/:tier', async (req, res) => {
  try {
    const { tier } = req.params;

    const tierConfig = await loyaltyService.getTierConfig(tier);

    if (!tierConfig) {
      return res.status(404).json({
        success: false,
        error: 'Tier configuration not found',
      });
    }

    res.json({
      success: true,
      data: tierConfig,
    });
  } catch (error) {
    console.error('Error fetching tier config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tier configuration',
      details: error.message,
    });
  }
});

/**
 * GET /api/loyalty/accounts
 * Get all loyalty accounts (admin only)
 */
router.get('/accounts', authenticate, requirePermission('loyalty:read'), async (req, res) => {
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
router.patch('/accounts/:id', authenticate, requirePermission('loyalty:write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone, addPoints, addStays, addNights, addSpend, reason, tier } = req.body;

    // Validate tier
    const validTiers = ['MEMBER', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
    if (tier && !validTiers.includes(tier)) {
      return res.status(400).json({
        error: 'Invalid tier',
        details: 'Tier must be MEMBER, SILVER, GOLD, PLATINUM, or DIAMOND',
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

    // Update loyalty account (ADD points/stays/nights/spend, not replace)
    const loyaltyUpdateData = {};
    
    // Use loyalty service to award points (handles ledger and tier check)
    if (addPoints && addPoints > 0) {
      await loyaltyService.awardPoints({
        loyaltyAccountId: loyaltyAccount.id,
        points: parseInt(addPoints),
        reason: reason || 'Admin bonus adjustment',
        createdBy: req.user?.id,
      });
    }
    
    if (addStays && addStays > 0) {
      loyaltyUpdateData.lifetimeStays = loyaltyAccount.lifetimeStays + parseInt(addStays);
    }
    if (addNights && addNights > 0) {
      loyaltyUpdateData.lifetimeNights = loyaltyAccount.lifetimeNights + parseInt(addNights);
    }
    if (addSpend && addSpend > 0) {
      loyaltyUpdateData.lifetimeSpend = loyaltyAccount.lifetimeSpend + parseFloat(addSpend);
    }
    if (tier) loyaltyUpdateData.tier = tier;
    loyaltyUpdateData.lastUpdated = new Date();

    // Only update if there are changes (points are handled separately)
    let updatedAccount = loyaltyAccount;
    if (Object.keys(loyaltyUpdateData).length > 0) {
      updatedAccount = await getPrisma().loyaltyAccount.update({
        where: { id: parseInt(id) },
        data: loyaltyUpdateData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      // Check for tier upgrade after updating metrics
      if (addStays || addNights || addSpend) {
        await loyaltyService.checkAndUpdateTier(parseInt(id));
        // Reload account to get updated tier
        updatedAccount = await getPrisma().loyaltyAccount.findUnique({
          where: { id: parseInt(id) },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                phone: true,
              },
            },
          },
        });
      }
    } else {
      // Reload account to get updated points if points were added
      if (addPoints) {
        updatedAccount = await getPrisma().loyaltyAccount.findUnique({
          where: { id: parseInt(id) },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                phone: true,
              },
            },
          },
        });
      }
    }

    // Log the changes
    if (addPoints && addPoints > 0) {
      console.log(`✅ Added ${addPoints} bonus points to Member #${updatedAccount.memberNumber} (${updatedAccount.user.email})`);
    }
    if (addStays && addStays > 0) {
      console.log(`✅ Added ${addStays} bonus stays to Member #${updatedAccount.memberNumber} (${updatedAccount.user.email})`);
    }
    if (addNights && addNights > 0) {
      console.log(`✅ Added ${addNights} bonus nights to Member #${updatedAccount.memberNumber} (${updatedAccount.user.email})`);
    }
    if (addSpend && addSpend > 0) {
      console.log(`✅ Added ₹${addSpend} to lifetime spend for Member #${updatedAccount.memberNumber} (${updatedAccount.user.email})`);
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
        lifetimeNights: updatedAccount.lifetimeNights,
        lifetimeSpend: updatedAccount.lifetimeSpend,
        tier: updatedAccount.tier,
        lastUpdated: updatedAccount.lastUpdated,
        createdAt: updatedAccount.createdAt,
        updatedAt: updatedAccount.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating loyalty account:', error);
    res.status(500).json({
      error: 'Failed to update loyalty account',
      details: error.message
    });
  }
});

/**
 * ============================================
 * POINTS RULES MANAGEMENT (Admin Only)
 * ============================================
 */

/**
 * GET /api/loyalty/points-rules
 * Get all points rules (admin only)
 */
router.get('/points-rules', authenticate, requirePermission('loyalty:read'), async (req, res) => {
  try {
    const { isActive, ruleType } = req.query;
    
    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (ruleType) {
      where.ruleType = ruleType;
    }

    const rules = await getPrisma().pointsRule.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    res.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    console.error('Error fetching points rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch points rules',
      details: error.message,
    });
  }
});

/**
 * GET /api/loyalty/points-rules/:id
 * Get a specific points rule (admin only)
 */
router.get('/points-rules/:id', authenticate, requirePermission('loyalty:read'), async (req, res) => {
  try {
    const { id } = req.params;
    const ruleId = parseInt(id, 10);

    if (isNaN(ruleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid rule ID',
      });
    }

    const rule = await getPrisma().pointsRule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Points rule not found',
      });
    }

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error('Error fetching points rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch points rule',
      details: error.message,
    });
  }
});

/**
 * POST /api/loyalty/points-rules
 * Create a new points rule (admin only)
 */
router.post('/points-rules', authenticate, requirePermission('loyalty:write'), async (req, res) => {
  try {
    const {
      name,
      description,
      ruleType,
      conditions,
      actions,
      propertyIds = [],
      tierIds = [],
      priority = 0,
      startDate,
      endDate,
      isActive = true,
    } = req.body;

    // Validation
    if (!name || !ruleType || !conditions || !actions) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, ruleType, conditions, actions',
      });
    }

    const validRuleTypes = ['BASE', 'BONUS', 'CAMPAIGN', 'SEASONAL'];
    if (!validRuleTypes.includes(ruleType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ruleType. Must be one of: BASE, BONUS, CAMPAIGN, SEASONAL',
      });
    }

    // Validate conditions and actions are objects
    if (typeof conditions !== 'object' || typeof actions !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'conditions and actions must be JSON objects',
      });
    }

    const rule = await getPrisma().pointsRule.create({
      data: {
        name,
        description,
        ruleType,
        conditions,
        actions,
        propertyIds: Array.isArray(propertyIds) ? propertyIds : [],
        tierIds: Array.isArray(tierIds) ? tierIds : [],
        priority: parseInt(priority, 10) || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: Boolean(isActive),
      },
    });

    res.status(201).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error('Error creating points rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create points rule',
      details: error.message,
    });
  }
});

/**
 * PUT /api/loyalty/points-rules/:id
 * Update a points rule (admin only)
 */
router.put('/points-rules/:id', authenticate, requirePermission('loyalty:write'), async (req, res) => {
  try {
    const { id } = req.params;
    const ruleId = parseInt(id, 10);

    if (isNaN(ruleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid rule ID',
      });
    }

    const {
      name,
      description,
      ruleType,
      conditions,
      actions,
      propertyIds,
      tierIds,
      priority,
      startDate,
      endDate,
      isActive,
    } = req.body;

    // Check if rule exists
    const existingRule = await getPrisma().pointsRule.findUnique({
      where: { id: ruleId },
    });

    if (!existingRule) {
      return res.status(404).json({
        success: false,
        error: 'Points rule not found',
      });
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (ruleType !== undefined) {
      const validRuleTypes = ['BASE', 'BONUS', 'CAMPAIGN', 'SEASONAL'];
      if (!validRuleTypes.includes(ruleType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid ruleType. Must be one of: BASE, BONUS, CAMPAIGN, SEASONAL',
        });
      }
      updateData.ruleType = ruleType;
    }
    if (conditions !== undefined) {
      if (typeof conditions !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'conditions must be a JSON object',
        });
      }
      updateData.conditions = conditions;
    }
    if (actions !== undefined) {
      if (typeof actions !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'actions must be a JSON object',
        });
      }
      updateData.actions = actions;
    }
    if (propertyIds !== undefined) {
      updateData.propertyIds = Array.isArray(propertyIds) ? propertyIds : [];
    }
    if (tierIds !== undefined) {
      updateData.tierIds = Array.isArray(tierIds) ? tierIds : [];
    }
    if (priority !== undefined) updateData.priority = parseInt(priority, 10) || 0;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedRule = await getPrisma().pointsRule.update({
      where: { id: ruleId },
      data: updateData,
    });

    res.json({
      success: true,
      data: updatedRule,
    });
  } catch (error) {
    console.error('Error updating points rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update points rule',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/loyalty/points-rules/:id
 * Delete a points rule (admin only)
 */
router.delete('/points-rules/:id', authenticate, requirePermission('loyalty:write'), async (req, res) => {
  try {
    const { id } = req.params;
    const ruleId = parseInt(id, 10);

    if (isNaN(ruleId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid rule ID',
      });
    }

    // Check if rule exists
    const existingRule = await getPrisma().pointsRule.findUnique({
      where: { id: ruleId },
    });

    if (!existingRule) {
      return res.status(404).json({
        success: false,
        error: 'Points rule not found',
      });
    }

    // Delete the rule
    await getPrisma().pointsRule.delete({
      where: { id: ruleId },
    });

    res.json({
      success: true,
      message: 'Points rule deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting points rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete points rule',
      details: error.message,
    });
  }
});

/**
 * ============================================
 * PERKS MANAGEMENT (Admin Only)
 * ============================================
 */

/**
 * GET /api/loyalty/perks
 * Get all perks (admin only)
 */
router.get('/perks', authenticate, requirePermission('loyalty:read'), async (req, res) => {
  try {
    const { isActive, perkType } = req.query;
    
    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (perkType) {
      where.perkType = perkType;
    }

    const perks = await getPrisma().perk.findMany({
      where,
      include: {
        _count: {
          select: {
            perkRedemptions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: perks,
    });
  } catch (error) {
    console.error('Error fetching perks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch perks',
      details: error.message,
    });
  }
});

/**
 * GET /api/loyalty/perks/:id
 * Get a specific perk (admin only)
 */
router.get('/perks/:id', authenticate, requirePermission('loyalty:read'), async (req, res) => {
  try {
    const { id } = req.params;
    const perkId = parseInt(id, 10);

    if (isNaN(perkId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid perk ID',
      });
    }

    const perk = await getPrisma().perk.findUnique({
      where: { id: perkId },
      include: {
        _count: {
          select: {
            perkRedemptions: true,
          },
        },
      },
    });

    if (!perk) {
      return res.status(404).json({
        success: false,
        error: 'Perk not found',
      });
    }

    res.json({
      success: true,
      data: perk,
    });
  } catch (error) {
    console.error('Error fetching perk:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch perk',
      details: error.message,
    });
  }
});

/**
 * POST /api/loyalty/perks
 * Create a new perk (admin only)
 */
router.post('/perks', authenticate, requirePermission('loyalty:write'), async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      perkType,
      conditions,
      value,
      propertyIds = [],
      tierIds = [],
      maxUsagePerMember,
      maxUsagePerStay,
      totalCapacity,
      startDate,
      endDate,
      isActive = true,
    } = req.body;

    // Validation
    if (!code || !name || !perkType || !conditions || !value) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: code, name, perkType, conditions, value',
      });
    }

    const validPerkTypes = ['BENEFIT', 'DISCOUNT', 'UPGRADE', 'VOUCHER', 'POINTS_BONUS'];
    if (!validPerkTypes.includes(perkType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid perkType. Must be one of: BENEFIT, DISCOUNT, UPGRADE, VOUCHER, POINTS_BONUS',
      });
    }

    // Validate conditions and value are objects
    if (typeof conditions !== 'object' || typeof value !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'conditions and value must be JSON objects',
      });
    }

    // Check if code already exists
    const existing = await getPrisma().perk.findUnique({
      where: { code },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Perk code already exists',
      });
    }

    const perk = await getPrisma().perk.create({
      data: {
        code,
        name,
        description,
        perkType,
        conditions,
        value,
        propertyIds: Array.isArray(propertyIds) ? propertyIds : [],
        tierIds: Array.isArray(tierIds) ? tierIds : [],
        maxUsagePerMember: maxUsagePerMember ? parseInt(maxUsagePerMember, 10) : null,
        maxUsagePerStay: maxUsagePerStay ? parseInt(maxUsagePerStay, 10) : null,
        totalCapacity: totalCapacity ? parseInt(totalCapacity, 10) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: Boolean(isActive),
      },
    });

    res.status(201).json({
      success: true,
      data: perk,
    });
  } catch (error) {
    console.error('Error creating perk:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create perk',
      details: error.message,
    });
  }
});

/**
 * PUT /api/loyalty/perks/:id
 * Update a perk (admin only)
 */
router.put('/perks/:id', authenticate, requirePermission('loyalty:write'), async (req, res) => {
  try {
    const { id } = req.params;
    const perkId = parseInt(id, 10);

    if (isNaN(perkId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid perk ID',
      });
    }

    const {
      code,
      name,
      description,
      perkType,
      conditions,
      value,
      propertyIds,
      tierIds,
      maxUsagePerMember,
      maxUsagePerStay,
      totalCapacity,
      startDate,
      endDate,
      isActive,
    } = req.body;

    // Check if perk exists
    const existingPerk = await getPrisma().perk.findUnique({
      where: { id: perkId },
    });

    if (!existingPerk) {
      return res.status(404).json({
        success: false,
        error: 'Perk not found',
      });
    }

    // Check if code is being changed and if it conflicts
    if (code && code !== existingPerk.code) {
      const codeExists = await getPrisma().perk.findUnique({
        where: { code },
      });

      if (codeExists) {
        return res.status(400).json({
          success: false,
          error: 'Perk code already exists',
        });
      }
    }

    // Build update data
    const updateData = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (perkType !== undefined) {
      const validPerkTypes = ['BENEFIT', 'DISCOUNT', 'UPGRADE', 'VOUCHER', 'POINTS_BONUS'];
      if (!validPerkTypes.includes(perkType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid perkType. Must be one of: BENEFIT, DISCOUNT, UPGRADE, VOUCHER, POINTS_BONUS',
        });
      }
      updateData.perkType = perkType;
    }
    if (conditions !== undefined) {
      if (typeof conditions !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'conditions must be a JSON object',
        });
      }
      updateData.conditions = conditions;
    }
    if (value !== undefined) {
      if (typeof value !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'value must be a JSON object',
        });
      }
      updateData.value = value;
    }
    if (propertyIds !== undefined) {
      updateData.propertyIds = Array.isArray(propertyIds) ? propertyIds : [];
    }
    if (tierIds !== undefined) {
      updateData.tierIds = Array.isArray(tierIds) ? tierIds : [];
    }
    if (maxUsagePerMember !== undefined) {
      updateData.maxUsagePerMember = maxUsagePerMember ? parseInt(maxUsagePerMember, 10) : null;
    }
    if (maxUsagePerStay !== undefined) {
      updateData.maxUsagePerStay = maxUsagePerStay ? parseInt(maxUsagePerStay, 10) : null;
    }
    if (totalCapacity !== undefined) {
      updateData.totalCapacity = totalCapacity ? parseInt(totalCapacity, 10) : null;
    }
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedPerk = await getPrisma().perk.update({
      where: { id: perkId },
      data: updateData,
    });

    res.json({
      success: true,
      data: updatedPerk,
    });
  } catch (error) {
    console.error('Error updating perk:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update perk',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/loyalty/perks/:id
 * Delete a perk (admin only)
 */
router.delete('/perks/:id', authenticate, requirePermission('loyalty:write'), async (req, res) => {
  try {
    const { id } = req.params;
    const perkId = parseInt(id, 10);

    if (isNaN(perkId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid perk ID',
      });
    }

    // Check if perk exists
    const existingPerk = await getPrisma().perk.findUnique({
      where: { id: perkId },
    });

    if (!existingPerk) {
      return res.status(404).json({
        success: false,
        error: 'Perk not found',
      });
    }

    // Check if perk has redemptions
    const redemptionCount = await getPrisma().perkRedemption.count({
      where: { perkId },
    });

    if (redemptionCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete perk with existing redemptions. Deactivate it instead.',
      });
    }

    // Delete the perk
    await getPrisma().perk.delete({
      where: { id: perkId },
    });

    res.json({
      success: true,
      message: 'Perk deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting perk:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete perk',
      details: error.message,
    });
  }
});

/**
 * ============================================
 * PERK REDEMPTION ENDPOINTS
 * ============================================
 */

/**
 * GET /api/loyalty/perks/eligible
 * Get eligible perks for a member and booking context
 */
router.post('/perks/eligible', authenticate, async (req, res) => {
  try {
    const {
      loyaltyAccountId,
      bookingSource,
      stayLength,
      propertyId,
      checkIn,
      bookingId,
    } = req.body;

    if (!loyaltyAccountId || !bookingSource || !stayLength || !propertyId || !checkIn) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: loyaltyAccountId, bookingSource, stayLength, propertyId, checkIn',
      });
    }

    const eligiblePerks = await loyaltyService.getEligiblePerks({
      loyaltyAccountId: parseInt(loyaltyAccountId, 10),
      bookingContext: {
        bookingSource,
        stayLength: parseInt(stayLength, 10),
        propertyId: parseInt(propertyId, 10),
        checkIn: new Date(checkIn),
        bookingId: bookingId ? parseInt(bookingId, 10) : null,
      },
    });

    res.json({
      success: true,
      data: eligiblePerks,
    });
  } catch (error) {
    console.error('Error fetching eligible perks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch eligible perks',
      details: error.message,
    });
  }
});

/**
 * POST /api/loyalty/perks/redeem
 * Redeem a perk for a booking
 */
router.post('/perks/redeem', authenticate, async (req, res) => {
  try {
    const {
      perkId,
      loyaltyAccountId,
      bookingId,
      valueApplied,
      metadata,
    } = req.body;

    if (!perkId || !loyaltyAccountId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: perkId, loyaltyAccountId',
      });
    }

    const redemption = await loyaltyService.redeemPerk({
      perkId: parseInt(perkId, 10),
      loyaltyAccountId: parseInt(loyaltyAccountId, 10),
      bookingId: bookingId ? parseInt(bookingId, 10) : null,
      valueApplied,
      metadata,
    });

    res.json({
      success: true,
      data: redemption,
    });
  } catch (error) {
    console.error('Error redeeming perk:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to redeem perk',
      details: error.message,
    });
  }
});

/**
 * GET /api/loyalty/member/:id/perk-redemptions
 * Get perk redemptions for a member
 */
router.get('/member/:id/perk-redemptions', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;
    const loyaltyAccountId = parseInt(id, 10);

    if (isNaN(loyaltyAccountId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid loyalty account ID',
      });
    }

    const result = await loyaltyService.getMemberPerkRedemptions({
      loyaltyAccountId,
      status,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching perk redemptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch perk redemptions',
      details: error.message,
    });
  }
});

/**
 * ============================================
 * CAMPAIGNS MANAGEMENT (Admin Only)
 * ============================================
 */

/**
 * GET /api/loyalty/campaigns
 * Get all campaigns (admin only)
 */
router.get('/campaigns', authenticate, requirePermission('loyalty:read'), async (req, res) => {
  try {
    const { isActive, campaignType } = req.query;
    
    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (campaignType) {
      where.campaignType = campaignType;
    }

    const campaigns = await getPrisma().campaign.findMany({
      where,
      include: {
        _count: {
          select: {
            pointsLedgerEntries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaigns',
      details: error.message,
    });
  }
});

/**
 * GET /api/loyalty/campaigns/:id
 * Get a specific campaign (admin only)
 */
router.get('/campaigns/:id', authenticate, requirePermission('loyalty:read'), async (req, res) => {
  try {
    const { id } = req.params;
    const campaignId = parseInt(id, 10);

    if (isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign ID',
      });
    }

    const campaign = await getPrisma().campaign.findUnique({
      where: { id: campaignId },
      include: {
        _count: {
          select: {
            pointsLedgerEntries: true,
          },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign',
      details: error.message,
    });
  }
});

/**
 * POST /api/loyalty/campaigns
 * Create a new campaign (admin only)
 */
router.post('/campaigns', authenticate, requirePermission('loyalty:write'), async (req, res) => {
  try {
    const {
      name,
      description,
      campaignType,
      rules,
      propertyIds = [],
      tierIds = [],
      startDate,
      endDate,
      isActive = true,
    } = req.body;

    // Validation
    if (!name || !campaignType || !rules || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, campaignType, rules, startDate, endDate',
      });
    }

    const validCampaignTypes = ['POINTS_MULTIPLIER', 'BONUS_POINTS', 'PERK_GIVEAWAY'];
    if (!validCampaignTypes.includes(campaignType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaignType. Must be one of: POINTS_MULTIPLIER, BONUS_POINTS, PERK_GIVEAWAY',
      });
    }

    // Validate rules is an object
    if (typeof rules !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'rules must be a JSON object',
      });
    }

    const campaign = await getPrisma().campaign.create({
      data: {
        name,
        description,
        campaignType,
        rules,
        propertyIds: Array.isArray(propertyIds) ? propertyIds : [],
        tierIds: Array.isArray(tierIds) ? tierIds : [],
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: Boolean(isActive),
      },
    });

    res.status(201).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create campaign',
      details: error.message,
    });
  }
});

/**
 * PUT /api/loyalty/campaigns/:id
 * Update a campaign (admin only)
 */
router.put('/campaigns/:id', authenticate, requirePermission('loyalty:write'), async (req, res) => {
  try {
    const { id } = req.params;
    const campaignId = parseInt(id, 10);

    if (isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign ID',
      });
    }

    const {
      name,
      description,
      campaignType,
      rules,
      propertyIds,
      tierIds,
      startDate,
      endDate,
      isActive,
    } = req.body;

    // Check if campaign exists
    const existingCampaign = await getPrisma().campaign.findUnique({
      where: { id: campaignId },
    });

    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (campaignType !== undefined) {
      const validCampaignTypes = ['POINTS_MULTIPLIER', 'BONUS_POINTS', 'PERK_GIVEAWAY'];
      if (!validCampaignTypes.includes(campaignType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaignType. Must be one of: POINTS_MULTIPLIER, BONUS_POINTS, PERK_GIVEAWAY',
        });
      }
      updateData.campaignType = campaignType;
    }
    if (rules !== undefined) {
      if (typeof rules !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'rules must be a JSON object',
        });
      }
      updateData.rules = rules;
    }
    if (propertyIds !== undefined) {
      updateData.propertyIds = Array.isArray(propertyIds) ? propertyIds : [];
    }
    if (tierIds !== undefined) {
      updateData.tierIds = Array.isArray(tierIds) ? tierIds : [];
    }
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedCampaign = await getPrisma().campaign.update({
      where: { id: campaignId },
      data: updateData,
    });

    res.json({
      success: true,
      data: updatedCampaign,
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update campaign',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/loyalty/campaigns/:id
 * Delete a campaign (admin only)
 */
router.delete('/campaigns/:id', authenticate, requirePermission('loyalty:write'), async (req, res) => {
  try {
    const { id } = req.params;
    const campaignId = parseInt(id, 10);

    if (isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign ID',
      });
    }

    // Check if campaign exists
    const existingCampaign = await getPrisma().campaign.findUnique({
      where: { id: campaignId },
    });

    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
    }

    // Check if campaign has points ledger entries
    const ledgerCount = await getPrisma().pointsLedger.count({
      where: { campaignId },
    });

    if (ledgerCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete campaign with existing points ledger entries. Deactivate it instead.',
      });
    }

    // Delete the campaign
    await getPrisma().campaign.delete({
      where: { id: campaignId },
    });

    res.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete campaign',
      details: error.message,
    });
  }
});

/**
 * GET /api/loyalty/campaigns/:id/analytics
 * Get campaign analytics (admin only)
 */
router.get('/campaigns/:id/analytics', authenticate, requirePermission('loyalty:read'), async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const campaignId = parseInt(id, 10);

    if (isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign ID',
      });
    }

    const analytics = await loyaltyService.getCampaignAnalytics({
      campaignId,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    });

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign analytics',
      details: error.message,
    });
  }
});

/**
 * GET /api/loyalty/member/:id/campaigns
 * Get active campaigns for a member
 */
router.get('/member/:id/campaigns', async (req, res) => {
  try {
    const { id } = req.params;
    const { propertyId } = req.query;
    const loyaltyAccountId = parseInt(id, 10);

    if (isNaN(loyaltyAccountId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid loyalty account ID',
      });
    }

    const account = await getPrisma().loyaltyAccount.findUnique({
      where: { id: loyaltyAccountId },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Loyalty account not found',
      });
    }

    const campaigns = await loyaltyService.getMemberCampaigns({
      memberTier: account.tier,
      propertyId: propertyId ? parseInt(propertyId, 10) : null,
    });

    res.json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    console.error('Error fetching member campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member campaigns',
      details: error.message,
    });
  }
});

/**
 * ============================================
 * REDEMPTION ITEMS MANAGEMENT (Admin Only)
 * ============================================
 */

/**
 * GET /api/loyalty/redemption-items
 * Get all redemption items (admin only)
 */
router.get('/redemption-items', authenticate, requirePermission('loyalty:read'), async (req, res) => {
  try {
    const { isActive, itemType } = req.query;
    
    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (itemType) {
      where.itemType = itemType;
    }

    const items = await getPrisma().redemptionItem.findMany({
      where,
      include: {
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
      orderBy: { basePointsRequired: 'asc' },
    });

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Error fetching redemption items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch redemption items',
      details: error.message,
    });
  }
});

/**
 * GET /api/loyalty/redemption-items/:id
 * Get a specific redemption item (admin only)
 */
router.get('/redemption-items/:id', authenticate, requirePermission('loyalty:read'), async (req, res) => {
  try {
    const { id } = req.params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid item ID',
      });
    }

    const item = await getPrisma().redemptionItem.findUnique({
      where: { id: itemId },
      include: {
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Redemption item not found',
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error fetching redemption item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch redemption item',
      details: error.message,
    });
  }
});

/**
 * POST /api/loyalty/redemption-items
 * Create a new redemption item (admin only)
 */
router.post('/redemption-items', authenticate, requirePermission('loyalty:write'), async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      itemType,
      basePointsRequired,
      dynamicPricing,
      value,
      propertyIds = [],
      tierIds = [],
      roomTypeIds = [],
      totalQuantity,
      availableQuantity,
      startDate,
      endDate,
      isActive = true,
    } = req.body;

    // Validation
    if (!code || !name || !itemType || !basePointsRequired || !value) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: code, name, itemType, basePointsRequired, value',
      });
    }

    const validItemTypes = ['FREE_NIGHT', 'UPGRADE', 'VOUCHER', 'DISCOUNT', 'CASH'];
    if (!validItemTypes.includes(itemType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid itemType. Must be one of: FREE_NIGHT, UPGRADE, VOUCHER, DISCOUNT, CASH',
      });
    }

    // Validate value is an object
    if (typeof value !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'value must be a JSON object',
      });
    }

    // Check if code already exists
    const existing = await getPrisma().redemptionItem.findUnique({
      where: { code },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Redemption item code already exists',
      });
    }

    const item = await getPrisma().redemptionItem.create({
      data: {
        code,
        name,
        description,
        itemType,
        basePointsRequired: parseInt(basePointsRequired, 10),
        dynamicPricing: dynamicPricing || null,
        value,
        propertyIds: Array.isArray(propertyIds) ? propertyIds : [],
        tierIds: Array.isArray(tierIds) ? tierIds : [],
        roomTypeIds: Array.isArray(roomTypeIds) ? roomTypeIds : [],
        totalQuantity: totalQuantity ? parseInt(totalQuantity, 10) : null,
        availableQuantity: availableQuantity ? parseInt(availableQuantity, 10) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: Boolean(isActive),
      },
    });

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error creating redemption item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create redemption item',
      details: error.message,
    });
  }
});

/**
 * PUT /api/loyalty/redemption-items/:id
 * Update a redemption item (admin only)
 */
router.put('/redemption-items/:id', authenticate, requirePermission('loyalty:write'), async (req, res) => {
  try {
    const { id } = req.params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid item ID',
      });
    }

    const {
      code,
      name,
      description,
      itemType,
      basePointsRequired,
      dynamicPricing,
      value,
      propertyIds,
      tierIds,
      roomTypeIds,
      totalQuantity,
      availableQuantity,
      startDate,
      endDate,
      isActive,
    } = req.body;

    // Check if item exists
    const existingItem = await getPrisma().redemptionItem.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: 'Redemption item not found',
      });
    }

    // Check if code is being changed and if it conflicts
    if (code && code !== existingItem.code) {
      const codeExists = await getPrisma().redemptionItem.findUnique({
        where: { code },
      });

      if (codeExists) {
        return res.status(400).json({
          success: false,
          error: 'Redemption item code already exists',
        });
      }
    }

    // Build update data
    const updateData = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (itemType !== undefined) {
      const validItemTypes = ['FREE_NIGHT', 'UPGRADE', 'VOUCHER', 'DISCOUNT', 'CASH'];
      if (!validItemTypes.includes(itemType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid itemType. Must be one of: FREE_NIGHT, UPGRADE, VOUCHER, DISCOUNT, CASH',
        });
      }
      updateData.itemType = itemType;
    }
    if (basePointsRequired !== undefined) updateData.basePointsRequired = parseInt(basePointsRequired, 10);
    if (dynamicPricing !== undefined) updateData.dynamicPricing = dynamicPricing;
    if (value !== undefined) {
      if (typeof value !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'value must be a JSON object',
        });
      }
      updateData.value = value;
    }
    if (propertyIds !== undefined) updateData.propertyIds = Array.isArray(propertyIds) ? propertyIds : [];
    if (tierIds !== undefined) updateData.tierIds = Array.isArray(tierIds) ? tierIds : [];
    if (roomTypeIds !== undefined) updateData.roomTypeIds = Array.isArray(roomTypeIds) ? roomTypeIds : [];
    if (totalQuantity !== undefined) updateData.totalQuantity = totalQuantity ? parseInt(totalQuantity, 10) : null;
    if (availableQuantity !== undefined) updateData.availableQuantity = availableQuantity ? parseInt(availableQuantity, 10) : null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedItem = await getPrisma().redemptionItem.update({
      where: { id: itemId },
      data: updateData,
    });

    res.json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    console.error('Error updating redemption item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update redemption item',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/loyalty/redemption-items/:id
 * Delete a redemption item (admin only)
 */
router.delete('/redemption-items/:id', authenticate, requirePermission('loyalty:write'), async (req, res) => {
  try {
    const { id } = req.params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid item ID',
      });
    }

    // Check if item exists
    const existingItem = await getPrisma().redemptionItem.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: 'Redemption item not found',
      });
    }

    // Check if item has redemptions
    const redemptionCount = await getPrisma().redemptionTransaction.count({
      where: { itemId },
    });

    if (redemptionCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete redemption item with existing redemptions. Deactivate it instead.',
      });
    }

    // Delete the item
    await getPrisma().redemptionItem.delete({
      where: { id: itemId },
    });

    res.json({
      success: true,
      message: 'Redemption item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting redemption item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete redemption item',
      details: error.message,
    });
  }
});

/**
 * ============================================
 * REDEMPTION TRANSACTIONS
 * ============================================
 */

/**
 * GET /api/loyalty/member/:id/redemption-catalog
 * Get redemption catalog for a member
 */
router.get('/member/:id/redemption-catalog', async (req, res) => {
  try {
    const { id } = req.params;
    const { propertyId, roomTypeId } = req.query;
    const loyaltyAccountId = parseInt(id, 10);

    if (isNaN(loyaltyAccountId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid loyalty account ID',
      });
    }

    const catalog = await loyaltyService.getRedemptionCatalog({
      loyaltyAccountId,
      propertyId: propertyId ? parseInt(propertyId, 10) : null,
      roomTypeId: roomTypeId ? parseInt(roomTypeId, 10) : null,
    });

    res.json({
      success: true,
      data: catalog,
    });
  } catch (error) {
    console.error('Error fetching redemption catalog:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch redemption catalog',
      details: error.message,
    });
  }
});

/**
 * POST /api/loyalty/redemptions/validate
 * Validate a redemption before processing
 */
router.post('/redemptions/validate', authenticate, async (req, res) => {
  try {
    const {
      itemId,
      loyaltyAccountId,
      propertyId,
      roomTypeId,
      redemptionDate,
    } = req.body;

    if (!itemId || !loyaltyAccountId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: itemId, loyaltyAccountId',
      });
    }

    const validation = await loyaltyService.validateRedemption({
      itemId: parseInt(itemId, 10),
      loyaltyAccountId: parseInt(loyaltyAccountId, 10),
      context: {
        propertyId: propertyId ? parseInt(propertyId, 10) : null,
        roomTypeId: roomTypeId ? parseInt(roomTypeId, 10) : null,
        redemptionDate: redemptionDate ? new Date(redemptionDate) : new Date(),
      },
    });

    res.json({
      success: validation.valid,
      data: validation,
    });
  } catch (error) {
    console.error('Error validating redemption:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate redemption',
      details: error.message,
    });
  }
});

/**
 * POST /api/loyalty/redemptions/process
 * Process a redemption transaction
 */
router.post('/redemptions/process', authenticate, async (req, res) => {
  try {
    const {
      itemId,
      loyaltyAccountId,
      bookingId,
      propertyId,
      roomTypeId,
      redemptionDate,
      metadata,
    } = req.body;

    if (!itemId || !loyaltyAccountId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: itemId, loyaltyAccountId',
      });
    }

    // Calculate dynamic pricing if needed
    const item = await getPrisma().redemptionItem.findUnique({
      where: { id: parseInt(itemId, 10) },
    });

    let dynamicPricingApplied = null;
    if (item && item.dynamicPricing) {
      const pointsRequired = loyaltyService.calculateRedemptionPoints(item, {
        propertyId: propertyId ? parseInt(propertyId, 10) : null,
        roomTypeId: roomTypeId ? parseInt(roomTypeId, 10) : null,
        redemptionDate: redemptionDate ? new Date(redemptionDate) : new Date(),
      });
      dynamicPricingApplied = {
        basePoints: item.basePointsRequired,
        finalPoints: pointsRequired,
        propertyId: propertyId ? parseInt(propertyId, 10) : null,
        roomTypeId: roomTypeId ? parseInt(roomTypeId, 10) : null,
      };
    }

    const transaction = await loyaltyService.processRedemption({
      itemId: parseInt(itemId, 10),
      loyaltyAccountId: parseInt(loyaltyAccountId, 10),
      bookingId: bookingId ? parseInt(bookingId, 10) : null,
      context: {
        propertyId: propertyId ? parseInt(propertyId, 10) : null,
        roomTypeId: roomTypeId ? parseInt(roomTypeId, 10) : null,
        redemptionDate: redemptionDate ? new Date(redemptionDate) : new Date(),
        dynamicPricingApplied,
        metadata,
      },
    });

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Error processing redemption:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process redemption',
      details: error.message,
    });
  }
});

/**
 * GET /api/loyalty/member/:id/redemptions
 * Get redemption transactions for a member
 */
router.get('/member/:id/redemptions', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;
    const loyaltyAccountId = parseInt(id, 10);

    if (isNaN(loyaltyAccountId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid loyalty account ID',
      });
    }

    const result = await loyaltyService.getMemberRedemptions({
      loyaltyAccountId,
      status,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching redemptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch redemptions',
      details: error.message,
    });
  }
});

/**
 * PUT /api/loyalty/redemptions/:id/status
 * Update redemption transaction status (admin only)
 */
router.put('/redemptions/:id/status', authenticate, requirePermission('loyalty:write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const transactionId = parseInt(id, 10);

    if (isNaN(transactionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction ID',
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: status',
      });
    }

    const transaction = await loyaltyService.updateRedemptionStatus({
      transactionId,
      status,
    });

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Error updating redemption status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update redemption status',
      details: error.message,
    });
  }
});

/**
 * ============================================
 * ADVANCED FEATURES (Admin Only)
 * ============================================
 */

/**
 * POST /api/loyalty/requalification/process
 * Process tier re-qualification for all members (admin only)
 */
router.post('/requalification/process', authenticate, requirePermission('loyalty:write'), async (req, res) => {
  try {
    const { checkDate } = req.body;

    const results = await loyaltyService.processTierRequalification(
      checkDate ? new Date(checkDate) : new Date()
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error processing tier re-qualification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process tier re-qualification',
      details: error.message,
    });
  }
});

/**
 * POST /api/loyalty/fraud/check
 * Check for fraud in a transaction (admin only)
 */
router.post('/fraud/check', authenticate, requirePermission('loyalty:read'), async (req, res) => {
  try {
    const { loyaltyAccountId, transaction } = req.body;

    if (!loyaltyAccountId || !transaction) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: loyaltyAccountId, transaction',
      });
    }

    const fraudCheck = await loyaltyService.detectFraud(
      parseInt(loyaltyAccountId, 10),
      transaction
    );

    res.json({
      success: true,
      data: fraudCheck,
    });
  } catch (error) {
    console.error('Error checking for fraud:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check for fraud',
      details: error.message,
    });
  }
});

/**
 * GET /api/loyalty/analytics/advanced
 * Get advanced analytics (admin only)
 */
router.get('/analytics/advanced', authenticate, requirePermission('loyalty:read'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const analytics = await loyaltyService.getAdvancedAnalytics({
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    });

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error fetching advanced analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch advanced analytics',
      details: error.message,
    });
  }
});

module.exports = router;
