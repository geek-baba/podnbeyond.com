import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import { getBookings, Booking } from '../../lib/booking';
import Link from 'next/link';

export default function PendingApprovalsCard() {
  const [pending, setPending] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        setLoading(true);
        const response = await getBookings({
          status: 'PENDING',
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });

        if (response.success && response.data) {
          setPending(response.data.bookings || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load pending approvals');
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
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
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Pending approvals</h3>
          <p className="text-sm text-neutral-500">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Pending approvals</h3>
          <Badge variant="pending">{pending.length}</Badge>
        </div>

        {pending.length === 0 ? (
          <EmptyState
            title="No pending approvals"
            description="All bookings have been processed"
            variant="generic"
          />
        ) : (
          <div className="space-y-3">
            {pending.slice(0, 5).map((booking) => (
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
                  <Badge variant="pending" size="sm">
                    {booking.status}
                  </Badge>
                </div>
              </Link>
            ))}
            {pending.length > 5 && (
              <Link
                href="/admin/bookings?status=PENDING"
                className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
              >
                View all {pending.length} pending →
              </Link>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

