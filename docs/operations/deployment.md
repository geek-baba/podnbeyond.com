# Deployment Guide

**Last Updated:** 2025-01-21  
**Status:** ✅ **Current Process**

---

## Overview

This guide covers manual deployment to staging and production environments using Git-based deployment with PM2 process management.

---

## Prerequisites

### Before You Start

1. **Rotate Postmark Token** (CRITICAL - 5 mins)
   - Go to: https://account.postmarkapp.com/servers
   - Click your server → **API Tokens** → **Generate New Token**
   - **Save the new token** - you'll need it in deployment

2. **Backup Production Database** (CRITICAL - 2 mins)
   ```bash
   ssh capsulepodhotel@45.76.60.99
   pg_dump -h localhost -U podnbeyond_user podnbeyond_hotel > ~/backup_$(date +%Y%m%d_%H%M%S).sql
   ```

---

## Staging Deployment

### Step 1: Access Staging User

```bash
ssh capsulepodhotel-staging@45.76.60.99
# Enter password from CloudPanel
```

### Step 2: Set Up Node.js Environment

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22
nvm alias default 22
```

### Step 3: Clone Repository

```bash
cd htdocs/staging.capsulepodhotel.com
git clone https://github.com/geek-baba/podnbeyond.com.git .
git checkout main
git pull origin main
```

### Step 4: Configure Backend

```bash
cd backend

# Create .env
cat > .env << 'ENV'
DATABASE_URL="postgresql://podnbeyond_staging:password@localhost:5432/podnbeyond_staging"
POSTMARK_SERVER_TOKEN="your-new-token"
EMAIL_FROM="staging@capsulepodhotel.com"
FRONTEND_URL="https://staging.capsulepodhotel.com"
RAZORPAY_KEY_ID="rzp_test_placeholder123456"
RAZORPAY_KEY_SECRET="placeholder_secret"
PORT=4001
NODE_ENV=production
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"
QUEUE_PREFIX="staging"
ENV

# Install dependencies
npm install
npx prisma generate
npx prisma migrate deploy
```

### Step 5: Configure Frontend

```bash
cd ../frontend

# Create .env.local
cat > .env.local << 'ENV'
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_placeholder123456"
ENV

# Install & build
npm install
npm run build
```

### Step 6: Start Services

```bash
cd ~/htdocs/staging.capsulepodhotel.com

# Start backend
cd backend
pm2 start server.js --name staging-backend

# Start frontend
cd ../frontend
PORT=3001 pm2 start npm --name staging-frontend -- start

# Save PM2 config
pm2 save
```

### Step 7: Verify Staging

```bash
# Test backend
curl http://localhost:4001/api/health

# Test frontend
curl -I http://localhost:3001
```

---

## Production Deployment

### Step 1: Install Redis (If Not Installed)

```bash
ssh capsulepodhotel@45.76.60.99
sudo apt update
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
redis-cli ping  # Should return: PONG
```

### Step 2: Clean & Clone

```bash
cd /home/capsulepodhotel/htdocs/capsulepodhotel.com
rm -rf * .[^.]*
git clone https://github.com/geek-baba/podnbeyond.com.git .
git checkout main
git pull origin main
```

### Step 3: Configure Backend

```bash
cd backend

# Create .env
cat > .env << 'ENV'
DATABASE_URL="postgresql://podnbeyond_user:password@localhost:5432/podnbeyond_hotel"
POSTMARK_SERVER_TOKEN="your-new-token"
EMAIL_FROM="support@capsulepodhotel.com"
FRONTEND_URL="https://capsulepodhotel.com"
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your_live_secret"
PORT=4000
NODE_ENV=production
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"
QUEUE_PREFIX="production"
ENV

# Install dependencies
npm install
npx prisma generate
npx prisma migrate deploy
```

### Step 4: Configure Frontend

```bash
cd ../frontend

# Create .env.local
cat > .env.local << 'ENV'
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxx"
ENV

# Install & build
npm install
npm run build
```

### Step 5: Start Services

```bash
cd ~/htdocs/capsulepodhotel.com

# Start backend
cd backend
pm2 start server.js --name hotel-booking-backend

# Start frontend
cd ../frontend
pm2 start npm --name hotel-booking-frontend -- start

# Save PM2 config
pm2 save

# Enable PM2 startup on reboot
pm2 startup
# Follow the command it outputs
```

### Step 6: Verify Production

```bash
# Test backend
curl http://localhost:4000/api/health

