const express = require('express');
const Razorpay = require('razorpay');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Initialize Razorpay with your key_id and key_secret
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a new payment order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, guestName, bookingId, currency = 'INR', testMode = false } = req.body;

    // Validate required fields
    if (!amount || !guestName || !bookingId) {
      return res.status(400).json({ 
        error: 'Amount, guest name, and booking ID are required' 
      });
    }

    // Validate amount (should be in paise for Razorpay)
    const amountInPaise = Math.round(amount * 100); // Convert to paise
    if (amountInPaise < 100) { // Minimum amount is 1 INR (100 paise)
      return res.status(400).json({ 
        error: 'Amount must be at least 1 INR' 
      });
    }

    // TEST MODE: For development/testing without Razorpay
    const isTestMode = testMode || process.env.NODE_ENV === 'development' && 
                       (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('placeholder'));
    
    if (isTestMode) {
      console.log('⚠️  TEST MODE: Bypassing Razorpay payment');
      
      // Verify booking exists
      const booking = await prisma.booking.findUnique({
        where: { id: parseInt(bookingId) },
        include: { room: true }
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      return res.json({
        success: true,
        testMode: true,
        message: 'Test mode - payment bypassed for development',
        order: {
          id: `test_order_${bookingId}_${Date.now()}`,
          amount: amountInPaise,
          currency: currency,
          receipt: `test_booking_${bookingId}`
        },
        bookingId: bookingId,
        instructions: 'Use test payment confirmation endpoint: POST /api/payment/test-confirm'
      });
    }

    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ 
        error: 'Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.' 
      });
    }

    // Verify booking exists and is in PENDING status
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: { room: true }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ 
        error: `Booking is not in pending status. Current status: ${booking.status}` 
      });
    }

    // Verify amount matches booking total
    if (Math.abs(amount - booking.totalPrice) > 0.01) { // Allow small floating point differences
      return res.status(400).json({ 
        error: `Payment amount (${amount}) does not match booking total (${booking.totalPrice})` 
      });
    }

    // Create Razorpay order
    const orderOptions = {
      amount: amountInPaise,
      currency: currency,
      receipt: `booking_${bookingId}`,
      notes: {
        guestName: guestName,
        bookingId: bookingId,
        hotel: 'Pod & Beyond Hotel',
        roomType: booking.room.name
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    // Save payment record to database
    await prisma.payment.create({
      data: {
        bookingId: parseInt(bookingId),
        razorpayOrderId: order.id,
        amount: amount,
        status: 'PENDING'
      }
    });

    console.log(`Payment order created for booking ${bookingId}: ${order.id}`);

    res.status(201).json({
      success: true,
      orderId: order.id,
      amount: amountInPaise,
      currency: currency,
      receipt: order.receipt,
      bookingId: bookingId,
      notes: orderOptions.notes
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    
    if (error.error && error.error.description) {
      return res.status(400).json({ 
        error: `Payment order creation failed: ${error.error.description}` 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create payment order' 
    });
  }
});

// Verify payment signature and confirm booking
router.post('/verify-payment', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        error: 'Missing payment verification parameters' 
      });
    }

    // Create the signature string
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    // Generate expected signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // Verify signature
    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ 
        error: 'Payment verification failed - invalid signature' 
      });
    }

    // Update payment status in database
    try {
      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId: razorpay_order_id },
        include: {
          booking: {
            include: {
              room: true,
              loyaltyAccount: true
            }
          }
        }
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment record not found' });
      }

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          status: 'COMPLETED'
        }
      });

      console.log(`Payment ${razorpay_payment_id} verified for booking ${payment.bookingId}`);

      // Confirm the booking and add loyalty points
      const bookingConfirmation = await confirmBookingAfterPayment(
        payment.bookingId, 
        razorpay_payment_id, 
        payment.amount
      );

      res.json({
        success: true,
        message: 'Payment verified and booking confirmed successfully',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        booking: bookingConfirmation
      });

    } catch (dbError) {
      console.error('Error updating payment in database:', dbError);
      res.status(500).json({ error: 'Failed to update payment status' });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment' 
    });
  }
});

