const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { createHmac, randomBytes } = require('crypto');
const bookingService = require('../services/bookingService');
const guestService = require('../services/guestService');
const cancellationPolicyService = require('../services/cancellationPolicyService');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Guest Self-Service Routes
 * Allows guests to manage their bookings without authentication
 * Uses signed tokens for secure access
 */

/**
 * Generate signed token for guest booking access
 * @param {number} bookingId - Booking ID
 * @param {string} email - Guest email
 * @returns {string} - Signed token
 */
function generateGuestToken(bookingId, email) {
  const secret = process.env.GUEST_TOKEN_SECRET || 'default-secret-change-in-production';
  const payload = `${bookingId}:${email}:${Date.now()}`;
  const token = Buffer.from(payload).toString('base64');
  const signature = createHmac('sha256', secret)
    .update(token)
    .digest('hex');
  return `${token}.${signature}`;
}

/**
 * Verify signed token for guest booking access
 * @param {string} token - Signed token
 * @returns {Object|null} - Decoded token or null if invalid
 */
function verifyGuestToken(token) {
  try {
    const secret = process.env.GUEST_TOKEN_SECRET || 'default-secret-change-in-production';
    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature) {
      return null;
    }

    // Verify signature
    const expectedSignature = createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('hex');

    if (expectedSignature !== signature) {
      return null;
    }

    // Decode payload
    const payload = Buffer.from(encodedPayload, 'base64').toString('utf-8');
    const [bookingId, email, timestamp] = payload.split(':');

    // Check token age (valid for 30 days)
    const tokenAge = Date.now() - parseInt(timestamp, 10);
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    if (tokenAge > maxAge) {
      return null;
    }

    return {
      bookingId: parseInt(bookingId, 10),
      email,
      timestamp: parseInt(timestamp, 10)
    };
  } catch (error) {
    return null;
  }
}

/**
 * GET /api/guest/bookings
 * Get guest's bookings by email/phone
 * No authentication required (public endpoint)
 */
router.get('/guest/bookings', async (req, res) => {
  try {
    const { email, phone } = req.query;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        error: 'Email or phone is required'
      });
    }

    // Find guest by email or phone
    const guests = await guestService.findGuestByContact(email, phone);

    if (!guests || guests.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No bookings found'
      });
    }

    // Get unique booking IDs
    const bookingIds = [...new Set(guests.map(g => g.bookingId))];

    // Get bookings
    const bookings = await prisma.booking.findMany({
      where: {
        id: { in: bookingIds }
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true
          }
        },
        roomType: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        ratePlan: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        cancellationPolicy: {
          select: {
            id: true,
            name: true,
            humanReadable: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        stays: {
          select: {
            id: true,
            checkInDate: true,
            checkOutDate: true,
            status: true
          }
        },
        bookingGuests: {
          select: {
            id: true,
            name: true,
            email: true,
            isPrimary: true
          },
          where: { isPrimary: true },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Generate access tokens for each booking
    const bookingsWithTokens = bookings.map(booking => {
      const primaryGuest = booking.bookingGuests[0] || { email: booking.email };
      const token = generateGuestToken(booking.id, primaryGuest.email);

      return {
        ...booking,
        accessToken: token,
        manageUrl: `/booking/${token}`
      };
    });

    res.json({
      success: true,
      data: bookingsWithTokens
    });
  } catch (error) {
    console.error('Error fetching guest bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch guest bookings',
      message: error.message
    });
  }
});

/**
 * GET /api/guest/bookings/:token
 * Get booking details by signed token
 * No authentication required (public endpoint)
 */
router.get('/guest/bookings/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = verifyGuestToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    const { bookingId } = decoded;

    // Get booking with details
    const booking = await bookingService.getBookingWithDetails(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Verify email matches (security check)
    const primaryGuest = booking.bookingGuests?.find(g => g.isPrimary) || null;
    if (primaryGuest && primaryGuest.email !== decoded.email && booking.email !== decoded.email) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: booking,
      token: token // Return token for subsequent requests
    });
  } catch (error) {
    console.error('Error fetching booking by token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
      message: error.message
    });
  }
});

/**
 * PUT /api/guest/bookings/:token
 * Modify booking (if allowed by policy)
 * No authentication required (uses token)
 */
router.put('/guest/bookings/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = verifyGuestToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    const { bookingId } = decoded;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        cancellationPolicy: true,
        property: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Verify email matches (security check)
    if (booking.email !== decoded.email) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Validate state - can only modify CONFIRMED bookings
    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        error: `Cannot modify booking in ${booking.status} status. Only CONFIRMED bookings can be modified.`
      });
    }

    // Check if modification is allowed by policy
    // For now, allow modifications if booking is CONFIRMED
    // TODO: Add policy-based modification rules

    const {
      specialRequests,
      notesGuest,
      guestName,
      phone
    } = req.body;

    // Update booking in transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      const updateData = {};
      const changes = {};

      // Update special requests if provided
      if (specialRequests !== undefined) {
        updateData.specialRequests = specialRequests;
        changes.specialRequests = {
          old: booking.specialRequests,
          new: specialRequests
        };
      }

      // Update guest notes if provided
      if (notesGuest !== undefined) {
        updateData.notesGuest = notesGuest;
        changes.notesGuest = {
          old: booking.notesGuest,
          new: notesGuest
        };
      }

      // Update guest name if provided
      if (guestName) {
        updateData.guestName = guestName;
        changes.guestName = {
          old: booking.guestName,
          new: guestName
        };

        // Update primary guest
        const primaryGuest = await prisma.bookingGuest.findFirst({
          where: {
            bookingId: bookingId,
            isPrimary: true
          }
        });

        if (primaryGuest) {
          await guestService.updateGuest(primaryGuest.id, {
            name: guestName
          });
        }
      }

      // Update phone if provided
      if (phone) {
        updateData.phone = phone;
        changes.phone = {
          old: booking.phone,
          new: phone
        };

        // Update primary guest
        const primaryGuest = await prisma.bookingGuest.findFirst({
          where: {
            bookingId: bookingId,
            isPrimary: true
          }
        });

        if (primaryGuest) {
          await guestService.updateGuest(primaryGuest.id, {
            phone: phone
          });
        }
      }

      if (Object.keys(updateData).length === 0) {
        return booking;
      }

      updateData.updatedAt = new Date();

      // Update booking
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: updateData
      });

      // Create audit log
      await bookingService.createAuditLog(bookingId, 'MODIFY', {
        user: { id: 'guest', email: decoded.email },
        meta: {
          changes,
          source: 'GUEST_SELF_SERVICE',
          ...changes
        }
      });

      return updated;
    });

    // Get updated booking with details
    const bookingDetails = await bookingService.getBookingWithDetails(bookingId);

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: bookingDetails
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking',
      message: error.message
    });
  }
});

