/**
 * Modify Booking Modal
 * Allows staff to modify booking details (dates, guests, room type)
 */

import React, { useState, useEffect } from 'react';
import { Booking, updateBooking, formatDate, formatCurrency } from '../../lib/booking';
import DatePicker from '../ui/DatePicker';

interface ModifyBookingModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  properties?: Array<{ id: number; name: string }>;
  roomTypes?: Array<{ id: number; name: string; propertyId: number }>;
}

export default function ModifyBookingModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
  properties = [],
  roomTypes = [],
}: ModifyBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    checkIn: booking.checkIn.split('T')[0],
    checkOut: booking.checkOut.split('T')[0],
    guests: booking.guests,
    rooms: booking.rooms,
    roomTypeId: booking.roomTypeId,
    specialRequests: booking.specialRequests || '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        checkIn: booking.checkIn.split('T')[0],
        checkOut: booking.checkOut.split('T')[0],
        guests: booking.guests,
        rooms: booking.rooms,
        roomTypeId: booking.roomTypeId,
        specialRequests: booking.specialRequests || '',
      });
      setError(null);
    }
  }, [isOpen, booking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate dates
      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(formData.checkOut);
      
      if (checkOutDate <= checkInDate) {
        setError('Check-out date must be after check-in date');
        setLoading(false);
        return;
      }

      // Validate guests
      if (formData.guests < 1) {
        setError('Number of guests must be at least 1');
        setLoading(false);
        return;
      }

      // Validate rooms
      if (formData.rooms < 1) {
        setError('Number of rooms must be at least 1');
        setLoading(false);
        return;
      }

      await updateBooking(booking.id, {
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guests: formData.guests,
        rooms: formData.rooms,
        roomTypeId: formData.roomTypeId,
        specialRequests: formData.specialRequests || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating booking:', err);
      setError(err.message || 'Failed to update booking');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const availableRoomTypes = roomTypes.filter((rt) => rt.propertyId === booking.propertyId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Modify Booking</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Booking Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Confirmation #:</span>
                <span className="ml-2 font-medium">{booking.confirmationNumber || `#${booking.id}`}</span>
              </div>
              <div>
                <span className="text-gray-500">Guest:</span>
                <span className="ml-2 font-medium">{booking.guestName}</span>
              </div>
              <div>
                <span className="text-gray-500">Current Total:</span>
                <span className="ml-2 font-medium">{formatCurrency(booking.totalPrice, booking.currency)}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 font-medium">{booking.status.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Check-in Date */}
              <DatePicker
                label="Check-in Date"
                value={formData.checkIn}
                onChange={(date) => {
                  handleChange('checkIn', date || '');
                  // Validate check-out is after new check-in
                  if (formData.checkOut && date && formData.checkOut <= date) {
                    handleChange('checkOut', '');
                  }
                }}
                required
                placeholder="Select check-in date"
              />

              {/* Check-out Date */}
              <DatePicker
                label="Check-out Date"
                value={formData.checkOut}
                onChange={(date) => {
                  // Validate checkOut > checkIn
                  if (formData.checkIn && date && date <= formData.checkIn) {
                    setError('Check-out date must be after check-in date');
                    return;
                  }
                  setError(null);
                  handleChange('checkOut', date || '');
                }}
                minDate={formData.checkIn}
                required
                placeholder="Select check-out date"
                error={error && error.includes('Check-out') ? error : undefined}
              />

              {/* Room Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.roomTypeId}
                  onChange={(e) => handleChange('roomTypeId', parseInt(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableRoomTypes.map((roomType) => (
                    <option key={roomType.id} value={roomType.id}>
                      {roomType.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Number of Guests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Guests <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.guests}
                  onChange={(e) => handleChange('guests', parseInt(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Number of Rooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Rooms <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.rooms}
                  onChange={(e) => handleChange('rooms', parseInt(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requests
                </label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => handleChange('specialRequests', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special requests or notes..."
                />
              </div>

              {/* Warning */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Modifying the booking may result in price changes. The new total will be calculated based on the updated dates and room type.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

