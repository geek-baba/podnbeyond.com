const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bookingService = require('../services/bookingService');
const guestService = require('../services/guestService');
const stayService = require('../services/stayService');
const cancellationPolicyService = require('../services/cancellationPolicyService');
const loyaltyService = require('../services/loyaltyService');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../lib/rbac');

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all booking routes
router.use(authenticate);

/**
 * GET /api/bookings
 * Enhanced booking list with filters, pagination, sorting, and search
 * RBAC: bookings:read:scoped, bookings:read (admin)
 */
router.get('/bookings', requirePermission('bookings:read:scoped'), async (req, res) => {
  try {
    const {
      // Filters
      propertyId,
      status,
      source,
      checkInFrom,
      checkInTo,
      checkOutFrom,
      checkOutTo,
      // Search
      search, // guest name, email, confirmation number
      // Pagination
      page = 1,
      limit = 20,
      // Sorting
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where = {};

    // Property filter (RBAC scoped)
    if (propertyId) {
      where.propertyId = parseInt(propertyId, 10);
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Source filter
    if (source) {
      where.source = source;
    }

    // Date range filters
    if (checkInFrom || checkInTo) {
      where.checkIn = {};
      if (checkInFrom) {
        where.checkIn.gte = new Date(checkInFrom);
      }
      if (checkInTo) {
        where.checkIn.lte = new Date(checkInTo);
      }
    }

    if (checkOutFrom || checkOutTo) {
      where.checkOut = where.checkOut || {};
      if (checkOutFrom) {
        where.checkOut.gte = new Date(checkOutFrom);
      }
      if (checkOutTo) {
        where.checkOut.lte = new Date(checkOutTo);
      }
    }

    // Search filter (guest name, email, confirmation number)
    if (search) {
      where.OR = [
        { guestName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { confirmationNumber: { contains: search, mode: 'insensitive' } },
        { sourceReservationId: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build orderBy
    const orderBy = {};
    orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';

    // Get bookings with pagination
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
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
              name: true
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1
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
          },
          _count: {
            select: {
              stays: true,
              bookingGuests: true,
              payments: true
            }
          }
        },
        orderBy,
        skip,
        take: limitNum
      }),
      prisma.booking.count({ where })
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
      message: error.message
    });
  }
});

/**
 * GET /api/bookings/:id
 * Get booking details with all related data
 * RBAC: bookings:read:scoped, bookings:read (admin)
 */
router.get('/bookings/:id', requirePermission('bookings:read:scoped'), async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);

    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID'
      });
    }

    const booking = await bookingService.getBookingWithDetails(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
      message: error.message
    });
  }
});

/**
 * POST /api/bookings
 * Create booking (staff/walk-in)
 * RBAC: bookings:write:scoped, bookings:* (admin)
 */
