import { useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Permission checking hook
 * Checks if user has required permissions based on their roles
 * 
 * Phase 11: Uses hardcoded role-to-permission mapping based on RBAC docs
 * Phase 12: Can be extended to use DB-backed role config
 */
export function usePermissions() {
  const { data: session } = useAuth();
  const user = session?.user;

  // Role-to-permission mapping based on docs/architecture/rbac.md
  const rolePermissions: Record<string, string[]> = {
    SUPERADMIN: ['*'], // Wildcard - all permissions
    ADMIN: [
      'properties:*',
      'brands:*',
      'bookings:*',
      'inventory:*',
      'rooms:*',
      'pricing:*',
      'ota:configure',
      'payments:configure',
      'cms:*',
      'users:invite',
      'users:read',
      'loyalty:adjust',
      'settings:update',
      'integrations:read:*',
      'admin:read:system',
    ],
    MANAGER: [
      'bookings:*:scoped',
      'inventory:*:scoped',
      'rooms:*:scoped',
      'pricing:*:scoped',
      'staff:read:scoped',
      'staff:invite:scoped',
      'refunds:write:scoped',
      'comps:write:scoped',
      'reports:read:scoped',
      'analytics:read:scoped',
      'bookings:read:scoped',
      'bookings:write:scoped',
      'checkin:write:scoped',
      'checkout:write:scoped',
      'guests:read:scoped',
      'rooms:read:scoped',
      'inventory:read:scoped',
      'inventory:update:scoped',
      'rooms:update:scoped',
      'pricing:read:scoped',
      'pricing:update:scoped',
      'maintenance:write:scoped',
    ],
    STAFF_FRONTDESK: [
      'bookings:read:scoped',
      'bookings:write:scoped',
      'checkin:write:scoped',
      'checkout:write:scoped',
      'guests:read:scoped',
      'rooms:read:scoped',
      'inventory:read:scoped',
    ],
    STAFF_OPS: [
      'inventory:read:scoped',
      'inventory:update:scoped',
      'rooms:read:scoped',
      'rooms:update:scoped',
      'pricing:read:scoped',
      'pricing:update:scoped',
      'maintenance:write:scoped',
    ],
    MEMBER: [
      'bookings:read:own',
      'loyalty:read:own',
      'profile:read:own',
      'profile:update:own',
    ],
  };

  // Additional permissions for communication hub and loyalty
  // These are inferred from the widget requirements
  const additionalPermissions: Record<string, string[]> = {
    SUPERADMIN: ['commhub:*', 'loyalty:*'],
    ADMIN: ['commhub:*', 'loyalty:*'],
    MANAGER: ['commhub:read:scoped', 'loyalty:read:scoped'],
    STAFF_FRONTDESK: ['commhub:read:scoped'],
  };

  // Get all permissions for user's roles
  const userPermissions = useMemo(() => {
    if (!user?.roles) return [];

    const permissions = new Set<string>();

    user.roles.forEach((role) => {
      const roleKey = role.key;
      const basePerms = rolePermissions[roleKey] || [];
      const additionalPerms = additionalPermissions[roleKey] || [];

      basePerms.forEach((p) => permissions.add(p));
      additionalPerms.forEach((p) => permissions.add(p));
    });

    return Array.from(permissions);
  }, [user]);

  /**
   * Check if user has a specific permission
   * Implements the same logic as backend hasPermission
   */
  const hasPermission = (permission: string): boolean => {
    if (!userPermissions.length) return false;

    return userPermissions.some((userPerm) => {
      // Check for wildcard permission (all permissions)
      if (userPerm === '*') {
        return true;
      }

      // Check for exact permission match
      if (userPerm === permission) {
        return true;
      }

      // Check for wildcard permission (e.g., bookings:*:scoped)
      const [resource, action, scope] = permission.split(':');
      if (resource && action && scope) {
        const wildcardPermission = `${resource}:*:${scope}`;
        if (userPerm === wildcardPermission) {
          return true;
        }
      }

      // Check for global permission if scoped (e.g., bookings:read:global)
      if (scope === 'scoped') {
        const globalPermission = `${resource}:${action}:global`;
        if (userPerm === globalPermission) {
          return true;
        }
      }

      // Check for resource wildcard (e.g., bookings:*)
      if (userPerm === `${resource}:*`) {
        return true;
      }

      return false;
    });
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every((p) => hasPermission(p));
  };

  return {
    user,
    permissions: userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

