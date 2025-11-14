-- Migration: Loyalty Program Phase 1 - World-Class Loyalty Platform
-- Created: 2025-01-15
-- Description: Adds comprehensive loyalty program models including tier system, points rules, perks, campaigns, redemption catalog, referral program, and tier transfers

-- ============================================================================
-- STEP 1: Update LoyaltyTier Enum
-- ============================================================================

-- Add new tier values
ALTER TYPE "LoyaltyTier" ADD VALUE IF NOT EXISTS 'MEMBER';
ALTER TYPE "LoyaltyTier" ADD VALUE IF NOT EXISTS 'DIAMOND';

-- ============================================================================
-- STEP 2: Update Existing Tables
-- ============================================================================

-- Update loyalty_accounts table
ALTER TABLE "loyalty_accounts"
  ADD COLUMN IF NOT EXISTS "lifetimeNights" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lifetimeSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "qualificationYearStart" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "qualificationYearEnd" TIMESTAMP(3);

-- Update default tier to MEMBER for new accounts
ALTER TABLE "loyalty_accounts"
  ALTER COLUMN "tier" SET DEFAULT 'MEMBER';

-- Add index on tier
CREATE INDEX IF NOT EXISTS "loyalty_accounts_tier_idx" ON "loyalty_accounts"("tier");

-- Update points_ledger table
ALTER TABLE "points_ledger"
  ADD COLUMN IF NOT EXISTS "ruleId" INTEGER,
  ADD COLUMN IF NOT EXISTS "campaignId" INTEGER,
  ADD COLUMN IF NOT EXISTS "referralId" INTEGER,
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Add foreign key constraint for user relation (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'points_ledger_userId_fkey'
  ) THEN
    ALTER TABLE "points_ledger"
      ADD CONSTRAINT "points_ledger_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS "points_ledger_ruleId_idx" ON "points_ledger"("ruleId");
CREATE INDEX IF NOT EXISTS "points_ledger_campaignId_idx" ON "points_ledger"("campaignId");
CREATE INDEX IF NOT EXISTS "points_ledger_referralId_idx" ON "points_ledger"("referralId");

-- ============================================================================
-- STEP 3: Create New Tables
-- ============================================================================

