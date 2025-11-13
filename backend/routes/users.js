const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client lazily to avoid startup issues
let prisma;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

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

    const users = await getPrisma().user.findMany({
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
    const { firstName, lastName, email, phone, roleKey, scopeType = 'ORG', scopeId = null } = req.body;
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    if (!email || !roleKey || !firstName || !lastName || !phone) {
      return res.status(400).json({ error: 'First name, last name, email, phone, and role are required' });
    }

    // Ensure email is unique
    const existingUser = await getPrisma().user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const user = await getPrisma().user.create({
      data: {
        name: fullName || email.split('@')[0],
        email,
        phone,
      },
    });

    await getPrisma().userRole.create({
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
      user: {
        ...user,
        name: fullName || user.name,
      },
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
    const {
      roleKey,
      scopeType = 'ORG',
      scopeId = null,
      phone,
      firstName,
      lastName,
      name,
    } = req.body;

    const fullName = name || [firstName, lastName].filter(Boolean).join(' ').trim();

    const user = await getPrisma().user.findUnique({
      where: { id },
      include: {
        userRoles: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update phone if provided
    if (phone !== undefined || fullName) {
      const updateData = {};
      if (phone !== undefined) {
        updateData.phone = phone || null;
      }
      if (fullName) {
        updateData.name = fullName;
      }
      if (Object.keys(updateData).length > 0) {
        await getPrisma().user.update({
          where: { id },
          data: updateData,
        });
      }
    }

    if (roleKey) {
      const existingRole = user.userRoles[0];

      if (existingRole) {
        await getPrisma().userRole.update({
          where: { id: existingRole.id },
          data: {
            roleKey,
            scopeType,
            scopeId: scopeType === 'ORG' ? null : scopeId,
          },
        });
      } else {
        await getPrisma().userRole.create({
          data: {
            userId: id,
            roleKey,
            scopeType,
            scopeId: scopeType === 'ORG' ? null : scopeId,
          },
        });
      }
    }

    const updatedUser = await getPrisma().user.findUnique({
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

