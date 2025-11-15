# Next Steps Recommendation - Booking Module Implementation

## Executive Summary

Based on best practices and the current state of the codebase, here's the recommended order of implementation:

1. **Wire up routes (server.js)** - Foundation for testing
2. **Implement authentication middleware** - Security foundation (depends on existing OTP/session system)
3. **Implement RBAC middleware** - Permission checking (depends on authentication)
4. **Test and verify** - Ensure everything works
5. **Start Phase 3 (UI)** - Build on verified backend

---

## Recommended Implementation Order

### ✅ Step 1: Wire Up Routes (server.js) - **START HERE**

**Priority: Critical**  
**Time Estimate: 30 minutes**  
**Dependencies: None**

**Why First:**
- Routes are created but not accessible
- Need to test endpoints before securing them
- Foundation for all subsequent work
- Quick win that enables testing

**What to Do:**
1. Create `backend/server.js` to wire up all routes
2. Register booking, guest, and cancellation policy routes
3. Add health check endpoint
4. Configure middleware (CORS, JSON parsing, cookie parser)
5. Test that routes are accessible

**Benefits:**
- Routes become testable immediately
- Can verify route structure works
- Enables API testing with tools like Postman
- Provides foundation for authentication/RBAC integration

---

### ✅ Step 2: Implement Authentication Middleware

**Priority: High**  
**Time Estimate: 1-2 hours**  
**Dependencies: Step 1 (server.js)**

**Why Second:**
- Security is critical but needs working routes first
- RBAC depends on authentication
- System already has OTP + session infrastructure
- Can reuse existing Session table and cookie system

**What to Do:**
1. Create `backend/middleware/auth.js`
2. Implement session token verification (reads from cookie/header)
3. Query Session table to validate token
4. Load user with roles and permissions
5. Set `req.user` with user context
6. Replace placeholder auth in routes

**Key Requirements:**
- Read session token from cookie (httpOnly) or Authorization header
- Verify token exists in Session table
- Check token expiration
- Load user with UserRole relationships
- Handle expired/invalid tokens gracefully
- Support both cookie and header authentication

**Benefits:**
- Secures all routes
- Enables user context for RBAC
- Reuses existing session infrastructure
- Provides foundation for permission checking

---

### ✅ Step 3: Implement RBAC Middleware

**Priority: High**  
**Time Estimate: 2-3 hours**  
**Dependencies: Step 2 (authentication)**

**Why Third:**
- Requires authenticated user context
- Provides fine-grained permission control
- System already has Role and UserRole tables
- Critical for production security

