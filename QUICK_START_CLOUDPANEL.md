# 🚀 Quick Start: CloudPanel Setup

This guide will help you quickly set up your POD N BEYOND Hotel Booking App on CloudPanel using our interactive setup script.

## 📋 Prerequisites

Before running the setup script, ensure you have:

1. **CloudPanel installed** on your server
2. **Node.js 18+** installed
3. **PostgreSQL** installed and running
4. **Git** installed
5. **Your Razorpay production keys** ready (optional - can be added later)
6. **Your domain names** ready

## 🎯 Quick Setup (5 Minutes)

### Step 1: Download the Project

```bash
# SSH into your CloudPanel server
ssh root@your-server-ip

# Clone the repository
git clone https://github.com/geek-baba/podnbeyond.com.git
cd podnbeyond.com
```

### Step 2: Run the Interactive Setup Script

```bash
# Make the script executable (if not already)
chmod +x scripts/setup-cloudpanel-interactive.sh

# Run the interactive setup
./scripts/setup-cloudpanel-interactive.sh
```

### Step 3: Follow the Interactive Prompts

The script will guide you through:

1. **Domain Configuration**
   - Main domain (e.g., `podnbeyond.com`)
   - API subdomain (e.g., `api.podnbeyond.com`)

2. **Database Setup**
   - Database name and user (auto-generated)
   - Secure password (auto-generated)

3. **Razorpay Configuration** (Optional)
   - Production Key ID (starts with `rzp_live_`)
   - Production Secret Key
   - Can be skipped and added later

4. **Security Setup**
   - JWT secret (auto-generated)
   - Admin email

5. **Project Directory**
   - Installation path (default: `/home/cloudpanel/htdocs/podnbeyond-app`)

### Step 4: Complete CloudPanel Configuration

After the script completes, configure in CloudPanel:

1. **Create Sites**
   - Main site: `your-domain.com` (port 3000)
   - API site: `api.your-domain.com` (port 4000)

2. **Set up SSL Certificates**
   - Add Let's Encrypt certificates for both domains

3. **Configure DNS**
   - Point your domains to your server IP

## 🔧 What the Script Does

The interactive setup script automatically:

✅ **System Requirements Check**
- Verifies Node.js, npm, Git installation
- Checks project structure
- Validates OS compatibility

✅ **Configuration Collection**
- Collects domain information
- Generates secure passwords
- Validates email addresses
- Saves configuration to `cloudpanel-config.env`

✅ **Database Setup**
- Creates PostgreSQL database and user
- Sets proper permissions
- Handles manual setup if needed

✅ **Project Installation**
- Copies project files to production directory
- Sets proper file permissions
- Creates uploads and logs directories

✅ **Environment Configuration**
- Creates backend `.env` file
- Creates frontend `.env.local` file
- Sets secure file permissions

✅ **Dependencies Installation**
- Installs backend dependencies
- Generates Prisma client
- Runs database migrations
- Seeds initial CMS data
- Imports gallery images
- Builds frontend

✅ **Process Management**
- Installs PM2 globally
- Creates PM2 ecosystem configuration
- Starts backend and frontend services
- Sets up auto-restart on boot

✅ **Utility Scripts**
- Creates deployment script (`deploy.sh`)
- Creates health check script (`health-check.sh`)

## 🎉 After Setup

Once the script completes, you'll have:

- **Main Website**: `https://your-domain.com`
- **Admin Dashboard**: `https://your-domain.com/admin`
- **CMS Management**: `https://your-domain.com/admin/cms`
- **API Endpoints**: `https://api.your-domain.com/api/*`

## 🛠️ Useful Commands

```bash
# Check service status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all

# Health check
./health-check.sh

# Deploy updates
./deploy.sh
```

## 🔍 Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   sudo chown -R cloudpanel:cloudpanel /home/cloudpanel/htdocs/podnbeyond-app
   ```

2. **Port Already in Use**
   ```bash
   pm2 kill
   pm2 start ecosystem.config.js
   ```

3. **Database Connection Failed**
   ```bash
   sudo systemctl status postgresql
   sudo -u postgres psql -c "SELECT 1;"
   ```

4. **Gallery Images Not Loading**
   ```bash
   cd backend
   node scripts/import_gallery_images.js
   ```

### Getting Help

- **Email**: info@podnbeyond.com
- **Phone**: (91) 82350 71333
- **Website**: https://podnbeyond.com

## 📝 Configuration File

The script creates `cloudpanel-config.env` with all your settings:

```bash
# View configuration
cat cloudpanel-config.env

# Edit configuration (if needed)
nano cloudpanel-config.env
```

## 🔄 Updating the Application

To update your application:

```bash
# Navigate to project directory
cd /home/cloudpanel/htdocs/podnbeyond-app

# Run deployment script
./deploy.sh
```

Or manually:

```bash
# Pull latest changes
git pull origin production

# Install dependencies
cd backend && npm ci --only=production
cd ../frontend && npm ci --only=production && npm run build

# Restart services
pm2 restart all
```

## 💳 Adding Razorpay Keys Later

If you skipped Razorpay configuration during setup, you can add them later:

```bash
# Navigate to project directory
cd /home/cloudpanel/htdocs/podnbeyond-app

# Run the Razorpay keys update script
./scripts/update-razorpay-keys.sh
```

This script will:
- Find your project directory automatically
- Show current Razorpay configuration
- Guide you through adding new keys
- Update both backend and frontend environment files
- Restart services automatically
- Create backups of existing configuration

---

**🎯 That's it!** Your POD N BEYOND Hotel Booking App is now ready for production use on CloudPanel.

**Last Updated**: August 2025
**Script Version**: 2.0.0
