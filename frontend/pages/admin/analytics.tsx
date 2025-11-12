import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/useAuth';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Container from '../../components/layout/Container';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

interface AnalyticsData {
  overview: {
    totalConversations: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    channelBreakdown: Record<string, number>;
  };
  performance: {
    avgResponseTime: number;
    avgResolutionTime: number;
    slaBreachRate: number;
    slaBreachedCount: number;
    respondedCount: number;
    resolvedCount: number;
  };
  trends: {
    dailyStats: Record<string, number>;
  };
  topAssignees: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    count: number;
  }>;
}

export default function AnalyticsPage() {
  const { data: session, status: authStatus, signOut } = useAuth();
  const router = useRouter();
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [properties, setProperties] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
    endDate: new Date().toISOString().split('T')[0],
    propertyId: '',
  });

  // Check authorization
  useEffect(() => {
    if (authStatus === 'loading') return;
    
    if (authStatus === 'unauthenticated') {
      router.push('/admin/login');
    } else if (authStatus === 'authenticated') {
      const userRoles = session?.user?.roles || [];
      const isAdmin = userRoles.some((r: any) => 
        ['ADMIN', 'SUPERADMIN', 'MANAGER'].includes(r.key)
      );
      
      if (!isAdmin && session?.user?.email !== 'admin@podnbeyond.com' && session?.user?.email !== 'shwet@thedesi.email') {
        router.push('/admin/forbidden');
      }
    }
  }, [authStatus, session, router]);

  // Load data
  useEffect(() => {
    if (authStatus === 'authenticated') {
      loadAnalytics();
      loadProperties();
    }
  }, [authStatus, filters]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      // Pass userId with fallbacks (same as communication-hub.tsx)
      params.append('userId', session?.user?.id || session?.id || session?.user?.email || '');
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.propertyId) params.append('propertyId', filters.propertyId);

      const response = await fetch(`/api/analytics/conversations?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        console.error('Analytics API error:', data.error);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      const data = await response.json();
      if (data.success) {
        setProperties(data.properties.map((p: any) => ({ id: p.id, name: p.name })));
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
    }
  };

  const exportData = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams();
      // Pass userId with fallbacks (same as communication-hub.tsx)
      params.append('userId', session?.user?.id || session?.id || session?.user?.email || '');
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.propertyId) params.append('propertyId', filters.propertyId);

      const response = await fetch(`/api/analytics/export?${params.toString()}&format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    }
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Failed to load analytics</div>
      </div>
    );
  }

  // Prepare chart data
  const dailyStatsArray = Object.entries(analytics.trends.dailyStats)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const maxDailyCount = Math.max(...dailyStatsArray.map(d => d.count), 1);

  return (
    <>
      <Head>
        <title>Analytics | POD</title>
      </Head>
      
      <div className="min-h-screen bg-neutral-50">
        <Header />

        {/* Communication Hub Header */}
        <section className="pt-24 pb-6 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
          <Container>
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
              <div className="flex items-start gap-6">
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <p className="text-xs text-neutral-400 uppercase tracking-wide">Signed in as</p>
                    <p className="text-white font-semibold text-sm mt-0.5">
                      {session?.user?.email || 'Not signed in'}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {(session as any)?.user?.roles?.[0]?.key?.replace(/_/g, ' ') || 'MEMBER'}
                    </p>
                  </div>
                  <div className="h-12 w-px bg-neutral-700"></div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-button text-sm font-semibold hover:bg-white hover:text-neutral-900 transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              </div>

              <div className="text-right">
                <h1 className="text-3xl font-bold mb-1">Analytics Dashboard</h1>
                <p className="text-neutral-300 text-sm">Performance metrics and insights for your communication hub</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <a href="/admin/communication-hub">
                <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                  router.asPath?.startsWith('/admin/communication-hub')
                    ? 'bg-white text-neutral-900'
                    : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
                }`}>
                  💬 Communication Hub
                </button>
              </a>
              <a href="/admin/templates">
                <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                  router.asPath?.startsWith('/admin/templates')
                    ? 'bg-white text-neutral-900'
                    : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
                }`}>
                  📝 Templates
                </button>
              </a>
              <a href="/admin/analytics">
                <button className={`px-6 py-2 rounded-button font-semibold transition-all ${
                  router.asPath?.startsWith('/admin/analytics')
                    ? 'bg-white text-neutral-900'
                    : 'bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900'
                }`}>
                  📊 Analytics
                </button>
              </a>
              <a href="/admin">
                <button className="px-6 py-2 rounded-button font-semibold transition-all bg-white/10 border border-white/20 text-white hover:bg-white hover:text-neutral-900">
                  ← Admin Dashboard
                </button>
              </a>
            </div>
          </Container>
        </section>
        
        <Container>
          <div className="py-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                {/* Title removed - already in header */}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => exportData('csv')}
                >
                  Export CSV
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => exportData('json')}
                >
                  Export JSON
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card variant="default" padding="lg" className="mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Property</label>
                  <select
                    value={filters.propertyId}
                    onChange={(e) => setFilters({...filters, propertyId: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                  >
                    <option value="">All Properties</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id.toString()}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="primary"
                    onClick={loadAnalytics}
                    className="w-full"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </Card>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card variant="default" padding="lg">
                <div className="text-sm text-neutral-600 mb-1">Total Conversations</div>
                <div className="text-3xl font-bold text-neutral-900">
                  {analytics.overview.totalConversations}
                </div>
              </Card>
              <Card variant="default" padding="lg">
                <div className="text-sm text-neutral-600 mb-1">Avg Response Time</div>
                <div className="text-3xl font-bold text-neutral-900">
                  {analytics.performance.avgResponseTime.toFixed(1)}m
                </div>
                <div className="text-xs text-neutral-500 mt-1">Target: 5m</div>
              </Card>
              <Card variant="default" padding="lg">
                <div className="text-sm text-neutral-600 mb-1">Avg Resolution Time</div>
                <div className="text-3xl font-bold text-neutral-900">
                  {analytics.performance.avgResolutionTime.toFixed(1)}m
                </div>
              </Card>
              <Card variant="default" padding="lg">
                <div className="text-sm text-neutral-600 mb-1">SLA Breach Rate</div>
                <div className="text-3xl font-bold text-neutral-900">
                  {analytics.performance.slaBreachRate.toFixed(1)}%
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  {analytics.performance.slaBreachedCount} breached
                </div>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Status Breakdown */}
              <Card variant="default" padding="lg">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Conversations by Status</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.overview.byStatus).map(([status, count]) => {
                    const percentage = analytics.overview.totalConversations > 0
                      ? (count / analytics.overview.totalConversations) * 100
                      : 0;
                    return (
                      <div key={status}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-neutral-700">
                            {status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm text-neutral-600">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2">
                          <div
                            className="bg-neutral-900 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Channel Breakdown */}
              <Card variant="default" padding="lg">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Conversations by Channel</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.overview.channelBreakdown).map(([channel, count]) => {
                    const total = Object.values(analytics.overview.channelBreakdown).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={channel}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-neutral-700">
                            {channel === 'WHATSAPP' ? '💬 WhatsApp' :
                             channel === 'EMAIL' ? '📧 Email' :
                             channel === 'SMS' ? '📱 SMS' :
                             channel === 'VOICE' ? '📞 Voice' : channel}
                          </span>
                          <span className="text-sm text-neutral-600">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Trends Chart */}
            <Card variant="default" padding="lg" className="mb-6">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">Conversations Over Time</h3>
              <div className="h-64 flex items-end gap-1">
                {dailyStatsArray.map(({ date, count }) => (
                  <div
                    key={date}
                    className="flex-1 bg-neutral-900 rounded-t hover:bg-neutral-700 transition-colors relative group"
                    style={{ height: `${(count / maxDailyCount) * 100}%` }}
                    title={`${date}: ${count} conversations`}
                  >
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-neutral-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {date}: {count}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-neutral-500 text-center">
                {dailyStatsArray.length > 0 && (
                  <>
                    {new Date(dailyStatsArray[0].date).toLocaleDateString()} - {new Date(dailyStatsArray[dailyStatsArray.length - 1].date).toLocaleDateString()}
                  </>
                )}
              </div>
            </Card>

            {/* Top Assignees */}
            <Card variant="default" padding="lg" className="mb-6">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">Top Assignees</h3>
              <div className="space-y-3">
                {analytics.topAssignees.length === 0 ? (
                  <p className="text-neutral-500 text-center py-4">No assigned conversations</p>
                ) : (
                  analytics.topAssignees.map((assignee, index) => (
                    <div key={assignee.userId} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-900">{assignee.userName}</div>
                          <div className="text-sm text-neutral-600">{assignee.userEmail}</div>
                        </div>
                      </div>
                      <Badge variant="neutral" size="sm">
                        {assignee.count} conversations
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card variant="default" padding="lg">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Response Metrics</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-neutral-600">Responded</div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {analytics.performance.respondedCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600">Avg Response Time</div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {analytics.performance.avgResponseTime.toFixed(1)} minutes
                    </div>
                  </div>
                </div>
              </Card>

              <Card variant="default" padding="lg">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Resolution Metrics</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-neutral-600">Resolved</div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {analytics.performance.resolvedCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600">Avg Resolution Time</div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {analytics.performance.avgResolutionTime.toFixed(1)} minutes
                    </div>
                  </div>
                </div>
              </Card>

              <Card variant="default" padding="lg">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">SLA Performance</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-neutral-600">SLA Breach Rate</div>
                    <div className={`text-2xl font-bold ${
                      analytics.performance.slaBreachRate > 10 ? 'text-red-600' :
                      analytics.performance.slaBreachRate > 5 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {analytics.performance.slaBreachRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600">Breached Conversations</div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {analytics.performance.slaBreachedCount}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Container>
        
        <Footer />
      </div>
    </>
  );
}

