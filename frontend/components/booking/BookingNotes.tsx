/**
 * Booking Notes Component
 * Displays and allows editing of internal and guest notes
 */

import React, { useState } from 'react';
import { Booking, updateBooking } from '../../lib/booking';

interface BookingNotesProps {
  booking: Booking;
  onUpdate?: () => void;
}

export default function BookingNotes({ booking, onUpdate }: BookingNotesProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<'internal' | 'guest' | null>(null);
  const [internalNotes, setInternalNotes] = useState(booking.notesInternal || '');
  const [guestNotes, setGuestNotes] = useState(booking.notesGuest || '');

  const handleSave = async (type: 'internal' | 'guest') => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateBooking(booking.id, {
        notesInternal: type === 'internal' ? internalNotes : booking.notesInternal,
        notesGuest: type === 'guest' ? guestNotes : booking.notesGuest,
      });

      setSuccess(`${type === 'internal' ? 'Internal' : 'Guest'} notes updated successfully`);
      setEditing(null);
      
      if (onUpdate) {
        onUpdate();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating notes:', err);
      setError(err.message || 'Failed to update notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (type: 'internal' | 'guest') => {
    if (type === 'internal') {
      setInternalNotes(booking.notesInternal || '');
    } else {
      setGuestNotes(booking.notesGuest || '');
    }
    setEditing(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Internal Notes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Internal Notes</h3>
            <p className="mt-1 text-sm text-gray-500">
              These notes are only visible to staff and will not be shown to guests.
            </p>
          </div>
          {editing !== 'internal' && (
            <button
              onClick={() => setEditing('internal')}
              className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {booking.notesInternal ? 'Edit' : 'Add Notes'}
            </button>
          )}
        </div>

        {editing === 'internal' ? (
          <div className="space-y-3">
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter internal notes (staff only)..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => handleCancel('internal')}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave('internal')}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            {booking.notesInternal ? (
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{booking.notesInternal}</p>
            ) : (
              <p className="text-sm text-gray-500 italic">No internal notes</p>
            )}
          </div>
        )}
      </div>

      {/* Guest Notes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Guest Notes</h3>
            <p className="mt-1 text-sm text-gray-500">
              These notes are visible to guests and can be included in confirmation emails.
            </p>
          </div>
          {editing !== 'guest' && (
            <button
              onClick={() => setEditing('guest')}
              className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {booking.notesGuest ? 'Edit' : 'Add Notes'}
            </button>
          )}
        </div>

        {editing === 'guest' ? (
          <div className="space-y-3">
            <textarea
              value={guestNotes}
              onChange={(e) => setGuestNotes(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter guest notes (visible to guests)..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => handleCancel('guest')}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave('guest')}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            {booking.notesGuest ? (
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{booking.notesGuest}</p>
            ) : (
              <p className="text-sm text-gray-500 italic">No guest notes</p>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Internal notes are only visible to staff. Guest notes are visible to guests and may be included in confirmation emails.
        </p>
      </div>
    </div>
  );
}

