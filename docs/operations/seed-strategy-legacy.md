# Master Seed Strategy - Complete System Data

## Overview

This document outlines the strategy for creating a comprehensive master seed script that generates realistic, interconnected data across all system modules.

## Goals

1. **Complete Data Consistency**: All data (bookings, loyalty, communication hub, staff) is properly linked
2. **Realistic Scenarios**: Data reflects real-world hotel operations
3. **Testing Coverage**: Supports testing all features and workflows
4. **Staff Assignment**: Communication hub tickets assigned to real staff members

## Data Relationships

```
User (Staff)
  └─ UserRole (STAFF_FRONTDESK/STAFF_OPS/MANAGER, property-scoped)
      └─ Thread.assignedTo

User (Guest/Loyalty Member)
  └─ LoyaltyAccount
      └─ Booking.loyaltyAccountId
          └─ Thread.bookingId
              └─ Thread.assignedTo (links to Staff User)
```

## Cleanup Strategy

### Step 1: Delete Communication Hub Data
- Threads (cascade deletes: emails, messageLogs, callLogs, notes)
- Contacts (if not linked to users)
- Suppressions

### Step 2: Delete Booking-Related Data
- Room assignments
- Booking audit logs
- Booking guests
- Stays
- Payments
- Inventory locks
- Hold logs
- Update threads (SET NULL booking references)

### Step 3: Delete Bookings
- All bookings

### Step 4: Delete Loyalty Data
- Points ledger
- Perk redemptions
- Redemption transactions
- Tier history
- Referrals
- Tier transfers
- Loyalty accounts

### Step 5: Delete Guest Users (Optional)
- Users with only GUEST or MEMBER roles (no staff roles)
- Keep staff users and superadmin

## Creation Strategy

### Step 1: Create Staff Users
- 2-3 STAFF_FRONTDESK per property
- 1-2 STAFF_OPS per property
- 1 MANAGER per property
- Assign roles with property scope

### Step 2: Create Loyalty Users & Accounts
- 120 users with loyalty accounts
- Distribute across tiers
- Generate member numbers

### Step 3: Create Bookings
- Link to loyalty accounts
- Various statuses (mostly CHECKED_OUT)
- Realistic dates and prices
- Link to properties

### Step 4: Update Loyalty Metrics
- Calculate stays, nights, spend from bookings
- Award points
- Recalculate tiers

### Step 5: Create Communication Hub Data
- Threads linked to bookings
- Threads linked to users (loyalty members)
- Assign threads to staff users
- Create emails, WhatsApp messages, calls
- Link to contacts

## Staff User Distribution

### Per Property:
- **STAFF_FRONTDESK**: 2-3 users
  - Handle check-ins/check-outs
  - Respond to guest inquiries
  - Manage bookings
  
- **STAFF_OPS**: 1-2 users
  - Manage inventory
  - Update pricing
  - Handle operations

- **MANAGER**: 1 user
  - Full property management
  - Staff management
  - Handle escalated issues
  - Approve refunds

## Communication Hub Scenarios

### Booking-Related Threads (60%)
- Booking confirmation requests
- Check-in/check-out inquiries
- Cancellation requests
- Special requests (late checkout, early check-in)
- Room upgrade requests
- Linked to bookings

### General Inquiry Threads (30%)
- Property information
- Amenities questions
- Pricing inquiries
- Linked to users (not bookings)

### Support Threads (10%)
- Complaints
- Feedback
- Technical issues
- Linked to users or bookings

## Thread Assignment Logic

1. **Booking-related threads**: Assign to STAFF_FRONTDESK or MANAGER
2. **General inquiries**: Assign to STAFF_FRONTDESK
3. **Escalated issues**: Assign to MANAGER
4. **Some threads unassigned**: For testing assignment workflow

## Implementation Plan

1. Create `backend/prisma/seed_master_complete.js`
2. Integrate cleanup from existing scripts
3. Create staff users with proper roles
4. Use existing loyalty/bookings seed logic
5. Add communication hub seed logic
6. Link everything together
7. Add verification queries

## Usage

```bash
# Clean slate - deletes everything and recreates
npm run seed:master-complete

# Or with options
npm run seed:master-complete -- --keep-staff  # Keep existing staff users
```

