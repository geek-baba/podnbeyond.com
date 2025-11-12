# 🌱 Seed Data Rules & Standards

## Overview
This document defines the ground rules for seed data consistency between staging and production environments.

## Core Principles

### 1. **Brands and Properties are Real Data**
- **Rule**: Brands and Properties represent actual business entities
- **Action**: These must remain consistent across staging and production
- **Never**: Create fake or test properties
- **Always**: Use the exact property names, addresses, and details from the real business

### 2. **Properties, Room Types, and Availability**
- **Rule**: Property configurations must be identical across environments
- **Includes**:
  - Property names, locations, addresses
  - Room types and their configurations
  - Base room counts and capacity
  - Pricing and rate plans
  - Inventory availability calculations
- **Action**: Use the same seed script for both staging and production

### 3. **Bookings**
- **Rule**: All bookings must use realistic Indian names
- **Requirements**:
  - **Total**: 8 bookings per environment
  - **Loyalty**: 4 bookings must be from loyalty members
  - **Regular**: 4 bookings from regular guests
  - **Names**: Use real Indian names (e.g., Rahul Khanna, Priya Sharma)
  - **Never**: Use fake names like "Sample Guest" or technical codes
- **Action**: Delete all old fake bookings before seeding

### 4. **Loyalty Accounts**
- **Rule**: Create realistic loyalty members with real names
- **Requirements**:
  - **Total**: 4 loyalty accounts per environment
  - **Names**: Real Indian names
  - **Tiers**: Mix of SILVER, GOLD, and PLATINUM
  - **Integration**: Some loyalty members should have bookings
- **Action**: Reset loyalty accounts table before seeding

### 5. **Users**
- **Rule**: Admin user must have correct name
- **Admin User**:
  - Email: `shwet@thedesi.email`
  - Name: `Shwet Prabhat`
- **Action**: Ensure admin name is set correctly during seed

## Seed Script Structure

The seed script (`backend/prisma/seed.js`) follows this order:

1. **Reset all tables** (properties, room types, inventory, bookings, loyalty accounts)
2. **Create properties** (3 real properties with correct names)
3. **Create room types** (with unique codes per property)
4. **Create inventory** (60 days of inventory per room type)
5. **Update admin user** (set name to "Shwet Prabhat")
6. **Create loyalty accounts** (4 members with real names)
7. **Create bookings** (8 bookings: 4 loyalty, 4 regular)

## Current Seed Data

### Properties (3)
1. **Capsule Pod Hotel** (Kasidih)
2. **Pod n Beyond Smart Hotel @Bistupur** (Bistupur)
3. **Pod n Beyond Smart Hotel @Sakchi** (Sakchi)

### Loyalty Members (4)
1. **Rahul Khanna** - GOLD (2500 points, 5 stays)
2. **Priya Sharma** - SILVER (1200 points, 3 stays)
3. **Amit Patel** - PLATINUM (5000 points, 10 stays)
4. **Anjali Singh** - GOLD (2800 points, 6 stays)

### Bookings (8)
- 4 from loyalty members (Rahul, Priya, Amit, Anjali)
- 4 from regular guests (Vikram Mehta, Sneha Reddy, Rajesh Kumar, Meera Nair)

## Deployment Checklist

Before deploying seed changes:

- [ ] Verify seed script matches this document
- [ ] Test seed script locally
- [ ] Update staging seed script
- [ ] Run seed on staging and verify data
- [ ] Update production seed script
- [ ] Run seed on production and verify data
- [ ] Confirm both environments have identical data

## Important Notes

⚠️ **Never create fake properties or use technical codes in guest names**

✅ **Always use real Indian names for bookings and loyalty members**

✅ **Keep staging and production seed scripts identical**

✅ **Reset tables before seeding to ensure clean state**