// Helper function to confirm booking after payment success
async function confirmBookingAfterPayment(bookingId, paymentId, paymentAmount) {
  try {
    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: true,
        loyaltyAccount: true
      }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'PENDING') {
      throw new Error(`Booking is not in pending status. Current status: ${booking.status}`);
    }

    // Update booking status to CONFIRMED
    const confirmedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status: 'CONFIRMED',
        updatedAt: new Date()
      },
      include: {
        room: true,
        loyaltyAccount: true
      }
    });

    // Calculate and add loyalty points after payment confirmation
    const loyaltyPoints = calculateLoyaltyPoints(paymentAmount);
    const loyaltyUpdate = await updateLoyaltyAccount(booking.loyaltyAccountId, loyaltyPoints, paymentAmount);

    console.log(`Booking ${bookingId} confirmed after payment success`);
    console.log(`Loyalty points added: ${loyaltyPoints} points`);

    return {
      id: confirmedBooking.id,
      guestName: confirmedBooking.guestName,
      email: confirmedBooking.email,
      checkIn: confirmedBooking.checkIn,
      checkOut: confirmedBooking.checkOut,
      guests: confirmedBooking.guests,
      totalPrice: confirmedBooking.totalPrice,
      roomName: confirmedBooking.room.name,
      roomType: confirmedBooking.room.type,
      status: confirmedBooking.status,
      loyaltyAccount: {
        userId: loyaltyUpdate.updatedAccount.userId,
        points: loyaltyUpdate.updatedAccount.points,
        tier: loyaltyUpdate.updatedAccount.tier,
        pointsAdded: loyaltyUpdate.pointsAdded,
        tierUpgraded: loyaltyUpdate.tierUpgraded,
        newTier: loyaltyUpdate.newTier,
        previousTier: loyaltyUpdate.previousTier
      }
    };

  } catch (error) {
    console.error('Error confirming booking after payment:', error);
    throw error;
  }
}

// Helper function to calculate loyalty points (1 point per ₹100 spent)
function calculateLoyaltyPoints(totalPrice) {
  // Convert to rupees if price is in dollars (assuming 1 USD = 75 INR for calculation)
  const priceInRupees = totalPrice * 75; // Adjust conversion rate as needed
  const points = Math.floor(priceInRupees / 100);
  console.log(`Calculating loyalty points: ₹${priceInRupees} spent = ${points} points`);
  return points;
}

// Helper function to determine tier based on total points
function determineTier(totalPoints) {
  if (totalPoints >= 10000) {
    return 'PLATINUM';
  } else if (totalPoints >= 5000) {
    return 'GOLD';
  } else {
    return 'SILVER';
  }
}

// Helper function to update loyalty account with points and tier
async function updateLoyaltyAccount(loyaltyAccountId, pointsToAdd, totalPrice) {
  try {
    // Get current loyalty account
    const currentAccount = await prisma.loyaltyAccount.findUnique({
      where: { id: loyaltyAccountId }
    });

    if (!currentAccount) {
      throw new Error('Loyalty account not found');
    }

    // Calculate new total points
    const newTotalPoints = currentAccount.points + pointsToAdd;
    
    // Determine new tier
    const newTier = determineTier(newTotalPoints);
    
    // Check if tier has changed
    const tierUpgraded = newTier !== currentAccount.tier;

    // Update loyalty account
    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { id: loyaltyAccountId },
      data: {
        points: newTotalPoints,
        tier: newTier,
        lastUpdated: new Date()
      }
    });

    console.log(`Loyalty account updated: ${pointsToAdd} points added`);
    console.log(`Total points: ${currentAccount.points} → ${newTotalPoints}`);
    
    if (tierUpgraded) {
      console.log(`Tier upgraded: ${currentAccount.tier} → ${newTier}`);
    }

    return {
      updatedAccount,
      pointsAdded: pointsToAdd,
      totalPoints: newTotalPoints,
      tierUpgraded,
      newTier,
      previousTier: currentAccount.tier
    };
  } catch (error) {
    console.error('Error updating loyalty account:', error);
    throw error;
  }
}

