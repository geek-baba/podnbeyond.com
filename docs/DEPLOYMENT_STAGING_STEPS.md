# Deployment to Staging - Step by Step

## ✅ Code Pushed to Main Branch

The booking module redesign has been successfully committed and pushed to the `main` branch (staging).

---

## 🚀 Next Steps: Deploy to Staging Server

### Step 1: SSH into Staging Server

```bash
ssh capsulepodhotel-staging@45.76.60.99
```

### Step 2: Navigate to Staging Directory

```bash
cd ~/htdocs/staging.capsulepodhotel.com
```

### Step 3: Pull Latest Changes

```bash
git pull origin main
```

### Step 4: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migration
npx prisma migrate deploy

# Seed cancellation policies
node prisma/seed_cancellation_policies.js

# (Optional) Backfill confirmation numbers for existing bookings
node scripts/backfill_booking_confirmation_numbers.js

# Restart backend
pm2 restart staging-backend
```

### Step 5: Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Build frontend
npm run build

# Restart frontend
pm2 restart staging-frontend
```

### Step 6: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check backend health
curl http://localhost:4001/api/health

# Check booking endpoints
curl http://localhost:4001/api/bookings

# Check frontend
curl http://localhost:3001
```

### Step 7: Test Staging

1. **Visit Staging URL**: https://staging.capsulepodhotel.com
2. **Login**: Use admin credentials
3. **Test Booking List**: Navigate to `/admin/bookings`
4. **Test Booking Detail**: Click on a booking
5. **Test Action Modals**: Try Modify, Check-in, Check-out, Cancel
6. **Test Payment Modals**: Try Charge Card, Record Cash, Issue Refund
7. **Test Guest Self-Service**: Generate a guest token and test guest pages

---

## 🔧 Environment Variables

### Backend `.env` (Staging)

Ensure these are set:

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

Ensure these are set:

```env
NEXT_PUBLIC_API_URL="http://localhost:4001/api"
NODE_ENV=staging
```

---

## 🧪 Testing Checklist

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

## 🚨 Troubleshooting

### Database Migration Issues

```bash
# Check Prisma schema
cd backend
npx prisma validate

# If schema is invalid, fix and regenerate
npx prisma format
npx prisma generate

# If migration fails, check migration SQL
cat prisma/migrations/20251112220044_booking_module_phase1/migration.sql

# Manually apply migration if needed
psql -d database -f prisma/migrations/20251112220044_booking_module_phase1/migration.sql
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

## 🎯 Next Steps After Staging

After successful staging deployment and testing:

1. Test all features thoroughly
2. Verify all API endpoints work
3. Verify all UI components work
4. Check database integrity
5. Monitor logs for errors
6. Deploy to production (if staging tests pass)

---

**Status**: ✅ Ready for Staging Deployment

**Last Updated**: 2024-11-12

