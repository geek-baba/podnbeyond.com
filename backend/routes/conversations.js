const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

/**
 * Get user's accessible property IDs based on RBAC
 */
async function getAccessiblePropertyIds(userId) {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });

  // Check if user has org-wide access
  const hasOrgAccess = userRoles.some(
    (r) =>
      ['ADMIN', 'SUPERADMIN'].includes(r.roleKey) &&
      r.scopeType === 'ORG'
  );

  if (hasOrgAccess) {
    return null; // null means all properties
  }

  // Get property IDs user has access to
  const propertyIds = userRoles
    .filter((r) => r.scopeType === 'PROPERTY' && r.scopeId)
    .map((r) => r.scopeId);

  return propertyIds.length > 0 ? propertyIds : [];
}

/**
 * Check if user can assign conversations
 */
function canAssign(userRoles) {
  return userRoles.some((r) =>
    ['MANAGER', 'ADMIN', 'SUPERADMIN'].includes(r.roleKey)
  );
}

/**
 * Auto-assign conversation based on property
 */
async function autoAssignConversation(thread, propertyId) {
  if (!propertyId) return null;

  // Try to find property manager
  const propertyManager = await prisma.userRole.findFirst({
    where: {
      scopeType: 'PROPERTY',
      scopeId: propertyId,
      roleKey: 'MANAGER',
    },
    include: { user: true },
  });

  if (propertyManager) {
    return propertyManager.userId;
  }

  // Fallback: Round-robin from property staff
  const propertyStaff = await prisma.userRole.findMany({
    where: {
      scopeType: 'PROPERTY',
      scopeId: propertyId,
      roleKey: { in: ['STAFF_FRONTDESK', 'STAFF_OPS', 'MANAGER'] },
    },
    include: { user: true },
  });

  if (propertyStaff.length === 0) return null;

  // Get conversations assigned to each staff member
  const assignmentCounts = await Promise.all(
    propertyStaff.map(async (staff) => {
      const count = await prisma.thread.count({
        where: {
          assignedTo: staff.userId,
          status: { in: ['NEW', 'IN_PROGRESS'] },
        },
      });
      return { userId: staff.userId, count };
    })
  );

  // Assign to staff member with least assignments
  const leastBusy = assignmentCounts.reduce((min, current) =>
    current.count < min.count ? current : min
  );

  return leastBusy.userId;
}

/**
 * Calculate SLA breach status
 */
function calculateSLA(thread, channel) {
  if (thread.status === 'RESOLVED' || thread.status === 'ARCHIVED') {
    return { breached: false };
  }

  const now = new Date();
  const createdAt = new Date(thread.createdAt);
  const minutesSinceCreation = (now - createdAt) / (1000 * 60);

  // SLA targets
  const slaTargets = {
    WHATSAPP: 5,
    SMS: 5,
    EMAIL: 30,
    VOICE: 5,
  };

  const targetMinutes = thread.priority === 'URGENT' ? 5 : slaTargets[channel] || 30;
  const breached = minutesSinceCreation > targetMinutes;

  return {
    breached,
    minutesSinceCreation: Math.floor(minutesSinceCreation),
    targetMinutes,
  };
}

