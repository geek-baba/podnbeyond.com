# 🚀 Fresh Clean Deployment Plan

**Goal:** Set up staging and production from scratch with proper separation.

**Your Decisions:**
- ✅ Domain: `staging.capsulepodhotel.com` (subdomain)
- ✅ Production: Wipe & redeploy fresh (clean slate)
- ✅ Database: Separate database for staging

**Total Time:** ~60 minutes

---

## ⚠️ BEFORE YOU START

### 1. Rotate Postmark Token (CRITICAL - 5 mins)
- Go to: https://account.postmarkapp.com/servers
- Click your server → **API Tokens** → **Generate New Token**
- **Save the new token** - you'll need it in Step 2
- Old token is COMPROMISED (exposed in Git)

### 2. Backup Production Database (CRITICAL - 2 mins)
```bash
ssh capsulepodhotel@45.76.60.99

# Backup database
pg_dump -h localhost -U podnbeyond_user podnbeyond_hotel > ~/backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup exists
ls -lh ~/backup*.sql

# Download to your Mac (run from your Mac terminal)
scp -i ~/.ssh/github_actions_capsulepodhotel capsulepodhotel@45.76.60.99:~/backup*.sql ~/Desktop/
```

**✅ Backup downloaded? → Proceed. Otherwise STOP and backup first!**

---

## 📋 PHASE 1: CLEANUP (10 mins)

### Stop All Current Services

```bash
ssh -i ~/.ssh/github_actions_capsulepodhotel capsulepodhotel@45.76.60.99

# Load Node environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22

# Stop all PM2 processes
pm2 delete all
pm2 save --force

# Verify ports are free
ss -tlnp | grep -E ":(3000|3001|4000|4001)"
# Should show nothing or "Permission denied"

exit
```

---

## 📋 PHASE 2: STAGING SETUP (30 mins)

### Step 1: Access Staging User

CloudPanel created user: `capsulepodhotel-staging`  
Password: From the CloudPanel form (sNwd... the one you saw)

```bash
# SSH as staging user (from your Mac)
ssh capsulepodhotel-staging@45.76.60.99
# Enter the password from CloudPanel

# You should now be in: /home/capsulepodhotel-staging/
```

### Step 2: Set Up Node.js Environment

```bash
# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node 22 (same as production)
nvm use 22
nvm alias default 22

# Verify
node --version  # Should show v22.x.x
```

### Step 3: Clone Repository

```bash
# Navigate to htdocs
cd htdocs/staging.capsulepodhotel.com

# Clone fresh from GitHub
git clone https://github.com/geek-baba/podnbeyond.com.git .

# Use main branch for staging
git checkout main
git pull origin main

# Verify
ls -la
# Should see: backend/ frontend/ docs/ etc.
```

### Step 4: Install Redis (Required for BullMQ)

```bash
# Install Redis using the provided script
cd ~/htdocs/staging.capsulepodhotel.com
chmod +x scripts/install-redis.sh
sudo bash scripts/install-redis.sh

# Or install manually:
sudo apt update
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

**Note:** Redis is required for the BullMQ email queue. The app will work without it (emails sent synchronously), but enabling Redis improves performance.

### Step 5: Create Staging Database

```bash
# Switch to postgres user (you'll need sudo)
# If you don't have sudo, ask server admin to run these:

sudo -u postgres psql << 'SQL'
-- Create staging database
CREATE DATABASE podnbeyond_staging;

-- Create staging user
CREATE USER podnbeyond_staging WITH PASSWORD 'STRONG_PASSWORD_HERE';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE podnbeyond_staging TO podnbeyond_staging;
ALTER USER podnbeyond_staging CREATEDB;

-- Verify
\l podnbeyond_staging
SQL

# Test connection
psql -h localhost -U podnbeyond_staging -d podnbeyond_staging -c "SELECT 1;"
```

**Note:** Save the database password! You'll need it in the next step.

### Step 6: Configure Backend

```bash
cd ~/htdocs/staging.capsulepodhotel.com/backend

# Create .env file
cat > .env << 'ENV'
# Database (STAGING - Separate DB)
DATABASE_URL="postgresql://podnbeyond_staging:STRONG_PASSWORD_HERE@localhost:5432/podnbeyond_staging"

