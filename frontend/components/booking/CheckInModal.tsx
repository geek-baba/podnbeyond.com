/**
 * Check-in Modal
 * Allows staff to check-in a booking and assign rooms
 */

import React, { useState, useEffect } from 'react';
import { Booking, checkInBooking, Stay, Room } from '../../lib/booking';

interface CheckInModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rooms?: Array<{ id: number; number: string; roomTypeId: number }>;
}

export default function CheckInModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
  rooms = [],
}: CheckInModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomAssignments, setRoomAssignments] = useState<Record<number, number>>({});

  useEffect(() => {
    if (isOpen && booking.stays) {
      // Initialize room assignments from existing stays
      const assignments: Record<number, number> = {};
      booking.stays.forEach((stay) => {
        if (stay.roomId) {
          assignments[stay.id] = stay.roomId;
        }
      });
      setRoomAssignments(assignments);
      setError(null);
    }
  }, [isOpen, booking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Build room assignments array
      const assignments = Object.entries(roomAssignments)
        .filter(([stayId, roomId]) => roomId)
        .map(([stayId, roomId]) => ({
          stayId: parseInt(stayId),
          roomId: roomId as number,
        }));

      await checkInBooking(booking.id, {
        roomAssignments: assignments.length > 0 ? assignments : undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error checking in booking:', err);
      setError(err.message || 'Failed to check-in booking');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomAssignment = (stayId: number, roomId: number | null) => {
    setRoomAssignments((prev) => {
      if (roomId === null) {
        const { [stayId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [stayId]: roomId };
    });
  };

  const availableRooms = rooms.filter((room) => room.roomTypeId === booking.roomTypeId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Check-in Booking</h2>
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

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Room Assignments */}
              {booking.stays && booking.stays.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Assignments
                  </label>
                  <div className="space-y-3">
                    {booking.stays.map((stay) => (
                      <div key={stay.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-900">Stay #{stay.id}</span>
                          <span className="ml-2 text-sm text-gray-500">
                            ({new Date(stay.checkInDate).toLocaleDateString()} -{' '}
                            {new Date(stay.checkOutDate).toLocaleDateString()})
                          </span>
                        </div>
                        <select
                          value={roomAssignments[stay.id] || ''}
                          onChange={(e) =>
                            handleRoomAssignment(
                              stay.id,
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Room (Optional)</option>
                          {availableRooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              Room {room.number}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  {availableRooms.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      No rooms available for this room type. You can check-in without assigning a room.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    No stays found for this booking. The booking will be checked in without room assignments.
                  </p>
                </div>
              )}

              {/* Guest Verification */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Please verify the guest's identity and confirm all details before checking in.
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
                {loading ? 'Checking in...' : 'Check-in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

