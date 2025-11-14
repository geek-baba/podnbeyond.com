# Loyalty Program Seed Strategy

## Overview
This document outlines the strategy for seeding realistic loyalty program data that aligns with booking data.

## Goals
1. **Data Consistency**: Loyalty metrics (stays, nights, spend) must match actual bookings
2. **Realistic Distribution**: Tier distribution should reflect real-world patterns
3. **Accurate Points**: Points should be calculated based on actual spend and tier
4. **Testing Coverage**: Data should support testing all tier levels and scenarios

## Tier Distribution Strategy

### Target Distribution
- **MEMBER**: 40% (new members, low activity)
- **SILVER**: 30% (regular guests)
- **GOLD**: 20% (frequent guests)
- **PLATINUM**: 8% (very frequent guests)
- **DIAMOND**: 2% (VIP guests)

### Tier Requirements (from tier configs)
- **MEMBER**: Free (default)
- **SILVER**: 5,000 points OR 2 stays OR 5 nights
- **GOLD**: 25,000 points OR 6 stays OR 15 nights
- **PLATINUM**: 75,000 points OR 12 stays OR 30 nights
- **DIAMOND**: 150,000 points OR 60 nights OR ₹1.5L spend

## Data Generation Strategy

### Step 1: Create Users with Loyalty Accounts
- Generate 100-150 users with Indian names
- Create loyalty accounts for each user
- Assign member numbers sequentially

### Step 2: Determine Target Tier for Each User
- Distribute users across tiers based on target distribution
- For each tier, determine required metrics:
  - Calculate minimum stays/nights/spend needed
  - Add some buffer to ensure tier qualification

### Step 3: Generate Bookings
- For each user, create bookings that match their target tier
- Bookings should:
  - Have realistic dates (past 12 months)
  - Have realistic prices (₹1,500 - ₹5,000 per night)
  - Be linked to the user's loyalty account
  - Have appropriate statuses (mostly CHECKED_OUT for completed stays)

### Step 4: Calculate Points
- For each booking:
  - Determine tier at time of booking (may be lower than current tier)
  - Calculate base points: (spend / 100) * pointsPer100Rupees
  - Apply bonuses (weekend, long stay, direct booking, etc.)
  - Award points to loyalty account

### Step 5: Update Loyalty Metrics
- For CHECKED_OUT bookings:
  - Increment lifetimeStays
  - Increment lifetimeNights (based on check-in/check-out dates)
  - Increment lifetimeSpend (based on totalPrice)
- Recalculate tier based on updated metrics

## Implementation Approach

### Option 1: Single Comprehensive Seed Script (Recommended)
**Pros:**
- Single source of truth
- Ensures data consistency
- Easier to maintain

**Cons:**
- Larger script
- Longer execution time

### Option 2: Separate Scripts with Dependencies
**Pros:**
- Modular approach
- Can run independently

**Cons:**
- Risk of data inconsistency
- More complex dependency management

## Recommended: Option 1

Create `backend/prisma/seed_loyalty_and_bookings.js` that:
1. Cleans existing loyalty data (accounts, points ledger, tier history)
2. Creates users with loyalty accounts
3. Generates bookings for each user
4. Calculates and awards points
5. Updates loyalty metrics
6. Recalculates tiers

## Data Cleanup Strategy

Before seeding, delete:
- All loyalty accounts (cascade will handle related data)
- Points ledger entries
- Tier history
- Perk redemptions
- Redemption transactions
- Referrals
- Tier transfers

**Note**: Keep existing bookings that aren't linked to loyalty accounts, or delete all bookings and recreate them.

## Points Calculation Logic

For each booking:
1. Get user's tier at booking time (may need to track tier history)
2. Get base points rate from tier config
3. Calculate base points: `(totalPrice / 100) * basePointsPer100Rupees`
4. Apply applicable bonuses:
   - Weekend bonus: +50% if Friday-Sunday
   - Long stay bonus: +30% if 5+ nights
   - Direct booking bonus: +20% if WEB_DIRECT
   - Off-season bonus: +25% (if applicable)
   - Prepaid bonus: +10% (if applicable)
5. Award points to loyalty account
6. Create points ledger entry

## Testing Scenarios

The seed data should support testing:
- Tier qualification (via points, stays, nights, spend)
- Tier upgrades
- Points earning at different tiers
- Points redemption
- Perk eligibility
- Campaign participation
- Redemption catalog items

## Next Steps

1. Create the seed script
2. Test with small dataset (10-20 users)
3. Verify data consistency
4. Scale to full dataset (100-150 users)
5. Document any assumptions or limitations

