const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Loyalty Service
 * Handles loyalty program operations including tier calculation, points calculation, rule evaluation, and tier progress
 */

/**
 * Calculate tier based on points, stays, nights, and spend
 * @param {Object} metrics - Qualification metrics
 * @param {number} metrics.points - Current points
 * @param {number} metrics.stays - Lifetime stays
 * @param {number} metrics.nights - Lifetime nights
 * @param {number} metrics.spend - Lifetime spend (₹)
 * @param {Date} metrics.qualificationYearStart - Start of qualification year
 * @param {Date} metrics.qualificationYearEnd - End of qualification year
 * @returns {Promise<string>} - Calculated tier (MEMBER, SILVER, GOLD, PLATINUM, DIAMOND)
 */
async function calculateTier(metrics) {
  const { points, stays, nights, spend, qualificationYearStart, qualificationYearEnd } = metrics;

  // Get all tier configs ordered by sort order (ascending)
  const tierConfigs = await prisma.tierConfig.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  // Check qualification period if provided
  const now = new Date();
  let qualifiedPoints = points;
  let qualifiedStays = stays;
  let qualifiedNights = nights;
  let qualifiedSpend = spend;

  if (qualificationYearStart && qualificationYearEnd) {
    // If we're in a qualification period, we need to check metrics within that period
    // For now, we'll use lifetime metrics, but this can be enhanced to filter by date
    // This would require additional queries to calculate metrics within the qualification period
  }

  // Check tiers from highest to lowest (reverse order)
  for (let i = tierConfigs.length - 1; i >= 0; i--) {
    const config = tierConfigs[i];
    let qualifies = false;

    // Check if member qualifies via any criteria
    if (config.minPoints !== null && qualifiedPoints >= config.minPoints) {
      qualifies = true;
    }
    if (config.minStays !== null && qualifiedStays >= config.minStays) {
      qualifies = true;
    }
    if (config.minNights !== null && qualifiedNights >= config.minNights) {
      qualifies = true;
    }
    if (config.minSpend !== null && qualifiedSpend >= config.minSpend) {
      qualifies = true;
    }

    // MEMBER tier is always available (no requirements)
    if (config.tier === 'MEMBER') {
      qualifies = true;
    }

    if (qualifies) {
      return config.tier;
    }
  }

  // Default to MEMBER if no tier qualifies
  return 'MEMBER';
}

/**
 * Get tier configuration
 * @param {string} tier - Tier name
 * @returns {Promise<Object|null>} - Tier configuration
 */
async function getTierConfig(tier) {
  return await prisma.tierConfig.findUnique({
    where: { tier },
  });
}

/**
 * Calculate tier progress to next tier
 * @param {Object} account - Loyalty account
 * @returns {Promise<Object>} - Tier progress information
 */
async function calculateTierProgress(account) {
  const currentTier = account.tier;
  const currentConfig = await getTierConfig(currentTier);

  if (!currentConfig) {
    throw new Error(`Tier configuration not found for tier: ${currentTier}`);
  }

  // Get all tier configs
  const allTierConfigs = await prisma.tierConfig.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  // Find current tier index
  const currentIndex = allTierConfigs.findIndex((c) => c.tier === currentTier);
  const nextTierConfig = allTierConfigs[currentIndex + 1];

  // If already at highest tier, return max progress
  if (!nextTierConfig) {
    return {
      currentTier,
      nextTier: null,
      progress: 100,
      pointsNeeded: 0,
      staysNeeded: 0,
      nightsNeeded: 0,
      spendNeeded: 0,
      isMaxTier: true,
    };
  }

  // Calculate progress based on next tier requirements
  const metrics = {
    points: account.points,
    stays: account.lifetimeStays,
    nights: account.lifetimeNights,
    spend: account.lifetimeSpend,
  };

  let progress = 0;
  let pointsNeeded = 0;
  let staysNeeded = 0;
  let nightsNeeded = 0;
  let spendNeeded = 0;

  // Calculate progress for each requirement type
  const progressValues = [];

  if (nextTierConfig.minPoints !== null) {
    pointsNeeded = Math.max(0, nextTierConfig.minPoints - metrics.points);
    const pointsProgress = Math.min(100, (metrics.points / nextTierConfig.minPoints) * 100);
    progressValues.push(pointsProgress);
  }

  if (nextTierConfig.minStays !== null) {
    staysNeeded = Math.max(0, nextTierConfig.minStays - metrics.stays);
    const staysProgress = Math.min(100, (metrics.stays / nextTierConfig.minStays) * 100);
    progressValues.push(staysProgress);
  }

  if (nextTierConfig.minNights !== null) {
    nightsNeeded = Math.max(0, nextTierConfig.minNights - metrics.nights);
    const nightsProgress = Math.min(100, (metrics.nights / nextTierConfig.minNights) * 100);
    progressValues.push(nightsProgress);
  }

  if (nextTierConfig.minSpend !== null) {
    spendNeeded = Math.max(0, nextTierConfig.minSpend - metrics.spend);
    const spendProgress = Math.min(100, (metrics.spend / nextTierConfig.minSpend) * 100);
    progressValues.push(spendProgress);
  }

  // Progress is the maximum of all requirement types (member qualifies when ANY requirement is met)
  progress = progressValues.length > 0 ? Math.max(...progressValues) : 0;

  return {
    currentTier,
    nextTier: nextTierConfig.tier,
    progress: Math.round(progress),
    pointsNeeded,
    staysNeeded,
    nightsNeeded,
    spendNeeded,
    isMaxTier: false,
  };
}

/**
 * Evaluate rule conditions
 * @param {Object} rule - Points rule
 * @param {Object} context - Booking context
 * @returns {boolean} - True if rule conditions are met
 */
