/**
 * Guest Booking Detail Component
 * Displays booking details for guests in a guest-friendly format
 */

import React from 'react';
import {
  Booking,
  formatDate,
  formatCurrency,
  getStatusColor,
  getSourceColor,
  calculateOutstandingBalance,
} from '../../lib/booking';

interface GuestBookingDetailProps {
  booking: Booking;
}

export default function GuestBookingDetail({ booking }: GuestBookingDetailProps) {
  const outstandingBalance = calculateOutstandingBalance(booking);
  const totalPaid = (booking.payments || []).reduce((sum, payment) => {
    if (payment.status === 'CAPTURED') {
      return sum + payment.amount;
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Booking Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Booking #{booking.confirmationNumber || booking.id}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {booking.property?.name || 'Hotel'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span
              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                booking.status
              )}`}
            >
              {booking.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Booking Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Check-in</label>
            <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(booking.checkIn)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Check-out</label>
            <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(booking.checkOut)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Guests</label>
            <p className="mt-1 text-sm font-medium text-gray-900">{booking.guests} guest(s)</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Rooms</label>
            <p className="mt-1 text-sm font-medium text-gray-900">{booking.rooms} room(s)</p>
          </div>
        </div>
      </div>

      {/* Stay Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Stay Details</h3>
        <div className="space-y-4">
          {booking.stays && booking.stays.length > 0 ? (
            booking.stays.map((stay) => (
              <div key={stay.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Room Type</label>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {stay.roomType?.name || booking.roomType?.name || 'N/A'}
                    </p>
                  </div>
                  {stay.roomId && stay.room && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Room Number</label>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {stay.room.number || 'N/A'}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Check-in</label>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(stay.checkInDate)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Check-out</label>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(stay.checkOutDate)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Room Type</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {booking.roomType?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Check-in</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(booking.checkIn)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Check-out</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(booking.checkOut)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guest Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Guest Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Name</label>
            <p className="mt-1 text-sm font-medium text-gray-900">{booking.guestName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="mt-1 text-sm font-medium text-gray-900">{booking.email}</p>
          </div>
          {booking.phone && (
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="mt-1 text-sm font-medium text-gray-900">{booking.phone}</p>
            </div>
          )}
        </div>

        {/* Additional Guests */}
        {booking.bookingGuests && booking.bookingGuests.length > 1 && (
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-500 mb-2 block">Additional Guests</label>
            <div className="space-y-2">
              {booking.bookingGuests
                .filter((g) => !g.isPrimary)
                .map((guest) => (
                  <div key={guest.id} className="text-sm text-gray-900">
                    {guest.name}
                    {guest.email && <span className="text-gray-500 ml-2">({guest.email})</span>}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Total Booking Amount</span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(booking.totalPrice, booking.currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Total Paid</span>
            <span className="text-sm font-medium text-green-600">
              {formatCurrency(totalPaid, booking.currency)}
            </span>
          </div>
          {outstandingBalance > 0 && (
            <div className="flex justify-between border-t border-gray-200 pt-3">
              <span className="text-sm font-medium text-gray-900">Outstanding Balance</span>
              <span className="text-sm font-medium text-red-600">
                {formatCurrency(outstandingBalance, booking.currency)}
              </span>
            </div>
          )}
          {outstandingBalance === 0 && (
            <div className="flex justify-between border-t border-gray-200 pt-3">
              <span className="text-sm font-medium text-gray-900">Payment Status</span>
              <span className="text-sm font-medium text-green-600">Fully Paid</span>
            </div>
          )}
        </div>
      </div>

      {/* Payments */}
      {booking.payments && booking.payments.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment History</h3>
          <div className="space-y-3">
            {booking.payments.map((payment) => (
              <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount, payment.currency || booking.currency)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {payment.method.replace(/_/g, ' ')} • {formatDate(payment.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      payment.status === 'CAPTURED'
                        ? 'bg-green-100 text-green-800'
                        : payment.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancellation Policy */}
      {booking.cancellationPolicy && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cancellation Policy</h3>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">{booking.cancellationPolicy.name}</p>
            {booking.cancellationPolicy.description && (
              <p className="text-sm text-gray-600">{booking.cancellationPolicy.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Guest Notes */}
      {booking.notesGuest && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{booking.notesGuest}</p>
        </div>
      )}

      {/* Special Requests */}
      {booking.specialRequests && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Special Requests</h3>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{booking.specialRequests}</p>
        </div>
      )}
    </div>
  );
}

