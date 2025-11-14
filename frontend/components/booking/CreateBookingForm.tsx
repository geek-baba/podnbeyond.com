/**
 * Create Booking Form Component
 * Allows staff to create new bookings (walk-in, phone, etc.)
 */

import React, { useState, useEffect } from 'react';
import { createBooking, BookingSource, formatCurrency } from '../../lib/booking';
import { apiRequest } from '../../lib/api';

interface Property {
  id: number;
  name: string;
  slug?: string;
}

interface RoomType {
  id: number;
  name: string;
  code?: string;
}

interface RatePlan {
  id: number;
  name: string;
  code?: string;
  seasonalPrice?: number;
  currency?: string;
}

interface CancellationPolicy {
  id: number;
  name: string;
  humanReadable?: string;
}

interface CreateBookingFormProps {
  onSuccess?: (bookingId: number) => void;
  onCancel?: () => void;
}

interface AdditionalGuest {
  name: string;
  email: string;
  phone: string;
  country?: string;
  age?: number;
}

export default function CreateBookingForm({ onSuccess, onCancel }: CreateBookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [propertyId, setPropertyId] = useState<number | ''>('');
  const [roomTypeId, setRoomTypeId] = useState<number | ''>('');
  const [ratePlanId, setRatePlanId] = useState<number | ''>('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [rooms, setRooms] = useState(1);
  const [source, setSource] = useState<BookingSource>('WALK_IN');
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [notesInternal, setNotesInternal] = useState('');
  const [notesGuest, setNotesGuest] = useState('');
  const [cancellationPolicyId, setCancellationPolicyId] = useState<number | ''>('');
  const [sourceReservationId, setSourceReservationId] = useState('');
  const [sourceCommissionPct, setSourceCommissionPct] = useState<number | ''>('');
  const [additionalGuests, setAdditionalGuests] = useState<AdditionalGuest[]>([]);
  
  // Data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [cancellationPolicies, setCancellationPolicies] = useState<CancellationPolicy[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [nights, setNights] = useState(0);

  // Load properties on mount
  useEffect(() => {
    loadProperties();
  }, []);

  // Load room types when property changes
  useEffect(() => {
    if (propertyId) {
      loadRoomTypes(Number(propertyId));
      loadCancellationPolicies(Number(propertyId));
      setRoomTypeId('');
      setRatePlanId('');
      setRatePlans([]);
    }
  }, [propertyId]);

  // Load rate plans when room type changes
  useEffect(() => {
    if (propertyId && roomTypeId) {
      loadRatePlans(Number(propertyId), Number(roomTypeId));
      setRatePlanId('');
    }
  }, [propertyId, roomTypeId]);

  // Calculate price when dates, rate plan, or rooms change
  useEffect(() => {
    if (checkIn && checkOut && ratePlanId && rooms > 0) {
      calculatePrice();
    } else {
      setCalculatedPrice(null);
      setNights(0);
    }
  }, [checkIn, checkOut, ratePlanId, rooms]);

  const loadProperties = async () => {
    try {
      const response = await apiRequest<{ success: boolean; properties: Property[] }>('/api/properties');
      if (response.success && response.properties) {
        setProperties(response.properties);
      }
    } catch (err: any) {
      console.error('Failed to load properties:', err);
      setError('Failed to load properties');
    }
  };

  const loadRoomTypes = async (propertyId: number) => {
    try {
      // Get property details which includes room types
      const response = await apiRequest<{ success: boolean; property: any }>(`/api/properties/${propertyId}`);
      if (response.success && response.property) {
        // Extract room types from property or fetch separately
        // For now, we'll need to get room types from a different endpoint
        // Assuming room types are available through the property endpoint
        const roomTypesResponse = await apiRequest<{ success: boolean; roomTypes?: RoomType[]; rooms?: any[] }>(`/api/properties/${propertyId}/room-types`).catch(() => null);
        if (roomTypesResponse?.success) {
          // If room types endpoint exists, use it
          setRoomTypes(roomTypesResponse.roomTypes || []);
        } else {
          // Otherwise, extract unique room types from rooms
          const uniqueRoomTypes = new Map<number, RoomType>();
          if (response.property.rooms) {
            response.property.rooms.forEach((room: any) => {
              if (room.roomType && !uniqueRoomTypes.has(room.roomType.id)) {
                uniqueRoomTypes.set(room.roomType.id, room.roomType);
              }
            });
          }
          setRoomTypes(Array.from(uniqueRoomTypes.values()));
        }
      }
    } catch (err: any) {
      console.error('Failed to load room types:', err);
      // Try alternative endpoint
      try {
        const response = await apiRequest<{ success: boolean; roomTypes: RoomType[] }>(`/api/properties/${propertyId}/room-types`);
        if (response.success && response.roomTypes) {
          setRoomTypes(response.roomTypes);
        }
      } catch (e) {
        console.error('Failed to load room types from alternative endpoint:', e);
      }
    }
  };

  const loadRatePlans = async (propertyId: number, roomTypeId: number) => {
    try {
      // Fetch rate plans - may need to adjust endpoint
      const response = await apiRequest<{ success: boolean; ratePlans: RatePlan[] }>(`/api/rate-plans?propertyId=${propertyId}&roomTypeId=${roomTypeId}`).catch(() => null);
      if (response?.success && response.ratePlans) {
        setRatePlans(response.ratePlans);
      } else {
        // If endpoint doesn't exist, we'll calculate price manually
        setRatePlans([]);
      }
    } catch (err: any) {
      console.error('Failed to load rate plans:', err);
      // Rate plans might not have a dedicated endpoint, that's okay
      setRatePlans([]);
    }
  };

  const loadCancellationPolicies = async (propertyId: number) => {
    try {
      const response = await apiRequest<{ success: boolean; data: CancellationPolicy[] }>(`/api/cancellation-policies?propertyId=${propertyId}`);
      if (response.success && response.data) {
        setCancellationPolicies(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load cancellation policies:', err);
    }
  };

  const calculatePrice = () => {
    if (!checkIn || !checkOut || !ratePlanId) return;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const calculatedNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (calculatedNights <= 0) {
      setCalculatedPrice(null);
      setNights(0);
      return;
    }

    setNights(calculatedNights);

    // Get rate plan to calculate price
    const selectedRatePlan = ratePlans.find(rp => rp.id === Number(ratePlanId));
    if (selectedRatePlan && selectedRatePlan.seasonalPrice) {
      const basePrice = selectedRatePlan.seasonalPrice * calculatedNights * rooms;
      // Add 18% tax (GST)
      const tax = basePrice * 0.18;
      const totalPrice = basePrice + tax;
      setCalculatedPrice(totalPrice);
    } else {
      // If rate plan doesn't have price, we'll let backend calculate
      setCalculatedPrice(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!propertyId || !roomTypeId || !checkIn || !checkOut || !guestName || !email) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Validate dates
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      if (checkOutDate <= checkInDate) {
        setError('Check-out date must be after check-in date');
        setLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Prepare booking data
      const bookingData: any = {
        propertyId: Number(propertyId),
        roomTypeId: Number(roomTypeId),
        checkIn,
        checkOut,
        guests: Number(guests),
        rooms: Number(rooms),
        source,
        guestName,
        email,
        phone: phone || undefined,
        specialRequests: specialRequests || undefined,
        notesInternal: notesInternal || undefined,
        notesGuest: notesGuest || undefined,
      };

      if (ratePlanId) {
        bookingData.ratePlanId = Number(ratePlanId);
      }

      if (cancellationPolicyId) {
        bookingData.cancellationPolicyId = Number(cancellationPolicyId);
      }

      if (calculatedPrice) {
        bookingData.totalPrice = calculatedPrice;
      }

      if (source === 'OTA_BOOKING_COM' || source === 'OTA_MMT' || source === 'OTA_GOIBIBO' || source === 'OTA_YATRA' || source === 'OTA_AGODA') {
        if (sourceReservationId) {
          bookingData.sourceReservationId = sourceReservationId;
        }
        if (sourceCommissionPct) {
          bookingData.sourceCommissionPct = Number(sourceCommissionPct);
        }
      }

      if (additionalGuests.length > 0) {
        bookingData.additionalGuests = additionalGuests.filter(g => g.name.trim() !== '');
      }

      // Create booking
      const response = await createBooking(bookingData);

      if (response.success && response.data) {
        // Success - redirect or call callback
        if (onSuccess) {
          onSuccess(response.data.id);
        } else {
          // Default: redirect to booking detail page
          window.location.href = `/admin/bookings/${response.data.id}`;
        }
      } else {
        // If response doesn't have success, try to extract error message
        const errorMessage = (response as any).error || (response as any).message || 'Failed to create booking';
        setError(errorMessage);
      }
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const addAdditionalGuest = () => {
    setAdditionalGuests([...additionalGuests, { name: '', email: '', phone: '' }]);
  };

  const removeAdditionalGuest = (index: number) => {
    setAdditionalGuests(additionalGuests.filter((_, i) => i !== index));
  };

  const updateAdditionalGuest = (index: number, field: keyof AdditionalGuest, value: string | number) => {
    const updated = [...additionalGuests];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalGuests(updated);
  };

  const sourceOptions: BookingSource[] = [
    'WALK_IN',
    'PHONE',
    'WEB_DIRECT',
    'OTA_BOOKING_COM',
    'OTA_MMT',
    'OTA_GOIBIBO',
    'OTA_YATRA',
    'OTA_AGODA',
    'CORPORATE',
  ];

  const isOTASource = source.startsWith('OTA_');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Basic Booking Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Property */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property <span className="text-red-500">*</span>
            </label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          {/* Room Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Type <span className="text-red-500">*</span>
            </label>
            <select
              value={roomTypeId}
              onChange={(e) => setRoomTypeId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!propertyId}
              required
            >
              <option value="">Select Room Type</option>
              {roomTypes.map((roomType) => (
                <option key={roomType.id} value={roomType.id}>
                  {roomType.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rate Plan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate Plan
            </label>
            <select
              value={ratePlanId}
              onChange={(e) => setRatePlanId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!roomTypeId}
            >
              <option value="">Select Rate Plan (Optional)</option>
              {ratePlans.map((ratePlan) => (
                <option key={ratePlan.id} value={ratePlan.id}>
                  {ratePlan.name} {ratePlan.seasonalPrice ? `- ${formatCurrency(ratePlan.seasonalPrice, ratePlan.currency || 'INR')}/night` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Booking Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Booking Source <span className="text-red-500">*</span>
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as BookingSource)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {sourceOptions.map((src) => (
                <option key={src} value={src}>
                  {src.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Check-in Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check-in Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Check-out Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check-out Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Number of Guests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Guests <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value) || 1)}
              min={1}
              max={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Number of Rooms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Rooms <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={rooms}
              onChange={(e) => setRooms(Number(e.target.value) || 1)}
              min={1}
              max={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Cancellation Policy */}
          {cancellationPolicies.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cancellation Policy
              </label>
              <select
                value={cancellationPolicyId}
                onChange={(e) => setCancellationPolicyId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Cancellation Policy (Optional)</option>
                {cancellationPolicies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Price Calculation */}
          {calculatedPrice && nights > 0 && (
            <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Estimated Total:</span>
                <span className="text-lg font-semibold text-blue-900">
                  {formatCurrency(calculatedPrice, 'INR')} ({nights} night{nights > 1 ? 's' : ''})
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guest Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Guest Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Guest Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guest Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Additional Guests */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Additional Guests
            </label>
            <button
              type="button"
              onClick={addAdditionalGuest}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + Add Guest
            </button>
          </div>
          {additionalGuests.map((guest, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3 p-3 bg-gray-50 rounded-md">
              <input
                type="text"
                placeholder="Name"
                value={guest.name}
                onChange={(e) => updateAdditionalGuest(index, 'name', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={guest.email}
                onChange={(e) => updateAdditionalGuest(index, 'email', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={guest.phone}
                onChange={(e) => updateAdditionalGuest(index, 'phone', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => removeAdditionalGuest(index)}
                className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* OTA Information (if OTA source) */}
      {isOTASource && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">OTA Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                External Reservation ID
              </label>
              <input
                type="text"
                value={sourceReservationId}
                onChange={(e) => setSourceReservationId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., BK123456789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission Percentage (%)
              </label>
              <input
                type="number"
                value={sourceCommissionPct}
                onChange={(e) => setSourceCommissionPct(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 15"
                min={0}
                max={100}
                step={0.01}
              />
            </div>
          </div>
        </div>
      )}

      {/* Notes and Special Requests */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes & Requests</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Requests
            </label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Late check-in, high floor, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Notes (Staff Only)
            </label>
            <textarea
              value={notesInternal}
              onChange={(e) => setNotesInternal(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VIP guest, special handling, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guest Visible Notes
            </label>
            <textarea
              value={notesGuest}
              onChange={(e) => setNotesGuest(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Welcome message, instructions, etc."
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Booking'}
        </button>
      </div>
    </form>
  );
}

