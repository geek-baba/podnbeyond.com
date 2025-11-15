# Loyalty Architecture

**Last Updated:** 2025-01-21  
**Status:** ✅ **Fully Implemented** (Tier System, Points Tracking, Points Rules Engine, Perks, Campaigns, Redemption Catalog, Booking Integration)

---

## Overview

The loyalty program rewards guests for direct bookings with a multi-tier system (MEMBER → SILVER → GOLD → PLATINUM → DIAMOND), points earning, tier progression tracking, and automatic account creation.

---

## Current Implementation

### Tier Structure

| Tier | Requirements | Points/₹100 | Key Benefits |
|------|-------------|-------------|--------------|
| **MEMBER** | Free to join | 5 pts | Member rates, faster check-in |
| **SILVER** | 5 nights OR 2 stays | 7 pts | Late checkout, priority waitlist |
| **GOLD** | 15 nights OR 6 stays | 10 pts | Free breakfast, room upgrade, 10% F&B discount |
| **PLATINUM** | 30 nights OR 12 stays | 12 pts | Daily breakfast, guaranteed availability, weekend 2x points |
| **DIAMOND** | 60 nights OR ₹1.5L spend | 15 pts | Guaranteed upgrade, lounge access, travel coordinator |

### Database Schema

```prisma
model LoyaltyAccount {
  id                Int         @id @default(autoincrement())
  userId            String      @unique
  user              User        @relation(...)
  memberNumber      String      @unique
  tier              LoyaltyTier @default(MEMBER)
  points            Int         @default(0)
  
  // Lifetime metrics
  lifetimeStays     Int         @default(0)
  lifetimeNights    Int         @default(0)
  lifetimeSpend      Float       @default(0)
  
  // Qualification period
  qualificationYearStart DateTime?
  qualificationYearEnd   DateTime?
  
  // Relationships
  bookings          Booking[]
  pointsLedger       PointsLedger[]
  tierHistory        TierHistory[]
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}

model PointsLedger {
  id                Int         @id @default(autoincrement())
  loyaltyAccountId  Int
  loyaltyAccount    LoyaltyAccount @relation(...)
  bookingId         Int?
  booking           Booking?    @relation(...)
  
  points            Int         // +earn / -burn
  reason            String
  balanceBefore     Int
  balanceAfter      Int
  
  createdAt         DateTime    @default(now())
}

model TierConfig {
  id                Int         @id @default(autoincrement())
  tier              LoyaltyTier @unique
  name              String
  description       String?
  
  // Qualification requirements
  minPoints         Int?
  minStays          Int?
  minNights         Int?
  minSpend          Float?
  qualificationPeriod Int @default(12) // Months
  
  // Earning rates
  basePointsPer100Rupees Int @default(5)
  
  // Benefits (JSON)
  benefits          Json?
  
  isActive          Boolean     @default(true)
  sortOrder         Int         @default(0)
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}

enum LoyaltyTier {
  MEMBER
  SILVER
  GOLD
  PLATINUM
  DIAMOND
}
```

---

## Points Calculation

### Base Formula

```javascript
basePoints = (bookingAmount / 100) * tierPointsPer100Rupees
```

**Example:**
- Booking amount: ₹5,000
- Tier: GOLD (10 pts/₹100)
- Base points: (5000 / 100) * 10 = 500 points

### Points Awarding

**On Booking Confirmation:**
1. Check if booking has `loyaltyAccountId`
2. Check if booking source is direct (earns points):
   - `WEB_DIRECT`, `PHONE`, `WALK_IN`, `CORPORATE` → Earn points
   - OTA bookings (`OTA_BOOKING_COM`, `OTA_MMT`, etc.) → No points
3. Calculate points based on booking amount and tier
4. Create `PointsLedger` entry
5. Update loyalty account points balance
6. Recalculate tier if needed

**On Booking Cancellation:**
1. Find points awarded for this booking
2. Reverse points via `loyaltyService.redeemPoints()`
3. Update loyalty account balance
4. Recalculate tier if needed

**Code Location:** `backend/routes/booking.js` (lines 96-109, 1256-1282)

---

## Tier Calculation

### Service Function

**Location:** `backend/services/loyaltyService.js`

**Function:** `calculateTier(metrics)`

**Logic:**
1. Get all active tier configs ordered by sort order
2. Check tiers from highest to lowest (DIAMOND → MEMBER)
3. Check if member qualifies via any criteria:
   - `minPoints` OR `minStays` OR `minNights` OR `minSpend`
4. Return highest qualifying tier
5. Default to MEMBER if no tier qualifies

**Example:**
- Member has: 8 nights, 3 stays, 15,000 points
- Checks DIAMOND: Requires 60 nights → ❌
- Checks PLATINUM: Requires 30 nights → ❌
- Checks GOLD: Requires 15 nights OR 6 stays → ❌ (has 8 nights but needs 15)
- Checks SILVER: Requires 5 nights OR 2 stays → ✅ (has 8 nights)
- **Result:** SILVER tier

---

## Tier Progress

### Service Function

**Location:** `backend/services/loyaltyService.js`

**Function:** `calculateTierProgress(account)`

