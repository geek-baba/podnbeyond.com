/**
 * Check-out Modal
 * Allows staff to check-out a booking and finalize charges
 */

import React, { useState, useEffect } from 'react';
import { Booking, checkOutBooking, formatCurrency, calculateOutstandingBalance } from '../../lib/booking';

interface CheckOutModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckOutModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: CheckOutModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalCharges, setFinalCharges] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const outstanding = calculateOutstandingBalance(booking);
      setFinalCharges(outstanding > 0 ? outstanding : null);
      setError(null);
    }
  }, [isOpen, booking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await checkOutBooking(booking.id, {
        finalCharges: finalCharges || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error checking out booking:', err);
      setError(err.message || 'Failed to check-out booking');
    } finally {
      setLoading(false);
    }
  };

  const outstandingBalance = calculateOutstandingBalance(booking);
  const totalPaid = (booking.payments || []).reduce((sum, payment) => {
    if (payment.status === 'COMPLETED') {
      return sum + payment.amount;
    }
    return sum;
  }, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Check-out Booking</h2>
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
                <span className="text-gray-500">Check-out:</span>
                <span className="ml-2 font-medium">{new Date(booking.checkOut).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Booking Amount:</span>
                <span className="font-medium">{formatCurrency(booking.totalPrice, booking.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Paid:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(totalPaid, booking.currency)}
                </span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-2">
                <span className="text-gray-900 font-medium">Outstanding Balance:</span>
                <span
                  className={`font-medium ${
                    outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatCurrency(outstandingBalance, booking.currency)}
                </span>
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
              {/* Final Charges */}
              {outstandingBalance > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Final Charges (if different from outstanding balance)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={finalCharges || ''}
                    onChange={(e) =>
                      setFinalCharges(e.target.value ? parseFloat(e.target.value) : null)
                    }
                    placeholder={outstandingBalance.toString()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Leave empty to use outstanding balance: {formatCurrency(outstandingBalance, booking.currency)}
                  </p>
                </div>
              )}

              {/* Payment Status */}
              {outstandingBalance === 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    <strong>All payments are settled.</strong> You can proceed with check-out.
                  </p>
                </div>
              )}

              {/* Warning */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Checking out will finalize the booking and update the status to CHECKED_OUT.
                  {outstandingBalance > 0 && ' Please ensure all charges are collected before checking out.'}
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
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Checking out...' : 'Check-out'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

