# Seed Data Guide

**Last Updated:** 2025-01-21  
**Status:** ✅ **Master Seed Script Available**

---

## Overview

The seed data system provides comprehensive test data generation for all system modules, including staff users, loyalty accounts, bookings, and communication hub data with realistic distributions and relationships.

---

## Master Seed Script

### Location

**Script:** `backend/prisma/seed_master_complete.js`

**Command:**
```bash
cd backend
npm run seed:master-complete
```

### What It Creates

#### Staff Users (~12-18 users)

**Per Property:**
- **2-3 STAFF_FRONTDESK**: Handle check-ins/check-outs, respond to inquiries
- **1-2 STAFF_OPS**: Manage inventory, pricing, operations
- **1 MANAGER**: Full property management, handle escalations

**Total:** ~12-18 staff users across all properties
- Property-scoped roles
- Realistic Indian names
- Email addresses (@capsulepodhotel.com)
- Phone numbers

#### Loyalty Users & Accounts (120 users)

**Distribution:**
- **MEMBER**: 40% (~48 users) - 1-3 bookings over 3 years
- **SILVER**: 30% (~36 users) - 3-6 bookings over 3 years
- **GOLD**: 20% (~24 users) - 6-12 bookings over 3 years
- **PLATINUM**: 8% (~10 users) - 12-20 bookings over 3 years
- **DIAMOND**: 2% (~2-3 users) - 20-35 bookings over 3 years

**Each user has:**
- Realistic Indian name, email, phone
- Loyalty account with member number
- Points calculated from bookings
- Tier calculated from metrics (stays, nights, spend)

#### Bookings (~1,000-1,200 bookings over 3 years)

**Time Distribution:**
- **Year 1** (1095-730 days ago): 20% of bookings (~200-240)
- **Year 2** (730-365 days ago): 30% of bookings (~300-360)
- **Year 3** (365-0 days ago): 50% of bookings (~500-600)

**Status Distribution:**
- **CHECKED_OUT**: 65% (~650-780) - Completed stays
- **CONFIRMED**: 15% (~150-180) - Upcoming bookings
- **CHECKED_IN**: 5% (~50-60) - Current guests
- **CANCELLED**: 8% (~80-96) - Cancelled bookings
- **NO_SHOW**: 2% (~20-24) - No-shows
- **PENDING**: 3% (~30-36) - Pending confirmation
- **HOLD**: 1% (~10-12) - On hold
- **REJECTED**: 0.5% (~5-6) - Rejected
- **COMPLETED**: 0.4% (~4-5) - Legacy
- **FAILED**: 0.1% (~1-2) - Failed

**Source Distribution:**
- **WEB_DIRECT**: 50% - Direct bookings (earn points)
- **OTA_BOOKING_COM**: 20% - Booking.com (no points)
- **OTA_MMT**: 15% - Go-MMT (no points)
- **PHONE**: 8% - Phone bookings (earn points)
- **WALK_IN**: 3% - Walk-in bookings (earn points)
- **CORPORATE**: 2% - Corporate bookings (earn points)
- **OTA_EASEMYTRIP**: 1% - EaseMyTrip.com (no points)
- **OTA_CLEARTRIP**: 1% - Cleartrip.com (no points)

#### Communication Hub Data (~600-800 threads)

**Thread Distribution:**
- **Booking-Related (60%)**: ~360-480 threads
  - Linked to bookings
  - Booking confirmations, check-in/out inquiries, cancellations, special requests
  
- **General Inquiries (30%)**: ~180-240 threads
  - Linked to users (not bookings)
  - Property info, amenities, pricing, availability
  
- **Support/Complaints (10%)**: ~60-80 threads
  - Linked to bookings or users
  - Complaints, feedback, technical issues

**Channel Distribution:**
- **Email**: 50% (~300-400 emails)
- **WhatsApp**: 40% (~240-320 messages)
- **SMS**: 5% (~30-40 messages)
- **Phone Calls**: 5% (~30-40 calls)

**Thread Status:**
- **RESOLVED**: 70%
- **IN_PROGRESS**: 15%
- **WAITING_FOR_GUEST**: 8%
- **NEW**: 5%
- **ARCHIVED**: 2%

**Thread Assignment:**
- 60% assigned to STAFF_FRONTDESK
- 30% assigned to MANAGER
- 10% unassigned (NEW status)

---

## Usage

### Basic Usage (Clean Slate)

```bash
cd backend
npm run seed:master-complete
```

**This will:**
- Delete ALL existing data: Bookings, loyalty accounts, communication hub data, guest users
- Create staff users (2-3 STAFF_FRONTDESK, 1-2 STAFF_OPS, 1 MANAGER per property)
- Create 120 loyalty users with accounts
- Create bookings aligned with loyalty accounts
- Create communication hub threads linked to bookings and users
- Assign threads to staff users

### Keep Existing Staff Users

```bash
npm run seed:master-complete -- --keep-staff
# or
npm run seed:master-complete -- -k
```

**This will:**
- Keep existing staff users (SUPERADMIN, ADMIN, existing staff)
- Delete guest/member users, bookings, loyalty accounts, communication hub data
- Create new loyalty users, bookings, and communication hub data
- Create additional staff users if needed

