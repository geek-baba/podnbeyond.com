/**
 * Guest Cancel Booking Form Component
 * Allows guests to cancel their booking with fee calculation
 */

import React, { useState, useEffect } from 'react';
import {
  Booking,
  cancelGuestBooking,
  formatCurrency,
  formatDate,
} from '../../lib/booking';

interface CancelBookingFormProps {
  booking: Booking;
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CancelBookingForm({ booking, token, onSuccess, onCancel }: CancelBookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [feeInfo, setFeeInfo] = useState<{
    fee: number;
    refund: number;
    breakdown: any;
  } | null>(null);
  const [loadingFee, setLoadingFee] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    calculateFee();
  }, [booking]);

  const calculateFee = () => {
    setLoadingFee(true);
    try {
      // Calculate cancellation fee client-side based on cancellation policy
      // In production, this would be calculated on the backend
      const totalPaid = (booking.payments || []).reduce((sum, p) => {
        if (p.status === 'CAPTURED') return sum + p.amount;
        return sum;
      }, 0);
      
      if (!booking.cancellationPolicy) {
        // No cancellation policy - show message
        setFeeInfo(null);
        setLoadingFee(false);
        return;
      }
      
      // Simple calculation - in production, this would use the policy rules from the backend
      const checkInDate = new Date(booking.checkIn);
      const now = new Date();
      const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const daysUntilCheckIn = hoursUntilCheckIn / 24;
      
      let fee = 0;
      let refund = totalPaid;
      
      // Default policy: Free cancellation if cancelled more than 24 hours before check-in
      // Charge first night if cancelled within 24 hours
      if (hoursUntilCheckIn < 24 && hoursUntilCheckIn > 0) {
        // Cancel within 24 hours - charge first night
        const nights = Math.ceil((new Date(booking.checkOut).getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        const firstNight = booking.totalPrice / Math.max(nights, 1);
        fee = Math.min(firstNight, totalPaid);
        refund = Math.max(0, totalPaid - fee);
      } else if (hoursUntilCheckIn <= 0) {
        // Check-in has passed - no refund
        fee = totalPaid;
        refund = 0;
      }
      // Else: hoursUntilCheckIn >= 24, free cancellation
      
      setFeeInfo({
        fee,
        refund,
        breakdown: {
          hoursUntilCheckIn: Math.round(hoursUntilCheckIn),
          daysUntilCheckIn: Math.round(daysUntilCheckIn * 10) / 10,
          policy: booking.cancellationPolicy.name,
        },
      });
    } catch (err: any) {
      console.error('Error calculating cancellation fee:', err);
      setFeeInfo(null);
    } finally {
      setLoadingFee(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirmed) {
      setError('Please confirm that you want to cancel this booking');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await cancelGuestBooking(token, {
        reason: reason || undefined,
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      setError(err.message || 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = (booking.payments || []).reduce((sum, payment) => {
    if (payment.status === 'CAPTURED') {
      return sum + payment.amount;
    }
    return sum;
  }, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Cancel Booking</h3>

      {/* Booking Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Confirmation #:</span>
            <span className="ml-2 font-medium">{booking.confirmationNumber || `#${booking.id}`}</span>
          </div>
          <div>
            <span className="text-gray-500">Check-in:</span>
            <span className="ml-2 font-medium">{formatDate(booking.checkIn)}</span>
          </div>
          <div>
            <span className="text-gray-500">Total Amount:</span>
            <span className="ml-2 font-medium">{formatCurrency(booking.totalPrice, booking.currency)}</span>
          </div>
          <div>
            <span className="text-gray-500">Total Paid:</span>
            <span className="ml-2 font-medium">{formatCurrency(totalPaid, booking.currency)}</span>
          </div>
        </div>
      </div>

      {/* Cancellation Fee Info */}
      {loadingFee ? (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">Calculating cancellation fee...</p>
        </div>
      ) : feeInfo ? (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Cancellation Fee Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Paid:</span>
              <span className="font-medium">{formatCurrency(totalPaid, booking.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cancellation Fee:</span>
              <span className="font-medium text-red-600">
                {formatCurrency(feeInfo.fee, booking.currency)}
              </span>
            </div>
            <div className="flex justify-between border-t border-blue-200 pt-2">
              <span className="text-gray-900 font-medium">Refund Amount:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(feeInfo.refund, booking.currency)}
              </span>
            </div>
            {feeInfo.breakdown && (
              <div className="mt-2 text-xs text-gray-500">
                {feeInfo.breakdown.hoursUntilCheckIn > 0
                  ? `Hours until check-in: ${feeInfo.breakdown.hoursUntilCheckIn}`
                  : 'Check-in has passed'}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Unable to calculate cancellation fee. The exact refund amount will be calculated when you cancel the booking.
          </p>
        </div>
      )}

      {/* Cancellation Policy */}
      {booking.cancellationPolicy && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Cancellation Policy</h4>
          <p className="text-sm text-gray-600">{booking.cancellationPolicy.name}</p>
          {booking.cancellationPolicy.description && (
            <p className="text-sm text-gray-600 mt-1">{booking.cancellationPolicy.description}</p>
          )}
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
          {/* Cancellation Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cancellation Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Please let us know why you're cancelling..."
            />
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="confirm-cancel"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="confirm-cancel" className="ml-2 text-sm text-gray-700">
              I understand that cancelling this booking cannot be undone and{' '}
              {feeInfo && feeInfo.refund > 0
                ? `a refund of ${formatCurrency(feeInfo.refund, booking.currency)} will be processed according to the cancellation policy.`
                : 'any applicable refunds will be processed according to the cancellation policy.'}
            </label>
          </div>

          {/* Warning */}
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This action cannot be undone. Your booking will be cancelled immediately.
            </p>
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
            disabled={loading || !confirmed}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </form>
    </div>
  );
}
