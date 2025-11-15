# Redis and BullMQ Status Report

**Date:** December 2024  
**Status:** ❌ Redis/BullMQ **NOT ENABLED** in staging and production

---

## 📊 Summary

| Environment | Redis Enabled | BullMQ Enabled | Status |
|-------------|---------------|----------------|--------|
| **Staging** | ❌ No | ❌ No | Emails sent synchronously |
| **Production** | ❌ No | ❌ No | Emails sent synchronously |
| **Local Dev** | ⚠️ Optional | ⚠️ Optional | Depends on `.env` config |

---

## 🔍 Current Configuration

### Staging Environment

**Backend `.env`:**
```bash
REDIS_ENABLED=false
```

**Deployment Workflow:** `.github/workflows/deploy-staging.yml`
- ❌ Does NOT set `REDIS_ENABLED`
- ❌ Does NOT set `REDIS_HOST`
- ❌ Does NOT set `REDIS_PORT`

**Result:** 
- Emails are sent **synchronously** (blocking)
- Hold release job is **disabled**
- No queue statistics available

### Production Environment

**Backend `.env` (from deployment docs):**
```bash
REDIS_ENABLED=false
```

**Deployment Workflow:** No production workflow found (manual deployment)

**Result:**
- Emails are sent **synchronously** (blocking)
- Hold release job is **disabled**
- No queue statistics available

---

## 📦 Dependencies Status

✅ **Dependencies are installed:**
- `bullmq`: `^5.63.0` (in `backend/package.json`)
- `ioredis`: `^5.8.2` (in `backend/package.json`)

✅ **Code supports Redis/BullMQ:**
- `backend/lib/queue.js` - Email queue implementation
- `backend/jobs/holdReleaseJob.js` - Hold release job using BullMQ

---

## 🔧 How Redis/BullMQ Works in This Codebase

### Email Queue (`backend/lib/queue.js`)

**When `REDIS_ENABLED=true`:**
- ✅ Emails are queued using BullMQ
- ✅ Retry logic (3 attempts with exponential backoff)
- ✅ Queue statistics available via `/api/email/queue/stats`
- ✅ Background worker processes emails asynchronously

**When `REDIS_ENABLED=false` (current state):**
- ⚠️ Emails are sent **synchronously** (blocking)
- ⚠️ No retry logic
- ⚠️ No queue statistics
- ⚠️ If Postmark fails, email fails immediately

### Hold Release Job (`backend/jobs/holdReleaseJob.js`)

**Requirements:**
- `FEATURE_BUFFER=true` AND `REDIS_ENABLED=true`

**When enabled:**
- ✅ Automatically releases expired booking holds
- ✅ Runs every 60 seconds (configurable via `HOLD_RELEASE_INTERVAL_MS`)
- ✅ Processes batches of 50 expired holds

**Current state:**
- ❌ Disabled (requires Redis)

---

## 🚀 To Enable Redis/BullMQ

### Step 1: Install Redis on Server

**For Staging:**
```bash
ssh capsulepodhotel-staging@your-server-ip

# Install Redis
sudo apt update
sudo apt install redis-server

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

**For Production:**
```bash
ssh capsulepodhotel@your-server-ip

# Same commands as above
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
redis-cli ping
```

### Step 2: Update Environment Variables

**Staging Backend `.env`:**
```bash
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"
# Optional: If Redis has password
# REDIS_PASSWORD="your-redis-password"
```

**Production Backend `.env`:**
```bash
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

### Step 3: Update Deployment Workflows

**For `.github/workflows/deploy-staging.yml`:**

Add Redis environment variables in the deploy step:
```yaml
export REDIS_ENABLED='true'
export REDIS_HOST='localhost'
export REDIS_PORT='6379'
```

**For production workflow (when created):**
- Add same Redis environment variables

### Step 4: Restart Services

**Staging:**
```bash
pm2 restart staging-backend
```

**Production:**
```bash
pm2 restart hotel-booking-backend
```

### Step 5: Verify Redis Connection

