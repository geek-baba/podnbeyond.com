const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

// Initialize Prisma client lazily to avoid startup issues
let prisma;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * GET /api/guest-context/:identifier
 * Get guest context by email or phone number
 * identifier can be email or phone (normalized)
 */
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const isEmail = identifier.includes('@');
    
    // Find contact by email or phone
    let contact = null;
    if (isEmail) {
      contact = await getPrisma().contact.findFirst({
        where: { email: identifier },
      });
    } else {
      // Normalize phone number
      const normalizedPhone = identifier.replace(/\D/g, '');
      const phoneWithCountry = normalizedPhone.length === 10 ? '91' + normalizedPhone : normalizedPhone;
      contact = await getPrisma().contact.findUnique({
        where: { phone: phoneWithCountry },
      });
    }

    // Find bookings by email or phone
    const bookings = await getPrisma().booking.findMany({
      where: isEmail
        ? { email: identifier }
        : {
            phone: {
              contains: identifier.replace(/\D/g, '').slice(-10), // Last 10 digits
            },
          },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: true,
          },
        },
        roomType: {
          select: {
            id: true,
            name: true,
          },
        },
        ratePlan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { checkIn: 'desc' },
      take: 10,
    });

    // Find all conversations for this guest
    const conversations = await getPrisma().thread.findMany({
      where: {
        OR: [
          { participants: { has: identifier } },
          ...(contact
            ? [
                { messageLogs: { some: { contactId: contact.id } } },
                { callLogs: { some: { contactId: contact.id } } },
              ]
            : []),
        ],
      },
      include: {
        property: {
          select: { id: true, name: true, slug: true },
        },
        booking: {
          select: { id: true, guestName: true, checkIn: true, checkOut: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            emails: true,
            messageLogs: true,
            callLogs: true,
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 20,
    });

    // Aggregate statistics
    const stats = {
      totalBookings: bookings.length,
      activeBookings: bookings.filter(
        (b) =>
          b.status === 'CONFIRMED' &&
          new Date(b.checkOut) >= new Date() &&
          new Date(b.checkIn) <= new Date()
      ).length,
      upcomingBookings: bookings.filter(
        (b) => b.status === 'CONFIRMED' && new Date(b.checkIn) > new Date()
      ).length,
      totalConversations: conversations.length,
      openConversations: conversations.filter(
        (c) => !['RESOLVED', 'ARCHIVED'].includes(c.status)
      ).length,
    };

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = {
      messages: await getPrisma().messageLog.count({
        where: {
          ...(contact ? { contactId: contact.id } : { phone: { contains: identifier.replace(/\D/g, '').slice(-10) } }),
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      calls: await getPrisma().callLog.count({
        where: {
          ...(contact ? { contactId: contact.id } : { fromNumber: { contains: identifier.replace(/\D/g, '').slice(-10) } }),
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      emails: await getPrisma().email.count({
        where: {
          OR: [
            { fromEmail: identifier },
            { toEmails: { has: identifier } },
          ],
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    };

    res.json({
      success: true,
      guest: {
        contact: contact
          ? {
              id: contact.id,
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              metadata: contact.metadata,
            }
          : null,
        identifier,
        bookings,
        conversations,
        stats,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Guest context error:', error);
    res.status(500).json({ error: 'Failed to fetch guest context' });
  }
});

/**
 * GET /api/guest-context/booking/:bookingId
 * Get guest context for a specific booking
 */
router.get('/booking/:bookingId', async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);

    const booking = await getPrisma().booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: true,
            phone: true,
            email: true,
          },
        },
        roomType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        ratePlan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Get all conversations for this booking
    const conversations = await getPrisma().thread.findMany({
      where: {
        OR: [
          { bookingId: booking.id },
          { participants: { has: booking.email } },
        ],
      },
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            emails: true,
            messageLogs: true,
            callLogs: true,
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Get contact if exists
    let contact = null;
    if (booking.phone) {
      const normalizedPhone = booking.phone.replace(/\D/g, '');
      const phoneWithCountry = normalizedPhone.length === 10 ? '91' + normalizedPhone : normalizedPhone;
      contact = await getPrisma().contact.findUnique({
        where: { phone: phoneWithCountry },
      });
    }

    res.json({
      success: true,
      booking,
      conversations,
      contact,
    });
  } catch (error) {
    console.error('Booking context error:', error);
    res.status(500).json({ error: 'Failed to fetch booking context' });
  }
});

module.exports = router;

