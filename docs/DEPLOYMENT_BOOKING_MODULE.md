# Booking Module Deployment Guide

## Overview

This guide outlines the deployment process for the booking module redesign to the staging server (main branch).

---

## 🎯 Pre-Deployment Checklist

### 1. Database Migration ✅
- [ ] Run Prisma migration for booking module schema changes
- [ ] Seed cancellation policies
- [ ] Backfill confirmation numbers (if needed)
- [ ] Verify database schema matches Prisma schema

### 2. Backend Dependencies ✅
- [ ] Verify all npm packages are installed
- [ ] Check for any missing dependencies
- [ ] Verify environment variables are set
- [ ] Test server starts without errors

### 3. Frontend Dependencies ✅
- [ ] Verify all npm packages are installed
- [ ] Check for any missing dependencies
- [ ] Verify environment variables are set
- [ ] Test frontend builds without errors

### 4. Environment Variables ✅
- [ ] Verify `DATABASE_URL` is set
- [ ] Verify `GUEST_TOKEN_SECRET` is set
- [ ] Verify `FRONTEND_URL` is set
- [ ] Verify `NODE_ENV` is set
- [ ] Verify `PORT` is set

### 5. Code Quality ✅
- [ ] No linter errors
- [ ] All TypeScript types are correct
- [ ] All imports are resolved
- [ ] All API endpoints are defined

---

## 📋 Deployment Steps

### Step 1: Commit Changes to Production Branch

```bash
# Ensure you're on production branch
git checkout production

# Add all new files
git add .

# Commit with descriptive message
git commit -m "feat: Complete booking module redesign - Phase 1, 2, and 3

- Phase 1: Database schema enhancements (Booking, Stay, BookingGuest, CancellationPolicy, BookingAuditLog, RoomAssignment)
- Phase 2: Backend API enhancements (booking management, guest self-service, cancellation policies, payments)
- Phase 3: UI implementation (booking list, detail view, action modals, payment modals, guest self-service)
- Added authentication and RBAC middleware
- Added payment routes and modals
- Added guest self-service pages
- Complete TypeScript types and API client library

BREAKING CHANGE: Database schema changes require migration
- Run: npx prisma migrate deploy
- Run: node backend/prisma/seed_cancellation_policies.js
- Run: node backend/scripts/backfill_booking_confirmation_numbers.js (if needed)"

# Push to production branch
git push origin production
```

### Step 2: Merge to Main Branch (Staging)

```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Merge production into main
git merge production

# Resolve any conflicts (if any)
# Then push to main
git push origin main
```

### Step 3: Deploy to Staging Server

```bash
# SSH into staging server
ssh capsulepodhotel-staging@45.76.60.99

# Navigate to staging directory
cd ~/htdocs/staging.capsulepodhotel.com

# Pull latest changes from main
git pull origin main

# Backend setup
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
node prisma/seed_cancellation_policies.js

# Restart backend
pm2 restart staging-backend

# Frontend setup
cd ../frontend
npm install
npm run build

# Restart frontend
pm2 restart staging-frontend

# Verify deployment
pm2 status
```

### Step 4: Verify Deployment

```bash
# Check backend health
curl http://localhost:4001/api/health

# Check booking endpoints
curl http://localhost:4001/api/bookings

# Check frontend
curl http://localhost:3001
```

### Step 5: Test Staging

1. **Backend API Tests**:
   - [ ] Health check: `GET /api/health`
   - [ ] Bookings list: `GET /api/bookings`
   - [ ] Booking detail: `GET /api/bookings/:id`
   - [ ] Create booking: `POST /api/bookings`
   - [ ] Update booking: `PUT /api/bookings/:id`
   - [ ] Check-in: `POST /api/bookings/:id/check-in`
   - [ ] Check-out: `POST /api/bookings/:id/check-out`
   - [ ] Cancel booking: `POST /api/bookings/:id/cancel`
   - [ ] Guest booking: `GET /api/guest/bookings/:token`
   - [ ] Payment: `POST /api/payments`
   - [ ] Refund: `POST /api/payments/:id/refund`

2. **Frontend UI Tests**:
   - [ ] Booking list page loads
   - [ ] Booking filters work
   - [ ] Booking detail page loads
   - [ ] Action modals work (Modify, Check-in, Check-out, Cancel)
   - [ ] Payment modals work (Charge Card, Record Cash, Issue Refund)
   - [ ] Timeline component displays
   - [ ] Payments component displays
   - [ ] Notes component displays
   - [ ] Guest self-service page loads
   - [ ] Guest modification form works
   - [ ] Guest cancellation form works

3. **Database Tests**:
   - [ ] Bookings table has all new columns
   - [ ] Cancellation policies are seeded
   - [ ] Confirmation numbers are generated
   - [ ] Audit logs are created
   - [ ] Payments are recorded
   - [ ] Stays are created
   - [ ] Guests are created

---

## 🔧 Environment Variables

### Backend `.env` (Staging)

