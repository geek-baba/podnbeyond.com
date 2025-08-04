# GitHub Actions Deployment Guide

## Overview

This document explains the GitHub Actions workflow for automatically deploying your hotel booking application to production when you push to the `production` branch.

## Workflow File: `.github/workflows/deploy.yml`

### What the Workflow Does

The deployment workflow performs the following steps:

1. **Triggers**: Runs on push to `production` branch or manual trigger
2. **Environment Setup**: Sets up Node.js 18 with npm caching
3. **Dependency Installation**: Installs backend and frontend dependencies
4. **Frontend Build**: Builds the Next.js frontend application
5. **Server Deployment**: Deploys to your server via SSH
6. **Database Migration**: Runs Prisma migrations
7. **Service Restart**: Restarts PM2 processes
8. **Health Check**: Verifies deployment success

### Workflow Steps Explained

#### 1. Checkout Code
```yaml
- name: Checkout Code
  uses: actions/checkout@v4
```
- Clones your repository to the GitHub Actions runner

#### 2. Setup Node.js
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm'
```
- Installs Node.js 18
- Enables npm caching for faster builds

#### 3. Install Backend Dependencies
```yaml
- name: Install Backend Dependencies
  working-directory: ./backend
  run: |
    npm ci --only=production
    npm install -g pm2
```
- Installs production dependencies for backend
- Installs PM2 globally for process management

#### 4. Install Frontend Dependencies
```yaml
- name: Install Frontend Dependencies
  working-directory: ./frontend
  run: npm ci
```
- Installs all dependencies for the Next.js frontend

#### 5. Build Frontend
```yaml
- name: Build Frontend
  working-directory: ./frontend
  run: npm run build
  env:
    NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
```
- Builds the production version of your Next.js app
- Uses environment variable for API URL

#### 6. Deploy to Server
```yaml
- name: Deploy to Server
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.DEPLOY_HOST }}
    username: ${{ secrets.DEPLOY_USER }}
    key: ${{ secrets.DEPLOY_SSH_KEY }}
    port: ${{ secrets.DEPLOY_PORT || 22 }}
    script: |
      # Deployment script runs on your server
```
- Connects to your server via SSH
- Runs deployment commands on the server

#### 7. Health Check
```yaml
- name: Health Check
  run: |
    sleep 30
    curl -f ${{ secrets.HEALTH_CHECK_URL }} || exit 1
```
- Waits 30 seconds for services to start
- Verifies the application is responding

## Required GitHub Secrets

You need to configure these secrets in your GitHub repository:

### 1. Server Connection Secrets

#### `DEPLOY_HOST`
- **Description**: Your server's IP address or domain name
- **Example**: `123.456.789.012` or `your-server.com`
- **How to get**: From your hosting provider or server

#### `DEPLOY_USER`
- **Description**: SSH username for your server
- **Example**: `root`, `ubuntu`, `deploy`
- **How to get**: Your server's SSH username

#### `DEPLOY_SSH_KEY`
- **Description**: Private SSH key for server access
- **Format**: Private key content (not the public key)
- **How to generate**:
  ```bash
  ssh-keygen -t rsa -b 4096 -C "github-actions"
  # Copy the content of ~/.ssh/id_rsa (private key)
  ```

#### `DEPLOY_PORT` (Optional)
- **Description**: SSH port (defaults to 22 if not set)
- **Example**: `22`, `2222`
- **Default**: `22`

### 2. Application Configuration Secrets

#### `PROJECT_PATH`
- **Description**: Full path to your project directory on the server
- **Example**: `/var/www/hotel-booking` or `/home/deploy/podnbeyond.com`
- **How to get**: Where you cloned your repository on the server

#### `NEXT_PUBLIC_API_URL`
- **Description**: Public URL for your backend API
- **Example**: `https://api.yourdomain.com` or `https://yourdomain.com/api`
- **Used in**: Frontend build process

#### `HEALTH_CHECK_URL`
- **Description**: URL to check if deployment was successful
- **Example**: `https://yourdomain.com/api/health` or `https://yourdomain.com`
- **Purpose**: Verifies the application is running after deployment

## How to Set Up GitHub Secrets

### Step 1: Access Repository Settings
1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**

### Step 2: Add Each Secret
1. Click **New repository secret**
2. Enter the secret name (e.g., `DEPLOY_HOST`)
3. Enter the secret value
4. Click **Add secret**

