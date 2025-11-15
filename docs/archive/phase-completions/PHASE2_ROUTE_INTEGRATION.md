# Phase 2 Route Integration Guide

## Overview

This guide explains how to integrate the Phase 2 booking routes into your Express server.

## Route Files Created

1. `backend/routes/booking.js` - Booking management routes
2. `backend/routes/guest.js` - Guest self-service routes
3. `backend/routes/cancellationPolicy.js` - Cancellation policy routes

## Integration Steps

### 1. Create or Update Server File

If you don't have a server file, create `backend/server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// Middleware
app.use(cors());
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

### 2. Update Package.json

Ensure your `backend/package.json` includes:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.0.0",
    "cors": "^2.8.5",
    "cookie-parser": "^1.4.6"
  }
}
```

### 3. Environment Variables

Add to `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Guest Token Secret (for guest self-service)
GUEST_TOKEN_SECRET="your-secret-key-here-change-in-production"

# Other existing environment variables
PORT=4000
NODE_ENV=development
```

### 4. RBAC Integration

The routes currently use placeholder RBAC middleware. To integrate proper RBAC:

1. **Create or update `backend/lib/rbac.js`** with `requirePermission` middleware
2. **Replace placeholder middleware** in routes with actual RBAC middleware
3. **Ensure user authentication** is properly handled
4. **Test RBAC permissions** for each endpoint

Example RBAC middleware:

```javascript
// backend/lib/rbac.js
const { authorize } = require('./rbac');

function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      // Get user from request (set by auth middleware)
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Extract scope from request
      const propertyId = req.body.propertyId || req.query.propertyId || req.params.propertyId;
      const scopeType = propertyId ? 'PROPERTY' : 'ORG';
      const scopeId = propertyId ? parseInt(propertyId, 10) : null;

      // Authorize
      const authorized = await authorize(user, permission, {
        scopeType,
        scopeId
      });

      if (!authorized) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: permission,
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

module.exports = { requirePermission };
```

### 5. Authentication Integration

The routes currently use placeholder authentication. To integrate proper authentication:

1. **Create authentication middleware** that extracts user from session/JWT
2. **Set `req.user`** with user information
3. **Integrate with existing authentication system**
4. **Test authentication** for each endpoint

Example authentication middleware:

```javascript
// backend/middleware/auth.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function authenticate(req, res, next) {
  try {
    // Get session token from cookie or header
    const sessionToken = req.cookies['session-token'] || 
                        req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Verify session token (implement your session verification logic)
    // For example, using NextAuth session:
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

### 6. Update Routes to Use Authentication

Update routes to use authentication middleware:

```javascript
// In routes/booking.js
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Or apply to specific routes
router.get('/bookings', authenticate, requirePermission('bookings:read:scoped'), async (req, res) => {
  // ...
});
```

## API Endpoints

### Booking Management (Staff)
- `GET /api/bookings` - List bookings with filters
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Modify booking
- `POST /api/bookings/:id/check-in` - Check-in booking
- `POST /api/bookings/:id/check-out` - Check-out booking
- `POST /api/bookings/:id/no-show` - Mark as no-show
- `POST /api/bookings/:id/reject` - Reject booking
- `POST /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/:id/audit-log` - Get audit log
- `POST /api/bookings/:id/calculate-cancellation-fee` - Calculate cancellation fee

### Guest Self-Service (Public)
- `GET /api/guest/bookings` - Get guest's bookings
- `GET /api/guest/bookings/:token` - Get booking by token
- `PUT /api/guest/bookings/:token` - Modify booking
- `POST /api/guest/bookings/:token/cancel` - Cancel booking
- `POST /api/guest/bookings/:token/request-modification` - Request modification

### Cancellation Policy (Staff)
- `GET /api/cancellation-policies` - List policies
- `GET /api/cancellation-policies/:id` - Get policy
- `POST /api/cancellation-policies` - Create policy
- `PUT /api/cancellation-policies/:id` - Update policy
- `DELETE /api/cancellation-policies/:id` - Delete policy

## Testing

### 1. Test Booking Creation
```bash
curl -X POST http://localhost:4000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": 1,
    "roomTypeId": 1,
    "checkIn": "2024-12-01",
    "checkOut": "2024-12-03",
    "guestName": "Test Guest",
    "email": "test@example.com",
    "phone": "1234567890",
    "source": "WALK_IN"
  }'
```

### 2. Test Booking List
```bash
curl http://localhost:4000/api/bookings?status=CONFIRMED&page=1&limit=10
```

### 3. Test Guest Self-Service
```bash
curl http://localhost:4000/api/guest/bookings?email=test@example.com
```

### 4. Test Cancellation Policy
```bash
curl http://localhost:4000/api/cancellation-policies
```

## Known Issues

### 1. Transaction Handling
- **Issue**: Service functions use their own Prisma client instead of transaction client
- **Impact**: Transactions may not be fully atomic
- **Workaround**: Service functions work correctly but may cause issues in edge cases
- **TODO**: Update service functions to accept transaction client as parameter

### 2. RBAC Integration
- **Issue**: Placeholder RBAC middleware in routes
- **Impact**: Routes are not secured (security concern)
- **TODO**: Implement proper RBAC middleware
- **Priority**: High

### 3. Authentication
- **Issue**: Placeholder authentication middleware
- **Impact**: Routes are not authenticated (security concern)
- **TODO**: Implement proper authentication middleware
- **Priority**: High

### 4. Inventory Release
- **Issue**: Inventory release logic not implemented in cancel/reject endpoints
- **Impact**: Inventory may not be released correctly
- **TODO**: Implement inventory release logic
- **Priority**: Medium

### 5. Refund Processing
- **Issue**: Refund processing via Razorpay not implemented
- **Impact**: Refunds are not processed automatically
- **TODO**: Implement Razorpay refund API integration
- **Priority**: Medium

## Next Steps

1. **Integrate routes into server** - Add routes to server.js/app.js
2. **Implement RBAC middleware** - Replace placeholder middleware
3. **Implement authentication** - Replace placeholder authentication
4. **Test all endpoints** - Verify functionality
5. **Fix transaction handling** - Update service functions
6. **Implement inventory release** - Add inventory release logic
7. **Implement Razorpay refunds** - Add refund processing

## Conclusion

The Phase 2 routes are ready for integration. The main remaining tasks are:
1. Integrating routes into the server
2. Implementing proper RBAC middleware
3. Implementing proper authentication middleware
4. Testing all endpoints
5. Fixing known issues

---

**Status**: ✅ Routes Created  
**Next Step**: Integrate routes into server and implement RBAC/authentication

