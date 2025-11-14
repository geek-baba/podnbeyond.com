# Loyalty Program - Booking Flow Integration

**Status:** Phase 1 Complete  
**Last Updated:** 2025-01-15

---

## Overview

This document describes how the loyalty program is integrated into the booking flow, including automatic account creation, points awarding, lifetime metrics tracking, and points reversal on cancellation.

---

## Integration Points

### 1. Booking Creation

**Location:** `POST /api/bookings`

**What Happens:**
- For non-OTA bookings with an email, automatically creates or links a loyalty account
- Creates a new user if one doesn't exist
- Generates a member number (6-digit format)
- Links the booking to the loyalty account

**Code Location:** `backend/routes/booking.js` (lines 333-377)

**Logic:**
```javascript
// OTA bookings don't get loyalty accounts
if (!isOTABooking && email && !finalLoyaltyAccountId) {
  // Find or create user
  // Create or get loyalty account
  // Link to booking
}
```

**Features:**
- ✅ Automatic account creation
- ✅ OTA exclusion (no loyalty accounts for OTA bookings)
- ✅ Member number generation
- ✅ Default tier: MEMBER

---

### 2. Payment Completion → Points Awarding

**Location:** `POST /api/payments` + `bookingService.transitionState()`

**What Happens:**
- When payment is completed, booking is automatically confirmed
- When booking transitions to CONFIRMED, points are calculated and awarded
- Points calculation includes:
  - Base points (tier-based rate)
  - Bonus rules (weekend, long-stay, direct booking, etc.)
  - Campaign multipliers
  - OTA exclusion (no points for OTA bookings)

**Code Locations:**
- `backend/routes/payment.js` (lines 94-109) - Payment completion triggers confirmation
- `backend/services/bookingService.js` (lines 231-265) - Confirmation triggers points awarding
- `backend/services/loyaltyService.js` (lines 794-863) - Points calculation and awarding

**Flow:**
```
Payment Completed
  ↓
Booking Confirmed (transitionState)
  ↓
Check if points already awarded (prevent duplicates)
  ↓
Calculate points (with rules and campaigns)
  ↓
Award points (create ledger entry)
  ↓
Check for tier upgrade
```

**Features:**
- ✅ Automatic points calculation
- ✅ Rule-based bonuses
- ✅ Campaign multipliers
- ✅ Duplicate prevention
- ✅ OTA exclusion
- ✅ Tier auto-upgrade

---

### 3. Check-out → Lifetime Metrics Update

**Location:** `POST /api/bookings/:id/check-out`

**What Happens:**
- When booking is checked out, lifetime metrics are updated:
  - `lifetimeStays` incremented by 1
  - `lifetimeNights` incremented by stay length
  - `lifetimeSpend` incremented by final charges
- Tier is re-evaluated after metrics update

**Code Location:** `backend/routes/booking.js` (lines 1045-1062)

**Logic:**
```javascript
// After checkout
const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
const finalSpend = finalCharges !== null ? parseFloat(finalCharges) : booking.totalPrice;

await loyaltyService.updateLifetimeMetrics(
  loyaltyAccountId,
  nights,
  finalSpend
);
```

**Features:**
- ✅ Automatic metrics update
- ✅ Tier re-evaluation
- ✅ Uses final charges (if adjusted at checkout)

---

### 4. Booking Cancellation → Points Reversal

**Location:** `POST /api/bookings/:id/cancel`

**What Happens:**
- When a CONFIRMED booking is cancelled, points are reversed
- Finds the points ledger entry for the booking
- Creates a negative points entry to reverse the exact amount

**Code Location:** `backend/routes/booking.js` (lines 1393-1419)

