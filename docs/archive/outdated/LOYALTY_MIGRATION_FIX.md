# Loyalty Program Migration Fix

## Issue

The deployment failed with the following PostgreSQL error:
```
ERROR: unsafe use of new value "MEMBER" of enum type "LoyaltyTier"
HINT: New enum values must be committed before they can be used.
```

## Root Cause

PostgreSQL requires enum values to be committed before they can be used in the same transaction. The migration was trying to:
1. Add 'MEMBER' and 'DIAMOND' to the `LoyaltyTier` enum
2. Use 'MEMBER' as a default value in the same transaction

## Solution

The migration has been split into two separate migrations:
1. **20250115000000_loyalty_program_phase1** - Adds enum values and creates tables (without using new enum values)
2. **20250115000001_loyalty_program_phase1_set_default** - Sets default tier to MEMBER (runs after enum is committed)

## Fix Steps for Staging Server

Since the first migration failed, you need to resolve it first:

### Step 1: Mark the failed migration as rolled back

SSH into your staging server and run:

```bash
cd /path/to/backend
npx prisma migrate resolve --rolled-back "20250115000000_loyalty_program_phase1"
```

### Step 2: Run migrations

After marking the migration as rolled back, run:

```bash
npx prisma migrate deploy
```

This will:
1. Run the first migration (adds enum values, creates tables)
2. Run the second migration (sets default tier to MEMBER)

### Step 3: Run seed scripts

After migrations complete successfully:

```bash
npm run seed:tier-configs
npm run seed:points-rules
```

### Step 4: Restart the server

Restart your backend server to load the new cron job for tier re-qualification.

## Alternative: Manual Fix

If you prefer to fix it manually on the database:

1. **Add enum values** (if not already added):
```sql
ALTER TYPE "LoyaltyTier" ADD VALUE IF NOT EXISTS 'MEMBER';
ALTER TYPE "LoyaltyTier" ADD VALUE IF NOT EXISTS 'DIAMOND';
```

2. **Mark migration as applied**:
```bash
npx prisma migrate resolve --applied "20250115000000_loyalty_program_phase1"
```

3. **Run remaining migrations**:
```bash
npx prisma migrate deploy
```

## Verification

After the fix, verify:
- Enum values exist: `SELECT unnest(enum_range(NULL::"LoyaltyTier"));`
- Default tier is set: Check `loyalty_accounts` table default
- All tables created: Check for `tier_configs`, `points_rules`, `perks`, etc.

