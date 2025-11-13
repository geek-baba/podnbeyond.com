/**
 * RBAC (Role-Based Access Control) Middleware
 * Checks if user has required permission
 * Supports wildcard permissions, scoped permissions, and global permissions
 */

/**
 * Require permission middleware factory
 * @param {string} requiredPermission - Required permission (e.g., 'bookings:read:scoped')
 * @returns {Function} - Express middleware function
 */
function requirePermission(requiredPermission) {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to access this resource.'
      });
    }

    // Check if user has required permission
    const hasPermission = req.user.hasPermission(requiredPermission);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `You do not have permission to ${requiredPermission}.`,
        required: requiredPermission,
        user: {
          id: req.user.id,
          email: req.user.email,
          roles: req.user.roles.map(r => ({
            key: r.key,
            scopeType: r.scopeType,
            scopeId: r.scopeId,
            permissions: r.permissions
          }))
        }
      });
    }

    next();
  };
}

/**
 * Require any of the specified permissions
 * @param {string[]} requiredPermissions - Array of required permissions
 * @returns {Function} - Express middleware function
 */
function requireAnyPermission(...requiredPermissions) {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to access this resource.'
      });
    }

    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some(permission => 
      req.user.hasPermission(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `You do not have any of the required permissions.`,
        required: requiredPermissions,
        user: {
          id: req.user.id,
          email: req.user.email,
          roles: req.user.roles.map(r => ({
            key: r.key,
            scopeType: r.scopeType,
            scopeId: r.scopeId,
            permissions: r.permissions
          }))
        }
      });
    }

    next();
  };
}

/**
 * Require all of the specified permissions
 * @param {string[]} requiredPermissions - Array of required permissions
 * @returns {Function} - Express middleware function
 */
function requireAllPermissions(...requiredPermissions) {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to access this resource.'
      });
    }

    // Check if user has all of the required permissions
    const hasPermission = requiredPermissions.every(permission => 
      req.user.hasPermission(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `You do not have all of the required permissions.`,
        required: requiredPermissions,
        user: {
          id: req.user.id,
          email: req.user.email,
          roles: req.user.roles.map(r => ({
            key: r.key,
            scopeType: r.scopeType,
            scopeId: r.scopeId,
            permissions: r.permissions
          }))
        }
      });
    }

    next();
  };
}

/**
 * Require specific role
 * @param {string} roleKey - Required role key
 * @param {string} scopeType - Optional scope type (ORG, BRAND, PROPERTY)
 * @param {number} scopeId - Optional scope ID
 * @returns {Function} - Express middleware function
 */
function requireRole(roleKey, scopeType = null, scopeId = null) {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to access this resource.'
      });
    }

    // Check if user has required role
    const hasRole = req.user.hasRole(roleKey, scopeType, scopeId);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient role',
        message: `You do not have the required role: ${roleKey}.`,
        required: { roleKey, scopeType, scopeId },
        user: {
          id: req.user.id,
          email: req.user.email,
          roles: req.user.roles.map(r => ({
            key: r.key,
            scopeType: r.scopeType,
            scopeId: r.scopeId
          }))
        }
      });
    }

    next();
  };
}

/**
 * Check if user has permission (helper function, not middleware)
 * @param {Object} user - User object
 * @param {string} permission - Required permission
 * @returns {boolean} - True if user has permission
 */
function hasPermission(user, permission) {
  if (!user || !user.roles) {
    return false;
  }

  return user.roles.some(role => {
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
}

/**
 * Check if user has role (helper function, not middleware)
 * @param {Object} user - User object
 * @param {string} roleKey - Required role key
 * @param {string} scopeType - Optional scope type
 * @param {number} scopeId - Optional scope ID
 * @returns {boolean} - True if user has role
 */
function hasRole(user, roleKey, scopeType = null, scopeId = null) {
  if (!user || !user.roles) {
    return false;
  }

  return user.roles.some(role => {
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
}

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  hasPermission,
  hasRole
};

