# Backlog & Future Enhancements

**Created:** 2025-01-21  
**Status:** Post-MVP Items

This document tracks future enhancements and improvements to be implemented after MVP launch.

---

## 🚀 GitHub Actions CI/CD Setup

### Status: ✅ **IMPLEMENTED**

**Implementation:** GitHub Actions workflows are fully configured and operational.

### What's Implemented

#### 1. Auto-Deploy to Staging ✅
- ✅ Created `.github/workflows/deploy-staging.yml`
- ✅ Configured to trigger on `main` branch push
- ✅ Deploys to `staging.capsulepodhotel.com`
- ✅ Includes health checks after deployment
- ✅ Smart restart logic (only restarts when code/dependencies change)
- ✅ Migration handling with recovery logic
- ✅ Comprehensive error handling and logging

#### 2. Auto-Deploy to Production ✅
- ✅ Created `.github/workflows/deploy-production.yml`
- ✅ Configured to trigger on `production` branch push (with manual approval option)
- ✅ Deploys to `capsulepodhotel.com`
- ✅ Requires manual approval for production deploys (via `workflow_dispatch` or branch protection)
- ✅ Includes health checks after deployment
- ✅ Migration handling

#### 3. Branch Strategy ✅
- ✅ `main` → development/staging branch (auto-deploys to staging)
- ✅ `production` → production branch (auto-deploys to production)
- ✅ Current workflow: push to `main` (auto-deploys to staging), user handles `production` merges

#### 4. GitHub Secrets ✅
- ✅ All required secrets configured:
  - `STAGING_SSH_KEY`, `PROD_SSH_KEY`
  - `STAGING_DEPLOY_HOST`, `PROD_DEPLOY_HOST`
  - `STAGING_DEPLOY_USER`, `PROD_DEPLOY_USER`
  - `STAGING_DEPLOY_PATH`, `PROD_DEPLOY_PATH`
  - Environment-specific secrets (Postmark, Razorpay, Database URLs, Redis, etc.)

### Future Enhancements (Optional)
- [ ] Add automated tests before deployment (currently placeholder)
- [ ] Add linting checks before deployment (currently placeholder)

---

## 🎨 Admin Dashboard Enhancements

### Phase 12: Compact RBAC-Ready Dashboard Layout ✅ **COMPLETED**

**Status:** ✅ Implemented (2025-01-21)

**What's Implemented:**
- ✅ Compact, non-scrolly dashboard layout
- ✅ Above-the-fold KPI rows (2 rows of 4 cards)
- ✅ Compact Recent Activity section (2 columns)
- ✅ Compact System & Actions section (3 columns)
- ✅ PageHeader with quick action buttons
- ✅ Layout helper components (DashboardGridRow, DashboardTwoColumn, DashboardThreeColumn)
- ✅ RBAC-aware widget registry integration
- ✅ Error boundaries for widget-level failures
- ✅ Null-safety guards for all widgets

**Layout Structure:**
- **Primary KPI Row:** Occupancy, Today Arrivals, Today Departures, In-House Guests
- **Secondary KPI Row:** Loyalty Requests, Pending Approvals, Open Conversations, Integration Status
- **Recent Activity:** Recent Bookings (left), Recent Loyalty Members (right)
- **System & Actions:** System Status, Quick Actions, (placeholder for future Shortcuts widget)

**Future Enhancements:**
- [ ] Create RevenueSummary widget for secondary KPI row
- [ ] Create Shortcuts widget for System & Actions section
- [ ] Add role-level widget toggles (Phase 12B - DB-backed widget config)
- [ ] Add widget customization UI (drag-and-drop, show/hide per role)
- [ ] Add widget refresh intervals and real-time updates
- [ ] Add deployment notifications (Slack, email, etc.)

---

## 🔧 Optional Enhancements (Post-MVP)

