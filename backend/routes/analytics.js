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
 * Get user's accessible property IDs based on RBAC
 */
async function getAccessiblePropertyIds(userId) {
  const userRoles = await getPrisma().userRole.findMany({
    where: { userId },
    include: { role: true },
  });

  const hasOrgAccess = userRoles.some(
    (r) =>
      ['ADMIN', 'SUPERADMIN'].includes(r.roleKey) &&
      r.scopeType === 'ORG'
  );

  if (hasOrgAccess) {
    return null; // null means all properties
  }

  const propertyIds = userRoles
    .filter((r) => r.scopeType === 'PROPERTY' && r.scopeId)
    .map((r) => r.scopeId);

  return propertyIds.length > 0 ? propertyIds : [];
}

/**
 * GET /api/analytics/conversations
 * Get conversation analytics and metrics
 */
router.get('/conversations', async (req, res) => {
  try {
    let userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // If userId is an email, look up the user ID
    if (userId && userId.includes('@')) {
      const user = await getPrisma().user.findUnique({
        where: { email: userId },
        select: { id: true },
      });
      if (user) {
        userId = user.id;
      } else {
        return res.status(401).json({ success: false, error: 'User not found' });
      }
    }

    const { startDate, endDate, propertyId } = req.query;
    
    // Get accessible property IDs
    const accessiblePropertyIds = await getAccessiblePropertyIds(userId);

    // Build date filter - use lastMessageAt if available, otherwise createdAt
    // Note: We'll filter by createdAt for now, but seed data might use lastMessageAt
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0); // Start of day
        dateFilter.createdAt.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of day
        dateFilter.createdAt.lte = end;
      }
    }

    // Build property filter
    const propertyFilter = {};
    if (propertyId) {
      propertyFilter.propertyId = parseInt(propertyId);
    } else if (accessiblePropertyIds !== null) {
      propertyFilter.propertyId = { in: accessiblePropertyIds };
    }

    const where = {
      ...dateFilter,
      ...propertyFilter,
    };

    // Get total conversations
    const totalConversations = await getPrisma().thread.count({ where });

    // Get conversations by status
    const byStatus = await getPrisma().thread.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    // Get conversations by channel
    const threads = await getPrisma().thread.findMany({
      where,
      select: {
        id: true,
        emails: { select: { id: true } },
        messageLogs: { select: { id: true, channel: true } },
        callLogs: { select: { id: true } },
      },
    });

    const channelBreakdown = {
      EMAIL: 0,
      WHATSAPP: 0,
      SMS: 0,
      VOICE: 0,
    };

    threads.forEach((thread) => {
      if (thread.emails.length > 0) channelBreakdown.EMAIL++;
      const whatsapp = thread.messageLogs.filter(m => m.channel === 'WHATSAPP').length;
      const sms = thread.messageLogs.filter(m => m.channel === 'SMS').length;
      if (whatsapp > 0) channelBreakdown.WHATSAPP++;
      if (sms > 0) channelBreakdown.SMS++;
      if (thread.callLogs.length > 0) channelBreakdown.VOICE++;
    });

    // Get conversations by priority
    const byPriority = await getPrisma().thread.groupBy({
      by: ['priority'],
      where,
      _count: { id: true },
    });

    // Get SLA metrics
    const slaMetrics = await getPrisma().thread.findMany({
      where: {
        ...where,
        status: { not: 'ARCHIVED' },
      },
      select: {
        id: true,
        createdAt: true,
        firstResponseAt: true,
        resolvedAt: true,
        slaBreached: true,
        status: true,
      },
    });

    const now = new Date();
    let totalResponseTime = 0;
    let respondedCount = 0;
    let totalResolutionTime = 0;
    let resolvedCount = 0;
    let slaBreachedCount = 0;

    slaMetrics.forEach((thread) => {
      if (thread.firstResponseAt) {
        const responseTime = (thread.firstResponseAt - thread.createdAt) / (1000 * 60); // minutes
        totalResponseTime += responseTime;
        respondedCount++;
      }

      if (thread.resolvedAt) {
        const resolutionTime = (thread.resolvedAt - thread.createdAt) / (1000 * 60); // minutes
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }

      if (thread.slaBreached) {
        slaBreachedCount++;
      }
    });

    const avgResponseTime = respondedCount > 0 ? totalResponseTime / respondedCount : 0;
    const avgResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;
    const slaBreachRate = slaMetrics.length > 0 ? (slaBreachedCount / slaMetrics.length) * 100 : 0;

    // Get conversations over time (grouped by time period)
    const timePeriod = req.query.timePeriod || 'day'; // day, week, month, year
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    
    const allThreads = await getPrisma().thread.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
      },
    });

    // Group by time period
    const rawStats = {};
    allThreads.forEach((thread) => {
      const date = new Date(thread.createdAt);
      let key = '';
      
      if (timePeriod === 'day') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (timePeriod === 'week') {
        // Get week start (Monday)
        const weekStart = new Date(date);
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        key = weekStart.toISOString().split('T')[0]; // YYYY-MM-DD for week start
      } else if (timePeriod === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      } else if (timePeriod === 'year') {
        key = String(date.getFullYear()); // YYYY
      }
      
      rawStats[key] = (rawStats[key] || 0) + 1;
    });

    // Fill in missing periods with 0 counts to show full timeline
    const dailyStats = {};
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
      let key = '';
      
      if (timePeriod === 'day') {
        key = current.toISOString().split('T')[0];
        current.setDate(current.getDate() + 1);
      } else if (timePeriod === 'week') {
        // Get Monday of this week
        const weekStart = new Date(current);
        const dayOfWeek = weekStart.getDay();
        const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        key = weekStart.toISOString().split('T')[0];
        current.setDate(current.getDate() + 7); // Move to next week
      } else if (timePeriod === 'month') {
        key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        current.setMonth(current.getMonth() + 1);
      } else if (timePeriod === 'year') {
        key = String(current.getFullYear());
        current.setFullYear(current.getFullYear() + 1);
      }
      
      dailyStats[key] = rawStats[key] || 0;
    }

    // Get top assignees
    const topAssignees = await getPrisma().thread.groupBy({
      by: ['assignedTo'],
      where: {
        ...where,
        assignedTo: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Get user names for assignees
    const assigneeIds = topAssignees.map(a => a.assignedTo).filter(Boolean);
    const users = await getPrisma().user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, name: true, email: true },
    });

    const assigneeMap = {};
    users.forEach(u => assigneeMap[u.id] = u);

    const topAssigneesWithNames = topAssignees.map(a => ({
      userId: a.assignedTo,
      userName: assigneeMap[a.assignedTo]?.name || 'Unknown',
      userEmail: assigneeMap[a.assignedTo]?.email || '',
      count: a._count.id,
    }));

    res.json({
      success: true,
      analytics: {
        overview: {
          totalConversations,
          byStatus: byStatus.reduce((acc, item) => {
            acc[item.status] = item._count.id;
            return acc;
          }, {}),
          byPriority: byPriority.reduce((acc, item) => {
            acc[item.priority] = item._count.id;
            return acc;
          }, {}),
          channelBreakdown,
        },
        performance: {
          avgResponseTime: Math.round(avgResponseTime * 10) / 10, // Round to 1 decimal
          avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
          slaBreachRate: Math.round(slaBreachRate * 10) / 10,
          slaBreachedCount,
          respondedCount,
          resolvedCount,
        },
        trends: {
          dailyStats,
        },
        topAssignees: topAssigneesWithNames,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch analytics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/analytics/response-times
 * Get detailed response time analytics
 */
router.get('/response-times', async (req, res) => {
  try {
    let userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // If userId is an email, look up the user ID
    if (userId && userId.includes('@')) {
      const user = await getPrisma().user.findUnique({
        where: { email: userId },
        select: { id: true },
      });
      if (user) {
        userId = user.id;
      } else {
        return res.status(401).json({ success: false, error: 'User not found' });
      }
    }

    const { startDate, endDate, propertyId } = req.query;
    
    const accessiblePropertyIds = await getAccessiblePropertyIds(userId);

    const where = {
      firstResponseAt: { not: null },
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate ? { gte: new Date(startDate) } : {}),
          ...(endDate ? { lte: new Date(endDate) } : {}),
        },
      } : {}),
      ...(propertyId ? { propertyId: parseInt(propertyId) } : {}),
      ...(accessiblePropertyIds !== null && !propertyId ? {
        propertyId: { in: accessiblePropertyIds },
      } : {}),
    };

    const threads = await getPrisma().thread.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        firstResponseAt: true,
        status: true,
        property: {
          select: { id: true, name: true },
        },
        assignedUser: {
          select: { id: true, name: true },
        },
      },
    });

    const responseTimes = threads.map(thread => {
      const responseTime = (thread.firstResponseAt - thread.createdAt) / (1000 * 60); // minutes
      return {
        threadId: thread.id,
        responseTime,
        status: thread.status,
        property: thread.property,
        assignee: thread.assignedUser,
        createdAt: thread.createdAt,
        respondedAt: thread.firstResponseAt,
      };
    });

    // Calculate percentiles
    const sorted = responseTimes.map(r => r.responseTime).sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    const p75 = sorted[Math.floor(sorted.length * 0.75)] || 0;
    const p90 = sorted[Math.floor(sorted.length * 0.9)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;

    res.json({
      success: true,
      responseTimes: {
        data: responseTimes,
        percentiles: {
          p50: Math.round(p50 * 10) / 10,
          p75: Math.round(p75 * 10) / 10,
          p90: Math.round(p90 * 10) / 10,
          p95: Math.round(p95 * 10) / 10,
        },
        avg: sorted.length > 0 
          ? Math.round((sorted.reduce((a, b) => a + b, 0) / sorted.length) * 10) / 10
          : 0,
      },
    });
  } catch (error) {
    console.error('Response times analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch response times' });
  }
});

