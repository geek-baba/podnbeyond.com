# Environment Variables Guide

## 🔐 Security First

**CRITICAL RULES:**
1. ❌ **NEVER** commit `.env` files to Git
2. ❌ **NEVER** commit secrets/tokens in code or docs
3. ✅ **ALWAYS** use `.env.example` with placeholder values
4. ✅ **ALWAYS** rotate tokens immediately if exposed
5. ✅ **ALWAYS** use different credentials for staging/production

## 📋 Required Environment Variables

### Backend (.env)

```bash
# ===========================================
# DATABASE
# ===========================================
# Production: Use strong password, never commit
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"

# ===========================================
# EMAIL (POSTMARK)
# ===========================================
# Get from: https://account.postmarkapp.com/servers
# SECURITY: Rotate immediately if exposed!
POSTMARK_SERVER_TOKEN="your-server-token-here"
POSTMARK_WEBHOOK_SECRET="your-webhook-secret-here"
EMAIL_FROM="support@capsulepodhotel.com"
MAIL_FROM="support@capsulepodhotel.com"

# ===========================================
# FRONTEND CORS
# ===========================================
# Staging: https://staging.capsulepodhotel.com
# Production: https://capsulepodhotel.com
FRONTEND_URL="https://capsulepodhotel.com"

# ===========================================
# AUTHENTICATION (if using NextAuth)
# ===========================================
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="https://capsulepodhotel.com"

# ===========================================
# PAYMENT (RAZORPAY)
# ===========================================
# Get from: https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your-secret-here"

# ===========================================
# SERVER
# ===========================================
PORT=4000
NODE_ENV=production

# ===========================================
# REDIS (for BullMQ email queue)
# ===========================================
# Set to "true" to enable email queue (requires Redis installed and running)
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"
# Optional: If Redis has password authentication
# REDIS_PASSWORD="your-redis-password"
```

### Frontend (.env.local)

```bash
# ===========================================
# PAYMENT (PUBLIC KEYS ONLY)
# ===========================================
# Test: rzp_test_xxxxxxxxxxxx
# Live: rzp_live_xxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxx"

# ===========================================
# API URL (PRODUCTION ONLY)
# ===========================================
# ⚠️  IMPORTANT: Leave EMPTY for production!
# Next.js rewrites will handle /api/* → localhost:4000
# Only set this for local development if needed
# NEXT_PUBLIC_API_URL=

# Local Development (optional):
# NEXT_PUBLIC_API_URL="http://localhost:4000"
```

## 🏗️ Environment-Specific Values

### Local Development

**Backend:**
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/podnbeyond_dev"
FRONTEND_URL="http://localhost:3000"
POSTMARK_SERVER_TOKEN="POSTMARK_API_TEST"  # Sandbox mode
EMAIL_FROM="dev@localhost"
NEXTAUTH_URL="http://localhost:3000"
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"
PORT=4000
NODE_ENV=development
```

**Frontend:**
```bash
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"
```

### Staging (staging.capsulepodhotel.com)

**Backend:**
```bash
DATABASE_URL="postgresql://podnbeyond_staging:STRONG_PASSWORD@localhost:5432/podnbeyond_staging"
FRONTEND_URL="https://staging.capsulepodhotel.com"
POSTMARK_SERVER_TOKEN="your-staging-token"  # Separate from production!
EMAIL_FROM="staging@capsulepodhotel.com"
NEXTAUTH_URL="https://staging.capsulepodhotel.com"
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"  # Use test keys
PORT=4001  # Different port!
NODE_ENV=production
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

**Frontend:**
```bash
# Leave empty - uses Next.js rewrites
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"
```

### Production (capsulepodhotel.com)

**Backend:**
```bash
DATABASE_URL="postgresql://podnbeyond_user:VERY_STRONG_PASSWORD@localhost:5432/podnbeyond_hotel"
FRONTEND_URL="https://capsulepodhotel.com"
POSTMARK_SERVER_TOKEN="your-production-token"  # NEVER COMMIT!
EMAIL_FROM="support@capsulepodhotel.com"
NEXTAUTH_URL="https://capsulepodhotel.com"
RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxx"  # Live keys
PORT=4000
NODE_ENV=production
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

**Frontend:**
```bash
# Leave empty - uses Next.js rewrites
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxx"
```

## 🔄 How to Rotate Exposed Secrets

If any secret is exposed in Git:

### 1. Postmark Token
```bash
# Immediately:
1. Go to https://account.postmarkapp.com/servers
2. Click on your server → "API Tokens"
3. Generate new token
4. Update .env on server (DO NOT COMMIT)
5. Restart backend: pm2 restart hotel-booking-backend
```

### 2. Database Password
```bash
# On server:
sudo -u postgres psql
ALTER USER podnbeyond_user WITH PASSWORD 'new_strong_password';
\q

# Update .env
DATABASE_URL="postgresql://podnbeyond_user:new_strong_password@localhost:5432/podnbeyond_hotel"

# Restart
pm2 restart hotel-booking-backend
```

### 3. Razorpay Keys
```bash
# Immediately:
1. Go to https://dashboard.razorpay.com/app/keys
2. Regenerate Key ID and Secret
3. Update backend .env (secret) and frontend .env.local (ID)
4. Restart both services
```

### 4. NEXTAUTH_SECRET
```bash
# Generate new secret:
openssl rand -base64 32

# Update .env
NEXTAUTH_SECRET="new-generated-secret"

# Restart
pm2 restart hotel-booking-backend
```

## ✅ Setup Checklist

### Before Deploying to ANY Environment:

- [ ] All `.env` files are in `.gitignore`
- [ ] No secrets in code files
- [ ] No secrets in documentation
- [ ] `.env.example` has only placeholder values
- [ ] Staging uses different credentials than production
- [ ] All passwords are strong (16+ characters)
- [ ] Postmark sender domain is verified
- [ ] Database backups are configured

### After Any Secret Exposure:

- [ ] Immediately rotate the exposed secret
- [ ] Update `.env` on affected servers
- [ ] Restart affected services
- [ ] Remove secret from Git history (if needed)
- [ ] Review and update .gitignore
- [ ] Document the incident

## 📞 Emergency Contacts

**If secrets are exposed:**
1. **Postmark:** Regenerate token immediately
2. **Razorpay:** Contact support + regenerate keys
3. **Database:** Change password immediately
4. **GitGuardian Alert:** Rotate the flagged secret ASAP

## 🔗 Useful Links

- **Postmark Dashboard:** https://account.postmarkapp.com/servers
- **Razorpay Dashboard:** https://dashboard.razorpay.com/
- **Generate Secrets:** `openssl rand -base64 32`
- **Check .gitignore:** `git check-ignore -v .env`


