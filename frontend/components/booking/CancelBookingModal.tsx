/**
 * Cancel Booking Modal
 * Allows staff to cancel a booking with fee calculation and refund options
 */

import React, { useState, useEffect } from 'react';
import {
  Booking,
  cancelBooking,
  calculateCancellationFee,
  formatCurrency,
} from '../../lib/booking';

interface CancelBookingModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CancelBookingModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: CancelBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [feeInfo, setFeeInfo] = useState<{
    fee: number;
    refund: number;
    breakdown: any;
  } | null>(null);
  const [loadingFee, setLoadingFee] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
      setFeeInfo(null);
      fetchCancellationFee();
    }
  }, [isOpen, booking]);

  const fetchCancellationFee = async () => {
    setLoadingFee(true);
    try {
      const response = await calculateCancellationFee(booking.id, {
        cancellationDate: new Date().toISOString(),
      });
      if (response.success && response.data) {
        setFeeInfo(response.data);
      }
    } catch (err: any) {
      console.error('Error calculating cancellation fee:', err);
      // Don't show error, just proceed without fee info
    } finally {
      setLoadingFee(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await cancelBooking(booking.id, {
        reason: reason || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      setError(err.message || 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalPaid = (booking.payments || []).reduce((sum, payment) => {
    if (payment.status === 'COMPLETED') {
      return sum + payment.amount;
    }
    return sum;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Cancel Booking</h2>
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
                <span className="text-gray-500">Check-in:</span>
                <span className="ml-2 font-medium">{new Date(booking.checkIn).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Amount:</span>
                <span className="ml-2 font-medium">{formatCurrency(booking.totalPrice, booking.currency)}</span>
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
              <h3 className="text-sm font-medium text-gray-900 mb-3">Cancellation Fee Breakdown</h3>
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
              </div>
              {feeInfo.breakdown && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-gray-600">
                    {JSON.stringify(feeInfo.breakdown, null, 2)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Unable to calculate cancellation fee. Please check the cancellation policy.
              </p>
            </div>
          )}

          {/* Cancellation Policy */}
          {booking.cancellationPolicy && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Cancellation Policy</h3>
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
                  placeholder="Enter reason for cancellation..."
                />
              </div>

              {/* Warning */}
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. The booking will be cancelled and
                  {feeInfo && feeInfo.refund > 0
                    ? ` a refund of ${formatCurrency(feeInfo.refund, booking.currency)} will be processed.`
                    : ' any applicable refunds will be processed according to the cancellation policy.'}
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
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

