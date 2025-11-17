import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import Link from 'next/link';

interface LoyaltyRequest {
  id: number;
  memberNumber: string;
  memberName: string;
  requestType: string;
  status: string;
  createdAt: string;
}

export default function LoyaltyRequestsCard() {
  const [requests, setRequests] = useState<LoyaltyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        // Placeholder: In Phase 11, this would fetch from /api/loyalty/requests
        // For now, return empty array as this endpoint may not exist yet
        setRequests([]);
      } catch (err: any) {
        setError(err.message || 'Failed to load loyalty requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
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
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Loyalty requests</h3>
          <p className="text-sm text-neutral-500">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Loyalty requests</h3>
          <Badge variant="neutral">{requests.length}</Badge>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            title="No loyalty requests"
            description="No pending loyalty program requests"
            variant="generic"
          />
        ) : (
          <div className="space-y-3">
            {requests.slice(0, 5).map((request) => (
              <Link
                key={request.id}
                href={`/admin/loyalty?requestId=${request.id}`}
                className="block p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {request.memberName}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {request.requestType} • {request.memberNumber}
                    </p>
                  </div>
                  <Badge variant="pending" size="sm">
                    {request.status}
                  </Badge>
                </div>
              </Link>
            ))}
            {requests.length > 5 && (
              <Link
                href="/admin/loyalty"
                className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
              >
                View all {requests.length} requests →
              </Link>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

