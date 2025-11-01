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

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DEPLOY_HOST` | Your server IP | `123.456.789.012` |
| `DEPLOY_USER` | SSH username | `capsulepodhotel` |
| `DEPLOY_SSH_KEY` | Private SSH key | `-----BEGIN RSA PRIVATE KEY-----...` |
| `DEPLOY_PORT` | SSH port | `22` |
| `PROJECT_PATH` | Project directory | `/home/capsulepodhotel/htdocs/capsulepodhotel.com` |
| `DATABASE_URL` | Database connection | `postgresql://podnbeyond_user:password@localhost:5432/podnbeyond_hotel` |
| `RAZORPAY_KEY_ID` | Razorpay key | `rzp_live_your_key_id` |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | `your_secret_key` |
| `NEXT_PUBLIC_API_URL` | API URL | `https://api.capsulepodhotel.com` or `https://capsulepodhotel.com/api` |
| `HEALTH_CHECK_URL` | Health check URL | `https://api.capsulepodhotel.com/api/health` |

### Step 3: Generate SSH Key for GitHub Actions

```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions.pub capsulepodhotel@your-server-ip

# Copy private key content for GitHub secret
cat ~/.ssh/github_actions
```

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

# JWT Secret
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

```bash
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

### Step 7: Create PM2 Configuration

Create `/home/capsulepodhotel/htdocs/capsulepodhotel.com/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'podnbeyond-backend',
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
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      env_file: './backend/.env'
    },
    {
      name: 'podnbeyond-frontend',
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
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      env_file: './frontend/.env.local'
    }
  ]
};
```

### Step 8: Start Services

```bash
# Navigate to project root
cd /home/capsulepodhotel/htdocs/capsulepodhotel.com

# Create logs directory
mkdir -p logs

# Start services with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
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

The repository should already have `.github/workflows/deploy.yml`. If not, create it:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ production ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout Code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install Backend Dependencies
      working-directory: ./backend
      run: npm ci --only=production
      
    - name: Install Frontend Dependencies
      working-directory: ./frontend
      run: npm ci
      
    - name: Build Frontend
      working-directory: ./frontend
      run: npm run build
      env:
        NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
        
    - name: Deploy to Server
      uses: appleboy/ssh-action@v1.0.3
      with:
        host: ${{ secrets.DEPLOY_HOST }}
        username: ${{ secrets.DEPLOY_USER }}
        key: ${{ secrets.DEPLOY_SSH_KEY }}
        port: ${{ secrets.DEPLOY_PORT || 22 }}
        script: |
          cd ${{ secrets.PROJECT_PATH }}
          git pull origin production
          cd backend && npm ci --only=production
          npx prisma generate
          npx prisma migrate deploy
          cd ../frontend && npm ci --only=production
          npm run build
          cd ..
          pm2 restart all
          
    - name: Health Check
      run: |
        sleep 30
        curl -f ${{ secrets.HEALTH_CHECK_URL }} || exit 1
```

### Step 2: Test Automated Deployment

```bash
# Switch to production branch
git checkout production

# Make a small change
echo "# Test deployment" >> README.md

# Commit and push
git add README.md
git commit -m "Test automated deployment"
git push origin production
```

### Step 3: Monitor Deployment

1. **Go to GitHub**: Repository → **Actions** tab
2. **Check Workflow**: Look for "Deploy to Production" workflow
3. **Monitor Steps**: Watch each step complete
4. **Check Logs**: If any step fails, check the logs

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