# Email (Postmark) - USE YOUR NEW ROTATED TOKEN!
POSTMARK_SERVER_TOKEN="YOUR_NEW_POSTMARK_TOKEN_HERE"
POSTMARK_WEBHOOK_SECRET="staging-webhook-secret-456"
EMAIL_FROM="staging@capsulepodhotel.com"
MAIL_FROM="staging@capsulepodhotel.com"

# Frontend CORS (STAGING domain)
FRONTEND_URL="https://staging.capsulepodhotel.com"

# Payment (Test keys for staging)
RAZORPAY_KEY_ID="rzp_test_placeholder123456"
RAZORPAY_KEY_SECRET="placeholder_secret_change_later"

# Server Config (STAGING ports)
PORT=4001
NODE_ENV=production

# Redis Configuration (for BullMQ email queue)
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"
# Queue prefix to separate staging/prod queues on same Redis instance
QUEUE_PREFIX="staging"
ENV

echo "✅ Created backend/.env"
echo "⚠️  EDIT THE FILE and update:"
echo "   - POSTMARK_SERVER_TOKEN (your NEW token)"
echo "   - DATABASE PASSWORD"
echo "   - REDIS_ENABLED should be 'true' if Redis is installed"

# Edit the file
nano .env
# Update POSTMARK_SERVER_TOKEN and DATABASE password
# Save: Ctrl+O, Enter, Ctrl+X

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations (creates tables in staging DB)
npx prisma migrate deploy

# Verify migration worked
npx prisma db pull
```

### Step 7: Configure Frontend

```bash
cd ~/htdocs/staging.capsulepodhotel.com/frontend

# Create .env.local
cat > .env.local << 'ENV'
# Payment (Test keys)
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_placeholder123456"

# API URL - LEAVE EMPTY (uses Next.js rewrites)
# NO NEXT_PUBLIC_API_URL
ENV

echo "✅ Created frontend/.env.local"

# Install dependencies
npm install

# Build for production
npm run build
```

### Step 8: Start Staging Services

```bash
cd ~/htdocs/staging.capsulepodhotel.com

# Start backend (port 4001)
cd backend
pm2 start server.js --name staging-backend

# Start frontend (port 3001 - set via environment variable)
cd ../frontend
PORT=3001 pm2 start npm --name staging-frontend -- start

# Save PM2 config
pm2 save

# Check status
pm2 list
```

### Step 9: Verify Staging Works

```bash
# Test backend API
curl http://localhost:4001/api/health
# Should return: {"status":"healthy",...}

# Test frontend
curl -I http://localhost:3001
# Should return: HTTP/1.1 200 OK

# Test OTP API
curl -X POST http://localhost:4001/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
# Should return: {"success":true,...}
```

### Step 10: Configure DNS

**Add A record for staging:**
- Type: `A`
- Name: `staging`
- Value: `45.76.60.99`
- TTL: `Auto` or `300`

**Wait 5-10 minutes for DNS to propagate**, then test:
```bash
# From your Mac
curl -I https://staging.capsulepodhotel.com
```

### Step 11: SSL Certificate (CloudPanel)

1. Log in to CloudPanel
2. Go to **Sites** → **staging.capsulepodhotel.com**
3. Click **SSL/TLS** tab
4. Click **Let's Encrypt** → **Generate Certificate**
5. Wait 1-2 minutes

### Step 12: Test Staging OTP Authentication

**Browser test:**
1. Go to: https://staging.capsulepodhotel.com/admin/login
2. Enter: `shwet@thedesi.email`
3. Click "Send Login Code"
4. Check email for OTP
5. Enter OTP
6. **Should successfully login!**

**If this works → Proceed to Phase 3**  
**If this fails → Debug on staging before touching production**

---

## 📋 PHASE 3: FRESH PRODUCTION DEPLOYMENT (20 mins)

### Step 1: Install Redis on Production (Required for BullMQ)

```bash
ssh -i ~/.ssh/github_actions_capsulepodhotel capsulepodhotel@45.76.60.99

# Install Redis using the provided script
cd ~/htdocs/capsulepodhotel.com
chmod +x scripts/install-redis.sh
sudo bash scripts/install-redis.sh

# Or install manually:
sudo apt update
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### Step 2: Backup & Clean Production

