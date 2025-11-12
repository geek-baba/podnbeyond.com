const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Find or create a thread for a contact (by phone or email)
 */
async function findOrCreateThread({ phone, email, propertyId, bookingId, subject = null }) {
  // Try to find existing thread by contact info
  let thread = null;

  if (email) {
    thread = await prisma.thread.findFirst({
      where: {
        participants: { has: email },
        propertyId: propertyId || undefined,
        isArchived: false,
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  // If not found by email, try by phone via Contact
  if (!thread && phone) {
    const contact = await prisma.contact.findUnique({
      where: { phone },
      include: {
        messageLogs: {
          where: { threadId: { not: null } },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        callLogs: {
          where: { threadId: { not: null } },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (contact) {
      // Find thread from recent message/call
      const recentMessage = contact.messageLogs[0];
      const recentCall = contact.callLogs[0];

      if (recentMessage?.threadId) {
        thread = await prisma.thread.findUnique({
          where: { id: recentMessage.threadId },
        });
      } else if (recentCall?.threadId) {
        thread = await prisma.thread.findUnique({
          where: { id: recentCall.threadId },
        });
      }
    }
  }

  // Create new thread if not found
  if (!thread) {
    const participants = [];
    if (email) participants.push(email);

    thread = await prisma.thread.create({
      data: {
        subject: subject || `Conversation with ${phone || email || 'Guest'}`,
        participants,
        propertyId: propertyId || null,
        bookingId: bookingId || null,
        status: 'NEW',
        priority: 'NORMAL',
      },
    });

    // Auto-assign if property is known
    if (propertyId) {
      const assignedTo = await autoAssignToProperty(propertyId);
      if (assignedTo) {
        await prisma.thread.update({
          where: { id: thread.id },
          data: {
            assignedTo,
            status: 'IN_PROGRESS',
          },
        });
        thread.assignedTo = assignedTo;
        thread.status = 'IN_PROGRESS';
      }
    }

    // Broadcast new conversation event
    if (typeof global.broadcastEvent === 'function') {
      global.broadcastEvent({
        type: 'new_conversation',
        conversationId: thread.id,
        assignedTo: thread.assignedTo,
        propertyId: thread.propertyId,
      });
    }
  }

  return thread;
}

/**
 * Auto-assign thread to property staff (round-robin)
 */
async function autoAssignToProperty(propertyId) {
  try {
    // Try property manager first
    const manager = await prisma.userRole.findFirst({
      where: {
        scopeType: 'PROPERTY',
        scopeId: propertyId,
        roleKey: 'MANAGER',
      },
      include: { user: true },
    });

    if (manager) {
      return manager.userId;
    }

    // Fallback: Round-robin from property staff
    const staff = await prisma.userRole.findMany({
      where: {
        scopeType: 'PROPERTY',
        scopeId: propertyId,
        roleKey: { in: ['STAFF_FRONTDESK', 'STAFF_OPS', 'MANAGER'] },
      },
      include: { user: true },
    });

    if (staff.length === 0) return null;

    // Get assignment counts
    const assignmentCounts = await Promise.all(
      staff.map(async (s) => {
        const count = await prisma.thread.count({
          where: {
            assignedTo: s.userId,
            status: { in: ['NEW', 'IN_PROGRESS'] },
          },
        });
        return { userId: s.userId, count };
      })
    );

    // Assign to least busy
    const leastBusy = assignmentCounts.reduce((min, current) =>
      current.count < min.count ? current : min
    );

    return leastBusy.userId;
  } catch (error) {
    console.error('Auto-assignment error:', error);
    return null;
  }
}

/**
 * Link message log to thread
 */
async function linkMessageToThread(messageLogId, threadId) {
  try {
    const messageLog = await prisma.messageLog.findUnique({
      where: { id: messageLogId },
      select: { createdAt: true, direction: true },
    });

    if (!messageLog) return false;

    // Update message log with thread link
    await prisma.messageLog.update({
      where: { id: messageLogId },
      data: { threadId },
    });

    // Get thread to check assigned user
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { assignedTo: true },
    });

    // Update thread's lastMessageAt and increment unreadCount for inbound messages
    const updateData = {
      lastMessageAt: messageLog.createdAt,
      status: 'IN_PROGRESS', // Mark as in progress when new message arrives
    };

    // Increment unread count for inbound messages (if thread is assigned)
    if (messageLog.direction === 'INBOUND' && thread?.assignedTo) {
      updateData.unreadCount = { increment: 1 };
    }

    const updatedThread = await prisma.thread.update({
      where: { id: threadId },
      data: updateData,
      include: {
        property: { select: { id: true, name: true } },
        assignedUser: { select: { id: true, name: true } },
      },
    });

    // Broadcast real-time event
    if (typeof global.broadcastEvent === 'function') {
      global.broadcastEvent({
        type: 'conversation_updated',
        conversationId: threadId,
        assignedTo: updatedThread.assignedTo,
        unreadCount: updatedThread.unreadCount,
      }, updatedThread.assignedTo);
    }

    return true;
  } catch (error) {
    console.error('Link message to thread error:', error);
    return false;
  }
}

/**
 * Link call log to thread
 */
async function linkCallToThread(callLogId, threadId) {
  try {
    const callLog = await prisma.callLog.findUnique({
      where: { id: callLogId },
      select: { createdAt: true, direction: true },
    });

    if (!callLog) return false;

    // Update call log with thread link
    await prisma.callLog.update({
      where: { id: callLogId },
      data: { threadId },
    });

    // Get thread to check assigned user
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { assignedTo: true },
    });

    // Update thread's lastMessageAt and increment unreadCount for inbound calls
    const updateData = {
      lastMessageAt: callLog.createdAt,
      status: 'IN_PROGRESS',
    };

    // Increment unread count for inbound calls (if thread is assigned)
    if (callLog.direction === 'INBOUND' && thread?.assignedTo) {
      updateData.unreadCount = { increment: 1 };
    }

    const updatedThread = await prisma.thread.update({
      where: { id: threadId },
      data: updateData,
      include: {
        property: { select: { id: true, name: true } },
        assignedUser: { select: { id: true, name: true } },
      },
    });

    // Broadcast real-time event
    if (typeof global.broadcastEvent === 'function') {
      global.broadcastEvent({
        type: 'conversation_updated',
        conversationId: threadId,
        assignedTo: updatedThread.assignedTo,
        unreadCount: updatedThread.unreadCount,
      }, updatedThread.assignedTo);
    }

    return true;
  } catch (error) {
    console.error('Link call to thread error:', error);
    return false;
  }
}

/**
 * Link email to thread (existing functionality, but ensure thread exists)
 */
async function ensureThreadForEmail(emailId, threadId) {
  try {
    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: { thread: true },
    });

    if (!email) return null;

    // If thread already exists, just update lastMessageAt
    if (email.threadId) {
      await prisma.thread.update({
        where: { id: email.threadId },
        data: { lastMessageAt: email.createdAt },
      });
      return email.thread;
    }

    // Otherwise, find or create thread
    const thread = await findOrCreateThread({
      email: email.fromEmail,
      propertyId: email.propertyId || null,
      bookingId: email.bookingId || null,
      subject: email.subject,
    });

    // Link email to thread
    await prisma.email.update({
      where: { id: emailId },
      data: { threadId: thread.id },
    });

    return thread;
  } catch (error) {
    console.error('Ensure thread for email error:', error);
    return null;
  }
}

module.exports = {
  findOrCreateThread,
  autoAssignToProperty,
  linkMessageToThread,
  linkCallToThread,
  ensureThreadForEmail,
};

