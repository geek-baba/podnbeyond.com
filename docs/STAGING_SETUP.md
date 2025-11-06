# Staging Environment Setup Guide

## 🎯 Purpose

Create a staging environment that **exactly matches production** to catch deployment issues before they affect users.

## 📋 Benefits of Staging

- ✅ Test in production-like environment (same OS, Node version, nginx)
- ✅ Catch missing environment variables before production
- ✅ Test email delivery with real SMTP
- ✅ Test CORS/proxy configurations
- ✅ Validate GitHub Actions deployments
- ✅ Safe rollback testing

## 🚀 CloudPanel Staging Setup

### Step 1: Create Staging Site in CloudPanel

1. Log in to CloudPanel: `https://your-server-ip:8443`
2. Go to **Sites** → **Add Site**
3. Configure:
   - **Domain Name**: `staging.capsulepodhotel.com`
   - **Site Type**: Node.js
   - **Node.js Version**: 22.x (same as production)
   - **Document Root**: `/home/capsulepodhotel/htdocs/staging.capsulepodhotel.com`

### Step 2: Configure DNS

Add A record for staging subdomain:
```
Type: A
Name: staging
Value: 45.76.60.99
TTL: Auto
```

### Step 3: Clone Repository

```bash
ssh -i ~/.ssh/github_actions_capsulepodhotel capsulepodhotel@45.76.60.99

cd /home/capsulepodhotel/htdocs/staging.capsulepodhotel.com
git clone https://github.com/geek-baba/podnbeyond.com.git .
git checkout main  # Staging uses 'main' branch
```

### Step 4: Setup Backend (Staging)

```bash
cd backend

# Copy production .env and modify for staging
cp ../capsulepodhotel.com/backend/.env .env

# Edit .env for staging:
nano .env
```

**Required Changes in `.env`:**
```bash
# Frontend URL (CRITICAL!)
FRONTEND_URL=https://staging.capsulepodhotel.com

# Database (option 1: use production DB in read-only mode)
DATABASE_URL=postgresql://podnbeyond_user:password@localhost:5432/podnbeyond_hotel

# Database (option 2: create separate staging DB - RECOMMENDED)
DATABASE_URL=postgresql://podnbeyond_staging:password@localhost:5432/podnbeyond_staging

# Postmark (use same or test credentials)
POSTMARK_SERVER_TOKEN="c169e5e4-3296-4057-85ed-c51a2cbeca89"
EMAIL_FROM="staging@capsulepodhotel.com"  # Optional: different sender

# Port (use different port)
PORT=4001
```

**Install and Start:**
```bash
npm install
npx prisma generate
npx prisma migrate deploy  # If using separate DB

# Start with PM2
pm2 start server.js --name staging-backend
pm2 save
```

### Step 5: Setup Frontend (Staging)

```bash
cd ../frontend

# Create .env.local for staging
cat > .env.local << EOF
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_placeholder123456
# NO NEXT_PUBLIC_API_URL - uses Next.js rewrites
EOF

# Install and build
npm install
npm run build

# Start with PM2
pm2 start npm --name staging-frontend -- start
pm2 save
```

### Step 6: Configure Nginx (via CloudPanel)

CloudPanel should auto-configure nginx, but verify it includes:

```nginx
location /api/ {
    proxy_pass http://localhost:4001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
}
```

### Step 7: SSL Certificate

CloudPanel auto-generates Let's Encrypt SSL:
1. In CloudPanel, go to staging site settings
2. Click **SSL/TLS** → **Let's Encrypt**
3. Generate certificate

## 🔄 Git Workflow with Staging

### Branch Strategy

```
main        → Auto-deploy to Staging
production  → Manual deploy to Production
feature/*   → Local development
```

### Deployment Flow

```
Developer (Local)
    ↓ git push origin main
GitHub (main branch)
    ↓ GitHub Actions
Staging (staging.capsulepodhotel.com)
    ↓ Manual testing + approval
    ↓ git merge main → production
Production (capsulepodhotel.com)
```

### Update GitHub Actions

`.github/workflows/deploy-staging.yml`:
```yaml
name: Deploy to Staging

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Staging
        uses: appleboy/ssh-action@master
        with:
          host: 45.76.60.99
          username: capsulepodhotel
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/capsulepodhotel/htdocs/staging.capsulepodhotel.com
            git pull origin main
            
            # Backend
            cd backend
            npm ci --only=production
            npx prisma generate
            npx prisma migrate deploy
            pm2 restart staging-backend
            
            # Frontend
            cd ../frontend
            npm ci
            npm run build
            pm2 restart staging-frontend
```

`.github/workflows/deploy-production.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [production]
  workflow_dispatch:  # Manual trigger

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production  # Requires approval
    steps:
      # ... same as current deploy script
```

## ✅ Testing Checklist

Before deploying to production, test on staging:

### Authentication
- [ ] OTP email received
- [ ] OTP login works
- [ ] Session persists
- [ ] Logout works

### Email System
- [ ] Test email delivery
- [ ] Check Postmark activity
- [ ] Verify from address

### Admin Functions
- [ ] Email Center accessible
- [ ] User info displays correctly
- [ ] All admin routes work

### Performance
- [ ] No 500 errors
- [ ] CORS working
- [ ] Rate limiting functional
- [ ] Images loading

## 🔧 Environment Variable Checklist

Create `docs/ENV_VARS.md`:

### Backend Required Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Email (Postmark)
POSTMARK_SERVER_TOKEN="your-token"
POSTMARK_WEBHOOK_SECRET="webhook-secret"
EMAIL_FROM="support@capsulepodhotel.com"
MAIL_FROM="support@capsulepodhotel.com"

# Frontend CORS
FRONTEND_URL=https://capsulepodhotel.com

# Payment (if enabled)
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...

# Server
PORT=4000
```

### Frontend Required Variables
```bash
# Payment
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...

# API URL - LEAVE EMPTY for production (uses Next.js rewrites)
# NEXT_PUBLIC_API_URL=  # Commented out or empty
```

## 🏠 Alternative: Local Staging (Optional)

If you prefer a local staging environment:

### Option 1: Docker Compose (Recommended)

`docker-compose.staging.yml`:
```yaml
version: '3.8'
services:
  backend:
    image: node:22.21.1-alpine
    working_dir: /app
    volumes:
      - ./backend:/app
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/staging
    ports:
      - "4001:4000"
    command: npm start
    
  frontend:
    image: node:22.21.1-alpine
    working_dir: /app
    volumes:
      - ./frontend:/app
    ports:
      - "3001:3000"
    command: npm run build && npm start
    
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: staging
```

### Option 2: Match Node Versions

```bash
# On your Mac
nvm install 22.21.1
nvm use 22.21.1
nvm alias default 22.21.1
```

## 🎯 Next Steps

1. **Immediate**: Set up staging environment on CloudPanel
2. **Week 1**: Test all features on staging
3. **Week 2**: Update GitHub Actions for auto-staging deployment
4. **Ongoing**: Always test on staging before production

## 📞 Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs staging-backend`
2. Check nginx logs: `/var/log/nginx/error.log`
3. Verify environment variables: `cat backend/.env`
4. Test API directly: `curl http://localhost:4001/api/health`

