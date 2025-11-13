/**
 * Booking API Client Library
 * Provides TypeScript types and API functions for booking management
 */

import { getApiUrl } from './api';

// Get API base URL (relative for client-side, full URL for server-side)
function getBookingApiUrl(): string {
  const baseUrl = getApiUrl();
  // If baseUrl is empty (client-side), use relative URL
  // If baseUrl has value (server-side), append /api
  return baseUrl ? `${baseUrl}/api` : '/api';
}

// ============================================================================
// Type Definitions
// ============================================================================

export type BookingStatus = 
  | 'HOLD'
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'REJECTED'
  | 'COMPLETED'
  | 'FAILED';

export type BookingSource = 
  | 'WEB_DIRECT'
  | 'OTA_BOOKING_COM'
  | 'OTA_MMT'
  | 'OTA_GOIBIBO'
  | 'OTA_YATRA'
  | 'OTA_AGODA'
  | 'WALK_IN'
  | 'PHONE'
  | 'CORPORATE'
  | 'OTHER';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export type PaymentMethod = 'RAZORPAY' | 'CASH' | 'CARD_ON_FILE' | 'UPI' | 'OTHER';

export type StayStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';

// Property
export interface Property {
  id: number;
  name: string;
  slug?: string;
  city?: string;
}

// Room Type
export interface RoomType {
  id: number;
  name: string;
  code?: string;
}

// Rate Plan
export interface RatePlan {
  id: number;
  name: string;
  code?: string;
}

// Room
export interface Room {
  id: number;
  number: string;
  roomTypeId: number;
  roomType?: RoomType;
}

// Cancellation Policy
export interface CancellationPolicy {
  id: number;
  name: string;
  description?: string;
  humanReadable?: string;
}

// Stay
export interface Stay {
  id: number;
  bookingId: number;
  roomTypeId: number;
  roomId?: number;
  checkInDate: string;
  checkOutDate: string;
  status: StayStatus;
  roomType?: RoomType;
  room?: Room;
  ratePlan?: RatePlan;
  nightlyRateBreakdown?: any;
}

// Booking Guest
export interface BookingGuest {
  id: number;
  bookingId: number;
  name: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
  loyaltyAccountId?: number;
  createdAt: string;
  updatedAt: string;
}

