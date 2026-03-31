import { type ReactNode } from 'react';
import { AlertTriangle, MessageSquareMore, RefreshCcw, Search, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ActionDropdown } from '@/components/ui/action-dropdown';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { LoadingBlock } from '@/components/ui/loading-block';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import type { OrderItem } from './types';
import {
  formatDateTime,
  money,
  orderPrintHref,
  orderStatusLabel,
  ORDER_FILTER_OPTIONS,
  ORDER_STATUS_OPTIONS,
  orderStatusTone,
  orderTicketHref,
  STATUS_TABS,
  timeAgo,
} from './admin-orders.helpers';
import type { UiTone } from './order-ui';

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
        <CounterChip label="Pendientes de seguimiento" count={whatsappCounters.pending} icon={<MessageSquareMore className="h-4 w-4" />} />
        <CounterChip label="En flujo activo" count={whatsappCounters.inFlow} icon={<Truck className="h-4 w-4" />} />
        <CounterChip label="Sin email" count={whatsappCounters.withoutEmail} icon={<AlertTriangle className="h-4 w-4" />} />
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
            <OrderRow
              key={order.id}
              order={order}
              isActive={selectedId === order.id}
              selectedDetail={selectedDetail?.id === order.id ? selectedDetail : null}
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

function OrderRow({
  order,
  isActive,
  selectedDetail,
  loadingDetail,
  updatingOrderId,
  onSelect,
  onReload,
  onChangeStatus,
}: {
  order: OrderItem;
  isActive: boolean;
  selectedDetail: OrderItem | null;
  loadingDetail: boolean;
  updatingOrderId: string | null;
  onSelect: () => void;
  onReload: () => void;
  onChangeStatus: (orderId: string, status: string) => void;
}) {
  const customerName = order.user?.name || 'Venta local';
  const email = order.user?.email || 'Sin email';

  return (
    <article className={`admin-entity-row ${isActive ? 'is-active' : ''}`}>
      <div className="admin-entity-row__top">
        <div className="admin-entity-row__heading">
          <div className="admin-entity-row__title-row">
            <button type="button" className="admin-entity-row__title" onClick={onSelect}>
              Pedido #{order.id.slice(0, 6)}
            </button>
            <StatusBadge label={orderStatusLabel(order.status)} tone={orderStatusTone(order.status)} />
            <StatusBadge label={order.user ? 'Web' : 'Venta local'} tone="neutral" />
            {!order.user?.email ? <StatusBadge label="Sin email" tone="warning" /> : null}
          </div>
          <div className="admin-entity-row__meta">
            <span>{customerName}</span>
            <span>{email}</span>
            <span>{formatDateTime(order.createdAt)}</span>
            <span>{timeAgo(order.createdAt)}</span>
          </div>
        </div>
        <div className="admin-entity-row__aside">
          <span className="admin-entity-row__eyebrow">Total</span>
          <div className="admin-entity-row__value">{money(order.total)}</div>
        </div>
      </div>

      <div className="admin-entity-row__actions">
        <Button type="button" variant="secondary" size="sm" onClick={onSelect}>
          {isActive ? 'Ocultar resumen' : 'Ver resumen'}
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to={`/admin/orders/${encodeURIComponent(order.id)}`}>Abrir detalle</Link>
        </Button>
        <ActionDropdown
          renderTrigger={({ open, toggle, triggerRef, menuId }) => (
            <Button
              ref={triggerRef}
              type="button"
              variant="ghost"
              size="sm"
              disabled={updatingOrderId === order.id}
              aria-haspopup="menu"
              aria-controls={menuId}
              aria-expanded={open ? 'true' : 'false'}
              onClick={toggle}
            >
              Acciones
            </Button>
          )}
          menuClassName="min-w-[12rem]"
        >
          {(close) => (
            <>
              <Link to={orderPrintHref(order.id)} target="_blank" rel="noreferrer" className="dropdown-item" onClick={close}>
                Imprimir
              </Link>
              <Link to={orderTicketHref(order.id)} target="_blank" rel="noreferrer" className="dropdown-item" onClick={close}>
                Ticket
              </Link>
            </>
          )}
        </ActionDropdown>
        <ActionDropdown
          renderTrigger={({ open, toggle, triggerRef, menuId }) => (
            <Button
              ref={triggerRef}
              type="button"
              variant="default"
              size="sm"
              disabled={updatingOrderId === order.id}
              aria-haspopup="menu"
              aria-controls={menuId}
              aria-expanded={open ? 'true' : 'false'}
              onClick={toggle}
            >
              {updatingOrderId === order.id ? 'Guardando...' : 'Estado'}
            </Button>
          )}
          menuClassName="min-w-[13rem]"
        >
          {(close) => (
            <>
              {ORDER_STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`dropdown-item ${order.status === option.value ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-100' : ''}`}
                  onClick={() => {
                    onChangeStatus(order.id, option.value);
                    close();
                  }}
                  aria-disabled={order.status === option.value || updatingOrderId === order.id ? 'true' : 'false'}
                  disabled={order.status === option.value || updatingOrderId === order.id}
                >
                  {option.label}
                </button>
              ))}
            </>
          )}
        </ActionDropdown>
      </div>

      {isActive ? (
        <div className="admin-entity-row__detail">
          {loadingDetail ? (
            <LoadingBlock label="Cargando detalle del pedido" lines={3} />
          ) : !selectedDetail ? (
            <EmptyState
              title="No se pudo cargar el detalle"
              description="Reintenta la carga o abre el pedido en su vista completa."
              actions={
                <Button type="button" variant="outline" onClick={onReload}>
                  Actualizar listado
                </Button>
              }
            />
          ) : (
            <OrderDetailPanel selectedDetail={selectedDetail} onChangeStatus={onChangeStatus} />
          )}
        </div>
      ) : null}
    </article>
  );
}