```bash
# Already backed up database in BEFORE YOU START section

# Stop all services (already done in Phase 1)

# Clean production directory
cd /home/capsulepodhotel/htdocs/capsulepodhotel.com
rm -rf * .[^.]*

# Fresh clone
git clone https://github.com/geek-baba/podnbeyond.com.git .
git checkout main
git pull origin main
```

### Step 3: Configure Production Backend

```bash
cd ~/htdocs/capsulepodhotel.com/backend

# Create production .env
cat > .env << 'ENV'
# Database (PRODUCTION - Use existing DB with data)
DATABASE_URL="postgresql://podnbeyond_user:zDYNfTyRkp0RF6ZrqRJW@localhost:5432/podnbeyond_hotel"

# Email (Postmark) - USE YOUR NEW ROTATED TOKEN!
POSTMARK_SERVER_TOKEN="YOUR_NEW_POSTMARK_TOKEN_HERE"
POSTMARK_WEBHOOK_SECRET="production-webhook-secret-789"
EMAIL_FROM="support@capsulepodhotel.com"
MAIL_FROM="support@capsulepodhotel.com"

# Frontend CORS (PRODUCTION domain)
FRONTEND_URL="https://capsulepodhotel.com"

# Payment (PRODUCTION - Use LIVE keys when ready!)
RAZORPAY_KEY_ID="rzp_test_placeholder123456"
RAZORPAY_KEY_SECRET="placeholder_secret_change_later"

# Server Config (PRODUCTION ports)
PORT=4000
NODE_ENV=production

# Redis Configuration (for BullMQ email queue)
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"
# Queue prefix to separate staging/prod queues on same Redis instance
QUEUE_PREFIX="production"
ENV

echo "⚠️  EDIT .env and update POSTMARK_SERVER_TOKEN!"
echo "   - POSTMARK_SERVER_TOKEN (your NEW token)"
echo "   - REDIS_ENABLED should be 'true' if Redis is installed"
nano .env
# Update POSTMARK_SERVER_TOKEN with your NEW token
# Save: Ctrl+O, Enter, Ctrl+X

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations (updates existing DB if needed)
npx prisma migrate deploy
```

### Step 4: Configure Production Frontend

```bash
cd ~/htdocs/capsulepodhotel.com/frontend

# Create .env.local
cat > .env.local << 'ENV'
# Payment
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_placeholder123456"

# API URL - LEAVE EMPTY (uses Next.js rewrites)
# NO NEXT_PUBLIC_API_URL
ENV

# Install & build
npm install
npm run build
```

### Step 5: Start Production Services

```bash
cd ~/htdocs/capsulepodhotel.com

# Start backend (port 4000)
cd backend
pm2 start server.js --name hotel-booking-backend

# Start frontend (port 3000)
cd ../frontend
pm2 start npm --name hotel-booking-frontend -- start

# Save PM2 config
pm2 save

# Enable PM2 startup on reboot
pm2 startup
# Follow the command it outputs

# Check status
pm2 list
```

### Step 6: Verify Production Works

```bash
# Test backend
curl http://localhost:4000/api/health

# Test frontend
curl -I http://localhost:3000

# Test from outside
curl -I https://capsulepodhotel.com
```

### Step 7: Test Production OTP Authentication and Redis

**Verify Redis is working:**
```bash
# Check backend logs for Redis connection
pm2 logs hotel-booking-backend | grep -i redis

# Expected output:
# ✅ Email queue initialized (Redis connected)
# 🕒 Hold release job scheduled every 60 seconds. (if FEATURE_BUFFER=true)

# Test queue statistics endpoint
curl http://localhost:4000/api/email/queue/stats
# Should return JSON with queueEnabled: true
```

**Browser test:**
1. Go to: https://capsulepodhotel.com/admin/login
2. Enter: `shwet@thedesi.email`
3. Click "Send Login Code"
4. Check email for OTP
5. Enter OTP
6. **Should successfully login to admin dashboard!**

---

## 📋 PHASE 4: FINAL VERIFICATION (10 mins)

### Test Both Environments

| Test | Staging | Production |
|------|---------|------------|
| Login page loads | https://staging.capsulepodhotel.com/admin/login | https://capsulepodhotel.com/admin/login |
| OTP email sent | ✅ | ✅ |
| OTP login works | ✅ | ✅ |
| Dashboard loads | ✅ | ✅ |
| Email Center works | ✅ | ✅ |
| Session persists | ✅ | ✅ |

---

## 🔐 Environment Variables Summary

