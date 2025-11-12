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

// Store active SSE connections
const clients = new Map();

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
 * GET /api/realtime/events
 * Server-Sent Events endpoint for real-time conversation updates
 */
router.get('/events', async (req, res) => {
  const userId = req.user?.id || req.query.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Store client connection
  const clientId = `${userId}-${Date.now()}`;
  clients.set(clientId, { res, userId });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  // Send initial unread count
  try {
    const accessiblePropertyIds = await getAccessiblePropertyIds(userId);
    const where = {
      unreadCount: { gt: 0 },
      ...(accessiblePropertyIds !== null ? {
        propertyId: { in: accessiblePropertyIds },
      } : {}),
    };

    const unreadCount = await getPrisma().thread.count({ where });
    res.write(`data: ${JSON.stringify({ type: 'unread_count', count: unreadCount })}\n\n`);
  } catch (error) {
    console.error('Error sending initial unread count:', error);
  }

  // Handle client disconnect
  req.on('close', () => {
    clients.delete(clientId);
    res.end();
  });
});

/**
 * Broadcast event to all connected clients or specific user
 */
function broadcastEvent(event, targetUserId = null) {
  const message = `data: ${JSON.stringify(event)}\n\n`;
  
  clients.forEach((client, clientId) => {
    if (!targetUserId || client.userId === targetUserId) {
      try {
        client.res.write(message);
      } catch (error) {
        // Client disconnected, remove from map
        clients.delete(clientId);
      }
    }
  });
}

/**
 * POST /api/realtime/broadcast
 * Internal endpoint to broadcast events (called by webhook handlers, etc.)
 */
router.post('/broadcast', async (req, res) => {
  const { event, userId } = req.body;
  
  if (!event || !event.type) {
    return res.status(400).json({ error: 'Invalid event' });
  }

  broadcastEvent(event, userId);
  res.json({ success: true });
});

module.exports = { router, broadcastEvent };

