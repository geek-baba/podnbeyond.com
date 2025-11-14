# Comprehensive Seed Data Plan - 3 Years of Realistic Data

## Overview

This plan outlines the strategy for creating comprehensive, realistic seed data covering **3 years of booking history** with all use cases for testing and demonstration.

## Goals

1. **3 Years of Booking History**: Generate bookings spanning the past 3 years (1095 days)
2. **Complete Use Case Coverage**: All booking statuses, sources, loyalty tiers, and communication channels
3. **Realistic Distribution**: Booking patterns that reflect real-world hotel operations
4. **Proper Relationships**: All data properly linked (bookings → loyalty → communication hub → staff)

## Booking Data Requirements

### 1. Time Distribution (3 Years)

**Year 1 (Oldest - 1095 to 730 days ago)**
- 20% of total bookings
- Mostly CHECKED_OUT (historical data)
- Mix of all sources
- Foundation for tier progression

**Year 2 (730 to 365 days ago)**
- 30% of total bookings
- Mostly CHECKED_OUT
- More direct bookings (loyalty program maturing)
- Tier upgrades happening

**Year 3 (365 to 0 days ago - Most Recent)**
- 50% of total bookings
- Mix of all statuses (active bookings)
- More recent = more variety in status
- Current tier distributions

### 2. Booking Status Distribution

| Status | Percentage | Description |
|--------|-----------|-------------|
| CHECKED_OUT | 65% | Completed stays (most common) |
| CONFIRMED | 15% | Upcoming confirmed bookings |
| CHECKED_IN | 5% | Currently checked in |
| CANCELLED | 8% | Cancelled bookings |
| NO_SHOW | 2% | No-show bookings |
| PENDING | 3% | Pending confirmation |
| HOLD | 1% | On hold |
| REJECTED | 0.5% | Rejected bookings |
| COMPLETED | 0.4% | Completed (legacy) |
| FAILED | 0.1% | Failed bookings |

**Status by Time Period:**
- **Past bookings (Year 1-2)**: 95% CHECKED_OUT, 5% CANCELLED/NO_SHOW
- **Recent past (Year 3, 90+ days ago)**: 80% CHECKED_OUT, 15% CANCELLED, 5% other
- **Recent (Year 3, 30-90 days ago)**: 60% CHECKED_OUT, 20% CONFIRMED, 15% CANCELLED, 5% other
- **Current (Year 3, 0-30 days ago)**: 30% CHECKED_OUT, 30% CONFIRMED, 15% CHECKED_IN, 15% CANCELLED, 10% other

### 3. Booking Source Distribution

**Important Notes:**
- **EaseMyTrip and Cleartrip**: Now have their own enum values (`OTA_EASEMYTRIP`, `OTA_CLEARTRIP`) - added to schema
- **Corporate**: Corporate bookings earn points (direct relationship with hotel)
- **OTHER**: Catch-all for any future booking sources not in the enum (no points earned)

| Source | Percentage | Notes |
|--------|-----------|-------|
| WEB_DIRECT | 50% | Direct bookings (earn points) |
| OTA_BOOKING_COM | 20% | Booking.com (no points) |
| OTA_MMT | 15% | Go-MMT / MakeMyTrip (no points) |
| OTA_EASEMYTRIP | 1% | EaseMyTrip.com (no points) |
| OTA_CLEARTRIP | 1% | Cleartrip.com (no points) |
| PHONE | 8% | Phone bookings (earn points) |
| WALK_IN | 3% | Walk-in bookings (earn points) |
| CORPORATE | 2% | Corporate bookings (earn points) |
| OTHER | 0% | Other sources (catch-all for future OTAs, partner bookings, etc. - no points) |

**Source by Tier:**
- **DIAMOND/PLATINUM**: 75% WEB_DIRECT, 15% PHONE, 10% OTA/OTHER
- **GOLD**: 65% WEB_DIRECT, 20% PHONE, 15% OTA/OTHER
- **SILVER**: 55% WEB_DIRECT, 25% PHONE, 20% OTA/OTHER
- **MEMBER**: 45% WEB_DIRECT, 30% PHONE, 25% OTA/OTHER

