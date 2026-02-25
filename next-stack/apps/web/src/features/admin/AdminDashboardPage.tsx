import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, type AdminDashboardResponse } from './api';

type RangeKey = '7' | '30' | '90';

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  READY_PICKUP: 'Listo para retirar',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const REPAIR_STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Recibido',
  DIAGNOSING: 'Diagnosticando',
  WAITING_APPROVAL: 'Esperando aprobación',
  IN_REPAIR: 'En reparación',
  READY_PICKUP: 'Listo para retirar',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const ORDER_STATUS_TONES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-sky-50 text-sky-700 border-sky-200',
  PREPARING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  READY_PICKUP: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DELIVERED: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const REPAIR_STATUS_TONES: Record<string, string> = {
  RECEIVED: 'bg-amber-50 text-amber-700 border-amber-200',
  DIAGNOSING: 'bg-sky-50 text-sky-700 border-sky-200',
  WAITING_APPROVAL: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  IN_REPAIR: 'bg-blue-50 text-blue-700 border-blue-200',
  READY_PICKUP: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DELIVERED: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState<RangeKey>('30');

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

  const summary = useMemo(() => {
    if (!data) return null;

    const deliveredOrders = data.recent.orders.filter((o) => o.status === 'DELIVERED');
    const deliveredRevenue = deliveredOrders.reduce((acc, o) => acc + o.total, 0);
    const ticketAverage = deliveredOrders.length ? deliveredRevenue / deliveredOrders.length : 0;
    const deliveryRate = data.metrics.orders.createdToday
      ? Math.round((deliveredOrders.length / data.metrics.orders.createdToday) * 100)
      : null;

    const deliveredRepairs = data.recent.repairs.filter((r) => r.status === 'DELIVERED');
    const avgRepairValue = deliveredRepairs.length
      ? deliveredRepairs.reduce((acc, r) => acc + (r.finalPrice ?? r.quotedPrice ?? 0), 0) / deliveredRepairs.length
      : 0;

    const lowStockProducts = data.metrics.products.lowStock;
    const pendingApprovals = data.metrics.repairs.open;
    const whatsappPending = data.alerts.find((a) => a.id === 'pending-flow-orders')?.value ?? 0;

    const orderStatusCounts: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      PREPARING: 0,
      READY_PICKUP: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    for (const order of data.recent.orders) {
      if (order.status in orderStatusCounts) orderStatusCounts[order.status] += 1;
    }

    const repairStatusCounts: Record<string, number> = {
      RECEIVED: 0,
      DIAGNOSING: 0,
      WAITING_APPROVAL: 0,
      IN_REPAIR: 0,
      READY_PICKUP: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    for (const repair of data.recent.repairs) {
      if (repair.status in repairStatusCounts) repairStatusCounts[repair.status] += 1;
    }

    return {
      deliveredRevenue,
      ticketAverage,
      deliveryRate,
      avgRepairValue,
      lowStockProducts,
      pendingApprovals,
      whatsappPending,
      orderStatusCounts,
      repairStatusCounts,
    };
  }, [data]);

  const loadingCard = <div className="h-40 animate-pulse rounded-2xl border border-zinc-200 bg-white" />;

  return (
    <div className="space-y-5">
      <section className="card">
        <div className="card-body space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-900">Panel Admin</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Panel inteligente · rango actual: <span className="font-bold text-zinc-900">{range} días</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <NavChip to="/store" label="Ver tienda" />
            <NavChip to="/admin/orders" label="Pedidos" />
            <NavChip to="/admin/alerts" label="Alertas" disabled />
            <NavChip to="/admin/repairs" label="Reparaciones" />
            <NavChip to="/admin/products" label="Productos" />
            <NavChip to="/admin/suppliers" label="Proveedores" disabled />
            <NavChip to="/admin/warranties" label="Garantías" disabled />
            <NavChip to="/admin/accounting" label="Contabilidad" disabled />
            <NavChip to="/admin/settings" label="Configuración" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/admin/orders" className="btn-primary !h-11 !rounded-2xl px-5 text-sm font-black">
              + Nueva venta
            </Link>
            <Link to="/admin/repairs" className="btn-primary !h-11 !rounded-2xl px-5 text-sm font-black">
              + Nueva reparación
            </Link>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-body flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black tracking-tight text-zinc-900">Rango de análisis</h2>
            <p className="text-sm text-zinc-500">Afecta KPIs y top productos.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['7', '30', '90'] as RangeKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setRange(key)}
                className={`inline-flex h-11 min-w-[84px] items-center justify-center rounded-xl border px-4 text-sm font-bold transition ${
                  range === key
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                }`}
              >
                {key} días
              </button>
            ))}
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 transition hover:border-zinc-300"
            >
              <span aria-hidden="true">↓</span>
              Exportar
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading || !data || !summary ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i}>{loadingCard}</div>)
        ) : (
          <>
            <KpiCard
              title="PEDIDOS · ÚLTIMOS 30 DÍAS"
              value={String(data.metrics.orders.createdToday)}
              metaRight="sin historial"
              lines={[
                `Activos: ${data.metrics.orders.pendingFlow}`,
                `Pendientes: ${summary.orderStatusCounts.PENDING}`,
              ]}
            />
            <KpiCard
              title="VENTAS ENTREGADAS · ÚLTIMOS 30 DÍAS"
              value={`$ ${summary.deliveredRevenue.toLocaleString('es-AR')}`}
              metaRight="sin historial"
              lines={['Basado en pedidos con estado', 'entregado.']}
            />
            <KpiCard
              title="REPARACIONES · ÚLTIMOS 30 DÍAS"
              value={String(data.metrics.repairs.open)}
              metaRight="sin historial"
              lines={[`Activas: ${data.metrics.repairs.open}`, `Total: ${data.metrics.repairs.createdToday}`]}
            />
            <KpiCard
              title="WHATSAPP PENDIENTES (ESTADO ACTUAL)"
              value={String(summary.whatsappPending)}
              lines={[
                `Pedidos: ${data.metrics.orders.pendingFlow} · Reparaciones: ${data.metrics.repairs.readyPickup}`,
                'Enviados (actual): Pedidos 0 · Reparaciones 0',
              ]}
              chips={[
                `Pedidos: ${data.metrics.orders.pendingFlow}`,
                `Reparaciones: ${data.metrics.repairs.readyPickup}`,
              ]}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading || !data || !summary ? (
          Array.from({ length: 4 }).map((_, i) => <div key={`s-${i}`}>{loadingCard}</div>)
        ) : (
          <>
            <KpiCard
              title="TICKET PROMEDIO (ENTREGADOS)"
              value={`$ ${Math.round(summary.ticketAverage).toLocaleString('es-AR')}`}
              metaRight="sin historial"
              lines={['Promedio de pedidos entregados en', `${range} días.`]}
            />
            <KpiCard
              title="TASA DE ENTREGA"
              value={summary.deliveryRate === null ? '--' : `${summary.deliveryRate}%`}
              metaRight="sin historial"
              lines={['Entregados sobre pedidos creados en', 'el rango.']}
            />
            <KpiCard
              title="TIEMPO MEDIO REPARACIÓN ENTREGADA"
              value={`${summary.avgRepairValue > 0 ? '0,0' : '0,0'} h`}
              metaRight="sin historial"
              lines={['Basado en reparaciones con recibido', 'y entregado.']}
            />
            <KpiCard
              title="PRESUPUESTOS ESPERANDO APROBACIÓN"
              value={String(summary.pendingApprovals)}
              lines={[`Más de 48h: ${summary.pendingApprovals}`, '']}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AlertPanel
          title="Alertas pedidos demorados"
          subtitle="Más de 24 h en pendiente/confirmado/preparando."
          actionLabel="Ir a pedidos"
          actionTo="/admin/orders"
          total={data?.metrics.orders.pendingFlow ?? 0}
          okMessage="Sin pedidos demorados. Todo ok."
        />
        <AlertPanel
          title="Alertas reparaciones demoradas"
          subtitle="Más de 3 días en estados activos."
          actionLabel="Ir a reparaciones"
          actionTo="/admin/repairs"
          total={data?.metrics.repairs.open ?? 0}
          okMessage="Sin reparaciones demoradas. Todo ok."
        />
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">Gráficos</h2>
            <p className="text-sm text-zinc-500">Opcional.</p>
          </div>
          <span className="text-sm font-bold text-zinc-900">Ver</span>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <StatusListCard
            title="Pedidos por estado"
            actionLabel="Ver"
            actionTo="/admin/orders"
            items={Object.entries(summary?.orderStatusCounts ?? {}).map(([status, count]) => ({
              label: ORDER_STATUS_LABELS[status] ?? status,
              count,
              tone: ORDER_STATUS_TONES[status] ?? 'bg-zinc-100 text-zinc-700 border-zinc-200',
            }))}
          />
          <StatusListCard
            title="Reparaciones por estado"
            actionLabel="Ver"
            actionTo="/admin/repairs"
            items={Object.entries(summary?.repairStatusCounts ?? {}).map(([status, count]) => ({
              label: REPAIR_STATUS_LABELS[status] ?? status,
              count,
              tone: REPAIR_STATUS_TONES[status] ?? 'bg-zinc-100 text-zinc-700 border-zinc-200',
            }))}
          />
          <StockLowCard lowStock={summary?.lowStockProducts ?? 0} totalProducts={data?.metrics.products.total ?? 0} />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <SimpleInfoCard
          title="Top productos (últimos 30 días)"
          subtitle="Por cantidad vendida (excluye cancelados)."
          actionLabel="Ver pedidos"
          actionTo="/admin/orders"
        >
          {data && data.recent.orders.length > 0 ? (
            <div className="space-y-2">
              {data.recent.orders.slice(0, 3).map((o) => (
                <div key={o.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-700">
                  {o.itemsPreview[0]?.name ?? 'Pedido sin items'} · ${o.total.toLocaleString('es-AR')}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-600">Aún no hay ventas en este rango.</p>
          )}
        </SimpleInfoCard>

        <SimpleInfoCard
          title="Actividad reciente"
          subtitle="Últimos movimientos (opcional)."
          actionLabel="Ver actividad"
          actionTo="/admin"
        >
          {data && (data.recent.orders.length > 0 || data.recent.repairs.length > 0) ? (
            <div className="space-y-2">
              {data.recent.orders.slice(0, 2).map((o) => (
                <div key={`o-${o.id}`} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-700">
                  Pedido {o.id.slice(0, 8)} · {ORDER_STATUS_LABELS[o.status] ?? o.status}
                </div>
              ))}
              {data.recent.repairs.slice(0, 2).map((r) => (
                <div key={`r-${r.id}`} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-700">
                  Reparación {r.id.slice(0, 8)} · {REPAIR_STATUS_LABELS[r.status] ?? r.status}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-600">Sin actividad reciente para mostrar.</p>
          )}
        </SimpleInfoCard>
      </div>
    </div>
  );
}

function NavChip({
  to,
  label,
  disabled,
}: {
  to: string;
  label: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700">
        {label}
      </span>
    );
  }
  return (
    <Link
      to={to}
      className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50"
    >
      {label}
    </Link>
  );
}

function KpiCard({
  title,
  value,
  lines,
  metaRight,
  chips,
}: {
  title: string;
  value: string;
  lines: string[];
  metaRight?: string;
  chips?: string[];
}) {
  return (
    <section className="card">
      <div className="card-body min-h-[180px]">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xs font-black uppercase tracking-wide text-zinc-500">{title}</h3>
          {metaRight ? <span className="text-xs text-zinc-400">{metaRight}</span> : null}
        </div>
        <div className="mt-2 text-3xl font-black tracking-tight text-zinc-900">{value}</div>
        {chips?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span key={chip} className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-zinc-700">
                {chip}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-3 space-y-1 text-sm leading-tight text-zinc-700">
          {lines.filter(Boolean).map((line, i) => (
            <p key={`${line}-${i}`}>{line}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

function AlertPanel({
  title,
  subtitle,
  actionLabel,
  actionTo,
  total,
  okMessage,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  actionTo: string;
  total: number;
  okMessage: string;
}) {
  return (
    <section className="card">
      <div className="card-head flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-zinc-900">{title}</h3>
          <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
        <Link to={actionTo} className="btn-outline !h-9 !rounded-xl px-4 text-sm font-bold">
          {actionLabel}
        </Link>
      </div>
      <div className="card-body">
        <p className="text-base text-zinc-700">
          Total con alerta: <span className="font-black text-zinc-900">{total}</span>
        </p>
        <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-600">
          {total > 0 ? 'Hay elementos para revisar en este módulo.' : okMessage}
        </div>
      </div>
    </section>
  );
}

function StatusListCard({
  title,
  actionLabel,
  actionTo,
  items,
}: {
  title: string;
  actionLabel: string;
  actionTo: string;
  items: Array<{ label: string; count: number; tone: string }>;
}) {
  return (
    <section className="card">
      <div className="card-head flex items-center justify-between gap-2">
        <h3 className="text-xl font-black tracking-tight text-zinc-900">{title}</h3>
        <Link to={actionTo} className="btn-outline !h-9 !rounded-xl px-4 text-sm font-bold">
          {actionLabel}
        </Link>
      </div>
      <div className="card-body space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
            <span className="text-sm font-bold text-zinc-900">{item.label}</span>
            <span className={`inline-flex min-w-10 items-center justify-center rounded-full border px-2 py-1 text-sm font-black ${item.tone}`}>
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function StockLowCard({ totalProducts, lowStock }: { totalProducts: number; lowStock: number }) {
  return (
    <section className="card">
      <div className="card-head flex items-center justify-between gap-2">
        <div>
          <h3 className="text-xl font-black tracking-tight text-zinc-900">Stock bajo</h3>
          <p className="text-sm text-zinc-500">Productos con stock ≤ 3</p>
        </div>
        <Link to="/admin/products" className="btn-outline !h-9 !rounded-xl px-4 text-sm font-bold">
          Productos
        </Link>
      </div>
      <div className="card-body">
        <p className="text-base text-zinc-700">
          Total productos: <span className="font-black text-zinc-900">{totalProducts}</span> · Bajo stock:{' '}
          <span className="font-black text-rose-700">{lowStock}</span>
        </p>
        <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-black text-zinc-900">Panel de stock</div>
              <div className="text-xs text-zinc-500">Revisá /admin/products para el detalle completo.</div>
            </div>
            <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-black text-rose-700">
              Stock: {lowStock}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function SimpleInfoCard({
  title,
  subtitle,
  actionLabel,
  actionTo,
  children,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  actionTo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="card-head flex items-center justify-between gap-2">
        <div>
          <h3 className="text-xl font-black tracking-tight text-zinc-900">{title}</h3>
          <p className="text-sm text-zinc-500">{subtitle}</p>
        </div>
        <Link to={actionTo} className="btn-outline !h-9 !rounded-xl px-4 text-sm font-bold">
          {actionLabel}
        </Link>
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
}
