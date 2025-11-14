# Loyalty Program Seed Script Usage Guide

## Overview

The `seed_loyalty_and_bookings.js` script creates realistic loyalty accounts and bookings that are perfectly aligned with each other. It ensures that:

- Loyalty metrics (stays, nights, spend) match actual booking data
- Points are calculated correctly based on spend and tier
- Tiers are assigned based on actual qualification metrics
- Data is consistent and realistic for testing

## Prerequisites

Before running the seed script, ensure you have:

1. **Properties seeded**: Run property seed scripts first
2. **Room types seeded**: Room types must exist for bookings
3. **Tier configs seeded**: Run `npm run seed:tier-configs`
4. **Points rules seeded** (optional): Run `npm run seed:points-rules` for bonus rules

## Usage

### Basic Usage (Keeps Existing Bookings)

```bash
cd backend
npm run seed:loyalty-bookings
```

This will:
- Delete all loyalty accounts and related data
- **Keep existing bookings** (just unlink them from loyalty accounts)
- Create new users with loyalty accounts
- Create new bookings for the seeded users

### Delete All Bookings (Clean Slate)

```bash
cd backend
npm run seed:loyalty-bookings -- --delete-bookings
# or
npm run seed:loyalty-bookings -- -d
```

This will:
- Delete **ALL existing bookings** and related data (payments, stays, guests, etc.)
- Delete all loyalty accounts
- Create fresh users with loyalty accounts
- Create new bookings aligned with loyalty accounts

**⚠️ WARNING**: This will permanently delete all booking data!

### What It Does

1. **Cleans existing data**:
   - Deletes all loyalty accounts
   - Deletes points ledger entries
   - Deletes tier history
   - Deletes perk redemptions and redemption transactions
   - **Option 1 (default)**: Unlinks bookings from loyalty accounts (keeps bookings)
   - **Option 2 (--delete-bookings)**: Deletes ALL bookings and related data (payments, stays, guests, audit logs, room assignments, etc.)

2. **Creates users** (120 by default):
   - Generates users with Indian names
   - Creates loyalty accounts with member numbers
   - Distributes users across tiers:
     - 40% MEMBER
     - 30% SILVER
     - 20% GOLD
     - 8% PLATINUM
     - 2% DIAMOND

3. **Generates bookings**:
   - Creates bookings for each user to meet their target tier requirements
   - Bookings have realistic dates (past 12 months)
   - Bookings have realistic prices (₹1,500 - ₹5,000 per night)
   - Most bookings are CHECKED_OUT (completed stays)

4. **Calculates points**:
   - Awards points based on tier at time of booking
   - Applies bonuses (weekend, long stay, direct booking)
   - Creates points ledger entries

5. **Updates metrics**:
   - Updates lifetimeStays, lifetimeNights, lifetimeSpend
   - Recalculates tier based on final metrics
   - Creates tier history entries for upgrades

## Customization

### Adjust Number of Users

Edit `backend/prisma/seed_loyalty_and_bookings.js`:

```javascript
const totalUsers = 120; // Change this number
```

### Adjust Tier Distribution

Edit the `TIER_DISTRIBUTION` object:

```javascript
const TIER_DISTRIBUTION = {
  MEMBER: 40,    // Percentage
  SILVER: 30,
  GOLD: 20,
  PLATINUM: 8,
  DIAMOND: 2
};
```

### Adjust Price Range

Edit the price generation in `generateBookingsForUser`:

```javascript
const pricePerNight = randomFloat(1500, 5000); // Change range
```

## Verification

After running the seed script, verify the data:

### Check Tier Distribution

```sql
SELECT tier, COUNT(*) as count 
FROM loyalty_accounts 
GROUP BY tier 
ORDER BY 
  CASE tier 
    WHEN 'MEMBER' THEN 1
    WHEN 'SILVER' THEN 2
    WHEN 'GOLD' THEN 3
    WHEN 'PLATINUM' THEN 4
    WHEN 'DIAMOND' THEN 5
  END;
```

### Check Data Consistency

```sql
-- Verify bookings match loyalty metrics
SELECT 
  la.id,
  la.member_number,
  la.tier,
  la.lifetime_stays,
  la.lifetime_nights,
  la.lifetime_spend,
  COUNT(DISTINCT b.id) as booking_count,
  SUM(CASE WHEN b.status = 'CHECKED_OUT' THEN 1 ELSE 0 END) as completed_stays,
  SUM(CASE WHEN b.status = 'CHECKED_OUT' THEN EXTRACT(EPOCH FROM (b.check_out - b.check_in)) / 86400 ELSE 0 END) as total_nights,
  SUM(CASE WHEN b.status = 'CHECKED_OUT' THEN b.total_price ELSE 0 END) as total_spend
FROM loyalty_accounts la
LEFT JOIN bookings b ON b.loyalty_account_id = la.id
GROUP BY la.id, la.member_number, la.tier, la.lifetime_stays, la.lifetime_nights, la.lifetime_spend
HAVING 
  la.lifetime_stays != COUNT(DISTINCT CASE WHEN b.status = 'CHECKED_OUT' THEN b.id END)
  OR la.lifetime_spend != SUM(CASE WHEN b.status = 'CHECKED_OUT' THEN b.total_price ELSE 0 END)
LIMIT 10;
```

This query should return 0 rows if data is consistent.

### Check Points Calculation

```sql
-- Verify points were awarded correctly
SELECT 
  la.member_number,
  la.tier,
  la.points,
  SUM(pl.points) as points_from_ledger
FROM loyalty_accounts la
LEFT JOIN points_ledger pl ON pl.loyalty_account_id = la.id AND pl.type = 'EARNED'
GROUP BY la.id, la.member_number, la.tier, la.points
HAVING la.points != COALESCE(SUM(pl.points), 0)
LIMIT 10;
```

## Troubleshooting

### Error: "No properties or room types found"

**Solution**: Seed properties and room types first:
```bash
npm run seed  # Or run your property seed scripts
```

### Error: Foreign key constraint violation

**Solution**: The script should handle cleanup automatically. If you get this error, manually clean up:
```sql
-- Delete in order
DELETE FROM points_ledger;
DELETE FROM perk_redemption;
DELETE FROM redemption_transaction;
DELETE FROM tier_history;
DELETE FROM referral;
DELETE FROM tier_transfer;
UPDATE bookings SET loyalty_account_id = NULL;
DELETE FROM loyalty_accounts;
```

### Data inconsistency after seeding

**Solution**: Re-run the seed script. It will clean up and recreate everything.

## Best Practices

1. **Run on staging first**: Test the seed script on staging before production
2. **Backup database**: Always backup before running seed scripts
3. **Run during off-hours**: Seed scripts can take time with large datasets
4. **Monitor performance**: For 120+ users, the script may take 2-5 minutes

## Next Steps

After seeding:

1. **Verify tier distribution**: Check that tiers match your expectations
2. **Test tier upgrades**: Create test bookings to trigger tier upgrades
3. **Test points redemption**: Verify redemption catalog works
4. **Test perks**: Verify perks are applied correctly
5. **Test campaigns**: Verify campaigns work with seeded data

## Related Documentation

- [Loyalty Program Redesign Plan](./LOYALTY_PROGRAM_REDESIGN_PLAN.md)
- [Loyalty Tier Structure](./LOYALTY_TIER_STRUCTURE.md)
- [Loyalty Seed Strategy](./LOYALTY_SEED_STRATEGY.md)