router.post('/bookings', requirePermission('bookings:write:scoped'), async (req, res) => {
  try {
    const {
      // Basic booking info
      propertyId,
      roomTypeId,
      ratePlanId,
      checkIn,
      checkOut,
      guests,
      rooms = 1,
      source = 'WALK_IN',
      // Guest info
      guestName,
      email,
      phone,
      // Additional guests
      additionalGuests = [],
      // Stays (for multi-room bookings)
      stays = [],
      // Pricing
      totalPrice,
      currency = 'INR',
      // Cancellation policy
      cancellationPolicyId,
      // Notes
      notesInternal,
      notesGuest,
      specialRequests,
      // OTA info
      sourceReservationId,
      sourceCommissionPct,
      // Loyalty
      loyaltyAccountId
    } = req.body;

    // Validate required fields
    if (!propertyId || !roomTypeId || !checkIn || !checkOut || !guestName || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: propertyId, roomTypeId, checkIn, checkOut, guestName, email'
      });
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid check-in or check-out date'
      });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        error: 'Check-out date must be after check-in date'
      });
    }

    // Create booking in transaction
    const newBooking = await prisma.$transaction(async (tx) => {
      // Calculate total price if not provided
      let calculatedTotalPrice = totalPrice;
      if (!calculatedTotalPrice) {
        // Get rate plan
        const ratePlan = ratePlanId
          ? await tx.ratePlan.findUnique({
              where: { id: parseInt(ratePlanId, 10) }
            })
          : await tx.ratePlan.findFirst({
              where: {
                roomTypeId: parseInt(roomTypeId, 10),
                propertyId: parseInt(propertyId, 10)
              },
              orderBy: { createdAt: 'desc' }
            });

        if (!ratePlan) {
          throw new Error('Rate plan not found');
        }

        // Calculate nights
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        calculatedTotalPrice = ratePlan.seasonalPrice * nights * rooms;
      }

      // Calculate commission if OTA booking
      let commissionAmount = null;
      if (sourceCommissionPct) {
        commissionAmount = (calculatedTotalPrice * sourceCommissionPct) / 100;
      }

      // Create or get loyalty account if email provided (for non-OTA bookings)
      let finalLoyaltyAccountId = loyaltyAccountId ? parseInt(loyaltyAccountId, 10) : null;
      const otaSources = ['OTA_BOOKING_COM', 'OTA_MMT', 'OTA_EASEMYTRIP', 'OTA_CLEARTRIP'];
      const isOTABooking = otaSources.includes(source);

      if (!isOTABooking && email && !finalLoyaltyAccountId) {
        // Find or create user
        let user = await tx.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await tx.user.create({
            data: {
              email,
              name: guestName,
              phone: phone || null,
            },
          });
        }

        // Create or get loyalty account
        let loyaltyAccount = await tx.loyaltyAccount.findUnique({
          where: { userId: user.id },
        });

        if (!loyaltyAccount) {
          const memberCount = await tx.loyaltyAccount.count();
          const memberNumber = String(memberCount + 1).padStart(6, '0');

          loyaltyAccount = await tx.loyaltyAccount.create({
            data: {
              userId: user.id,
              memberNumber,
              tier: 'MEMBER',
              points: 0,
              lifetimeStays: 0,
              lifetimeNights: 0,
              lifetimeSpend: 0,
            },
          });
        }

        finalLoyaltyAccountId = loyaltyAccount.id;
      }

      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          propertyId: parseInt(propertyId, 10),
          roomTypeId: parseInt(roomTypeId, 10),
          ratePlanId: ratePlanId ? parseInt(ratePlanId, 10) : null,
          guestName,
          email,
          phone: phone || null,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guests: parseInt(guests, 10) || 1,
          rooms: parseInt(rooms, 10) || 1,
          totalPrice: calculatedTotalPrice,
          currency,
          status: source === 'WALK_IN' ? 'CONFIRMED' : 'PENDING',
          source,
          sourceReservationId: sourceReservationId || null,
          sourceCommissionPct: sourceCommissionPct || null,
          commissionAmount,
          cancellationPolicyId: cancellationPolicyId ? parseInt(cancellationPolicyId, 10) : null,
          notesInternal: notesInternal || null,
          notesGuest: notesGuest || null,
          specialRequests: specialRequests || null,
          loyaltyAccountId: finalLoyaltyAccountId
        }
      });

      // Generate confirmation number for CONFIRMED bookings
      if (newBooking.status === 'CONFIRMED') {
        const confirmationNumber = bookingService.generateConfirmationNumber(
          newBooking.propertyId,
          newBooking.id
        );
        
        // Check if confirmation number already exists
        const existing = await tx.booking.findUnique({
          where: { confirmationNumber },
          select: { id: true }
        });
        
        if (!existing) {
          await tx.booking.update({
            where: { id: newBooking.id },
            data: { confirmationNumber }
          });
        }
      }

      // Create primary guest (within transaction)
      await tx.bookingGuest.create({
        data: {
          bookingId: newBooking.id,
          name: guestName,
          email,
          phone: phone || null,
          isPrimary: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Create additional guests (within transaction)
      if (additionalGuests && additionalGuests.length > 0) {
        for (const guestData of additionalGuests) {
          await tx.bookingGuest.create({
            data: {
              bookingId: newBooking.id,
              name: guestData.name,
              email: guestData.email || null,
              phone: guestData.phone || null,
              country: guestData.country || null,
              age: guestData.age || null,
              isPrimary: false,
              loyaltyAccountId: guestData.loyaltyAccountId ? parseInt(guestData.loyaltyAccountId, 10) : null,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
      }

      // Create stays (within transaction)
      if (stays && stays.length > 0) {
        for (const stayData of stays) {
          const finalRoomTypeId = stayData.roomTypeId || parseInt(roomTypeId, 10);
          const finalCheckIn = stayData.checkInDate ? new Date(stayData.checkInDate) : checkInDate;
          const finalCheckOut = stayData.checkOutDate ? new Date(stayData.checkOutDate) : checkOutDate;
          const finalNumGuests = stayData.numGuests || parseInt(guests, 10);
          const finalRatePlanId = stayData.ratePlanId || (ratePlanId ? parseInt(ratePlanId, 10) : null);

          // Calculate nightly rates
          const nights = Math.ceil((finalCheckOut - finalCheckIn) / (1000 * 60 * 60 * 24));
          const stayRatePlan = finalRatePlanId
            ? await tx.ratePlan.findUnique({ where: { id: finalRatePlanId } })
            : await tx.ratePlan.findFirst({
                where: {
                  roomTypeId: finalRoomTypeId,
                  propertyId: parseInt(propertyId, 10)
                },
                orderBy: { createdAt: 'desc' }
              });

          const nightlyRates = {};
          const baseRate = stayRatePlan?.seasonalPrice || calculatedTotalPrice / nights;
          const taxPercentage = stayRatePlan?.taxConfig?.percentage || 18;

          for (let i = 0; i < nights; i++) {
            const date = new Date(finalCheckIn);
            date.setDate(date.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];
            const base = baseRate;
            const tax = (base * taxPercentage) / 100;
            nightlyRates[dateKey] = {
              base,
              tax,
              total: base + tax,
              currency: stayRatePlan?.currency || 'INR',
              taxPercentage
            };
          }

          await tx.stay.create({
            data: {
              bookingId: newBooking.id,
              roomTypeId: finalRoomTypeId,
              roomId: stayData.roomId ? parseInt(stayData.roomId, 10) : null,
              checkInDate: finalCheckIn,
              checkOutDate: finalCheckOut,
              numGuests: finalNumGuests,
              ratePlanId: finalRatePlanId,
              nightlyRates,
              status: source === 'WALK_IN' ? 'CONFIRMED' : 'PENDING',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
      } else {
        // Create default stay (within transaction)
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const defaultRatePlan = ratePlanId
          ? await tx.ratePlan.findUnique({ where: { id: parseInt(ratePlanId, 10) } })
          : await tx.ratePlan.findFirst({
              where: {
                roomTypeId: parseInt(roomTypeId, 10),
                propertyId: parseInt(propertyId, 10)
              },
              orderBy: { createdAt: 'desc' }
            });

        const nightlyRates = {};
        const baseRate = defaultRatePlan?.seasonalPrice || calculatedTotalPrice / nights;
        const taxPercentage = defaultRatePlan?.taxConfig?.percentage || 18;

        for (let i = 0; i < nights; i++) {
          const date = new Date(checkInDate);
          date.setDate(date.getDate() + i);
          const dateKey = date.toISOString().split('T')[0];
          const base = baseRate;
          const tax = (base * taxPercentage) / 100;
          nightlyRates[dateKey] = {
            base,
            tax,
            total: base + tax,
            currency: defaultRatePlan?.currency || 'INR',
            taxPercentage
          };
        }

        await tx.stay.create({
          data: {
            bookingId: newBooking.id,
            roomTypeId: parseInt(roomTypeId, 10),
            roomId: null,
            checkInDate,
            checkOutDate,
            numGuests: parseInt(guests, 10),
            ratePlanId: ratePlanId ? parseInt(ratePlanId, 10) : null,
            nightlyRates,
            status: source === 'WALK_IN' ? 'CONFIRMED' : 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }

      // Create audit log (within transaction)
      await tx.bookingAuditLog.create({
        data: {
          bookingId: newBooking.id,
          performedBy: req.user?.id || 'system',
          action: 'CREATE',
          meta: {
            source,
            propertyId: parseInt(propertyId, 10),
            roomTypeId: parseInt(roomTypeId, 10),
            totalPrice: calculatedTotalPrice,
            status: newBooking.status
          },
          timestamp: new Date()
        }
      });

      return newBooking;
    });

    // Return booking with details (outside transaction)
    const bookingDetails = await bookingService.getBookingWithDetails(newBooking.id);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: bookingDetails
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      message: error.message
    });
  }
});

/**
 * PUT /api/bookings/:id
 * Modify booking (dates, guests, room type)
 * RBAC: bookings:write:scoped, bookings:* (admin)
 */
router.put('/bookings/:id', requirePermission('bookings:write:scoped'), async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);

    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID'
      });
    }

    const {
      checkIn,
      checkOut,
      guests,
      roomTypeId,
      ratePlanId,
      notesInternal,
      notesGuest,
      specialRequests,
      cancellationPolicyId
    } = req.body;

    // Get existing booking
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        stays: true,
        bookingGuests: true
      }
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Validate state - can only modify CONFIRMED bookings
    if (existingBooking.status !== 'CONFIRMED' && existingBooking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: `Cannot modify booking in ${existingBooking.status} status. Only CONFIRMED or PENDING bookings can be modified.`
      });
    }

    // Update booking in transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      const updateData = {};
      const changes = {};

      // Update dates if provided
      if (checkIn || checkOut) {
        const newCheckIn = checkIn ? new Date(checkIn) : existingBooking.checkIn;
        const newCheckOut = checkOut ? new Date(checkOut) : existingBooking.checkOut;

        if (newCheckOut <= newCheckIn) {
          throw new Error('Check-out date must be after check-in date');
        }

        updateData.checkIn = newCheckIn;
        updateData.checkOut = newCheckOut;
        changes.dates = {
          old: { checkIn: existingBooking.checkIn, checkOut: existingBooking.checkOut },
          new: { checkIn: newCheckIn, checkOut: newCheckOut }
        };
      }

      // Update guests if provided
      if (guests) {
        updateData.guests = parseInt(guests, 10);
        changes.guests = {
          old: existingBooking.guests,
          new: parseInt(guests, 10)
        };
      }

      // Update room type if provided
      if (roomTypeId) {
        updateData.roomTypeId = parseInt(roomTypeId, 10);
        changes.roomType = {
          old: existingBooking.roomTypeId,
          new: parseInt(roomTypeId, 10)
        };
      }

      // Update rate plan if provided
      if (ratePlanId) {
        updateData.ratePlanId = parseInt(ratePlanId, 10);
        changes.ratePlan = {
          old: existingBooking.ratePlanId,
          new: parseInt(ratePlanId, 10)
        };
      }

      // Update notes if provided
      if (notesInternal !== undefined) {
        updateData.notesInternal = notesInternal;
      }
      if (notesGuest !== undefined) {
        updateData.notesGuest = notesGuest;
      }
      if (specialRequests !== undefined) {
        updateData.specialRequests = specialRequests;
      }

      // Update cancellation policy if provided
      if (cancellationPolicyId !== undefined) {
        updateData.cancellationPolicyId = cancellationPolicyId ? parseInt(cancellationPolicyId, 10) : null;
      }

      // Recalculate total price if dates, room type, or rate plan changed
      if (checkIn || checkOut || roomTypeId || ratePlanId) {
        const finalRoomTypeId = roomTypeId ? parseInt(roomTypeId, 10) : existingBooking.roomTypeId;
        const finalRatePlanId = ratePlanId ? parseInt(ratePlanId, 10) : existingBooking.ratePlanId;
        const finalCheckIn = checkIn ? new Date(checkIn) : existingBooking.checkIn;
        const finalCheckOut = checkOut ? new Date(checkOut) : existingBooking.checkOut;

        // Get rate plan
        const ratePlan = finalRatePlanId
          ? await tx.ratePlan.findUnique({
              where: { id: finalRatePlanId }
            })
          : await tx.ratePlan.findFirst({
              where: {
                roomTypeId: finalRoomTypeId,
                propertyId: existingBooking.propertyId
              },
              orderBy: { createdAt: 'desc' }
            });

        if (ratePlan) {
          const nights = Math.ceil((finalCheckOut - finalCheckIn) / (1000 * 60 * 60 * 24));
          updateData.totalPrice = ratePlan.seasonalPrice * nights * existingBooking.rooms;
          changes.totalPrice = {
            old: existingBooking.totalPrice,
            new: updateData.totalPrice
          };
        }
      }

      updateData.updatedAt = new Date();

      // Update booking
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: updateData
      });

      // Update stays if dates changed (within transaction)
      if (checkIn || checkOut) {
        const finalCheckIn = checkIn ? new Date(checkIn) : existingBooking.checkIn;
        const finalCheckOut = checkOut ? new Date(checkOut) : existingBooking.checkOut;

        // Recalculate nightly rates for each stay
        for (const stay of existingBooking.stays) {
          const nights = Math.ceil((finalCheckOut - finalCheckIn) / (1000 * 60 * 60 * 24));
          const stayRatePlan = stay.ratePlanId
            ? await tx.ratePlan.findUnique({ where: { id: stay.ratePlanId } })
            : await tx.ratePlan.findFirst({
                where: {
                  roomTypeId: stay.roomTypeId,
                  propertyId: existingBooking.propertyId
                },
                orderBy: { createdAt: 'desc' }
              });

          const nightlyRates = {};
          const baseRate = stayRatePlan?.seasonalPrice || existingBooking.totalPrice / nights;
          const taxPercentage = stayRatePlan?.taxConfig?.percentage || 18;

          for (let i = 0; i < nights; i++) {
            const date = new Date(finalCheckIn);
            date.setDate(date.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];
            const base = baseRate;
            const tax = (base * taxPercentage) / 100;
            nightlyRates[dateKey] = {
              base,
              tax,
              total: base + tax,
              currency: stayRatePlan?.currency || 'INR',
              taxPercentage
            };
          }

          await tx.stay.update({
            where: { id: stay.id },
            data: {
              checkInDate: finalCheckIn,
              checkOutDate: finalCheckOut,
              nightlyRates,
              updatedAt: new Date()
            }
          });
        }
      }

      // Create audit log (within transaction)
      await tx.bookingAuditLog.create({
        data: {
          bookingId: bookingId,
          performedBy: req.user?.id || 'system',
          action: 'MODIFY',
          meta: {
            changes,
            ...changes
          },
          timestamp: new Date()
        }
      });

      return updated;
    });

    // Get updated booking with details
    const booking = await bookingService.getBookingWithDetails(bookingId);

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: booking
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
 * POST /api/bookings/:id/check-in
 * Check-in booking and assign rooms
 * RBAC: checkin:write:scoped, bookings:* (admin)
 */
