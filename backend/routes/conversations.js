const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Apply authentication to all conversation routes
router.use(authenticate);

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
  const propertyManager = await getPrisma().userRole.findFirst({
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
  const propertyStaff = await getPrisma().userRole.findMany({
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
      const count = await getPrisma().thread.count({
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
  // Handle backward compatibility - thread might not have status/priority
  const status = thread.status || 'NEW';
  const priority = thread.priority || 'NORMAL';
  
  if (status === 'RESOLVED' || status === 'ARCHIVED') {
    return { 
      breached: false,
      minutesSinceCreation: 0,
      targetMinutes: 0
    };
  }

  try {
    const now = new Date();
    const createdAt = new Date(thread.createdAt);
    
    // Validate dates
    if (isNaN(createdAt.getTime())) {
      console.warn('Invalid createdAt date for thread:', thread.id, thread.createdAt);
      return {
        breached: false,
        minutesSinceCreation: 0,
        targetMinutes: 0
      };
    }
    
    const minutesSinceCreation = (now - createdAt) / (1000 * 60);

    // SLA targets
    const slaTargets = {
      WHATSAPP: 5,
      SMS: 5,
      EMAIL: 30,
      VOICE: 5,
    };

    const targetMinutes = priority === 'URGENT' ? 5 : slaTargets[channel] || 30;
    const breached = minutesSinceCreation > targetMinutes;

    return {
      breached,
      minutesSinceCreation: Math.floor(minutesSinceCreation),
      targetMinutes,
    };
  } catch (error) {
    console.error('Error calculating SLA for thread:', thread.id, error);
    // Return safe defaults on error
    return {
      breached: false,
      minutesSinceCreation: 0,
      targetMinutes: 0
    };
  }
}

/**
 * GET /api/conversations
 * List unified conversations (RBAC-filtered)
 */
router.get('/', async (req, res) => {
  try {
    // Get user ID from authenticated request (set by authenticate middleware)
    const userId = req.user?.id;
    
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

    // Status filter (only if status field exists in schema)
    // Note: This will fail if status column doesn't exist, so we'll handle it gracefully
    try {
      if (status) {
        where.status = status;
      }

      // Assigned filter (only if assignedTo field exists in schema)
      if (assignedTo === 'me') {
        where.assignedTo = userId;
      } else if (assignedTo === 'unassigned') {
        where.assignedTo = null;
      } else if (assignedTo) {
        where.assignedTo = assignedTo;
      }
    } catch (error) {
      // If status/assignedTo fields don't exist yet, ignore these filters
      console.warn('Status/assignedTo filters not available:', error.message);
    }

    // Search filter
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { participants: { has: search } },
      ];
    }

    // Fetch threads
    // Use a simpler query that works with current schema (without new fields)
    // We'll enhance this after migration
    let threads;
    try {
      // Try to fetch with all new relations
      threads = await getPrisma().thread.findMany({
        where: {
          isArchived: false,
          ...(where.propertyId && { propertyId: where.propertyId }),
        },
        include: {
          property: {
            select: { id: true, name: true, slug: true },
          },
          booking: {
            select: { id: true, guestName: true, checkIn: true, checkOut: true },
          },
          emails: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          // Only include new relations if they exist
          ...(where.assignedTo !== undefined && {
            assignedUser: {
              select: { id: true, name: true, email: true },
            },
          }),
        },
        orderBy: { lastMessageAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      });
    } catch (error) {
      // Fallback: Fetch without new fields
      console.warn('Error fetching threads, using fallback query:', error.message);
      threads = await getPrisma().thread.findMany({
        where: {
          isArchived: false,
          ...(where.propertyId && { propertyId: where.propertyId }),
        },
        include: {
          property: {
            select: { id: true, name: true, slug: true },
          },
          booking: {
            select: { id: true, guestName: true, checkIn: true, checkOut: true },
          },
          emails: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      });
    }

    // Enrich with channel info and SLA
    const enriched = threads.map((thread) => {
      const lastEmail = thread.emails?.[0];
      const lastMessage = thread.messageLogs?.[0];
      const lastCall = thread.callLogs?.[0];

      // Determine primary channel
      let primaryChannel = 'EMAIL';
      let lastActivity = thread.lastMessageAt;

      if (lastCall && new Date(lastCall.createdAt) > new Date(lastActivity)) {
        primaryChannel = 'VOICE';
        lastActivity = lastCall.createdAt;
      }
      if (lastMessage && new Date(lastMessage.createdAt) > new Date(lastActivity)) {
        primaryChannel = lastMessage.channel === 'WHATSAPP' ? 'WHATSAPP' : lastMessage.channel === 'SMS' ? 'SMS' : 'EMAIL';
        lastActivity = lastMessage.createdAt;
      }

      // Calculate SLA (with defaults if thread doesn't have status field)
      const threadStatus = thread.status || 'NEW';
      const sla = calculateSLA({ ...thread, status: threadStatus }, primaryChannel);

      return {
        ...thread,
        status: threadStatus,
        assignedTo: thread.assignedTo || null,
        assignedUser: thread.assignedUser || null,
        priority: thread.priority || 'NORMAL',
        primaryChannel,
        lastActivity,
        sla,
        unreadCount: thread.unreadCount || 0,
        _count: {
          emails: thread._count?.emails || thread.emails?.length || 0,
          messageLogs: thread._count?.messageLogs || thread.messageLogs?.length || 0,
          callLogs: thread._count?.callLogs || thread.callLogs?.length || 0,
          notes: thread._count?.notes || thread.notes?.length || 0,
        },
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
      console.error('GET /api/conversations/:id - No userId found. req.user:', req.user, 'req.query:', req.query);
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized',
        message: 'User ID is required. Please ensure you are authenticated.' 
      });
    }

    const threadId = parseInt(req.params.id);

    // Get accessible property IDs
    const accessiblePropertyIds = await getAccessiblePropertyIds(userId);

    const thread = await getPrisma().thread.findUnique({
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
      return res.status(404).json({ 
        success: false,
        error: 'Conversation not found',
        message: `Thread with ID ${threadId} does not exist.` 
      });
    }

    // Check RBAC access
    if (accessiblePropertyIds !== null) {
      if (!thread.propertyId || !accessiblePropertyIds.includes(thread.propertyId)) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to view this conversation.' 
        });
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
    // Handle backward compatibility - thread might not have status/priority if migration not applied
    const primaryChannel = messages.length > 0 ? messages[messages.length - 1].channel : 'EMAIL';
    const threadStatus = thread.status || 'NEW'; // Default to NEW if status doesn't exist
    const threadPriority = thread.priority || 'NORMAL'; // Default to NORMAL if priority doesn't exist
    const sla = calculateSLA({ ...thread, status: threadStatus, priority: threadPriority }, primaryChannel);

    // Build conversation response with backward compatibility
    const conversationResponse = {
      ...thread,
      status: threadStatus,
      priority: threadPriority,
      assignedTo: thread.assignedTo || null,
      assignedUser: thread.assignedUser || null,
      messages,
      sla,
      // Add default values for fields that might not exist
      unreadCount: thread.unreadCount || 0,
      participants: thread.participants || [],
    };

    res.json({
      success: true,
      conversation: conversationResponse,
    });
  } catch (error) {
    console.error('Conversation fetch error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch conversation',
      message: error.message || 'An unexpected error occurred while fetching the conversation.'
    });
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
    const userRoles = await getPrisma().userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    if (!canAssign(userRoles)) {
      return res.status(403).json({ error: 'Permission denied. Only MANAGER+ can assign conversations.' });
    }

    // Update assignment
    const thread = await getPrisma().thread.update({
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

    // Broadcast real-time event
    if (typeof global.broadcastEvent === 'function') {
      global.broadcastEvent({
        type: 'conversation_updated',
        conversationId: threadId,
        assignedTo: thread.assignedTo,
        status: thread.status,
      }, assignedTo || userId);
    }

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

    // Get current thread to check resolvedAt
    const currentThread = await getPrisma().thread.findUnique({
      where: { id: threadId },
      select: { resolvedAt: true },
    });

    const updateData = {
      status,
      ...(status === 'RESOLVED' && !currentThread?.resolvedAt ? { resolvedAt: new Date() } : {}),
    };

    const thread = await getPrisma().thread.update({
      where: { id: threadId },
      data: updateData,
    });

    // Broadcast real-time event
    if (typeof global.broadcastEvent === 'function') {
      global.broadcastEvent({
        type: 'conversation_updated',
        conversationId: threadId,
        status: thread.status,
        assignedTo: thread.assignedTo,
      }, thread.assignedTo || userId);
    }

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

    const note = await getPrisma().conversationNote.create({
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

    const thread = await getPrisma().thread.update({
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

/**
 * POST /api/conversations/:id/mark-read
 * Mark conversation as read (reset unreadCount)
 */
router.post('/:id/mark-read', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const threadId = parseInt(req.params.id);

    const thread = await getPrisma().thread.update({
      where: { id: threadId },
      data: { unreadCount: 0 },
    });

    res.json({
      success: true,
      conversation: thread,
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

/**
 * POST /api/conversations/bulk
 * Perform bulk actions on multiple conversations
 */
router.post('/bulk', async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { conversationIds, action, value } = req.body;

    if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
      return res.status(400).json({ success: false, error: 'conversationIds array is required' });
    }

    if (!['assign', 'status', 'archive'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action. Must be: assign, status, or archive' });
    }

    // Get accessible property IDs for RBAC check
    const accessiblePropertyIds = await getAccessiblePropertyIds(userId);

    // Build where clause with RBAC filtering
    const where = {
      id: { in: conversationIds.map(id => parseInt(id)) },
    };

    if (accessiblePropertyIds !== null) {
      where.propertyId = { in: accessiblePropertyIds };
    }

    // Verify all conversations are accessible
    const accessibleThreads = await getPrisma().thread.findMany({
      where,
      select: { id: true },
    });

    if (accessibleThreads.length !== conversationIds.length) {
      return res.status(403).json({
        success: false,
        error: 'Some conversations are not accessible',
      });
    }

    let updateData = {};
    let updated = 0;

    switch (action) {
      case 'assign':
        updateData = {
          assignedTo: value || userId,
        };
        break;
      case 'status':
        if (!['NEW', 'IN_PROGRESS', 'WAITING_FOR_GUEST', 'RESOLVED', 'ARCHIVED'].includes(value)) {
          return res.status(400).json({ success: false, error: 'Invalid status value' });
        }
        updateData = {
          status: value,
          ...(value === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
          ...(value === 'ARCHIVED' ? { isArchived: true } : {}),
        };
        break;
      case 'archive':
        updateData = {
          isArchived: true,
          status: 'ARCHIVED',
        };
        break;
    }

    const result = await getPrisma().thread.updateMany({
      where,
      data: updateData,
    });

    updated = result.count;

    res.json({
      success: true,
      updated,
      message: `Successfully ${action}ed ${updated} conversation(s)`,
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({ success: false, error: 'Failed to perform bulk action' });
  }
});

module.exports = router;

