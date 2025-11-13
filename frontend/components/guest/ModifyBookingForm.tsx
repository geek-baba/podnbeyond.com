/**
 * Guest Modify Booking Form Component
 * Allows guests to request modifications to their booking
 */

import React, { useState } from 'react';
import { Booking, updateGuestBooking, requestGuestBookingModification, formatDate } from '../../lib/booking';

interface ModifyBookingFormProps {
  booking: Booking;
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ModifyBookingForm({ booking, token, onSuccess, onCancel }: ModifyBookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    checkIn: booking.checkIn.split('T')[0],
    checkOut: booking.checkOut.split('T')[0],
    specialRequests: booking.specialRequests || '',
    guestName: booking.guestName,
    phone: booking.phone || '',
  });
  const [requestMode, setRequestMode] = useState<'direct' | 'request'>('direct');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate dates
      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(formData.checkOut);

      if (checkOutDate <= checkInDate) {
        setError('Check-out date must be after check-in date');
        setLoading(false);
        return;
      }

      if (requestMode === 'direct') {
        // Try to modify directly
        try {
          await updateGuestBooking(token, {
            checkIn: formData.checkIn,
            checkOut: formData.checkOut,
            specialRequests: formData.specialRequests || undefined,
            guestName: formData.guestName,
            phone: formData.phone || undefined,
          });

          setSuccess('Booking updated successfully');
          setTimeout(() => {
            onSuccess();
          }, 2000);
        } catch (err: any) {
          // If direct modification fails, fall back to request mode
          console.warn('Direct modification failed, requesting modification:', err);
          setRequestMode('request');
          await requestGuestBookingModification(token, {
            requestedChanges: {
              checkIn: formData.checkIn,
              checkOut: formData.checkOut,
              specialRequests: formData.specialRequests,
              guestName: formData.guestName,
              phone: formData.phone,
            },
            reason: 'Guest requested modification',
          });

          setSuccess('Modification request submitted successfully. We will review and contact you soon.');
          setTimeout(() => {
            onSuccess();
          }, 3000);
        }
      } else {
        // Request modification
        await requestGuestBookingModification(token, {
          requestedChanges: {
            checkIn: formData.checkIn,
            checkOut: formData.checkOut,
            specialRequests: formData.specialRequests,
            guestName: formData.guestName,
            phone: formData.phone,
          },
          reason: 'Guest requested modification',
        });

        setSuccess('Modification request submitted successfully. We will review and contact you soon.');
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error modifying booking:', err);
      setError(err.message || 'Failed to modify booking');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Modify Booking</h3>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
          {success}
        </div>
      )}

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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check-in Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.checkIn}
              onChange={(e) => handleChange('checkIn', e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Check-out Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check-out Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.checkOut}
              onChange={(e) => handleChange('checkOut', e.target.value)}
              required
              min={formData.checkIn}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Guest Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guest Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.guestName}
              onChange={(e) => handleChange('guestName', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
            <textarea
              value={formData.specialRequests}
              onChange={(e) => handleChange('specialRequests', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any special requests or notes..."
            />
          </div>

          {/* Warning */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Modifying your booking may result in price changes. We will review your request and contact you if any changes are required.
            </p>
          </div>

          {/* Mode Selection */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={requestMode === 'direct'}
                onChange={() => setRequestMode('direct')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Try to modify directly</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={requestMode === 'request'}
                onChange={() => setRequestMode('request')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Request modification</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
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
            {loading ? 'Submitting...' : requestMode === 'direct' ? 'Update Booking' : 'Request Modification'}
          </button>
        </div>
      </form>
    </div>
  );
}