/**
 * GET /api/analytics/export
 * Export analytics data as CSV or JSON
 */
router.get('/export', async (req, res) => {
  try {
    let userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // If userId is an email, look up the user ID
    if (userId && userId.includes('@')) {
      const user = await getPrisma().user.findUnique({
        where: { email: userId },
        select: { id: true },
      });
      if (user) {
        userId = user.id;
      } else {
        return res.status(401).json({ success: false, error: 'User not found' });
      }
    }

    const { startDate, endDate, propertyId, format = 'json' } = req.query;
    
    const accessiblePropertyIds = await getAccessiblePropertyIds(userId);

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    const propertyFilter = {};
    if (propertyId) {
      propertyFilter.propertyId = parseInt(propertyId);
    } else if (accessiblePropertyIds !== null) {
      propertyFilter.propertyId = { in: accessiblePropertyIds };
    }

    const where = {
      ...dateFilter,
      ...propertyFilter,
    };

    // Get all conversations with details
    const conversations = await getPrisma().thread.findMany({
      where,
      include: {
        property: {
          select: { id: true, name: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
        booking: {
          select: { id: true, guestName: true, email: true, phone: true },
        },
        _count: {
          select: {
            emails: true,
            messageLogs: true,
            callLogs: true,
            notes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'ID',
        'Subject',
        'Status',
        'Priority',
        'Property',
        'Assigned To',
        'Guest Name',
        'Guest Email',
        'Guest Phone',
        'Created At',
        'First Response At',
        'Resolved At',
        'SLA Breached',
        'Email Count',
        'Message Count',
        'Call Count',
        'Notes Count',
      ];

      const rows = conversations.map(conv => [
        conv.id,
        conv.subject,
        conv.status,
        conv.priority,
        conv.property?.name || '',
        conv.assignedUser?.name || '',
        conv.booking?.guestName || '',
        conv.booking?.email || '',
        conv.booking?.phone || '',
        conv.createdAt.toISOString(),
        conv.firstResponseAt?.toISOString() || '',
        conv.resolvedAt?.toISOString() || '',
        conv.slaBreached ? 'Yes' : 'No',
        conv._count.emails,
        conv._count.messageLogs,
        conv._count.callLogs,
        conv._count.notes,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="conversations-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // Generate JSON
      const jsonData = conversations.map(conv => ({
        id: conv.id,
        subject: conv.subject,
        status: conv.status,
        priority: conv.priority,
        property: conv.property,
        assignedTo: conv.assignedUser,
        booking: conv.booking,
        createdAt: conv.createdAt,
        firstResponseAt: conv.firstResponseAt,
        resolvedAt: conv.resolvedAt,
        slaBreached: conv.slaBreached,
        counts: {
          emails: conv._count.emails,
          messages: conv._count.messageLogs,
          calls: conv._count.callLogs,
          notes: conv._count.notes,
        },
      }));

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="conversations-${new Date().toISOString().split('T')[0]}.json"`);
      res.json({ conversations: jsonData, exportedAt: new Date().toISOString() });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: 'Failed to export data' });
  }
});

module.exports = router;