function evaluateRuleConditions(rule, context) {
  const conditions = rule.conditions;

  if (!conditions || typeof conditions !== 'object') {
    return false;
  }

  // Check booking source
  if (conditions.bookingSource) {
    if (context.bookingSource !== conditions.bookingSource) {
      return false;
    }
  }

  // Check stay length
  if (conditions.stayLength) {
    const stayLength = context.stayLength || 0;
    if (conditions.stayLength.min && stayLength < conditions.stayLength.min) {
      return false;
    }
    if (conditions.stayLength.max && stayLength > conditions.stayLength.max) {
      return false;
    }
  }

  // Check if weekend
  if (conditions.isWeekend !== undefined) {
    const isWeekend = context.isWeekend || false;
    if (isWeekend !== conditions.isWeekend) {
      return false;
    }
  }

  // Check date range
  if (conditions.dateRange) {
    const bookingDate = context.checkIn || new Date();
    if (conditions.dateRange.start && new Date(bookingDate) < new Date(conditions.dateRange.start)) {
      return false;
    }
    if (conditions.dateRange.end && new Date(bookingDate) > new Date(conditions.dateRange.end)) {
      return false;
    }
  }

  // Check property IDs
  if (conditions.propertyIds && Array.isArray(conditions.propertyIds) && conditions.propertyIds.length > 0) {
    if (!conditions.propertyIds.includes(context.propertyId)) {
      return false;
    }
  }

  // Check tier IDs
  if (conditions.tierIds && Array.isArray(conditions.tierIds) && conditions.tierIds.length > 0) {
    if (!conditions.tierIds.includes(context.tier)) {
      return false;
    }
  }

  // Check if prepaid/non-refundable
  if (conditions.isPrepaid !== undefined) {
    const isPrepaid = context.isPrepaid || false;
    if (isPrepaid !== conditions.isPrepaid) {
      return false;
    }
  }

  // Check room type category
  if (conditions.roomTypeCategory) {
    if (context.roomTypeCategory !== conditions.roomTypeCategory) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate points for a booking
 * @param {Object} params - Points calculation parameters
 * @param {number} params.loyaltyAccountId - Loyalty account ID
 * @param {number} params.bookingId - Booking ID
 * @param {number} params.roomRevenue - Room revenue (₹)
 * @param {number} params.addOnRevenue - Add-on revenue (₹)
 * @param {Date} params.checkIn - Check-in date
 * @param {Date} params.checkOut - Check-out date
 * @param {string} params.bookingSource - Booking source
 * @param {number} params.propertyId - Property ID
 * @param {number} params.roomTypeId - Room type ID
 * @param {boolean} params.isPrepaid - Is prepaid booking
 * @param {string} params.roomTypeCategory - Room type category
 * @returns {Promise<Object>} - Points calculation result
 */
async function calculatePoints(params) {
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
  } = params;

  // Get loyalty account
  const account = await prisma.loyaltyAccount.findUnique({
    where: { id: loyaltyAccountId },
    include: { user: true },
  });

  if (!account) {
    throw new Error(`Loyalty account not found: ${loyaltyAccountId}`);
  }

  // OTA bookings don't earn points (per requirements)
  const otaSources = [
    'OTA_BOOKING_COM',
    'OTA_MMT',
    'OTA_GOIBIBO',
    'OTA_YATRA',
    'OTA_AGODA',
  ];
  if (otaSources.includes(bookingSource)) {
    return {
      basePoints: 0,
      bonusPoints: 0,
      totalPoints: 0,
      rulesApplied: [],
      campaignsApplied: [],
      message: 'OTA bookings do not earn points',
    };
  }

  // Get tier config
  const tierConfig = await getTierConfig(account.tier);
  if (!tierConfig) {
    throw new Error(`Tier configuration not found for tier: ${account.tier}`);
  }

  // Calculate base points
  const totalRevenue = roomRevenue + addOnRevenue;
  const basePoints = Math.floor((totalRevenue / 100) * tierConfig.basePointsPer100Rupees);

  // Calculate stay length
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const stayLength = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

  // Check if weekend (Friday, Saturday, Sunday)
  const checkInDay = checkInDate.getDay();
  const isWeekend = checkInDay === 5 || checkInDay === 6 || checkInDay === 0; // Fri, Sat, Sun

  // Build context for rule evaluation
  const context = {
    tier: account.tier,
    bookingSource,
    stayLength,
    isWeekend,
    checkIn,
    propertyId,
    roomTypeId,
    isPrepaid,
    roomTypeCategory,
    totalRevenue,
  };

  // Get active points rules (ordered by priority, highest first)
  const activeRules = await prisma.pointsRule.findMany({
    where: {
      isActive: true,
      AND: [
        {
          OR: [
            { startDate: null },
            { startDate: { lte: checkInDate } },
          ],
        },
        {
          OR: [
            { endDate: null },
            { endDate: { gte: checkInDate } },
          ],
        },
      ],
    },
    orderBy: { priority: 'desc' },
  });

  // Evaluate rules and calculate bonuses
  let bonusPoints = 0;
  let multiplier = 1.0;
  const rulesApplied = [];

  for (const rule of activeRules) {
    // Check if rule applies to this property
    if (rule.propertyIds.length > 0 && !rule.propertyIds.includes(propertyId)) {
      continue;
    }

    // Check if rule applies to this tier
    if (rule.tierIds.length > 0 && !rule.tierIds.includes(account.tier)) {
      continue;
    }

    // Evaluate conditions
    if (!evaluateRuleConditions(rule, context)) {
      continue;
    }

    // Apply rule actions
    const actions = rule.actions;
    if (actions.type === 'MULTIPLIER') {
      multiplier *= actions.multiplier || 1.0;
    } else if (actions.type === 'BONUS_POINTS') {
      bonusPoints += actions.bonusPoints || 0;
    } else if (actions.type === 'PERCENTAGE') {
      multiplier *= 1 + (actions.percentage / 100);
    }

    rulesApplied.push({
      ruleId: rule.id,
      name: rule.name,
      type: rule.ruleType,
      multiplier: actions.multiplier || null,
      bonusPoints: actions.bonusPoints || null,
    });
  }

  // Get active campaigns
  const activeCampaigns = await prisma.campaign.findMany({
    where: {
      isActive: true,
      startDate: { lte: checkInDate },
      endDate: { gte: checkInDate },
      AND: [
        {
          OR: [
            { tierIds: { isEmpty: true } },
            { tierIds: { has: account.tier } },
          ],
        },
        {
          OR: [
            { propertyIds: { isEmpty: true } },
            { propertyIds: { has: propertyId } },
          ],
        },
      ],
    },
  });

  const campaignsApplied = [];
  for (const campaign of activeCampaigns) {
    const rules = campaign.rules;
    if (rules.multiplier) {
      multiplier *= rules.multiplier;
    }
    if (rules.bonusPoints) {
      bonusPoints += rules.bonusPoints;
    }

    campaignsApplied.push({
      campaignId: campaign.id,
      name: campaign.name,
      type: campaign.campaignType,
      multiplier: rules.multiplier || null,
      bonusPoints: rules.bonusPoints || null,
    });
  }

  // Calculate total points
  const totalPoints = Math.floor(basePoints * multiplier) + bonusPoints;

  return {
    basePoints,
    bonusPoints,
    totalPoints,
    multiplier,
    rulesApplied,
    campaignsApplied,
  };
}

/**
 * Award points to a loyalty account
 * @param {Object} params - Award parameters
 * @param {number} params.loyaltyAccountId - Loyalty account ID
 * @param {number} params.points - Points to award
 * @param {string} params.reason - Reason for points
 * @param {number} params.bookingId - Booking ID (optional)
 * @param {number} params.ruleId - Rule ID (optional)
 * @param {number} params.campaignId - Campaign ID (optional)
 * @param {number} params.referralId - Referral ID (optional)
 * @param {Object} params.metadata - Additional metadata (optional)
 * @param {string} params.createdBy - User ID who created (optional, for admin adjustments)
 * @returns {Promise<Object>} - Updated loyalty account
 */
async function awardPoints(params) {
  const {
    loyaltyAccountId,
    points,
    reason,
    bookingId = null,
    ruleId = null,
    campaignId = null,
    referralId = null,
    metadata = null,
    createdBy = null,
  } = params;

  if (points <= 0) {
    throw new Error('Points must be positive');
  }

  // Get current account
  const account = await prisma.loyaltyAccount.findUnique({
    where: { id: loyaltyAccountId },
  });

  if (!account) {
    throw new Error(`Loyalty account not found: ${loyaltyAccountId}`);
  }

  const balanceBefore = account.points;
  const balanceAfter = balanceBefore + points;

  // Create points ledger entry
  await prisma.pointsLedger.create({
    data: {
      loyaltyAccountId,
      userId: account.userId,
      points,
      reason,
      bookingId,
      ruleId,
      campaignId,
      referralId,
      metadata,
      balanceBefore,
      balanceAfter,
      createdBy,
    },
  });

  // Update account
  const updatedAccount = await prisma.loyaltyAccount.update({
    where: { id: loyaltyAccountId },
    data: {
      points: balanceAfter,
      lastUpdated: new Date(),
    },
  });

  // Check for tier upgrade
  await checkAndUpdateTier(loyaltyAccountId);

  return updatedAccount;
}

/**
 * Redeem points from a loyalty account
 * @param {Object} params - Redemption parameters
 * @param {number} params.loyaltyAccountId - Loyalty account ID
 * @param {number} params.points - Points to redeem
 * @param {string} params.reason - Reason for redemption
 * @param {number} params.bookingId - Booking ID (optional)
 * @returns {Promise<Object>} - Updated loyalty account
 */
async function redeemPoints(params) {
  const { loyaltyAccountId, points, reason, bookingId = null } = params;

  if (points <= 0) {
    throw new Error('Points must be positive');
  }

  // Get current account
  const account = await prisma.loyaltyAccount.findUnique({
    where: { id: loyaltyAccountId },
  });

  if (!account) {
    throw new Error(`Loyalty account not found: ${loyaltyAccountId}`);
  }

  if (account.points < points) {
    throw new Error(`Insufficient points. Available: ${account.points}, Required: ${points}`);
  }

  const balanceBefore = account.points;
  const balanceAfter = balanceBefore - points;

  // Create points ledger entry (negative points)
  await prisma.pointsLedger.create({
    data: {
      loyaltyAccountId,
      userId: account.userId,
      points: -points,
      reason,
      bookingId,
      balanceBefore,
      balanceAfter,
    },
  });

  // Update account
  const updatedAccount = await prisma.loyaltyAccount.update({
    where: { id: loyaltyAccountId },
    data: {
      points: balanceAfter,
      lastUpdated: new Date(),
    },
  });

  return updatedAccount;
}

/**
 * Check and update tier if member qualifies for upgrade
 * @param {number} loyaltyAccountId - Loyalty account ID
 * @param {boolean} allowDowngrade - Whether to allow tier downgrades (default: false)
 * @returns {Promise<Object|null>} - Tier history entry if tier changed, null otherwise
 */
async function checkAndUpdateTier(loyaltyAccountId, allowDowngrade = false) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { id: loyaltyAccountId },
  });

  if (!account) {
    throw new Error(`Loyalty account not found: ${loyaltyAccountId}`);
  }

  // Calculate new tier
  const newTier = await calculateTier({
    points: account.points,
    stays: account.lifetimeStays,
    nights: account.lifetimeNights,
    spend: account.lifetimeSpend,
    qualificationYearStart: account.qualificationYearStart,
    qualificationYearEnd: account.qualificationYearEnd,
  });

  // If tier changed, update and create history
  if (newTier !== account.tier) {
    const oldTier = account.tier;
    
    // Check if this is a downgrade
    const tierConfigs = await prisma.tierConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    
    const oldTierIndex = tierConfigs.findIndex(c => c.tier === oldTier);
    const newTierIndex = tierConfigs.findIndex(c => c.tier === newTier);
    const isDowngrade = newTierIndex < oldTierIndex;

    // Apply downgrade protection if enabled
    if (isDowngrade && !allowDowngrade) {
      // Check if qualification year has ended
      const now = new Date();
      const qualificationYearEnded = account.qualificationYearEnd && new Date(account.qualificationYearEnd) < now;
      
      if (!qualificationYearEnded) {
        // Qualification year hasn't ended, prevent downgrade
        return null;
      }
      
      // Qualification year has ended, allow downgrade but log it
    }

    // Update account
    await prisma.loyaltyAccount.update({
      where: { id: loyaltyAccountId },
      data: {
        tier: newTier,
        lastUpdated: new Date(),
      },
    });

    // Determine reason
    let reason = 'AUTO_UPGRADE';
    if (isDowngrade) {
      reason = 'RE_QUALIFICATION'; // Re-qualification after qualification year ended
    }

    // Create tier history
    const tierHistory = await prisma.tierHistory.create({
      data: {
        loyaltyAccountId,
        fromTier: oldTier,
        toTier: newTier,
        pointsAtChange: account.points,
        staysAtChange: account.lifetimeStays,
        nightsAtChange: account.lifetimeNights,
        spendAtChange: account.lifetimeSpend,
        reason,
      },
    });

    return tierHistory;
  }

  return null;
}

