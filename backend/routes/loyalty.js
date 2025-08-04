const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Get loyalty account by email
router.get('/account/:email', async (req, res) => {
  try {
    const { email } = req.params;

    let loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { email },
      include: {
        bookings: {
          include: {
            room: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    // Create new account if doesn't exist
    if (!loyaltyAccount) {
      loyaltyAccount = await prisma.loyaltyAccount.create({
        data: {
          email,
          guestName: 'Guest', // Will be updated when they make a booking
          pointsBalance: 0,
          tier: 'SILVER'
        },
        include: {
          bookings: {
            include: {
              room: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });
    }

    res.json({
      success: true,
      account: {
        id: loyaltyAccount.id,
        guestName: loyaltyAccount.guestName,
        email: loyaltyAccount.email,
        phone: loyaltyAccount.phone,
        pointsBalance: loyaltyAccount.pointsBalance,
        tier: loyaltyAccount.tier,
        lastActivityDate: loyaltyAccount.lastActivityDate,
        totalSpent: loyaltyAccount.totalSpent,
        totalBookings: loyaltyAccount.totalBookings,
        isActive: loyaltyAccount.isActive,
        bookings: loyaltyAccount.bookings.map(booking => ({
          id: booking.id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          totalPrice: booking.totalPrice,
          status: booking.status,
          roomType: booking.room.type,
          createdAt: booking.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching loyalty account:', error);
    res.status(500).json({ error: 'Failed to fetch loyalty account' });
  }
});

// Get loyalty points (legacy endpoint)
router.get('/points', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { email }
    });

    if (!loyaltyAccount) {
      // Create new account with default points
      loyaltyAccount = await prisma.loyaltyAccount.create({
        data: {
          email,
          guestName: 'Guest',
          pointsBalance: 100, // Welcome bonus
          tier: 'SILVER'
        }
      });
    }

    res.json({ 
      points: loyaltyAccount.pointsBalance,
      tier: loyaltyAccount.tier
    });

  } catch (error) {
    console.error('Error fetching loyalty points:', error);
    res.status(500).json({ error: 'Failed to fetch loyalty points' });
  }
});

// Add points to loyalty account
router.post('/points/add', async (req, res) => {
  try {
    const { email, points, reason } = req.body;

    if (!email || !points || points <= 0) {
      return res.status(400).json({ error: 'Email and positive points amount are required' });
    }

    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { email }
    });

    if (!loyaltyAccount) {
      return res.status(404).json({ error: 'Loyalty account not found' });
    }

    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { email },
      data: {
        pointsBalance: {
          increment: points
        },
        lastActivityDate: new Date()
      }
    });

    // Check if tier should be upgraded
    const newTier = calculateTier(updatedAccount.pointsBalance);
    if (newTier !== updatedAccount.tier) {
      await prisma.loyaltyAccount.update({
        where: { email },
        data: { tier: newTier }
      });
      updatedAccount.tier = newTier;
    }

    res.json({
      success: true,
      message: `${points} points added successfully`,
      account: {
        pointsBalance: updatedAccount.pointsBalance,
        tier: updatedAccount.tier,
        reason: reason || 'Points added'
      }
    });

  } catch (error) {
    console.error('Error adding loyalty points:', error);
    res.status(500).json({ error: 'Failed to add loyalty points' });
  }
});

// Redeem points from loyalty account
router.post('/points/redeem', async (req, res) => {
  try {
    const { email, points, reason } = req.body;

    if (!email || !points || points <= 0) {
      return res.status(400).json({ error: 'Email and positive points amount are required' });
    }

    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { email }
    });

    if (!loyaltyAccount) {
      return res.status(404).json({ error: 'Loyalty account not found' });
    }

    if (loyaltyAccount.pointsBalance < points) {
      return res.status(400).json({ 
        error: 'Insufficient points balance',
        currentBalance: loyaltyAccount.pointsBalance,
        requestedPoints: points
      });
    }

    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { email },
      data: {
        pointsBalance: {
          decrement: points
        },
        lastActivityDate: new Date()
      }
    });

    res.json({
      success: true,
      message: `${points} points redeemed successfully`,
      account: {
        pointsBalance: updatedAccount.pointsBalance,
        tier: updatedAccount.tier,
        reason: reason || 'Points redeemed'
      }
    });

  } catch (error) {
    console.error('Error redeeming loyalty points:', error);
    res.status(500).json({ error: 'Failed to redeem loyalty points' });
  }
});