### Staging (`capsulepodhotel-staging` user)

**Backend (.env):**
```bash
DATABASE_URL=postgresql://podnbeyond_staging:password@localhost:5432/podnbeyond_staging
POSTMARK_SERVER_TOKEN=your-new-token
EMAIL_FROM=staging@capsulepodhotel.com
FRONTEND_URL=https://staging.capsulepodhotel.com
RAZORPAY_KEY_ID=rzp_test_placeholder123456
PORT=4001
NODE_ENV=production
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_placeholder123456
# NO NEXT_PUBLIC_API_URL
```

**PM2 Processes:**
- `staging-backend` (port 4001)
- `staging-frontend` (port 3001)

### Production (`capsulepodhotel` user)

**Backend (.env):**
```bash
DATABASE_URL=postgresql://podnbeyond_user:password@localhost:5432/podnbeyond_hotel
POSTMARK_SERVER_TOKEN=your-new-token
EMAIL_FROM=support@capsulepodhotel.com
FRONTEND_URL=https://capsulepodhotel.com
RAZORPAY_KEY_ID=rzp_test_placeholder123456
PORT=4000
NODE_ENV=production
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_placeholder123456
# NO NEXT_PUBLIC_API_URL
```

**PM2 Processes:**
- `hotel-booking-backend` (port 4000)
- `hotel-booking-frontend` (port 3000)

---

## 🔄 Future Workflow

### Development Cycle:

```
1. Code changes on local Mac (optional)
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

## ⚡ Quick Commands Reference

### Staging Commands
```bash
# SSH
ssh capsulepodhotel-staging@45.76.60.99

# Navigate
cd ~/htdocs/staging.capsulepodhotel.com

# Update code
git pull origin main

# Backend
cd backend && npm install && pm2 restart staging-backend

# Frontend
cd frontend && npm install && npm run build && pm2 restart staging-frontend

# Logs
pm2 logs staging-backend
pm2 logs staging-frontend
```

### Production Commands
```bash
# SSH
ssh -i ~/.ssh/github_actions_capsulepodhotel capsulepodhotel@45.76.60.99

# Navigate
cd ~/htdocs/capsulepodhotel.com

# Update code
git pull origin main

# Backend
cd backend && npm install && pm2 restart hotel-booking-backend

# Frontend
cd frontend && npm install && npm run build && pm2 restart hotel-booking-frontend

# Logs
pm2 logs hotel-booking-backend
pm2 logs hotel-booking-frontend
```

---

## 🎯 Success Criteria

**Staging is ready when:**
- ✅ https://staging.capsulepodhotel.com/admin/login loads
- ✅ OTP email is received
- ✅ Login works
- ✅ Dashboard displays without 500 errors
- ✅ Email Center is accessible

**Production is ready when:**
- ✅ Same as above but on https://capsulepodhotel.com
- ✅ All existing data is preserved (bookings, users, etc.)
- ✅ No 500 errors
- ✅ Sessions persist across refreshes

---

## 🆘 Rollback Plan

If production deployment fails:

```bash
# Restore from backup
ssh -i ~/.ssh/github_actions_capsulepodhotel capsulepodhotel@45.76.60.99

# Stop current services
pm2 delete all

# Restore database (if needed)
psql -h localhost -U podnbeyond_user -d podnbeyond_hotel < ~/backup_YYYYMMDD_HHMMSS.sql

# Restore old code
cd /home/capsulepodhotel/htdocs/capsulepodhotel.com
git reset --hard <commit-hash-before-changes>

# Restart
pm2 resurrect
```

---

## 📝 Checklist

### Before Starting:
- [ ] Rotated Postmark token
- [ ] Downloaded database backup to Mac
- [ ] Have staging user password from CloudPanel
- [ ] DNS is ready to add staging A record

### After Staging Setup:
- [ ] Staging backend running on port 4001
- [ ] Staging frontend running on port 3001
- [ ] Staging database created & migrated
- [ ] SSL certificate generated
- [ ] OTP authentication tested and working

### After Production Setup:
- [ ] Production backend running on port 4000
- [ ] Production frontend running on port 3000
- [ ] Database preserved with all data
- [ ] OTP authentication tested and working
- [ ] All admin features work
- [ ] No 500 errors

---

**Next Step:** Start with PHASE 1 (Cleanup) and work through each phase carefully.

