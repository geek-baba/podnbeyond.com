# 🚀 Redis Setup for Single Server (Staging + Production)

**Important:** Since both staging and production run on the same Ubuntu server, Redis is installed **once at the server level** and shared by both environments.

---

## ✅ What I've Done (Code Changes)

1. **Updated queue names to be environment-specific:**
   - Staging uses: `staging-email-queue` and `staging-hold-release-queue`
   - Production uses: `production-email-queue` and `production-hold-release-queue`
   - This allows both environments to share the same Redis instance safely

2. **Updated deployment workflows:**
   - Both workflows now set `QUEUE_PREFIX` environment variable
   - Staging: `QUEUE_PREFIX=staging`
   - Production: `QUEUE_PREFIX=production`

---

## 🚀 What You Need to Do (Manual Steps)

### Step 1: Install Redis Once (Server-Level)

Since both environments are on the same server, install Redis **once**:

```bash
# SSH into your server (as any user with sudo)
ssh capsulepodhotel@your-server-ip

# Install Redis (run once for the entire server)
sudo apt update
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

**That's it!** Redis is now installed and running for both staging and production.

---

### Step 2: Add GitHub Secrets

Go to **GitHub Repository → Settings → Secrets and variables → Actions**

**For Staging:**
- `STAGING_REDIS_ENABLED` = `true`
- `STAGING_REDIS_HOST` = `localhost`
- `STAGING_REDIS_PORT` = `6379`

**For Production:**
- `PROD_REDIS_ENABLED` = `true`
- `PROD_REDIS_HOST` = `localhost`
- `PROD_REDIS_PORT` = `6379`

---

### Step 3: Update Backend .env Files

**Staging Backend .env:**
```bash
ssh capsulepodhotel-staging@your-server-ip
cd ~/htdocs/staging.capsulepodhotel.com/backend
nano .env

# Add/update:
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"
QUEUE_PREFIX="staging"
```

**Production Backend .env:**
```bash
ssh capsulepodhotel@your-server-ip
cd ~/htdocs/capsulepodhotel.com/backend
nano .env

# Add/update:
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"
QUEUE_PREFIX="production"
```

**Important:** The `QUEUE_PREFIX` ensures staging and production queues are separate even though they share the same Redis instance.

---

### Step 4: Restart Backend Services

**Staging:**
```bash
pm2 restart staging-backend
pm2 logs staging-backend | grep -i redis
# Should see: ✅ Email queue initialized (Redis connected) - Queue: staging-email-queue
```

**Production:**
```bash
pm2 restart hotel-booking-backend
pm2 logs hotel-booking-backend | grep -i redis
# Should see: ✅ Email queue initialized (Redis connected) - Queue: production-email-queue
```

---

## 🔍 Verify Everything Works

### Check Redis is Running (Once)
```bash
redis-cli ping
# Should return: PONG
```

### Check Staging Queue
```bash
# Check logs
pm2 logs staging-backend | grep -i "queue\|redis"

# Test queue stats
curl https://staging.capsulepodhotel.com/api/email/queue/stats
# Should return: {"queueEnabled": true, ...}
```

### Check Production Queue
```bash
# Check logs
pm2 logs hotel-booking-backend | grep -i "queue\|redis"

# Test queue stats
curl https://capsulepodhotel.com/api/email/queue/stats
# Should return: {"queueEnabled": true, ...}
```

### Verify Queues are Separate

```bash
# Connect to Redis CLI
redis-cli

# List all queues (you should see both staging and production queues)
KEYS *-email-queue*
KEYS *-hold-release-queue*

# Should show:
# 1) "staging-email-queue:..."
# 2) "production-email-queue:..."

# Exit Redis CLI
exit
```

---

## 📊 How It Works

### Single Redis Instance, Separate Queues

```
┌─────────────────────────────────────┐
│     Ubuntu Server                    │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Redis (localhost:6379)       │   │
│  │  - Shared by both envs        │   │
│  └──────────────────────────────┘   │
│           │         │                │
│           │         │                │
│  ┌────────▼───┐  ┌─▼────────────┐  │
│  │  Staging   │  │  Production  │  │
│  │  Backend   │  │  Backend      │  │
│  │            │  │               │  │
│  │ Queues:    │  │ Queues:       │  │
│  │ - staging- │  │ - production- │  │
│  │   email-   │  │   email-      │  │
│  │   queue    │  │   queue       │  │
│  │ - staging- │  │ - production- │  │
│  │   hold-    │  │   hold-       │  │
│  │   release- │  │   release-    │  │
│  │   queue    │  │   queue       │  │
│  └────────────┘  └──────────────┘  │
└─────────────────────────────────────┘
```

**Benefits:**
- ✅ One Redis installation (simpler)
- ✅ Queues are completely separate (no mixing)
- ✅ Both environments benefit from Redis
- ✅ Lower resource usage

---

## 🐛 Troubleshooting

### Redis Not Running
```bash
sudo systemctl status redis-server
sudo systemctl start redis-server
```

### Queues Mixing (Shouldn't Happen)
If you see staging emails in production queue (or vice versa), check:
1. `QUEUE_PREFIX` is set correctly in both `.env` files
2. Backend services restarted after setting `QUEUE_PREFIX`
3. Check logs show correct queue names

### Can't Connect to Redis
```bash
# Check Redis is listening
sudo netstat -tlnp | grep 6379
# Should show: tcp 0 0 127.0.0.1:6379 ...

# Test connection
redis-cli ping
# Should return: PONG
```

---

## ✅ Summary

**What's Installed:**
- ✅ Redis (server-level, shared by both environments)

**What's Configured:**
- ✅ Code uses environment-specific queue names
- ✅ Deployment workflows set `QUEUE_PREFIX`
- ✅ Documentation updated

**What You Need to Do:**
1. ✅ Install Redis once (server-level)
2. ✅ Add GitHub secrets for Redis
3. ✅ Update backend `.env` files with Redis config + `QUEUE_PREFIX`
4. ✅ Restart backend services
5. ✅ Verify queues are separate

---

**Last Updated:** December 2024  
**Status:** Ready to install Redis once and configure both environments

