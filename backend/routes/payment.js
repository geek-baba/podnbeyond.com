/**
 * Payment Routes
 * Handles payment creation, recording, and refunds
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../lib/rbac');

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all payment routes
router.use(authenticate);

/**
 * POST /api/payments
 * Create a new payment for a booking
 * RBAC: bookings:write:scoped, payments:write (admin)
 */
router.post('/payments', requirePermission('bookings:write:scoped'), async (req, res) => {
  try {
    const { bookingId, amount, method, currency, externalTxnId, notes } = req.body;

    if (!bookingId || !amount || !method) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: bookingId, amount, method'
      });
    }

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId, 10) },
      include: {
        payments: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Validate amount
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment amount'
      });
    }

    // Determine payment status based on method
    // Note: PaymentStatus enum values: PENDING, COMPLETED, FAILED, CANCELLED, REFUNDED
    let paymentStatus = 'PENDING';
    if (method === 'CASH' || method === 'CARD_ON_FILE') {
      paymentStatus = 'COMPLETED'; // Cash and card on file are immediately completed
    } else if (method === 'RAZORPAY') {
      // Razorpay payments might be authorized first
      paymentStatus = externalTxnId ? 'COMPLETED' : 'PENDING';
    }

    // Create payment in transaction
    const payment = await prisma.$transaction(async (tx) => {
      // Create payment record
      const newPayment = await tx.payment.create({
        data: {
          bookingId: parseInt(bookingId, 10),
          amount: paymentAmount,
          status: paymentStatus,
          razorpayPaymentId: externalTxnId || null,
          metadata: {
            method: method,
            currency: currency || booking.currency || 'INR',
            createdBy: req.user.id,
            notes: notes || null,
            createdAt: new Date()
          }
        }
      });

      // Note: Booking total is already set, we just track payments
      // No need to update booking.totalPrice

      return newPayment;
    });

    // Get updated booking with details
    const updatedBooking = await bookingService.getBookingWithDetails(parseInt(bookingId, 10));

    res.json({
      success: true,
      message: 'Payment created successfully',
      data: {
        payment,
        booking: updatedBooking
      }
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment',
      message: error.message
    });
  }
});

/**
 * POST /api/payments/:id/refund
 * Issue a refund for a payment
 * RBAC: bookings:write:scoped, payments:write (admin)
 */
router.post('/payments/:id/refund', requirePermission('bookings:write:scoped'), async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id, 10);
    const { amount, reason, processRefund } = req.body;

    // Get payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: true
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Validate payment can be refunded
    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: `Cannot refund payment with status ${payment.status}. Only COMPLETED payments can be refunded.`
      });
    }

    // Validate refund amount
    const refundAmount = amount ? parseFloat(amount) : payment.amount;
    if (isNaN(refundAmount) || refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid refund amount'
      });
    }

    if (refundAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        error: 'Refund amount cannot exceed payment amount'
      });
    }

    // Process refund in transaction
    const refund = await prisma.$transaction(async (tx) => {
      // Update payment status to REFUNDED
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED',
          metadata: {
            ...(payment.metadata || {}),
            refundedBy: req.user.id,
            refundAmount: refundAmount,
            refundReason: reason || null,
            refundedAt: new Date(),
            processRefund: processRefund !== false // Default to true
          },
          updatedAt: new Date()
        }
      });

      // Create refund record (negative amount)
      const refundPayment = await tx.payment.create({
        data: {
          bookingId: payment.bookingId,
          amount: -refundAmount, // Negative amount for refund
          status: 'REFUNDED',
          razorpayPaymentId: payment.razorpayPaymentId ? `REFUND-${payment.razorpayPaymentId}` : null,
          metadata: {
            method: payment.metadata?.method || 'OTHER',
            currency: payment.metadata?.currency || 'INR',
            originalPaymentId: paymentId,
            refundedBy: req.user.id,
            refundReason: reason || null,
            refundedAt: new Date(),
            processRefund: processRefund !== false
          }
        }
      });

      // TODO: Process refund via Razorpay if processRefund is true
      if (processRefund && payment.metadata?.method === 'RAZORPAY' && payment.razorpayPaymentId) {
        // TODO: Implement Razorpay refund API call
        // const razorpayRefund = await razorpayClient.payments.refund(payment.razorpayPaymentId, {
        //   amount: refundAmount * 100 // Convert to paise
        // });
        // Update refund payment with Razorpay refund ID
        // await tx.payment.update({
        //   where: { id: refundPayment.id },
        //   data: {
        //     razorpayPaymentId: razorpayRefund.id,
        //     metadata: {
        //       ...refundPayment.metadata,
        //       razorpayRefundId: razorpayRefund.id
        //   }
        // });
      }

      return refundPayment;
    });

    // Get updated booking with details
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: payment.bookingId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        property: true,
        roomType: true,
        ratePlan: true,
        cancellationPolicy: true,
        stays: true,
        bookingGuests: true,
        bookingAuditLogs: {
          orderBy: { timestamp: 'desc' },
          take: 10
        },
        roomAssignments: true
      }
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refund,
        booking: updatedBooking
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund',
      message: error.message
    });
  }
});

/**
 * POST /api/bookings/:id/payments/charge-card
 * Charge card on file for a booking
 * RBAC: bookings:write:scoped, payments:write (admin)
 */
router.post('/bookings/:id/payments/charge-card', requirePermission('bookings:write:scoped'), async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const { amount, cardId, notes } = req.body;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Calculate outstanding balance
    const totalPaid = booking.payments
      .filter(p => p.status === 'CAPTURED')
      .reduce((sum, p) => sum + p.amount, 0);
    const outstandingBalance = booking.totalPrice - totalPaid;

    // Validate amount
    const chargeAmount = amount ? parseFloat(amount) : outstandingBalance;
    if (isNaN(chargeAmount) || chargeAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid charge amount'
      });
    }

    if (chargeAmount > outstandingBalance) {
      return res.status(400).json({
        success: false,
        error: 'Charge amount cannot exceed outstanding balance'
      });
    }

    // TODO: Charge card via Razorpay or payment gateway
    // For now, create payment record as CAPTURED
    // In production, this would:
    // 1. Charge the card via payment gateway
    // 2. Create payment record with CAPTURED status
    // 3. Handle authorization failures

    // Create payment in transaction
    const payment = await prisma.$transaction(async (tx) => {
      // Create payment record
      const newPayment = await tx.payment.create({
        data: {
          bookingId: bookingId,
          amount: chargeAmount,
          status: 'COMPLETED',
          razorpayPaymentId: cardId ? `CARD-${cardId}` : null,
          metadata: {
            method: 'CARD_ON_FILE',
            currency: booking.currency || 'INR',
            createdBy: req.user.id,
            cardId: cardId || null,
            notes: notes || null,
            chargedAt: new Date()
          }
        }
      });

      return newPayment;
    });

    // Get updated booking with details
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        property: true,
        roomType: true,
        ratePlan: true,
        cancellationPolicy: true,
        stays: true,
        bookingGuests: true,
        bookingAuditLogs: {
          orderBy: { timestamp: 'desc' },
          take: 10
        },
        roomAssignments: true
      }
    });

    res.json({
      success: true,
      message: 'Card charged successfully',
      data: {
        payment,
        booking: updatedBooking
      }
    });
  } catch (error) {
    console.error('Error charging card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to charge card',
      message: error.message
    });
  }
});

module.exports = router;