-- TierConfig table
CREATE TABLE IF NOT EXISTS "tier_configs" (
  "id" SERIAL PRIMARY KEY,
  "tier" "LoyaltyTier" NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "minPoints" INTEGER,
  "minStays" INTEGER,
  "minNights" INTEGER,
  "minSpend" DOUBLE PRECISION,
  "qualificationPeriod" INTEGER NOT NULL DEFAULT 12,
  "basePointsPer100Rupees" INTEGER NOT NULL DEFAULT 5,
  "benefits" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- PointsRule table
CREATE TABLE IF NOT EXISTS "points_rules" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "ruleType" TEXT NOT NULL,
  "conditions" JSONB NOT NULL,
  "actions" JSONB NOT NULL,
  "propertyIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "tierIds" "LoyaltyTier"[] NOT NULL DEFAULT ARRAY[]::"LoyaltyTier"[],
  "priority" INTEGER NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "points_rules_ruleType_isActive_idx" ON "points_rules"("ruleType", "isActive");
CREATE INDEX IF NOT EXISTS "points_rules_startDate_endDate_idx" ON "points_rules"("startDate", "endDate");

-- Perk table
CREATE TABLE IF NOT EXISTS "perks" (
  "id" SERIAL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "perkType" TEXT NOT NULL,
  "conditions" JSONB NOT NULL,
  "value" JSONB NOT NULL,
  "propertyIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "tierIds" "LoyaltyTier"[] NOT NULL DEFAULT ARRAY[]::"LoyaltyTier"[],
  "maxUsagePerMember" INTEGER,
  "maxUsagePerStay" INTEGER,
  "totalCapacity" INTEGER,
  "currentUsage" INTEGER NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "perks_code_isActive_idx" ON "perks"("code", "isActive");
CREATE INDEX IF NOT EXISTS "perks_startDate_endDate_idx" ON "perks"("startDate", "endDate");

-- PerkRedemption table
CREATE TABLE IF NOT EXISTS "perk_redemptions" (
  "id" SERIAL PRIMARY KEY,
  "perkId" INTEGER NOT NULL,
  "loyaltyAccountId" INTEGER NOT NULL,
  "bookingId" INTEGER,
  "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "valueApplied" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "perk_redemptions_perkId_fkey" FOREIGN KEY ("perkId") REFERENCES "perks"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "perk_redemptions_loyaltyAccountId_fkey" FOREIGN KEY ("loyaltyAccountId") REFERENCES "loyalty_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "perk_redemptions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "perk_redemptions_loyaltyAccountId_idx" ON "perk_redemptions"("loyaltyAccountId");
CREATE INDEX IF NOT EXISTS "perk_redemptions_bookingId_idx" ON "perk_redemptions"("bookingId");
CREATE INDEX IF NOT EXISTS "perk_redemptions_perkId_status_idx" ON "perk_redemptions"("perkId", "status");

-- Campaign table
CREATE TABLE IF NOT EXISTS "campaigns" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "campaignType" TEXT NOT NULL,
  "rules" JSONB NOT NULL,
  "tierIds" "LoyaltyTier"[] NOT NULL DEFAULT ARRAY[]::"LoyaltyTier"[],
  "propertyIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "campaigns_campaignType_isActive_idx" ON "campaigns"("campaignType", "isActive");
CREATE INDEX IF NOT EXISTS "campaigns_startDate_endDate_idx" ON "campaigns"("startDate", "endDate");

-- RedemptionItem table (with dynamic pricing support)
CREATE TABLE IF NOT EXISTS "redemption_items" (
  "id" SERIAL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "itemType" TEXT NOT NULL,
  "basePointsRequired" INTEGER NOT NULL,
  "dynamicPricing" JSONB,
  "value" JSONB NOT NULL,
  "propertyIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "tierIds" "LoyaltyTier"[] NOT NULL DEFAULT ARRAY[]::"LoyaltyTier"[],
  "roomTypeIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "totalQuantity" INTEGER,
  "availableQuantity" INTEGER,
  "soldQuantity" INTEGER NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "redemption_items_code_isActive_idx" ON "redemption_items"("code", "isActive");
CREATE INDEX IF NOT EXISTS "redemption_items_itemType_idx" ON "redemption_items"("itemType");

-- RedemptionTransaction table
CREATE TABLE IF NOT EXISTS "redemption_transactions" (
  "id" SERIAL PRIMARY KEY,
  "itemId" INTEGER NOT NULL,
  "loyaltyAccountId" INTEGER NOT NULL,
  "bookingId" INTEGER,
  "pointsRedeemed" INTEGER NOT NULL,
  "valueReceived" JSONB,
  "dynamicPricingApplied" JSONB,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "usedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "redemption_transactions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "redemption_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "redemption_transactions_loyaltyAccountId_fkey" FOREIGN KEY ("loyaltyAccountId") REFERENCES "loyalty_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "redemption_transactions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "redemption_transactions_loyaltyAccountId_idx" ON "redemption_transactions"("loyaltyAccountId");
CREATE INDEX IF NOT EXISTS "redemption_transactions_bookingId_idx" ON "redemption_transactions"("bookingId");
CREATE INDEX IF NOT EXISTS "redemption_transactions_itemId_status_idx" ON "redemption_transactions"("itemId", "status");

-- TierHistory table
CREATE TABLE IF NOT EXISTS "tier_history" (
  "id" SERIAL PRIMARY KEY,
  "loyaltyAccountId" INTEGER NOT NULL,
  "fromTier" "LoyaltyTier",
  "toTier" "LoyaltyTier" NOT NULL,
  "pointsAtChange" INTEGER NOT NULL,
  "staysAtChange" INTEGER NOT NULL,
  "nightsAtChange" INTEGER NOT NULL,
  "spendAtChange" DOUBLE PRECISION NOT NULL,
  "reason" TEXT NOT NULL,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tier_history_loyaltyAccountId_fkey" FOREIGN KEY ("loyaltyAccountId") REFERENCES "loyalty_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "tier_history_loyaltyAccountId_idx" ON "tier_history"("loyaltyAccountId");
CREATE INDEX IF NOT EXISTS "tier_history_changedAt_idx" ON "tier_history"("changedAt");

-- Referral table
CREATE TABLE IF NOT EXISTS "referrals" (
  "id" SERIAL PRIMARY KEY,
  "referrerId" INTEGER NOT NULL,
  "referredId" INTEGER UNIQUE,
  "referralCode" TEXT NOT NULL UNIQUE,
  "referredEmail" TEXT,
  "referredName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "referrerRewardPoints" INTEGER,
  "referredRewardPoints" INTEGER,
  "referredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "signedUpAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "loyalty_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "referrals_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "loyalty_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "referrals_referrerId_idx" ON "referrals"("referrerId");
CREATE INDEX IF NOT EXISTS "referrals_referredId_idx" ON "referrals"("referredId");
CREATE INDEX IF NOT EXISTS "referrals_referralCode_idx" ON "referrals"("referralCode");
CREATE INDEX IF NOT EXISTS "referrals_status_idx" ON "referrals"("status");

-- TierTransfer table
CREATE TABLE IF NOT EXISTS "tier_transfers" (
  "id" SERIAL PRIMARY KEY,
  "fromAccountId" INTEGER NOT NULL,
  "toAccountId" INTEGER NOT NULL,
  "fromTier" "LoyaltyTier" NOT NULL,
  "toTier" "LoyaltyTier" NOT NULL,
  "pointsDeduction" INTEGER,
  "transferFee" DOUBLE PRECISION,
  "pointsCost" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tier_transfers_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "loyalty_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "tier_transfers_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "loyalty_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "tier_transfers_fromAccountId_idx" ON "tier_transfers"("fromAccountId");
CREATE INDEX IF NOT EXISTS "tier_transfers_toAccountId_idx" ON "tier_transfers"("toAccountId");
CREATE INDEX IF NOT EXISTS "tier_transfers_status_idx" ON "tier_transfers"("status");

-- ============================================================================
-- STEP 4: Add Foreign Key Constraints (with existence checks)
-- ============================================================================

-- Add foreign key for ruleId (with existence check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'points_ledger_ruleId_fkey'
  ) THEN
    ALTER TABLE "points_ledger"
      ADD CONSTRAINT "points_ledger_ruleId_fkey" 
      FOREIGN KEY ("ruleId") REFERENCES "points_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Add foreign key for campaignId (with existence check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'points_ledger_campaignId_fkey'
  ) THEN
    ALTER TABLE "points_ledger"
      ADD CONSTRAINT "points_ledger_campaignId_fkey" 
      FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Add foreign key for referralId (with existence check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'points_ledger_referralId_fkey'
  ) THEN
    ALTER TABLE "points_ledger"
      ADD CONSTRAINT "points_ledger_referralId_fkey" 
      FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Add foreign key for loyaltyAccountId (with existence check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'points_ledger_loyaltyAccountId_fkey'
  ) THEN
    ALTER TABLE "points_ledger"
      ADD CONSTRAINT "points_ledger_loyaltyAccountId_fkey" 
      FOREIGN KEY ("loyaltyAccountId") REFERENCES "loyalty_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

