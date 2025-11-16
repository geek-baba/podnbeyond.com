/**
 * Badge Mapper Utilities
 * Centralized mapping functions to convert booking/loyalty enums to Badge component variants
 */

import type { BadgeVariant } from '../components/ui/Badge';

/**
 * Maps a booking status to the appropriate Badge variant
 */
export function mapBookingStatusToBadgeVariant(status: string): BadgeVariant {
  const statusMap: Record<string, BadgeVariant> = {
    'PENDING': 'pending',
    'CONFIRMED': 'confirmed',
    'HOLD': 'hold',
    'CANCELLED': 'cancelled',
    'CHECKED_IN': 'checkedIn',
    'CHECKED_OUT': 'checkedOut',
    'NO_SHOW': 'noShow',
    'COMPLETED': 'completed',
    'FAILED': 'failed',
    'REJECTED': 'failed', // Rejected uses same style as failed
  };
  return statusMap[status] || 'neutral';
}

/**
 * Maps a booking source to the appropriate Badge variant
 */
export function mapBookingSourceToBadgeVariant(source: string): BadgeVariant {
  const sourceMap: Record<string, BadgeVariant> = {
    'WEB_DIRECT': 'webDirect',
    'WALK_IN': 'walkIn',
    'PHONE': 'phone',
    'CORPORATE': 'corporate',
    // All OTA sources map to 'ota' variant
    'OTA_BOOKING_COM': 'ota',
    'OTA_MMT': 'ota',
    'OTA_GOIBIBO': 'ota',
    'OTA_YATRA': 'ota',
    'OTA_AGODA': 'ota',
    'OTA_EASEMYTRIP': 'ota',
    'OTA_CLEARTRIP': 'ota',
  };
  return sourceMap[source] || 'neutral';
}

/**
 * Maps a loyalty tier to the appropriate Badge variant
 */
export function mapLoyaltyTierToBadgeVariant(tier: string): BadgeVariant {
  const tierMap: Record<string, BadgeVariant> = {
    'MEMBER': 'member',
    'SILVER': 'silver',
    'GOLD': 'gold',
    'PLATINUM': 'platinum',
    'DIAMOND': 'diamond',
  };
  return tierMap[tier] || 'neutral';
}

