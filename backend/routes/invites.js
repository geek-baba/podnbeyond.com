const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { authorize } = require('../lib/rbac');

const prisma = new PrismaClient();

/**
 * POST /api/admin/invites
 * Create a new staff invitation
 */
router.post('/', async (req, res) => {
  try {
    // Get session and verify admin permission
    const sessionToken = req.cookies['__Secure-next-auth.session-token'] || 
                        req.cookies['next-auth.session-token'];

    if (!sessionToken) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: { include: { userRoles: { include: { role: true } } } } }
    });

    if (!session || session.expires < new Date()) {
      return res.status(401).json({ success: false, error: 'Session expired' });
    }

    // Check permission to invite
    const canInvite = await authorize(
      { ...session.user, roles: session.user.userRoles }, 
      'users:invite'
    );

    if (!canInvite) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions to invite users' 
      });
    }

    const { email, roleKey, scopeType, scopeId } = req.body;

    // Validate input
    if (!email || !roleKey) {
      return res.status(400).json({
        success: false,
        error: 'Email and role are required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Check for pending invite
    const existingInvite = await prisma.invite.findFirst({
      where: {
        email,
        acceptedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    if (existingInvite) {
      return res.status(400).json({
        success: false,
        error: 'A pending invite already exists for this email'
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Get organization (assume single org for now)
    const org = await prisma.organization.findFirst();
    
    if (!org) {
      return res.status(500).json({
        success: false,
        error: 'Organization not configured'
      });
    }

    // Create invite
    const invite = await prisma.invite.create({
      data: {
        email,
        roleKey,
        scopeType: scopeType || 'ORG',
        scopeId: scopeId || null,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        invitedBy: session.user.id,
        orgId: org.id
      },
      include: {
        inviter: true,
        organization: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'user.invite',
        targetType: 'Invite',
        targetId: invite.id.toString(),
        metadata: {
          email,
          roleKey,
          scopeType,
          scopeId
        },
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // TODO: Send invitation email
    // For now, return the invite link
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/accept-invite?token=${token}`;

    console.log(`\n📧 Invitation created for ${email}`);
    console.log(`🔗 Invite link: ${inviteUrl}\n`);

    return res.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        roleKey: invite.roleKey,
        scopeType: invite.scopeType,
        scopeId: invite.scopeId,
        expiresAt: invite.expiresAt.toISOString(),
        inviteUrl
      }
    });

  } catch (error) {
    console.error('Error creating invite:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create invite'
    });
  }
});

/**
 * POST /api/admin/invites/accept
 * Accept an invitation and create user account
 */
router.post('/accept', async (req, res) => {
  try {
    const { token, firstName, lastName, phone } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Invite token required'
      });
    }

    if (!firstName || !lastName || !phone) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, and phone number are required'
      });
    }

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedFirst || !trimmedLast || !trimmedPhone) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, and phone number are required'
      });
    }

    const fullName = [trimmedFirst, trimmedLast].filter(Boolean).join(' ').trim();

    // Find invite
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { organization: true }
    });

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Invalid invite token'
      });
    }

    // Check if already accepted
    if (invite.acceptedAt) {
      return res.status(400).json({
        success: false,
        error: 'This invite has already been accepted'
      });
    }

    // Check if expired
    if (invite.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'This invite has expired'
      });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: invite.email,
        name: fullName || invite.email.split('@')[0],
        phone: trimmedPhone,
        emailVerified: new Date()
      }
    });

    // Assign role
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleKey: invite.roleKey,
        scopeType: invite.scopeType,
        scopeId: invite.scopeId
      }
    });

    // If member role, create loyalty account
    if (invite.roleKey === 'MEMBER') {
      await prisma.loyaltyAccount.create({
        data: {
          userId: user.id,
          points: 0,
          tier: 'SILVER'
        }
      });
    }

    // Mark invite as accepted
    await prisma.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'invite.accept',
        targetType: 'Invite',
        targetId: invite.id.toString(),
        metadata: {
          roleKey: invite.roleKey,
          scopeType: invite.scopeType,
          scopeId: invite.scopeId
        },
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      message: 'Account created successfully! You can now sign in.'
    });

  } catch (error) {
    console.error('Error accepting invite:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to accept invite'
    });
  }
});

/**
 * GET /api/admin/invites
 * List all pending invites (admin/superadmin only)
 */
router.get('/', async (req, res) => {
  try {
    const sessionToken = req.cookies['__Secure-next-auth.session-token'] || 
                        req.cookies['next-auth.session-token'];

    if (!sessionToken) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: { include: { userRoles: { include: { role: true } } } } }
    });

    if (!session || session.expires < new Date()) {
      return res.status(401).json({ success: false, error: 'Session expired' });
    }

    // Check permission
    const canView = await authorize(
      { ...session.user, roles: session.user.userRoles }, 
      'users:read'
    );

    if (!canView) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    // Get all invites
    const invites = await prisma.invite.findMany({
      include: {
        inviter: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json({
      success: true,
      invites: invites.map(inv => ({
        ...inv,
        createdAt: inv.createdAt.toISOString(),
        updatedAt: inv.updatedAt.toISOString(),
        expiresAt: inv.expiresAt.toISOString(),
        acceptedAt: inv.acceptedAt?.toISOString() || null
      }))
    });

  } catch (error) {
    console.error('Error fetching invites:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch invites'
    });
  }
});

module.exports = router;

