#!/bin/bash

# POD N BEYOND Hotel Booking App - Razorpay Keys Update Script
# This script helps you update Razorpay production keys after initial setup

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

# Function to get user input
get_input() {
    local prompt="$1"
    local var_name="$2"
    read -p "$prompt: " input
    eval "$var_name=\"$input\""
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

# Function to validate Razorpay key format
validate_razorpay_key() {
    local key="$1"
    if [[ $key =~ ^rzp_(live|test)_[a-zA-Z0-9]+$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to find project directory
find_project_directory() {
    # Try common locations
    local possible_paths=(
        "/home/cloudpanel/htdocs/podnbeyond-app"
        "/home/cloudpanel/htdocs/hotel-booking-app"
        "/var/www/podnbeyond-app"
        "/opt/podnbeyond-app"
        "."
    )
    
    for path in "${possible_paths[@]}"; do
        if [[ -d "$path" ]] && [[ -f "$path/package.json" ]] && [[ -d "$path/backend" ]] && [[ -d "$path/frontend" ]]; then
            echo "$path"
            return 0
        fi
    done
    
    return 1
}

# Main function
main() {
    print_header "Razorpay Keys Update"
    echo
    print_status "This script will help you update Razorpay production keys for payment processing."
    echo
    
    # Find project directory
    print_step "Locating project directory..."
    PROJECT_DIR=$(find_project_directory)
    
    if [[ -z "$PROJECT_DIR" ]]; then
        print_error "Could not find the project directory automatically."
        get_input "Please enter the full path to your project directory" PROJECT_DIR
        
        if [[ ! -d "$PROJECT_DIR" ]] || [[ ! -f "$PROJECT_DIR/package.json" ]]; then
            print_error "Invalid project directory. Please run this script from the project root or provide the correct path."
            exit 1
        fi
    fi
    
    print_status "Found project at: $PROJECT_DIR"
    
    # Check if environment files exist
    BACKEND_ENV="$PROJECT_DIR/backend/.env"
    FRONTEND_ENV="$PROJECT_DIR/frontend/.env.local"
    
    if [[ ! -f "$BACKEND_ENV" ]] || [[ ! -f "$FRONTEND_ENV" ]]; then
        print_error "Environment files not found. Please run the setup script first."
        exit 1
    fi
    
    print_status "Environment files found ✓"
    
    # Get current keys
    print_step "Current Razorpay Configuration"
    CURRENT_KEY_ID=$(grep "RAZORPAY_KEY_ID" "$BACKEND_ENV" | cut -d'=' -f2 | tr -d '"')
    CURRENT_KEY_SECRET=$(grep "RAZORPAY_KEY_SECRET" "$BACKEND_ENV" | cut -d'=' -f2 | tr -d '"')
    
    echo "Current Key ID: $CURRENT_KEY_ID"
    echo "Current Key Secret: [HIDDEN]"
    
    if [[ "$CURRENT_KEY_ID" == "rzp_live_PLACEHOLDER_KEY_ID" ]]; then
        print_warning "Currently using placeholder keys. Payment processing is disabled."
    else
        print_status "Razorpay keys are already configured."
        if ! confirm_action "Do you want to update the existing keys?"; then
            print_status "No changes made."
            exit 0
        fi
    fi
    
    echo
    print_step "Enter New Razorpay Production Keys"
    print_warning "Make sure you have your Razorpay production keys ready."
    print_status "You can find these in your Razorpay Dashboard under Settings > API Keys"
    echo
    
    # Get new keys
    get_input "Enter Razorpay Key ID (starts with rzp_live_)" NEW_KEY_ID
    
    # Validate key format
    if ! validate_razorpay_key "$NEW_KEY_ID"; then
        print_error "Invalid Razorpay Key ID format. Should start with 'rzp_live_' or 'rzp_test_'"
        exit 1
    fi
    
    get_input "Enter Razorpay Key Secret" NEW_KEY_SECRET
    
    if [[ -z "$NEW_KEY_SECRET" ]]; then
        print_error "Key secret cannot be empty."
        exit 1
    fi
    
    echo
    print_step "Confirming Changes"
    echo "New Key ID: $NEW_KEY_ID"
    echo "New Key Secret: [HIDDEN]"
    
    if ! confirm_action "Do you want to proceed with these keys?"; then
        print_status "Update cancelled."
        exit 0
    fi
    
    # Backup current files
    print_step "Creating backups..."
    cp "$BACKEND_ENV" "$BACKEND_ENV.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$FRONTEND_ENV" "$FRONTEND_ENV.backup.$(date +%Y%m%d_%H%M%S)"
    print_status "Backups created ✓"
    
    # Update backend .env
    print_step "Updating backend environment file..."
    sed -i "s/RAZORPAY_KEY_ID=.*/RAZORPAY_KEY_ID=\"$NEW_KEY_ID\"/" "$BACKEND_ENV"
    sed -i "s/RAZORPAY_KEY_SECRET=.*/RAZORPAY_KEY_SECRET=\"$NEW_KEY_SECRET\"/" "$BACKEND_ENV"
    print_status "Backend environment updated ✓"
    
    # Update frontend .env.local
    print_step "Updating frontend environment file..."
    sed -i "s/NEXT_PUBLIC_RAZORPAY_KEY_ID=.*/NEXT_PUBLIC_RAZORPAY_KEY_ID=\"$NEW_KEY_ID\"/" "$FRONTEND_ENV"
    print_status "Frontend environment updated ✓"
    
    # Restart services
    print_step "Restarting services..."
    cd "$PROJECT_DIR"
    
    if command -v pm2 >/dev/null 2>&1; then
        pm2 restart all
        print_status "Services restarted ✓"
    else
        print_warning "PM2 not found. Please restart your services manually."
    fi
    
    echo
    print_header "Update Complete!"
    print_status "✅ Razorpay keys have been updated successfully!"
    echo
    
    print_step "What's Next:"
    echo "1. Test payment functionality on your website"
    echo "2. Verify payments are working correctly"
    echo "3. Check your Razorpay dashboard for test transactions"
    echo
    
    print_step "Test Payment Flow:"
    echo "1. Go to your website: https://your-domain.com"
    echo "2. Try to make a test booking"
    echo "3. Complete the payment process"
    echo "4. Check if payment is successful"
    echo
    
    print_warning "⚠️  IMPORTANT:"
    echo "• Make sure you're using production keys (rzp_live_) for live payments"
    echo "• Test keys (rzp_test_) are for development only"
    echo "• Keep your keys secure and never share them publicly"
    echo
    
    print_status "For support, contact: info@podnbeyond.com"
    print_status "Update completed at: $(date)"
}

# Run main function
main "$@"
