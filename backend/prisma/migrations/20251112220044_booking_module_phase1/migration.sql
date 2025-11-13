-- Migration: Booking Module Phase 1 - Schema Enhancements
-- Created: 2024-11-12
-- Description: Adds new models and fields for enhanced booking management

-- ============================================================================
-- STEP 1: Update Enums
-- ============================================================================

-- Update BookingStatus enum to add new statuses
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'CHECKED_IN';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'CHECKED_OUT';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- Update BookingSource enum - Need to handle migration carefully
-- First, create a new enum with the new values
CREATE TYPE "BookingSource_new" AS ENUM (
  'WEB_DIRECT',
  'OTA_BOOKING_COM',
  'OTA_MMT',
  'OTA_GOIBIBO',
  'OTA_YATRA',
  'OTA_AGODA',
  'WALK_IN',
  'PHONE',
  'CORPORATE',
  'OTHER'
);

-- Map old values to new values
ALTER TABLE "bookings" 
  ALTER COLUMN "source" TYPE text USING (
    CASE "source"::text
      WHEN 'DIRECT' THEN 'WEB_DIRECT'
      WHEN 'MMT' THEN 'OTA_MMT'
      WHEN 'GOIBIBO' THEN 'OTA_GOIBIBO'
      WHEN 'YATRA' THEN 'OTA_YATRA'
      WHEN 'BOOKING_COM' THEN 'OTA_BOOKING_COM'
      WHEN 'AGODA' THEN 'OTA_AGODA'
      WHEN 'OTHER' THEN 'OTHER'
      ELSE 'OTHER'
    END
  );

-- Change column type to new enum
ALTER TABLE "bookings" 
  ALTER COLUMN "source" TYPE "BookingSource_new" USING "source"::text::"BookingSource_new";

-- Drop old enum and rename new one
DROP TYPE "BookingSource";
ALTER TYPE "BookingSource_new" RENAME TO "BookingSource";

-- Create StayStatus enum
CREATE TYPE "StayStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED'
);

-- ============================================================================
-- STEP 2: Add new columns to Booking table
-- ============================================================================

ALTER TABLE "bookings" 
  ADD COLUMN IF NOT EXISTS "confirmationNumber" TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS "sourceReservationId" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceCommissionPct" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "commissionAmount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "notesInternal" TEXT,
  ADD COLUMN IF NOT EXISTS "notesGuest" TEXT,
  ADD COLUMN IF NOT EXISTS "cancellationPolicyId" INTEGER;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS "bookings_confirmationNumber_idx" ON "bookings"("confirmationNumber");
CREATE INDEX IF NOT EXISTS "bookings_sourceReservationId_idx" ON "bookings"("sourceReservationId");

-- ============================================================================
-- STEP 3: Create new tables
-- ============================================================================

-- CancellationPolicy table
CREATE TABLE IF NOT EXISTS "cancellation_policies" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "rules" JSONB NOT NULL,
  "humanReadable" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "propertyId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cancellation_policies_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "cancellation_policies_propertyId_idx" ON "cancellation_policies"("propertyId");
CREATE INDEX IF NOT EXISTS "cancellation_policies_isActive_idx" ON "cancellation_policies"("isActive");

