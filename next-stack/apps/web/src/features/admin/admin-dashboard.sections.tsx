import type { AdminDashboardResponse } from './api';
import type { DashboardSummary, DashboardWorkQueueItem } from './admin-dashboard.helpers';
import {
  AdminDashboardActivityPanel,
  AdminDashboardAdvancedPanel,
  AdminDashboardMetricsPanel,
  AdminDashboardPrimaryModulesPanel,
  AdminDashboardQuickActionsPanel,
  AdminDashboardSummaryPanel,
  AdminDashboardWorkQueuePanel,
} from './admin-dashboard-panels';

export function AdminDashboardQuickActionsSection() {
  return <AdminDashboardQuickActionsPanel />;
}

export function AdminDashboardPrimaryModulesSection() {
  return <AdminDashboardPrimaryModulesPanel />;
}

export function AdminDashboardSummarySection(props: {
  loading: boolean;
  summary: DashboardSummary | null;
}) {
  return <AdminDashboardSummaryPanel {...props} />;
}

export function AdminDashboardWorkQueueSection(props: {
  loading: boolean;
  workQueue: DashboardWorkQueueItem[];
}) {
  return <AdminDashboardWorkQueuePanel {...props} />;
}

export function AdminDashboardMetricsSection(props: {
  loading: boolean;
  summary: DashboardSummary | null;
}) {
  return <AdminDashboardMetricsPanel {...props} />;
}

export function AdminDashboardActivitySection(props: {
  orders: AdminDashboardResponse['recent']['orders'];
  repairs: AdminDashboardResponse['recent']['repairs'];
}) {
  return <AdminDashboardActivityPanel {...props} />;
}

export function AdminDashboardAdvancedSection() {
  return <AdminDashboardAdvancedPanel />;
}