```env
NODE_ENV=staging
PORT=4001
DATABASE_URL="postgresql://user:password@localhost:5432/database"
FRONTEND_URL="http://localhost:3001"
GUEST_TOKEN_SECRET="your-secret-key-here-change-in-staging"
POSTMARK_SERVER_TOKEN="your-postmark-token"
POSTMARK_WEBHOOK_SECRET="your-webhook-secret"
EMAIL_FROM="noreply@capsulepodhotel.com"
MAIL_FROM="noreply@capsulepodhotel.com"
```

### Frontend `.env.local` (Staging)

```env
NEXT_PUBLIC_API_URL="http://localhost:4001/api"
NODE_ENV=staging
```

---

## 🚨 Troubleshooting

### Database Migration Issues

```bash
# If migration fails, check Prisma schema
cd backend
npx prisma validate

# If schema is invalid, fix and regenerate
npx prisma format
npx prisma generate

# If migration is stuck, reset (CAUTION: loses data)
npx prisma migrate reset

# Or manually apply migration
psql -d database -f prisma/migrations/YYYYMMDDHHMMSS_booking_module_phase1/migration.sql
```

### Backend Startup Issues

```bash
# Check server logs
pm2 logs staging-backend

# Check for missing dependencies
cd backend
npm install

# Check for environment variables
cat .env

# Test server manually
node server.js
```

### Frontend Build Issues

```bash
# Check build logs
npm run build

# Check for missing dependencies
cd frontend
npm install

# Check for TypeScript errors
npx tsc --noEmit

# Check for environment variables
cat .env.local
```

### API Endpoint Issues

```bash
# Check authentication
curl -v http://localhost:4001/api/bookings

# Check RBAC permissions
curl -v -H "Authorization: Bearer token" http://localhost:4001/api/bookings

# Check CORS
curl -v -H "Origin: http://localhost:3001" http://localhost:4001/api/bookings
```

---

## 📊 Post-Deployment Verification

### 1. Backend Health Check

```bash
curl http://localhost:4001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-12T23:00:00.000Z",
  "uptime": 3600,
  "environment": "staging"
}
```

### 2. Booking API Check

```bash
curl http://localhost:4001/api/bookings
```

Expected response:
```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

### 3. Frontend Health Check

```bash
curl http://localhost:3001
```

Expected: HTML page loads

### 4. Database Check

```bash
# Connect to database
psql -d database

# Check bookings table
SELECT COUNT(*) FROM bookings;

# Check cancellation policies
SELECT COUNT(*) FROM cancellation_policies;

# Check payments
SELECT COUNT(*) FROM payments;
```

---

## 🎯 Testing Checklist

### Backend API Tests

- [ ] `GET /api/health` - Returns 200
- [ ] `GET /api/bookings` - Returns 200 with bookings
- [ ] `GET /api/bookings/:id` - Returns 200 with booking details
- [ ] `POST /api/bookings` - Creates booking successfully
- [ ] `PUT /api/bookings/:id` - Updates booking successfully
- [ ] `POST /api/bookings/:id/check-in` - Checks in booking successfully
- [ ] `POST /api/bookings/:id/check-out` - Checks out booking successfully
- [ ] `POST /api/bookings/:id/cancel` - Cancels booking successfully
- [ ] `GET /api/guest/bookings/:token` - Returns 200 with booking
- [ ] `POST /api/payments` - Creates payment successfully
- [ ] `POST /api/payments/:id/refund` - Issues refund successfully

### Frontend UI Tests

- [ ] Booking list page loads and displays bookings
- [ ] Booking filters work (status, source, date range, search)
- [ ] Booking detail page loads and displays all tabs
- [ ] Action modals open and work (Modify, Check-in, Check-out, Cancel)
- [ ] Payment modals open and work (Charge Card, Record Cash, Issue Refund)
- [ ] Timeline component displays audit logs and payments
- [ ] Payments component displays payment history
- [ ] Notes component displays and edits notes
- [ ] Guest self-service page loads with token
- [ ] Guest modification form works
- [ ] Guest cancellation form works

### Database Tests

- [ ] Bookings table has all new columns
- [ ] Cancellation policies are seeded
- [ ] Confirmation numbers are generated for new bookings
- [ ] Audit logs are created for all actions
- [ ] Payments are recorded correctly
- [ ] Stays are created for bookings
- [ ] Guests are created for bookings

---

## 🔄 Rollback Plan

If deployment fails:

```bash
# Rollback to previous commit
git checkout main
git reset --hard HEAD~1
git push origin main --force

# Restart services
pm2 restart staging-backend
pm2 restart staging-frontend

# Verify rollback
curl http://localhost:4001/api/health
```

---

## 📝 Notes

- **Database Migration**: Always run migrations before deploying code
- **Environment Variables**: Ensure all environment variables are set
- **Dependencies**: Always run `npm install` after pulling changes
- **PM2**: Always restart PM2 processes after deployment
- **Testing**: Always test staging before production

---

## 🚀 Next Steps

After successful staging deployment:

1. Test all features thoroughly
2. Verify all API endpoints work
3. Verify all UI components work
4. Check database integrity
5. Monitor logs for errors
6. Deploy to production (if staging tests pass)

---

**Status**: ✅ Ready for Deployment

**Last Updated**: 2024-11-12

