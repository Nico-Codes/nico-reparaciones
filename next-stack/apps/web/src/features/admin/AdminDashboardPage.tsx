import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Boxes, ClipboardList, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminApi, type AdminDashboardResponse } from './api';

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.dashboard();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const cards = useMemo(() => {
    if (!data) return [];
    return [
      { label: 'Pedidos pendientes', value: data.metrics.orders.pendingFlow, icon: ClipboardList, tone: 'sky' },
      { label: 'Reparaciones abiertas', value: data.metrics.repairs.open, icon: Wrench, tone: 'emerald' },
      { label: 'Stock bajo', value: data.metrics.products.lowStock, icon: Boxes, tone: 'amber' },
      { label: 'Sin stock', value: data.metrics.products.outOfStock, icon: AlertTriangle, tone: 'rose' },
    ] as const;
  }, [data]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Admin Dashboard (Next)</h1>
            <p className="mt-1 text-sm text-zinc-600">Resumen operativo del negocio y accesos a módulos migrados.</p>
          </div>
          <Button variant="outline" onClick={() => void load()}>
            Actualizar
          </Button>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {loading || !data
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
              ))
            : cards.map((card) => (
                <MetricCard key={card.label} {...card} />
              ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">Accesos rápidos</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <QuickLink to="/admin/orders" title="Pedidos" desc="Ver pedidos y cambiar estados" />
              <QuickLink to="/admin/repairs" title="Reparaciones" desc="Alta rápida y seguimiento" />
              <QuickLink to="/admin/products" title="Productos" desc="Stock, precio, activos, destacados" />
              <QuickLink to="/admin/users" title="Usuarios" desc="Roles y verificación de cuentas" />
              <QuickLink to="/admin/device-catalog" title="Catálogo dispositivos" desc="Marcas, modelos y fallas" />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Pedidos hoy" value={String(data?.metrics.orders.createdToday ?? 0)} />
              <MiniStat label="Reparaciones hoy" value={String(data?.metrics.repairs.createdToday ?? 0)} />
              <MiniStat label="Venta mensual" value={`$${(data?.metrics.orders.revenueMonth ?? 0).toLocaleString('es-AR')}`} />
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">Alertas</h2>
            <div className="mt-3 space-y-2">
              {!data || data.alerts.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">Sin alertas relevantes.</div>
              ) : (
                data.alerts.map((a) => (
                  <div key={a.id} className={`rounded-xl border p-3 text-sm ${alertClasses(a.severity)}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{a.title}</span>
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-black">{a.value}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">Últimos pedidos</h2>
            <div className="mt-3 space-y-2">
              {loading || !data ? (
                <div className="rounded-xl border border-zinc-200 p-3 text-sm">Cargando...</div>
              ) : data.recent.orders.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 p-3 text-sm">Sin pedidos todavía.</div>
              ) : (
                data.recent.orders.map((o) => (
                  <div key={o.id} className="rounded-xl border border-zinc-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-zinc-900">{o.user?.name || 'Sin usuario'} · ${o.total.toLocaleString('es-AR')}</div>
                        <div className="truncate text-xs text-zinc-500">{o.id}</div>
                        <div className="mt-1 truncate text-xs text-zinc-500">
                          {o.itemsPreview.map((i) => `${i.name} x${i.quantity}`).join(' · ')}
                        </div>
                      </div>
                      <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700">{o.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">Últimas reparaciones</h2>
            <div className="mt-3 space-y-2">
              {loading || !data ? (
                <div className="rounded-xl border border-zinc-200 p-3 text-sm">Cargando...</div>
              ) : data.recent.repairs.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 p-3 text-sm">Sin reparaciones todavía.</div>
              ) : (
                data.recent.repairs.map((r) => (
                  <div key={r.id} className="rounded-xl border border-zinc-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-zinc-900">{r.customerName}</div>
                        <div className="truncate text-xs text-zinc-500">
                          {[r.deviceBrand, r.deviceModel, r.issueLabel].filter(Boolean).join(' · ') || 'Sin detalle'}
                        </div>
                        <div className="truncate text-xs text-zinc-500">{r.id}</div>
                      </div>
                      <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700">{r.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'sky' | 'emerald' | 'amber' | 'rose';
}) {
  const tones = {
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  } as const;
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide opacity-80">{label}</div>
          <div className="mt-2 text-2xl font-black">{value.toLocaleString('es-AR')}</div>
        </div>
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 transition hover:border-zinc-300 hover:bg-white">
      <div className="text-sm font-black text-zinc-900">{title}</div>
      <div className="mt-1 text-xs text-zinc-600">{desc}</div>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-black text-zinc-900">{value}</div>
    </div>
  );
}

function alertClasses(severity: 'low' | 'medium' | 'high') {
  if (severity === 'high') return 'border-rose-200 bg-rose-50 text-rose-900';
  if (severity === 'medium') return 'border-amber-200 bg-amber-50 text-amber-900';
  return 'border-sky-200 bg-sky-50 text-sky-900';
}
