# 🚀 CloudPanel Server Setup Guide

This guide will help you configure your CloudPanel server for the POD N BEYOND Hotel Booking App deployment.

## 📋 Prerequisites

### Server Requirements
- **Operating System**: Debian 12/11 or Ubuntu 24.04/22.04 LTS
- **Architecture**: Intel x86 or ARM64
- **Minimum Specs**: 2 Core, 4GB RAM, 20GB Disk
- **Recommended**: 4+ Cores, 8GB+ RAM, 50GB+ Disk (for production)

### Software Requirements
- **Node.js**: 18.x or higher
- **PostgreSQL**: 14+ (for database)
- **PM2**: For process management
- **Git**: For deployment

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
4. **Database Name**: `podnbeyond_hotel`
5. **Username**: `podnbeyond_user`
6. **Password**: Generate a strong password
7. **Note down the connection details**

### 2. Database Connection String

Your `DATABASE_URL` will be:
```
postgresql://podnbeyond_user:password@localhost:5432/podnbeyond_hotel
```

## 🔐 Environment Variables Setup

### 1. Create Environment File

Create `.env` files in both frontend and backend directories:

**Backend `.env`** (`/home/cloudpanel/htdocs/api.your-domain.com/.env`):
```bash
# Database
DATABASE_URL="postgresql://podnbeyond_user:password@localhost:5432/podnbeyond_hotel"

# Razorpay (Production Keys)
RAZORPAY_KEY_ID="rzp_live_your_production_key_id"
RAZORPAY_KEY_SECRET="your_production_secret_key"

# Server
NODE_ENV="production"
PORT=4000

# CORS
CORS_ORIGIN="https://your-domain.com"

# JWT Secret
JWT_SECRET="your-super-secure-jwt-secret-key"

# File Uploads
UPLOAD_PATH="/home/cloudpanel/htdocs/api.your-domain.com/uploads"
```

**Frontend `.env.local`** (`/home/cloudpanel/htdocs/your-domain.com/.env.local`):
```bash
# API Configuration
NEXT_PUBLIC_API_URL="https://api.your-domain.com"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_your_production_key_id"

# Next.js
NODE_ENV="production"
PORT=3000

# Branding
NEXT_PUBLIC_LOGO_URL="https://podnbeyond.com/wp-content/uploads/2024/01/logo.png"
```

## 📁 File Structure Setup

### 1. Create Project Directory

```bash
# SSH into your server
ssh root@your-server-ip

# Create project directory
mkdir -p /home/cloudpanel/htdocs/podnbeyond-app
cd /home/cloudpanel/htdocs/podnbeyond-app

# Clone your repository
git clone https://github.com/geek-baba/podnbeyond.com.git .
```

### 2. Set Permissions

```bash
# Set proper ownership
chown -R cloudpanel:cloudpanel /home/cloudpanel/htdocs/podnbeyond-app

# Set proper permissions
chmod -R 755 /home/cloudpanel/htdocs/podnbeyond-app

# Create uploads directory with proper permissions
mkdir -p /home/cloudpanel/htdocs/podnbeyond-app/backend/uploads
chmod 755 /home/cloudpanel/htdocs/podnbeyond-app/backend/uploads
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

Create `/home/cloudpanel/htdocs/podnbeyond-app/ecosystem.config.js`:

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

## 🚀 Initial Deployment

### 1. Manual First Deployment

```bash
# Navigate to project directory
cd /home/cloudpanel/htdocs/podnbeyond-app

# Install dependencies for both projects
npm run install:all

# Generate Prisma client
cd backend
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial CMS data
node prisma/seed_cms.js

# Import gallery images
node scripts/import_gallery_images.js

# Build frontend
cd ../frontend
npm run build

# Create logs directory
cd ..
mkdir -p logs

# Start services with PM2
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

# Test gallery images
curl http://localhost:4000/api/cms/images/GALLERY_IMAGE
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

### 3. GitHub Actions Workflow

The project includes a GitHub Actions workflow for automated deployment. Ensure your repository has the following secrets configured:

