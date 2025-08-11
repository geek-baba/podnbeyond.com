#!/bin/bash

# CloudPanel Server Setup Script for Hotel Booking App
# Run this script on your CloudPanel server to prepare it for deployment

set -e

echo "🚀 Setting up CloudPanel server for Hotel Booking App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "This script must be run as root"
    exit 1
fi

print_status "🔍 Checking system requirements..."

# Check OS
if [[ -f /etc/debian_version ]]; then
    OS="debian"
elif [[ -f /etc/redhat-release ]]; then
    OS="redhat"
else
    print_error "Unsupported operating system"
    exit 1
fi

print_info "Operating System: $OS"

# Update system
print_status "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18
print_status "📦 Installing Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    NODE_VERSION=$(node --version)
    print_info "Node.js already installed: $NODE_VERSION"
fi

# Install PM2
print_status "📦 Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup
    pm2 save
else
    print_info "PM2 already installed"
fi

# Install PostgreSQL if not present
print_status "🗄️ Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
    print_status "Installing PostgreSQL..."
    apt-get install -y postgresql postgresql-contrib
    
    # Start and enable PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
else
    print_info "PostgreSQL already installed"
fi

# Create project directory
print_status "📁 Creating project directory..."
PROJECT_DIR="/home/cloudpanel/htdocs/hotel-booking-app"
mkdir -p $PROJECT_DIR

# Set proper ownership
print_status "🔐 Setting proper permissions..."
chown -R cloudpanel:cloudpanel $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# Create logs directory
mkdir -p $PROJECT_DIR/logs
chown -R cloudpanel:cloudpanel $PROJECT_DIR/logs

# Install additional tools
print_status "🔧 Installing additional tools..."
apt-get install -y curl wget git htop

# Configure firewall (if UFW is available)
if command -v ufw &> /dev/null; then
    print_status "🔥 Configuring firewall..."
    ufw allow 22/tcp   # SSH
    ufw allow 80/tcp   # HTTP
    ufw allow 443/tcp  # HTTPS
    ufw allow 3000/tcp # Frontend
    ufw allow 4000/tcp # Backend
    ufw --force enable
    print_info "Firewall configured"
fi

# Create deployment user
print_status "👤 Creating deployment user..."
if ! id "deploy" &>/dev/null; then
    adduser --disabled-password --gecos "" deploy
    usermod -aG cloudpanel deploy
    print_info "Deployment user 'deploy' created"
else
    print_info "Deployment user 'deploy' already exists"
fi

# Set up SSH for deployment user
print_status "🔑 Setting up SSH for deployment..."
DEPLOY_HOME="/home/deploy"
mkdir -p $DEPLOY_HOME/.ssh
touch $DEPLOY_HOME/.ssh/authorized_keys
chown -R deploy:deploy $DEPLOY_HOME/.ssh
chmod 700 $DEPLOY_HOME/.ssh
chmod 600 $DEPLOY_HOME/.ssh/authorized_keys

print_warning "⚠️  IMPORTANT: Add your GitHub Actions public key to:"
print_info "   $DEPLOY_HOME/.ssh/authorized_keys"

# Create environment file template
print_status "📝 Creating environment file template..."
cat > $PROJECT_DIR/.env.template << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://hotel_user:your_password@localhost:5432/hotel_booking"

# Razorpay Configuration
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_secret_key"

# Frontend Configuration
NEXT_PUBLIC_API_URL="https://your-domain.com/api"
NEXT_PUBLIC_RAZORPAY_KEY_ID="your_razorpay_key_id"

# Server Configuration
NODE_ENV="production"
PORT=4000
FRONTEND_PORT=3000

# CORS Configuration
CORS_ORIGIN="https://your-domain.com"
EOF

chown cloudpanel:cloudpanel $PROJECT_DIR/.env.template

# Create database setup script
print_status "🗄️ Creating database setup script..."
cat > $PROJECT_DIR/setup-database.sh << 'EOF'
#!/bin/bash

# Database setup script for Hotel Booking App

echo "🗄️ Setting up PostgreSQL database..."

# Create database and user
sudo -u postgres psql << 'SQL'
CREATE DATABASE hotel_booking;
CREATE USER hotel_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE hotel_booking TO hotel_user;
\q
SQL

echo "✅ Database setup completed!"
echo "📝 Update your .env file with the correct DATABASE_URL"
echo "   DATABASE_URL=\"postgresql://hotel_user:your_secure_password@localhost:5432/hotel_booking\""
EOF

chmod +x $PROJECT_DIR/setup-database.sh
chown cloudpanel:cloudpanel $PROJECT_DIR/setup-database.sh

# Display setup summary
echo ""
print_status "🎉 CloudPanel server setup completed!"
echo ""
print_info "📋 Next Steps:"
echo "   1. Add your GitHub Actions public key to:"
echo "      $DEPLOY_HOME/.ssh/authorized_keys"
echo ""
echo "   2. Configure GitHub Secrets:"
echo "      - DEPLOY_HOST: $(hostname -I | awk '{print $1}')"
echo "      - DEPLOY_USER: deploy"
echo "      - PROJECT_PATH: $PROJECT_DIR"
echo ""
echo "   3. Set up database:"
echo "      cd $PROJECT_DIR"
echo "      ./setup-database.sh"
echo ""
echo "   4. Configure environment variables:"
echo "      cp .env.template .env"
echo "      nano .env"
echo ""
echo "   5. Clone your repository:"
echo "      cd $PROJECT_DIR"
echo "      git clone https://github.com/geek-baba/podnbeyond.com.git ."
echo ""
echo "   6. Run initial deployment:"
echo "      ./scripts/deploy-cloudpanel.sh"
echo ""
print_info "🔧 Useful Commands:"
echo "   • Check PM2 status: pm2 status"
echo "   • Monitor processes: pm2 monit"
echo "   • View logs: pm2 logs"
echo "   • CloudPanel access: https://$(hostname -I | awk '{print $1}'):8443"
echo ""
print_warning "⚠️  Remember to:"
echo "   • Change default passwords"
echo "   • Configure SSL certificates"
echo "   • Set up automated backups"
echo "   • Monitor server resources"
echo ""
