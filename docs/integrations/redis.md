# 🚀 Redis & BullMQ Setup Guide

**Quick guide to enable Redis and BullMQ for staging and production environments.**

---

## 📋 Prerequisites

- SSH access to staging and production servers
- Sudo/root access (for Redis installation)
- Backend code deployed with `bullmq` and `ioredis` dependencies

---

## 🔧 Step 1: Install Redis on Servers

### For Staging Server

```bash
# SSH into staging server
ssh capsulepodhotel-staging@your-server-ip

# Option A: Use the installation script (recommended)
cd ~/htdocs/staging.capsulepodhotel.com
chmod +x scripts/install-redis.sh
sudo bash scripts/install-redis.sh

# Option B: Manual installation
sudo apt update
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### For Production Server

```bash
# SSH into production server
ssh capsulepodhotel@your-server-ip

# Option A: Use the installation script (recommended)
cd ~/htdocs/capsulepodhotel.com
chmod +x scripts/install-redis.sh
sudo bash scripts/install-redis.sh

# Option B: Manual installation
sudo apt update
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

---

## 🔐 Step 2: Add GitHub Secrets

### For Staging

Go to **GitHub Repository → Settings → Secrets and variables → Actions** and add:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `STAGING_REDIS_ENABLED` | `true` | Enable Redis for staging |
| `STAGING_REDIS_HOST` | `localhost` | Redis host (usually localhost) |
| `STAGING_REDIS_PORT` | `6379` | Redis port (default: 6379) |

### For Production

Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `PROD_REDIS_ENABLED` | `true` | Enable Redis for production |
| `PROD_REDIS_HOST` | `localhost` | Redis host (usually localhost) |
| `PROD_REDIS_PORT` | `6379` | Redis port (default: 6379) |

---

## 📝 Step 3: Update Backend .env Files

### Staging Backend .env

```bash
ssh capsulepodhotel-staging@your-server-ip
cd ~/htdocs/staging.capsulepodhotel.com/backend

# Edit .env file
nano .env

# Add or update these lines:
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Save: Ctrl+O, Enter, Ctrl+X
```

### Production Backend .env

```bash
ssh capsulepodhotel@your-server-ip
cd ~/htdocs/capsulepodhotel.com/backend

# Edit .env file
nano .env

# Add or update these lines:
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Save: Ctrl+O, Enter, Ctrl+X
```

---

## 🔄 Step 4: Restart Backend Services

### Staging

```bash
pm2 restart staging-backend

# Check logs to verify Redis connection
pm2 logs staging-backend | grep -i redis

# Expected output:
# ✅ Email queue initialized (Redis connected)
```

### Production

```bash
pm2 restart hotel-booking-backend

# Check logs to verify Redis connection
pm2 logs hotel-booking-backend | grep -i redis

# Expected output:
# ✅ Email queue initialized (Redis connected)
```

---

## ✅ Step 5: Verify Redis is Working

### Test Queue Statistics Endpoint

**Staging:**
```bash
curl https://staging.capsulepodhotel.com/api/email/queue/stats
```

**Production:**
```bash
curl https://capsulepodhotel.com/api/email/queue/stats
```

**Expected Response:**
```json
{
  "waiting": 0,
  "active": 0,
  "completed": 0,
  "failed": 0,
  "total": 0,
  "queueEnabled": true
}
```

**If `queueEnabled: false`**, Redis is not connected. Check:
1. Redis is running: `redis-cli ping`
2. Backend .env has `REDIS_ENABLED="true"`
3. Backend logs for errors: `pm2 logs staging-backend | grep -i redis`

### Test Email Queue

Send a test email (e.g., OTP login) and check:
1. Email is queued (non-blocking API response)
2. Backend logs show: `📬 Email queued: Job ID ...`
3. Queue stats show completed count increases

---

## 🐛 Troubleshooting

### Redis Not Starting

```bash
# Check Redis status
sudo systemctl status redis-server

# Check Redis logs
sudo journalctl -u redis-server -n 50

# Restart Redis
sudo systemctl restart redis-server
```

### Backend Can't Connect to Redis

1. **Check Redis is running:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Check Redis is listening on correct port:**
   ```bash
   sudo netstat -tlnp | grep 6379
   # or
   sudo ss -tlnp | grep 6379
   ```

3. **Check backend .env configuration:**
   ```bash
   cat backend/.env | grep REDIS
   ```

4. **Check backend logs:**
   ```bash
   pm2 logs staging-backend | grep -i redis
   pm2 logs hotel-booking-backend | grep -i redis
   ```

### Queue Not Processing Emails

1. **Check if worker is running:**
   - Worker starts automatically when backend starts
   - Check logs for: `✅ Email queue initialized (Redis connected)`

2. **Check for errors in logs:**
   ```bash
   pm2 logs staging-backend | grep -i "email\|queue\|redis"
   ```

3. **Manually test queue:**
   ```bash
   # Send a test email via API
   curl -X POST https://staging.capsulepodhotel.com/api/otp/send \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   
   # Check queue stats
   curl https://staging.capsulepodhotel.com/api/email/queue/stats
   ```

---

## 📊 Monitoring Redis

### Check Redis Memory Usage

```bash
redis-cli info memory
```

### Check Redis Connections

```bash
redis-cli info clients
```

### Monitor Redis in Real-Time

```bash
redis-cli monitor
```

### Check Queue Statistics via API

```bash
# Staging
curl https://staging.capsulepodhotel.com/api/email/queue/stats | jq

# Production
curl https://capsulepodhotel.com/api/email/queue/stats | jq
```

---

## 🔒 Security Considerations

1. **Redis is bound to localhost only** (default configuration)
   - Only accessible from the same server
   - Not exposed to the internet

2. **If you need password protection:**
   ```bash
   # Edit Redis config
   sudo nano /etc/redis/redis.conf
   
   # Add:
   requirepass your-strong-password
   
   # Restart Redis
   sudo systemctl restart redis-server
   
   # Update backend .env
   REDIS_PASSWORD="your-strong-password"
   ```

3. **Firewall rules:**
   - Redis port (6379) should NOT be exposed to the internet
   - Only allow localhost connections

---

## 📚 Additional Resources

- **Redis Documentation:** https://redis.io/docs/
- **BullMQ Documentation:** https://docs.bullmq.io/
- **Email Queue Code:** `backend/lib/queue.js`
- **Hold Release Job:** `backend/jobs/holdReleaseJob.js`

---

## ✅ Checklist

- [ ] Redis installed on staging server
- [ ] Redis installed on production server
- [ ] Redis service running and enabled on both servers
- [ ] GitHub secrets added for staging (REDIS_ENABLED, REDIS_HOST, REDIS_PORT)
- [ ] GitHub secrets added for production (REDIS_ENABLED, REDIS_HOST, REDIS_PORT)
- [ ] Staging backend .env updated with Redis config
- [ ] Production backend .env updated with Redis config
- [ ] Staging backend restarted and logs show Redis connected
- [ ] Production backend restarted and logs show Redis connected
- [ ] Queue statistics endpoint returns `queueEnabled: true`
- [ ] Test email sent and processed successfully

---

**Last Updated:** December 2024  
**Status:** Ready to enable Redis/BullMQ