function OrderDetailPanel({
  selectedDetail,
  onChangeStatus,
}: {
  selectedDetail: OrderItem;
  onChangeStatus: (orderId: string, status: string) => void;
}) {
  return (
    <div className="space-y-4">
      <section className="nr-stat-grid">
        <MetricCard label="Metodo de pago" value={selectedDetail.paymentMethod || 'Sin definir'} meta="Informacion registrada en la compra" />
        <MetricCard label="Items" value={String(selectedDetail.items.length)} meta="Lineas incluidas en el pedido" />
        <MetricCard label="Actualizado" value={formatDateTime(selectedDetail.updatedAt)} meta="Ultimo cambio registrado" />
        <MetricCard label="Canal" value={selectedDetail.user ? 'Compra web' : 'Venta local'} meta="Origen de la operacion" />
      </section>

      <div className="detail-grid">
        <div className="detail-stack">
          <div className="detail-panel">
            <div className="detail-panel__label">Estado actual</div>
            <div className="mt-3 space-y-3">
              <CustomSelect
                value={selectedDetail.status}
                onChange={(nextStatus) => onChangeStatus(selectedDetail.id, nextStatus)}
                options={ORDER_STATUS_OPTIONS}
                className="w-full"
                triggerClassName="min-h-11 rounded-[1rem]"
                ariaLabel="Estado del pedido"
              />
              <StatusBadge label={orderStatusLabel(selectedDetail.status)} tone={orderStatusTone(selectedDetail.status)} />
            </div>
          </div>
          <div className="detail-panel">
            <div className="detail-panel__label">Cliente</div>
            <div className="detail-panel__value">
              <div className="font-semibold text-zinc-900">{selectedDetail.user?.name || 'Venta local'}</div>
              <div>{selectedDetail.user?.email || 'Sin email asociado'}</div>
            </div>
          </div>
        </div>

        <div className="detail-panel">
          <div className="detail-panel__label">Items del pedido</div>
          <div className="mt-3 line-list">
            {selectedDetail.items.map((line) => (
              <div key={line.id} className="line-item">
                <div className="line-item__main">
                  <div className="line-item__title">{line.name}</div>
                  <div className="line-item__meta">
                    Cantidad {line.quantity} · Unitario {money(line.unitPrice)}
                  </div>
                </div>
                <div className="line-item__total">{money(line.lineTotal)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
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

function CounterChip({
  label,
  count,
  icon,
}: {
  label: string;
  count: number;
  icon: ReactNode;
}) {
  return (
    <div className="counter-chip">
      {icon}
      <span>{label}</span>
      <span className="counter-chip__count">{count}</span>
    </div>
  );
}
