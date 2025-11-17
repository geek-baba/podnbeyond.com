import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import Link from 'next/link';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
}

export default function IntegrationsOverviewCard() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/integrations', {
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const integrationsList = data.integrations || data.data || [];
          setIntegrations(integrationsList);
        } else {
          setIntegrations([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load integrations');
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'disconnected':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'warning';
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
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Integrations</h3>
          <p className="text-sm text-neutral-500">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Integrations</h3>
          <Link
            href="/admin/integrations"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Manage →
          </Link>
        </div>

        {integrations.length === 0 ? (
          <EmptyState
            title="No integrations"
            description="No integrations configured"
            variant="generic"
          />
        ) : (
          <div className="space-y-3">
            {integrations.slice(0, 5).map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-3 rounded-lg border border-neutral-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {integration.name}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">{integration.type}</p>
                </div>
                <Badge variant={getStatusVariant(integration.status)} size="sm">
                  {integration.status}
                </Badge>
              </div>
            ))}
            {integrations.length > 5 && (
              <Link
                href="/admin/integrations"
                className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
              >
                View all {integrations.length} integrations →
              </Link>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

