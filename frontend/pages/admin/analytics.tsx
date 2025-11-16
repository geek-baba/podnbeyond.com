import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/useAuth';
import { useRouter } from 'next/router';
import AdminShell, { BreadcrumbItem } from '../../components/layout/AdminShell';
import PageHeader from '../../components/layout/PageHeader';
import Container from '../../components/layout/Container';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DateRangePicker from '../../components/ui/DateRangePicker';
import FormField from '../../components/ui/FormField';

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
    viewBy: 'last30days' as 'last7days' | 'last30days' | 'last3months' | 'lastyear' | 'custom', // View by preset or custom
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

  // Load properties on mount
  useEffect(() => {
    if (authStatus === 'authenticated') {
      loadProperties();
    }
  }, [authStatus]);

  // Load analytics when filters change
  useEffect(() => {
    if (authStatus === 'authenticated') {
      loadAnalytics();
    }
  }, [authStatus, filters.viewBy, filters.startDate, filters.endDate, filters.propertyId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range and time period based on viewBy
      let startDate = filters.startDate;
      let endDate = filters.endDate;
      let timePeriod: 'day' | 'week' | 'month' | 'year' = 'day';
      
      if (filters.viewBy === 'last7days') {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        timePeriod = 'day';
      } else if (filters.viewBy === 'last30days') {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        timePeriod = 'day';
      } else if (filters.viewBy === 'last3months') {
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        timePeriod = 'week';
      } else if (filters.viewBy === 'lastyear') {
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        timePeriod = 'month';
      } else {
        // Custom date range - determine time period based on range
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 7) {
          timePeriod = 'day';
        } else if (daysDiff <= 90) {
          timePeriod = 'week';
        } else if (daysDiff <= 365) {
          timePeriod = 'month';
        } else {
          timePeriod = 'year';
        }
      }
      
      const params = new URLSearchParams();
      // Pass userId with fallbacks (same as communication-hub.tsx)
      const userId = session?.user?.id || session?.user?.email;
      if (!userId) {
        console.error('No user ID found in session:', session);
        alert('Failed to load analytics: User session not found. Please log in again.');
        setLoading(false);
        return;
      }
      params.append('userId', userId);
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      params.append('timePeriod', timePeriod);
      if (filters.propertyId) params.append('propertyId', filters.propertyId);

      const response = await fetch(`/api/analytics/conversations?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
        console.error('Analytics API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Analytics API response:', data); // Debug log
      console.log('Analytics performance data:', data.analytics?.performance); // Debug performance metrics
      
      if (!data.success) {
        console.error('Analytics API returned success: false:', data);
        throw new Error(data.error || data.details || 'Unknown error from analytics API');
      }
      
      if (data.analytics) {
        console.log('Setting analytics data:', {
          totalConversations: data.analytics.overview?.totalConversations,
          avgResponseTime: data.analytics.performance?.avgResponseTime,
          avgResolutionTime: data.analytics.performance?.avgResolutionTime,
          respondedCount: data.analytics.performance?.respondedCount,
          resolvedCount: data.analytics.performance?.resolvedCount,
        });
        setAnalytics(data.analytics);
      } else {
        console.error('Analytics API response missing analytics data:', data);
        throw new Error('Analytics API response missing analytics data');
      }
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      const errorMessage = error.message || 'Failed to fetch analytics';
      alert(`Failed to load analytics: ${errorMessage}\n\nCheck browser console for more details.`);
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
      params.append('userId', session?.user?.id || session?.user?.email || '');
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.propertyId) params.append('propertyId', filters.propertyId);

      const response = await fetch(`/api/analytics/export?${params.toString()}&format=${format}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
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

  // Prepare chart data - sort by date and format
  const dailyStatsArray = Object.entries(analytics?.trends?.dailyStats || {})
    .map(([date, count]) => ({ date, count: count as number }))
    .sort((a, b) => {
      // Sort by date string (works for YYYY-MM-DD, YYYY-MM, YYYY, and "Week of..." formats)
      return a.date.localeCompare(b.date);
    });
  const maxDailyCount = dailyStatsArray.length > 0 ? Math.max(...dailyStatsArray.map(d => d.count), 1) : 1;

  return (
    <AdminShell
      title="Analytics | POD N BEYOND Admin"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Analytics' },
      ]}
    >
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Performance metrics and insights for your communication hub"
        secondaryActions={
          <>
            <a href="/admin/communication-hub">
              <Button variant="secondary" size="sm">Communication Hub</Button>
            </a>
            <a href="/admin/templates">
              <Button variant="secondary" size="sm">Templates</Button>
            </a>
          </>
        }
      />

      <Container>
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
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">View By</label>
                  <select
                    value={filters.viewBy}
                    onChange={(e) => {
                      const newViewBy = e.target.value as 'last7days' | 'last30days' | 'last3months' | 'lastyear' | 'custom';
                      setFilters({...filters, viewBy: newViewBy});
                      if (newViewBy !== 'custom') {
                        // Auto-apply when preset is selected
                        setTimeout(() => loadAnalytics(), 100);
                      }
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                  >
                    <option value="last7days">Last 7 Days (Daily)</option>
                    <option value="last30days">Last 30 Days (Daily)</option>
                    <option value="last3months">Last 3 Months (Weekly)</option>
                    <option value="lastyear">Last Year (Monthly)</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>
                {filters.viewBy === 'custom' && (
                  <div className="sm:col-span-2">
                    <FormField label="Date Range">
                      <DateRangePicker
                        value={[filters.startDate, filters.endDate]}
                        onChange={([start, end]) => {
                          setFilters({
                            ...filters,
                            startDate: start || filters.startDate,
                            endDate: end || filters.endDate,
                          });
                        }}
                        startPlaceholder="Start Date"
                        endPlaceholder="End Date"
                        variant="separate"
                        enforceRange={true}
                      />
                    </FormField>
                  </div>
                )}
                <div className={filters.viewBy === 'custom' ? '' : 'sm:col-span-2'}>
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
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  variant="primary"
                  onClick={loadAnalytics}
                >
                  Apply Filters
                </Button>
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
              {dailyStatsArray.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-neutral-500">
                  <p>No conversation data for the selected date range</p>
                </div>
              ) : (
                <>
                  <div className="h-64 flex items-end gap-2 bg-white p-4 rounded-lg border border-neutral-200">
                    {dailyStatsArray.length === 0 ? (
                      <div className="w-full h-full flex items-center justify-center text-neutral-500">
                        <p>No data for selected period</p>
                      </div>
                    ) : (
                      dailyStatsArray.map(({ date, count }) => {
                        const barHeight = maxDailyCount > 0 ? Math.max((count / maxDailyCount) * 100, 5) : 5;
                        const formatDateLabel = (dateStr: string) => {
                          if (dateStr.startsWith('Week of ')) {
                            const weekDate = dateStr.replace('Week of ', '');
                            try {
                              return new Date(weekDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            } catch {
                              return weekDate;
                            }
                          }
                          if (dateStr.match(/^\d{4}-\d{2}$/)) {
                            // Month format YYYY-MM
                            const [year, month] = dateStr.split('-');
                            return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                          }
                          if (dateStr.match(/^\d{4}$/)) {
                            // Year format
                            return dateStr;
                          }
                          // Day format YYYY-MM-DD
                          try {
                            return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          } catch {
                            return dateStr;
                          }
                        };
                        return (
                          <div
                            key={date}
                            className="flex-1 bg-neutral-900 rounded-t hover:bg-neutral-700 transition-colors relative group flex flex-col justify-end"
                            style={{ 
                              height: `${barHeight}%`,
                              minHeight: '8px' // Ensure bars are always visible
                            }}
                            title={`${date}: ${count} ${count === 1 ? 'conversation' : 'conversations'}`}
                          >
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-neutral-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 shadow-lg">
                              {date}: {count} {count === 1 ? 'conversation' : 'conversations'}
                            </div>
                            {/* Bar label at bottom */}
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-neutral-600 whitespace-nowrap">
                              {formatDateLabel(date)}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="mt-10 text-xs text-neutral-500 text-center">
                    {dailyStatsArray.length > 0 && (
                      <>
                        {dailyStatsArray[0].date} - {dailyStatsArray[dailyStatsArray.length - 1].date}
                        {' '}({dailyStatsArray.reduce((sum, d) => sum + d.count, 0)} conversations)
                      </>
                    )}
                  </div>
                </>
              )}
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
    </AdminShell>
  );
}

