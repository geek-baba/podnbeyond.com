# 🚀 Complete Deployment Guide - POD N BEYOND Hotel Booking App

This is the **ONLY** deployment guide you need. It covers everything from initial CloudPanel setup to ongoing deployments.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial CloudPanel Setup](#initial-cloudpanel-setup)
3. [GitHub Repository Setup](#github-repository-setup)
4. [First-Time Manual Deployment](#first-time-manual-deployment)
5. [Automated Deployment Setup](#automated-deployment-setup)
6. [Ongoing Deployments](#ongoing-deployments)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## 🎯 Prerequisites

### Server Requirements
- **Operating System**: Debian 12/11 or Ubuntu 24.04/22.04 LTS
- **Architecture**: Intel x86 or ARM64
- **Minimum Specs**: 2 Core, 4GB RAM, 20GB Disk
- **Recommended**: 4+ Cores, 8GB+ RAM, 50GB+ Disk

### Domain Setup
- **Primary Domain**: `capsulepodhotel.com` (your actual domain)
- **API Subdomain**: `api.capsulepodhotel.com` (optional, for separate API)

---

## 🛠️ Initial CloudPanel Setup

### Step 1: Install CloudPanel

```bash
# SSH into your server as root
ssh root@your-server-ip

# Install CloudPanel
curl -sSL https://installer.cloudpanel.io/ce/v2/install.sh | sudo bash
```

### Step 2: Access CloudPanel

1. **Open Browser**: Go to `https://your-server-ip:8443`
2. **Login**: 
   - Username: `admin`
   - Password: Check the installation output
3. **Change Default Password**: Follow the prompts

### Step 3: Create Frontend Site

1. **Click "Add Site"**
2. **Application Type**: `Node.js`
3. **Domain**: `capsulepodhotel.com`
4. **Node.js Version**: `18.x`
5. **Port**: `3000`
6. **Document Root**: `/home/capsulepodhotel/htdocs/capsulepodhotel.com` (auto-generated)

### Step 4: Create Backend Site (Optional)

If you want a separate API subdomain:

1. **Click "Add Site"** again
2. **Application Type**: `Node.js`
3. **Domain**: `api.capsulepodhotel.com`
4. **Node.js Version**: `18.x`
5. **Port**: `4000`
6. **Document Root**: `/home/capsulepodhotel-api/htdocs/api.capsulepodhotel.com`

### Step 5: Create Database

**Important**: PostgreSQL is not available in CloudPanel's GUI interface. According to the [CloudPanel GitHub issue #184](https://github.com/cloudpanel-io/cloudpanel-ce/issues/184), PostgreSQL support has been requested but is not yet implemented in the CloudPanel Community Edition.

We need to install and configure PostgreSQL manually via SSH:

#### Manual PostgreSQL Setup (Required)

```bash
# SSH into your server
ssh capsulepodhotel@your-server-ip

# Check if PostgreSQL is installed
sudo systemctl status postgresql

# If not installed, install it
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE podnbeyond_hotel;"
sudo -u postgres psql -c "CREATE USER podnbeyond_user WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE podnbeyond_hotel TO podnbeyond_user;"
sudo -u postgres psql -c "ALTER USER podnbeyond_user CREATEDB;"

# Test the connection
psql -h localhost -U podnbeyond_user -d podnbeyond_hotel -c "SELECT 1;"
```

**Note down these details:**
- **Database Name**: `podnbeyond_hotel`
- **Username**: `podnbeyond_user`
- **Password**: `your_secure_password` (replace with your actual password)
- **Host**: `localhost`
- **Port**: `5432`

---

## 🔧 GitHub Repository Setup

### Step 1: Fork/Clone Repository

```bash
# Clone your repository locally
git clone https://github.com/geek-baba/podnbeyond.com.git
cd podnbeyond.com

# Create production branch
git checkout -b production
git push origin production
```

### Step 2: Configure GitHub Secrets

**Location**: Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

**Type**: Use **Repository secrets** (not Environment secrets) - they work for all workflows and are simpler to manage.

**Note**: GitHub requires adding secrets **one by one** individually. Prepare all your values before starting.

#### 💡 Pro Tips for Adding Secrets:

1. **Prepare a text file** with all values ready before you start
2. **Copy-paste carefully** - Especially for long values like SSH keys and database URLs
3. **Double-check** - You can't view secrets after saving, only update them
4. **Test incrementally** - Add critical secrets first and test the workflow

#### Secrets to Add:

Click **"New repository secret"** for each of these:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DEPLOY_HOST` | Your server IP address | `123.45.67.89` |
| `DEPLOY_USER` | CloudPanel site username | `capsulepodhotel` |
| `DEPLOY_SSH_KEY` | Private SSH key (see Step 3) | `-----BEGIN RSA PRIVATE KEY-----...` |
| `DEPLOY_PORT` | SSH port (usually 22) | `22` |
| `PROJECT_PATH` | Project directory on server | `/home/capsulepodhotel/htdocs/capsulepodhotel.com` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://podnbeyond_user:password@localhost:5432/podnbeyond_hotel` |
| `RAZORPAY_KEY_ID` | Razorpay key (placeholder OK) | `rzp_test_placeholder123456` |
| `RAZORPAY_KEY_SECRET` | Razorpay secret (placeholder OK) | `placeholder_secret_change_later` |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | `https://api.capsulepodhotel.com` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same as RAZORPAY_KEY_ID | `rzp_test_placeholder123456` |
| `HEALTH_CHECK_URL` | Health check endpoint | `https://api.capsulepodhotel.com/api/health` |

#### 🔑 Important Notes:

- **DEPLOY_USER**: Use the CloudPanel site user (e.g., `capsulepodhotel`) - this user already owns all project files and runs PM2 processes
- **DEPLOY_SSH_KEY**: Must include the full private key with BEGIN and END markers (see Step 3 below)
- **DATABASE_URL**: Replace `password` with your actual database password from Step 5 (Create Database)
- **RAZORPAY Keys**: You can use placeholder values like `rzp_test_placeholder123456` for now and update them later before going live
  - Production keys start with `rzp_live_`
  - Test keys start with `rzp_test_`
  - **IMPORTANT**: Update these to real production keys before accepting real payments!
- **PROJECT_PATH**: Must match the document root from CloudPanel site configuration

### Step 3: Generate SSH Key for GitHub Actions

This SSH key allows GitHub Actions to connect to your server and deploy automatically.

**⚠️ IMPORTANT: Run these commands on YOUR LOCAL MACHINE** (your laptop/desktop), NOT on GitHub or the server.

#### Step 3a: Generate the SSH Key Pair

```bash
# Run this on YOUR LOCAL MACHINE (laptop/desktop)
ssh-keygen -t rsa -b 4096 -C "github-actions-capsulepodhotel" -f ~/.ssh/github_actions_capsulepodhotel

# When prompted:
# - Press Enter to accept the default location
# - Press Enter twice to skip passphrase (required for automated deployments)
```

This creates TWO files:
- `~/.ssh/github_actions_capsulepodhotel` (private key - goes to GitHub)
- `~/.ssh/github_actions_capsulepodhotel.pub` (public key - goes to server)

#### Step 3b: Copy Public Key to Server

```bash
# Copy the public key to your CloudPanel site user
ssh-copy-id -i ~/.ssh/github_actions_capsulepodhotel.pub capsulepodhotel@your-server-ip

# You'll be prompted for the password once
# After this, the key will allow passwordless SSH access
```

#### Step 3c: Test the Connection

```bash
# Test SSH connection with the new key
ssh -i ~/.ssh/github_actions_capsulepodhotel capsulepodhotel@your-server-ip

# If successful, you should connect without a password
# Type 'exit' to return to your local machine
```

**✅ If the connection works**, you're ready to proceed!

#### Step 3d: Copy Private Key for GitHub Secret

```bash
# Display the private key (still on YOUR LOCAL MACHINE)
cat ~/.ssh/github_actions_capsulepodhotel

# Copy the ENTIRE output including the BEGIN and END lines:
# -----BEGIN RSA PRIVATE KEY-----
# [many lines of key content]
# -----END RSA PRIVATE KEY-----
```

**Important**: 
- Copy the **entire** private key including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----` markers
- Paste this complete content into the `DEPLOY_SSH_KEY` secret in GitHub
- Keep this private key secure - don't share it anywhere else
- The public key (`.pub` file) is on your server and is safe to share

**Why use the site user?**
- ✅ CloudPanel site user already owns all project files
- ✅ PM2 processes run as this user naturally
- ✅ No permission issues during deployment
- ✅ Simpler, cleaner setup

---

## 🚀 First-Time Manual Deployment

### Step 1: SSH into Server

```bash
ssh capsulepodhotel@your-server-ip
```

### Step 2: Clone Repository

```bash
# Navigate to document root
cd /home/capsulepodhotel/htdocs/capsulepodhotel.com

# Clone repository
git clone https://github.com/geek-baba/podnbeyond.com.git .

# Set proper permissions
chown -R capsulepodhotel:capsulepodhotel /home/capsulepodhotel/htdocs/capsulepodhotel.com
chmod -R 755 /home/capsulepodhotel/htdocs/capsulepodhotel.com
```

### Step 3: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install PM2 globally
npm install -g pm2
```

### Step 4: Setup Environment Variables

**Backend `.env`** (`/home/capsulepodhotel/htdocs/capsulepodhotel.com/backend/.env`):
```bash
# Database
DATABASE_URL="postgresql://podnbeyond_user:your_password@localhost:5432/podnbeyond_hotel"

# Razorpay (Production Keys)
RAZORPAY_KEY_ID="rzp_live_your_production_key_id"
RAZORPAY_KEY_SECRET="your_production_secret_key"

# Server
NODE_ENV="production"
PORT=4000

# CORS
CORS_ORIGIN="https://capsulepodhotel.com"

# JWT Secret (Generate with: openssl rand -base64 64)
JWT_SECRET="your-super-secure-jwt-secret-key"

# File Uploads
UPLOAD_PATH="/home/capsulepodhotel/htdocs/capsulepodhotel.com/backend/uploads"
```

**Frontend `.env.local`** (`/home/capsulepodhotel/htdocs/capsulepodhotel.com/frontend/.env.local`):
```bash
# API Configuration
NEXT_PUBLIC_API_URL="https://api.capsulepodhotel.com"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_your_production_key_id"

# Next.js
NODE_ENV="production"
PORT=3000

# Branding
NEXT_PUBLIC_LOGO_URL="https://podnbeyond.com/wp-content/uploads/2024/01/logo.png"
```

### Step 5: Setup Database

#### 5a: Grant Database Permissions (Run as root)

First, ensure the database user has proper permissions. **SSH as root** to run these commands:

```bash
# SSH as root
ssh root@your-server-ip

# Grant schema permissions
sudo -u postgres psql -d podnbeyond_hotel << 'EOF'
GRANT ALL ON SCHEMA public TO podnbeyond_user;
ALTER SCHEMA public OWNER TO podnbeyond_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO podnbeyond_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO podnbeyond_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO podnbeyond_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO podnbeyond_user;
EOF

# Exit root session
exit
```

#### 5b: Run Migrations and Seed Data (As site user)

Now switch back to the site user and run the database setup:

```bash
# SSH as site user
ssh capsulepodhotel@your-server-ip

# Navigate to backend
cd /home/capsulepodhotel/htdocs/capsulepodhotel.com/backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial CMS data
node prisma/seed_cms.js

# Import gallery images
node scripts/import_gallery_images.js
```

### Step 6: Build Frontend

```bash
# Navigate to frontend
cd /home/capsulepodhotel/htdocs/capsulepodhotel.com/frontend

# Build for production
npm run build
```

### Step 7: Verify PM2 Configuration

The repository already includes `ecosystem.config.js` at the project root. Verify it exists:

```bash
# Navigate to project root
cd /home/capsulepodhotel/htdocs/capsulepodhotel.com

# Check if file exists
ls -la ecosystem.config.js

# View the contents (optional)
cat ecosystem.config.js
```

The file should look like this (app names may vary - `hotel-booking-*` or `podnbeyond-*` both work fine):

```javascript
module.exports = {
  apps: [
    {
      name: 'hotel-booking-backend',  // or 'podnbeyond-backend'
      script: 'server.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'hotel-booking-frontend',  // or 'podnbeyond-frontend'
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
};
```

**Note**: The file is already correctly configured - no changes needed! Just verify it exists and proceed to Step 8.

### Step 8: Start Services

```bash
# Navigate to project root
cd /home/capsulepodhotel/htdocs/capsulepodhotel.com

# Start services with PM2 (it will auto-create log directories)
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script (generates a command you need to run)
pm2 startup
```

**Important**: The `pm2 startup` command will output a `sudo` command that you need to run. It will look like:

```bash
sudo env PATH=$PATH:/home/capsulepodhotel/.nvm/versions/node/v18.x.x/bin ... pm2 startup systemd -u capsulepodhotel --hp /home/capsulepodhotel
```

**Copy and run that entire command** to enable PM2 auto-start on server reboot. You'll need sudo access or root to run it.

```

### Step 9: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs

# Test endpoints
curl http://localhost:4000/api/health
curl http://localhost:3000

# Test gallery images
curl http://localhost:4000/api/cms/images/GALLERY_IMAGE
```

---

## 🔄 Automated Deployment Setup

### Step 1: Verify GitHub Actions Workflow

The repository includes two workflow files. For CloudPanel deployments, use `deploy-cloudpanel.yml`:

```bash
# On your server, verify the workflow file exists
cd ~/htdocs/capsulepodhotel.com
ls -la .github/workflows/

# You should see:
# - deploy-cloudpanel.yml (recommended for CloudPanel)
# - deploy.yml (alternative workflow)
```

The `deploy-cloudpanel.yml` workflow is optimized for CloudPanel because it:

- ✅ Uses `rsync` for efficient file synchronization
- ✅ Leverages `ecosystem.config.js` for PM2 management
- ✅ Uses `pm2 startOrReload` instead of `pm2 restart all`
- ✅ Calls the `deploy-cloudpanel.sh` script if available
- ✅ Includes proper health checks
- ✅ Better error handling

**The workflow file already exists in your repository** - no need to create it!

### Step 2: Create Production Branch (If Needed)

The `deploy-cloudpanel.yml` workflow triggers on pushes to the `production` branch:

```bash
# Check if production branch exists
git branch -a | grep production

# If it doesn't exist, create it from main
git checkout -b production
git push origin production

# If it exists, switch to it
git checkout production
```

### Step 3: Test Automated Deployment

```bash
# Make sure you're on production branch
git checkout production

# Merge latest changes from main
git merge main

# Push to trigger deployment
git push origin production
```

### Step 4: Monitor Deployment

1. **Go to GitHub**: Repository → **Actions** tab
2. **Check Workflow**: Look for "Deploy to CloudPanel" workflow
3. **Monitor Steps**: Watch each step complete
4. **Check Logs**: If any step fails, check the logs
5. **Verify Health Check**: The workflow includes automated health checks

---

## 🔄 Ongoing Deployments

### Method 1: Automated (Recommended)

```bash
# Switch to production branch
git checkout production

# Merge your changes
git merge main

# Push to trigger deployment
git push origin production
```

### Method 2: Manual Deployment

```bash
# SSH into server
ssh capsulepodhotel@your-server-ip

# Navigate to project
cd /home/capsulepodhotel/htdocs/capsulepodhotel.com

# Pull latest changes
git pull origin production

# Install dependencies
cd backend && npm ci --only=production
cd ../frontend && npm ci --only=production

# Run database migrations
cd ../backend
npx prisma migrate deploy

# Build frontend
cd ../frontend
npm run build

# Restart services
cd ..
pm2 restart all
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Permission Denied
```bash
# Fix ownership
chown -R capsulepodhotel:capsulepodhotel /home/capsulepodhotel/htdocs/capsulepodhotel.com

# Fix permissions
chmod -R 755 /home/capsulepodhotel/htdocs/capsulepodhotel.com
chmod 755 /home/capsulepodhotel/htdocs/capsulepodhotel.com/backend/uploads
```

#### 2. Port Already in Use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :4000

# Kill process if needed
kill -9 <PID>
```

#### 3. Database Connection Failed
```bash
# Test database connection
psql -h localhost -U podnbeyond_user -d podnbeyond_hotel

# Check PostgreSQL status
sudo systemctl status postgresql

# Check Prisma connection
cd backend
npx prisma db pull
```

#### 4. PM2 Process Not Starting
```bash
# Check PM2 logs
pm2 logs

# Restart PM2 daemon
pm2 kill
pm2 start ecosystem.config.js

# Check environment variables
pm2 env podnbeyond-backend
```

#### 5. Gallery Images Not Loading
```bash
# Check if images exist
ls -la /home/capsulepodhotel/htdocs/capsulepodhotel.com/backend/uploads/

# Re-import images if needed
cd backend
node scripts/import_gallery_images.js

# Check file permissions
chmod 644 /home/capsulepodhotel/htdocs/capsulepodhotel.com/backend/uploads/*
```

### Debugging Steps

1. **Check PM2 Status**: `pm2 status`
2. **View Logs**: `pm2 logs`
3. **Test Endpoints**: `curl http://localhost:4000/api/health`
4. **Check Environment**: `pm2 env podnbeyond-backend`
5. **Verify Database**: `npx prisma db pull`

---

## 🔧 Maintenance

### Regular Tasks

#### 1. Database Backups
```bash
# Create backup script
pg_dump -h localhost -U podnbeyond_user podnbeyond_hotel > backup_$(date +%Y%m%d).sql
```

#### 2. Log Rotation
```bash
# Configure logrotate for PM2 logs
sudo nano /etc/logrotate.d/pm2
```

#### 3. Security Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Node.js dependencies
cd /home/capsulepodhotel/htdocs/capsulepodhotel.com
npm audit fix
```

#### 4. Performance Monitoring
```bash
# Monitor memory usage
pm2 monit

# Check disk space
df -h

# Monitor database performance
# Use CloudPanel's built-in monitoring
```

### Monitoring Commands

```bash
# PM2 monitoring
pm2 monit          # Real-time monitoring
pm2 status          # Process status
pm2 logs            # View logs
pm2 restart all     # Restart all processes

# Application health
curl https://api.capsulepodhotel.com/api/health
curl https://capsulepodhotel.com

# Database health
psql -h localhost -U podnbeyond_user -d podnbeyond_hotel -c "SELECT 1;"
```

---

## 📞 Support

### For CloudPanel Issues
- **Documentation**: [CloudPanel Docs](https://www.cloudpanel.io/docs/)
- **Discord**: [CloudPanel Discord](https://discord.gg/cloudpanel)
- **GitHub**: [CloudPanel GitHub](https://github.com/cloudpanel-io/cloudpanel-ce)

### For POD N BEYOND App Issues
- **Email**: info@podnbeyond.com
- **Phone**: (91) 82350 71333
- **Website**: https://podnbeyond.com

---

## 🗑️ Cleanup Old Guides

After following this guide, you can delete the old deployment guides to avoid confusion:

```bash
# Delete old guides (optional)
rm CLOUDPANEL_SETUP.md
rm DEPLOYMENT.md
rm GITHUB_ACTIONS_DEPLOYMENT.md
```

---

**Last Updated**: August 2025  
**Version**: 3.0.0  
**Compatible with**: POD N BEYOND Hotel Booking App v2.0+

> **Note**: This is the ONLY deployment guide you need. All other deployment guides are deprecated and should be removed to avoid confusion.





