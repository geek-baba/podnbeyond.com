# 🚀 CloudPanel Server Setup Guide

This guide will help you configure your CloudPanel server for the Hotel Booking App deployment.

## 📋 Prerequisites

### Server Requirements
- **Operating System**: Debian 12/11 or Ubuntu 24.04/22.04 LTS
- **Architecture**: Intel x86 or ARM64
- **Minimum Specs**: 1 Core, 2GB RAM, 10GB Disk
- **Recommended**: 2+ Cores, 4GB+ RAM, 20GB+ Disk

## 🛠️ CloudPanel Installation

### 1. Install CloudPanel

```bash
# For Debian 12/11 or Ubuntu 24.04/22.04
curl -sSL https://installer.cloudpanel.io/ce/v2/install.sh | sudo bash
```

### 2. Access CloudPanel

After installation, access CloudPanel at:
- **URL**: `https://YOUR_SERVER_IP:8443`
- **Default Credentials**: 
  - Username: `admin`
  - Password: Check the installation output

## 🏗️ Site Configuration

### 1. Create New Site

1. **Login to CloudPanel**
2. **Click "Add Site"**
3. **Choose Application Type**: `Node.js`
4. **Configure Site Settings**:
   - **Domain**: `your-domain.com` (or subdomain)
   - **Node.js Version**: `18.x`
   - **Port**: `3000` (for frontend)
   - **Document Root**: `/home/cloudpanel/htdocs/your-domain.com`

### 2. Create Backend Site

Create a second site for the backend API:

1. **Add Another Site**
2. **Application Type**: `Node.js`
3. **Domain**: `api.your-domain.com` (or `your-domain.com/api`)
4. **Node.js Version**: `18.x`
5. **Port**: `4000`
6. **Document Root**: `/home/cloudpanel/htdocs/api.your-domain.com`

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

1. **In CloudPanel, go to "Databases"**
2. **Click "Add Database"**
3. **Database Type**: `PostgreSQL`
4. **Database Name**: `hotel_booking`
5. **Username**: `hotel_user`
6. **Password**: Generate a strong password
7. **Note down the connection details**

### 2. Database Connection String

Your `DATABASE_URL` will be:
```
postgresql://hotel_user:password@localhost:5432/hotel_booking
```

## 🔐 Environment Variables Setup

### 1. Create Environment File

Create `.env` files in both frontend and backend directories:

**Backend `.env`** (`/home/cloudpanel/htdocs/api.your-domain.com/.env`):
```bash
# Database
DATABASE_URL="postgresql://hotel_user:password@localhost:5432/hotel_booking"

# Razorpay
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_secret_key"

# Server
NODE_ENV="production"
PORT=4000

# CORS
CORS_ORIGIN="https://your-domain.com"
```

**Frontend `.env`** (`/home/cloudpanel/htdocs/your-domain.com/.env`):
```bash
# API Configuration
NEXT_PUBLIC_API_URL="https://api.your-domain.com"
NEXT_PUBLIC_RAZORPAY_KEY_ID="your_razorpay_key_id"

# Next.js
NODE_ENV="production"
PORT=3000
```

## 📁 File Structure Setup

### 1. Create Project Directory

```bash
# SSH into your server
ssh root@your-server-ip

# Create project directory
mkdir -p /home/cloudpanel/htdocs/hotel-booking-app
cd /home/cloudpanel/htdocs/hotel-booking-app

# Clone your repository
git clone https://github.com/geek-baba/podnbeyond.com.git .
```

### 2. Set Permissions

```bash
# Set proper ownership
chown -R cloudpanel:cloudpanel /home/cloudpanel/htdocs/hotel-booking-app

# Set proper permissions
chmod -R 755 /home/cloudpanel/htdocs/hotel-booking-app
```

## 🔧 PM2 Installation & Configuration

### 1. Install PM2 Globally

```bash
# Install PM2 globally
npm install -g pm2

# Install PM2 startup script
pm2 startup

# Save PM2 configuration
pm2 save
```

### 2. Create PM2 Ecosystem Config

Create `/home/cloudpanel/htdocs/hotel-booking-app/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'hotel-booking-backend',
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
      time: true
    },
    {
      name: 'hotel-booking-frontend',
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
      time: true
    }
  ]
};
```

## 🔒 Security Configuration

### 1. Firewall Setup

In CloudPanel:
1. **Go to "Security" → "Firewall"**
2. **Allow ports**: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000, 4000
3. **Block unnecessary ports**

### 2. SSL Certificates

1. **Go to "SSL" in CloudPanel**
2. **Add Let's Encrypt certificate** for your domains
3. **Enable automatic renewal**

### 3. Access Restrictions

1. **Go to "Security" → "Access Restriction"**
2. **Add your IP** to whitelist for CloudPanel access
3. **Configure Basic Auth** if needed

## 🚀 Initial Deployment

### 1. Manual First Deployment

```bash
# Navigate to project directory
cd /home/cloudpanel/htdocs/hotel-booking-app

# Install dependencies
cd backend && npm ci --only=production
cd ../frontend && npm ci --only=production

# Generate Prisma client
cd ../backend
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build frontend
cd ../frontend
npm run build

# Start services with PM2
cd ..
pm2 start ecosystem.config.js --env production
pm2 save
```

### 2. Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs

# Test endpoints
curl http://localhost:4000/api/health
curl http://localhost:3000
```

## 🔄 Continuous Deployment Setup

### 1. Create Deployment User

```bash
# Create deployment user
adduser deploy
usermod -aG cloudpanel deploy

# Set up SSH key for GitHub Actions
su - deploy
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Add your GitHub Actions public key here
```

### 2. Configure Git

```bash
# Configure git for deployment user
git config --global user.name "Deployment User"
git config --global user.email "deploy@your-domain.com"
```

## 📊 Monitoring Setup

### 1. PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs

# Check status
pm2 status
```

### 2. CloudPanel Monitoring

- **Resource Usage**: Monitor CPU, RAM, Disk usage
- **Logs**: Check application logs in CloudPanel
- **Backups**: Set up automated backups

## 🚨 Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   chown -R cloudpanel:cloudpanel /home/cloudpanel/htdocs/hotel-booking-app
   chmod -R 755 /home/cloudpanel/htdocs/hotel-booking-app
   ```

2. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :4000
   
   # Kill process if needed
   kill -9 <PID>
   ```

3. **Database Connection Failed**
   ```bash
   # Test database connection
   psql -h localhost -U hotel_user -d hotel_booking
   
   # Check PostgreSQL status
   sudo systemctl status postgresql
   ```

4. **PM2 Process Not Starting**
   ```bash
   # Check PM2 logs
   pm2 logs
   
   # Restart PM2 daemon
   pm2 kill
   pm2 start ecosystem.config.js
   ```

## 📞 Support

For CloudPanel-specific issues:
- **Documentation**: [CloudPanel Docs](https://www.cloudpanel.io/docs/)
- **Discord**: [CloudPanel Discord](https://discord.gg/cloudpanel)
- **GitHub**: [CloudPanel GitHub](https://github.com/cloudpanel-io/cloudpanel-ce)

---

**Last Updated**: August 2025
**Version**: 1.0.0