// Get payment details by order ID
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ 
        error: 'Order ID is required' 
      });
    }

    const order = await razorpay.orders.fetch(orderId);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        notes: order.notes,
        created_at: order.created_at
      }
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    
    if (error.error && error.error.description) {
      return res.status(404).json({ 
        error: `Order not found: ${error.error.description}` 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch order details' 
    });
  }
});

// Get all payments for a booking
router.get('/payments/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ 
        error: 'Booking ID is required' 
      });
    }

    const payments = await prisma.payment.findMany({
      where: {
        bookingId: parseInt(bookingId)
      },
      include: {
        booking: {
          include: {
            room: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      payments: payments.map(payment => ({
        id: payment.id,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
        booking: {
          id: payment.booking.id,
          guestName: payment.booking.guestName,
          roomType: payment.booking.room.name,
          totalPrice: payment.booking.totalPrice,
          status: payment.booking.status
        }
      }))
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payment details' 
    });
  }
});

// Helper function to calculate tier based on points (legacy - kept for compatibility)
function calculateTier(points) {
  if (points >= 10000) return 'PLATINUM';
  if (points >= 5000) return 'GOLD';
  return 'SILVER';
}

// Helper function to calculate loyalty points based on amount spent and tier (legacy - kept for compatibility)
function calculateLoyaltyPoints(amount, tier) {
  // Base rate: 1 point per ₹100 spent
  const basePoints = Math.floor(amount / 100);
  
  // Apply tier multiplier
  const tierMultiplier = getTierMultiplier(tier);
  const totalPoints = Math.round(basePoints * tierMultiplier);
  
  return totalPoints;
}

// Helper function to get tier multiplier for points calculation (legacy - kept for compatibility)
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

// Helper function to get points multiplier based on tier (legacy - kept for compatibility)
function getPointsMultiplier(tier) {
  return getTierMultiplier(tier);
}

// Test mode payment confirmation (for development without Razorpay)
router.post('/test-confirm', async (req, res) => {
  try {
    const { bookingId, orderId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    console.log('⚠️  TEST MODE: Confirming payment for booking', bookingId);

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: { 
        room: true,
        loyaltyAccount: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ 
        error: `Booking is not in pending status. Current status: ${booking.status}` 
      });
    }

    // Create a test payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalPrice,
        status: 'COMPLETED',
        razorpayOrderId: orderId || `test_order_${Date.now()}`,
        razorpayPaymentId: `test_payment_${Date.now()}`
      }
    });

    // Update booking to CONFIRMED
    const confirmedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CONFIRMED' },
      include: {
        room: true,
        loyaltyAccount: true,
        payments: true
      }
    });

    // Calculate and add loyalty points (10% cashback)
    const loyaltyPoints = Math.floor(booking.totalPrice * 0.10); // 10% as points
    
    if (booking.loyaltyAccountId) {
      const updatedLoyalty = await prisma.loyaltyAccount.update({
        where: { id: booking.loyaltyAccountId },
        data: {
          points: { increment: loyaltyPoints },
          lastUpdated: new Date()
        }
      });

      console.log(`✅ TEST MODE: Added ${loyaltyPoints} loyalty points`);
    }

    res.json({
      success: true,
      testMode: true,
      message: 'Test payment confirmed successfully',
      booking: confirmedBooking,
      payment: payment,
      loyaltyPoints: loyaltyPoints
    });

  } catch (error) {
    console.error('Error in test payment confirmation:', error);
    res.status(500).json({ 
      error: 'Failed to confirm test payment',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 