# 🚨 CloudPanel Deployment Troubleshooting Guide

This guide helps you resolve common deployment failures when using CloudPanel for your Hotel Booking App.

## 🔍 **Common Deployment Failure Scenarios**

### **1. SSH Connection Failures**

#### **Error**: `ssh: connect to host xxx.xxx.xxx.xxx port 22: Connection refused`

**Solutions**:
```bash
# Check if SSH is running on server
sudo systemctl status ssh

# If not running, start SSH
sudo systemctl start ssh
sudo systemctl enable ssh

# Check firewall settings in CloudPanel
# Go to Security → Firewall → Allow port 22
```

#### **Error**: `Permission denied (publickey)`

**Solutions**:
```bash
# Generate new SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions"

# Add public key to server
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys

# Set proper permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Add private key to GitHub Secrets as DEPLOY_SSH_KEY
```

### **2. Permission Issues**

#### **Error**: `Permission denied` or `Operation not permitted`

**Solutions**:
```bash
# Set proper ownership for CloudPanel
sudo chown -R cloudpanel:cloudpanel /home/cloudpanel/htdocs/hotel-booking-app

# Set proper permissions
sudo chmod -R 755 /home/cloudpanel/htdocs/hotel-booking-app

# Ensure deployment user has access
sudo usermod -aG cloudpanel deploy
```

### **3. Node.js Version Issues**

#### **Error**: `Node.js version not found` or `npm command not found`

**Solutions**:
```bash
# Check Node.js version
node --version

# Install Node.js 18 if not present
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### **4. PM2 Installation Issues**

#### **Error**: `pm2: command not found`

**Solutions**:
```bash
# Install PM2 globally
npm install -g pm2

# Install PM2 startup script
pm2 startup

# Save PM2 configuration
pm2 save

# Verify installation
pm2 --version
```

### **5. Database Connection Failures**

#### **Error**: `Database connection failed` or `Prisma error`

**Solutions**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL if not running
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Test database connection
psql -h localhost -U hotel_user -d hotel_booking

# Check DATABASE_URL in environment
echo $DATABASE_URL

# Verify database exists
sudo -u postgres psql -l
```

### **6. Port Already in Use**

#### **Error**: `EADDRINUSE: address already in use :::4000`

**Solutions**:
```bash
# Check what's using the port
sudo lsof -i :4000
sudo lsof -i :3000

# Kill processes if needed
sudo kill -9 <PID>

# Or stop PM2 processes
pm2 stop all
pm2 delete all
```

### **7. Memory Issues**

#### **Error**: `JavaScript heap out of memory`

**Solutions**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"

# Or in PM2 ecosystem config
# Add: "node_args": "--max-old-space-size=2048"

# Check server memory
free -h

# Consider upgrading server resources
```

### **8. Build Failures**

#### **Error**: `Build failed` or `npm ci failed`

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for dependency conflicts
npm audit

# Update dependencies
npm update
```

## 🔧 **GitHub Actions Specific Issues**

### **1. Secrets Configuration**

#### **Missing Required Secrets**:
```yaml
# Required GitHub Secrets:
DEPLOY_HOST: "your-server-ip"
DEPLOY_USER: "cloudpanel" or "deploy"
DEPLOY_SSH_KEY: "your-private-ssh-key"
PROJECT_PATH: "/home/cloudpanel/htdocs/hotel-booking-app"
DATABASE_URL: "postgresql://user:pass@localhost:5432/db"
RAZORPAY_KEY_ID: "your_razorpay_key"
RAZORPAY_KEY_SECRET: "your_razorpay_secret"
NEXT_PUBLIC_API_URL: "https://your-domain.com/api"
NEXT_PUBLIC_RAZORPAY_KEY_ID: "your_razorpay_key"
HEALTH_CHECK_URL: "https://your-domain.com/api/health"
```

### **2. Workflow Timeout**

#### **Error**: `The workflow is not getting any response and is about to be cancelled`

**Solutions**:
```yaml
# Add timeout to workflow
timeout-minutes: 30

# Or increase health check wait time
sleep 120  # Wait 2 minutes instead of 60 seconds
```

### **3. Health Check Failures**

#### **Error**: `Health check failed`

**Solutions**:
```bash
# Check if services are running
pm2 status

# Check service logs
pm2 logs hotel-booking-backend
pm2 logs hotel-booking-frontend

# Test endpoints manually
curl http://localhost:4000/api/health
curl http://localhost:3000

# Check firewall settings
sudo ufw status
```

## 🛠️ **Pre-Deployment Checklist**

### **Server Setup**:
- [ ] CloudPanel installed and accessible
- [ ] Node.js 18+ installed
- [ ] PM2 installed globally
- [ ] PostgreSQL installed and running
- [ ] Firewall configured (ports 22, 80, 443, 3000, 4000)
- [ ] SSL certificates configured
- [ ] Project directory created with proper permissions

### **GitHub Configuration**:
- [ ] All required secrets configured
- [ ] SSH key pair generated and configured
- [ ] Repository has production branch
- [ ] Workflow file is in `.github/workflows/`

### **Environment Variables**:
- [ ] DATABASE_URL configured
- [ ] Razorpay credentials set
- [ ] Frontend environment variables set
- [ ] Health check URLs configured

## 🔍 **Debugging Commands**

### **Server-Side Debugging**:
```bash
# Check system resources
htop
df -h
free -h

# Check running processes
ps aux | grep node
ps aux | grep pm2

# Check network connections
netstat -tulpn | grep :3000
netstat -tulpn | grep :4000

# Check logs
tail -f /var/log/syslog
journalctl -u nginx -f
```

### **Application Debugging**:
```bash
# Check PM2 logs
pm2 logs --lines 100

# Check specific app logs
pm2 logs hotel-booking-backend --lines 50
pm2 logs hotel-booking-frontend --lines 50

# Restart services
pm2 restart all

# Check PM2 status
pm2 status
pm2 monit
```

### **Database Debugging**:
```bash
# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Test database connection
psql -h localhost -U hotel_user -d hotel_booking -c "SELECT version();"

# Check database size
psql -h localhost -U hotel_user -d hotel_booking -c "SELECT pg_size_pretty(pg_database_size('hotel_booking'));"
```

## 🚨 **Emergency Recovery**

### **If Deployment Completely Fails**:
```bash
# Stop all services
pm2 stop all
pm2 delete all

# Rollback to previous version
cd /home/cloudpanel/htdocs/hotel-booking-app
git reset --hard HEAD~1

# Manual deployment
./scripts/deploy-cloudpanel.sh

# Or restore from backup
pm2 resurrect
```

### **If Database is Corrupted**:
```bash
# Create backup first
pg_dump -h localhost -U hotel_user hotel_booking > backup.sql

# Restore from backup
psql -h localhost -U hotel_user hotel_booking < backup.sql

# Or recreate database
sudo -u postgres dropdb hotel_booking
sudo -u postgres createdb hotel_booking
npx prisma migrate deploy
```

## 📞 **Getting Help**

### **CloudPanel Support**:
- **Documentation**: [CloudPanel Docs](https://www.cloudpanel.io/docs/)
- **Discord**: [CloudPanel Discord](https://discord.gg/cloudpanel)
- **GitHub**: [CloudPanel GitHub](https://github.com/cloudpanel-io/cloudpanel-ce)

### **Application Support**:
- Check GitHub Actions logs for detailed error messages
- Review PM2 logs for application-specific issues
- Verify all environment variables are correctly set
- Test deployment manually using the deployment script

---

**Last Updated**: August 2025
**Version**: 1.0.0
