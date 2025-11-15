# How to Seed Data on Staging/Production Server

Since the database is on the remote server, you need to run the seed script on the server itself.

## Option 1: Using the Helper Script (Recommended)

### For Staging:
```bash
cd backend
./run_seed_on_server.sh staging
```

### For Production:
```bash
cd backend
./run_seed_on_server.sh production
```

## Option 2: Manual SSH Connection

### For Staging:
```bash
# SSH into staging server
ssh -i ~/.ssh/github_actions_capsulepodhotel capsulepodhotel-staging@45.76.60.99

# Navigate to backend directory
cd ~/htdocs/staging.capsulepodhotel.com/backend

# Verify properties exist
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.property.findMany().then(p => { console.log('Properties:', p.length); p.forEach(prop => console.log(' -', prop.name)); prisma.\$disconnect(); });"

# Run seed script
node seed_master.js
```

### For Production:
```bash
# SSH into production server
ssh -i ~/.ssh/github_actions_capsulepodhotel capsulepodhotel@45.76.60.99

# Navigate to backend directory
cd ~/htdocs/capsulepodhotel.com/backend

# Verify properties exist
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.property.findMany().then(p => { console.log('Properties:', p.length); p.forEach(prop => console.log(' -', prop.name)); prisma.\$disconnect(); });"

# Run seed script
node seed_master.js
```

## Prerequisites

1. **Properties must exist**: The seed script requires properties to be created first.
   - If properties don't exist, run: `node seed_properties.js` first
   - Or run: `node prisma/seed.js` which includes property seeding

2. **Database connection**: The `DATABASE_URL` environment variable must be set on the server.
   - This should already be configured in the server's `.env` file

3. **Node.js and dependencies**: 
   - Node.js must be installed
   - Dependencies must be installed: `npm install`

## What Gets Created

- **100 loyalty users** with Indian names, phones, emails
- **1,500 bookings** across 12 months
- **800 communication conversations** (emails, WhatsApp, SMS, calls)
- **Payments, room assignments, audit logs, loyalty points**, etc.

## Expected Runtime

- **Time**: 5-10 minutes
- **Progress**: Shows progress every 100-150 records
- **Output**: Detailed summary at the end

## Troubleshooting

### "No properties found"
```bash
# Run property seed first
node seed_properties.js
```

### "Can't reach database server"
- Check that database is running on the server
- Verify `DATABASE_URL` is set correctly in `.env`
- Check database connection: `psql $DATABASE_URL`

### "Module not found"
```bash
# Install dependencies
npm install
```

### "Permission denied"
```bash
# Make script executable
chmod +x run_seed_on_server.sh
```

## Verification

After seeding, verify the data:

```bash
# Check bookings count
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.booking.count().then(c => { console.log('Bookings:', c); prisma.\$disconnect(); });"

# Check loyalty users
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.loyaltyAccount.count().then(c => { console.log('Loyalty Users:', c); prisma.\$disconnect(); });"

# Check communications
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); Promise.all([prisma.thread.count(), prisma.messageLog.count(), prisma.callLog.count()]).then(([t, m, c]) => { console.log('Threads:', t, 'Messages:', m, 'Calls:', c); prisma.\$disconnect(); });"
```

## Next Steps

After seeding:
1. Visit the admin dashboard: https://staging.capsulepodhotel.com/admin
2. Check bookings: https://staging.capsulepodhotel.com/admin/bookings
3. Check communication hub: https://staging.capsulepodhotel.com/admin/communication-hub
4. Verify loyalty members in the admin dashboard