// Payment
export interface Payment {
  id: number;
  bookingId: number;
  amount: number;
  currency?: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  externalTxnId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  metadata?: {
    method?: PaymentMethod;
    currency?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Helper function to get payment method from payment (checks metadata first)
 */
export function getPaymentMethod(payment: Payment): PaymentMethod {
  return payment.method || payment.metadata?.method || 'OTHER';
}

/**
 * Helper function to get payment currency from payment (checks metadata first)
 */
export function getPaymentCurrency(payment: Payment, defaultCurrency: string = 'INR'): string {
  return payment.currency || payment.metadata?.currency || defaultCurrency;
}

// Booking Audit Log
export interface BookingAuditLog {
  id: number;
  bookingId: number;
  performedBy: string;
  action: string;
  meta?: any;
  timestamp: string;
  performedByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

// Room Assignment
export interface RoomAssignment {
  id: number;
  bookingId: number;
  stayId: number;
  roomId: number;
  assignedAt: string;
  assignedBy?: string;
  room?: Room;
  stay?: Stay;
  assignedByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

// Booking
export interface Booking {
  id: number;
  guestName: string;
  email: string;
  phone?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  totalPrice: number;
  specialRequests?: string;
  status: BookingStatus;
  currency?: string;
  netAmount?: number;
  taxAmount?: number;
  holdToken?: string;
  holdExpiresAt?: string;
  source: BookingSource;
  externalBookingId?: string;
  externalChannel?: string;
  externalConfirmation?: any;
  confirmationNumber?: string;
  sourceReservationId?: string;
  sourceCommissionPct?: number;
  commissionAmount?: number;
  notesInternal?: string;
  notesGuest?: string;
  propertyId: number;
  property?: Property;
  roomTypeId: number;
  roomType?: RoomType;
  ratePlanId?: number;
  ratePlan?: RatePlan;
  cancellationPolicyId?: number;
  cancellationPolicy?: CancellationPolicy;
  stays?: Stay[];
  bookingGuests?: BookingGuest[];
  payments?: Payment[];
  bookingAuditLogs?: BookingAuditLog[];
  roomAssignments?: RoomAssignment[];
  createdAt: string;
  updatedAt: string;
}

// Booking Filters
export interface BookingFilters {
  propertyId?: number;
  status?: BookingStatus;
  source?: BookingSource;
  checkInFrom?: string;
  checkInTo?: string;
  checkOutFrom?: string;
  checkOutTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Booking List Response
export interface BookingListResponse {
  success: boolean;
  data: {
    bookings: Booking[];
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Booking Detail Response
export interface BookingDetailResponse {
  success: boolean;
  data: Booking;
  message?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get bookings with filters, pagination, and sorting
 */
export async function getBookings(filters: BookingFilters = {}): Promise<BookingListResponse> {
  const params = new URLSearchParams();
  
  if (filters.propertyId) params.append('propertyId', filters.propertyId.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.source) params.append('source', filters.source);
  if (filters.checkInFrom) params.append('checkInFrom', filters.checkInFrom);
  if (filters.checkInTo) params.append('checkInTo', filters.checkInTo);
  if (filters.checkOutFrom) params.append('checkOutFrom', filters.checkOutFrom);
  if (filters.checkOutTo) params.append('checkOutTo', filters.checkOutTo);
  if (filters.search) params.append('search', filters.search);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  const apiUrl = getBookingApiUrl();
  const url = `${apiUrl}/bookings?${params.toString()}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || response.statusText;
      } catch {
        // If JSON parse fails, use statusText
      }
      throw new Error(`Failed to fetch bookings: ${errorMessage} (${response.status})`);
    }

    const result = await response.json();
    
    // Transform response to match expected format
    if (result.success) {
      // Backend returns { success: true, data: [...], pagination: {...} }
      if (Array.isArray(result.data)) {
        const pagination = result.pagination || {};
        return {
          success: true,
          data: {
            bookings: result.data,
            total: pagination.total || result.data.length,
            totalPages: pagination.totalPages || 1,
            page: pagination.page || filters.page || 1,
            limit: pagination.limit || filters.limit || 20,
          },
          pagination: pagination,
        };
      }
    }

    // If response doesn't match expected format, return as-is
    console.warn('Unexpected API response format:', result);
    return result;
  } catch (error: any) {
    console.error('Error fetching bookings:', {
      url,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Get booking by ID
 */
export async function getBooking(id: number): Promise<BookingDetailResponse> {
  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/bookings/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch booking: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create booking
 */
export async function createBooking(bookingData: Partial<Booking>): Promise<BookingDetailResponse> {
  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/bookings`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create booking: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update booking
 */
export async function updateBooking(id: number, bookingData: Partial<Booking>): Promise<BookingDetailResponse> {
  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/bookings/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update booking: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check-in booking
 */
export async function checkInBooking(id: number, data: { roomAssignments?: Array<{ stayId: number; roomId: number }> }): Promise<BookingDetailResponse> {
  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/bookings/${id}/check-in`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to check-in booking: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check-out booking
 */
export async function checkOutBooking(id: number, data: { finalCharges?: number }): Promise<BookingDetailResponse> {
  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/bookings/${id}/check-out`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to check-out booking: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Cancel booking
 */
export async function cancelBooking(id: number, data: { reason?: string; processRefund?: boolean }): Promise<BookingDetailResponse> {
  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/bookings/${id}/cancel`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel booking: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Modify booking
 */
export async function modifyBooking(id: number, data: Partial<Booking>): Promise<BookingDetailResponse> {
  return updateBooking(id, data);
}

/**
 * Mark booking as no-show
 */
export async function markNoShow(id: number, data: { reason?: string; noShowFee?: number }): Promise<BookingDetailResponse> {
  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/bookings/${id}/no-show`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to mark booking as no-show: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Reject booking
 */
export async function rejectBooking(id: number, data: { reason?: string }): Promise<BookingDetailResponse> {
  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/bookings/${id}/reject`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to reject booking: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get booking audit log
 */
export async function getBookingAuditLog(id: number): Promise<{ success: boolean; data: BookingAuditLog[] }> {
  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/bookings/${id}/audit-log`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch audit log: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Calculate cancellation fee
 */
export async function calculateCancellationFee(id: number, data: { cancellationDate?: string }): Promise<{ success: boolean; data: { fee: number; refund: number; breakdown: any } }> {
  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/bookings/${id}/calculate-cancellation-fee`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to calculate cancellation fee: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// Payment API Functions
// ============================================================================

/**
 * Create payment for a booking
 */
export async function createPayment(bookingId: number, data: {
  amount: number;
  method: PaymentMethod;
  currency?: string;
  externalTxnId?: string;
  notes?: string;
}): Promise<{ success: boolean; data: { payment: Payment; booking: Booking } }> {
  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/payments`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bookingId,
      ...data,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create payment: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Charge card on file for a booking
 */
export async function chargeCard(bookingId: number, data: {
  amount?: number;
  cardId?: string;
  notes?: string;
}): Promise<{ success: boolean; data: { payment: Payment; booking: Booking } }> {
  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/bookings/${bookingId}/payments/charge-card`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to charge card: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Issue refund for a payment
 */
export async function issueRefund(paymentId: number, data: {
  amount?: number;
  reason?: string;
  processRefund?: boolean;
}): Promise<{ success: boolean; data: { refund: Payment; booking: Booking } }> {
  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/payments/${paymentId}/refund`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to issue refund: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// Guest Self-Service API Functions
// ============================================================================

/**
 * Get guest booking by token
 */
export async function getGuestBooking(token: string): Promise<BookingDetailResponse & { token: string }> {
  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/guest/bookings/${token}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch booking: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update guest booking by token
 */
export async function updateGuestBooking(token: string, bookingData: Partial<Booking>): Promise<BookingDetailResponse> {
  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/guest/bookings/${token}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update booking: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Cancel guest booking by token
 */
export async function cancelGuestBooking(token: string, data: { reason?: string }): Promise<BookingDetailResponse> {
  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/guest/bookings/${token}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel booking: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Request modification for guest booking
 */
export async function requestGuestBookingModification(token: string, data: { requestedChanges: any; reason?: string }): Promise<{ success: boolean; message: string }> {
  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/guest/bookings/${token}/request-modification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to request modification: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get guest bookings by email/phone
 */
export async function getGuestBookings(email?: string, phone?: string): Promise<{ success: boolean; data: Array<Booking & { accessToken: string; manageUrl: string }> }> {
  const params = new URLSearchParams();
  if (email) params.append('email', email);
  if (phone) params.append('phone', phone);

  const apiUrl = getBookingApiUrl();
  const response = await fetch(`${apiUrl}/guest/bookings?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bookings: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get status badge color
 */
export function getStatusColor(status: BookingStatus): string {
  switch (status) {
    case 'HOLD':
      return 'bg-yellow-100 text-yellow-800';
    case 'PENDING':
      return 'bg-blue-100 text-blue-800';
    case 'CONFIRMED':
      return 'bg-green-100 text-green-800';
    case 'CHECKED_IN':
      return 'bg-purple-100 text-purple-800';
    case 'CHECKED_OUT':
      return 'bg-gray-100 text-gray-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'NO_SHOW':
      return 'bg-orange-100 text-orange-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get source badge color
 */
export function getSourceColor(source: BookingSource): string {
  switch (source) {
    case 'WEB_DIRECT':
      return 'bg-blue-100 text-blue-800';
    case 'WALK_IN':
      return 'bg-green-100 text-green-800';
    case 'PHONE':
      return 'bg-purple-100 text-purple-800';
    case 'CORPORATE':
      return 'bg-indigo-100 text-indigo-800';
    case 'OTA_BOOKING_COM':
    case 'OTA_MMT':
    case 'OTA_GOIBIBO':
    case 'OTA_YATRA':
    case 'OTA_AGODA':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Calculate outstanding balance
 */
export function calculateOutstandingBalance(booking: Booking): number {
  const totalPaid = booking.payments?.reduce((sum, payment) => {
    if (payment.status === 'COMPLETED') {
      return sum + Math.abs(payment.amount);
    }
    return sum;
  }, 0) || 0;
  
  return booking.totalPrice - totalPaid;
}
