const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * RBAC Policy Map
 * Maps actions to required roles
 */
const POLICY_MAP = {
  // Public actions
  'properties:read': ['GUEST', 'MEMBER', 'STAFF_FRONTDESK', 'STAFF_OPS', 'MANAGER', 'ADMIN', 'SUPERADMIN'],
  'rooms:read': ['GUEST', 'MEMBER', 'STAFF_FRONTDESK', 'STAFF_OPS', 'MANAGER', 'ADMIN', 'SUPERADMIN'],
  'brands:read': ['GUEST', 'MEMBER', 'STAFF_FRONTDESK', 'STAFF_OPS', 'MANAGER', 'ADMIN', 'SUPERADMIN'],
  
  // Member actions
  'bookings:read:own': ['MEMBER', 'ADMIN', 'SUPERADMIN'],
  'loyalty:read:own': ['MEMBER', 'ADMIN', 'SUPERADMIN'],
  'profile:read:own': ['MEMBER', 'STAFF_FRONTDESK', 'STAFF_OPS', 'MANAGER', 'ADMIN', 'SUPERADMIN'],
  'profile:update:own': ['MEMBER', 'ADMIN', 'SUPERADMIN'],
  
  // Staff frontdesk actions (scoped)
  'bookings:read:scoped': ['STAFF_FRONTDESK', 'MANAGER', 'ADMIN', 'SUPERADMIN'],
  'bookings:write:scoped': ['STAFF_FRONTDESK', 'MANAGER', 'ADMIN', 'SUPERADMIN'],
  'checkin:write:scoped': ['STAFF_FRONTDESK', 'MANAGER', 'ADMIN', 'SUPERADMIN'],
  'checkout:write:scoped': ['STAFF_FRONTDESK', 'MANAGER', 'ADMIN', 'SUPERADMIN'],
  'guests:read:scoped': ['STAFF_FRONTDESK', 'MANAGER', 'ADMIN', 'SUPERADMIN'],
  
  // Staff ops actions (scoped)
  'inventory:read:scoped': ['STAFF_FRONTDESK', 'STAFF_OPS', 'MANAGER', 'ADMIN', 'SUPERADMIN'],
  'inventory:update:scoped': ['STAFF_OPS', 'MANAGER', 'ADMIN', 'SUPERADMIN'],
  'rooms:update:scoped': ['STAFF_OPS', 'MANAGER', 'ADMIN', 'SUPERADMIN'],
  'pricing:read:scoped': ['STAFF_OPS', 'MANAGER', 'ADMIN', 'SUPERADMIN'],
  'pricing:update:scoped': ['STAFF_OPS', 'MANAGER', 'ADMIN', 'SUPERADMIN'],
  'maintenance:write:scoped': ['STAFF_OPS', 'MANAGER', 'ADMIN', 'SUPERADMIN'],
  
  // Manager actions (scoped)
  'bookings:*:scoped': ['MANAGER', 'ADMIN', 'SUPERADMIN'],
  'inventory:*:scoped': ['MANAGER', 'ADMIN', 'SUPERADMIN'],
  'staff:read:scoped': ['MANAGER', 'ADMIN', 'SUPERADMIN'],
  'staff:invite:scoped': ['MANAGER', 'ADMIN', 'SUPERADMIN'],
  'refunds:write:scoped': ['MANAGER', 'ADMIN', 'SUPERADMIN'],
  'comps:write:scoped': ['MANAGER', 'ADMIN', 'SUPERADMIN'],
  'reports:read:scoped': ['MANAGER', 'ADMIN', 'SUPERADMIN'],
  'analytics:read:scoped': ['MANAGER', 'ADMIN', 'SUPERADMIN'],
  
  // Admin actions (global)
  'properties:*': ['ADMIN', 'SUPERADMIN'],
  'brands:*': ['ADMIN', 'SUPERADMIN'],
  'bookings:*': ['ADMIN', 'SUPERADMIN'],
  'inventory:*': ['ADMIN', 'SUPERADMIN'],
  'rooms:*': ['ADMIN', 'SUPERADMIN'],
  'pricing:*': ['ADMIN', 'SUPERADMIN'],
  'ota:configure': ['ADMIN', 'SUPERADMIN'],
  'payments:configure': ['ADMIN', 'SUPERADMIN'],
  'cms:*': ['ADMIN', 'SUPERADMIN'],
  'users:invite': ['ADMIN', 'SUPERADMIN'],
  'users:read': ['ADMIN', 'SUPERADMIN'],
  'users:manage': ['ADMIN', 'SUPERADMIN'],
  'loyalty:adjust': ['ADMIN', 'SUPERADMIN'],
  'settings:update': ['ADMIN', 'SUPERADMIN'],
  
  // Superadmin actions
  'secrets:manage': ['SUPERADMIN'],
  'users:impersonate': ['SUPERADMIN'],
  'flags:manage': ['SUPERADMIN'],
  'audit:read': ['SUPERADMIN', 'ADMIN'],
};

/**
 * Check if a role has permission for an action
 * Supports wildcard permissions (*)
 */
