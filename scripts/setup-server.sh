#!/bin/bash

# Hotel Booking App - Server Setup Script
# Run this script on your deployment server

set -e  # Exit on any error

echo "🏨 Setting up Hotel Booking App Server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt-get update

# Install required packages
print_status "Installing required packages..."
sudo apt-get install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Node.js 18
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_status "Node.js version: $NODE_VERSION"
print_status "npm version: $NPM_VERSION"

# Install PM2 globally
print_status "Installing PM2 process manager..."
npm install -g pm2

# Install PostgreSQL
print_status "Installing PostgreSQL..."
sudo apt-get install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE podnbeyond;"
sudo -u postgres psql -c "CREATE USER hoteluser WITH PASSWORD 'hotelpassword123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE podnbeyond TO hoteluser;"

# Create project directory
PROJECT_DIR="/var/www/hotel-booking"
print_status "Creating project directory: $PROJECT_DIR"
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

# Create logs directory
print_status "Creating logs directory..."
mkdir -p $PROJECT_DIR/logs

# Install UFW firewall
print_status "Setting up firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw allow 4000
sudo ufw --force enable

# Create environment file template
print_status "Creating environment file template..."
cat > $PROJECT_DIR/backend/.env.template << EOF
# Database Configuration
DATABASE_URL="postgresql://hoteluser:hotelpassword123@localhost:5432/podnbeyond"

# Server Configuration
PORT=4000
NODE_ENV=production

# Razorpay Configuration
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"

# Channel Manager Configuration
MAKEMYTRIP_ENABLED=false
MAKEMYTRIP_API_KEY=""
MAKEMYTRIP_API_SECRET=""
MAKEMYTRIP_HOTEL_ID=""

YATRA_ENABLED=false
YATRA_API_KEY=""
YATRA_API_SECRET=""
YATRA_HOTEL_ID=""

GOIBIBO_ENABLED=false
GOIBIBO_API_KEY=""
GOIBIBO_API_SECRET=""
GOIBIBO_HOTEL_ID=""

BOOKING_COM_ENABLED=false
BOOKING_COM_API_KEY=""
BOOKING_COM_API_SECRET=""
BOOKING_COM_HOTEL_ID=""

AGODA_ENABLED=false
AGODA_API_KEY=""
AGODA_API_SECRET=""
AGODA_HOTEL_ID=""
EOF

# Create PM2 ecosystem file
print_status "Creating PM2 ecosystem configuration..."
cat > $PROJECT_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'hotel-booking-backend',
      script: './backend/server.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
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
      name: 'hotel-booking-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
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
EOF

# Create deployment script
print_status "Creating deployment script..."
cat > $PROJECT_DIR/deploy.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying Hotel Booking App..."

# Navigate to project directory
cd /var/www/hotel-booking

# Pull latest changes
git fetch origin
git reset --hard origin/production

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm ci --only=production

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
npm ci
npm run build

# Run database migrations
echo "Running database migrations..."
cd ../backend
npx prisma migrate deploy

# Restart services
echo "Restarting services..."
pm2 restart ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

echo "✅ Deployment completed successfully!"
EOF

chmod +x $PROJECT_DIR/deploy.sh

# Create systemd service for PM2
print_status "Setting up PM2 startup script..."
pm2 startup

# Print setup summary
echo ""
echo "🎉 Server setup completed successfully!"
echo ""
echo "📋 Setup Summary:"
echo "   • Node.js 18 installed"
echo "   • PM2 process manager installed"
echo "   • PostgreSQL database created"
echo "   • Project directory: $PROJECT_DIR"
echo "   • Firewall configured"
echo "   • Environment template created"
echo ""
echo "🔧 Next Steps:"
echo "   1. Clone your repository to $PROJECT_DIR"
echo "   2. Copy .env.template to .env and configure it"
echo "   3. Set up GitHub Actions secrets"
echo "   4. Test deployment with: ./deploy.sh"
echo ""
echo "📚 Documentation:"
echo "   • PM2 commands: pm2 status, pm2 logs, pm2 monit"
echo "   • Database: sudo -u postgres psql podnbeyond"
echo "   • Logs: tail -f $PROJECT_DIR/logs/*.log"
echo ""
print_warning "Remember to:"
echo "   • Change default database password"
echo "   • Configure SSL certificates"
echo "   • Set up regular backups"
echo "   • Monitor system resources" 