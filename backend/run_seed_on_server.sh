#!/bin/bash

# Script to run master seed on staging/production server
# Usage: ./run_seed_on_server.sh [staging|production]

set -e

ENV=${1:-staging}

if [ "$ENV" = "staging" ]; then
    echo "🌱 Running seed script on STAGING server..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "This will create:"
    echo "  - 100 loyalty users"
    echo "  - 1,500 bookings across 12 months"
    echo "  - 800 communication conversations"
    echo "  - Payments, room assignments, audit logs, etc."
    echo ""
    echo "⚠️  This may take 5-10 minutes to complete."
    echo ""
    read -p "Continue? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled."
        exit 1
    fi
    
    ssh -i ~/.ssh/github_actions_capsulepodhotel capsulepodhotel-staging@45.76.60.99 << 'EOF'
        cd ~/htdocs/staging.capsulepodhotel.com/backend
        echo "📦 Checking Node.js and dependencies..."
        node --version
        npm --version
        
        echo "🔍 Checking if properties exist..."
        node -e "
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            prisma.property.findMany().then(properties => {
                console.log('Properties found:', properties.length);
                if (properties.length === 0) {
                    console.error('❌ No properties found! Please run seed_properties.js first.');
                    process.exit(1);
                }
                properties.forEach(p => console.log('  -', p.name));
                prisma.\$disconnect();
            }).catch(e => {
                console.error('❌ Error:', e.message);
                process.exit(1);
            });
        "
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🚀 Running master seed script..."
            echo ""
            node seed_master.js
        else
            echo "❌ Failed to verify properties. Exiting."
            exit 1
        fi
EOF

elif [ "$ENV" = "production" ]; then
    echo "🌱 Running seed script on PRODUCTION server..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⚠️  WARNING: This will add test data to PRODUCTION!"
    echo ""
    echo "This will create:"
    echo "  - 100 loyalty users"
    echo "  - 1,500 bookings across 12 months"
    echo "  - 800 communication conversations"
    echo "  - Payments, room assignments, audit logs, etc."
    echo ""
    read -p "Are you SURE you want to continue? (yes/N) " -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "❌ Cancelled."
        exit 1
    fi
    
    ssh -i ~/.ssh/github_actions_capsulepodhotel capsulepodhotel@45.76.60.99 << 'EOF'
        cd ~/htdocs/capsulepodhotel.com/backend
        echo "📦 Checking Node.js and dependencies..."
        node --version
        npm --version
        
        echo "🔍 Checking if properties exist..."
        node -e "
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            prisma.property.findMany().then(properties => {
                console.log('Properties found:', properties.length);
                if (properties.length === 0) {
                    console.error('❌ No properties found! Please run seed_properties.js first.');
                    process.exit(1);
                }
                properties.forEach(p => console.log('  -', p.name));
                prisma.\$disconnect();
            }).catch(e => {
                console.error('❌ Error:', e.message);
                process.exit(1);
            });
        "
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🚀 Running master seed script..."
            echo ""
            node seed_master.js
        else
            echo "❌ Failed to verify properties. Exiting."
            exit 1
        fi
EOF

else
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    echo "Usage: ./run_seed_on_server.sh [staging|production]"
    exit 1
fi

echo ""
echo "✅ Seed script completed!"

