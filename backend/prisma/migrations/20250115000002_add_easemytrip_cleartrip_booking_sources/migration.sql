-- Migration: Add EaseMyTrip and Cleartrip to BookingSource enum
-- Created: 2025-01-15
-- Description: Adds OTA_EASEMYTRIP and OTA_CLEARTRIP to BookingSource enum

-- Add new enum values
ALTER TYPE "BookingSource" ADD VALUE IF NOT EXISTS 'OTA_EASEMYTRIP';
ALTER TYPE "BookingSource" ADD VALUE IF NOT EXISTS 'OTA_CLEARTRIP';

