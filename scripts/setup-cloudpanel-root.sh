#!/bin/bash

# POD N BEYOND Hotel Booking App - Root Setup Script
# This script handles the complete setup process when run as root

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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

# Main function
main() {
    print_header "POD N BEYOND Hotel Booking App - Root Setup"
    echo
    print_status "This script will set up the hotel booking app on CloudPanel as root."
    print_warning "⚠️  Running as root is not recommended for production environments."
    echo
    
    if ! confirm_action "Do you want to continue with root setup?"; then
        print_error "Setup cancelled."
        exit 1
    fi
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root."
        exit 1
    fi
    
    # Check system requirements
    print_step "Checking system requirements..."
    
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
    
    # Create cloudpanel user if not exists
    print_step "Setting up cloudpanel user..."
    if ! id "cloudpanel" &>/dev/null; then
        print_status "Creating cloudpanel user..."
        adduser --disabled-password --gecos "" cloudpanel
        usermod -aG sudo cloudpanel
        print_status "cloudpanel user created ✓"
    else
        print_status "cloudpanel user already exists ✓"
    fi
    
    # Set up project directory
    PROJECT_DIR="/home/cloudpanel/htdocs/podnbeyond-app"
    print_step "Setting up project directory..."
    
    # Create project directory
    mkdir -p "$PROJECT_DIR"
    chown cloudpanel:cloudpanel "$PROJECT_DIR"
    
    # Clone repository if not exists
    if [[ ! -d "$PROJECT_DIR/.git" ]]; then
        print_status "Cloning repository from production branch..."
        sudo -u cloudpanel git clone -b production https://github.com/geek-baba/podnbeyond.com.git "$PROJECT_DIR"
        print_status "Repository cloned ✓"
    else
        print_status "Repository already exists ✓"
    fi
    
    # Set proper permissions
    chown -R cloudpanel:cloudpanel "$PROJECT_DIR"
    chmod -R 755 "$PROJECT_DIR"
    
    # Create uploads and logs directories
    mkdir -p "$PROJECT_DIR/backend/uploads"
    mkdir -p "$PROJECT_DIR/logs"
    chmod 755 "$PROJECT_DIR/backend/uploads"
    chmod 755 "$PROJECT_DIR/logs"
    chown cloudpanel:cloudpanel "$PROJECT_DIR/backend/uploads"
    chown cloudpanel:cloudpanel "$PROJECT_DIR/logs"
    
    print_status "Project directory setup complete ✓"
    
    # Switch to cloudpanel user and run setup
    print_step "Switching to cloudpanel user and running setup..."
    print_status "The interactive setup will now begin..."
    echo
    
    # Change to project directory and run setup as cloudpanel user
    cd "$PROJECT_DIR"
    sudo -u cloudpanel ./scripts/setup-cloudpanel-interactive.sh
    
    print_header "Root Setup Complete!"
    print_status "✅ The setup process has been completed successfully!"
    echo
    
    print_step "Next Steps:"
    echo "1. The interactive setup has configured your application"
    echo "2. Configure your domains in CloudPanel"
    echo "3. Set up SSL certificates"
    echo "4. Test your deployment"
    echo
    
    print_status "For support, contact: info@podnbeyond.com"
    print_status "Setup completed at: $(date)"
}

# Run main function
main "$@"
