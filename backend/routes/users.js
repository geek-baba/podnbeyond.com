const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STAFF_ROLE_KEYS = [
  'STAFF_FRONTDESK',
  'STAFF_OPS',
  'MANAGER',
  'ADMIN',
  'SUPERADMIN',
];

/**
 * GET /api/users
 * List all staff/admin users with primary role information
 */
router.get('/', async (req, res) => {
  try {
    const search = (req.query.search || '').toLowerCase();

    const users = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            roleKey: {
              in: STAFF_ROLE_KEYS,
            },
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const mappedUsers = users
      .map((user) => {
        const primaryRole = user.userRoles[0];

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          roleKey: primaryRole?.roleKey || null,
          roleName: primaryRole?.role?.name || primaryRole?.roleKey || null,
          scopeType: primaryRole?.scopeType || 'ORG',
          scopeId: primaryRole?.scopeId || null,
        };
      })
      .filter((user) => {
        if (!search) return true;
        return (
          (user.name && user.name.toLowerCase().includes(search)) ||
          user.email.toLowerCase().includes(search) ||
          (user.phone && user.phone.toLowerCase().includes(search)) ||
          user.roleName.toLowerCase().includes(search)
        );
      });

    res.json({
      success: true,
      users: mappedUsers,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      details: error.message,
    });
  }
});

/**
 * POST /api/users
 * Manually create a staff user (without invitation)
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, roleKey, scopeType = 'ORG', scopeId = null } = req.body;

    if (!email || !roleKey) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    // Ensure email is unique
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const user = await prisma.user.create({
      data: {
        name: name || email.split('@')[0],
        email,
        phone: phone || null,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleKey,
        scopeType,
        scopeId: scopeType === 'ORG' ? null : scopeId,
      },
    });

    console.log(`✅ Created new staff user ${email} with role ${roleKey}`);

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      error: 'Failed to create user',
      details: error.message,
    });
  }
});

/**
 * PATCH /api/users/:id
 * Update user role/scope/contact info
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { roleKey, scopeType = 'ORG', scopeId = null, phone } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update phone if provided
    if (phone !== undefined) {
      await prisma.user.update({
        where: { id },
        data: { phone: phone || null },
      });
    }

    if (roleKey) {
      const existingRole = user.userRoles[0];

      if (existingRole) {
        await prisma.userRole.update({
          where: { id: existingRole.id },
          data: {
            roleKey,
            scopeType,
            scopeId: scopeType === 'ORG' ? null : scopeId,
          },
        });
      } else {
        await prisma.userRole.create({
          data: {
            userId: id,
            roleKey,
            scopeType,
            scopeId: scopeType === 'ORG' ? null : scopeId,
          },
        });
      }
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: { role: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        roleKey: updatedUser.userRoles[0]?.roleKey || 'MEMBER',
        roleName: updatedUser.userRoles[0]?.role?.name || 'Member',
        scopeType: updatedUser.userRoles[0]?.scopeType || 'ORG',
        scopeId: updatedUser.userRoles[0]?.scopeId || null,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      error: 'Failed to update user',
      details: error.message,
    });
  }
});

module.exports = router;