// Redeem points for discount
router.post('/redeem', async (req, res) => {
  try {
    const { email, points, bookingAmount, reason } = req.body;

    // Validate required fields
    if (!email || !points || !bookingAmount) {
      return res.status(400).json({ 
        error: 'Email, points, and booking amount are required' 
      });
    }

    if (points <= 0 || bookingAmount <= 0) {
      return res.status(400).json({ 
        error: 'Points and booking amount must be positive' 
      });
    }

    // Find loyalty account
    const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
      where: { email }
    });

    if (!loyaltyAccount) {
      return res.status(404).json({ 
        error: 'Loyalty account not found',
        message: 'Please create a booking first to earn loyalty points'
      });
    }

    // Check if account is active
    if (!loyaltyAccount.isActive) {
      return res.status(400).json({ 
        error: 'Loyalty account is inactive' 
      });
    }

    // Check if user has enough points
    if (loyaltyAccount.pointsBalance < points) {
      return res.status(400).json({ 
        error: 'Insufficient points balance',
        currentBalance: loyaltyAccount.pointsBalance,
        requestedPoints: points,
        message: `You have ${loyaltyAccount.pointsBalance} points, but need ${points} points for this redemption`
      });
    }

    // Calculate discount based on points and tier
    const discountAmount = calculateDiscountAmount(points, loyaltyAccount.tier, bookingAmount);
    
    // Validate discount amount
    if (discountAmount <= 0) {
      return res.status(400).json({ 
        error: 'Invalid discount calculation',
        message: 'The requested points do not qualify for a discount'
      });
    }

    // Check if discount exceeds maximum allowed (50% of booking amount)
    const maxDiscount = bookingAmount * 0.5;
    if (discountAmount > maxDiscount) {
      return res.status(400).json({ 
        error: 'Discount exceeds maximum allowed',
        requestedDiscount: discountAmount,
        maxDiscount: maxDiscount,
        message: `Maximum discount allowed is ₹${maxDiscount} (50% of booking amount)`
      });
    }

    // Deduct points from account
    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { email },
      data: {
        pointsBalance: {
          decrement: points
        },
        lastActivityDate: new Date()
      }
    });

    // Log the redemption
    console.log(`Points redemption: ${loyaltyAccount.email} redeemed ${points} points for ₹${discountAmount} discount on ₹${bookingAmount} booking`);

    res.json({
      success: true,
      message: `Successfully redeemed ${points} points for discount`,
      redemption: {
        pointsRedeemed: points,
        discountAmount: discountAmount,
        bookingAmount: bookingAmount,
        finalAmount: bookingAmount - discountAmount,
        pointsRemaining: updatedAccount.pointsBalance,
        tier: loyaltyAccount.tier,
        reason: reason || 'Loyalty points redemption'
      },
      account: {
        pointsBalance: updatedAccount.pointsBalance,
        tier: updatedAccount.tier,
        lastActivityDate: updatedAccount.lastActivityDate
      }
    });

  } catch (error) {
    console.error('Error redeeming points for discount:', error);
    res.status(500).json({ 
      error: 'Failed to redeem points for discount',
      message: 'Please try again later'
    });
  }
});

// Get loyalty tier benefits
router.get('/tier-benefits/:tier', async (req, res) => {
  try {
    const { tier } = req.params;

    const benefits = getTierBenefits(tier.toUpperCase());

    if (!benefits) {
      return res.status(404).json({ error: 'Tier not found' });
    }

    res.json({
      success: true,
      tier: tier.toUpperCase(),
      benefits
    });

  } catch (error) {
    console.error('Error fetching tier benefits:', error);
    res.status(500).json({ error: 'Failed to fetch tier benefits' });
  }
});

