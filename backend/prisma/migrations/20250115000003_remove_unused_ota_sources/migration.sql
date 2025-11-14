-- Migration: Remove unused OTA sources (Goibibo, Yatra, Agoda)
-- Created: 2025-01-15
-- Description: Removes OTA_GOIBIBO, OTA_YATRA, and OTA_AGODA from BookingSource enum
-- Note: This migration assumes all bookings will be deleted before running

-- First, update any existing bookings that use these sources to OTHER
-- (This should be safe since we're deleting all bookings in seed anyway)
UPDATE "bookings" 
SET "source" = 'OTHER'::"BookingSource"
WHERE "source" IN ('OTA_GOIBIBO', 'OTA_YATRA', 'OTA_AGODA');

-- Create new enum without the unused values
CREATE TYPE "BookingSource_new" AS ENUM (
  'WEB_DIRECT',
  'OTA_BOOKING_COM',
  'OTA_MMT',
  'OTA_EASEMYTRIP',
  'OTA_CLEARTRIP',
  'WALK_IN',
  'PHONE',
  'CORPORATE',
  'OTHER'
);

-- Convert column to text first
ALTER TABLE "bookings" 
  ALTER COLUMN "source" TYPE text USING "source"::text;

-- Change to new enum type
ALTER TABLE "bookings" 
  ALTER COLUMN "source" TYPE "BookingSource_new" USING "source"::text::"BookingSource_new";

-- Drop old enum
DROP TYPE "BookingSource";

-- Rename new enum
ALTER TYPE "BookingSource_new" RENAME TO "BookingSource";

-- Restore default
ALTER TABLE "bookings" 
  ALTER COLUMN "source" SET DEFAULT 'WEB_DIRECT'::"BookingSource";