### 1. Rate Limiting Optimization
- [ ] Monitor actual API usage patterns
- [ ] Lower rate limit from 1000 to appropriate value (e.g., 50-100 requests per 15 min)
- [ ] Configure different limits for different endpoints
- [ ] Add rate limit headers to responses
- [ ] Implement user-specific rate limiting for authenticated users

**Current State:**  
- Staging: 1000 requests per 15 min (for testing)
- Production: 1000 requests per 15 min (temporary)

**Files to Update:**
- `backend/server.js` - Rate limiter configuration

---

### 2. Payment Gateway Integration
- [ ] Add real Razorpay credentials to production
- [ ] Remove placeholder/test credentials
- [ ] Test payment flow end-to-end
- [ ] Configure webhook endpoints for payment callbacks
- [ ] Implement payment failure handling
- [ ] Add payment success confirmation emails

**Current State:**  
- `RAZORPAY_KEY_ID=rzp_test_placeholder`
- `RAZORPAY_KEY_SECRET=placeholder_secret`

**Files to Update:**
- `backend/.env` (production)
- `backend/routes/payment.js`

---

### 3. Redis Email Queue

### Status: ✅ **IMPLEMENTED**

**Implementation:** Redis email queue is fully implemented using BullMQ.

**What's Implemented:**
- ✅ Email queue system using BullMQ (`backend/lib/queue.js`)
- ✅ Redis connection handling with fallback to synchronous sending
- ✅ Queue worker with concurrency control (5 concurrent emails)
- ✅ Retry logic (3 attempts with exponential backoff)
- ✅ Job cleanup (completed jobs removed after 24h, failed jobs after 7 days)
- ✅ Queue statistics endpoint (`getQueueStats()`)
- ✅ Environment-specific queue prefixes (staging/prod separation)
- ✅ Logs show "✅ Email queue initialized (Redis connected)"

**Configuration:**
- Set `REDIS_ENABLED=true` in backend `.env` to enable
- Set `REDIS_HOST` and `REDIS_PORT` (defaults: localhost:6379)
- Set `QUEUE_PREFIX` for environment separation (defaults to `NODE_ENV`)

**Current State:**  
- Code is implemented and ready
- Requires Redis server installed and `REDIS_ENABLED=true` in production `.env`
- Falls back to synchronous email sending if Redis unavailable

**Optional Enhancements:**
- [ ] Add queue monitoring dashboard (UI for queue stats)
- [ ] Add queue metrics/alerting (monitor queue depth, failed jobs)
- [ ] Add queue pause/resume functionality

---

### 4. PM2 Startup Script

### Status: ⚠️ **PARTIALLY IMPLEMENTED**

**What's Done:**
- ✅ `pm2 save` is executed in deployment workflows (saves current PM2 process list)
- ✅ Deployment docs include `pm2 startup` command
- ⚠️ Need to verify if `pm2 startup` was actually run on production/staging servers

**To Complete:**
- [ ] Verify `pm2 startup` was run on staging server
- [ ] Verify `pm2 startup` was run on production server
- [ ] Test server restart scenario (reboot server, verify PM2 processes auto-start)
- [ ] Document startup process status

**Commands to Run (if not already done):**
```bash
# On staging server
pm2 startup
# Follow the instructions provided (will output a sudo command)
pm2 save

# On production server
pm2 startup
# Follow the instructions provided (will output a sudo command)
pm2 save
```

**Note:** The `pm2 startup` command generates a systemd service that auto-starts PM2 on server boot. This needs to be run once per server and requires sudo access.

---

### 5. SSL Auto-Renewal
- [ ] Verify CloudPanel SSL auto-renewal is enabled
- [ ] Test SSL renewal process
- [ ] Configure email notifications for renewal
- [ ] Document renewal process
- [ ] Add monitoring for SSL expiration

**Current State:**  
- SSL configured via CloudPanel (should auto-renew)
- Need to verify and monitor

---

