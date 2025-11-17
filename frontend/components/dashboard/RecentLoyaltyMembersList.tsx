import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import Link from 'next/link';

const MAX_RECENT_MEMBERS = 8;

interface LoyaltyMember {
  id: number;
  memberNumber: string;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
  tier: string;
  points: number;
  lifetimeStays: number;
  createdAt: string;
}

export default function RecentLoyaltyMembersList() {
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/loyalty/accounts?limit=10&sortBy=createdAt&sortOrder=desc', {
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const accounts = data.accounts || data.data || [];
          setMembers(accounts);
        } else {
          setMembers([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load loyalty members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const getTierVariant = (tier?: string | null): 'member' | 'silver' | 'gold' | 'platinum' | 'diamond' => {
    if (!tier) return 'member';
    switch (tier.toUpperCase()) {
      case 'MEMBER':
        return 'member';
      case 'SILVER':
        return 'silver';
      case 'GOLD':
        return 'gold';
      case 'PLATINUM':
        return 'platinum';
      case 'DIAMOND':
        return 'diamond';
      default:
        return 'member';
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
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Recent loyalty members</h3>
          <p className="text-sm text-neutral-500">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Recent loyalty members</h3>
        </div>

        {members.length === 0 ? (
          <EmptyState
            title="No loyalty members"
            description="No loyalty program members found"
            variant="generic"
          />
        ) : (
          <>
            <div className="max-h-64 overflow-y-auto space-y-3">
              {members.slice(0, MAX_RECENT_MEMBERS).map((member) => (
                <Link
                  key={member.id}
                  href={`/admin/loyalty?memberId=${member.id}`}
                  className="block p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {member.user?.name || member.memberNumber}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {member.memberNumber} • {member.points} points • {member.lifetimeStays} stays
                      </p>
                    </div>
                    <Badge variant={getTierVariant(member.tier)} size="sm">
                      {member.tier || 'Unknown'}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
            {members.length > MAX_RECENT_MEMBERS && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <Link
                  href="/admin/loyalty"
                  className="text-sm text-neutral-500 hover:text-neutral-700 hover:underline float-right"
                >
                  View all loyalty members →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