### Step 3: Required Secrets List
Add these secrets in order:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DEPLOY_HOST` | Server IP/domain | `123.456.789.012` |
| `DEPLOY_USER` | SSH username | `ubuntu` |
| `DEPLOY_SSH_KEY` | Private SSH key | `-----BEGIN RSA PRIVATE KEY-----...` |
| `DEPLOY_PORT` | SSH port (optional) | `22` |
| `PROJECT_PATH` | Project directory path | `/var/www/hotel-booking` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.yourdomain.com` |
| `HEALTH_CHECK_URL` | Health check URL | `https://yourdomain.com/api/health` |

## Server Setup Requirements

### 1. SSH Access
- SSH server running on your deployment server
- SSH key authentication configured
- User has sudo privileges (if needed)

### 2. Node.js and npm
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### 3. PM2 Process Manager
```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

### 4. Git
```bash
# Install Git
sudo apt-get update
sudo apt-get install git

# Configure Git (if needed)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 5. Project Directory
```bash
# Create project directory
sudo mkdir -p /var/www/hotel-booking
sudo chown $USER:$USER /var/www/hotel-booking

# Clone your repository
cd /var/www/hotel-booking
git clone https://github.com/yourusername/podnbeyond.com.git .
```

## Database Setup

### PostgreSQL
```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb podnbeyond

# Create user (optional)
sudo -u postgres createuser --interactive
```

### Environment Variables
Create `.env` file in your backend directory:
```bash
cd /var/www/hotel-booking/backend
nano .env
```

Add your environment variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/podnbeyond"
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
PORT=4000
```

## Manual Deployment Test

### Step 1: Test SSH Connection
```bash
ssh -i ~/.ssh/your_private_key username@your-server-ip
```

### Step 2: Test Project Path
```bash
cd /var/www/hotel-booking
ls -la  # Should show your project files
```

### Step 3: Test Dependencies
```bash
cd backend
npm install
cd ../frontend
npm install
npm run build
```

### Step 4: Test PM2
```bash
cd /var/www/hotel-booking/backend
pm2 start server.js --name hotel-booking-backend
pm2 status
pm2 stop hotel-booking-backend
```

## Troubleshooting

### Common Issues

#### 1. SSH Connection Failed
- **Check**: SSH key permissions (should be 600)
- **Fix**: `chmod 600 ~/.ssh/id_rsa`
- **Check**: Server firewall settings
- **Check**: SSH service is running

#### 2. Permission Denied
- **Check**: User has write permissions to project directory
- **Fix**: `sudo chown -R $USER:$USER /var/www/hotel-booking`

#### 3. Node.js Version Mismatch
- **Check**: Server has Node.js 18 installed
- **Fix**: Update Node.js on server

#### 4. Database Connection Failed
- **Check**: PostgreSQL is running
- **Check**: Database exists and credentials are correct
- **Fix**: `sudo systemctl start postgresql`

#### 5. PM2 Process Not Starting
- **Check**: PM2 is installed globally
- **Check**: Port 4000 is available
- **Fix**: `pm2 delete all && pm2 start server.js`

### Debugging Workflow

#### 1. Check Workflow Logs
- Go to **Actions** tab in GitHub
- Click on the failed workflow run
- Check each step's logs

#### 2. Manual SSH Test
```bash
ssh -i ~/.ssh/your_key username@your-server
cd /var/www/hotel-booking
git pull origin production
```

#### 3. Check Server Logs
```bash
pm2 logs hotel-booking-backend
pm2 logs hotel-booking-frontend
```

## Security Best Practices

### 1. SSH Key Security
- Use dedicated SSH key for GitHub Actions
- Set proper permissions: `chmod 600`
- Don't share private keys

### 2. Environment Variables
- Never commit `.env` files
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly

### 3. Server Security
- Keep server updated
- Use firewall (UFW)
- Regular security patches

### 4. Database Security
- Use strong passwords
- Limit database access
- Regular backups

## Monitoring and Maintenance

### 1. PM2 Monitoring
```bash
pm2 monit          # Real-time monitoring
pm2 status          # Process status
pm2 logs            # View logs
pm2 restart all     # Restart all processes
```

### 2. Log Management
```bash
# View application logs
pm2 logs hotel-booking-backend --lines 100
pm2 logs hotel-booking-frontend --lines 100

# Clear logs
pm2 flush
```

### 3. Backup Strategy
```bash
# Database backup
pg_dump podnbeyond > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /var/www/hotel-booking
```

## Next Steps

1. **Set up all required secrets** in GitHub repository
2. **Configure your server** with required software
3. **Test manual deployment** first
4. **Create production branch** and push to trigger deployment
5. **Monitor deployment** in GitHub Actions tab
6. **Set up monitoring** and alerting for production

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Test manual deployment steps
4. Verify all secrets are correctly configured
5. Check server logs and PM2 status 