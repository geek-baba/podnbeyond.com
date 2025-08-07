# 🚀 Hotel Booking App Deployment Guide

This guide covers deployment of the Hotel Booking App to production using GitHub Actions and CloudPanel.

## 📋 Prerequisites

### Server Requirements
- **Node.js 18+** installed
- **PM2** for process management
- **PostgreSQL** database
- **Git** for code deployment
- **SSH access** configured

### Required Environment Variables
The following environment variables must be configured in your server:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hotel_booking"

# Razorpay (Payment Gateway)
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_secret_key"

# Frontend Environment
NEXT_PUBLIC_API_URL="https://your-domain.com/api"
NEXT_PUBLIC_RAZORPAY_KEY_ID="your_razorpay_key_id"

# Server Configuration
NODE_ENV="production"
PORT=4000  # Backend
FRONTEND_PORT=3000  # Frontend
```

## 🔧 GitHub Actions Setup

### Required Secrets
Configure these secrets in your GitHub repository (Settings > Secrets and variables > Actions):

```yaml
# Server Access
DEPLOY_HOST: "your-server-ip"
DEPLOY_USER: "your-ssh-username"
DEPLOY_SSH_KEY: "your-private-ssh-key"
DEPLOY_PORT: "22"  # Optional, defaults to 22

# Project Path
PROJECT_PATH: "/path/to/your/project"

# Environment Variables
DATABASE_URL: "postgresql://username:password@localhost:5432/hotel_booking"
RAZORPAY_KEY_ID: "your_razorpay_key_id"
RAZORPAY_KEY_SECRET: "your_razorpay_secret_key"
NEXT_PUBLIC_API_URL: "https://your-domain.com/api"
NEXT_PUBLIC_RAZORPAY_KEY_ID: "your_razorpay_key_id"

# Health Check URLs
HEALTH_CHECK_URL: "https://your-domain.com/api/health"
FRONTEND_URL: "https://your-domain.com"
BACKEND_URL: "https://your-domain.com/api"
```

## 🚀 Deployment Process

### 1. Automatic Deployment (GitHub Actions)

The deployment is triggered automatically when you push to the `production` branch:

```bash
# Switch to production branch
git checkout production

# Merge your changes
git merge main

# Push to trigger deployment
git push origin production
```

### 2. Manual Deployment

If you need to deploy manually on the server:

```bash
# Navigate to project directory
cd /path/to/your/project

# Run deployment script
./scripts/deploy.sh
```

### 3. Manual PM2 Management

```bash
# Start services
pm2 start ecosystem.config.js --env production

# Monitor services
pm2 monit

# View logs
pm2 logs

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Delete services
pm2 delete all
```

## 📁 Project Structure

```
hotel-booking-app/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma
│   └── routes/
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   └── pages/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── ecosystem.config.js
├── scripts/
│   └── deploy.sh
└── package.json
```

## 🔄 Deployment Workflow

### GitHub Actions Steps:

1. **Checkout Code** - Pulls latest code from production branch
2. **Setup Node.js** - Installs Node.js 18
3. **Install Dependencies** - Installs both frontend and backend dependencies
4. **Build Frontend** - Builds Next.js application
5. **Generate Prisma Client** - Generates Prisma client for database access
6. **Deploy to Server** - SSH into server and deploy
7. **Health Check** - Verifies deployment success

### Server Deployment Steps:

1. **Pull Latest Changes** - Updates code from production branch
2. **Install Backend Dependencies** - `npm ci --only=production`
3. **Generate Prisma Client** - `npx prisma generate`
4. **Run Database Migrations** - `npx prisma migrate deploy`
5. **Install Frontend Dependencies** - `npm ci --only=production`
6. **Build Frontend** - `npm run build`
7. **Restart Services** - PM2 process management
8. **Health Check** - Verify services are running

## 🗄️ Database Setup

### PostgreSQL Database

```sql
-- Create database
CREATE DATABASE hotel_booking;

-- Create user (if needed)
CREATE USER hotel_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE hotel_booking TO hotel_user;
```

### Prisma Migrations

```bash
# Generate migration
npx prisma migrate dev --name init

# Deploy migrations (production)
npx prisma migrate deploy

# Seed database (optional)
npm run seed
```

## 🔍 Monitoring & Logs

### PM2 Monitoring

```bash
# View all processes
pm2 status

# Monitor in real-time
pm2 monit

# View logs
pm2 logs

# View specific app logs
pm2 logs hotel-booking-backend
pm2 logs hotel-booking-frontend
```

### Log Files

Logs are stored in the `logs/` directory:
- `backend-error.log` - Backend error logs
- `backend-out.log` - Backend output logs
- `frontend-error.log` - Frontend error logs
- `frontend-out.log` - Frontend output logs

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database connection
   npx prisma db push
   
   # Verify DATABASE_URL in environment
   echo $DATABASE_URL
   ```

2. **PM2 Process Not Starting**
   ```bash
   # Check PM2 logs
   pm2 logs
   
   # Restart PM2 daemon
   pm2 kill
   pm2 start ecosystem.config.js
   ```

3. **Frontend Build Failed**
   ```bash
   # Check Node.js version
   node --version
   
   # Clear npm cache
   npm cache clean --force
   
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :4000
   lsof -i :3000
   
   # Kill process if needed
   kill -9 <PID>
   ```

### Health Check Endpoints

- **Backend Health**: `http://localhost:4000/api/health`
- **Frontend**: `http://localhost:3000`

## 🔒 Security Considerations

1. **Environment Variables** - Never commit sensitive data to Git
2. **Database Security** - Use strong passwords and limit access
3. **SSL/TLS** - Configure HTTPS for production
4. **Firewall** - Only expose necessary ports
5. **Regular Updates** - Keep dependencies updated

## 📊 Performance Optimization

1. **PM2 Clustering** - Use multiple instances for better performance
2. **Database Indexing** - Optimize database queries
3. **Caching** - Implement Redis for session storage
4. **CDN** - Use CDN for static assets
5. **Compression** - Enable gzip compression

## 🔄 Rollback Procedure

If deployment fails, you can rollback:

```bash
# Check PM2 status
pm2 status

# Rollback to previous version
git reset --hard HEAD~1

# Restart services
pm2 restart all

# Or restore from backup
pm2 resurrect
```

## 📞 Support

For deployment issues:
1. Check GitHub Actions logs
2. Review PM2 logs
3. Verify environment variables
4. Test health check endpoints
5. Check database connectivity

---

**Last Updated**: August 2025
**Version**: 1.0.0
