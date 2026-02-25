import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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

function orderStatusBadgeClass(status: (typeof ORDER_STATUSES)[number] | string) {
  switch (status) {
    case 'PENDIENTE':
      return 'badge-amber';
    case 'CONFIRMADO':
      return 'badge-sky';
    case 'PREPARANDO':
      return 'badge-indigo';
    case 'LISTO_RETIRO':
      return 'badge-emerald';
    case 'CANCELADO':
      return 'badge-rose';
    default:
      return 'badge-zinc';
  }
}

function orderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status as (typeof ORDER_STATUSES)[number]] ?? status;
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

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await ordersApi.adminOrders({ q, status: statusFilter || undefined });
      setItems(res.items);
      if (selectedId && !res.items.some((i) => i.id === selectedId)) {
        setSelectedId(null);
        setDetail(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando pedidos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [q, statusFilter]);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingDetail(true);
    void ordersApi
      .adminOrder(selectedId)
      .then((res) => setDetail(res.item))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error cargando detalle'))
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  async function changeStatus(orderId: string, status: string) {
    try {
      const res = await ordersApi.adminUpdateStatus(orderId, status);
      setItems((prev) => prev.map((o) => (o.id === orderId ? res.item : o)));
      setDetail((prev) => (prev?.id === orderId ? res.item : prev));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error actualizando pedido');
    }
  }

  const totals = useMemo(() => {
    const total = items.reduce((acc, i) => acc + i.total, 0);
    return { count: items.length, total };
  }, [items]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    for (const status of ORDER_STATUSES) counts[status] = 0;
    for (const item of items) {
      counts[item.status] = (counts[item.status] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  const statusTabs = [
    { value: '', label: 'Todos', countKey: 'all' },
    { value: 'PENDIENTE', label: 'Pendiente', countKey: 'PENDIENTE' },
    { value: 'CONFIRMADO', label: 'Confirmado', countKey: 'CONFIRMADO' },
    { value: 'PREPARANDO', label: 'Preparando', countKey: 'PREPARANDO' },
    { value: 'LISTO_RETIRO', label: 'Listo', countKey: 'LISTO_RETIRO' },
    { value: 'ENTREGADO', label: 'Entregado', countKey: 'ENTREGADO' },
    { value: 'CANCELADO', label: 'Cancelado', countKey: 'CANCELADO' },
  ] as const;

  return (
    <div className="store-shell">
      <section className="page-head store-hero">
        <div>
          <div className="page-title">Pedidos</div>
          <p className="page-subtitle">Listado y control rápido de pedidos.</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 md:w-auto md:justify-end">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar: #id, cliente, email, producto..."
            className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm sm:flex-1 sm:min-w-[260px] md:w-[320px] md:flex-none"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm sm:w-56">
            <option value="">Todos los estados</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{orderStatusLabel(s)}</option>
            ))}
          </select>
          <Button variant="outline" asChild>
            <Link to="/admin">Volver a admin</Link>
          </Button>
        </div>
      </section>

      <div className="mt-3 flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center">
        <div className="text-xs font-black uppercase text-zinc-500">Estados</div>
        <div className="text-xs text-zinc-500">{totals.count} pedidos listados</div>
      </div>

      <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.countKey}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`nav-pill whitespace-nowrap ${isActive ? 'nav-pill-active' : ''}`}
            >
              <span>{tab.label}</span>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-black ring-1 ring-zinc-200 bg-white/70 text-zinc-700">
                {statusCounts[tab.countKey] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="card">
          <div className="card-head flex items-center justify-between gap-2">
            <div className="font-black">Listado de pedidos</div>
            <div className="text-xs text-zinc-500">Seleccioná un pedido para ver detalle</div>
          </div>
          <div className="card-body">
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              <InfoCard label="Pedidos listados" value={String(totals.count)} />
              <InfoCard label="Total listado" value={`$${totals.total.toLocaleString('es-AR')}`} />
            </div>

            {loading ? (
              <div className="rounded-xl border border-zinc-200 p-3 text-sm">Cargando pedidos...</div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 p-3 text-sm">No hay pedidos.</div>
            ) : (
              <div className="space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">Listado</div>
                {items.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedId(order.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedId === order.id ? 'border-sky-300 bg-sky-50/60' : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-zinc-900">{order.id}</div>
                        <div className="text-xs text-zinc-500">
                          {order.user ? `${order.user.name} · ${order.user.email}` : 'Venta rápida / sin usuario'}
                        </div>
                        <div className="mt-1 truncate text-xs text-zinc-500">
                          {order.items.slice(0, 2).map((i) => i.name).join(' · ')}
                          {order.items.length > 2 ? ` +${order.items.length - 2}` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-zinc-900">${order.total.toLocaleString('es-AR')}</div>
                        <div className="text-xs text-zinc-500">{new Date(order.createdAt).toLocaleString('es-AR')}</div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className={orderStatusBadgeClass(order.status)}>{orderStatusLabel(order.status)}</span>
                      <span className="text-xs text-zinc-500">{order.paymentMethod || 'sin método'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-head flex items-center justify-between gap-2">
            <div className="font-black">Detalle</div>
            {selectedId ? <div className="text-xs text-zinc-500">{selectedId.slice(0, 8)}</div> : null}
          </div>
          <div className="card-body">
            {!selectedId ? (
              <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">Selecciona un pedido para ver el detalle.</div>
            ) : loadingDetail ? (
              <div className="rounded-xl border border-zinc-200 p-4 text-sm">Cargando detalle...</div>
            ) : !detail ? (
              <div className="rounded-xl border border-zinc-200 p-4 text-sm">No se pudo cargar el detalle.</div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">Detalle</div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">Pedido</div>
                <div className="mt-1 break-all text-sm font-black text-zinc-900">{detail.id}</div>
                <div className="mt-1 text-xs text-zinc-500">{new Date(detail.createdAt).toLocaleString('es-AR')}</div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <InfoCard label="Total" value={`$${detail.total.toLocaleString('es-AR')}`} />
                <InfoCard label="Método" value={detail.paymentMethod || 'sin método'} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-zinc-700">Estado</label>
                <select
                  value={detail.status}
                  onChange={(e) => void changeStatus(detail.id, e.target.value)}
                  className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm"
                >
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{orderStatusLabel(s)}</option>)}
                </select>
                <div className="mt-2">
                  <span className={orderStatusBadgeClass(detail.status)}>{orderStatusLabel(detail.status)}</span>
                </div>
              </div>

              <div>
                <div className="mb-1 text-sm font-bold text-zinc-700">Cliente</div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
                  {detail.user ? (
                    <>
                      <div className="font-semibold text-zinc-900">{detail.user.name}</div>
                      <div className="text-zinc-600">{detail.user.email}</div>
                    </>
                  ) : (
                    <div className="text-zinc-600">Sin usuario asociado (posible venta rápida)</div>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-1 text-sm font-bold text-zinc-700">Items</div>
                <div className="space-y-2">
                  {detail.items.map((line) => (
                    <div key={line.id} className="rounded-xl border border-zinc-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-zinc-900">{line.name}</div>
                          <div className="text-xs text-zinc-500">Cant. {line.quantity} · Unit. ${line.unitPrice.toLocaleString('es-AR')}</div>
                        </div>
                        <div className="text-sm font-bold text-zinc-900">${line.lineTotal.toLocaleString('es-AR')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-black text-zinc-900">{value}</div>
    </div>
  );
}