- `CLOUDPANEL_HOST`: Your server IP
- `CLOUDPANEL_USER`: Deployment username
- `CLOUDPANEL_SSH_KEY`: Private SSH key for deployment
- `DATABASE_URL`: Production database URL
- `RAZORPAY_KEY_ID`: Production Razorpay key
- `RAZORPAY_KEY_SECRET`: Production Razorpay secret

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

### 4. File Upload Security

```bash
# Secure uploads directory
chmod 755 /home/cloudpanel/htdocs/podnbeyond-app/backend/uploads
chown cloudpanel:cloudpanel /home/cloudpanel/htdocs/podnbeyond-app/backend/uploads

# Configure nginx to serve uploads securely
# Add to your nginx configuration if needed
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

# Monitor specific app
pm2 logs podnbeyond-backend
pm2 logs podnbeyond-frontend
```

### 2. CloudPanel Monitoring

- **Resource Usage**: Monitor CPU, RAM, Disk usage
- **Logs**: Check application logs in CloudPanel
- **Backups**: Set up automated backups

### 3. Application Health Checks

```bash
# Health check endpoint
curl https://api.your-domain.com/api/health

# Database connection test
curl https://api.your-domain.com/api/cms/content/all

# Gallery images test
curl https://api.your-domain.com/api/cms/images/GALLERY_IMAGE
```

## 🚨 Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   chown -R cloudpanel:cloudpanel /home/cloudpanel/htdocs/podnbeyond-app
   chmod -R 755 /home/cloudpanel/htdocs/podnbeyond-app
   chmod 755 /home/cloudpanel/htdocs/podnbeyond-app/backend/uploads
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
   psql -h localhost -U podnbeyond_user -d podnbeyond_hotel
   
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check Prisma connection
   cd backend
   npx prisma db pull
   ```

4. **PM2 Process Not Starting**
   ```bash
   # Check PM2 logs
   pm2 logs
   
   # Restart PM2 daemon
   pm2 kill
   pm2 start ecosystem.config.js
   
   # Check environment variables
   pm2 env podnbeyond-backend
   ```

5. **Gallery Images Not Loading**
   ```bash
   # Check if images exist
   ls -la /home/cloudpanel/htdocs/podnbeyond-app/backend/uploads/
   
   # Re-import images if needed
   cd backend
   node scripts/import_gallery_images.js
   
   # Check file permissions
   chmod 644 /home/cloudpanel/htdocs/podnbeyond-app/backend/uploads/*
   ```

6. **Razorpay Payment Issues**
   ```bash
   # Verify environment variables
   echo $RAZORPAY_KEY_ID
   echo $RAZORPAY_KEY_SECRET
   
   # Test payment endpoint
   curl -X POST https://api.your-domain.com/api/payment/create-order \
     -H "Content-Type: application/json" \
     -d '{"amount": 1000, "guestName": "Test User", "bookingId": 1}'
   ```

## 🔄 Maintenance

### Regular Tasks

1. **Database Backups**
   ```bash
   # Create backup script
   pg_dump -h localhost -U podnbeyond_user podnbeyond_hotel > backup_$(date +%Y%m%d).sql
   ```

2. **Log Rotation**
   ```bash
   # Configure logrotate for PM2 logs
   sudo nano /etc/logrotate.d/pm2
   ```

3. **Security Updates**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade
   
   # Update Node.js dependencies
   cd /home/cloudpanel/htdocs/podnbeyond-app
   npm audit fix
   ```

4. **Performance Monitoring**
   ```bash
   # Monitor memory usage
   pm2 monit
   
   # Check disk space
   df -h
   
   # Monitor database performance
   # Use CloudPanel's built-in monitoring
   ```

## 📞 Support

For CloudPanel-specific issues:
- **Documentation**: [CloudPanel Docs](https://www.cloudpanel.io/docs/)
- **Discord**: [CloudPanel Discord](https://discord.gg/cloudpanel)
- **GitHub**: [CloudPanel GitHub](https://github.com/cloudpanel-io/cloudpanel-ce)

For POD N BEYOND Hotel Booking App issues:
- **Email**: info@podnbeyond.com
- **Phone**: (91) 82350 71333
- **Website**: https://podnbeyond.com

---

**Last Updated**: August 2025
**Version**: 2.0.0
**Compatible with**: POD N BEYOND Hotel Booking App v2.0+