router.post('/bookings/:id/check-in', requirePermission('checkin:write:scoped'), async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);

    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID'
      });
    }

    const { roomAssignments = [], notes } = req.body;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        stays: {
          include: {
            roomType: true
          }
        },
        property: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Validate state - must be CONFIRMED
    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        error: `Cannot check-in booking in ${booking.status} status. Booking must be CONFIRMED.`
      });
    }

    // Check-in booking in transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Transition booking to CHECKED_IN
      const transitioned = await bookingService.transitionState(bookingId, 'CHECKED_IN', {
        user: req.user,
        meta: {
          roomAssignments,
          notes
        }
      });

      // Assign rooms to stays
      if (roomAssignments && roomAssignments.length > 0) {
        for (const assignment of roomAssignments) {
          const { stayId, roomId } = assignment;

          if (stayId && roomId) {
            // Assign room to stay
            await stayService.assignRoom(stayId, roomId, {
              assignedBy: req.user?.id
            });

            // Update stay status to CHECKED_IN
            await stayService.updateStayStatus(stayId, 'CHECKED_IN');
          }
        }
      } else {
        // If no room assignments, just update stay statuses
        for (const stay of booking.stays) {
          await stayService.updateStayStatus(stay.id, 'CHECKED_IN');
        }
      }

      // Update notes if provided
      if (notes) {
        await bookingService.updateNotes(bookingId, {
          internal: notes
        }, {
          user: req.user
        });
      }

      return transitioned;
    });

    // Get updated booking with details
    const bookingDetails = await bookingService.getBookingWithDetails(bookingId);

    res.json({
      success: true,
      message: 'Booking checked in successfully',
      data: bookingDetails
    });
  } catch (error) {
    console.error('Error checking in booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check-in booking',
      message: error.message
    });
  }
});