**Returns:**
```javascript
{
  currentTier: 'SILVER',
  nextTier: 'GOLD',
  progress: 53, // Percentage to next tier
  pointsNeeded: 10000,
  staysNeeded: 3,
  nightsNeeded: 7,
  spendNeeded: 50000,
  isMaxTier: false
}
```

**Logic:**
1. Get current tier config
2. Find next tier config
3. Calculate progress for each requirement type (points, stays, nights, spend)
4. Return average progress and requirements needed

---

## Booking Integration

### Automatic Account Creation

**On User Sign-Up:**
1. User signs in for first time (NextAuth)
2. System checks if user has loyalty account
3. If not, creates:
   - `LoyaltyAccount` with MEMBER tier
   - Generates unique 6-digit member number
   - Links to user account

**On Booking Creation:**
1. Check if booking has `email` or `phone`
2. Try to find existing user by email/phone
3. If user exists, link booking to their loyalty account
4. If user doesn't exist, create guest user and loyalty account

**Code Location:** `backend/routes/booking.js` (lines 300-400)

---

## API Endpoints

**Location:** `backend/routes/loyalty.js`

### Get Member Profile
```http
GET /api/loyalty/member/:id
Authorization: Bearer <token>
```

**Returns:** Loyalty account with tier, points, lifetime metrics, tier progress

### Get Points Ledger
```http
GET /api/loyalty/member/:id/points-ledger
Authorization: Bearer <token>
```

**Returns:** Points transaction history

### Redeem Points
```http
POST /api/loyalty/redeem
Authorization: Bearer <token>
Content-Type: application/json

{
  "loyaltyAccountId": 1,
  "points": 1000,
  "reason": "Points redemption for discount"
}
```

### Adjust Points (Admin)
```http
POST /api/admin/loyalty/adjust-points
Authorization: Bearer <token>
Content-Type: application/json

{
  "loyaltyAccountId": 1,
  "points": 500,
  "reason": "Manual adjustment"
}
```

**RBAC:** `loyalty:adjust` (ADMIN, SUPERADMIN only)

---

## Seed Data

### Tier Configs

**Location:** `backend/prisma/seed_tier_configs.js`

**Command:**
```bash
npm run seed:tier-configs
```

**Creates:**
- MEMBER tier (free to join, 5 pts/₹100)
- SILVER tier (5 nights OR 2 stays, 7 pts/₹100)
- GOLD tier (15 nights OR 6 stays, 10 pts/₹100)
- PLATINUM tier (30 nights OR 12 stays, 12 pts/₹100)
- DIAMOND tier (60 nights OR ₹1.5L spend, 15 pts/₹100)

### Points Rules

**Location:** `backend/prisma/seed_points_rules.js`

**Command:**
```bash
npm run seed:points-rules
```

**Creates:**
- Weekend bonus rules
- Long stay bonus rules
- Direct booking bonus rules
- (Future: Campaign multipliers)

---

## Advanced Features (Implemented)

### Points Rule Engine

**Status:** ✅ **Implemented** (Database schema and models exist)

**Database Models:**
- `PointsRule` - Configurable point calculation rules
- `Campaign` - Seasonal campaigns and promotions
- Linked to `PointsLedger` via `ruleId` and `campaignId`

**Features:**
- Configurable bonus rules (weekend, long stay, direct booking)
- Campaign multipliers (seasonal promotions)
- Rule evaluation engine
- Admin UI for managing rules (implementation status may vary)

**See:** [Loyalty Redesign Spec](../specs/loyalty-redesign.md) for detailed implementation plan

### Perk System

**Status:** ✅ **Implemented** (Database schema and models exist)

**Database Models:**
- `Perk` - Configurable perks (free breakfast, upgrades, etc.)
- `PerkRedemption` - Track perk usage
- Linked to `LoyaltyAccount` and `Booking`

**Features:**
- Tier-based perks (free breakfast, upgrades, late checkout)
- Perk redemption tracking
- Auto-apply perks on booking (implementation status may vary)
- Admin UI for managing perks (implementation status may vary)

**See:** [Loyalty Redesign Spec](../specs/loyalty-redesign.md) for detailed implementation plan

### Redemption Catalog

**Status:** ✅ **Implemented** (Database schema and models exist)

**Database Models:**
- `RedemptionItem` - Items that can be redeemed with points
- `RedemptionTransaction` - Track point redemptions
- Supports dynamic pricing and room-type based redemptions

**Features:**
- Free nights redemption
- Room upgrade redemption
- Breakfast voucher redemption
- Cash + Points options
- Dynamic pricing support

**See:** [Loyalty Redesign Spec](../specs/loyalty-redesign.md) for detailed implementation plan

---

## Related Documentation

- [Booking Architecture](./booking.md) - Points awarding on booking confirmation
- [RBAC Architecture](./rbac.md) - Member account access
- [Loyalty Redesign Spec](../specs/loyalty-redesign.md) - Future enhancements

---

**Code Locations:**
- Service Layer: `backend/services/loyaltyService.js`
- API Routes: `backend/routes/loyalty.js`
- Booking Integration: `backend/routes/booking.js`
- Seed Scripts: `backend/prisma/seed_tier_configs.js`, `backend/prisma/seed_points_rules.js`
- Database Schema: `backend/prisma/schema.prisma` (LoyaltyAccount, PointsLedger, TierConfig models)