/**
 * Process tier re-qualification for all members
 * Checks qualification year end dates and re-evaluates tiers
 * @param {Date} checkDate - Date to check (defaults to now)
 * @returns {Promise<Object>} - Summary of re-qualifications processed
 */
async function processTierRequalification(checkDate = new Date()) {
  // Find all accounts with qualification year ending before checkDate
  const accountsToCheck = await prisma.loyaltyAccount.findMany({
    where: {
      qualificationYearEnd: {
        lte: checkDate,
      },
      // Only check accounts that are not MEMBER tier (can't downgrade from MEMBER)
      tier: {
        not: 'MEMBER',
      },
    },
  });

  const results = {
    checked: accountsToCheck.length,
    upgraded: 0,
    downgraded: 0,
    unchanged: 0,
    errors: [],
  };

  for (const account of accountsToCheck) {
    try {
      // Re-calculate tier (this will use lifetime metrics)
      const newTier = await calculateTier({
        points: account.points,
        stays: account.lifetimeStays,
        nights: account.lifetimeNights,
        spend: account.lifetimeSpend,
        qualificationYearStart: account.qualificationYearStart,
        qualificationYearEnd: account.qualificationYearEnd,
      });

      if (newTier !== account.tier) {
        const tierConfigs = await prisma.tierConfig.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        });
        
        const oldTierIndex = tierConfigs.findIndex(c => c.tier === account.tier);
        const newTierIndex = tierConfigs.findIndex(c => c.tier === newTier);
        const isDowngrade = newTierIndex < oldTierIndex;

        // Update tier (allow downgrade during re-qualification)
        await checkAndUpdateTier(account.id, true);

        // Reset qualification year for next period
        const newQualificationYearStart = new Date(account.qualificationYearEnd);
        newQualificationYearStart.setDate(newQualificationYearStart.getDate() + 1);
        const newQualificationYearEnd = new Date(newQualificationYearStart);
        newQualificationYearEnd.setFullYear(newQualificationYearEnd.getFullYear() + 1);

        await prisma.loyaltyAccount.update({
          where: { id: account.id },
          data: {
            qualificationYearStart: newQualificationYearStart,
            qualificationYearEnd: newQualificationYearEnd,
          },
        });

        if (isDowngrade) {
          results.downgraded++;
        } else {
          results.upgraded++;
        }
      } else {
        // Reset qualification year even if tier unchanged
        const newQualificationYearStart = new Date(account.qualificationYearEnd);
        newQualificationYearStart.setDate(newQualificationYearStart.getDate() + 1);
        const newQualificationYearEnd = new Date(newQualificationYearStart);
        newQualificationYearEnd.setFullYear(newQualificationYearEnd.getFullYear() + 1);

        await prisma.loyaltyAccount.update({
          where: { id: account.id },
          data: {
            qualificationYearStart: newQualificationYearStart,
            qualificationYearEnd: newQualificationYearEnd,
          },
        });

        results.unchanged++;
      }
    } catch (error) {
      results.errors.push({
        accountId: account.id,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Update lifetime metrics after booking completion
 * @param {number} loyaltyAccountId - Loyalty account ID
 * @param {number} nights - Number of nights
 * @param {number} spend - Amount spent (₹)
 * @returns {Promise<Object>} - Updated loyalty account
 */
async function updateLifetimeMetrics(loyaltyAccountId, nights, spend) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { id: loyaltyAccountId },
  });

  if (!account) {
    throw new Error(`Loyalty account not found: ${loyaltyAccountId}`);
  }

  // Update metrics
  const updatedAccount = await prisma.loyaltyAccount.update({
    where: { id: loyaltyAccountId },
    data: {
      lifetimeStays: { increment: 1 },
      lifetimeNights: { increment: nights },
      lifetimeSpend: { increment: spend },
      lastUpdated: new Date(),
    },
  });

  // Check for tier upgrade
  await checkAndUpdateTier(loyaltyAccountId);

  return updatedAccount;
}