/**
 * POST /api/bookings/:id/check-out
 * Check-out booking and finalize charges
 * RBAC: checkout:write:scoped, bookings:* (admin)
 */
router.post('/bookings/:id/check-out', requirePermission('checkout:write:scoped'), async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);

    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID'
      });
    }

    const { finalCharges = null, notes } = req.body;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
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

    // Validate state - must be CHECKED_IN
    if (booking.status !== 'CHECKED_IN') {
      return res.status(400).json({
        success: false,
        error: `Cannot check-out booking in ${booking.status} status. Booking must be CHECKED_IN.`
      });
    }

    // Check-out booking in transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update final charges if provided
      if (finalCharges !== null) {
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            totalPrice: parseFloat(finalCharges),
            updatedAt: new Date()
          }
        });
      }

      // Transition booking to CHECKED_OUT
      const transitioned = await bookingService.transitionState(bookingId, 'CHECKED_OUT', {
        user: req.user,
        meta: {
          finalCharges,
          notes
        }
      });

      // Update stay statuses to CHECKED_OUT
      for (const stay of booking.stays) {
        await stayService.updateStayStatus(stay.id, 'CHECKED_OUT');
      }

      // Update room assignments
      await tx.roomAssignment.updateMany({
        where: {
          bookingId: bookingId,
          checkedOutAt: null
        },
        data: {
          checkedOutAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Update notes if provided
      if (notes) {
        await bookingService.updateNotes(bookingId, {
          internal: notes
        }, {
          user: req.user
        });
      }

      return transitioned;
    });

    // Update loyalty lifetime metrics after checkout
    if (booking.loyaltyAccountId) {
      try {
        const checkInDate = new Date(booking.checkIn);
        const checkOutDate = new Date(booking.checkOut);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const finalSpend = finalCharges !== null ? parseFloat(finalCharges) : booking.totalPrice;

        await loyaltyService.updateLifetimeMetrics(
          booking.loyaltyAccountId,
          nights,
          finalSpend
        );
      } catch (error) {
        // Log error but don't fail checkout
        console.error(`Error updating loyalty metrics for booking ${bookingId}:`, error);
      }
    }

    // Get updated booking with details
    const bookingDetails = await bookingService.getBookingWithDetails(bookingId);

    res.json({
      success: true,
      message: 'Booking checked out successfully',
      data: bookingDetails
    });
  } catch (error) {
    console.error('Error checking out booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check-out booking',
      message: error.message
    });
  }
});

