import React from 'react';
import {
  TodayArrivalsCard,
  TodayDeparturesCard,
  InHouseGuestsCard,
  OccupancyCard,
  PendingApprovalsCard,
  LoyaltyRequestsCard,
  CommHubOpenThreadsCard,
  RecentBookingsTable,
  RecentLoyaltyMembersList,
  SystemStatusCard,
  IntegrationsOverviewCard,
  QuickActionsCard,
} from '@/components/dashboard';

export type DashboardSection =
  | 'today'
  | 'queues'
  | 'recent'
  | 'system'
  | 'quickActions';

export type DashboardWidgetDefinition = {
  id: string;
  section: DashboardSection;
  title: string;
  description?: string;
  requiredPermissions: string[];
  render: () => JSX.Element;
};

export type RoleWidgetConfig = {
  role: string;
  enabledWidgetIds: string[];
};

/**
 * Check if widget is enabled for a specific role
 * Phase 11: Always returns true (all widgets enabled if permissions allow)
 * Phase 12: Will check DB-backed role widget config
 */
export function isWidgetEnabledForRole(widgetId: string, role?: string): boolean {
  // Phase 11: Always true - permission gating handles visibility
  // Phase 12: Check role-specific widget config from DB
  return true;
}

// Widget registry
export const dashboardWidgets: DashboardWidgetDefinition[] = [
  {
    id: 'today.arrivals',
    section: 'today',
    title: 'Arrivals today',
    requiredPermissions: ['bookings:read:scoped', 'bookings:*'],
    render: () => <TodayArrivalsCard />,
  },
  {
    id: 'today.departures',
    section: 'today',
    title: 'Departures today',
    requiredPermissions: ['bookings:read:scoped', 'bookings:*'],
    render: () => <TodayDeparturesCard />,
  },
  {
    id: 'today.inHouse',
    section: 'today',
    title: 'In-house guests',
    requiredPermissions: ['bookings:read:scoped', 'bookings:*'],
    render: () => <InHouseGuestsCard />,
  },
  {
    id: 'today.occupancy',
    section: 'today',
    title: 'Occupancy',
    requiredPermissions: ['bookings:read:scoped', 'bookings:*'],
    render: () => <OccupancyCard />,
  },
  {
    id: 'queues.pendingBookings',
    section: 'queues',
    title: 'Pending approvals',
    requiredPermissions: ['bookings:read:scoped', 'bookings:*'],
    render: () => <PendingApprovalsCard />,
  },
  {
    id: 'queues.loyaltyQueue',
    section: 'queues',
    title: 'Loyalty requests',
    requiredPermissions: ['loyalty:read:scoped', 'loyalty:*'],
    render: () => <LoyaltyRequestsCard />,
  },
  {
    id: 'queues.openThreads',
    section: 'queues',
    title: 'Open conversations',
    requiredPermissions: ['commhub:read:scoped', 'commhub:*'],
    render: () => <CommHubOpenThreadsCard />,
  },
  {
    id: 'recent.bookings',
    section: 'recent',
    title: 'Recent bookings',
    requiredPermissions: ['bookings:read:scoped', 'bookings:*'],
    render: () => <RecentBookingsTable />,
  },
  {
    id: 'recent.loyalty',
    section: 'recent',
    title: 'Recent loyalty members',
    requiredPermissions: ['loyalty:read:scoped', 'loyalty:*'],
    render: () => <RecentLoyaltyMembersList />,
  },
  {
    id: 'system.status',
    section: 'system',
    title: 'System status',
    requiredPermissions: ['admin:read:system', 'integrations:read:*'],
    render: () => <SystemStatusCard />,
  },
  {
    id: 'system.integrations',
    section: 'system',
    title: 'Integrations',
    requiredPermissions: ['integrations:read:*'],
    render: () => <IntegrationsOverviewCard />,
  },
  {
    id: 'quickActions.main',
    section: 'quickActions',
    title: 'Quick actions',
    requiredPermissions: ['bookings:write:scoped', 'bookings:*', 'loyalty:*', 'commhub:*'],
    render: () => <QuickActionsCard />,
  },
];

