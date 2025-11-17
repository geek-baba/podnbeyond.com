import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import { getBookings, Booking } from '../../lib/booking';
import Link from 'next/link';

export default function InHouseGuestsCard() {
  const [inHouse, setInHouse] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInHouse = async () => {
      try {
        setLoading(true);
        const response = await getBookings({
          status: 'CHECKED_IN',
          limit: 10,
          sortBy: 'checkIn',
          sortOrder: 'desc',
        });

        if (response.success && response.data) {
          setInHouse(response.data.bookings || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load in-house guests');
      } finally {
        setLoading(false);
      }
    };

    fetchInHouse();
  }, []);

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
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">In-house guests</h3>
          <p className="text-sm text-neutral-500">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">In-house guests</h3>
          <Badge variant="checkedIn">{inHouse.length}</Badge>
        </div>

        {inHouse.length === 0 ? (
          <EmptyState
            title="No in-house guests"
            description="No guests currently checked in"
            variant="generic"
          />
        ) : (
          <div className="space-y-3">
            {inHouse.slice(0, 5).map((booking) => (
              <Link
                key={booking.id}
                href={`/admin/bookings/${booking.id}`}
                className="block p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {booking.guestName}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {booking.property?.name} • Room {booking.roomAssignments?.[0]?.roomId || 'N/A'}
                    </p>
                  </div>
                  <Badge variant="checkedIn" size="sm">
                    {booking.status || 'Unknown'}
                  </Badge>
                </div>
              </Link>
            ))}
            {inHouse.length > 5 && (
              <Link
                href="/admin/bookings?status=CHECKED_IN"
                className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
              >
                View all {inHouse.length} in-house guests →
              </Link>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

