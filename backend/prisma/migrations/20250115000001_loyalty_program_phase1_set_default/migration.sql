-- Migration: Set default tier to MEMBER after enum values are committed
-- Created: 2025-01-15
-- Description: Sets the default tier to MEMBER after the enum values have been committed
-- This must be a separate migration because PostgreSQL requires enum values to be committed before use

-- Update default tier to MEMBER for new accounts
-- This runs in a separate transaction after the enum values are committed
ALTER TABLE "loyalty_accounts"
  ALTER COLUMN "tier" SET DEFAULT 'MEMBER'::"LoyaltyTier";