/**
 * POST /api/guest/bookings/:token/cancel
 * Cancel booking (if allowed by policy)
 * No authentication required (uses token)
 */
router.post('/guest/bookings/:token/cancel', async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = verifyGuestToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    const { bookingId } = decoded;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        cancellationPolicy: true,
        property: true,
        stays: true,
        payments: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Verify email matches (security check)
    if (booking.email !== decoded.email) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Validate state - can only cancel HOLD, PENDING, or CONFIRMED
    if (!['HOLD', 'PENDING', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel booking in ${booking.status} status. Only HOLD, PENDING, or CONFIRMED bookings can be cancelled.`
      });
    }

    // Calculate cancellation fee
    const cancellationDate = new Date();
    const feeDetails = await cancellationPolicyService.calculateFeeForBooking(bookingId, cancellationDate);

    const { reason } = req.body;

    // Cancel booking in transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Process refund if applicable
      if (feeDetails.refundAmount > 0) {
        // TODO: Implement refund processing via Razorpay
        // For now, just create a refund record
        await tx.payment.create({
          data: {
            bookingId: bookingId,
            amount: -feeDetails.refundAmount, // Negative amount for refund
            status: 'REFUNDED',
            metadata: {
              type: 'CANCELLATION_REFUND',
              cancellationFee: feeDetails.fee,
              refundAmount: feeDetails.refundAmount,
              processedAt: new Date(),
              source: 'GUEST_SELF_SERVICE'
            }
          }
        });
      }

      // Transition booking to CANCELLED
      const transitioned = await bookingService.transitionState(bookingId, 'CANCELLED', {
        user: { id: 'guest', email: decoded.email },
        meta: {
          reason: reason || 'Guest request',
          cancellationFee: feeDetails.fee,
          refundAmount: feeDetails.refundAmount,
          policy: feeDetails.policy,
          source: 'GUEST_SELF_SERVICE'
        }
      });

      // Update stay statuses to CANCELLED
      for (const stay of booking.stays) {
        await stayService.updateStayStatus(stay.id, 'CANCELLED');
      }

      // Release inventory (if applicable)
      // TODO: Implement inventory release logic

      return transitioned;
    });

    // Get updated booking with details
    const bookingDetails = await bookingService.getBookingWithDetails(bookingId);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: bookingDetails,
      cancellationFee: feeDetails
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking',
      message: error.message
    });
  }
});

/**
 * POST /api/guest/bookings/:token/request-modification
 * Request modification (for OTA bookings or complex changes)
 * No authentication required (uses token)
 */
router.post('/guest/bookings/:token/request-modification', async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = verifyGuestToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    const { bookingId } = decoded;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: true,
        roomType: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Verify email matches (security check)
    if (booking.email !== decoded.email) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const {
      requestedChanges,
      reason,
      preferredContactMethod
    } = req.body;

    if (!requestedChanges) {
      return res.status(400).json({
        success: false,
        error: 'Requested changes are required'
      });
    }

    // Create modification request
    // TODO: Implement modification request system
    // For now, add as internal note
    await prisma.$transaction(async (tx) => {
      // Add modification request as internal note
      const existingNotes = booking.notesInternal || '';
      const modificationRequest = `
MODIFICATION REQUEST (${new Date().toISOString()}):
Requested Changes: ${JSON.stringify(requestedChanges)}
Reason: ${reason || 'Not provided'}
Preferred Contact: ${preferredContactMethod || 'Email'}
      `.trim();

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          notesInternal: existingNotes
            ? `${existingNotes}\n\n${modificationRequest}`
            : modificationRequest,
          updatedAt: new Date()
        }
      });

      // Create audit log
      await bookingService.createAuditLog(bookingId, 'MODIFICATION_REQUEST', {
        user: { id: 'guest', email: decoded.email },
        meta: {
          requestedChanges,
          reason,
          preferredContactMethod,
          source: 'GUEST_SELF_SERVICE'
        }
      });
    });

    // TODO: Send email notification to hotel staff
    // TODO: Create modification request record

    res.json({
      success: true,
      message: 'Modification request submitted successfully. Our team will contact you shortly.',
      data: {
        bookingId,
        requestedChanges,
        status: 'PENDING'
      }
    });
  } catch (error) {
    console.error('Error submitting modification request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit modification request',
      message: error.message
    });
  }
});

module.exports = router;

