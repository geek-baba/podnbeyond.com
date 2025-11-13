# 📋 Backlog & Future Enhancements
**Created:** November 7, 2025  
**Status:** Post-MVP Items

This document tracks future enhancements and improvements to be implemented after MVP launch.

---

## 🚀 **GitHub Actions CI/CD Setup** (Post-MVP)

### **Status:** ⏸️ Deferred until MVP is ready

**Why:** To avoid delaying development process. Manual deployment works fine for now.

**What Needs to Be Done:**

#### **1. Setup Auto-Deploy to Staging**
- [ ] Create `.github/workflows/deploy-staging.yml`
- [ ] Configure to trigger on `main` branch push
- [ ] Deploy to `staging.capsulepodhotel.com`
- [ ] Run automated tests before deployment
- [ ] Health checks after deployment

#### **2. Setup Auto-Deploy to Production**
- [ ] Create `.github/workflows/deploy-production.yml`
- [ ] Configure to trigger on `prod` branch push
- [ ] Deploy to `capsulepodhotel.com`
- [ ] Require manual approval for production deploys
- [ ] Run automated tests
- [ ] Health checks after deployment

#### **3. Branch Strategy**
- [ ] Establish `main` → development/staging branch
- [ ] Establish `prod` → production branch (protected)
- [ ] Create PR workflow: `main` → `prod` (with review)
- [ ] Document branching strategy

#### **4. GitHub Secrets Required**
- [ ] `STAGING_SSH_KEY` - SSH private key for staging user
- [ ] `PROD_SSH_KEY` - SSH private key for production user
- [ ] `STAGING_DEPLOY_HOST` - Staging server IP
- [ ] `PROD_DEPLOY_HOST` - Production server IP
- [ ] `STAGING_DEPLOY_USER` - `capsulepodhotel-staging`
- [ ] `PROD_DEPLOY_USER` - `capsulepodhotel`
- [ ] `STAGING_DEPLOY_PATH` - `/home/capsulepodhotel-staging/htdocs/staging.capsulepodhotel.com`
- [ ] `PROD_DEPLOY_PATH` - `/home/capsulepodhotel/htdocs/capsulepodhotel.com`
- [ ] Environment-specific secrets (Postmark, Razorpay, Database URLs)

#### **5. Workflow Features**
- [ ] Node.js version setup (v22.21.1)
- [ ] Install dependencies (backend & frontend)
- [ ] Run Prisma migrations
- [ ] Build frontend with correct `BACKEND_PORT`
- [ ] Restart PM2 services
- [ ] Health check endpoints
- [ ] Rollback capability on failure

**References:**
- Existing workflow: `.github/workflows/deploy-staging.yml` (runs on `main`)
- TODO: add `.github/workflows/deploy-production.yml` (trigger on `prod` with approval)
- Current manual deployment: See `docs/DEPLOYMENT_SUCCESS.md`

---

## 🔧 **Optional Enhancements** (Post-MVP)

### **1. Rate Limiting Optimization**
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

### **2. Payment Gateway Integration**
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

### **3. Redis Email Queue**
- [ ] Install Redis on production server
- [ ] Update `REDIS_ENABLED=true` in backend `.env`
- [ ] Test email queue functionality
- [ ] Monitor queue performance
- [ ] Configure queue retry logic
- [ ] Add queue monitoring dashboard

**Current State:**  
- `REDIS_ENABLED=false` (emails sent synchronously)

**Files to Update:**
- `backend/.env`
- `backend/lib/queue.ts` (may need updates)
- Install Redis: `sudo apt install redis-server`

---

### **4. PM2 Startup Script**
- [ ] Generate PM2 startup script: `pm2 startup`
- [ ] Configure to run on server boot
- [ ] Test server restart scenario
- [ ] Document startup process

**Commands:**
```bash
pm2 startup
# Follow the instructions provided
pm2 save
```

**Files to Update:**
- PM2 ecosystem configuration (if needed)

---

### **5. SSL Auto-Renewal**
- [ ] Verify CloudPanel SSL auto-renewal is enabled
- [ ] Test SSL renewal process
- [ ] Configure email notifications for renewal
- [ ] Document renewal process
- [ ] Add monitoring for SSL expiration

**Current State:**  
- SSL configured via CloudPanel (should auto-renew)
- Need to verify and monitor

**Tools:**
- CloudPanel SSL settings
- Let's Encrypt auto-renewal

---

### **6. Monitoring & Alerting**
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

### **7. Database Backups**
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

## 📝 **Implementation Priority**

### **High Priority** (Before Launch)
1. ✅ ~~OTP Authentication~~ - **DONE**
2. ✅ ~~Production Deployment~~ - **DONE**
3. ✅ ~~Staging Environment~~ - **DONE**
4. [ ] Add real Razorpay credentials
5. [ ] Rate limiting optimization (after monitoring)
6. [ ] Database backups

### **Medium Priority** (Post-Launch)
1. [ ] Monitoring & Alerting
2. [ ] SSL auto-renewal verification
3. [ ] PM2 startup script
4. [ ] GitHub Actions CI/CD

### **Low Priority** (Nice to Have)
1. [ ] Redis email queue
2. [ ] Advanced monitoring features

---

## 🎯 **When to Revisit**

### **After MVP Launch:**
- Monitor production usage for 1-2 weeks
- Gather performance metrics
- Identify bottlenecks
- Prioritize enhancements based on real usage

### **Before Scaling:**
- Implement monitoring & alerting
- Setup automated backups
- Optimize rate limiting
- Consider Redis for email queue

### **When Adding Team Members:**
- Setup GitHub Actions CI/CD
- Document deployment process
- Create runbooks

---

## 📚 **Related Documentation**

- `docs/DEPLOYMENT_SUCCESS.md` - Current deployment status
- `docs/ENVIRONMENT_VARIABLES.md` - Environment configuration
- `docs/STAGING_SETUP.md` - Staging environment guide
- `docs/FRESH_CLEAN_DEPLOYMENT.md` - Deployment process

---

## ✅ **Checklist Summary**

**GitHub Actions CI/CD:**
- [ ] Staging auto-deploy workflow
- [ ] Production auto-deploy workflow
- [ ] Branch strategy setup
- [ ] GitHub secrets configuration
- [ ] Testing & validation

**Optional Enhancements:**
- [ ] Rate limiting optimization
- [ ] Real Razorpay credentials
- [ ] Redis email queue
- [ ] PM2 startup script
- [ ] SSL auto-renewal
- [ ] Monitoring & alerting
- [ ] Database backups

---

**Last Updated:** November 7, 2025  
**Next Review:** After MVP launch and initial production monitoring