-- Stay table
CREATE TABLE IF NOT EXISTS "stays" (
  "id" SERIAL PRIMARY KEY,
  "bookingId" INTEGER NOT NULL,
  "roomTypeId" INTEGER NOT NULL,
  "roomId" INTEGER,
  "checkInDate" TIMESTAMP(3) NOT NULL,
  "checkOutDate" TIMESTAMP(3) NOT NULL,
  "numGuests" INTEGER NOT NULL DEFAULT 1,
  "ratePlanId" INTEGER,
  "nightlyRates" JSONB,
  "status" "StayStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stays_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "stays_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "stays_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "stays_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "rate_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "stays_bookingId_idx" ON "stays"("bookingId");
CREATE INDEX IF NOT EXISTS "stays_roomTypeId_idx" ON "stays"("roomTypeId");
CREATE INDEX IF NOT EXISTS "stays_roomId_idx" ON "stays"("roomId");
CREATE INDEX IF NOT EXISTS "stays_status_idx" ON "stays"("status");

-- BookingGuest table
CREATE TABLE IF NOT EXISTS "booking_guests" (
  "id" SERIAL PRIMARY KEY,
  "bookingId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "country" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "age" INTEGER,
  "loyaltyAccountId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "booking_guests_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "booking_guests_loyaltyAccountId_fkey" FOREIGN KEY ("loyaltyAccountId") REFERENCES "loyalty_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "booking_guests_bookingId_idx" ON "booking_guests"("bookingId");
CREATE INDEX IF NOT EXISTS "booking_guests_email_idx" ON "booking_guests"("email");
CREATE INDEX IF NOT EXISTS "booking_guests_phone_idx" ON "booking_guests"("phone");

-- BookingAuditLog table
CREATE TABLE IF NOT EXISTS "booking_audit_logs" (
  "id" SERIAL PRIMARY KEY,
  "bookingId" INTEGER NOT NULL,
  "performedBy" TEXT,
  "action" TEXT NOT NULL,
  "meta" JSONB,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_audit_logs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "booking_audit_logs_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "booking_audit_logs_bookingId_idx" ON "booking_audit_logs"("bookingId");
CREATE INDEX IF NOT EXISTS "booking_audit_logs_action_idx" ON "booking_audit_logs"("action");
CREATE INDEX IF NOT EXISTS "booking_audit_logs_timestamp_idx" ON "booking_audit_logs"("timestamp");
CREATE INDEX IF NOT EXISTS "booking_audit_logs_performedBy_idx" ON "booking_audit_logs"("performedBy");

-- RoomAssignment table
CREATE TABLE IF NOT EXISTS "room_assignments" (
  "id" SERIAL PRIMARY KEY,
  "bookingId" INTEGER NOT NULL,
  "stayId" INTEGER,
  "roomId" INTEGER NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assignedBy" TEXT,
  "checkedInAt" TIMESTAMP(3),
  "checkedOutAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "room_assignments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "room_assignments_stayId_fkey" FOREIGN KEY ("stayId") REFERENCES "stays"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "room_assignments_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "room_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "room_assignments_bookingId_idx" ON "room_assignments"("bookingId");
CREATE INDEX IF NOT EXISTS "room_assignments_stayId_idx" ON "room_assignments"("stayId");
CREATE INDEX IF NOT EXISTS "room_assignments_roomId_idx" ON "room_assignments"("roomId");
CREATE INDEX IF NOT EXISTS "room_assignments_assignedBy_idx" ON "room_assignments"("assignedBy");

-- ============================================================================
-- STEP 4: Add foreign key constraint for cancellationPolicyId
-- ============================================================================

ALTER TABLE "bookings" 
  ADD CONSTRAINT "bookings_cancellationPolicyId_fkey" 
  FOREIGN KEY ("cancellationPolicyId") 
  REFERENCES "cancellation_policies"("id") 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- ============================================================================
-- STEP 5: Data Migration - Backfill existing bookings
-- ============================================================================

-- Migrate externalBookingId to sourceReservationId for existing bookings
UPDATE "bookings" 
SET "sourceReservationId" = "externalBookingId" 
WHERE "externalBookingId" IS NOT NULL AND "sourceReservationId" IS NULL;

-- Generate confirmation numbers for existing bookings that don't have them
-- Format: PNB-{propertyId}-{bookingId}-{timestamp}
UPDATE "bookings" 
SET "confirmationNumber" = 'PNB-' || "propertyId" || '-' || "id" || '-' || EXTRACT(EPOCH FROM "createdAt")::BIGINT
WHERE "confirmationNumber" IS NULL;

-- Create primary guest record for existing bookings
INSERT INTO "booking_guests" ("bookingId", "name", "email", "phone", "isPrimary", "createdAt", "updatedAt")
SELECT 
  "id" as "bookingId",
  "guestName" as "name",
  "email",
  "phone",
  true as "isPrimary",
  "createdAt",
  "updatedAt"
FROM "bookings"
WHERE NOT EXISTS (
  SELECT 1 FROM "booking_guests" WHERE "bookingId" = "bookings"."id"
);

-- Create stay records for existing bookings
INSERT INTO "stays" ("bookingId", "roomTypeId", "roomId", "checkInDate", "checkOutDate", "numGuests", "ratePlanId", "status", "createdAt", "updatedAt")
SELECT 
  "id" as "bookingId",
  "roomTypeId",
  "roomId",
  "checkIn" as "checkInDate",
  "checkOut" as "checkOutDate",
  "guests" as "numGuests",
  "ratePlanId",
  CASE 
    WHEN "status" = 'CONFIRMED' THEN 'CONFIRMED'::"StayStatus"
    WHEN "status" = 'CHECKED_IN' THEN 'CHECKED_IN'::"StayStatus"
    WHEN "status" = 'CHECKED_OUT' THEN 'CHECKED_OUT'::"StayStatus"
    WHEN "status" = 'CANCELLED' THEN 'CANCELLED'::"StayStatus"
    ELSE 'PENDING'::"StayStatus"
  END as "status",
  "createdAt",
  "updatedAt"
FROM "bookings"
WHERE NOT EXISTS (
  SELECT 1 FROM "stays" WHERE "bookingId" = "bookings"."id"
);

-- ============================================================================
-- STEP 6: Create audit log entries for existing bookings
-- ============================================================================

-- Create CREATE audit log entry for existing bookings
INSERT INTO "booking_audit_logs" ("bookingId", "performedBy", "action", "meta", "timestamp")
SELECT 
  "id" as "bookingId",
  NULL as "performedBy",
  'CREATE' as "action",
  jsonb_build_object(
    'status', "status",
    'source', "source",
    'createdAt', "createdAt"
  ) as "meta",
  "createdAt" as "timestamp"
FROM "bookings"
WHERE NOT EXISTS (
  SELECT 1 FROM "booking_audit_logs" WHERE "bookingId" = "bookings"."id" AND "action" = 'CREATE'
);

-- ============================================================================
-- Migration Complete
-- ============================================================================

