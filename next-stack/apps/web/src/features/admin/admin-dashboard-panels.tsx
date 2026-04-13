import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BadgeDollarSign, Boxes, ClipboardList, PackagePlus, ShoppingCart, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { orderStatusLabel, orderStatusTone, normalizeOrderStatus } from '@/features/orders/order-ui';
import { repairStatusLabel, repairStatusTone } from '@/features/repairs/repair-ui';
import {
  normalizeDashboardRepairStatus,
  type DashboardBadgeTone,
  type DashboardSummary,
  type DashboardWorkQueueItem,
} from './admin-dashboard.helpers';
import type { AdminDashboardResponse } from './api';

const PRIMARY_MODULES = [
  { title: 'Reparaciones', description: 'Ingresos, seguimiento, tickets y taller.', to: '/admin/repairs', icon: Wrench },
  { title: 'Pedidos', description: 'Checkout, estados, entrega y control de ventas.', to: '/admin/orders', icon: ShoppingCart },
  { title: 'Productos', description: 'Alta, stock, publicacion y etiquetas.', to: '/admin/productos', icon: Boxes },
  { title: 'Categorias', description: 'Ordena y mantene el catalogo visible.', to: '/admin/categorias', icon: ClipboardList },
  { title: 'Proveedores', description: 'Busqueda, probing y costo real de repuestos.', to: '/admin/proveedores', icon: PackagePlus },
  { title: 'Pricing', description: 'Reglas automaticas para reparaciones y margenes.', to: '/admin/precios', icon: BadgeDollarSign },
] as const;

const ADVANCED_MODULES = [
  { title: 'Usuarios', to: '/admin/users' },
  { title: 'Seguridad / 2FA', to: '/admin/seguridad/2fa' },
  { title: 'Configuracion', to: '/admin/configuraciones' },
  { title: 'FAQ / ayuda', to: '/admin/help' },
  { title: 'Reportes', to: '/admin/configuracion/reportes' },
  { title: 'Contabilidad', to: '/admin/contabilidad' },
  { title: 'Garantias', to: '/admin/garantias' },
  { title: 'Historial ventas rapidas', to: '/admin/ventas-rapidas/historial' },
] as const;

export function AdminDashboardQuickActionsPanel() {
  return (
    <SectionCard
      title="Acciones rapidas"
      description="Los atajos que mas usas en el dia a dia del mostrador y del taller."
      className="admin-dashboard-section"
      data-admin-dashboard-quick-actions
    >
      <div className="admin-dashboard-quick-grid">
        <QuickActionCard
          title="Nueva reparacion"
          description="Abri un caso y segui el diagnostico desde el primer minuto."
          to="/admin/repairs/create"
          icon={<Wrench className="h-5 w-5" />}
          tone="accent"
        />
        <QuickActionCard
          title="Nueva venta"
          description="Registra una venta rapida con ticket y control de stock."
          to="/admin/ventas-rapidas"
          icon={<ShoppingCart className="h-5 w-5" />}
          tone="success"
        />
        <QuickActionCard
          title="Ingresar stock"
          description="Suma producto o reposicion cuando necesites actualizar el catalogo."
          to="/admin/productos/crear"
          icon={<PackagePlus className="h-5 w-5" />}
          tone="warning"
        />
      </div>
    </SectionCard>
  );
}