Check backend logs:
```bash
# Staging
pm2 logs staging-backend | grep -i redis

# Production
pm2 logs hotel-booking-backend | grep -i redis
```

**Expected output:**
```
✅ Email queue initialized (Redis connected)
🕒 Hold release job scheduled every 60 seconds.
```

---

## 📊 Benefits of Enabling Redis/BullMQ

### Email Queue Benefits:
1. ✅ **Non-blocking email sending** - API responds immediately
2. ✅ **Automatic retries** - Failed emails retry 3 times
3. ✅ **Better error handling** - Failed emails tracked in queue
4. ✅ **Queue monitoring** - View queue stats via `/api/email/queue/stats`
5. ✅ **Scalability** - Can handle high email volumes

### Hold Release Job Benefits:
1. ✅ **Automatic inventory release** - Expired holds released automatically
2. ✅ **Better booking flow** - Prevents inventory being stuck in HOLD status
3. ✅ **Configurable intervals** - Adjust release frequency as needed

---

## ⚠️ Current Limitations (Without Redis)

1. **Email sending is blocking:**
   - API requests wait for email to be sent
   - If Postmark is slow, API response is slow
   - If Postmark fails, email fails immediately (no retry)

2. **No hold release automation:**
   - Expired booking holds must be released manually
   - Inventory may remain locked in HOLD status

3. **No queue visibility:**
   - Cannot monitor email queue statistics
   - Cannot see failed emails in queue

---

## 🔍 Verification Commands

### Check if Redis is installed:
```bash
redis-cli --version
# or
which redis-cli
```

### Check if Redis is running:
```bash
sudo systemctl status redis-server
# or
redis-cli ping
```

### Check backend logs for Redis connection:
```bash
pm2 logs staging-backend | grep -i "email queue\|redis"
pm2 logs hotel-booking-backend | grep -i "email queue\|redis"
```

### Test queue statistics endpoint:
```bash
curl https://staging.capsulepodhotel.com/api/email/queue/stats
curl https://capsulepodhotel.com/api/email/queue/stats
```

**Expected response when disabled:**
```json
{
  "waiting": 0,
  "active": 0,
  "completed": 0,
  "failed": 0,
  "total": 0,
  "queueEnabled": false
}
```

**Expected response when enabled:**
```json
{
  "waiting": 0,
  "active": 0,
  "completed": 5,
  "failed": 0,
  "total": 5,
  "queueEnabled": true
}
```

---

## 📝 References

- **Email Queue Code:** `backend/lib/queue.js`
- **Hold Release Job:** `backend/jobs/holdReleaseJob.js`
- **Environment Variables:** `backend/env.example`
- **Deployment Guide:** `docs/FRESH_CLEAN_DEPLOYMENT.md`
- **Environment Audit:** `docs/ENVIRONMENT_AUDIT.md`

---

## ✅ Action Items

- [x] ✅ Update staging deployment workflow with Redis env vars
- [x] ✅ Create production deployment workflow with Redis env vars
- [x] ✅ Create Redis installation script (`scripts/install-redis.sh`)
- [x] ✅ Update deployment documentation with Redis setup
- [x] ✅ Update environment variables documentation
- [x] ✅ Create Redis setup guide (`docs/REDIS_SETUP_GUIDE.md`)
- [ ] 🔄 Install Redis on staging server (manual step)
- [ ] 🔄 Install Redis on production server (manual step)
- [ ] 🔄 Add GitHub secrets for Redis (STAGING_REDIS_*, PROD_REDIS_*)
- [ ] 🔄 Update staging `.env` with `REDIS_ENABLED=true`
- [ ] 🔄 Update production `.env` with `REDIS_ENABLED=true`
- [ ] 🔄 Restart backend services
- [ ] 🔄 Verify Redis connection in logs
- [ ] 🔄 Test email queue functionality

---

**Last Updated:** December 2024  
**Status:** ✅ **Configuration Ready** - Follow `docs/REDIS_SETUP_GUIDE.md` to complete setup