**OTA Distribution (when OTA source is selected):**
- 55% OTA_BOOKING_COM (Booking.com)
- 40% OTA_MMT (Go-MMT / MakeMyTrip)
- 3% OTA_EASEMYTRIP (EaseMyTrip.com)
- 2% OTA_CLEARTRIP (Cleartrip.com)

### 4. Loyalty Tier Booking Patterns

#### MEMBER (40% of users, ~48 users)
- **Total Bookings**: 1-3 bookings over 3 years
- **Booking Frequency**: 1 booking per 12-18 months
- **Average Stay**: 1-2 nights
- **Average Spend**: ₹2,000 - ₹4,000 per stay
- **Source Mix**: 45% direct, 30% phone, 25% OTA/OTHER
- **Status**: Mostly CHECKED_OUT (90%)

#### SILVER (30% of users, ~36 users)
- **Total Bookings**: 3-6 bookings over 3 years
- **Booking Frequency**: 1 booking per 6-9 months
- **Average Stay**: 2-3 nights
- **Average Spend**: ₹3,000 - ₹6,000 per stay
- **Source Mix**: 55% direct, 25% phone, 20% OTA/OTHER
- **Status**: Mostly CHECKED_OUT (85%), some upcoming CONFIRMED

#### GOLD (20% of users, ~24 users)
- **Total Bookings**: 6-12 bookings over 3 years
- **Booking Frequency**: 1 booking per 3-4 months
- **Average Stay**: 2-4 nights
- **Average Spend**: ₹4,000 - ₹8,000 per stay
- **Source Mix**: 65% direct, 20% phone, 15% OTA/OTHER
- **Status**: Mix of CHECKED_OUT (75%), CONFIRMED (15%), CHECKED_IN (5%), CANCELLED (5%)

#### PLATINUM (8% of users, ~10 users)
- **Total Bookings**: 12-20 bookings over 3 years
- **Booking Frequency**: 1 booking per 2-3 months
- **Average Stay**: 3-5 nights
- **Average Spend**: ₹5,000 - ₹10,000 per stay
- **Source Mix**: 75% direct, 15% phone, 10% OTA/OTHER
- **Status**: Mix of all statuses, more active bookings

#### DIAMOND (2% of users, ~2-3 users)
- **Total Bookings**: 20-35 bookings over 3 years
- **Booking Frequency**: 1 booking per 1-2 months
- **Average Stay**: 3-7 nights
- **Average Spend**: ₹6,000 - ₹15,000 per stay
- **Source Mix**: 75% direct, 15% phone, 10% OTA
- **Status**: Mix of all statuses, very active

### 5. Booking Volume Estimates

**Total Users**: 120
**Average Bookings per User**: ~8-10 bookings over 3 years
**Total Bookings**: ~1,000-1,200 bookings

**Breakdown by Year:**
- Year 1: ~200-240 bookings (20%)
- Year 2: ~300-360 bookings (30%)
- Year 3: ~500-600 bookings (50%)

**Breakdown by Status:**
- CHECKED_OUT: ~650-780 bookings
- CONFIRMED: ~150-180 bookings
- CHECKED_IN: ~50-60 bookings
- CANCELLED: ~80-96 bookings
- Others: ~70-84 bookings

## Communication Hub Data Requirements

### 1. Thread Distribution

**Total Threads**: ~600-800 threads (60-80% of bookings)

**By Type:**
- **Booking-Related (60%)**: ~360-480 threads
  - Linked to bookings
  - Booking confirmation requests
  - Check-in/check-out inquiries
  - Cancellation requests
  - Special requests (late checkout, early check-in, room upgrade)
  - Payment inquiries
  - Booking modifications

- **General Inquiries (30%)**: ~180-240 threads
  - Linked to users (not bookings)
  - Property information
  - Amenities questions
  - Pricing inquiries
  - Availability checks
  - Group booking inquiries

- **Support/Complaints (10%)**: ~60-80 threads
  - Linked to bookings or users
  - Complaints
  - Feedback
  - Technical issues
  - Refund requests

