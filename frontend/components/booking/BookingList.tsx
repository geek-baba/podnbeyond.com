/**
 * Booking List Component
 * Displays a table of bookings with actions
 */

import React from 'react';
import Link from 'next/link';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import EmptyState from '../ui/EmptyState';
import {
  Booking,
  formatDate,
  formatCurrency,
  calculateOutstandingBalance,
} from '../../lib/booking';
import {
  mapBookingStatusToBadgeVariant,
  mapBookingSourceToBadgeVariant,
} from '../../lib/badge-mappers';

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
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Confirmation #</TableHead>
            <TableHead>Guest</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead align="right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            const outstandingBalance = calculateOutstandingBalance(booking);
            return (
              <TableRow key={booking.id}>
                <TableCell nowrap>
                  <div className="text-sm font-medium">
                    {booking.confirmationNumber || `#${booking.id}`}
                  </div>
                </TableCell>
                <TableCell nowrap>
                  <div className="text-sm font-medium">{booking.guestName}</div>
                  <div className="text-sm text-neutral-500">{booking.email}</div>
                </TableCell>
                <TableCell nowrap>
                  <div className="text-sm">{booking.property?.name || 'N/A'}</div>
                  {booking.roomType && (
                    <div className="text-sm text-neutral-500">{booking.roomType.name}</div>
                  )}
                </TableCell>
                <TableCell nowrap>
                  <div className="text-sm">{formatDate(booking.checkIn)}</div>
                  <div className="text-sm text-neutral-500">to {formatDate(booking.checkOut)}</div>
                </TableCell>
                <TableCell nowrap>
                  <Badge variant={mapBookingStatusToBadgeVariant(booking.status)} size="sm">
                    {booking.status.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell nowrap>
                  <Badge variant={mapBookingSourceToBadgeVariant(booking.source)} size="sm">
                    {booking.source.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell nowrap>
                  <div className="text-sm font-medium">
                    {formatCurrency(booking.totalPrice, booking.currency)}
                  </div>
                </TableCell>
                <TableCell nowrap>
                  <div
                    className={`text-sm font-medium ${
                      outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(outstandingBalance, booking.currency)}
                  </div>
                </TableCell>
                <TableCell align="right" nowrap>
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-4 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    View
                  </Link>
                  <Button
                    onClick={() => handleAction('actions', booking)}
                    variant="ghost"
                    size="sm"
                    aria-label="More actions"
                    className="px-2"
                  >
                    ⋮
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {bookings.length === 0 && (
        <EmptyState
          title="No bookings found"
          variant="table"
        />
      )}
    </>
  );
}