/**
 * GET /api/conversations
 * List unified conversations (RBAC-filtered)
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId; // Get from session/auth
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User ID is required' });
    }

    const {
      propertyId,
      status,
      assignedTo,
      channel,
      search,
      limit = 50,
      offset = 0,
    } = req.query;

    // Get accessible property IDs
    const accessiblePropertyIds = await getAccessiblePropertyIds(userId);

    // Build where clause
    const where = {
      isArchived: false,
    };

    // Property filter (RBAC)
    if (accessiblePropertyIds === null) {
      // Admin/SUPERADMIN - can see all
      if (propertyId) {
        where.propertyId = parseInt(propertyId);
      }
      // If no propertyId filter, show all conversations (no propertyId restriction)
    } else if (accessiblePropertyIds.length > 0) {
      // Property-scoped staff - only their properties
      if (propertyId && accessiblePropertyIds.includes(parseInt(propertyId))) {
        where.propertyId = parseInt(propertyId);
      } else {
        where.propertyId = { in: accessiblePropertyIds };
      }
    } else {
      // User has no property access - return empty
      return res.json({
        success: true,
        conversations: [],
        total: 0,
      });
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Assigned filter
    if (assignedTo === 'me') {
      where.assignedTo = userId;
    } else if (assignedTo === 'unassigned') {
      where.assignedTo = null;
    } else if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    // Search filter
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { participants: { has: search } },
      ];
    }

    // Fetch threads
    const threads = await prisma.thread.findMany({
      where,
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
        emails: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        messageLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        callLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
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
      orderBy: { lastMessageAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    // Enrich with channel info and SLA
    const enriched = threads.map((thread) => {
      const lastEmail = thread.emails[0];
      const lastMessage = thread.messageLogs[0];
      const lastCall = thread.callLogs[0];

      // Determine primary channel
      let primaryChannel = 'EMAIL';
      let lastActivity = thread.lastMessageAt;

      if (lastCall && new Date(lastCall.createdAt) > new Date(lastActivity)) {
        primaryChannel = 'VOICE';
        lastActivity = lastCall.createdAt;
      }
      if (lastMessage && new Date(lastMessage.createdAt) > new Date(lastActivity)) {
        primaryChannel = lastMessage.channel;
        lastActivity = lastMessage.createdAt;
      }

      // Calculate SLA
      const sla = calculateSLA(thread, primaryChannel);

      return {
        ...thread,
        primaryChannel,
        lastActivity,
        sla,
        unreadCount: 0, // TODO: Implement unread tracking
      };
    });

    res.json({
      success: true,
      conversations: enriched,
      total: threads.length,
    });
  } catch (error) {
    console.error('Conversations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/conversations/:id
 * Get unified conversation with all messages
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const threadId = parseInt(req.params.id);

    // Get accessible property IDs
    const accessiblePropertyIds = await getAccessiblePropertyIds(userId);

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        property: true,
        booking: {
          include: {
            roomType: true,
            ratePlan: true,
          },
        },
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
        emails: {
          orderBy: { createdAt: 'asc' },
          include: {
            attachments: true,
            events: true,
          },
        },
        messageLogs: {
          orderBy: { createdAt: 'asc' },
          include: {
            contact: {
              select: { id: true, phone: true, name: true, email: true },
            },
          },
        },
        callLogs: {
          orderBy: { createdAt: 'asc' },
          include: {
            contact: {
              select: { id: true, phone: true, name: true, email: true },
            },
          },
        },
        notes: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!thread) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check RBAC access
    if (accessiblePropertyIds !== null) {
      if (!thread.propertyId || !accessiblePropertyIds.includes(thread.propertyId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Build unified message timeline
    const messages = [
      ...thread.emails.map((email) => ({
        id: `email-${email.id}`,
        type: 'EMAIL',
        channel: 'EMAIL',
        direction: email.direction,
        content: email.textBody || email.htmlBody,
        from: email.fromEmail,
        fromName: email.fromName,
        timestamp: email.createdAt,
        status: email.status,
        attachments: email.attachments,
        events: email.events,
      })),
      ...thread.messageLogs.map((msg) => ({
        id: `message-${msg.id}`,
        type: 'MESSAGE',
        channel: msg.channel,
        direction: msg.direction,
        content: msg.message,
        from: msg.phone,
        timestamp: msg.createdAt,
        status: msg.status,
        providerMessageId: msg.providerMessageId,
      })),
      ...thread.callLogs.map((call) => ({
        id: `call-${call.id}`,
        type: 'CALL',
        channel: 'VOICE',
        direction: call.direction,
        content: `Call from ${call.fromNumber} to ${call.toNumber}`,
        from: call.fromNumber,
        to: call.toNumber,
        timestamp: call.createdAt,
        status: call.status,
        duration: call.duration,
        recordingUrl: call.recordingUrl,
        providerCallId: call.providerCallId,
      })),
    ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Calculate SLA
    const primaryChannel = messages.length > 0 ? messages[messages.length - 1].channel : 'EMAIL';
    const sla = calculateSLA(thread, primaryChannel);

    res.json({
      success: true,
      conversation: {
        ...thread,
        messages,
        sla,
      },
    });
  } catch (error) {
    console.error('Conversation fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

/**
 * POST /api/conversations/:id/assign
 * Assign conversation to staff member (MANAGER+ only)
 */
router.post('/:id/assign', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const threadId = parseInt(req.params.id);
    const { assignedTo } = req.body;

    // Check permissions
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    if (!canAssign(userRoles)) {
      return res.status(403).json({ error: 'Permission denied. Only MANAGER+ can assign conversations.' });
    }

    // Update assignment
    const thread = await prisma.thread.update({
      where: { id: threadId },
      data: {
        assignedTo: assignedTo || null,
        status: assignedTo ? 'IN_PROGRESS' : 'NEW',
      },
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json({
      success: true,
      conversation: thread,
    });
  } catch (error) {
    console.error('Assignment error:', error);
    res.status(500).json({ error: 'Failed to assign conversation' });
  }
});

/**
 * POST /api/conversations/:id/status
 * Update conversation status
 */
router.post('/:id/status', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const threadId = parseInt(req.params.id);
    const { status } = req.body;

    if (!['NEW', 'IN_PROGRESS', 'WAITING_FOR_GUEST', 'RESOLVED', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {
      status,
      ...(status === 'RESOLVED' && !thread.resolvedAt ? { resolvedAt: new Date() } : {}),
    };

    const thread = await prisma.thread.update({
      where: { id: threadId },
      data: updateData,
    });

    res.json({
      success: true,
      conversation: thread,
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * POST /api/conversations/:id/notes
 * Add internal note to conversation
 */
router.post('/:id/notes', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const threadId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const note = await prisma.conversationNote.create({
      data: {
        threadId,
        authorId: userId,
        content,
        isInternal: true,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json({
      success: true,
      note,
    });
  } catch (error) {
    console.error('Note creation error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

/**
 * POST /api/conversations/:id/priority
 * Update conversation priority
 */
router.post('/:id/priority', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const threadId = parseInt(req.params.id);
    const { priority } = req.body;

    if (!['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    const thread = await prisma.thread.update({
      where: { id: threadId },
      data: { priority },
    });

    res.json({
      success: true,
      conversation: thread,
    });
  } catch (error) {
    console.error('Priority update error:', error);
    res.status(500).json({ error: 'Failed to update priority' });
  }
});

module.exports = router;

