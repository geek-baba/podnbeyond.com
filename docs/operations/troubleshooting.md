# Admin Login Fix - Route Registration Issue

## Problem
Admin login was failing with "Authentication required" error when trying to send OTP code.

## Root Cause
1. **Missing Routes**: OTP and auth routes were created but NOT registered in `server.js`
2. **Route Order**: Protected routes were registered before public routes, potentially causing route conflicts
3. **Cookie Name Mismatch**: Auth middleware was checking for `session-token` but OTP route sets `pod-session` cookie

## Fixes Applied

### 1. Register OTP and Auth Routes
**File**: `backend/server.js`

**Before**:
```javascript
// Routes
const bookingRoutes = require('./routes/booking');
const guestRoutes = require('./routes/guest');
// ... other routes

app.use('/api', bookingRoutes);
app.use('/api', guestRoutes);
// ... OTP and auth routes were missing!
```

**After**:
```javascript
// Routes - Register public routes first (OTP, Auth) before protected routes
const otpRoutes = require('./routes/otp');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');
// ... other routes

// Public routes (no authentication required)
app.use('/api/otp', otpRoutes);
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api', bookingRoutes);
// ... other protected routes
```

### 2. Update Auth Middleware to Check `pod-session` Cookie
**File**: `backend/middleware/auth.js`

**Before**:
```javascript
const sessionToken = 
  req.cookies['session-token'] || 
  req.cookies['next-auth.session-token'] ||
  // ... but NOT 'pod-session'!
```

**After**:
```javascript
const sessionToken = 
  req.cookies['pod-session'] ||  // Added this
  req.cookies['session-token'] || 
  req.cookies['next-auth.session-token'] ||
  // ... other cookie names
```

### 3. Route Registration Order
- **Public routes first**: OTP and auth routes are registered before protected routes
- **Prevents conflicts**: Ensures `/api/otp/send` is matched before any protected route handlers

## Routes Now Available

### Public Routes (No Authentication)
- `POST /api/otp/send` - Send OTP code to email
- `POST /api/otp/verify` - Verify OTP and create session
- `POST /api/otp/resend` - Resend OTP code
- `GET /api/auth/session` - Get current session (requires session token)
- `POST /api/auth/signout` - Sign out and delete session

### Protected Routes (Require Authentication)
- `/api/bookings/*` - Booking management
- `/api/guest/*` - Guest self-service (public, uses tokens)
- `/api/cancellation-policies/*` - Cancellation policy management
- `/api/payments/*` - Payment management

## Testing

### 1. Test OTP Send
```bash
curl -X POST http://localhost:4000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email": "shwet@thedesi.email"}'
```

Expected response:
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "expiresIn": 600
}
```

### 2. Test OTP Verify
```bash
curl -X POST http://localhost:4000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "shwet@thedesi.email", "otp": "123456"}'
```

Expected response:
```json
{
  "success": true,
  "sessionToken": "...",
  "user": {
    "id": "...",
    "email": "shwet@thedesi.email",
    "roles": ["SUPERADMIN"]
  },
  "redirectTo": "/admin"
}
```

### 3. Test Session Check
```bash
curl http://localhost:4000/api/auth/session \
  -H "Cookie: pod-session=YOUR_SESSION_TOKEN"
```

Expected response:
```json
{
  "user": {
    "id": "...",
    "email": "shwet@thedesi.email",
    "roles": [...]
  },
  "expires": "..."
}
```

## Deployment

### Staging
1. Code has been pushed to `main` branch
2. GitHub Actions will deploy automatically
3. PM2 will restart the backend server
4. Routes will be registered correctly

### Verification Steps
1. **Check server logs**:
   ```bash
   pm2 logs staging-backend --lines 50
   ```
   Should show:
   ```
   🔐 OTP routes: /api/otp/send, /api/otp/verify
   🔑 Auth routes: /api/auth/session, /api/auth/signout
   ```

2. **Test OTP endpoint**:
   ```bash
   curl -X POST http://localhost:4001/api/otp/send \
     -H "Content-Type: application/json" \
     -d '{"email": "shwet@thedesi.email"}'
   ```

3. **Check frontend**:
   - Visit https://staging.capsulepodhotel.com/admin/login
   - Enter email: `shwet@thedesi.email`
   - Click "Send Login Code"
   - Should receive OTP email
   - Enter OTP code
   - Should redirect to admin dashboard

## Files Changed

1. `backend/server.js`
   - Added OTP routes registration
   - Added auth routes registration
   - Reordered routes (public first, protected second)
   - Updated console logs

2. `backend/middleware/auth.js`
   - Added `pod-session` cookie check
   - Updated both `authenticate` and `optionalAuthenticate` middleware

## Status

✅ **Fixed**: OTP and auth routes are now registered
✅ **Fixed**: Auth middleware checks `pod-session` cookie
✅ **Fixed**: Routes are registered in correct order
✅ **Pushed**: Changes pushed to `main` branch (staging)
⏳ **Pending**: Deployment to staging server (automatic via GitHub Actions)
⏳ **Pending**: Testing on staging server

## Next Steps

1. Wait for GitHub Actions deployment to complete
2. Verify routes are registered by checking server logs
3. Test admin login on staging server
4. If successful, proceed with production deployment

## Troubleshooting

### If login still fails:

1. **Check server logs**:
   ```bash
   pm2 logs staging-backend --lines 100
   ```
   Look for:
   - Route registration messages
   - OTP send/verify requests
   - Any error messages

2. **Check if routes are registered**:
   ```bash
   curl http://localhost:4001/api/health
   ```
   Should return: `{"status": "ok", ...}`

3. **Test OTP endpoint directly**:
   ```bash
   curl -X POST http://localhost:4001/api/otp/send \
     -H "Content-Type: application/json" \
     -d '{"email": "shwet@thedesi.email"}'
   ```
   Should return: `{"success": true, ...}`

4. **Check database**:
   ```bash
   # Connect to database
   psql -d podnbeyond_staging
   
   # Check if OTP codes are being created
   SELECT * FROM otp_codes ORDER BY "createdAt" DESC LIMIT 5;
   
   # Check if sessions are being created
   SELECT * FROM sessions ORDER BY "expires" DESC LIMIT 5;
   ```

5. **Check environment variables**:
   ```bash
   # On staging server
   cd ~/htdocs/staging.capsulepodhotel.com/backend
   cat .env | grep -E "DATABASE_URL|POSTMARK|FRONTEND_URL"
   ```

6. **Restart backend**:
   ```bash
   pm2 restart staging-backend
   pm2 logs staging-backend --lines 50
   ```

## Related Files

- `backend/server.js` - Main server file with route registration
- `backend/routes/otp.js` - OTP routes (send, verify, resend)
- `backend/routes/auth.js` - Auth routes (session, signout)
- `backend/middleware/auth.js` - Authentication middleware
- `frontend/pages/admin/login.tsx` - Admin login page
- `frontend/lib/api.ts` - API request utility

## Notes

- OTP routes are public (no authentication required)
- Auth routes are public (but require session token for /session endpoint)
- Booking routes are protected (require authentication)
- Cookie name is `pod-session` (set by OTP route, checked by auth middleware)
- Session token is stored in database and cookie
- Session expires after 30 days