/**
 * POST /api/bookings/:id/no-show
 * Mark booking as no-show
 * RBAC: bookings:write:scoped, bookings:* (admin)
 */
router.post('/bookings/:id/no-show', requirePermission('bookings:write:scoped'), async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);

    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID'
      });
    }

    const { noShowFee = null, notes } = req.body;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Validate state - must be CONFIRMED
    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        error: `Cannot mark booking as no-show in ${booking.status} status. Booking must be CONFIRMED.`
      });
    }

    // Mark as no-show in transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Apply no-show fee if provided
      if (noShowFee !== null) {
        // Create payment record for no-show fee
        await tx.payment.create({
          data: {
            bookingId: bookingId,
            amount: parseFloat(noShowFee),
            status: 'COMPLETED',
            metadata: {
              type: 'NO_SHOW_FEE',
              appliedAt: new Date()
            }
          }
        });

        // Update booking total
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            totalPrice: {
              increment: parseFloat(noShowFee)
            },
            updatedAt: new Date()
          }
        });
      }

      // Transition booking to NO_SHOW
      const transitioned = await bookingService.transitionState(bookingId, 'NO_SHOW', {
        user: req.user,
        meta: {
          noShowFee,
          notes
        }
      });

      // Update notes if provided
      if (notes) {
        await bookingService.updateNotes(bookingId, {
          internal: notes
        }, {
          user: req.user
        });
      }

      return transitioned;
    });

    // Get updated booking with details
    const bookingDetails = await bookingService.getBookingWithDetails(bookingId);

    res.json({
      success: true,
      message: 'Booking marked as no-show successfully',
      data: bookingDetails
    });
  } catch (error) {
    console.error('Error marking booking as no-show:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark booking as no-show',
      message: error.message
    });
  }
});