function hasPermission(userPermissions, requiredAction) {
  // Wildcard permission grants everything
  if (userPermissions.includes('*')) {
    return true;
  }
  
  // Exact match
  if (userPermissions.includes(requiredAction)) {
    return true;
  }
  
  // Wildcard match (e.g., 'bookings:*' matches 'bookings:read')
  const [resource, action, scope] = requiredAction.split(':');
  const wildcardPattern = `${resource}:*${scope ? ':' + scope : ''}`;
  if (userPermissions.includes(wildcardPattern)) {
    return true;
  }
  
  return false;
}

/**
 * Check if user's scope matches the required scope
 */
function matchesScope(userRole, requiredScopeType, requiredScopeId) {
  // No scope required (public action)
  if (!requiredScopeType) {
    return true;
  }
  
  // ORG scope matches everything
  if (userRole.scopeType === 'ORG') {
    return true;
  }
  
  // Exact scope match
  if (userRole.scopeType === requiredScopeType && 
      (!requiredScopeId || userRole.scopeId === requiredScopeId)) {
    return true;
  }
  
  // BRAND scope covers all properties within that brand
  if (userRole.scopeType === 'BRAND' && requiredScopeType === 'PROPERTY' && requiredScopeId) {
    // TODO: Check if property belongs to user's brand scope
    // For now, allow if brand scope exists
    return true;
  }
  
  return false;
}

/**
 * Main authorization function
 * 
 * @param {Object} user - User object with roles
 * @param {String} action - Action to authorize (e.g., 'bookings:read')
 * @param {Object} options - Scope requirements
 * @param {String} options.scopeType - 'ORG' | 'BRAND' | 'PROPERTY'
 * @param {Number} options.scopeId - ID of the brand or property
 * @returns {Boolean} - True if authorized
 */
async function authorize(user, action, options = {}) {
  // 1. User must be authenticated (except for public guest actions)
  if (!user && !['properties:read', 'rooms:read', 'brands:read'].includes(action)) {
    return false;
  }
  
  // 2. Check if action exists in policy map
  if (!POLICY_MAP[action]) {
    console.warn(`⚠️  Unknown action in policy map: ${action}`);
    return false;
  }
  
  // 3. For guest actions, allow if no user
  if (!user && POLICY_MAP[action].includes('GUEST')) {
    return true;
  }
  
  // 4. Check if user has any role that permits this action
  const allowedRoles = POLICY_MAP[action];
  
  for (const userRole of user.roles || []) {
    // Check if role is in allowed roles
    if (allowedRoles.includes(userRole.key)) {
      // Check scope match
      if (matchesScope(userRole, options.scopeType, options.scopeId)) {
        // Check if role's permissions include this action
        if (hasPermission(userRole.permissions, action)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Get accessible properties for a user based on their scopes
 */
async function getAccessibleProperties(userId) {
  const userWithRoles = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: true
        }
      }
    }
  });

  if (!userWithRoles) {
    return [];
  }

  // Superadmin and Admin get all properties
  const hasGlobalAccess = userWithRoles.userRoles.some(ur => 
    ['SUPERADMIN', 'ADMIN'].includes(ur.roleKey) || ur.scopeType === 'ORG'
  );

  if (hasGlobalAccess) {
    return await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        brandId: true
      }
    });
  }

  // Get property-scoped roles
  const propertyIds = userWithRoles.userRoles
    .filter(ur => ur.scopeType === 'PROPERTY' && ur.scopeId)
    .map(ur => ur.scopeId);

  // Get brand-scoped roles
  const brandIds = userWithRoles.userRoles
    .filter(ur => ur.scopeType === 'BRAND' && ur.scopeId)
    .map(ur => ur.scopeId);

  // Fetch properties
  const properties = await prisma.property.findMany({
    where: {
      OR: [
        { id: { in: propertyIds } },
        { brandId: { in: brandIds } }
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      brandId: true
    }
  });

  return properties;
}

/**
 * Express middleware to extract user from JWT/session
 */
function requireAuth(req, res, next) {
  // Check for session cookie or Authorization header
  const token = req.cookies['__Secure-next-auth.session-token'] || 
                req.cookies['next-auth.session-token'] ||
                req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required' 
    });
  }

  // For NextAuth, we'll verify the session via the database
  // This is a simplified version - in production, use proper JWT verification
  next();
}

/**
 * Express middleware factory for authorization
 */
function requirePermission(action, scopeTypeExtractor, scopeIdExtractor) {
  return async (req, res, next) => {
    try {
      // Get user from request (set by previous auth middleware)
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      // Extract scope from request
      const scopeType = typeof scopeTypeExtractor === 'function' 
        ? scopeTypeExtractor(req) 
        : scopeTypeExtractor;
      const scopeId = typeof scopeIdExtractor === 'function' 
        ? scopeIdExtractor(req) 
        : scopeIdExtractor;

      // Authorize
      const authorized = await authorize(user, action, { scopeType, scopeId });

      if (!authorized) {
        return res.status(403).json({ 
          success: false, 
          error: 'Insufficient permissions',
          required: action,
          scope: { scopeType, scopeId }
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Authorization check failed' 
      });
    }
  };
}

module.exports = {
  authorize,
  getAccessibleProperties,
  requireAuth,
  requirePermission,
  POLICY_MAP
};

