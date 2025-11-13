#!/bin/bash
# Quick seed script to run on staging server via SSH
# This script will be executed on the remote server

set -e

echo "🌱 Starting Master Seed Script on Staging Server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in the right directory
if [ ! -f "seed_master.js" ]; then
    echo "❌ Error: seed_master.js not found in current directory"
    echo "Please run this script from the backend directory"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js not found"
    exit 1
fi

echo "📦 Node.js version: $(node --version)"
echo ""

# Check if properties exist
echo "🔍 Checking if properties exist..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.property.findMany()
    .then(properties => {
        console.log('Properties found:', properties.length);
        if (properties.length === 0) {
            console.error('❌ No properties found!');
            console.error('Please run: node seed_properties.js');
            process.exit(1);
        }
        properties.forEach(p => console.log('  ✓', p.name));
        prisma.\$disconnect();
    })
    .catch(e => {
        console.error('❌ Error checking properties:', e.message);
        process.exit(1);
    });
"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Property check failed. Please fix the issue and try again."
    exit 1
fi

echo ""
echo "🚀 Running master seed script..."
echo "⚠️  This may take 5-10 minutes..."
echo ""

# Run the seed script
node seed_master.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Seed script completed successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Visit https://staging.capsulepodhotel.com/admin"
    echo "  2. Check bookings: https://staging.capsulepodhotel.com/admin/bookings"
    echo "  3. Check communication hub: https://staging.capsulepodhotel.com/admin/communication-hub"
else
    echo ""
    echo "❌ Seed script failed. Check the error messages above."
    exit 1
fi