export function AdminDashboardPrimaryModulesPanel() {
  return (
    <SectionCard
      title="Gestion principal"
      description="Accesos directos a los modulos que si usas seguido, sin mezclar configuracion avanzada."
      className="admin-dashboard-section"
    >
      <div className="admin-dashboard-module-grid">
        {PRIMARY_MODULES.map((module) => (
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
  );
}

export function AdminDashboardSummaryPanel({
  loading,
  summary,
}: {
  loading: boolean;
  summary: DashboardSummary | null;
}) {
  return (
    <SectionCard
      title="Resumen operativo"
      description="Indicadores grandes y clickeables para entrar rapido al modulo correcto."
      className="admin-dashboard-section"
    >
      {loading || !summary ? (
        <LoadingBlock label="Armando el resumen operativo" lines={4} />
      ) : (
        <div className="admin-dashboard-summary-grid">
          <SummaryLinkCard title="En diagnostico" value={summary.repairDiagnosis} description="Reparaciones que requieren revision tecnica inicial." to="/admin/repairs" tone="info" />
          <SummaryLinkCard title="Esperando aprobacion" value={summary.pendingApprovals} description="Casos frenados hasta definir presupuesto con el cliente." to="/admin/repairs" tone="warning" />
          <SummaryLinkCard title="Listas para entregar" value={summary.repairReadyPickup} description="Equipos listos para retiro y coordinacion final." to="/admin/repairs" tone="success" />
          <SummaryLinkCard title="Pedidos pendientes" value={summary.pendingFlowOrders} description="Pedidos todavia activos dentro del flujo comercial." to="/admin/orders" tone="accent" />
          <SummaryLinkCard title="Stock bajo" value={summary.lowStockProducts} description="Productos que necesitan reposicion o revision urgente." to="/admin/productos" tone="danger" />
        </div>
      )}
    </SectionCard>
  );
}

export function AdminDashboardWorkQueuePanel({
  loading,
  workQueue,
}: {
  loading: boolean;
  workQueue: DashboardWorkQueueItem[];
}) {
  return (
    <SectionCard
      title="Bandeja de trabajo"
      description="Lo que conviene atender ahora, ordenado por urgencia operativa."
      className="admin-dashboard-section"
    >
      {loading ? (
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
              <span className="admin-dashboard-queue-item__cta">Abrir modulo</span>
            </Link>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function AdminDashboardMetricsPanel({
  loading,
  summary,
}: {
  loading: boolean;
  summary: DashboardSummary | null;
}) {
  return (
    <SectionCard
      title="Metricas utiles"
      description="Datos de operacion que sirven para tomar decisiones, sin robar protagonismo."
      className="admin-dashboard-section"
    >
      {loading || !summary ? (
        <LoadingBlock label="Cargando metricas utiles" lines={3} />
      ) : (
        <div className="admin-dashboard-metrics">
          <CompactMetric label="Ingresos entregados" value={`$ ${summary.deliveredRevenue.toLocaleString('es-AR')}`} />
          <CompactMetric label="Ticket promedio" value={`$ ${Math.round(summary.ticketAverage).toLocaleString('es-AR')}`} />
          <CompactMetric label="Promedio reparacion entregada" value={`$ ${Math.round(summary.avgRepairValue).toLocaleString('es-AR')}`} />
          <CompactMetric label="WhatsApp pendientes" value={String(summary.whatsappPending)} />
        </div>
      )}
    </SectionCard>
  );
}

export function AdminDashboardActivityPanel({
  orders,
  repairs,
}: {
  orders: AdminDashboardResponse['recent']['orders'];
  repairs: AdminDashboardResponse['recent']['repairs'];
}) {
  return (
    <SectionCard
      title="Actividad reciente"
      description="Ultimos movimientos para seguir trabajando sin abrir un mapa gigante del sistema."
      className="admin-dashboard-section"
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <ActivityCard
          title="Pedidos recientes"
          items={orders}
          emptyTitle="No hay pedidos recientes"
          emptyDescription="Cuando entren ventas, apareceran aca para seguimiento rapido."
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
          items={repairs}
          emptyTitle="No hay reparaciones recientes"
          emptyDescription="Cuando entren reparaciones, veras aca los ultimos ingresos del taller."
          renderItem={(repair) => {
            const normalizedStatus = normalizeDashboardRepairStatus(repair.status);
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
  );
}

export function AdminDashboardAdvancedPanel() {
  return (
    <details className="admin-dashboard-advanced" data-admin-dashboard-advanced>
      <summary className="admin-dashboard-advanced__summary">
        <div>
          <div className="admin-dashboard-advanced__eyebrow">Administracion avanzada</div>
          <div className="admin-dashboard-advanced__title">Configuracion, seguridad y herramientas menos usadas</div>
        </div>
        <Button type="button" variant="ghost" size="sm" className="pointer-events-none">
          Expandir
        </Button>
      </summary>
      <div className="admin-dashboard-advanced__content">
        <div className="admin-dashboard-advanced__grid">
          {ADVANCED_MODULES.map((module) => (
            <Button key={module.title} variant="outline" asChild>
              <Link to={module.to}>{module.title}</Link>
            </Button>
          ))}
        </div>
      </div>
    </details>
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
  tone: DashboardBadgeTone;
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
  tone: DashboardBadgeTone;
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
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to={actionTo}>Abrir modulo</Link>
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
