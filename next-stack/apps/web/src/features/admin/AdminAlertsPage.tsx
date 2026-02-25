import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, type AdminDashboardResponse } from './api';

type AlertViewState = Record<string, boolean>;

function alertTargetTo(alertId: string) {
  if (alertId.includes('stock')) return '/admin/products';
  if (alertId.includes('repair')) return '/admin/repairs';
  if (alertId.includes('order') || alertId.includes('flow')) return '/admin/orders';
  return '/admin';
}

function severityBadgeClass(severity: 'low' | 'medium' | 'high') {
  if (severity === 'high') return 'badge-rose';
  if (severity === 'medium') return 'badge-amber';
  return 'badge-sky';
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
  if (alert.id.includes('stock')) return 'Productos con stock menor o igual a 3.';
  if (alert.id.includes('repair')) return 'Revisá reparaciones listas para retiro o demoradas.';
  if (alert.id.includes('order') || alert.id.includes('flow')) return 'Pedidos pendientes/confirmados/preparando para revisar.';
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
        const res = await adminApi.dashboard();
        if (!mounted) return;
        setData(res);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Error cargando alertas');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const alerts = useMemo(() => (data?.alerts ?? []).filter((a) => a.value > 0), [data]);
  const unseenCount = useMemo(() => alerts.filter((a) => !seen[a.id]).length, [alerts, seen]);
  const activeCount = alerts.length;

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Centro de alertas</h1>
            <p className="mt-1 text-sm text-zinc-600">Seguimiento rapido de pendientes operativos.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">Volver al panel</Link>
            <button
              type="button"
              onClick={() => setSeen((prev) => Object.fromEntries(alerts.map((a) => [a.id, true])) as AlertViewState)}
              className="btn-ghost !h-10 !rounded-xl px-4 text-sm font-bold"
            >
              Marcar todas vistas
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="card">
          <div className="card-body">
            <div className="text-xs font-black uppercase tracking-wide text-zinc-500">Alertas activas</div>
            <div className="mt-2 text-4xl font-black tracking-tight text-zinc-900">{loading ? '—' : activeCount}</div>
          </div>
        </section>
        <section className="card">
          <div className="card-body">
            <div className="text-xs font-black uppercase tracking-wide text-zinc-500">No vistas</div>
            <div className="mt-2 text-4xl font-black tracking-tight text-rose-700">{loading ? '—' : unseenCount}</div>
          </div>
        </section>
        <section className="card">
          <div className="card-body">
            <div className="text-xs font-black uppercase tracking-wide text-zinc-500">Estado</div>
            <p className="mt-2 text-base font-bold text-zinc-700">Revisa y marca como vistas las alertas atendidas.</p>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head flex items-center justify-between gap-2">
          <div className="text-xl font-black tracking-tight text-zinc-900">Alertas</div>
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 px-2 text-xs font-black text-zinc-700">
            {loading ? '—' : activeCount}
          </span>
        </div>
        <div className="card-body space-y-3">
          {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}
          {!loading && !error && alerts.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">Sin alertas activas. Todo ok.</div>
          ) : null}
          {loading ? (
            <div className="h-20 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50" />
          ) : null}
          {alerts.map((alert) => {
            const isSeen = Boolean(seen[alert.id]);
            return (
              <div key={alert.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-xl font-black tracking-tight text-zinc-900">{alertTitleFriendly(alert)}</div>
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-2 text-xs font-black text-rose-700">
                      {alert.value}
                    </span>
                    <span className={severityBadgeClass(alert.severity)}>{severityLabel(alert.severity)}</span>
                    {!isSeen ? <span className="badge-amber">Nueva</span> : null}
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{alertDescription(alert)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={alertTargetTo(alert.id)} className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
                    Abrir
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSeen((prev) => ({ ...prev, [alert.id]: true }))}
                    className="btn-ghost !h-10 !rounded-xl px-4 text-sm font-bold"
                  >
                    Marcar vista
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
