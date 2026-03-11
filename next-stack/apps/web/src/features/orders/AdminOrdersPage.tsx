import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ClipboardList, MessageSquareMore, PackageCheck, RefreshCcw, Search, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ActionDropdown } from '@/components/ui/action-dropdown';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { ordersApi } from './api';
import type { OrderItem } from './types';

const ORDER_STATUSES = ['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'LISTO_RETIRO', 'ENTREGADO', 'CANCELADO'] as const;
const ORDER_STATUS_LABELS: Record<(typeof ORDER_STATUSES)[number], string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  PREPARANDO: 'Preparando',
  LISTO_RETIRO: 'Listo para retirar',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

type BadgeTone = 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'danger';

function orderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status as (typeof ORDER_STATUSES)[number]] ?? status;
}

function orderStatusTone(status: string): BadgeTone {
  switch (status) {
    case 'PENDIENTE':
      return 'warning';
    case 'CONFIRMADO':
      return 'info';
    case 'PREPARANDO':
      return 'accent';
    case 'LISTO_RETIRO':
      return 'success';
    case 'CANCELADO':
      return 'danger';
    default:
      return 'neutral';
  }
}

const ORDER_STATUS_OPTIONS = ORDER_STATUSES.map((status) => ({
  value: status,
  label: orderStatusLabel(status),
}));

const ORDER_FILTER_OPTIONS = [{ value: '', label: 'Todos los estados' }, ...ORDER_STATUS_OPTIONS];

function orderPrintHref(orderId: string) {
  return `/admin/orders/${encodeURIComponent(orderId)}/print`;
}

function orderTicketHref(orderId: string) {
  return `/admin/orders/${encodeURIComponent(orderId)}/ticket`;
}

function money(value: number) {
  return `$ ${value.toLocaleString('es-AR')}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return `${date.toLocaleDateString('es-AR')} ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
}

function timeAgo(dateIso: string) {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 60) return `hace ${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} día${days === 1 ? '' : 's'}`;
  const weeks = Math.floor(days / 7);
  return `hace ${weeks} semana${weeks === 1 ? '' : 's'}`;
}