### 2. Communication Channel Distribution

| Channel | Percentage | Use Cases |
|---------|-----------|-----------|
| Email | 50% | Booking confirmations, inquiries, formal communication |
| WhatsApp | 40% | Quick questions, check-in/out, real-time support |
| SMS | 5% | Reminders, confirmations, alerts |
| Phone Calls | 5% | Complex issues, escalations, urgent matters |

### 3. Thread Status Distribution

| Status | Percentage | Description |
|--------|-----------|-------------|
| RESOLVED | 70% | Completed conversations |
| IN_PROGRESS | 15% | Active conversations |
| WAITING_FOR_GUEST | 8% | Waiting for guest response |
| NEW | 5% | New, unassigned threads |
| ARCHIVED | 2% | Archived threads |

### 4. Thread Assignment

- **60% assigned to STAFF_FRONTDESK**: General inquiries, booking questions
- **30% assigned to MANAGER**: Escalated issues, complaints, refunds
- **10% unassigned**: New threads, for testing assignment workflow

### 5. SLA Tracking

- **First Response Time**: 5-30 minutes (realistic)
- **Resolution Time**: 30 minutes - 4 hours (depending on complexity)
- **SLA Breaches**: ~5% of threads (for testing SLA monitoring)

## Staff User Distribution

### Per Property:
- **2-3 STAFF_FRONTDESK**: Handle most inquiries and bookings
- **1-2 STAFF_OPS**: Manage inventory and operations
- **1 MANAGER**: Handle escalations and management tasks

**Total Staff**: ~12-18 staff users across all properties

## Data Relationships

### Booking → Loyalty
- All direct bookings linked to loyalty accounts
- OTA bookings NOT linked (no points)
- Points calculated and awarded for direct bookings
- Metrics updated on checkout

### Booking → Communication Hub
- 60% of bookings have associated threads
- Threads created at various stages (before booking, during stay, after checkout)
- Threads assigned to staff based on property

### User → Communication Hub
- 30% of users have general inquiry threads
- Higher tier users have more threads (more engaged)

### Staff → Communication Hub
- All threads assigned to appropriate staff
- Staff workload distributed evenly
- Some threads unassigned for testing

## Implementation Strategy

### Phase 1: Enhanced Booking Generation
1. Extend time range to 3 years
2. Implement realistic status distribution by time period
3. Implement source distribution by tier
4. Generate bookings with proper date distribution

### Phase 2: Tier-Specific Patterns
1. Different booking frequencies per tier
2. Different stay durations per tier
3. Different spend patterns per tier
4. Tier progression over time

### Phase 3: Communication Hub Enhancement
1. Generate threads for 60-80% of bookings
2. Create general inquiry threads for users
3. Distribute across all communication channels
4. Assign threads to staff appropriately
5. Add SLA tracking data

### Phase 4: Data Validation
1. Verify all relationships are correct
2. Verify tier calculations match bookings
3. Verify points calculations are correct
4. Verify communication hub links are correct

## Expected Output

### Booking Statistics
- **Total Bookings**: ~1,000-1,200
- **Time Span**: 3 years (1095 days)
- **Status Coverage**: All 10 statuses
- **Source Coverage**: All 10 sources
- **Tier Coverage**: All 5 tiers with realistic patterns

### Communication Hub Statistics
- **Total Threads**: ~600-800
- **Total Emails**: ~1,200-1,600
- **Total WhatsApp Messages**: ~800-1,000
- **Total SMS**: ~100-150
- **Total Calls**: ~50-80

### Staff Statistics
- **Total Staff Users**: ~12-18
- **Threads per Staff**: ~30-50 (distributed)
- **Workload**: Realistic distribution

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

## Performance Considerations

- **Execution Time**: ~10-15 minutes for full seed
- **Database Size**: ~50-100 MB of seed data
- **Query Performance**: Indexes should handle queries efficiently

## Next Steps

1. Review and approve this plan
2. Implement enhanced booking generation
3. Implement tier-specific patterns
4. Implement communication hub enhancements
5. Test and validate data
6. Document usage instructions

