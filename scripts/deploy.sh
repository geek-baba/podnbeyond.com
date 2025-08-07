#!/bin/bash

# Hotel Booking App Deployment Script
# This script can be run manually on the server for deployment

set -e  # Exit on any error

echo "🚀 Starting Hotel Booking App Deployment..."

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

print_status "📦 Installing backend dependencies..."
cd backend
npm ci --only=production

print_status "🔧 Generating Prisma client..."
npx prisma generate

print_status "🗄️ Running database migrations..."
npx prisma migrate deploy

print_status "📦 Installing frontend dependencies..."
cd ../frontend
npm ci --only=production

print_status "🏗️ Building frontend..."
npm run build

print_status "🔄 Restarting services with PM2..."
cd ..

# Stop and delete existing processes
print_status "Stopping existing processes..."
pm2 stop hotel-booking-backend 2>/dev/null || true
pm2 stop hotel-booking-frontend 2>/dev/null || true
pm2 delete hotel-booking-backend 2>/dev/null || true
pm2 delete hotel-booking-frontend 2>/dev/null || true

# Start services using ecosystem config
print_status "Starting services..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Show status
print_status "📊 PM2 Status:"
pm2 status

print_status "⏳ Waiting for services to start..."
sleep 10

# Health checks
print_status "🏥 Performing health checks..."

# Check backend
if curl -f http://localhost:4000/api/health > /dev/null 2>&1; then
    print_status "✅ Backend health check passed"
else
    print_error "❌ Backend health check failed"
    exit 1
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "✅ Frontend health check passed"
else
    print_error "❌ Frontend health check failed"
    exit 1
fi

print_status "🎉 Deployment completed successfully!"
print_status "🌐 Frontend: http://localhost:3000"
print_status "🔧 Backend: http://localhost:4000"
print_status "📊 PM2 Dashboard: pm2 monit"
