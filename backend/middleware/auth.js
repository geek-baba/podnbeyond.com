const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Authentication Middleware
 * Verifies session token from cookie or Authorization header
 * Loads user with roles and permissions
 * Sets req.user with user context
 */
async function authenticate(req, res, next) {
  try {
    // Get session token from cookie or header
    // Try multiple cookie names for compatibility
    const sessionToken = 
      req.cookies['pod-session'] ||
      req.cookies['session-token'] || 
      req.cookies['next-auth.session-token'] ||
      req.cookies['__Secure-next-auth.session-token'] ||
      req.headers.authorization?.replace('Bearer ', '') ||
      req.headers['x-session-token'];

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No session token found. Please log in.'
      });
    }

    // Verify session token
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session',
        message: 'Session not found. Please log in again.'
      });
    }

    // Check if session is expired
    if (session.expires < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Expired session',
        message: 'Your session has expired. Please log in again.'
      });
    }

    // Set user on request
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      phone: session.user.phone,
      image: session.user.image,
      roles: session.user.userRoles.map(ur => ({
        key: ur.roleKey,
        scopeType: ur.scopeType,
        scopeId: ur.scopeId,
        permissions: ur.role.permissions,
        roleName: ur.role.name
      }))
    };

    // Add helper methods
    req.user.hasPermission = (permission) => {
      return req.user.roles.some(role => {
        // Check for wildcard permission (all permissions)
        if (role.permissions.includes('*')) {
          return true;
        }

        // Check for exact permission match
        if (role.permissions.includes(permission)) {
          return true;
        }

        // Check for wildcard permission (e.g., bookings:*:scoped)
        const [resource, action, scope] = permission.split(':');
        if (resource && action && scope) {
          const wildcardPermission = `${resource}:*:${scope}`;
          if (role.permissions.includes(wildcardPermission)) {
            return true;
          }
        }

        // Check for global permission if scoped (e.g., bookings:read:global)
        if (scope === 'scoped') {
          const globalPermission = `${resource}:${action}:global`;
          if (role.permissions.includes(globalPermission)) {
            return true;
          }
        }

        return false;
      });
    };

    req.user.hasRole = (roleKey, scopeType = null, scopeId = null) => {
      return req.user.roles.some(role => {
        if (role.key !== roleKey) {
          return false;
        }
        if (scopeType && role.scopeType !== scopeType) {
          return false;
        }
        if (scopeId && role.scopeId !== scopeId) {
          return false;
        }
        return true;
      });
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication check failed',
      message: error.message
    });
  }
}

/**
 * Optional authentication middleware
 * Sets req.user if session exists, but doesn't fail if not
 * Useful for endpoints that work with or without authentication
 */
async function optionalAuthenticate(req, res, next) {
  try {
    // Get session token from cookie or header
    const sessionToken = 
      req.cookies['pod-session'] ||
      req.cookies['session-token'] || 
      req.cookies['next-auth.session-token'] ||
      req.cookies['__Secure-next-auth.session-token'] ||
      req.headers.authorization?.replace('Bearer ', '') ||
      req.headers['x-session-token'];

    if (!sessionToken) {
      // No session token, continue without user
      return next();
    }

    // Verify session token
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    if (session && session.expires >= new Date()) {
      // Valid session, set user
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        phone: session.user.phone,
        image: session.user.image,
        roles: session.user.userRoles.map(ur => ({
          key: ur.roleKey,
          scopeType: ur.scopeType,
          scopeId: ur.scopeId,
          permissions: ur.role.permissions,
          roleName: ur.role.name
        }))
      };

      // Add helper methods
      req.user.hasPermission = (permission) => {
        return req.user.roles.some(role => {
          // Check for wildcard permission (all permissions)
          if (role.permissions.includes('*')) {
            return true;
          }

          // Check for exact permission match
          if (role.permissions.includes(permission)) {
            return true;
          }

          // Check for wildcard permission (e.g., bookings:*:scoped)
          const [resource, action, scope] = permission.split(':');
          if (resource && action && scope) {
            const wildcardPermission = `${resource}:*:${scope}`;
            if (role.permissions.includes(wildcardPermission)) {
              return true;
            }
          }

          // Check for global permission if scoped (e.g., bookings:read:global)
          if (scope === 'scoped') {
            const globalPermission = `${resource}:${action}:global`;
            if (role.permissions.includes(globalPermission)) {
              return true;
            }
          }

          return false;
        });
      };

      req.user.hasRole = (roleKey, scopeType = null, scopeId = null) => {
        return req.user.roles.some(role => {
          if (role.key !== roleKey) {
            return false;
          }
          if (scopeType && role.scopeType !== scopeType) {
            return false;
          }
          if (scopeId && role.scopeId !== scopeId) {
            return false;
          }
          return true;
        });
      };
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    // Continue without user on error
    next();
  }
}

module.exports = { authenticate, optionalAuthenticate };

