import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import { getBookings, Booking } from '../../lib/booking';
import Link from 'next/link';

export default function RecentBookingsTable() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setLoading(true);
        const response = await getBookings({
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });

        if (response.success && response.data) {
          setBookings(response.data.bookings || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load recent bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, []);

  const getStatusVariant = (status: string): 'pending' | 'confirmed' | 'checkedIn' | 'cancelled' | 'neutral' => {
    switch (status) {
      case 'PENDING':
        return 'pending';
      case 'CONFIRMED':
        return 'confirmed';
      case 'CHECKED_IN':
        return 'checkedIn';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'neutral';
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Recent bookings</h3>
          <p className="text-sm text-neutral-500">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Recent bookings</h3>
          <Link
            href="/admin/bookings"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all →
          </Link>
        </div>

        {bookings.length === 0 ? (
          <EmptyState
            title="No recent bookings"
            description="No bookings found"
            variant="table"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id} hover>
                  <TableCell>
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {booking.guestName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-neutral-900">
                      {booking.property?.name || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-neutral-600">
                      {new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(booking.status)} size="sm">
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell align="right">
                    <span className="text-sm font-medium text-neutral-900">
                      ₹{booking.totalPrice?.toLocaleString() || '0'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  );
}

