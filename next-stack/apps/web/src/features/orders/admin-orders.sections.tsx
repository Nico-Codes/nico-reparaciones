import { AlertTriangle, MessageSquareMore, RefreshCcw, Search, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { LoadingBlock } from '@/components/ui/loading-block';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import {
  formatDateTime,
  money,
  orderStatusLabel,
  ORDER_FILTER_OPTIONS,
  orderStatusTone,
  STATUS_TABS,
} from './admin-orders.helpers';
import type { OrderItem } from './types';
import { AdminOrdersCounterChip } from './admin-orders-counters';
import { AdminOrderRow } from './admin-orders-row';

export function AdminOrdersHeaderActions({
  orderCount,
  onRefresh,
}: {
  orderCount: number;
  onRefresh: () => void;
}) {
  return (
    <>
      <StatusBadge label={`${orderCount} pedidos`} tone="info" />
      <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCcw className="h-4 w-4" />
        Actualizar
      </Button>
    </>
  );
}

export function AdminOrdersMetrics({
  totals,
  statusCounts,
}: {
  totals: { count: number; total: number };
  statusCounts: Record<string, number>;
}) {
  return (
    <section className="nr-stat-grid" data-reveal>
      <MetricCard label="Pedidos visibles" value={String(totals.count)} meta="Listado actual segun filtros" />
      <MetricCard label="Facturacion visible" value={money(totals.total)} meta="Suma de los pedidos cargados" />
      <MetricCard label="Pendientes" value={String(statusCounts.PENDIENTE ?? 0)} meta="Pedidos todavia sin confirmar" />
      <MetricCard label="Listos para retirar" value={String(statusCounts.LISTO_RETIRO ?? 0)} meta="Operaciones listas para entrega" />
    </section>
  );
}

export function AdminOrdersFilters({
  q,
  statusFilter,
  hasFilters,
  onQueryChange,
  onStatusFilterChange,
  onClearFilters,
  onReload,
}: {
  q: string;
  statusFilter: string;
  hasFilters: boolean;
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onClearFilters: () => void;
  onReload: () => void;
}) {
  return (
    <FilterBar
      actions={
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {hasFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={onClearFilters}>
              Limpiar
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={onReload}>
            <RefreshCcw className="h-4 w-4" />
            Recargar
          </Button>
        </div>
      }
    >
      <TextField
        value={q}
        onChange={(event) => onQueryChange(event.target.value)}
        label="Buscar"
        placeholder="Pedido, cliente o email"
        leadingIcon={<Search className="h-4 w-4" />}
        wrapperClassName="min-w-0 sm:min-w-[18rem]"
      />
      <div className="ui-field min-w-0 sm:min-w-[14rem]">
        <span className="ui-field__label">Estado</span>
        <CustomSelect
          value={statusFilter}
          onChange={onStatusFilterChange}
          options={ORDER_FILTER_OPTIONS}
          className="w-full"
          triggerClassName="min-h-11 rounded-[1rem]"
          ariaLabel="Filtrar pedidos por estado"
        />
      </div>
    </FilterBar>
  );
}

export function AdminOrdersTrackingSection({
  error,
  loading,
  items,
  statusFilter,
  statusCounts,
  whatsappCounters,
  selectedId,
  selectedDetail,
  loadingDetail,
  updatingOrderId,
  hasFilters,
  onSelectOrder,
  onStatusFilterChange,
  onReload,
  onClearFilters,
  onChangeStatus,
}: {
  error: string;
  loading: boolean;
  items: OrderItem[];
  statusFilter: string;
  statusCounts: Record<string, number>;
  whatsappCounters: { pending: number; inFlow: number; withoutEmail: number };
  selectedId: string | null;
  selectedDetail: OrderItem | null;
  loadingDetail: boolean;
  updatingOrderId: string | null;
  hasFilters: boolean;
  onSelectOrder: (orderId: string) => void;
  onStatusFilterChange: (value: string) => void;
  onReload: () => void;
  onClearFilters: () => void;
  onChangeStatus: (orderId: string, status: string) => void;
}) {
  return (
    <SectionCard
      title="Seguimiento rapido"
      description="Cambios de estado, acceso al detalle y revision de actividad reciente desde una sola vista."
      actions={<StatusBadge label={statusFilter ? `Filtrado: ${orderStatusLabel(statusFilter)}` : 'Todos los estados'} tone={statusFilter ? orderStatusTone(statusFilter) : 'neutral'} />}
    >
      {error ? (
        <div className="ui-alert ui-alert--danger mb-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No se pudo actualizar el listado.</span>
            <div className="ui-alert__text">{error}</div>
          </div>
        </div>
      ) : null}

      <div className="status-tab-list">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button key={tab.countKey} type="button" onClick={() => onStatusFilterChange(tab.value)} className={`status-tab ${isActive ? 'is-active' : ''}`}>
              <span>{tab.label}</span>
              <span className="status-tab__count">{statusCounts[tab.countKey] ?? 0}</span>
            </button>
          );
        })}
      </div>

      <div className="counter-row mt-4">
        <AdminOrdersCounterChip label="Pendientes de seguimiento" count={whatsappCounters.pending} icon={<MessageSquareMore className="h-4 w-4" />} />
        <AdminOrdersCounterChip label="En flujo activo" count={whatsappCounters.inFlow} icon={<Truck className="h-4 w-4" />} />
        <AdminOrdersCounterChip label="Sin email" count={whatsappCounters.withoutEmail} icon={<AlertTriangle className="h-4 w-4" />} />
      </div>

      <div className="mt-4 admin-collection">
        {loading ? (
          <SectionCard tone="muted" bodyClassName="space-y-3">
            <LoadingBlock label="Cargando pedidos" lines={4} />
          </SectionCard>
        ) : items.length === 0 ? (
          <EmptyState
            title="No hay pedidos para mostrar"
            description={hasFilters ? 'Proba con otro estado o quita el texto de busqueda.' : 'Todavia no hay pedidos registrados en el panel.'}
            actions={
              hasFilters ? (
                <Button type="button" variant="outline" onClick={onClearFilters}>
                  Limpiar filtros
                </Button>
              ) : undefined
            }
          />
        ) : (
          items.map((order) => (
            <AdminOrderRow
              key={order.id}
              order={order}
              isActive={selectedId === order.id}
              selectedDetail={selectedDetail}
              loadingDetail={loadingDetail && selectedId === order.id}
              updatingOrderId={updatingOrderId}
              onSelect={() => onSelectOrder(order.id)}
              onReload={onReload}
              onChangeStatus={onChangeStatus}
            />
          ))
        )}
      </div>
    </SectionCard>
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