**What to Do:**
1. Create `backend/lib/rbac.js` (if doesn't exist)
2. Implement `requirePermission` middleware
3. Check user roles against required permissions
4. Support scoped permissions (property, brand, org level)
5. Handle wildcard permissions (e.g., `bookings:*:scoped`)
6. Replace placeholder RBAC in routes

**Key Requirements:**
- Check permissions from user roles
- Support scoped permissions (scopeType, scopeId)
- Handle wildcard permissions
- Support property/brand/org level scoping
- Provide clear error messages for denied access

**Benefits:**
- Fine-grained access control
- Property-level permission scoping
- Role-based authorization
- Production-ready security

---

### ✅ Step 4: Test and Verify

**Priority: High**  
**Time Estimate: 1-2 hours**  
**Dependencies: Steps 1-3**

**What to Do:**
1. Test all booking endpoints with authentication
2. Verify RBAC permissions work correctly
3. Test guest endpoints (should work without auth)
4. Test error handling (invalid tokens, expired sessions)
5. Verify session cookie handling
6. Test permission scoping

**Benefits:**
- Ensures everything works before UI development
- Catches security issues early
- Validates authentication/RBAC integration
- Provides confidence for Phase 3

---

### ✅ Step 5: Start Phase 3 (UI Implementation)

**Priority: Medium**  
**Time Estimate: Ongoing**  
**Dependencies: Steps 1-4**

**Why Last:**
- Need working, secure backend first
- UI depends on API endpoints
- Can't test UI without backend
- Better to build UI on verified foundation

**What to Do:**
1. Create booking list view (staff)
2. Create booking detail view (staff)
3. Create guest self-service pages
4. Implement booking actions (confirm, cancel, check-in, etc.)
5. Add filters and search
6. Implement audit log display

**Benefits:**
- Builds on verified backend
- Can test UI against real API
- Reduces debugging complexity
- Faster development with working API

---

## Alternative Approach (Faster UI Development)

If you want to start UI development sooner:

1. **Wire up routes (server.js)** - Still first
2. **Keep placeholder auth/RBAC** - For development only
3. **Start Phase 3 (UI)** - Build UI with placeholder auth
4. **Implement auth/RBAC** - Secure before production
5. **Test and verify** - Final security check

**Risks:**
- Security vulnerabilities during development
- May need to refactor UI if auth changes
- Not recommended for production

**Benefits:**
- Faster UI development
- Can see progress sooner
- Good for prototyping

---

## Implementation Details

### Step 1: server.js Structure

```javascript
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
const bookingRoutes = require('./routes/booking');
const guestRoutes = require('./routes/guest');
const cancellationPolicyRoutes = require('./routes/cancellationPolicy');

app.use('/api', bookingRoutes);
app.use('/api', guestRoutes);
app.use('/api', cancellationPolicyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
```

### Step 2: Authentication Middleware

```javascript
// backend/middleware/auth.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function authenticate(req, res, next) {
  try {
    // Get session token from cookie or header
    const sessionToken = req.cookies['session-token'] || 
                        req.cookies['next-auth.session-token'] ||
                        req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
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

    if (!session || session.expires < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session'
      });
    }

    // Set user on request
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      roles: session.user.userRoles.map(ur => ({
        key: ur.roleKey,
        scopeType: ur.scopeType,
        scopeId: ur.scopeId,
        permissions: ur.role.permissions
      }))
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication check failed'
    });
  }
}

module.exports = { authenticate };
```

### Step 3: RBAC Middleware

```javascript
// backend/lib/rbac.js
function requirePermission(requiredPermission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user has required permission
    const hasPermission = req.user.roles.some(role => {
      // Check for exact permission match
      if (role.permissions.includes(requiredPermission)) {
        return true;
      }

      // Check for wildcard permission (e.g., bookings:*:scoped)
      const [resource, action, scope] = requiredPermission.split(':');
      const wildcardPermission = `${resource}:*:${scope}`;
      if (role.permissions.includes(wildcardPermission)) {
        return true;
      }

      // Check for global permission (e.g., bookings:read:global)
      if (scope === 'scoped') {
        const globalPermission = `${resource}:${action}:global`;
        if (role.permissions.includes(globalPermission)) {
          return true;
        }
      }

      return false;
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
}

module.exports = { requirePermission };
```

---

## Environment Variables

Add to `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Guest Token Secret (for guest self-service)
GUEST_TOKEN_SECRET="your-secret-key-here-change-in-production"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"

# Server
PORT=4000
NODE_ENV=development
```

---

## Testing Checklist

### Step 1: Route Wiring
- [ ] Server starts without errors
- [ ] Health check endpoint works
- [ ] All routes are accessible
- [ ] CORS is configured correctly

### Step 2: Authentication
- [ ] Valid session token allows access
- [ ] Invalid session token returns 401
- [ ] Expired session token returns 401
- [ ] Missing session token returns 401
- [ ] User context is set correctly
- [ ] Roles are loaded correctly

### Step 3: RBAC
- [ ] User with permission can access endpoint
- [ ] User without permission gets 403
- [ ] Wildcard permissions work
- [ ] Scoped permissions work
- [ ] Global permissions work

### Step 4: Integration
- [ ] All booking endpoints work with auth
- [ ] Guest endpoints work without auth
- [ ] Cancellation policy endpoints work with auth
- [ ] Error handling works correctly
- [ ] Session cookie handling works

---

## Conclusion

**Recommended Order:**
1. Wire up routes (server.js) - **START HERE**
2. Implement authentication middleware
3. Implement RBAC middleware
4. Test and verify
5. Start Phase 3 (UI)

This order ensures:
- ✅ Security is implemented before production
- ✅ Backend is verified before UI development
- ✅ Dependencies are handled correctly
- ✅ Testing is possible at each step
- ✅ Best practices are followed

**Time Estimate:** 4-7 hours total for Steps 1-4

**Next Action:** Start with Step 1 (server.js) to wire up routes and enable testing.
