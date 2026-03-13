import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BadgeDollarSign, Boxes, ClipboardList, PackagePlus, ShoppingCart, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
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
      repairDiagnosis: repairStatusCounts.DIAGNOSING,
      repairReadyPickup: repairStatusCounts.READY_PICKUP,
      ordersPending: orderStatusCounts.PENDIENTE,
      whatsappPending: data.alerts.find((alert) => alert.id === 'pending-flow-orders')?.value ?? 0,
      orderStatusCounts,
      repairStatusCounts,
    };
  }, [data]);

  const workQueue = useMemo(() => {
    if (!summary || !data) return [];

    return [
      {
        id: 'repair-diagnosis',
        title: 'Revisar ingresos en diagnóstico',
        description: 'Casos recién ingresados que todavía no tienen presupuesto aprobado ni avance técnico.',
        value: summary.repairDiagnosis,
        to: '/admin/repairs',
        tone: 'info' as const,
      },
      {
        id: 'repair-approval',
        title: 'Pedir o seguir aprobaciones',
        description: 'Equipos esperando respuesta del cliente para avanzar o cerrar el trabajo.',
        value: summary.pendingApprovals,
        to: '/admin/repairs',
        tone: 'warning' as const,
      },
      {
        id: 'repair-ready',
        title: 'Coordinar entregas del taller',
        description: 'Reparaciones listas para retiro y seguimiento inmediato con el cliente.',
        value: summary.repairReadyPickup,
        to: '/admin/repairs',
        tone: 'success' as const,
      },
      {
        id: 'orders-pending',
        title: 'Destrabar pedidos activos',
        description: 'Pedidos pendientes o confirmados que requieren preparación, retiro o comunicación.',
        value: data.metrics.orders.pendingFlow,
        to: '/admin/orders',
        tone: 'accent' as const,
      },
      {
        id: 'stock-low',
        title: 'Reponer stock crítico',
        description: 'Productos con stock bajo o agotado que conviene revisar antes de la próxima venta.',
        value: summary.lowStockProducts,
        to: '/admin/productos',
        tone: 'danger' as const,
      },
    ].sort((a, b) => b.value - a.value);
  }, [data, summary]);

  const primaryModules = [
    { title: 'Reparaciones', description: 'Ingresos, seguimiento, tickets y taller.', to: '/admin/repairs', icon: Wrench },
    { title: 'Pedidos', description: 'Checkout, estados, entrega y control de ventas.', to: '/admin/orders', icon: ShoppingCart },
    { title: 'Productos', description: 'Alta, stock, publicación y etiquetas.', to: '/admin/productos', icon: Boxes },
    { title: 'Categorías', description: 'Ordená y mantené el catálogo visible.', to: '/admin/categorias', icon: ClipboardList },
    { title: 'Proveedores', description: 'Búsqueda, probing y costo real de repuestos.', to: '/admin/proveedores', icon: PackagePlus },
    { title: 'Pricing', description: 'Reglas automáticas para reparaciones y márgenes.', to: '/admin/precios', icon: BadgeDollarSign },
  ];

  const advancedModules = [
    { title: 'Usuarios', to: '/admin/users' },
    { title: 'Seguridad / 2FA', to: '/admin/seguridad/2fa' },
    { title: 'Configuración', to: '/admin/configuraciones' },
    { title: 'FAQ / ayuda', to: '/admin/help' },
    { title: 'Reportes', to: '/admin/configuracion/reportes' },
    { title: 'Contabilidad', to: '/admin/contabilidad' },
    { title: 'Garantías', to: '/admin/garantias' },
    { title: 'Historial ventas rápidas', to: '/admin/ventas-rapidas/historial' },
  ];

  return (
    <PageShell context="admin" className="space-y-6" data-admin-dashboard-page>
      <PageHeader
        context="admin"
        eyebrow="Panel operativo"
        title="Centro de trabajo"
        subtitle="Lo urgente primero: creá, seguí y resolvé reparaciones, pedidos y stock desde una sola vista."
        actions={summary ? <StatusBadge tone="info" label={`Actualizado ${formatGeneratedAt(data!.generatedAt)}`} /> : undefined}
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

      <SectionCard
        title="Acciones rápidas"
        description="Los atajos que más usás en el día a día del mostrador y del taller."
        className="admin-dashboard-section"
        data-admin-dashboard-quick-actions
      >
        <div className="admin-dashboard-quick-grid">
          <QuickActionCard
            title="Nueva reparación"
            description="Abrí un caso y seguí el diagnóstico desde el primer minuto."
            to="/admin/repairs/create"
            icon={<Wrench className="h-5 w-5" />}
            tone="accent"
          />
          <QuickActionCard
            title="Nueva venta"
            description="Registrá una venta rápida con ticket y control de stock."
            to="/admin/ventas-rapidas"
            icon={<ShoppingCart className="h-5 w-5" />}
            tone="success"
          />
          <QuickActionCard
            title="Ingresar stock"
            description="Sumá producto o reposición cuando necesitás actualizar el catálogo."
            to="/admin/productos/crear"
            icon={<PackagePlus className="h-5 w-5" />}
            tone="warning"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Gestión principal"
        description="Accesos directos a los módulos que sí usás seguido, sin mezclar configuración avanzada."
        className="admin-dashboard-section"
      >
        <div className="admin-dashboard-module-grid">
          {primaryModules.map((module) => (
            <Link key={module.title} to={module.to} className="admin-dashboard-module-card">
              <div className="admin-dashboard-module-card__icon">
                <module.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="admin-dashboard-module-card__title">{module.title}</div>
                <p className="admin-dashboard-module-card__description">{module.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Resumen operativo"
        description="Indicadores grandes y clickeables para entrar rápido al módulo correcto."
        className="admin-dashboard-section"
      >
        {loading || !summary || !data ? (
          <LoadingBlock label="Armando el resumen operativo" lines={4} />
        ) : (
          <div className="admin-dashboard-summary-grid">
            <SummaryLinkCard
              title="En diagnóstico"
              value={summary.repairDiagnosis}
              description="Reparaciones que requieren revisión técnica inicial."
              to="/admin/repairs"
              tone="info"
            />
            <SummaryLinkCard
              title="Esperando aprobación"
              value={summary.pendingApprovals}
              description="Casos frenados hasta definir presupuesto con el cliente."
              to="/admin/repairs"
              tone="warning"
            />
            <SummaryLinkCard
              title="Listas para entregar"
              value={summary.repairReadyPickup}
              description="Equipos listos para retiro y coordinación final."
              to="/admin/repairs"
              tone="success"
            />
            <SummaryLinkCard
              title="Pedidos pendientes"
              value={data.metrics.orders.pendingFlow}
              description="Pedidos todavía activos dentro del flujo comercial."
              to="/admin/orders"
              tone="accent"
            />
            <SummaryLinkCard
              title="Stock bajo"
              value={summary.lowStockProducts}
              description="Productos que necesitan reposición o revisión urgente."
              to="/admin/productos"
              tone="danger"
            />
          </div>
        )}
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[1.5fr,1fr]">
        <SectionCard
          title="Bandeja de trabajo"
          description="Lo que conviene atender ahora, ordenado por urgencia operativa."
          className="admin-dashboard-section"
        >
          {loading || !summary || !data ? (
            <LoadingBlock label="Preparando bandeja de trabajo" lines={4} />
          ) : (
            <div className="admin-dashboard-queue">
              {workQueue.map((item) => (
                <Link key={item.id} to={item.to} className="admin-dashboard-queue-item">
                  <div className="admin-dashboard-queue-item__copy">
                    <div className="admin-dashboard-queue-item__title-row">
                      <h3 className="admin-dashboard-queue-item__title">{item.title}</h3>
                      <StatusBadge tone={item.tone} label={String(item.value)} size="sm" />
                    </div>
                    <p className="admin-dashboard-queue-item__description">{item.description}</p>
                  </div>
                  <span className="admin-dashboard-queue-item__cta">Abrir módulo</span>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Métricas útiles"
          description="Datos de operación que sirven para tomar decisiones, sin robar protagonismo."
          className="admin-dashboard-section"
        >
          {loading || !summary || !data ? (
            <LoadingBlock label="Cargando métricas útiles" lines={3} />
          ) : (
            <div className="admin-dashboard-metrics">
              <CompactMetric label="Ingresos entregados" value={`$ ${summary.deliveredRevenue.toLocaleString('es-AR')}`} />
              <CompactMetric label="Ticket promedio" value={`$ ${Math.round(summary.ticketAverage).toLocaleString('es-AR')}`} />
              <CompactMetric label="Promedio reparación entregada" value={`$ ${Math.round(summary.avgRepairValue).toLocaleString('es-AR')}`} />
              <CompactMetric label="WhatsApp pendientes" value={String(summary.whatsappPending)} />
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Actividad reciente"
        description="Últimos movimientos para seguir trabajando sin abrir un mapa gigante del sistema."
        className="admin-dashboard-section"
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <ActivityCard
            title="Pedidos recientes"
            items={data?.recent.orders ?? []}
            emptyTitle="No hay pedidos recientes"
            emptyDescription="Cuando entren ventas, aparecerán acá para seguimiento rápido."
            renderItem={(order) => {
              const normalizedStatus = normalizeOrderStatus(order.status);
              return (
                <div className="admin-dashboard-activity-item">
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
            items={data?.recent.repairs ?? []}
            emptyTitle="No hay reparaciones recientes"
            emptyDescription="Cuando entren reparaciones, verás acá los últimos ingresos del taller."
            renderItem={(repair) => {
              const normalizedStatus = repair.status === 'IN_REPAIR' ? 'REPAIRING' : repair.status;
              return (
                <div className="admin-dashboard-activity-item">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-zinc-950">{repair.customerName}</div>
                    <div className="text-sm text-zinc-600">
                      {[repair.deviceBrand, repair.deviceModel].filter(Boolean).join(' · ') || 'Equipo sin detalle'}
                    </div>
                  </div>
                  <StatusBadge tone={repairStatusTone(normalizedStatus)} size="sm" label={repairStatusLabel(normalizedStatus)} />
                </div>
              );
            }}
            actionTo="/admin/repairs"
          />
        </div>
      </SectionCard>

      <details className="admin-dashboard-advanced" data-admin-dashboard-advanced>
        <summary className="admin-dashboard-advanced__summary">
          <div>
            <div className="admin-dashboard-advanced__eyebrow">Administración avanzada</div>
            <div className="admin-dashboard-advanced__title">Configuración, seguridad y herramientas menos usadas</div>
          </div>
          <Button type="button" variant="ghost" size="sm" className="pointer-events-none">
            Expandir
          </Button>
        </summary>
        <div className="admin-dashboard-advanced__content">
          <div className="admin-dashboard-advanced__grid">
            {advancedModules.map((module) => (
              <Button key={module.title} variant="outline" asChild>
                <Link to={module.to}>{module.title}</Link>
              </Button>
            ))}
          </div>
        </div>
      </details>
    </PageShell>
  );
}

function QuickActionCard({
  title,
  description,
  to,
  icon,
  tone,
}: {
  title: string;
  description: string;
  to: string;
  icon: ReactNode;
  tone: BadgeTone;
}) {
  return (
    <Link to={to} className="admin-dashboard-quick-card" data-tone={tone}>
      <div className="admin-dashboard-quick-card__icon">{icon}</div>
      <div className="space-y-2">
        <div className="admin-dashboard-quick-card__title-row">
          <h3 className="admin-dashboard-quick-card__title">{title}</h3>
          <StatusBadge tone={tone} label="Abrir" size="sm" />
        </div>
        <p className="admin-dashboard-quick-card__description">{description}</p>
      </div>
    </Link>
  );
}

function SummaryLinkCard({
  title,
  value,
  description,
  to,
  tone,
}: {
  title: string;
  value: number;
  description: string;
  to: string;
  tone: BadgeTone;
}) {
  return (
    <Link to={to} className="admin-dashboard-summary-card">
      <div className="admin-dashboard-summary-card__header">
        <div className="admin-dashboard-summary-card__title">{title}</div>
        <StatusBadge tone={tone} label="Ver" size="sm" />
      </div>
      <div className="admin-dashboard-summary-card__value">{value}</div>
      <p className="admin-dashboard-summary-card__description">{description}</p>
    </Link>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-dashboard-metric">
      <div className="admin-dashboard-metric__label">{label}</div>
      <div className="admin-dashboard-metric__value">{value}</div>
    </div>
  );
}

function ActivityCard<T>({
  title,
  items,
  renderItem,
  emptyTitle,
  emptyDescription,
  actionTo,
}: {
  title: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  actionTo: string;
}) {
  return (
    <SectionCard
      title={title}
      actions={(
        <Button variant="outline" size="sm" asChild>
          <Link to={actionTo}>Abrir módulo</Link>
        </Button>
      )}
    >
      {items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid gap-3">{items.slice(0, 4).map((item, index) => <div key={index}>{renderItem(item)}</div>)}</div>
      )}
    </SectionCard>
  );
}
