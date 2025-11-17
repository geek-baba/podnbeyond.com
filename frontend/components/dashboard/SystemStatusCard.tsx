import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';

interface SystemStatus {
  api: 'healthy' | 'degraded' | 'down';
  database: 'healthy' | 'degraded' | 'down';
  integrations: 'healthy' | 'degraded' | 'down';
}

export default function SystemStatusCard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        setLoading(true);
        // Placeholder: In Phase 11, this would check system health
        // For now, assume all systems are healthy
        setStatus({
          api: 'healthy',
          database: 'healthy',
          integrations: 'healthy',
        });
      } catch (err) {
        setStatus({
          api: 'down',
          database: 'down',
          integrations: 'down',
        });
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    // Refresh every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusVariant = (status?: string | null): 'success' | 'warning' | 'error' => {
    if (!status) return 'error';
    switch (status) {
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
        return 'error';
      default:
        return 'error';
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

  if (!status) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">System status</h3>
          <p className="text-sm text-neutral-500">Unable to check system status</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">System status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">API</span>
            <Badge variant={getStatusVariant(status.api)} size="sm">
              {status.api}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Database</span>
            <Badge variant={getStatusVariant(status.database)} size="sm">
              {status.database}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Integrations</span>
            <Badge variant={getStatusVariant(status.integrations)} size="sm">
              {status.integrations}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}