---

## Prerequisites

Before running the master seed script, ensure you have:

1. **Properties seeded**: Run property seed scripts first
2. **Room types seeded**: Room types must exist for bookings
3. **Tier configs seeded**: Run `npm run seed:tier-configs`
4. **Points rules seeded** (optional): Run `npm run seed:points-rules` for bonus rules
5. **RBAC seeded**: Run `npm run seed` or `node seed_rbac.js` to ensure roles exist

---

## What Gets Deleted

### Communication Hub Data
- All threads
- All emails
- All WhatsApp/SMS messages
- All call logs
- All contacts
- All email suppressions

### Booking Data
- All bookings
- All payments
- All stays
- All booking guests
- All booking audit logs
- All room assignments
- All inventory locks
- All hold logs

### Loyalty Data
- All loyalty accounts
- All points ledger entries
- All tier history
- All perk redemptions
- All redemption transactions
- All referrals
- All tier transfers

### Guest/Member Users (if not --keep-staff)
- Users with only GUEST or MEMBER roles
- Their user roles

**Note**: Staff users (STAFF_FRONTDESK, STAFF_OPS, MANAGER, ADMIN, SUPERADMIN) are preserved if `--keep-staff` is used.

---

## Data Relationships

All data is properly linked:

```
Staff User (STAFF_FRONTDESK/MANAGER)
  └─ Assigned to Threads

Loyalty User
  └─ Loyalty Account
      └─ Bookings
          └─ Threads (booking-related)
              └─ Assigned to Staff User

Loyalty User
  └─ Threads (general inquiries)
      └─ Assigned to Staff User
```

---

## Verification

After running the seed script, verify the data:

### Check Staff Users

```sql
SELECT 
  u.name,
  u.email,
  ur.role_key,
  p.name as property_name
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN properties p ON p.id = ur.scope_id AND ur.scope_type = 'PROPERTY'
WHERE ur.role_key IN ('STAFF_FRONTDESK', 'STAFF_OPS', 'MANAGER')
ORDER BY ur.role_key, p.name;
```

### Check Thread Assignments

```sql
SELECT 
  t.subject,
  t.status,
  t.assigned_to,
  u.name as assigned_staff,
  ur.role_key as staff_role,
  b.confirmation_number
FROM email_threads t
LEFT JOIN users u ON u.id = t.assigned_to
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN bookings b ON b.id = t.booking_id
ORDER BY t.created_at DESC
LIMIT 20;
```

### Check Data Consistency

```sql
-- Verify threads are linked to bookings/users
SELECT 
  COUNT(*) as total_threads,
  COUNT(booking_id) as threads_with_booking,
  COUNT(user_id) as threads_with_user,
  COUNT(assigned_to) as threads_assigned
FROM email_threads;
```

---

## Customization

### Adjust Number of Loyalty Users

Edit `backend/prisma/seed_master_complete.js` and modify the call to `seedLoyaltyAndBookings`:

```javascript
await seedLoyaltyAndBookings({ 
  deleteExistingBookings: false,
  skipCleanup: true,
  totalUsers: 150 // Change this number
});
```

### Adjust Staff Distribution

Edit the `createStaffUsers` function:

```javascript
const frontdeskCount = randomInt(2, 3); // Change range
const opsCount = randomInt(1, 2); // Change range
```

### Adjust Communication Hub Data

Edit the `createCommunicationHubData` function:

```javascript
const bookingThreadsCount = Math.floor(bookings.length * 0.6); // Change percentage
const generalThreadsCount = Math.floor(bookings.length * 0.3); // Change percentage
```

---

## Troubleshooting

### Error: "Organization not found"

**Solution**: Run RBAC seed first:
```bash
node seed_rbac.js
```

### Error: "No properties or room types found"

**Solution**: Seed properties and room types first:
```bash
npm run seed  # Or run your property seed scripts
```

### Error: Foreign key constraint violation

**Solution**: The script should handle cleanup automatically. If you get this error, the cleanup order might be wrong. Check the error message and adjust the cleanup order in the script.

---

## Individual Seed Scripts

### Tier Configs

```bash
npm run seed:tier-configs
```

**Creates:** MEMBER, SILVER, GOLD, PLATINUM, DIAMOND tier configurations

### Points Rules

```bash
npm run seed:points-rules
```

**Creates:** Weekend bonus, long stay bonus, direct booking bonus rules

### RBAC

```bash
node seed_rbac.js
```

**Creates:** Organization, roles, superadmin user

---

## Related Documentation

- [Loyalty Architecture](../architecture/loyalty.md) - Tier structure and points calculation
- [Booking Architecture](../architecture/booking.md) - Booking lifecycle
- [Communication Hub Architecture](../architecture/communication-hub.md) - Thread linking

---

**Code Locations:**
- Master Seed Script: `backend/prisma/seed_master_complete.js`
- Tier Configs Seed: `backend/prisma/seed_tier_configs.js`
- Points Rules Seed: `backend/prisma/seed_points_rules.js`
- RBAC Seed: `backend/seed_rbac.js`

