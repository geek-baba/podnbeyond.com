import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import Link from 'next/link';

interface Conversation {
  id: number;
  channel: string;
  subject: string;
  status: string;
  priority: string;
  unreadCount: number;
  lastMessageAt: string;
}

export default function CommHubOpenThreadsCard() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/conversations?status=OPEN&limit=10', {
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || data.data || []);
        } else {
          setConversations([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
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
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Open conversations</h3>
          <p className="text-sm text-neutral-500">{error}</p>
        </div>
      </Card>
    );
  }

  const getChannelBadgeVariant = (channel?: string | null): 'neutral' | 'success' | 'warning' => {
    if (!channel) return 'neutral';
    switch (channel.toUpperCase()) {
      case 'EMAIL':
        return 'neutral';
      case 'WHATSAPP':
        return 'success';
      case 'SMS':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Open conversations</h3>
          <Badge variant="neutral">{conversations.length}</Badge>
        </div>

        {conversations.length === 0 ? (
          <EmptyState
            title="No open conversations"
            description="All conversations have been resolved"
            variant="generic"
          />
        ) : (
          <div className="space-y-3">
            {conversations.slice(0, 5).map((conv) => (
              <Link
                key={conv.id}
                href={`/admin/communication-hub?conversationId=${conv.id}`}
                className="block p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getChannelBadgeVariant(conv.channel)} size="sm">
                        {conv.channel || 'Unknown'}
                      </Badge>
                      {conv.unreadCount > 0 && (
                        <Badge variant="error" size="sm">
                          {conv.unreadCount} new
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {conv.subject || 'No subject'}
                    </p>
                  </div>
                  <Badge variant="pending" size="sm">
                    {conv.status}
                  </Badge>
                </div>
              </Link>
            ))}
            {conversations.length > 5 && (
              <Link
                href="/admin/communication-hub?status=OPEN"
                className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
              >
                View all {conversations.length} conversations →
              </Link>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