/**
 * Get member profile with tier progress
 * @param {number} loyaltyAccountId - Loyalty account ID
 * @returns {Promise<Object>} - Member profile
 */
async function getMemberProfile(loyaltyAccountId) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { id: loyaltyAccountId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!account) {
    throw new Error(`Loyalty account not found: ${loyaltyAccountId}`);
  }

  // Get tier progress
  const tierProgress = await calculateTierProgress(account);

  // Get tier config
  const tierConfig = await getTierConfig(account.tier);

  // Get active perk redemptions
  const activePerks = await getMemberPerkRedemptions({
    loyaltyAccountId,
    status: 'ACTIVE',
    limit: 50,
    offset: 0,
  });

  // Get active campaigns for member
  const activeCampaigns = await getMemberCampaigns({
    memberTier: account.tier,
  });

  // Get pending/confirmed redemptions
  const redemptions = await getMemberRedemptions({
    loyaltyAccountId,
    status: undefined, // Get all statuses
    limit: 10,
    offset: 0,
  });

  return {
    account: {
      id: account.id,
      memberNumber: account.memberNumber,
      userId: account.userId,
      user: account.user,
      points: account.points,
      tier: account.tier,
      lifetimeStays: account.lifetimeStays,
      lifetimeNights: account.lifetimeNights,
      lifetimeSpend: account.lifetimeSpend,
      qualificationYearStart: account.qualificationYearStart,
      qualificationYearEnd: account.qualificationYearEnd,
      lastUpdated: account.lastUpdated,
      createdAt: account.createdAt,
    },
    tierProgress,
    tierConfig: tierConfig ? {
      name: tierConfig.name,
      description: tierConfig.description,
      basePointsPer100Rupees: tierConfig.basePointsPer100Rupees,
      benefits: tierConfig.benefits,
    } : null,
    activePerks: activePerks.redemptions || [],
    activeCampaigns: activeCampaigns || [],
    recentRedemptions: redemptions.redemptions || [],
  };
}

/**
 * Create or get loyalty account for a user
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {Promise<Object>} - Loyalty account
 */
async function createOrGetLoyaltyAccount(userId, email) {
  // Check if loyalty account exists
  let account = await prisma.loyaltyAccount.findUnique({
    where: { userId },
  });

  if (account) {
    return account;
  }

  // Generate member number
  const memberCount = await prisma.loyaltyAccount.count();
  const memberNumber = String(memberCount + 1).padStart(6, '0');

  // Create new loyalty account
  account = await prisma.loyaltyAccount.create({
    data: {
      userId,
      memberNumber,
      tier: 'MEMBER',
      points: 0,
      lifetimeStays: 0,
      lifetimeNights: 0,
      lifetimeSpend: 0,
    },
  });

  return account;
}

/**
 * Award points for a completed booking
 * @param {Object} params - Booking parameters
 * @param {number} params.bookingId - Booking ID
 * @param {number} params.loyaltyAccountId - Loyalty account ID
 * @returns {Promise<Object>} - Points awarded result
 */
async function awardPointsForBooking(params) {
  const { bookingId, loyaltyAccountId } = params;

  // Get booking with details
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      property: true,
      roomType: true,
      ratePlan: true,
      loyaltyAccount: true,
    },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  if (!loyaltyAccountId || !booking.loyaltyAccount) {
    return {
      pointsAwarded: 0,
      message: 'No loyalty account linked to booking',
    };
  }

  // Calculate stay length
  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);
  const stayLength = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

  // Get room type category if available
  const roomTypeCategory = booking.roomType?.features?.includes('PREMIUM') ? 'PREMIUM' : null;

  // Calculate points
  const pointsCalculation = await calculatePoints({
    loyaltyAccountId,
    bookingId,
    roomRevenue: booking.totalPrice,
    addOnRevenue: 0, // Can be enhanced later
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    bookingSource: booking.source,
    propertyId: booking.propertyId,
    roomTypeId: booking.roomTypeId,
    isPrepaid: booking.ratePlan?.refundable === false,
    roomTypeCategory,
  });

  // Award points if any were calculated
  if (pointsCalculation.totalPoints > 0) {
    await awardPoints({
      loyaltyAccountId,
      points: pointsCalculation.totalPoints,
      reason: `Booking #${booking.confirmationNumber || bookingId}`,
      bookingId,
      metadata: {
        basePoints: pointsCalculation.basePoints,
        bonusPoints: pointsCalculation.bonusPoints,
        multiplier: pointsCalculation.multiplier,
        rulesApplied: pointsCalculation.rulesApplied,
        campaignsApplied: pointsCalculation.campaignsApplied,
      },
    });
  }

  return {
    pointsAwarded: pointsCalculation.totalPoints,
    calculation: pointsCalculation,
  };
}

/**
 * ============================================
 * PERK ENGINE FUNCTIONS
 * ============================================
 */

/**
 * Evaluate perk conditions against booking/member context
 * @param {Object} perk - Perk object with conditions
 * @param {Object} context - Context to evaluate against
 * @param {string} context.memberTier - Member's current tier
 * @param {string} context.bookingSource - Booking source
 * @param {number} context.stayLength - Number of nights
 * @param {number} context.propertyId - Property ID
 * @param {Date} context.checkIn - Check-in date
 * @returns {boolean} - Whether conditions are met
 */