### 6. Monitoring & Alerting
- [ ] Setup application monitoring (e.g., UptimeRobot, Pingdom)
- [ ] Monitor uptime for production site
- [ ] Setup email alerts for downtime
- [ ] Monitor API response times
- [ ] Monitor database connection health
- [ ] Setup error tracking (e.g., Sentry)
- [ ] Monitor PM2 process health
- [ ] Setup disk space alerts
- [ ] Monitor memory usage

**Suggested Services:**
- **UptimeRobot** - Free uptime monitoring
- **Sentry** - Error tracking
- **PM2 Plus** - Process monitoring
- **New Relic** - Application performance monitoring (paid)

**Endpoints to Monitor:**
- `https://capsulepodhotel.com/` - Homepage
- `https://capsulepodhotel.com/api/health` - Backend health
- `https://capsulepodhotel.com/admin/login` - Admin portal

---

### 7. Database Backups
- [ ] Setup automated daily database backups
- [ ] Store backups in secure location
- [ ] Test backup restoration process
- [ ] Configure backup retention policy (e.g., 30 days)
- [ ] Setup backup monitoring/alerts
- [ ] Document backup and restore procedures

**Current State:**  
- No automated backups configured

**Options:**
- **CloudPanel** - Built-in backup feature
- **pg_dump** - PostgreSQL native backup
- **Automated script** - Custom cron job

**Example Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="/home/capsulepodhotel/backups"
DATE=$(date +%Y%m%d_%H%M%S)
PGPASSWORD="password" pg_dump -h localhost -U podnbeyond_prod podnbeyond_prod > "$BACKUP_DIR/backup_$DATE.sql"
# Keep only last 30 days
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +30 -delete
```

**Schedule:**
- Daily backups at 2 AM
- Weekly full backups
- Monthly archive backups

---

## 📝 Implementation Priority

### High Priority (Before Launch)
1. ✅ ~~OTP Authentication~~ - **DONE**
2. ✅ ~~Production Deployment~~ - **DONE**
3. ✅ ~~Staging Environment~~ - **DONE**
4. [ ] Add real Razorpay credentials
5. [ ] Rate limiting optimization (after monitoring)
6. [ ] Database backups

### Medium Priority (Post-Launch)
1. [ ] Monitoring & Alerting
2. [ ] SSL auto-renewal verification
3. [ ] PM2 startup script verification (check if already configured)
4. ✅ ~~GitHub Actions CI/CD~~ - **DONE**

### Low Priority (Nice to Have)
1. ✅ ~~Redis email queue~~ - **DONE** (code implemented, needs Redis server + env var)
2. [ ] Advanced monitoring features
3. [ ] Queue monitoring dashboard

---

## 🎯 When to Revisit

### After MVP Launch:
- Monitor production usage for 1-2 weeks
- Gather performance metrics
- Identify bottlenecks
- Prioritize enhancements based on real usage

### Before Scaling:
- Implement monitoring & alerting
- Setup automated backups
- Optimize rate limiting
- Consider Redis for email queue

### When Adding Team Members:
- Setup GitHub Actions CI/CD
- Document deployment process
- Create runbooks

---

## ✅ Checklist Summary

**GitHub Actions CI/CD:**
- ✅ Staging auto-deploy workflow - **DONE**
- ✅ Production auto-deploy workflow - **DONE**
- ✅ Branch strategy setup - **DONE**
- ✅ GitHub secrets configuration - **DONE**
- [ ] Testing & validation (add automated tests before deployment)

**Optional Enhancements:**
- [ ] Rate limiting optimization
- [ ] Real Razorpay credentials
- ✅ ~~Redis email queue~~ - **DONE** (code implemented)
- [ ] PM2 startup script verification
- [ ] SSL auto-renewal
- [ ] Monitoring & alerting
- [ ] Database backups

---

**Last Updated:** 2025-01-21  
**Next Review:** After MVP launch and initial production monitoring

