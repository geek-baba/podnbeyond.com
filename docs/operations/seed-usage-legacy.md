# Master Complete Seed Script Usage Guide

## Overview

The `seed_master_complete.js` script creates comprehensive, interconnected test data for the entire system:
- **Staff users** with property-scoped roles (STAFF_FRONTDESK, STAFF_OPS, MANAGER)
- **Loyalty users** with accounts and bookings
- **Communication hub data** (threads, emails, WhatsApp messages) linked to bookings and users
- **All data properly linked** for realistic testing

## Prerequisites

Before running the master seed script, ensure you have:

1. **Properties seeded**: Run property seed scripts first
2. **Room types seeded**: Room types must exist for bookings
3. **Tier configs seeded**: Run `npm run seed:tier-configs`
4. **Points rules seeded** (optional): Run `npm run seed:points-rules` for bonus rules
5. **RBAC seeded**: Run `npm run seed` or `node seed_rbac.js` to ensure roles exist

## Usage

### Basic Usage (Clean Slate)

```bash
cd backend
npm run seed:master-complete
```

This will:
- **Delete ALL existing data**: Bookings, loyalty accounts, communication hub data, guest users
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

This will:
- Keep existing staff users (SUPERADMIN, ADMIN, existing staff)
- Delete guest/member users, bookings, loyalty accounts, communication hub data
- Create new loyalty users, bookings, and communication hub data
- Create additional staff users if needed

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

## What Gets Created

### Staff Users

**Per Property:**
- **2-3 STAFF_FRONTDESK**: Handle check-ins/check-outs, respond to inquiries
- **1-2 STAFF_OPS**: Manage inventory, pricing, operations
- **1 MANAGER**: Full property management, handle escalated issues

All staff users have:
- Property-scoped roles
- Realistic Indian names
- Email addresses (@capsulepodhotel.com)
- Phone numbers

### Loyalty Users

- **120 users** with loyalty accounts
- **Tier distribution**:
  - 40% MEMBER
  - 30% SILVER
  - 20% GOLD
  - 8% PLATINUM
  - 2% DIAMOND
- **Bookings** created to match tier requirements
- **Points** calculated and awarded
- **Metrics** (stays, nights, spend) match actual bookings

### Communication Hub Data

- **60% booking-related threads**: Linked to bookings
  - Booking confirmation requests
  - Check-in/check-out inquiries
  - Cancellation requests
  - Special requests
- **30% general inquiry threads**: Linked to users
  - Property information
  - Amenities questions
  - Pricing inquiries
- **Threads assigned to staff**: Based on property and role
- **Emails and WhatsApp messages**: Realistic conversations
- **SLA tracking**: First response times, resolution times

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

### Data inconsistency

**Solution**: Re-run the seed script. It will clean up and recreate everything.

## Best Practices

1. **Run on staging first**: Always test on staging before production
2. **Backup database**: Always backup before running seed scripts
3. **Run during off-hours**: Seed scripts can take 5-10 minutes with large datasets
4. **Monitor performance**: For 120+ users, expect 5-10 minutes execution time
5. **Verify after seeding**: Run verification queries to ensure data consistency

## Related Scripts

- `seed_loyalty_and_bookings.js`: Creates only loyalty accounts and bookings
- `seed_conversations.js`: Creates only communication hub data
- `seed_rbac.js`: Creates roles and organization

## Next Steps

After seeding:

1. **Verify staff users**: Check that staff can log in and see assigned threads
2. **Test communication hub**: Verify threads are assigned correctly
3. **Test loyalty program**: Verify tier distribution and points
4. **Test booking flow**: Verify bookings are linked to loyalty accounts
5. **Test staff workflows**: Verify staff can manage bookings and threads

