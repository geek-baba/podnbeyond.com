/**
 * Booking List Component
 * Displays a table of bookings with actions
 */

import React from 'react';
import Link from 'next/link';
import {
  Booking,
  getStatusColor,
  getSourceColor,
  formatDate,
  formatCurrency,
  calculateOutstandingBalance,
} from '../../lib/booking';

interface BookingListProps {
  bookings: Booking[];
  onAction?: (action: string, booking: Booking) => void;
}

export default function BookingList({ bookings, onAction }: BookingListProps) {
  const handleAction = (action: string, booking: Booking) => {
    if (onAction) {
      onAction(action, booking);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Confirmation #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Guest
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Property
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dates
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Balance
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bookings.map((booking) => {
            const outstandingBalance = calculateOutstandingBalance(booking);
            return (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {booking.confirmationNumber || `#${booking.id}`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{booking.guestName}</div>
                  <div className="text-sm text-gray-500">{booking.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{booking.property?.name || 'N/A'}</div>
                  {booking.roomType && (
                    <div className="text-sm text-gray-500">{booking.roomType.name}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(booking.checkIn)}</div>
                  <div className="text-sm text-gray-500">to {formatDate(booking.checkOut)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {booking.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSourceColor(
                      booking.source
                    )}`}
                  >
                    {booking.source.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(booking.totalPrice, booking.currency)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`text-sm font-medium ${
                      outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(outstandingBalance, booking.currency)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    View
                  </Link>
                  <div className="inline-block relative">
                    <button
                      onClick={() => handleAction('actions', booking)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      ⋮
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {bookings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No bookings found</p>
        </div>
      )}
    </div>
  );
}

