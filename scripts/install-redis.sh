#!/bin/bash

# Redis Installation Script for POD N BEYOND
# This script installs and configures Redis for BullMQ email queue

set -e

echo "🚀 Installing Redis for BullMQ..."

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  This script needs sudo privileges. Running with sudo..."
    exec sudo bash "$0" "$@"
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ Cannot detect OS. Exiting."
    exit 1
fi

echo "📦 Detected OS: $OS"

# Install Redis based on OS
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    echo "📥 Installing Redis on Ubuntu/Debian..."
    
    # Update package list
    apt update
    
    # Install Redis
    apt install -y redis-server
    
    # Configure Redis
    echo "⚙️  Configuring Redis..."
    
    # Enable Redis to start on boot
    systemctl enable redis-server
    
    # Start Redis
    systemctl start redis-server
    
    # Configure Redis for production (optional security)
    if [ ! -f /etc/redis/redis.conf.bak ]; then
        cp /etc/redis/redis.conf /etc/redis/redis.conf.bak
    fi
    
    # Set bind to localhost only (more secure)
    sed -i 's/^# bind 127.0.0.1/bind 127.0.0.1/' /etc/redis/redis.conf
    
    # Disable protected mode for localhost connections
    sed -i 's/^protected-mode yes/protected-mode no/' /etc/redis/redis.conf
    
    # Restart Redis with new config
    systemctl restart redis-server
    
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
    echo "📥 Installing Redis on CentOS/RHEL/Fedora..."
    
    # Install EPEL repository (for RHEL/CentOS)
    if [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        yum install -y epel-release
    fi
    
    # Install Redis
    yum install -y redis
    
    # Enable and start Redis
    systemctl enable redis
    systemctl start redis
    
else
    echo "❌ Unsupported OS: $OS"
    echo "Please install Redis manually:"
    echo "  Ubuntu/Debian: sudo apt install redis-server"
    echo "  CentOS/RHEL: sudo yum install redis"
    exit 1
fi

# Verify Redis is running
echo "🔍 Verifying Redis installation..."
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running!"
    redis-cli ping
else
    echo "❌ Redis is not running. Please check the logs:"
    echo "   sudo systemctl status redis-server"
    exit 1
fi

# Test Redis connection
echo "🧪 Testing Redis connection..."
REDIS_TEST=$(redis-cli ping)
if [ "$REDIS_TEST" = "PONG" ]; then
    echo "✅ Redis connection test successful!"
else
    echo "❌ Redis connection test failed"
    exit 1
fi

# Display Redis info
echo ""
echo "📊 Redis Information:"
echo "===================="
redis-cli info server | grep -E "redis_version|os|arch_bits|process_id|tcp_port"
echo ""

# Display Redis status
echo "📈 Redis Service Status:"
echo "======================="
systemctl status redis-server --no-pager -l || systemctl status redis --no-pager -l

echo ""
echo "✅ Redis installation complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update backend .env file with:"
echo "   REDIS_ENABLED=\"true\""
echo "   REDIS_HOST=\"localhost\""
echo "   REDIS_PORT=\"6379\""
echo ""
echo "2. Restart your backend service:"
echo "   pm2 restart staging-backend    # For staging"
echo "   pm2 restart hotel-booking-backend  # For production"
echo ""
echo "3. Check backend logs to verify Redis connection:"
echo "   pm2 logs staging-backend | grep -i redis"
echo "   pm2 logs hotel-booking-backend | grep -i redis"
echo ""
echo "Expected log output:"
echo "   ✅ Email queue initialized (Redis connected)"
echo ""

