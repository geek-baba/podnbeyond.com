# Comprehensive Seed Data Plan - Executive Summary

## Overview

Create a master seed script that generates **3 years of realistic, interconnected test data** covering all system modules with proper relationships and use cases.

## What Gets Created

### 1. Staff Users (~12-18 users)
**Per Property:**
- **2-3 STAFF_FRONTDESK**: Handle check-ins/check-outs, respond to inquiries
- **1-2 STAFF_OPS**: Manage inventory, pricing, operations  
- **1 MANAGER**: Full property management, handle escalations

**Total**: ~12-18 staff users across all properties
- Property-scoped roles
- Realistic Indian names
- Email addresses (@capsulepodhotel.com)
- Phone numbers

### 2. Loyalty Users & Accounts (120 users)
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

### 3. Bookings (~1,000-1,200 bookings over 3 years)

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

**Tier-Specific Patterns:**
- **MEMBER**: 1-3 bookings, 1-2 nights, ₹2K-4K per stay, 45% direct
- **SILVER**: 3-6 bookings, 2-3 nights, ₹3K-6K per stay, 55% direct
- **GOLD**: 6-12 bookings, 2-4 nights, ₹4K-8K per stay, 65% direct
- **PLATINUM**: 12-20 bookings, 3-5 nights, ₹5K-10K per stay, 75% direct
- **DIAMOND**: 20-35 bookings, 3-7 nights, ₹6K-15K per stay, 75% direct

### 4. Communication Hub Data (~600-800 threads)

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
- 10% unassigned (for testing assignment workflow)

## Data Relationships

```
Staff User (STAFF_FRONTDESK/MANAGER)
  └─ Assigned to Threads

Loyalty User
  └─ Loyalty Account
      └─ Bookings (linked by loyaltyAccountId)
          ├─ Points awarded (for direct bookings only)
          ├─ Metrics updated (stays, nights, spend on checkout)
          └─ Threads (booking-related, 60% of bookings)

Loyalty User
  └─ Threads (general inquiries, 30% of users)
      └─ Assigned to Staff User
```

## What Gets Deleted

**Before creating new data, the script deletes:**
1. All communication hub data (threads, emails, messages, calls, contacts)
2. All booking-related data (payments, stays, guests, audit logs, room assignments)
3. All bookings
4. All loyalty data (accounts, points ledger, tier history, redemptions)
5. Guest/member users (optional - can keep staff with `--keep-staff` flag)

## Key Features

### Realistic Data
- **3 years of history**: Bookings span 1095 days
- **Time-based status distribution**: Recent bookings have more variety
- **Tier progression**: Users progress through tiers over time
- **Proper linking**: All data properly linked (bookings → loyalty → threads → staff)

### Complete Use Case Coverage
- **All 10 booking statuses**: Every status represented
- **All 4 OTA sources**: Booking.com, Go-MMT, EaseMyTrip, Cleartrip
- **All 5 loyalty tiers**: With realistic booking patterns
- **All communication channels**: Email, WhatsApp, SMS, Calls
- **All booking sources**: Direct, OTA, Phone, Walk-in, Corporate

### Data Consistency
- **Loyalty metrics match bookings**: Stays, nights, spend calculated from actual bookings
- **Points match bookings**: Points awarded only for direct bookings
- **Tiers match metrics**: Tiers calculated based on actual qualification metrics
- **Threads linked correctly**: Booking threads linked to bookings, general threads linked to users

## Expected Output

### Statistics
- **Staff Users**: ~12-18
- **Loyalty Members**: 120
- **Total Bookings**: ~1,000-1,200
- **Communication Threads**: ~600-800
- **Emails**: ~1,200-1,600
- **WhatsApp Messages**: ~800-1,000
- **SMS**: ~100-150
- **Calls**: ~50-80

### Time Span
- **3 years** of booking history (1095 days)
- Bookings distributed across all 3 years
- More recent = more active bookings

## Usage

```bash
cd backend
npm run seed:master-complete
```

Or to keep existing staff:
```bash
npm run seed:master-complete -- --keep-staff
```

## Testing Scenarios Covered

1. **Loyalty Program**
   - Tier progression over time
   - Points earning (direct bookings only)
   - Points not earned (OTA bookings)
   - Tier benefits application
   - Tier re-qualification

2. **Booking Management**
   - All booking statuses
   - All booking sources
   - Booking lifecycle transitions
   - Cancellation handling
   - No-show handling

3. **Communication Hub**
   - All communication channels
   - Thread assignment
   - SLA tracking
   - Escalation workflows
   - Multi-channel conversations

4. **Staff Workflows**
   - Check-in/check-out
   - Booking management
   - Communication handling
   - Escalation handling

## Performance

- **Execution Time**: ~10-15 minutes for full seed
- **Database Size**: ~50-100 MB of seed data
- **Query Performance**: Indexes handle queries efficiently

## Next Steps

1. ✅ Schema updated (EaseMyTrip, Cleartrip added; unused OTAs removed)
2. ✅ Channel manager updated (matches configured OTAs)
3. ⏳ Implement enhanced booking generation (3 years, all statuses, all sources)
4. ⏳ Implement tier-specific patterns
5. ⏳ Implement communication hub enhancements
6. ⏳ Test and validate data
7. ⏳ Document usage instructions

