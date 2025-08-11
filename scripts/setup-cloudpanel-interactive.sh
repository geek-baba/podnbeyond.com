#!/bin/bash

# POD N BEYOND Hotel Booking App - CloudPanel Interactive Setup Script
# This script will guide you through setting up the hotel booking app on CloudPanel

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Function to get user input with default value
get_input() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        eval "$var_name=\${input:-$default}"
    else
        read -p "$prompt: " input
        eval "$var_name=\"$input\""
    fi
}

# Function to confirm action
confirm_action() {
    local message="$1"
    read -p "$message (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate domain
validate_domain() {
    local domain="$1"
    if [[ $domain =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to validate email
validate_email() {
    local email="$1"
    if [[ $email =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to generate random password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Function to check system requirements
check_system_requirements() {
    print_header "System Requirements Check"
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
        exit 1
    fi
    
    # Check OS
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        if [[ "$ID" != "debian" && "$ID" != "ubuntu" ]]; then
            print_warning "This script is designed for Debian/Ubuntu systems. You're running $ID $VERSION"
            if ! confirm_action "Continue anyway?"; then
                exit 1
            fi
        fi
    fi
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 18 ]]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_status "Node.js version: $(node --version) ✓"
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed."
        exit 1
    fi
    
    print_status "npm version: $(npm --version) ✓"
    
    # Check git
    if ! command_exists git; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    print_status "Git version: $(git --version) ✓"
    
    # Check if we're in the right directory
    if [[ ! -f "package.json" ]] || [[ ! -d "backend" ]] || [[ ! -d "frontend" ]]; then
        print_error "This script must be run from the project root directory."
        print_status "Please run: git clone -b production https://github.com/geek-baba/podnbeyond.com.git && cd podnbeyond.com"
        exit 1
    fi
    
    print_status "Project structure verified ✓"
    
    # Make this script executable
    chmod +x "$0"
}

# Function to collect configuration
collect_configuration() {
    print_header "Configuration Collection"
    
    print_step "Let's collect the necessary configuration for your deployment"
    
    # Domain configuration
    echo
    print_step "Domain Configuration"
    get_input "Enter your main domain (e.g., podnbeyond.com)" "" MAIN_DOMAIN
    while ! validate_domain "$MAIN_DOMAIN"; do
        print_error "Invalid domain format. Please enter a valid domain."
        get_input "Enter your main domain (e.g., podnbeyond.com)" "" MAIN_DOMAIN
    done
    
    get_input "Enter your API subdomain (e.g., api.podnbeyond.com)" "api.$MAIN_DOMAIN" API_DOMAIN
    while ! validate_domain "$API_DOMAIN"; do
        print_error "Invalid domain format. Please enter a valid domain."
        get_input "Enter your API subdomain (e.g., api.podnbeyond.com)" "api.$MAIN_DOMAIN" API_DOMAIN
    done
    
    # Database configuration
    echo
    print_step "Database Configuration"
    get_input "Enter database name" "podnbeyond_hotel" DB_NAME
    get_input "Enter database username" "podnbeyond_user" DB_USER
    DB_PASSWORD=$(generate_password)
    print_status "Generated database password: $DB_PASSWORD"
    print_warning "Please save this password securely!"
    
    # Razorpay configuration
    echo
    print_step "Razorpay Configuration"
    print_warning "Razorpay production keys are required for payment processing."
    print_status "You can skip this step now and add keys later, but payments won't work until configured."
    
    if confirm_action "Do you have Razorpay production keys ready?"; then
        get_input "Enter Razorpay Key ID (starts with rzp_live_)" "" RAZORPAY_KEY_ID
        get_input "Enter Razorpay Key Secret" "" RAZORPAY_KEY_SECRET
    else
        print_status "Using placeholder keys for now. You'll need to update them later."
        RAZORPAY_KEY_ID="rzp_live_PLACEHOLDER_KEY_ID"
        RAZORPAY_KEY_SECRET="placeholder_secret_key"
        print_warning "⚠️  IMPORTANT: Update Razorpay keys in environment files before going live!"
    fi
    
    # JWT Secret
    echo
    print_step "Security Configuration"
    JWT_SECRET=$(generate_password)
    print_status "Generated JWT secret: $JWT_SECRET"
    
    # Email configuration
    echo
    print_step "Contact Information"
    get_input "Enter admin email" "admin@$MAIN_DOMAIN" ADMIN_EMAIL
    while ! validate_email "$ADMIN_EMAIL"; do
        print_error "Invalid email format. Please enter a valid email."
        get_input "Enter admin email" "admin@$MAIN_DOMAIN" ADMIN_EMAIL
    done
    
    # Project directory
    echo
    print_step "Project Directory"
    get_input "Enter project directory path" "/home/cloudpanel/htdocs/podnbeyond-app" PROJECT_DIR
    
    # Save configuration
    echo
    print_step "Saving Configuration"
    CONFIG_FILE="cloudpanel-config.env"
    
    cat > "$CONFIG_FILE" << EOF
# POD N BEYOND Hotel Booking App - CloudPanel Configuration
# Generated on $(date)

# Domains
MAIN_DOMAIN=$MAIN_DOMAIN
API_DOMAIN=$API_DOMAIN

# Database
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

# Razorpay
RAZORPAY_KEY_ID=$RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET=$RAZORPAY_KEY_SECRET

# Security
JWT_SECRET=$JWT_SECRET

# Contact
ADMIN_EMAIL=$ADMIN_EMAIL

# Project
PROJECT_DIR=$PROJECT_DIR
EOF
    
    print_status "Configuration saved to $CONFIG_FILE"
    
    echo
    print_warning "Please review the configuration above and ensure all details are correct."
    if ! confirm_action "Continue with this configuration?"; then
        print_error "Setup cancelled. You can modify $CONFIG_FILE and run the script again."
        exit 1
    fi
}

# Function to setup database
setup_database() {
    print_header "Database Setup"
    
    print_step "Setting up PostgreSQL database..."
    
    # Check if PostgreSQL is installed
    if ! command_exists psql; then
        print_error "PostgreSQL is not installed. Please install PostgreSQL first."
        exit 1
    fi
    
    # Create database and user
    print_status "Creating database and user..."
    
    # Try to connect as postgres user
    if sudo -u postgres psql -c "SELECT 1;" >/dev/null 2>&1; then
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
        sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
        sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"
        print_status "Database and user created successfully ✓"
    else
        print_warning "Could not connect as postgres user. You may need to create the database manually."
        print_status "Please run these commands as a database administrator:"
        echo "CREATE DATABASE $DB_NAME;"
        echo "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
        echo "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
        echo "ALTER USER $DB_USER CREATEDB;"
        
        if ! confirm_action "Have you created the database manually?"; then
            print_error "Database setup incomplete. Please create the database and run the script again."
            exit 1
        fi
    fi
}

# Function to setup project directory
setup_project_directory() {
    print_header "Project Directory Setup"
    
    print_step "Setting up project directory..."
    
    # Create project directory
    sudo mkdir -p "$PROJECT_DIR"
    sudo chown $USER:$USER "$PROJECT_DIR"
    
    # Copy project files
    print_status "Copying project files..."
    if [[ -d ".git" ]]; then
        # We're in a git repository, copy current files
        cp -r . "$PROJECT_DIR/"
    else
        # We're not in a git repository, clone from production branch
        print_status "Cloning from production branch..."
        git clone -b production https://github.com/geek-baba/podnbeyond.com.git "$PROJECT_DIR"
    fi
    
    # Set proper permissions
    print_status "Setting permissions..."
    sudo chown -R cloudpanel:cloudpanel "$PROJECT_DIR"
    sudo chmod -R 755 "$PROJECT_DIR"
    
    # Create uploads directory
    sudo mkdir -p "$PROJECT_DIR/backend/uploads"
    sudo chmod 755 "$PROJECT_DIR/backend/uploads"
    sudo chown cloudpanel:cloudpanel "$PROJECT_DIR/backend/uploads"
    
    # Create logs directory
    sudo mkdir -p "$PROJECT_DIR/logs"
    sudo chmod 755 "$PROJECT_DIR/logs"
    sudo chown cloudpanel:cloudpanel "$PROJECT_DIR/logs"
    
    print_status "Project directory setup complete ✓"
}

# Function to setup environment files
setup_environment_files() {
    print_header "Environment Files Setup"
    
    print_step "Creating environment files..."
    
    # Backend .env
    cat > "$PROJECT_DIR/backend/.env" << EOF
# Database
DATABASE_URL="$DATABASE_URL"

# Razorpay (Production Keys)
RAZORPAY_KEY_ID="$RAZORPAY_KEY_ID"
RAZORPAY_KEY_SECRET="$RAZORPAY_KEY_SECRET"

# Server
NODE_ENV="production"
PORT=4000

# CORS
CORS_ORIGIN="https://$MAIN_DOMAIN"

# JWT Secret
JWT_SECRET="$JWT_SECRET"

# File Uploads
UPLOAD_PATH="$PROJECT_DIR/backend/uploads"
EOF
    
    # Frontend .env.local
    cat > "$PROJECT_DIR/frontend/.env.local" << EOF
# API Configuration
NEXT_PUBLIC_API_URL="https://$API_DOMAIN"
NEXT_PUBLIC_RAZORPAY_KEY_ID="$RAZORPAY_KEY_ID"

# Next.js
NODE_ENV="production"
PORT=3000

# Branding
NEXT_PUBLIC_LOGO_URL="https://podnbeyond.com/wp-content/uploads/2024/01/logo.png"
EOF
    
    # Set proper permissions
    sudo chown cloudpanel:cloudpanel "$PROJECT_DIR/backend/.env"
    sudo chown cloudpanel:cloudpanel "$PROJECT_DIR/frontend/.env.local"
    sudo chmod 600 "$PROJECT_DIR/backend/.env"
    sudo chmod 600 "$PROJECT_DIR/frontend/.env.local"
    
    print_status "Environment files created ✓"
}

# Function to install dependencies
install_dependencies() {
    print_header "Dependencies Installation"
    
    print_step "Installing project dependencies..."
    
    cd "$PROJECT_DIR"
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm ci --only=production
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    npx prisma generate
    
    # Run database migrations
    print_status "Running database migrations..."
    npx prisma migrate deploy
    
    # Seed initial data
    print_status "Seeding initial CMS data..."
    node prisma/seed_cms.js
    
    # Import gallery images
    print_status "Importing gallery images..."
    node scripts/import_gallery_images.js
    
    cd ..
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm ci --only=production
    
    # Build frontend
    print_status "Building frontend..."
    npm run build
    
    cd ..
    
    print_status "Dependencies installation complete ✓"
}

# Function to setup PM2
setup_pm2() {
    print_header "PM2 Setup"
    
    print_step "Setting up PM2 process manager..."
    
    # Install PM2 globally if not installed
    if ! command_exists pm2; then
        print_status "Installing PM2..."
        sudo npm install -g pm2
    fi
    
    # Create PM2 ecosystem file
    cat > "$PROJECT_DIR/ecosystem.config.js" << EOF
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
EOF
    
    # Set proper permissions
    sudo chown cloudpanel:cloudpanel "$PROJECT_DIR/ecosystem.config.js"
    sudo chmod 644 "$PROJECT_DIR/ecosystem.config.js"
    
    # Start PM2 processes
    cd "$PROJECT_DIR"
    pm2 start ecosystem.config.js --env production
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup
    
    print_status "PM2 setup complete ✓"
}

# Function to create deployment script
create_deployment_script() {
    print_header "Deployment Script Creation"
    
    print_step "Creating deployment script..."
    
    cat > "$PROJECT_DIR/deploy.sh" << 'EOF'
#!/bin/bash

# POD N BEYOND Hotel Booking App - Deployment Script
# This script handles automated deployments

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_status "Starting deployment..."

# Pull latest changes
print_status "Pulling latest changes..."
git pull origin production

# Install dependencies
print_status "Installing dependencies..."
cd backend
npm ci --only=production
npx prisma generate
npx prisma migrate deploy
cd ../frontend
npm ci --only=production
npm run build
cd ..

# Restart PM2 processes
print_status "Restarting services..."
pm2 restart all

print_status "Deployment completed successfully!"
EOF
    
    # Make deployment script executable
    chmod +x "$PROJECT_DIR/deploy.sh"
    sudo chown cloudpanel:cloudpanel "$PROJECT_DIR/deploy.sh"
    
    print_status "Deployment script created ✓"
}

# Function to create health check script
create_health_check_script() {
    print_header "Health Check Script Creation"
    
    print_step "Creating health check script..."
    
    cat > "$PROJECT_DIR/health-check.sh" << 'EOF'
#!/bin/bash

# POD N BEYOND Hotel Booking App - Health Check Script

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

echo "=== POD N BEYOND Health Check ==="

# Check PM2 processes
echo
print_status "Checking PM2 processes..."
pm2 status

# Check backend health
echo
print_status "Checking backend health..."
if curl -f http://localhost:4000/api/health >/dev/null 2>&1; then
    print_status "Backend is healthy ✓"
else
    print_error "Backend health check failed ✗"
fi

# Check frontend
echo
print_status "Checking frontend..."
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    print_status "Frontend is running ✓"
else
    print_error "Frontend is not responding ✗"
fi

# Check database connection
echo
print_status "Checking database connection..."
cd backend
if npx prisma db pull >/dev/null 2>&1; then
    print_status "Database connection is healthy ✓"
else
    print_error "Database connection failed ✗"
fi
cd ..

# Check disk space
echo
print_status "Checking disk space..."
df -h | grep -E "(Filesystem|/dev/)"

# Check memory usage
echo
print_status "Checking memory usage..."
free -h

echo
print_status "Health check completed!"
EOF
    
    # Make health check script executable
    chmod +x "$PROJECT_DIR/health-check.sh"
    sudo chown cloudpanel:cloudpanel "$PROJECT_DIR/health-check.sh"
    
    print_status "Health check script created ✓"
}

# Function to display final instructions
display_final_instructions() {
    print_header "Setup Complete!"
    
    echo
    print_status "🎉 POD N BEYOND Hotel Booking App has been successfully set up!"
    echo
    
    print_step "Next Steps:"
    echo "1. Configure your domains in CloudPanel:"
    echo "   - Main site: $MAIN_DOMAIN (port 3000)"
    echo "   - API site: $API_DOMAIN (port 4000)"
    echo
    
    echo "2. Set up SSL certificates in CloudPanel for both domains"
    echo
    
    echo "3. Configure your DNS to point to this server:"
    echo "   - $MAIN_DOMAIN → $(curl -s ifconfig.me)"
    echo "   - $API_DOMAIN → $(curl -s ifconfig.me)"
    echo
    
    echo "4. Test your deployment:"
    echo "   - Main site: https://$MAIN_DOMAIN"
    echo "   - API health: https://$API_DOMAIN/api/health"
    echo
    
    echo "5. Access your admin panel:"
    echo "   - Admin dashboard: https://$MAIN_DOMAIN/admin"
    echo "   - CMS management: https://$MAIN_DOMAIN/admin/cms"
    echo
    
    print_step "Useful Commands:"
    echo "• Check status: pm2 status"
    echo "• View logs: pm2 logs"
    echo "• Restart services: pm2 restart all"
    echo "• Health check: $PROJECT_DIR/health-check.sh"
    echo "• Deploy updates: $PROJECT_DIR/deploy.sh"
    echo
    
    print_step "Important Files:"
    echo "• Configuration: $CONFIG_FILE"
    echo "• Project directory: $PROJECT_DIR"
    echo "• Backend logs: $PROJECT_DIR/logs/backend-*.log"
    echo "• Frontend logs: $PROJECT_DIR/logs/frontend-*.log"
    echo
    
    print_warning "Please save your configuration file ($CONFIG_FILE) securely!"
    print_warning "Database password: $DB_PASSWORD"
    print_warning "JWT secret: $JWT_SECRET"
    
    # Check if using placeholder Razorpay keys
    if [[ "$RAZORPAY_KEY_ID" == "rzp_live_PLACEHOLDER_KEY_ID" ]]; then
        echo
        print_warning "⚠️  RAZORPAY KEYS NOT CONFIGURED!"
        print_status "To enable payments, update these files with your production keys:"
        echo "• $PROJECT_DIR/backend/.env"
        echo "• $PROJECT_DIR/frontend/.env.local"
        echo
        print_status "Replace the placeholder values with your actual Razorpay production keys."
    fi
    echo
    
    print_status "For support, contact: info@podnbeyond.com"
    print_status "Setup completed at: $(date)"
}

# Main execution
main() {
    print_header "POD N BEYOND Hotel Booking App - CloudPanel Setup"
    echo
    print_status "This script will guide you through setting up the hotel booking app on CloudPanel."
    echo
    
    if ! confirm_action "Do you want to continue with the setup?"; then
        print_error "Setup cancelled."
        exit 1
    fi
    
    # Load configuration if exists
    if [[ -f "cloudpanel-config.env" ]]; then
        print_warning "Found existing configuration file. Loading..."
        source cloudpanel-config.env
    fi
    
    # Run setup steps
    check_system_requirements
    collect_configuration
    setup_database
    setup_project_directory
    setup_environment_files
    install_dependencies
    setup_pm2
    create_deployment_script
    create_health_check_script
    display_final_instructions
}

# Run main function
main "$@"