**Logic:**
```javascript
// Find points awarded for this booking
const pointsAwarded = await prisma.pointsLedger.findFirst({
  where: {
    bookingId: bookingId,
    points: { gt: 0 },
  },
});

// Reverse the points
if (pointsAwarded) {
  await loyaltyService.redeemPoints({
    loyaltyAccountId,
    points: pointsAwarded.points,
    reason: `Points reversal for cancelled booking #${bookingId}`,
  });
}
```

**Features:**
- ✅ Automatic points reversal
- ✅ Exact amount reversal
- ✅ Audit trail maintained
- ✅ Only reverses if booking was CONFIRMED

---

## Points Calculation Flow

### When Points Are Calculated

1. **Booking Confirmation** (automatic)
   - Triggered when booking status changes to CONFIRMED
   - Happens after payment completion or manual confirmation

2. **Manual Calculation** (API)
   - `POST /api/loyalty/calculate-points`
   - Used during booking flow to show estimated points

### Calculation Steps

1. **Check OTA Exclusion**
   - OTA bookings return 0 points immediately

2. **Get Tier Configuration**
   - Retrieves base points rate for member's tier

3. **Calculate Base Points**
   - `basePoints = (roomRevenue + addOnRevenue) / 100 * tierRate`

4. **Evaluate Rules**
   - Weekend bonus (+50%)
   - Long stay bonus (+30% for 5+ nights)
   - Direct booking bonus (+20%)
   - Off-season bonus (+25%)
   - Prepaid bonus (+10%)
   - Premium room bonus (+10%)

5. **Apply Campaigns**
   - Seasonal multipliers (2x, 3x points)
   - Bonus points campaigns

6. **Calculate Total**
   - `totalPoints = floor(basePoints * multiplier) + bonusPoints`

---

## Points Awarding Flow

### When Points Are Awarded

1. **Booking Confirmation** (automatic)
   - Points are awarded when booking is confirmed
   - Only awarded once per booking (duplicate prevention)

2. **Manual Award** (Admin)
   - `PATCH /api/loyalty/accounts/:id` with `addPoints`

### Awarding Steps

1. **Check Duplicate**
   - Verifies points weren't already awarded for this booking

2. **Calculate Points**
   - Uses `calculatePoints()` function

3. **Create Ledger Entry**
   - Records points, reason, booking link
   - Stores metadata (rules, campaigns applied)

4. **Update Account**
   - Updates points balance
   - Updates lastUpdated timestamp

5. **Check Tier Upgrade**
   - Re-evaluates tier based on new points
   - Creates tier history if upgraded

---

## Lifetime Metrics Update Flow

### When Metrics Are Updated

1. **Check-out** (automatic)
   - Metrics updated when booking is checked out

2. **Manual Update** (Admin)
   - `PATCH /api/loyalty/accounts/:id` with `addStays`, `addNights`, `addSpend`

### Update Steps

1. **Calculate Nights**
   - `nights = ceil((checkOut - checkIn) / 24 hours)`

2. **Get Final Spend**
   - Uses `finalCharges` if provided, otherwise `totalPrice`

3. **Update Metrics**
   - Increment `lifetimeStays` by 1
   - Increment `lifetimeNights` by nights
   - Increment `lifetimeSpend` by spend

4. **Check Tier Upgrade**
   - Re-evaluates tier based on updated metrics
   - Creates tier history if upgraded

---

## Points Reversal Flow

### When Points Are Reversed

1. **Booking Cancellation** (automatic)
   - Points reversed when CONFIRMED booking is cancelled

2. **Manual Reversal** (Admin)
   - `POST /api/loyalty/redeem` with negative points

### Reversal Steps

1. **Find Points Awarded**
   - Searches points ledger for positive points entry for booking

2. **Verify Reversal Needed**
   - Only reverses if booking was CONFIRMED
   - Only reverses if points were actually awarded

3. **Create Reversal Entry**
   - Creates negative points ledger entry
   - Links to same booking
   - Records reversal reason

4. **Update Account**
   - Deducts points from balance
   - Updates lastUpdated timestamp

---

## OTA Booking Handling

### OTA Sources
- `OTA_BOOKING_COM`
- `OTA_MMT`
- `OTA_GOIBIBO`
- `OTA_YATRA`
- `OTA_AGODA`

### OTA Rules
1. **No Loyalty Account Creation**
   - OTA bookings don't get loyalty accounts linked

2. **No Points Awarding**
   - Points calculation returns 0 immediately for OTA bookings
   - No points ledger entries created

3. **Rationale**
   - Encourage direct bookings
   - Avoid OTA commission costs
   - Reward direct customer relationships

---

## Error Handling

### Graceful Degradation
- Loyalty operations don't fail booking operations
- Errors are logged but don't block booking flow
- Points can be manually adjusted later if needed

### Error Scenarios
1. **Points Calculation Fails**
   - Logged, booking continues
   - Points can be manually awarded later

2. **Points Awarding Fails**
   - Logged, booking confirmed
   - Points can be manually awarded later

3. **Metrics Update Fails**
   - Logged, checkout continues
   - Metrics can be manually updated later

4. **Points Reversal Fails**
   - Logged, cancellation continues
   - Points can be manually reversed later

---

## Testing Scenarios

### Scenario 1: Direct Booking Flow
1. Create booking with email (non-OTA)
2. ✅ Loyalty account created/linked
3. Complete payment
4. ✅ Booking confirmed
5. ✅ Points awarded
6. Check-out booking
7. ✅ Lifetime metrics updated
8. ✅ Tier re-evaluated

### Scenario 2: OTA Booking Flow
1. Create booking with OTA source
2. ✅ No loyalty account created
3. Complete payment
4. ✅ Booking confirmed
5. ✅ No points awarded (OTA exclusion)

### Scenario 3: Booking Cancellation
1. Create and confirm booking
2. ✅ Points awarded
3. Cancel booking
4. ✅ Points reversed
5. ✅ Points balance updated

### Scenario 4: Tier Upgrade
1. Member has 4,900 points (SILVER tier)
2. Booking awards 200 points
3. ✅ Points awarded (total: 5,100)
4. ✅ Tier upgraded to GOLD
5. ✅ Tier history created

---

## API Endpoints Used

### Booking Endpoints
- `POST /api/bookings` - Create booking (creates/links loyalty account)
- `POST /api/bookings/:id/check-out` - Check-out (updates metrics)
- `POST /api/bookings/:id/cancel` - Cancel (reverses points)

### Payment Endpoints
- `POST /api/payments` - Create payment (triggers confirmation → points)

### Loyalty Endpoints
- `POST /api/loyalty/calculate-points` - Calculate points (preview)
- `GET /api/loyalty/member/:id` - Get member profile
- `GET /api/loyalty/tier-progress/:id` - Get tier progress

---

## Database Changes

### Tables Modified
- `loyalty_accounts` - Updated with lifetime metrics
- `points_ledger` - New entries for points transactions
- `tier_history` - New entries for tier changes
- `bookings` - Linked to loyalty accounts

### New Tables
- `tier_configs` - Tier configurations
- `points_rules` - Points calculation rules
- `campaigns` - Seasonal campaigns
- `perks` - Perk definitions
- `perk_redemptions` - Perk usage
- `redemption_items` - Redemption catalog
- `redemption_transactions` - Redemption tracking
- `referrals` - Referral program
- `tier_transfers` - Tier transfers

---

## Next Steps

### Phase 2: Perk Engine
- Auto-apply perks on booking
- Perk eligibility checking
- Perk redemption tracking

### Phase 3: Campaign System
- Seasonal campaign management
- Campaign targeting
- Campaign analytics

### Phase 4: Redemption Engine
- Redemption catalog
- Points redemption during booking
- Dynamic pricing for redemptions

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-15  
**Status:** Complete - Phase 1 Integration

