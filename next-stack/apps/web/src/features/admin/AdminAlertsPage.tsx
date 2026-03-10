import { useEffect, useMemo, useState } from 'react';
import { BellRing, CheckCheck, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { adminApi, type AdminDashboardResponse } from './api';

type AlertViewState = Record<string, boolean>;
type BadgeTone = 'info' | 'warning' | 'danger';

function alertTargetTo(alertId: string) {
  if (alertId.includes('stock')) return '/admin/productos';
  if (alertId.includes('repair')) return '/admin/repairs';
  if (alertId.includes('order') || alertId.includes('flow')) return '/admin/orders';
  return '/admin';
}

function severityTone(severity: 'low' | 'medium' | 'high'): BadgeTone {
  if (severity === 'high') return 'danger';
  if (severity === 'medium') return 'warning';
  return 'info';
}

function severityLabel(severity: 'low' | 'medium' | 'high') {
  if (severity === 'high') return 'Alta';
  if (severity === 'medium') return 'Media';
  return 'Baja';
}

function alertTitleFriendly(alert: AdminDashboardResponse['alerts'][number]) {
  if (alert.id.includes('stock')) return 'Stock bajo';
  if (alert.id.includes('repair')) return 'Reparaciones pendientes';
  if (alert.id.includes('order') || alert.id.includes('flow')) return 'Pedidos pendientes';
  return alert.title;
}

function alertDescription(alert: AdminDashboardResponse['alerts'][number]) {
  if (alert.id.includes('stock')) return 'Productos con stock menor o igual a 3 unidades.';
  if (alert.id.includes('repair')) return 'Revisá reparaciones demoradas o listas para retiro.';
  if (alert.id.includes('order') || alert.id.includes('flow')) return 'Pedidos pendientes, confirmados o preparando que requieren seguimiento.';
  return 'Revisá y resolvé este pendiente operativo.';
}

export function AdminAlertsPage() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seen, setSeen] = useState<AlertViewState>({});

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await adminApi.dashboard();
        if (!mounted) return;
        setData(response);
      } catch (cause) {
        if (!mounted) return;
        setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las alertas.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const alerts = useMemo(() => (data?.alerts ?? []).filter((alert) => alert.value > 0), [data]);
  const unseenCount = useMemo(() => alerts.filter((alert) => !seen[alert.id]).length, [alerts, seen]);
  const highSeverityCount = useMemo(() => alerts.filter((alert) => alert.severity === 'high').length, [alerts]);

  return (
    <PageShell context="admin" className="space-y-6">
      <PageHeader
        context="admin"
        eyebrow="Operación"
        title="Centro de alertas"
        subtitle="Pendientes operativos priorizados para que el equipo pueda actuar rápido y sin ruido visual innecesario."
        actions={(
          <>
            <StatusBadge tone={unseenCount > 0 ? 'warning' : 'success'} label={unseenCount > 0 ? `${unseenCount} sin revisar` : 'Todo revisado'} />
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">Volver al panel</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSeen(Object.fromEntries(alerts.map((alert) => [alert.id, true])))}
              disabled={!alerts.length}
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todo como visto
            </Button>
          </>
        )}
      />

      <section className="nr-stat-grid" data-reveal>
        <MetricCard label="Alertas activas" value={String(alerts.length)} meta="Pendientes visibles con impacto operativo" />
        <MetricCard label="Pendientes de revisión" value={String(unseenCount)} meta="Alertas todavía no marcadas como vistas" />
        <MetricCard label="Alta prioridad" value={String(highSeverityCount)} meta="Casos que conviene resolver primero" />
        <MetricCard label="Estado general" value={alerts.length === 0 ? 'OK' : 'Atención'} meta={alerts.length === 0 ? 'No hay alertas activas en este momento' : 'Hay tareas pendientes para revisar'} />
      </section>

      <SectionCard
        title="Alertas operativas"
        description="Cada alerta te lleva directo al módulo correspondiente para resolverla sin pasar por varias pantallas."
        actions={<StatusBadge tone={alerts.length === 0 ? 'success' : 'danger'} size="sm" label={alerts.length === 0 ? 'Sin pendientes' : `${alerts.length} activas`} />}
      >
        {error ? (
          <div className="ui-alert ui-alert--danger mb-4">
            <ShieldAlert className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <span className="ui-alert__title">No se pudieron cargar las alertas.</span>
              <div className="ui-alert__text">{error}</div>
            </div>
          </div>
        ) : null}

        <div className="admin-collection">
          {loading ? (
            <SectionCard tone="muted" bodyClassName="space-y-3">
              <LoadingBlock label="Cargando alertas" lines={4} />
            </SectionCard>
          ) : alerts.length === 0 ? (
            <EmptyState
              icon={<BellRing className="h-5 w-5" />}
              title="No hay alertas activas"
              description="El panel no detectó pendientes de stock, pedidos o reparaciones en este momento."
            />
          ) : (
            alerts.map((alert) => {
              const isSeen = Boolean(seen[alert.id]);
              return (
                <article key={alert.id} className={`admin-entity-row ${!isSeen ? 'is-active' : ''}`}>
                  <div className="admin-entity-row__top">
                    <div className="admin-entity-row__heading">
                      <div className="admin-entity-row__title-row">
                        <div className="admin-entity-row__title">{alertTitleFriendly(alert)}</div>
                        <StatusBadge tone={severityTone(alert.severity)} size="sm" label={`Prioridad ${severityLabel(alert.severity)}`} />
                        {!isSeen ? <StatusBadge tone="warning" size="sm" label="Nueva" /> : null}
                      </div>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">{alertDescription(alert)}</p>
                    </div>
                    <div className="admin-entity-row__aside">
                      <span className="admin-entity-row__eyebrow">Pendientes</span>
                      <div className="admin-entity-row__value">{alert.value}</div>
                    </div>
                  </div>

                  <div className="admin-entity-row__actions">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={isSeen ? 'neutral' : 'accent'} size="sm" label={isSeen ? 'Vista' : 'Sin revisar'} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={alertTargetTo(alert.id)}>Abrir módulo</Link>
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setSeen((current) => ({ ...current, [alert.id]: true }))}>
                        Marcar como vista
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}

function MetricCard({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <article className="nr-stat-card">
      <div className="nr-stat-card__label">{label}</div>
      <div className="nr-stat-card__value">{value}</div>
      <div className="nr-stat-card__meta">{meta}</div>
    </article>
  );
}