# Test frontend
curl -I http://localhost:3000

# Test from outside
curl -I https://capsulepodhotel.com
```

---

## Future Deployment Workflow

### Development Cycle

```
1. Code changes on local Mac
   ↓ git push origin main
   
2. Deploy to Staging
   - SSH to staging user
   - cd ~/htdocs/staging.capsulepodhotel.com
   - git pull origin main
   - npm install (if deps changed)
   - npm run build (frontend)
   - pm2 restart staging-backend staging-frontend
   
3. Test on Staging
   - Test all features
   - Verify OTP works
   - Check for errors
   
4. Deploy to Production
   - SSH to production user
   - cd ~/htdocs/capsulepodhotel.com
   - git pull origin main
   - npm install (if deps changed)
   - npm run build (frontend)
   - pm2 restart hotel-booking-backend hotel-booking-frontend
   
5. Verify Production
   - Quick smoke test
   - Done!
```

---

## PM2 Commands

### Staging

```bash
# SSH
ssh capsulepodhotel-staging@45.76.60.99

# PM2 commands
pm2 list                    # List processes
pm2 logs staging-backend    # View backend logs
pm2 logs staging-frontend  # View frontend logs
pm2 restart staging-backend staging-frontend  # Restart both
pm2 stop staging-backend staging-frontend     # Stop both
pm2 delete staging-backend staging-frontend  # Delete both
```

### Production

```bash
# SSH
ssh capsulepodhotel@45.76.60.99

# PM2 commands
pm2 list                              # List processes
pm2 logs hotel-booking-backend        # View backend logs
pm2 logs hotel-booking-frontend       # View frontend logs
pm2 restart hotel-booking-backend hotel-booking-frontend  # Restart both
pm2 stop hotel-booking-backend hotel-booking-frontend     # Stop both
pm2 delete hotel-booking-backend hotel-booking-frontend  # Delete both
```

---

## Environment Variables

### Staging Backend (.env)

```env
DATABASE_URL="postgresql://podnbeyond_staging:password@localhost:5432/podnbeyond_staging"
POSTMARK_SERVER_TOKEN="your-new-token"
EMAIL_FROM="staging@capsulepodhotel.com"
FRONTEND_URL="https://staging.capsulepodhotel.com"
RAZORPAY_KEY_ID="rzp_test_placeholder123456"
RAZORPAY_KEY_SECRET="placeholder_secret"
PORT=4001
NODE_ENV=production
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"
QUEUE_PREFIX="staging"
```

### Production Backend (.env)

```env
DATABASE_URL="postgresql://podnbeyond_user:password@localhost:5432/podnbeyond_hotel"
POSTMARK_SERVER_TOKEN="your-new-token"
EMAIL_FROM="support@capsulepodhotel.com"
FRONTEND_URL="https://capsulepodhotel.com"
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your_live_secret"
PORT=4000
NODE_ENV=production
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"
QUEUE_PREFIX="production"
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_placeholder123456"  # or rzp_live_xxx for production
# NO NEXT_PUBLIC_API_URL (uses Next.js rewrites)
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
pm2 logs staging-backend --lines 50

# Check if port is in use
ss -tlnp | grep 4001  # or 4000 for production

# Restart
pm2 restart staging-backend
```

### Frontend Not Starting

```bash
# Check logs
pm2 logs staging-frontend --lines 50

# Check if port is in use
ss -tlnp | grep 3001  # or 3000 for production

# Restart
pm2 restart staging-frontend
```

### Database Connection Issues

```bash
# Test database connection
psql -h localhost -U podnbeyond_user -d podnbeyond_hotel

# Check DATABASE_URL in .env
cat backend/.env | grep DATABASE_URL
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping  # Should return: PONG

# Check Redis status
sudo systemctl status redis-server

# Check REDIS_ENABLED in .env
cat backend/.env | grep REDIS_ENABLED
```

---

## Related Documentation

- [Production Readiness Checklist](./production-readiness.md) - Pre-launch checklist
- [Environment Variables](./environment-variables.md) - Complete env vars reference
- [Seed Data Guide](./seed-data.md) - Database seeding

---

**Code Locations:**
- PM2 Config: `ecosystem.config.js` (if exists)
- Environment Examples: `backend/env.example`, `frontend/env.local.example`
- Deployment Scripts: `scripts/` (if exists)

