/**
 * Issue Refund Modal
 * Allows staff to issue a refund for a payment
 */

import React, { useState, useEffect } from 'react';
import { Booking, Payment, issueRefund, formatCurrency, getPaymentMethod, getPaymentCurrency } from '../../lib/booking';

interface IssueRefundModalProps {
  booking: Booking;
  payment: Payment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function IssueRefundModal({
  booking,
  payment,
  isOpen,
  onClose,
  onSuccess,
}: IssueRefundModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [processRefund, setProcessRefund] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen && payment) {
      // Set default amount to payment amount
      setAmount(Math.abs(payment.amount));
      setReason('');
      setProcessRefund(true);
      setConfirmed(false);
      setError(null);
    }
  }, [isOpen, payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirmed) {
      setError('Please confirm that you want to issue this refund');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const refundAmount = typeof amount === 'number' ? amount : parseFloat(amount.toString());
      
      if (isNaN(refundAmount) || refundAmount <= 0) {
        setError('Invalid refund amount');
        setLoading(false);
        return;
      }

      const maxRefund = Math.abs(payment.amount);
      if (refundAmount > maxRefund) {
        setError(`Refund amount cannot exceed payment amount (${formatCurrency(maxRefund, getPaymentCurrency(payment, booking.currency))})`);
        setLoading(false);
        return;
      }

      await issueRefund(payment.id, {
        amount: refundAmount,
        reason: reason || undefined,
        processRefund: processRefund,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error issuing refund:', err);
      setError(err.message || 'Failed to issue refund');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !payment) return null;

  const maxRefund = Math.abs(payment.amount);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Issue Refund</h2>

          {/* Payment Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm space-y-2">
              <div>
                <span className="text-gray-500">Payment #:</span>
                <span className="ml-2 font-medium">#{payment.id}</span>
              </div>
              <div>
                <span className="text-gray-500">Payment Amount:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(Math.abs(payment.amount), getPaymentCurrency(payment, booking.currency))}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Payment Method:</span>
                <span className="ml-2 font-medium capitalize">
                  {getPaymentMethod(payment).replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Payment Status:</span>
                <span className="ml-2 font-medium">{payment.status}</span>
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
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
                  required
                  min="0.01"
                  max={maxRefund}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Max: ${formatCurrency(maxRefund, getPaymentCurrency(payment, booking.currency))}`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum refund: {formatCurrency(maxRefund, getPaymentCurrency(payment, booking.currency))}
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Reason (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Reason for refund..."
                />
              </div>

              {/* Process Refund */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="process-refund"
                  checked={processRefund}
                  onChange={(e) => setProcessRefund(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="process-refund" className="ml-2 text-sm text-gray-700">
                  Process refund via payment gateway (if applicable)
                </label>
              </div>

              {/* Confirmation */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="confirm-refund"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="confirm-refund" className="ml-2 text-sm text-gray-700">
                  I confirm that this refund is authorized and{' '}
                  {formatCurrency(typeof amount === 'number' ? amount : parseFloat(amount.toString()) || 0, getPaymentCurrency(payment, booking.currency))}{' '}
                  will be refunded to the customer.
                </label>
              </div>

              {/* Warning */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This action cannot be undone. The refund will be processed immediately.
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
                disabled={loading || !confirmed}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Issue Refund'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