// Get all loyalty accounts (admin endpoint)
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await prisma.loyaltyAccount.findMany({
      include: {
        bookings: {
          select: {
            id: true,
            totalPrice: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        pointsBalance: 'desc'
      }
    });

    res.json({
      success: true,
      accounts: accounts.map(account => ({
        id: account.id,
        guestName: account.guestName,
        email: account.email,
        phone: account.phone,
        pointsBalance: account.pointsBalance,
        tier: account.tier,
        lastActivityDate: account.lastActivityDate,
        totalSpent: account.totalSpent,
        totalBookings: account.totalBookings,
        isActive: account.isActive,
        bookingCount: account.bookings.length
      }))
    });

  } catch (error) {
    console.error('Error fetching loyalty accounts:', error);
    res.status(500).json({ error: 'Failed to fetch loyalty accounts' });
  }
});

// Helper function to calculate tier based on points
function calculateTier(points) {
  if (points >= 10000) return 'PLATINUM';
  if (points >= 5000) return 'GOLD';
  return 'SILVER';
}

// Helper function to calculate loyalty points based on amount spent and tier
function calculateLoyaltyPoints(amount, tier) {
  // Base rate: 1 point per ₹100 spent
  const basePoints = Math.floor(amount / 100);
  
  // Apply tier multiplier
  const tierMultiplier = getTierMultiplier(tier);
  const totalPoints = Math.round(basePoints * tierMultiplier);
  
  return totalPoints;
}

// Helper function to get tier multiplier for points calculation
function getTierMultiplier(tier) {
  switch (tier) {
    case 'PLATINUM':
      return 2.0; // 2x points (2 points per ₹100)
    case 'GOLD':
      return 1.5; // 1.5x points (1.5 points per ₹100)
    case 'SILVER':
    default:
      return 1.0; // 1x points (1 point per ₹100)
  }
}

// Helper function to calculate discount amount based on points and tier
function calculateDiscountAmount(points, tier, bookingAmount) {
  // Base conversion rate: 1 point = ₹10 discount
  const baseDiscountRate = 10; // ₹10 per point
  
  // Apply tier multiplier for discount calculation
  const tierDiscountMultiplier = getTierDiscountMultiplier(tier);
  
  // Calculate base discount
  const baseDiscount = points * baseDiscountRate;
  
  // Apply tier multiplier
  const discountAmount = Math.round(baseDiscount * tierDiscountMultiplier);
  
  // Ensure discount doesn't exceed booking amount
  return Math.min(discountAmount, bookingAmount);
}

// Helper function to get tier discount multiplier
function getTierDiscountMultiplier(tier) {
  switch (tier) {
    case 'PLATINUM':
      return 1.5; // 1.5x discount value (₹15 per point)
    case 'GOLD':
      return 1.25; // 1.25x discount value (₹12.5 per point)
    case 'SILVER':
    default:
      return 1.0; // 1x discount value (₹10 per point)
  }
}

// Helper function to get tier benefits
function getTierBenefits(tier) {
  const benefits = {
    SILVER: {
      name: 'Silver Tier',
      minPoints: 0,
      benefits: [
        'Earn 1 point per ₹100 spent',
        'Free WiFi',
        'Late checkout (1 PM)',
        'Welcome drink on arrival'
      ]
    },
    GOLD: {
      name: 'Gold Tier',
      minPoints: 5000,
      benefits: [
        'Earn 1.5 points per ₹100 spent',
        'Free WiFi',
        'Late checkout (2 PM)',
        'Welcome drink on arrival',
        'Room upgrade (subject to availability)',
        '10% discount on room service',
        'Priority booking'
      ]
    },
    PLATINUM: {
      name: 'Platinum Tier',
      minPoints: 10000,
      benefits: [
        'Earn 2 points per ₹100 spent',
        'Free WiFi',
        'Late checkout (3 PM)',
        'Welcome drink on arrival',
        'Room upgrade (subject to availability)',
        '20% discount on room service',
        'Priority booking',
        'Free breakfast',
        'Concierge service',
        'Exclusive events access'
      ]
    }
  };

  return benefits[tier];
}

module.exports = router;
