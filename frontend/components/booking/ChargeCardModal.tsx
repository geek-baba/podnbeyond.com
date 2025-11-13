/**
 * Charge Card Modal
 * Allows staff to charge a card on file for a booking
 */

import React, { useState, useEffect } from 'react';
import { Booking, chargeCard, formatCurrency, calculateOutstandingBalance } from '../../lib/booking';

interface ChargeCardModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChargeCardModal({ booking, isOpen, onClose, onSuccess }: ChargeCardModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | ''>('');
  const [cardId, setCardId] = useState('');
  const [notes, setNotes] = useState('');

  const outstandingBalance = calculateOutstandingBalance(booking);

  useEffect(() => {
    if (isOpen) {
      // Set default amount to outstanding balance
      setAmount(outstandingBalance);
      setCardId('');
      setNotes('');
      setError(null);
    }
  }, [isOpen, outstandingBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const chargeAmount = typeof amount === 'number' ? amount : parseFloat(amount.toString());
      
      if (isNaN(chargeAmount) || chargeAmount <= 0) {
        setError('Invalid charge amount');
        setLoading(false);
        return;
      }

      if (chargeAmount > outstandingBalance) {
        setError('Charge amount cannot exceed outstanding balance');
        setLoading(false);
        return;
      }

      await chargeCard(booking.id, {
        amount: chargeAmount,
        cardId: cardId || undefined,
        notes: notes || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error charging card:', err);
      setError(err.message || 'Failed to charge card');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Charge Card</h2>

          {/* Booking Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm space-y-2">
              <div>
                <span className="text-gray-500">Booking #:</span>
                <span className="ml-2 font-medium">{booking.confirmationNumber || `#${booking.id}`}</span>
              </div>
              <div>
                <span className="text-gray-500">Outstanding Balance:</span>
                <span className="ml-2 font-medium text-red-600">
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
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
                  required
                  min="0.01"
                  max={outstandingBalance}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Max: ${formatCurrency(outstandingBalance, booking.currency)}`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Outstanding balance: {formatCurrency(outstandingBalance, booking.currency)}
                </p>
              </div>

              {/* Card ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card ID (Optional)
                </label>
                <input
                  type="text"
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Card identifier or last 4 digits"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes about this charge..."
                />
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
                {loading ? 'Charging...' : 'Charge Card'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

