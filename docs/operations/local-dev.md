# Local Development Environment - Quick Guide

> 📝 **REFERENCE DOCUMENT**  
> This guide is for local development setup.  
> **Current workflow:** Development → Test on Staging → Deploy to Production  
> **See:** [FRESH_CLEAN_DEPLOYMENT.md](FRESH_CLEAN_DEPLOYMENT.md) for staging/production deployment  
> **See:** [STAGING_SETUP.md](STAGING_SETUP.md) for staging environment setup

---

## Current Status ✅
Your local environment is running and stable! (If you choose to use it)

- **Backend**: http://localhost:4000
- **Frontend**: http://localhost:3000
- **Database**: PostgreSQL with 3 properties, 15 rooms

## If You Need to Restart

### Option 1: Quick Restart (if servers are running)
```bash
# Kill all Node processes
killall -9 node

# Start Backend
cd /Users/shwet/github/podnbeyond.com/backend && npm start &

# Start Frontend  
cd /Users/shwet/github/podnbeyond.com/frontend && npm run dev &
```

### Option 2: Full Restart (if something is broken)
```bash
# Kill everything
killall -9 node

# Restart PostgreSQL
brew services restart postgresql@14

# Start Backend
cd /Users/shwet/github/podnbeyond.com/backend
npm start &
sleep 3

# Start Frontend
cd /Users/shwet/github/podnbeyond.com/frontend
npm run dev &
```

## What Was Fixed
- **node-cron spam**: Disabled the external booking sync cron job for local development
- This was causing thousands of log messages and making your laptop hot
- The cron service is only needed on production for syncing Booking.com reservations

## Database Commands
```bash
# Check properties
psql -U shwet -d podnbeyond -c "SELECT * FROM \"Property\";"

# Check rooms
psql -U shwet -d podnbeyond -c "SELECT * FROM \"Room\";"

# Reseed database (if needed)
cd /Users/shwet/github/podnbeyond.com/backend
npx prisma migrate reset --force --skip-seed
node seed_properties.js
```

## Important Files
- Backend server: `/Users/shwet/github/podnbeyond.com/backend/server.js`
- Frontend: `/Users/shwet/github/podnbeyond.com/frontend/pages/index.tsx`
- Database config: `/Users/shwet/github/podnbeyond.com/backend/.env`

## Notes
- The cron service is DISABLED for local development (see server.js line 45)
- This is normal and expected - cron is only needed on production
- Your local environment now runs clean without spam logs

