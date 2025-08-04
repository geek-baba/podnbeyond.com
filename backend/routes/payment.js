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
    const { amount, guestName, bookingId, currency = 'INR' } = req.body;

    // Validate required fields
    if (!amount || !guestName) {
      return res.status(400).json({ 
        error: 'Amount and guest name are required' 
      });
    }

    // Validate amount (should be in paise for Razorpay)
    const amountInPaise = Math.round(amount * 100); // Convert to paise
    if (amountInPaise < 100) { // Minimum amount is 1 INR (100 paise)
      return res.status(400).json({ 
        error: 'Amount must be at least 1 INR' 
      });
    }

    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ 
        error: 'Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.' 
      });
    }

    // Create Razorpay order
    const orderOptions = {
      amount: amountInPaise,
      currency: currency,
      receipt: `booking_${bookingId || Date.now()}`,
      notes: {
        guestName: guestName,
        bookingId: bookingId || 'N/A',
        hotel: 'Pod & Beyond Hotel'
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    // Save payment record to database if bookingId is provided
    if (bookingId) {
      await prisma.payment.create({
        data: {
          bookingId: parseInt(bookingId),
          razorpayOrderId: order.id,
          amount: amount,
          currency: currency,
          status: 'PENDING'
        }
      });
    }

    res.status(201).json({
      success: true,
      orderId: order.id,
      amount: amountInPaise,
      currency: currency,
      receipt: order.receipt,
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

// Verify payment signature
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
      await prisma.payment.updateMany({
        where: {
          razorpayOrderId: razorpay_order_id
        },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          status: 'COMPLETED'
        }
      });

      // Update booking status to confirmed
      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId: razorpay_order_id }
      });

      if (payment) {
        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED' }
        });
      }
    } catch (dbError) {
      console.error('Error updating payment in database:', dbError);
      // Continue with response even if DB update fails
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment' 
    });
  }
});

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
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt,
        booking: {
          id: payment.booking.id,
          guestName: payment.booking.guestName,
          roomType: payment.booking.room.type,
          totalPrice: payment.booking.totalPrice
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

module.exports = router; 