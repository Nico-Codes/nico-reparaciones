import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  buildDashboardSummary,
  buildDashboardWorkQueue,
  formatDashboardGeneratedAt,
} from './admin-dashboard.helpers';
import {
  AdminDashboardActivitySection,
  AdminDashboardAdvancedSection,
  AdminDashboardMetricsSection,
  AdminDashboardPrimaryModulesSection,
  AdminDashboardQuickActionsSection,
  AdminDashboardSummarySection,
  AdminDashboardWorkQueueSection,
} from './admin-dashboard.sections';
import { adminApi, type AdminDashboardResponse } from './api';

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');
      try {
        const response = await adminApi.dashboard();
        if (!mounted) return;
        setData(response);
      } catch (cause) {
        if (!mounted) return;
        setError(cause instanceof Error ? cause.message : 'No se pudo cargar el dashboard.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => (data ? buildDashboardSummary(data) : null), [data]);
  const workQueue = useMemo(() => (summary ? buildDashboardWorkQueue(summary) : []), [summary]);

  return (
    <PageShell context="admin" className="space-y-6" data-admin-dashboard-page>
      <PageHeader
        context="admin"
        eyebrow="Panel operativo"
        title="Centro de trabajo"
        subtitle="Lo urgente primero: crea, segui y resolve reparaciones, pedidos y stock desde una sola vista."
        actions={data ? <StatusBadge tone="info" label={`Actualizado ${formatDashboardGeneratedAt(data.generatedAt)}`} /> : undefined}
      />

      {error ? (
        <div className="ui-alert ui-alert--danger" data-reveal>
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No se pudo cargar el dashboard</span>
            <div className="ui-alert__text">{error}</div>
          </div>
        </div>
      ) : null}

      <AdminDashboardQuickActionsSection />
      <AdminDashboardPrimaryModulesSection />
      <AdminDashboardSummarySection loading={loading} summary={summary} />

      <div className="grid gap-4 xl:grid-cols-[1.5fr,1fr]">
        <AdminDashboardWorkQueueSection loading={loading} workQueue={workQueue} />
        <AdminDashboardMetricsSection loading={loading} summary={summary} />
      </div>

      <AdminDashboardActivitySection
        orders={data?.recent.orders ?? []}
        repairs={data?.recent.repairs ?? []}
      />

      <AdminDashboardAdvancedSection />
    </PageShell>
  );
}