/**
 * POST /api/bookings/:id/reject
 * Reject booking
 * RBAC: bookings:*:scoped (manager, admin)
 */
router.post('/bookings/:id/reject', requirePermission('bookings:*:scoped'), async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);

    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID'
      });
    }

    const { reason, notes } = req.body;

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

    // Validate state - can only reject HOLD, PENDING, or CONFIRMED
    if (!['HOLD', 'PENDING', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot reject booking in ${booking.status} status. Only HOLD, PENDING, or CONFIRMED bookings can be rejected.`
      });
    }

    // Reject booking in transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Transition booking to REJECTED
      const transitioned = await bookingService.transitionState(bookingId, 'REJECTED', {
        user: req.user,
        meta: {
          reason: reason || 'No reason provided',
          notes
        }
      });

      // Release inventory (if applicable)
      // TODO: Implement inventory release logic

      // Update notes if provided
      if (notes) {
        await bookingService.updateNotes(bookingId, {
          internal: notes
        }, {
          user: req.user
        });
      }

      return transitioned;
    });

    // Reverse loyalty points if booking was cancelled and points were awarded
    if (booking.loyaltyAccountId && booking.status === 'CONFIRMED') {
      try {
        // Find points awarded for this booking
        const pointsAwarded = await prisma.pointsLedger.findFirst({
          where: {
            bookingId: bookingId,
            loyaltyAccountId: booking.loyaltyAccountId,
            points: { gt: 0 },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (pointsAwarded) {
          // Reverse the points
          await loyaltyService.redeemPoints({
            loyaltyAccountId: booking.loyaltyAccountId,
            points: pointsAwarded.points,
            reason: `Points reversal for cancelled booking #${booking.confirmationNumber || bookingId}`,
            bookingId: bookingId,
          });
        }
      } catch (error) {
        // Log error but don't fail cancellation
        console.error(`Error reversing loyalty points for cancelled booking ${bookingId}:`, error);
      }
    }

    // Get updated booking with details
    const bookingDetails = await bookingService.getBookingWithDetails(bookingId);

    res.json({
      success: true,
      message: 'Booking rejected successfully',
      data: bookingDetails
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject booking',
      message: error.message
    });
  }
});