function evaluatePerkConditions(perk, context) {
  const conditions = perk.conditions || {};
  const {
    memberTier,
    bookingSource,
    stayLength,
    propertyId,
    checkIn,
  } = context;

  // Check tier requirement
  if (conditions.minTier) {
    const tierOrder = ['MEMBER', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
    const requiredTierIndex = tierOrder.indexOf(conditions.minTier);
    const memberTierIndex = tierOrder.indexOf(memberTier);
    if (memberTierIndex < requiredTierIndex) {
      return false;
    }
  }

  // Check tier IDs scope
  if (perk.tierIds && perk.tierIds.length > 0) {
    if (!perk.tierIds.includes(memberTier)) {
      return false;
    }
  }

  // Check property IDs scope
  if (perk.propertyIds && perk.propertyIds.length > 0) {
    if (!perk.propertyIds.includes(propertyId)) {
      return false;
    }
  }

  // Check booking source
  if (conditions.bookingSource) {
    if (bookingSource !== conditions.bookingSource) {
      return false;
    }
  }

  // Check stay length
  if (conditions.stayLength) {
    if (conditions.stayLength.min && stayLength < conditions.stayLength.min) {
      return false;
    }
    if (conditions.stayLength.max && stayLength > conditions.stayLength.max) {
      return false;
    }
  }

  // Check date range
  if (perk.startDate || perk.endDate) {
    const checkInDate = new Date(checkIn);
    if (perk.startDate && checkInDate < new Date(perk.startDate)) {
      return false;
    }
    if (perk.endDate && checkInDate > new Date(perk.endDate)) {
      return false;
    }
  }

  return true;
}

/**
 * Get eligible perks for a member and booking context
 * @param {Object} params - Parameters
 * @param {number} params.loyaltyAccountId - Loyalty account ID
 * @param {Object} params.bookingContext - Booking context
 * @param {string} params.bookingContext.bookingSource - Booking source
 * @param {number} params.bookingContext.stayLength - Number of nights
 * @param {number} params.bookingContext.propertyId - Property ID
 * @param {Date} params.bookingContext.checkIn - Check-in date
 * @returns {Promise<Array>} - Array of eligible perks
 */
async function getEligiblePerks({ loyaltyAccountId, bookingContext }) {
  // Get loyalty account with tier
  const account = await prisma.loyaltyAccount.findUnique({
    where: { id: loyaltyAccountId },
  });

  if (!account) {
    throw new Error('Loyalty account not found');
  }

  // Get all active perks
  const checkInDate = new Date(bookingContext.checkIn);
  const perks = await prisma.perk.findMany({
    where: {
      isActive: true,
      AND: [
        {
          OR: [
            { startDate: null },
            { startDate: { lte: checkInDate } },
          ],
        },
        {
          OR: [
            { endDate: null },
            { endDate: { gte: checkInDate } },
          ],
        },
      ],
    },
  });

  const eligiblePerks = [];

  for (const perk of perks) {
    // Check conditions
    if (!evaluatePerkConditions(perk, {
      memberTier: account.tier,
      ...bookingContext,
    })) {
      continue;
    }

    // Check capacity limits
    const capacityCheck = await checkPerkCapacity({
      perkId: perk.id,
      loyaltyAccountId,
      bookingId: bookingContext.bookingId,
    });

    if (!capacityCheck.available) {
      continue;
    }

    eligiblePerks.push({
      ...perk,
      capacityInfo: capacityCheck,
    });
  }

  return eligiblePerks;
}

/**
 * Check perk capacity limits
 * @param {Object} params - Parameters
 * @param {number} params.perkId - Perk ID
 * @param {number} params.loyaltyAccountId - Loyalty account ID
 * @param {number} params.bookingId - Booking ID (optional, for per-stay limits)
 * @returns {Promise<Object>} - Capacity check result
 */
async function checkPerkCapacity({ perkId, loyaltyAccountId, bookingId }) {
  const perk = await prisma.perk.findUnique({
    where: { id: perkId },
  });

  if (!perk) {
    return { available: false, reason: 'Perk not found' };
  }

  // Check total capacity
  if (perk.totalCapacity !== null) {
    if (perk.currentUsage >= perk.totalCapacity) {
      return { available: false, reason: 'Total capacity reached' };
    }
  }

  // Check per-member limit
  if (perk.maxUsagePerMember !== null) {
    const memberUsage = await prisma.perkRedemption.count({
      where: {
        perkId,
        loyaltyAccountId,
        status: { in: ['ACTIVE', 'USED'] },
      },
    });

    if (memberUsage >= perk.maxUsagePerMember) {
      return { available: false, reason: 'Member limit reached' };
    }
  }

  // Check per-stay limit
  if (perk.maxUsagePerStay !== null && bookingId) {
    const stayUsage = await prisma.perkRedemption.count({
      where: {
        perkId,
        bookingId,
        status: { in: ['ACTIVE', 'USED'] },
      },
    });

    if (stayUsage >= perk.maxUsagePerStay) {
      return { available: false, reason: 'Per-stay limit reached' };
    }
  }

  return { available: true };
}

/**
 * Redeem a perk for a booking
 * @param {Object} params - Parameters
 * @param {number} params.perkId - Perk ID
 * @param {number} params.loyaltyAccountId - Loyalty account ID
 * @param {number} params.bookingId - Booking ID (optional)
 * @param {Object} params.valueApplied - Value applied at redemption time (optional)
 * @param {Object} params.metadata - Additional metadata (optional)
 * @returns {Promise<Object>} - Redemption record
 */
async function redeemPerk({ perkId, loyaltyAccountId, bookingId, valueApplied, metadata }) {
  // Verify perk exists and is active
  const perk = await prisma.perk.findUnique({
    where: { id: perkId },
  });

  if (!perk || !perk.isActive) {
    throw new Error('Perk not found or inactive');
  }

  // Check capacity
  const capacityCheck = await checkPerkCapacity({
    perkId,
    loyaltyAccountId,
    bookingId,
  });

  if (!capacityCheck.available) {
    throw new Error(`Perk capacity limit reached: ${capacityCheck.reason}`);
  }

  // Create redemption record
  const redemption = await prisma.perkRedemption.create({
    data: {
      perkId,
      loyaltyAccountId,
      bookingId: bookingId || null,
      status: 'ACTIVE',
      valueApplied: valueApplied || perk.value,
      metadata: metadata || null,
    },
    include: {
      perk: true,
      loyaltyAccount: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  // Update perk usage counter
  await prisma.perk.update({
    where: { id: perkId },
    data: {
      currentUsage: {
        increment: 1,
      },
    },
  });

  return redemption;
}

/**
 * Auto-apply eligible perks to a booking
 * @param {Object} params - Parameters
 * @param {number} params.loyaltyAccountId - Loyalty account ID
 * @param {number} params.bookingId - Booking ID
 * @param {Object} params.bookingContext - Booking context
 * @returns {Promise<Array>} - Array of applied perks
 */
async function applyPerksToBooking({ loyaltyAccountId, bookingId, bookingContext }) {
  // Get eligible perks
  const eligiblePerks = await getEligiblePerks({
    loyaltyAccountId,
    bookingContext: {
      ...bookingContext,
      bookingId,
    },
  });

  const appliedPerks = [];

  // Auto-apply perks (you can add logic here to determine which perks to auto-apply)
  // For now, we'll auto-apply all eligible perks
  for (const perk of eligiblePerks) {
    try {
      const redemption = await redeemPerk({
        perkId: perk.id,
        loyaltyAccountId,
        bookingId,
        valueApplied: perk.value,
        metadata: {
          autoApplied: true,
          appliedAt: new Date().toISOString(),
        },
      });

      appliedPerks.push(redemption);
    } catch (error) {
      console.error(`Error auto-applying perk ${perk.code}:`, error.message);
      // Continue with other perks even if one fails
    }
  }

  return appliedPerks;
}

/**
 * Get member's perk redemptions
 * @param {Object} params - Parameters
 * @param {number} params.loyaltyAccountId - Loyalty account ID
 * @param {string} params.status - Filter by status (optional)
 * @param {number} params.limit - Limit results (optional)
 * @param {number} params.offset - Offset for pagination (optional)
 * @returns {Promise<Object>} - Redemptions with pagination
 */
async function getMemberPerkRedemptions({ loyaltyAccountId, status, limit = 50, offset = 0 }) {
  const where = { loyaltyAccountId };
  if (status) {
    where.status = status;
  }

  const [redemptions, total] = await Promise.all([
    prisma.perkRedemption.findMany({
      where,
      include: {
        perk: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            perkType: true,
          },
        },
        booking: {
          select: {
            id: true,
            confirmationNumber: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
      orderBy: { redeemedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.perkRedemption.count({ where }),
  ]);

  return {
    redemptions,
    total,
    limit,
    offset,
  };
}

/**
 * ============================================
 * CAMPAIGN ENGINE FUNCTIONS
 * ============================================
 */

/**
 * Get active campaigns for a member and booking context
 * @param {Object} params - Parameters
 * @param {string} params.memberTier - Member's current tier
 * @param {number} params.propertyId - Property ID
 * @param {Date} params.checkIn - Check-in date
 * @returns {Promise<Array>} - Array of active campaigns
 */
async function getActiveCampaigns({ memberTier, propertyId, checkIn }) {
  const checkInDate = new Date(checkIn);

  const campaigns = await prisma.campaign.findMany({
    where: {
      isActive: true,
      startDate: { lte: checkInDate },
      endDate: { gte: checkInDate },
      AND: [
        {
          OR: [
            { tierIds: { isEmpty: true } },
            { tierIds: { has: memberTier } },
          ],
        },
        {
          OR: [
            { propertyIds: { isEmpty: true } },
            { propertyIds: { has: propertyId } },
          ],
        },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  return campaigns;
}

/**
 * Evaluate campaign eligibility
 * @param {Object} campaign - Campaign object
 * @param {Object} context - Context to evaluate against
 * @param {string} context.memberTier - Member's current tier
 * @param {number} context.propertyId - Property ID
 * @param {Date} context.checkIn - Check-in date
 * @returns {boolean} - Whether campaign is eligible
 */
function evaluateCampaign(campaign, context) {
  const { memberTier, propertyId, checkIn } = context;
  const checkInDate = new Date(checkIn);

  // Check date range
  if (checkInDate < new Date(campaign.startDate) || checkInDate > new Date(campaign.endDate)) {
    return false;
  }

  // Check tier targeting
  if (campaign.tierIds && campaign.tierIds.length > 0) {
    if (!campaign.tierIds.includes(memberTier)) {
      return false;
    }
  }

  // Check property targeting
  if (campaign.propertyIds && campaign.propertyIds.length > 0) {
    if (!campaign.propertyIds.includes(propertyId)) {
      return false;
    }
  }

  // Check additional conditions in rules
  if (campaign.rules && campaign.rules.conditions) {
    const conditions = campaign.rules.conditions;
    
    // Add any additional condition checks here
    // For example: bookingSource, stayLength, etc.
  }

  return true;
}

/**
 * Get campaigns for member dashboard
 * @param {Object} params - Parameters
 * @param {string} params.memberTier - Member's current tier
 * @param {number} params.propertyId - Property ID (optional)
 * @returns {Promise<Array>} - Array of active campaigns
 */
async function getMemberCampaigns({ memberTier, propertyId = null }) {
  const now = new Date();

  const where = {
    isActive: true,
    startDate: { lte: now },
    endDate: { gte: now },
    AND: [
      {
        OR: [
          { tierIds: { isEmpty: true } },
          { tierIds: { has: memberTier } },
        ],
      },
    ],
  };

  // Add property filter if provided
  if (propertyId) {
    where.AND.push({
      OR: [
        { propertyIds: { isEmpty: true } },
        { propertyIds: { has: propertyId } },
      ],
    });
  }

  const campaigns = await prisma.campaign.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return campaigns;
}

/**
 * Get campaign analytics
 * @param {Object} params - Parameters
 * @param {number} params.campaignId - Campaign ID
 * @param {Date} params.startDate - Start date for analytics (optional)
 * @param {Date} params.endDate - End date for analytics (optional)
 * @returns {Promise<Object>} - Campaign analytics
 */
async function getCampaignAnalytics({ campaignId, startDate, endDate }) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Build date filter
  const dateFilter = {};
  if (startDate) {
    dateFilter.gte = new Date(startDate);
  }
  if (endDate) {
    dateFilter.lte = new Date(endDate);
  }

  // Get points ledger entries for this campaign
  const where = { campaignId };
  if (Object.keys(dateFilter).length > 0) {
    where.createdAt = dateFilter;
  }

  const [totalRedemptions, totalPointsAwarded, uniqueMembers] = await Promise.all([
    prisma.pointsLedger.count({ where }),
    prisma.pointsLedger.aggregate({
      where,
      _sum: { points: true },
    }),
    prisma.pointsLedger.groupBy({
      by: ['loyaltyAccountId'],
      where,
    }),
  ]);

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      campaignType: campaign.campaignType,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
    },
    analytics: {
      totalRedemptions,
      totalPointsAwarded: totalPointsAwarded._sum.points || 0,
      uniqueMembers: uniqueMembers.length,
    },
  };
}

/**
 * ============================================
 * REDEMPTION ENGINE FUNCTIONS
 * ============================================
 */

/**
 * Calculate points required for a redemption item (with dynamic pricing)
 * @param {Object} item - Redemption item
 * @param {Object} context - Redemption context
 * @param {number} context.propertyId - Property ID
 * @param {number} context.roomTypeId - Room type ID (optional)
 * @param {Date} context.redemptionDate - Redemption date
 * @returns {number} - Points required
 */
function calculateRedemptionPoints(item, context) {
  const { propertyId, roomTypeId, redemptionDate } = context;

  // Start with base points
  let pointsRequired = item.basePointsRequired;

  // Apply dynamic pricing if configured
  if (item.dynamicPricing && item.dynamicPricing.dynamic) {
    const rules = item.dynamicPricing.rules || [];

    for (const rule of rules) {
      // Room type specific pricing
      if (rule.roomTypeId && roomTypeId && rule.roomTypeId === roomTypeId) {
        if (rule.points) {
          pointsRequired = rule.points;
        } else if (rule.multiplier) {
          pointsRequired = Math.floor(pointsRequired * rule.multiplier);
        }
      }

      // Property specific pricing
      if (rule.propertyId && rule.propertyId === propertyId) {
        if (rule.points) {
          pointsRequired = rule.points;
        } else if (rule.multiplier) {
          pointsRequired = Math.floor(pointsRequired * rule.multiplier);
        }
      }

      // Seasonal pricing
      if (rule.dateRange && redemptionDate) {
        const date = new Date(redemptionDate);
        const start = new Date(rule.dateRange.start);
        const end = new Date(rule.dateRange.end);

        if (date >= start && date <= end) {
          if (rule.points) {
            pointsRequired = rule.points;
          } else if (rule.multiplier) {
            pointsRequired = Math.floor(pointsRequired * rule.multiplier);
          }
        }
      }
    }
  }

  return pointsRequired;
}

/**
 * Validate redemption eligibility
 * @param {Object} params - Parameters
 * @param {number} params.itemId - Redemption item ID
 * @param {number} params.loyaltyAccountId - Loyalty account ID
 * @param {Object} params.context - Redemption context
 * @returns {Promise<Object>} - Validation result
 */
async function validateRedemption({ itemId, loyaltyAccountId, context }) {
  // Get redemption item
  const item = await prisma.redemptionItem.findUnique({
    where: { id: itemId },
  });

  if (!item || !item.isActive) {
    return { valid: false, reason: 'Redemption item not found or inactive' };
  }

  // Get loyalty account
  const account = await prisma.loyaltyAccount.findUnique({
    where: { id: loyaltyAccountId },
  });

  if (!account) {
    return { valid: false, reason: 'Loyalty account not found' };
  }

  // Check date range
  const redemptionDate = context.redemptionDate || new Date();
  if (item.startDate && redemptionDate < new Date(item.startDate)) {
    return { valid: false, reason: 'Redemption item not yet available' };
  }
  if (item.endDate && redemptionDate > new Date(item.endDate)) {
    return { valid: false, reason: 'Redemption item has expired' };
  }

  // Check tier eligibility
  if (item.tierIds && item.tierIds.length > 0) {
    if (!item.tierIds.includes(account.tier)) {
      return { valid: false, reason: 'Member tier not eligible for this redemption' };
    }
  }

  // Check property eligibility
  if (item.propertyIds && item.propertyIds.length > 0 && context.propertyId) {
    if (!item.propertyIds.includes(context.propertyId)) {
      return { valid: false, reason: 'Redemption not available for this property' };
    }
  }

  // Check room type eligibility
  if (item.roomTypeIds && item.roomTypeIds.length > 0 && context.roomTypeId) {
    if (!item.roomTypeIds.includes(context.roomTypeId)) {
      return { valid: false, reason: 'Redemption not available for this room type' };
    }
  }

  // Check inventory
  if (item.totalQuantity !== null) {
    const available = item.availableQuantity !== null ? item.availableQuantity : item.totalQuantity - item.soldQuantity;
    if (available <= 0) {
      return { valid: false, reason: 'Redemption item out of stock' };
    }
  }

  // Check points balance
  const pointsRequired = calculateRedemptionPoints(item, {
    propertyId: context.propertyId,
    roomTypeId: context.roomTypeId,
    redemptionDate,
  });

  if (account.points < pointsRequired) {
    return { 
      valid: false, 
      reason: 'Insufficient points',
      pointsRequired,
      pointsAvailable: account.points,
    };
  }

  return {
    valid: true,
    pointsRequired,
    item,
  };
}

/**
 * Get available redemption catalog for a member
 * @param {Object} params - Parameters
 * @param {number} params.loyaltyAccountId - Loyalty account ID
 * @param {number} params.propertyId - Property ID (optional)
 * @param {number} params.roomTypeId - Room type ID (optional)
 * @returns {Promise<Array>} - Array of available redemption items
 */
async function getRedemptionCatalog({ loyaltyAccountId, propertyId = null, roomTypeId = null }) {
  // Get loyalty account
  const account = await prisma.loyaltyAccount.findUnique({
    where: { id: loyaltyAccountId },
  });

  if (!account) {
    throw new Error('Loyalty account not found');
  }

  const now = new Date();

  // Get all active redemption items
  const where = {
    isActive: true,
    AND: [
      {
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
      },
      {
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
    ],
  };

  // Filter by tier
  where.AND.push({
    OR: [
      { tierIds: { isEmpty: true } },
      { tierIds: { has: account.tier } },
    ],
  });

  // Filter by property if provided
  if (propertyId) {
    where.AND.push({
      OR: [
        { propertyIds: { isEmpty: true } },
        { propertyIds: { has: propertyId } },
      ],
    });
  }

  // Filter by room type if provided
  if (roomTypeId) {
    where.AND.push({
      OR: [
        { roomTypeIds: { isEmpty: true } },
        { roomTypeIds: { has: roomTypeId } },
      ],
    });
  }

  const items = await prisma.redemptionItem.findMany({
    where,
    orderBy: { basePointsRequired: 'asc' },
  });

  // Calculate points required for each item and check availability
  const catalog = [];
  for (const item of items) {
    // Check inventory
    if (item.totalQuantity !== null) {
      const available = item.availableQuantity !== null 
        ? item.availableQuantity 
        : item.totalQuantity - item.soldQuantity;
      if (available <= 0) {
        continue; // Skip out of stock items
      }
    }

    // Calculate points required
    const pointsRequired = calculateRedemptionPoints(item, {
      propertyId,
      roomTypeId,
      redemptionDate: now,
    });

    // Check if member has enough points
    const canAfford = account.points >= pointsRequired;

    catalog.push({
      ...item,
      pointsRequired,
      canAfford,
      available: item.totalQuantity === null 
        ? true 
        : (item.availableQuantity !== null ? item.availableQuantity : item.totalQuantity - item.soldQuantity) > 0,
    });
  }

  return catalog;
}

/**
 * Process a redemption transaction
 * @param {Object} params - Parameters
 * @param {number} params.itemId - Redemption item ID
 * @param {number} params.loyaltyAccountId - Loyalty account ID
 * @param {number} params.bookingId - Booking ID (optional)
 * @param {Object} params.context - Redemption context
 * @returns {Promise<Object>} - Redemption transaction
 */
async function processRedemption({ itemId, loyaltyAccountId, bookingId, context }) {
  // Validate redemption
  const validation = await validateRedemption({
    itemId,
    loyaltyAccountId,
    context,
  });

  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  const { pointsRequired, item } = validation;

  // Deduct points
  await redeemPoints({
    loyaltyAccountId,
    points: pointsRequired,
    reason: `Redeemed: ${item.name}`,
    bookingId: bookingId || null,
    metadata: {
      redemptionItemId: itemId,
      redemptionItemCode: item.code,
      dynamicPricingApplied: context.dynamicPricingApplied || null,
    },
  });

  // Create redemption transaction
  const transaction = await prisma.redemptionTransaction.create({
    data: {
      itemId,
      loyaltyAccountId,
      bookingId: bookingId || null,
      pointsRedeemed: pointsRequired,
      valueReceived: item.value,
      dynamicPricingApplied: context.dynamicPricingApplied || null,
      status: 'PENDING',
      expiresAt: item.value?.expiresInDays 
        ? new Date(Date.now() + item.value.expiresInDays * 24 * 60 * 60 * 1000)
        : null,
      metadata: context.metadata || null,
    },
    include: {
      item: true,
      loyaltyAccount: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  // Update inventory
  if (item.totalQuantity !== null) {
    await prisma.redemptionItem.update({
      where: { id: itemId },
      data: {
        soldQuantity: {
          increment: 1,
        },
        availableQuantity: item.availableQuantity !== null
          ? {
              decrement: 1,
            }
          : undefined,
      },
    });
  }

  return transaction;
}

/**
 * Get member's redemption transactions
 * @param {Object} params - Parameters
 * @param {number} params.loyaltyAccountId - Loyalty account ID
 * @param {string} params.status - Filter by status (optional)
 * @param {number} params.limit - Limit results (optional)
 * @param {number} params.offset - Offset for pagination (optional)
 * @returns {Promise<Object>} - Redemptions with pagination
 */
async function getMemberRedemptions({ loyaltyAccountId, status, limit = 50, offset = 0 }) {
  const where = { loyaltyAccountId };
  if (status) {
    where.status = status;
  }

  const [redemptions, total] = await Promise.all([
    prisma.redemptionTransaction.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            itemType: true,
          },
        },
        booking: {
          select: {
            id: true,
            confirmationNumber: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
      orderBy: { redeemedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.redemptionTransaction.count({ where }),
  ]);

  return {
    redemptions,
    total,
    limit,
    offset,
  };
}

/**
 * Update redemption transaction status
 * @param {Object} params - Parameters
 * @param {number} params.transactionId - Transaction ID
 * @param {string} params.status - New status
 * @returns {Promise<Object>} - Updated transaction
 */
async function updateRedemptionStatus({ transactionId, status }) {
  const validStatuses = ['PENDING', 'CONFIRMED', 'USED', 'EXPIRED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const transaction = await prisma.redemptionTransaction.findUnique({
    where: { id: transactionId },
    include: { item: true },
  });

  if (!transaction) {
    throw new Error('Redemption transaction not found');
  }

  // If marking as USED, set usedAt
  const updateData = { status };
  if (status === 'USED' && !transaction.usedAt) {
    updateData.usedAt = new Date();
  }

  const updated = await prisma.redemptionTransaction.update({
    where: { id: transactionId },
    data: updateData,
    include: {
      item: true,
      loyaltyAccount: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return updated;
}

/**
 * ============================================
 * FRAUD PREVENTION FUNCTIONS
 * ============================================
 */

/**
 * Detect suspicious activity in points transactions
 * @param {number} loyaltyAccountId - Loyalty account ID
 * @param {Object} transaction - Transaction to check
 * @returns {Promise<Object>} - Fraud detection result
 */
async function detectFraud(loyaltyAccountId, transaction) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { id: loyaltyAccountId },
  });

  if (!account) {
    throw new Error(`Loyalty account not found: ${loyaltyAccountId}`);
  }

  const flags = [];

  // Check 1: Unusually large point awards
  if (transaction.points > 100000) {
    flags.push({
      type: 'LARGE_POINTS_AWARD',
      severity: 'HIGH',
      message: `Unusually large points award: ${transaction.points} points`,
    });
  }

  // Check 2: Rapid point accumulation
  const recentTransactions = await prisma.pointsLedger.findMany({
    where: {
      loyaltyAccountId,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
      points: {
        gt: 0, // Only positive transactions
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const totalPointsLast24h = recentTransactions.reduce((sum, t) => sum + t.points, 0);
  if (totalPointsLast24h > 50000) {
    flags.push({
      type: 'RAPID_ACCUMULATION',
      severity: 'MEDIUM',
      message: `Rapid point accumulation: ${totalPointsLast24h} points in last 24 hours`,
    });
  }

  // Check 3: Multiple bookings from same account in short time
  if (transaction.bookingId) {
    const recentBookings = await prisma.booking.count({
      where: {
        loyaltyAccountId: account.id,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    if (recentBookings > 10) {
      flags.push({
        type: 'EXCESSIVE_BOOKINGS',
        severity: 'MEDIUM',
        message: `Excessive bookings: ${recentBookings} bookings in last 7 days`,
      });
    }
  }

  // Check 4: Points from cancelled bookings
  if (transaction.bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: transaction.bookingId },
      select: { status: true },
    });

    if (booking && booking.status === 'CANCELLED') {
      flags.push({
        type: 'POINTS_FROM_CANCELLED',
        severity: 'HIGH',
        message: 'Points awarded from cancelled booking',
      });
    }
  }

  // Calculate risk score
  const riskScore = flags.reduce((score, flag) => {
    if (flag.severity === 'HIGH') return score + 3;
    if (flag.severity === 'MEDIUM') return score + 2;
    return score + 1;
  }, 0);

  return {
    isSuspicious: flags.length > 0,
    riskScore,
    flags,
    recommendation: riskScore >= 5 ? 'REVIEW' : riskScore >= 3 ? 'MONITOR' : 'OK',
  };
}

/**
 * Get advanced analytics for loyalty program
 * @param {Object} params - Analytics parameters
 * @param {Date} params.startDate - Start date (optional)
 * @param {Date} params.endDate - End date (optional)
 * @returns {Promise<Object>} - Analytics data
 */
async function getAdvancedAnalytics({ startDate, endDate }) {
  const dateFilter = {};
  if (startDate) {
    dateFilter.gte = new Date(startDate);
  }
  if (endDate) {
    dateFilter.lte = new Date(endDate);
  }

  const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

  // Tier distribution
  const tierDistribution = await prisma.loyaltyAccount.groupBy({
    by: ['tier'],
    _count: {
      id: true,
    },
  });

  // Points statistics
  const pointsStats = await prisma.loyaltyAccount.aggregate({
    _sum: { points: true },
    _avg: { points: true },
    _max: { points: true },
    _min: { points: true },
  });

  // Transaction statistics
  const transactionStats = await prisma.pointsLedger.aggregate({
    where,
    _sum: { points: true },
    _count: { id: true },
  });

  // Top earners
  const topEarners = await prisma.pointsLedger.groupBy({
    by: ['loyaltyAccountId'],
    where: {
      ...where,
      points: { gt: 0 },
    },
    _sum: {
      points: true,
    },
    orderBy: {
      _sum: {
        points: 'desc',
      },
    },
    take: 10,
  });

  // Redemption statistics
  const redemptionStats = await prisma.redemptionTransaction.aggregate({
    where,
    _sum: { pointsRedeemed: true },
    _count: { id: true },
  });

  // Campaign performance
  const campaignStats = await prisma.campaign.findMany({
    where: {
      isActive: true,
    },
    include: {
      _count: {
        select: {
          pointsLedgerEntries: true,
        },
      },
    },
  });

  return {
    tierDistribution: tierDistribution.map(t => ({
      tier: t.tier,
      count: t._count.id,
    })),
    pointsStatistics: {
      total: pointsStats._sum.points || 0,
      average: Math.round(pointsStats._avg.points || 0),
      max: pointsStats._max.points || 0,
      min: pointsStats._min.points || 0,
    },
    transactionStatistics: {
      totalPointsAwarded: transactionStats._sum.points || 0,
      totalTransactions: transactionStats._count.id || 0,
    },
    topEarners: await Promise.all(
      topEarners.map(async (earner) => {
        const account = await prisma.loyaltyAccount.findUnique({
          where: { id: earner.loyaltyAccountId },
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        });
        return {
          loyaltyAccountId: earner.loyaltyAccountId,
          points: earner._sum.points || 0,
          user: account?.user,
          tier: account?.tier,
        };
      })
    ),
    redemptionStatistics: {
      totalPointsRedeemed: redemptionStats._sum.pointsRedeemed || 0,
      totalRedemptions: redemptionStats._count.id || 0,
    },
    campaignPerformance: campaignStats.map(c => ({
      id: c.id,
      name: c.name,
      redemptions: c._count.pointsLedgerEntries,
    })),
  };
}

module.exports = {
  calculateTier,
  getTierConfig,
  calculateTierProgress,
  evaluateRuleConditions,
  calculatePoints,
  awardPoints,
  redeemPoints,
  checkAndUpdateTier,
  updateLifetimeMetrics,
  getMemberProfile,
  createOrGetLoyaltyAccount,
  awardPointsForBooking,
  // Perk engine functions
  evaluatePerkConditions,
  getEligiblePerks,
  checkPerkCapacity,
  redeemPerk,
  applyPerksToBooking,
  getMemberPerkRedemptions,
  // Campaign engine functions
  getActiveCampaigns,
  evaluateCampaign,
  getMemberCampaigns,
  getCampaignAnalytics,
  // Redemption engine functions
  calculateRedemptionPoints,
  validateRedemption,
  getRedemptionCatalog,
  processRedemption,
  getMemberRedemptions,
  updateRedemptionStatus,
  // Advanced features
  processTierRequalification,
  detectFraud,
  getAdvancedAnalytics,
};

