import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { orderStatusLabel, orderStatusTone, normalizeOrderStatus } from '@/features/orders/order-ui';
import { repairStatusLabel, repairStatusTone } from '@/features/repairs/repair-ui';
import { adminApi, type AdminDashboardResponse } from './api';

type BadgeTone = 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'danger';

const ORDER_STATUS_KEYS = ['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'LISTO_RETIRO', 'ENTREGADO', 'CANCELADO'] as const;
const REPAIR_STATUS_KEYS = ['RECEIVED', 'DIAGNOSING', 'WAITING_APPROVAL', 'REPAIRING', 'READY_PICKUP', 'DELIVERED', 'CANCELLED'] as const;

function formatGeneratedAt(value: string) {
  const date = new Date(value);
  return date.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
}

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
        const res = await adminApi.dashboard();
        if (!mounted) return;
        setData(res);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'No se pudo cargar el dashboard.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    if (!data) return null;

    const deliveredOrders = data.recent.orders.filter((order) => normalizeOrderStatus(order.status) === 'ENTREGADO');
    const deliveredRevenue = deliveredOrders.reduce((acc, order) => acc + order.total, 0);
    const ticketAverage = deliveredOrders.length ? deliveredRevenue / deliveredOrders.length : 0;
    const orderStatusCounts = Object.fromEntries(ORDER_STATUS_KEYS.map((status) => [status, 0])) as Record<(typeof ORDER_STATUS_KEYS)[number], number>;
    const repairStatusCounts = Object.fromEntries(REPAIR_STATUS_KEYS.map((status) => [status, 0])) as Record<(typeof REPAIR_STATUS_KEYS)[number], number>;

    for (const order of data.recent.orders) {
      const key = normalizeOrderStatus(order.status) as (typeof ORDER_STATUS_KEYS)[number];
      if (key in orderStatusCounts) orderStatusCounts[key] += 1;
    }

    for (const repair of data.recent.repairs) {
      const key = (repair.status === 'IN_REPAIR' ? 'REPAIRING' : repair.status) as (typeof REPAIR_STATUS_KEYS)[number];
      if (key in repairStatusCounts) repairStatusCounts[key] += 1;
    }

    const deliveredRepairs = data.recent.repairs.filter((repair) => repair.status === 'DELIVERED');

    return {
      deliveredRevenue,
      ticketAverage,
      avgRepairValue: deliveredRepairs.length
        ? deliveredRepairs.reduce((acc, repair) => acc + (repair.finalPrice ?? repair.quotedPrice ?? 0), 0) / deliveredRepairs.length
        : 0,
      lowStockProducts: data.metrics.products.lowStock,
      pendingApprovals: repairStatusCounts.WAITING_APPROVAL,
      whatsappPending: data.alerts.find((alert) => alert.id === 'pending-flow-orders')?.value ?? 0,
      orderStatusCounts,
      repairStatusCounts,
    };
  }, [data]);

  return (
    <PageShell context="admin">
      <PageHeader
        context="admin"
        eyebrow="Panel operativo"
        title="Dashboard administrativo"
        subtitle="Métricas de pedidos, reparaciones y operación del negocio en una sola vista."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/admin/orders">Ver pedidos</Link>
            </Button>
            <Button asChild>
              <Link to="/admin/ventas-rapidas">Nueva venta</Link>
            </Button>
          </>
        }
      />

      <FilterBar
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/admin/repairs">Reparaciones</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/admin/configuraciones">Configuración</Link>
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <div className="text-sm font-extrabold text-zinc-950">Estado operativo</div>
            <p className="mt-1 text-sm text-zinc-600">
              Resumen consolidado del backend para pedidos, reparaciones, stock y alertas activas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="info" label={data ? `Actualizado ${formatGeneratedAt(data.generatedAt)}` : 'Actualizando panel'} />
            <StatusBadge tone="warning" label={`${summary?.pendingApprovals ?? 0} aprobaciones pendientes`} />
            <StatusBadge tone="neutral" label={`${data?.metrics.orders.pendingFlow ?? 0} pedidos en flujo`} />
          </div>
        </div>
      </FilterBar>

      {error ? (
        <SectionCard tone="info" className="border-rose-200 bg-rose-50">
          <div className="text-sm font-semibold text-rose-700">{error}</div>
        </SectionCard>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading || !data || !summary ? (
          Array.from({ length: 4 }).map((_, index) => (
            <SectionCard key={index} title="Cargando métricas" description="Preparando resumen operativo.">
              <LoadingBlock lines={4} />
            </SectionCard>
          ))
        ) : (
          <>
            <MetricCard
              title="Pedidos creados"
              value={String(data.metrics.orders.createdToday)}
              hint="Nuevos pedidos registrados en la jornada actual."
              details={[
                `En flujo: ${data.metrics.orders.pendingFlow}`,
                `Listos para retirar: ${summary.orderStatusCounts.LISTO_RETIRO}`,
              ]}
              badge={<StatusBadge tone="info" label="Operación" />}
            />
            <MetricCard
              title="Ingresos entregados"
              value={`$ ${summary.deliveredRevenue.toLocaleString('es-AR')}`}
              hint="Pedidos entregados dentro del panel reciente."
              details={[
                `Ticket promedio: $ ${Math.round(summary.ticketAverage).toLocaleString('es-AR')}`,
                `WhatsApp pendientes: ${summary.whatsappPending}`,
              ]}
              badge={<StatusBadge tone="success" label="Ventas" />}
            />
            <MetricCard
              title="Reparaciones activas"
              value={String(data.metrics.repairs.open)}
              hint="Equipos en curso o esperando definición del cliente."
              details={[
                `Nuevas en el día: ${data.metrics.repairs.createdToday}`,
                `Esperando aprobación: ${summary.pendingApprovals}`,
              ]}
              badge={<StatusBadge tone="accent" label="Taller" />}
            />
            <MetricCard
              title="Productos con bajo stock"
              value={String(summary.lowStockProducts)}
              hint={`Catálogo total: ${data.metrics.products.total} productos`}
              details={[
                `Sin stock: ${data.metrics.products.outOfStock}`,
                `Promedio reparación entregada: $ ${Math.round(summary.avgRepairValue).toLocaleString('es-AR')}`,
              ]}
              badge={<StatusBadge tone="warning" label="Stock" />}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Alertas operativas"
          description="Monitoreá pedidos y reparaciones que requieren seguimiento."
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/alertas">Ver alertas</Link>
            </Button>
          }
        >
          {loading || !data ? (
            <LoadingBlock lines={3} />
          ) : (
            <div className="grid gap-3">
              {data.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-bold text-zinc-950">{alert.title}</div>
                    <div className="mt-1 text-sm text-zinc-600">Valor actual informado por el backend.</div>
                  </div>
                  <StatusBadge
                    tone={alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'info'}
                    label={String(alert.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Accesos frecuentes"
          description="Atajos para acciones comunes del panel."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="secondary" asChild>
              <Link to="/admin/productos">Productos</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/admin/proveedores">Proveedores</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/garantias">Garantías</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/contabilidad">Contabilidad</Link>
            </Button>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <StatusSummaryCard
          title="Pedidos por estado"
          items={ORDER_STATUS_KEYS.map((status) => ({
            label: orderStatusLabel(status),
            count: summary?.orderStatusCounts[status] ?? 0,
            tone: orderStatusTone(status),
          }))}
          actionTo="/admin/orders"
        />
        <StatusSummaryCard
          title="Reparaciones por estado"
          items={REPAIR_STATUS_KEYS.map((status) => ({
            label: repairStatusLabel(status),
            count: summary?.repairStatusCounts[status] ?? 0,
            tone: repairStatusTone(status),
          }))}
          actionTo="/admin/repairs"
        />
        <SectionCard
          title="Productos destacados"
          description="Lectura rápida del catálogo y movimientos recientes."
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/productos">Ver catálogo</Link>
            </Button>
          }
        >
          {loading || !data ? (
            <LoadingBlock lines={4} />
          ) : data.recent.orders.length === 0 ? (
            <EmptyState
              title="Todavía no hay actividad de ventas"
              description="Cuando entren pedidos, acá aparecerá una lectura rápida de los productos más recientes."
            />
          ) : (
            <div className="grid gap-3">
              {data.recent.orders.slice(0, 3).map((order) => {
                const normalizedStatus = normalizeOrderStatus(order.status);
                return (
                  <div key={order.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-zinc-950">
                          {order.itemsPreview[0]?.name ?? 'Pedido sin ítems'}
                        </div>
                        <div className="text-sm text-zinc-600">
                          Pedido {order.id.slice(0, 8)} · {new Date(order.createdAt).toLocaleDateString('es-AR')}
                        </div>
                      </div>
                      <StatusBadge tone={orderStatusTone(normalizedStatus)} label={orderStatusLabel(normalizedStatus)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ActivityCard
          title="Pedidos recientes"
          description="Últimos pedidos registrados en el sistema."
          items={data?.recent.orders ?? []}
          emptyTitle="No hay pedidos recientes"
          emptyDescription="Cuando se registren ventas, aparecerán acá para seguimiento rápido."
          renderItem={(order) => {
            const normalizedStatus = normalizeOrderStatus(order.status);
            return (
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-zinc-950">Pedido {order.id.slice(0, 8)}</div>
                  <div className="text-sm text-zinc-600">
                    {order.user?.name ?? 'Cliente sin cuenta'} · {new Date(order.createdAt).toLocaleString('es-AR')}
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge tone={orderStatusTone(normalizedStatus)} size="sm" label={orderStatusLabel(normalizedStatus)} />
                  <div className="mt-2 text-sm font-bold text-zinc-950">$ {order.total.toLocaleString('es-AR')}</div>
                </div>
              </div>
            );
          }}
          actionTo="/admin/orders"
        />

        <ActivityCard
          title="Reparaciones recientes"
          description="Últimos ingresos del taller."
          items={data?.recent.repairs ?? []}
          emptyTitle="No hay reparaciones recientes"
          emptyDescription="Cuando entren reparaciones, el panel mostrará los movimientos más recientes."
          renderItem={(repair) => {
            const normalizedStatus = repair.status === 'IN_REPAIR' ? 'REPAIRING' : repair.status;
            return (
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-zinc-950">{repair.customerName}</div>
                  <div className="text-sm text-zinc-600">
                    {[repair.deviceBrand, repair.deviceModel].filter(Boolean).join(' · ') || 'Equipo sin detalle'}
                  </div>
                </div>
                <StatusBadge
                  tone={repairStatusTone(normalizedStatus)}
                  size="sm"
                  label={repairStatusLabel(normalizedStatus)}
                />
              </div>
            );
          }}
          actionTo="/admin/repairs"
        />
      </div>
    </PageShell>
  );
}

function MetricCard({
  title,
  value,
  hint,
  details,
  badge,
}: {
  title: string;
  value: string;
  hint: string;
  details: string[];
  badge?: ReactNode;
}) {
  return (
    <SectionCard className="h-full" bodyClassName="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-zinc-600">{title}</div>
          <div className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{value}</div>
        </div>
        {badge}
      </div>
      <div className="text-sm text-zinc-600">{hint}</div>
      <div className="grid gap-2">
        {details.map((detail) => (
          <div key={detail} className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            {detail}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function StatusSummaryCard({
  title,
  items,
  actionTo,
}: {
  title: string;
  items: Array<{ label: string; count: number; tone: BadgeTone }>;
  actionTo: string;
}) {
  return (
    <SectionCard
      title={title}
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to={actionTo}>Ver detalle</Link>
        </Button>
      }
    >
      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3"
          >
            <span className="text-sm font-semibold text-zinc-900">{item.label}</span>
            <StatusBadge tone={item.tone} label={String(item.count)} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ActivityCard<T>({
  title,
  description,
  items,
  renderItem,
  emptyTitle,
  emptyDescription,
  actionTo,
}: {
  title: string;
  description: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  actionTo: string;
}) {
  return (
    <SectionCard
      title={title}
      description={description}
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to={actionTo}>Abrir módulo</Link>
        </Button>
      }
    >
      {items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid gap-3">{items.slice(0, 4).map((item, index) => <div key={index}>{renderItem(item)}</div>)}</div>
      )}
    </SectionCard>
  );
}
