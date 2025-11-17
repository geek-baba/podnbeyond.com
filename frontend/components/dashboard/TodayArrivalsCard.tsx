import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import { getBookings, Booking } from '../../lib/booking';
import Link from 'next/link';

export default function TodayArrivalsCard() {
  const [arrivals, setArrivals] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArrivals = async () => {
      try {
        setLoading(true);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const response = await getBookings({
          checkInFrom: today.toISOString(),
          checkInTo: tomorrow.toISOString(),
          status: 'CONFIRMED',
          limit: 10,
          sortBy: 'checkIn',
          sortOrder: 'asc',
        });

        if (response.success && response.data) {
          setArrivals(response.data.bookings || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load arrivals');
      } finally {
        setLoading(false);
      }
    };

    fetchArrivals();
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
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Arrivals today</h3>
          <p className="text-sm text-neutral-500">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Arrivals today</h3>
          <Badge variant="neutral">{arrivals.length}</Badge>
        </div>

        {arrivals.length === 0 ? (
          <EmptyState
            title="No arrivals today"
            description="No confirmed bookings arriving today"
            variant="generic"
          />
        ) : (
          <div className="space-y-3">
            {arrivals.slice(0, 5).map((booking) => (
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
                      {booking.property?.name} • {booking.roomType?.name}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-xs text-neutral-500">
                      {new Date(booking.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </p>
                    <Badge variant="confirmed" size="sm" className="mt-1">
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
            {arrivals.length > 5 && (
              <Link
                href="/admin/bookings?checkInFrom=today&status=CONFIRMED"
                className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
              >
                View all {arrivals.length} arrivals →
              </Link>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