/**
 * POST /api/bookings/:id/cancel
 * Cancel booking with fee calculation
 * RBAC: bookings:write:scoped, bookings:* (admin)
 */
router.post('/bookings/:id/cancel', requirePermission('bookings:write:scoped'), async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);

    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID'
      });
    }

    const { reason, cancellationDate, processRefund = false } = req.body;

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

    // Validate state - can only cancel HOLD, PENDING, or CONFIRMED
    if (!['HOLD', 'PENDING', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot cancel booking in ${booking.status} status. Only HOLD, PENDING, or CONFIRMED bookings can be cancelled.`
      });
    }

    // Calculate cancellation fee
    const cancelDate = cancellationDate ? new Date(cancellationDate) : new Date();
    const feeDetails = await cancellationPolicyService.calculateFeeForBooking(bookingId, cancelDate);

    // Cancel booking in transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Process refund if applicable
      if (processRefund && feeDetails.refundAmount > 0) {
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
              processedAt: new Date()
            }
          }
        });
      }

      // Transition booking to CANCELLED
      const transitioned = await bookingService.transitionState(bookingId, 'CANCELLED', {
        user: req.user,
        meta: {
          reason: reason || 'Guest request',
          cancellationFee: feeDetails.fee,
          refundAmount: feeDetails.refundAmount,
          policy: feeDetails.policy
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

    // Reverse loyalty points if booking was cancelled and points were awarded
    if (booking.loyaltyAccountId && booking.status === 'CONFIRMED') {
      try {
        // Find points awarded for this booking
        const pointsAwarded = await prisma.pointsLedger.findFirst({
          where: {
            bookingId: bookingId,
            loyaltyAccountId: booking.loyaltyAccountId,
            points: { gt: 0 },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (pointsAwarded) {
          // Reverse the points
          await loyaltyService.redeemPoints({
            loyaltyAccountId: booking.loyaltyAccountId,
            points: pointsAwarded.points,
            reason: `Points reversal for cancelled booking #${booking.confirmationNumber || bookingId}`,
            bookingId: bookingId,
          });
        }
      } catch (error) {
        // Log error but don't fail cancellation
        console.error(`Error reversing loyalty points for cancelled booking ${bookingId}:`, error);
      }
    }

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
 * GET /api/bookings/:id/audit-log
 * Get booking audit trail
 * RBAC: bookings:read:scoped, bookings:read (admin)
 */
router.get('/bookings/:id/audit-log', requirePermission('bookings:read:scoped'), async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);

    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID'
      });
    }

    // Get booking to verify it exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Get audit logs
    const auditLogs = await prisma.bookingAuditLog.findMany({
      where: { bookingId: bookingId },
      include: {
        performedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    res.json({
      success: true,
      data: auditLogs
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit log',
      message: error.message
    });
  }
});

/**
 * POST /api/bookings/:id/calculate-cancellation-fee
 * Calculate cancellation fee for a booking
 * RBAC: bookings:read:scoped, bookings:read (admin)
 */
router.post('/bookings/:id/calculate-cancellation-fee', requirePermission('bookings:read:scoped'), async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);

    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID'
      });
    }

    const { cancellationDate } = req.body;

    // Calculate cancellation fee
    const cancelDate = cancellationDate ? new Date(cancellationDate) : new Date();
    const feeDetails = await cancellationPolicyService.calculateFeeForBooking(bookingId, cancelDate);

    res.json({
      success: true,
      data: feeDetails
    });
  } catch (error) {
    console.error('Error calculating cancellation fee:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate cancellation fee',
      message: error.message
    });
  }
});

module.exports = router;

