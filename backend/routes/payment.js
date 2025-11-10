const express = require('express');
let Razorpay;
try {
  // Defer requiring Razorpay until we know credentials exist to avoid throwing during boot
  Razorpay = require('razorpay');
} catch (error) {
  // If the dependency is missing, leave Razorpay undefined; downstream checks will prevent usage.
  Razorpay = null;
}
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

const hasRazorpayCredentials =
  Boolean(process.env.RAZORPAY_KEY_ID) &&
  process.env.RAZORPAY_KEY_ID !== 'REPLACE_ME' &&
  Boolean(process.env.RAZORPAY_KEY_SECRET) &&
  process.env.RAZORPAY_KEY_SECRET !== 'REPLACE_ME';

let razorpay = null;
if (hasRazorpayCredentials && Razorpay) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } catch (error) {
    console.error('Failed to initialize Razorpay SDK:', error.message);
    razorpay = null;
  }
}

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
    const isTestMode =
      testMode ||
      !razorpay ||
      (process.env.NODE_ENV === 'development' &&
        (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('placeholder')));
    
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
    if (!razorpay) {
      return res.status(503).json({
        error:
          'Razorpay credentials are not configured on this environment. Payments cannot be processed right now.',
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

    if (!razorpay || !hasRazorpayCredentials) {
      return res.status(503).json({
        error: 'Payment verification is unavailable because Razorpay credentials are not configured.',
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
      console.log(`