export function AdminOrdersPage() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const listRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);

  async function load() {
    const requestId = ++listRequestIdRef.current;
    setLoading(true);
    setError('');
    try {
      const res = await ordersApi.adminOrders({ q, status: statusFilter || undefined });
      if (requestId !== listRequestIdRef.current) return;
      setItems(res.items);
      if (selectedId && !res.items.some((item) => item.id === selectedId)) {
        setSelectedId(null);
        setDetail(null);
      }
    } catch (cause) {
      if (requestId !== listRequestIdRef.current) return;
      setError(cause instanceof Error ? cause.message : 'Error cargando pedidos');
    } finally {
      if (requestId !== listRequestIdRef.current) return;
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [q, statusFilter]);

  useEffect(() => {
    if (!selectedId) return;
    const requestId = ++detailRequestIdRef.current;
    setLoadingDetail(true);
    setDetail(null);
    void ordersApi
      .adminOrder(selectedId)
      .then((response) => {
        if (requestId !== detailRequestIdRef.current) return;
        setDetail(response.item);
      })
      .catch((cause) => {
        if (requestId !== detailRequestIdRef.current) return;
        setError(cause instanceof Error ? cause.message : 'Error cargando el detalle');
      })
      .finally(() => {
        if (requestId !== detailRequestIdRef.current) return;
        setLoadingDetail(false);
      });
  }, [selectedId]);

  async function changeStatus(orderId: string, status: string) {
    if (updatingOrderId === orderId) return;
    try {
      setUpdatingOrderId(orderId);
      const response = await ordersApi.adminUpdateStatus(orderId, status);
      setItems((current) => current.map((order) => (order.id === orderId ? response.item : order)));
      setDetail((current) => (current?.id === orderId ? response.item : current));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error actualizando el pedido');
    } finally {
      setUpdatingOrderId((current) => (current === orderId ? null : current));
    }
  }

  const totals = useMemo(() => ({
    count: items.length,
    total: items.reduce((accumulator, item) => accumulator + item.total, 0),
  }), [items]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    for (const status of ORDER_STATUSES) counts[status] = 0;
    for (const item of items) counts[item.status] = (counts[item.status] ?? 0) + 1;
    return counts;
  }, [items]);

  const statusTabs = [
    { value: '', label: 'Todos', countKey: 'all' },
    { value: 'PENDIENTE', label: 'Pendiente', countKey: 'PENDIENTE' },
    { value: 'CONFIRMADO', label: 'Confirmado', countKey: 'CONFIRMADO' },
    { value: 'PREPARANDO', label: 'Preparando', countKey: 'PREPARANDO' },
    { value: 'LISTO_RETIRO', label: 'Listo para retirar', countKey: 'LISTO_RETIRO' },
    { value: 'ENTREGADO', label: 'Entregado', countKey: 'ENTREGADO' },
    { value: 'CANCELADO', label: 'Cancelado', countKey: 'CANCELADO' },
  ] as const;

  const whatsappCounters = useMemo(() => {
    const pending = items.filter((order) => order.status === 'PENDIENTE').length;
    const inFlow = items.filter((order) => order.status === 'CONFIRMADO' || order.status === 'PREPARANDO' || order.status === 'LISTO_RETIRO').length;
    const withoutEmail = items.filter((order) => !order.user?.email).length;
    return {
      all: items.length,
      pending,
      inFlow,
      withoutEmail,
    };
  }, [items]);

  const selectedDetail = detail && detail.id === selectedId ? detail : null;
  const hasFilters = q.trim().length > 0 || statusFilter.length > 0;

  return (
    <PageShell context="admin" className="space-y-6" data-admin-orders-page>
      <PageHeader
        context="admin"
        eyebrow="Operación comercial"
        title="Pedidos"
        subtitle="Seguimiento, cambio de estado y revisión rápida del detalle sin salir del listado."
        actions={(
          <>
            <StatusBadge label={`${totals.count} pedidos`} tone="info" />
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </Button>
          </>
        )}
      />

      <section className="nr-stat-grid" data-reveal>
        <MetricCard label="Pedidos visibles" value={String(totals.count)} meta="Listado actual según filtros" />
        <MetricCard label="Facturación visible" value={money(totals.total)} meta="Suma de los pedidos cargados" />
        <MetricCard label="Pendientes" value={String(statusCounts.PENDIENTE ?? 0)} meta="Pedidos todavía sin confirmar" />
        <MetricCard label="Listos para retirar" value={String(statusCounts.LISTO_RETIRO ?? 0)} meta="Operaciones listas para entrega" />
      </section>

      <FilterBar
        actions={(
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            {hasFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQ('');
                  setStatusFilter('');
                }}
              >
                Limpiar
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCcw className="h-4 w-4" />
              Recargar
            </Button>
          </div>
        )}
      >
        <TextField
          value={q}
          onChange={(event) => setQ(event.target.value)}
          label="Buscar"
          placeholder="Pedido, cliente o email"
          leadingIcon={<Search className="h-4 w-4" />}
          wrapperClassName="min-w-0 sm:min-w-[18rem]"
        />
        <div className="ui-field min-w-0 sm:min-w-[14rem]">
          <span className="ui-field__label">Estado</span>
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={ORDER_FILTER_OPTIONS}
            className="w-full"
            triggerClassName="min-h-11 rounded-[1rem]"
            ariaLabel="Filtrar pedidos por estado"
          />
        </div>
      </FilterBar>

      <SectionCard
        title="Seguimiento rápido"
        description="Cambios de estado, acceso al detalle y revisión de actividad reciente desde una sola vista."
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
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.countKey}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`status-tab ${isActive ? 'is-active' : ''}`}
              >
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
              description={hasFilters ? 'Prueba con otro estado o quita el texto de búsqueda.' : 'Todavía no hay pedidos registrados en el panel.'}
              actions={hasFilters ? (
                <Button type="button" variant="outline" onClick={() => { setQ(''); setStatusFilter(''); }}>
                  Limpiar filtros
                </Button>
              ) : undefined}
            />
          ) : (
            items.map((order) => {
              const isActive = selectedId === order.id;
              const customerName = order.user?.name || 'Venta local';
              const email = order.user?.email || 'Sin email';
              return (
                <article key={order.id} className={`admin-entity-row ${isActive ? 'is-active' : ''}`}>
                  <div className="admin-entity-row__top">
                    <div className="admin-entity-row__heading">
                      <div className="admin-entity-row__title-row">
                        <button
                          type="button"
                          className="admin-entity-row__title"
                          onClick={() => {
                            setSelectedId((current) => {
                              if (current === order.id) {
                                setDetail(null);
                                return null;
                              }
                              return order.id;
                            });
                          }}
                        >
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
                    <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedId((current) => (current === order.id ? null : order.id))}>
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
                                void changeStatus(order.id, option.value);
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
                          actions={<Button type="button" variant="outline" onClick={() => void load()}>Actualizar listado</Button>}
                        />
                      ) : (
                        <div className="space-y-4">
                          <section className="nr-stat-grid">
                            <MetricCard label="Método de pago" value={selectedDetail.paymentMethod || 'Sin definir'} meta="Información registrada en la compra" />
                            <MetricCard label="Items" value={String(selectedDetail.items.length)} meta="Líneas incluidas en el pedido" />
                            <MetricCard label="Actualizado" value={formatDateTime(selectedDetail.updatedAt)} meta="Último cambio registrado" />
                            <MetricCard label="Canal" value={selectedDetail.user ? 'Compra web' : 'Venta local'} meta="Origen de la operación" />
                          </section>

                          <div className="detail-grid">
                            <div className="detail-stack">
                              <div className="detail-panel">
                                <div className="detail-panel__label">Estado actual</div>
                                <div className="mt-3 space-y-3">
                                  <CustomSelect
                                    value={selectedDetail.status}
                                    onChange={(nextStatus) => void changeStatus(selectedDetail.id, nextStatus)}
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
                      )}
                    </div>
                  ) : null}
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

function CounterChip({
  label,
  count,
  icon,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="counter-chip">
      {icon}
      <span>{label}</span>
      <span className="counter-chip__count">{count}</span>
    </div>
  );
}
