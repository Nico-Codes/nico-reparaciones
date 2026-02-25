import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [showStatusBar, setShowStatusBar] = useState(false);

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

  const whatsappCounters = useMemo(() => {
    const pending = items.filter((o) => o.status === 'PENDIENTE').length;
    const sent = items.filter((o) => o.status === 'CONFIRMADO' || o.status === 'PREPARANDO' || o.status === 'LISTO_RETIRO').length;
    const noPhone = items.filter((o) => !o.user?.email).length;
    return {
      all: items.length,
      pending,
      sent,
      noPhone,
    };
  }, [items]);

  return (
    <div className="store-shell">
      <section className="page-head store-hero">
        <div>
          <div className="page-title">Pedidos (Admin)</div>
          <p className="page-subtitle">Listado y control rápido de pedidos.</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar: #id, nombre, teléfono..."
            className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm sm:flex-1 sm:min-w-[260px] md:w-[320px] md:flex-none"
          />
          <button type="button" className="btn-primary !h-11 !rounded-2xl px-5" onClick={() => void load()}>
            Filtrar
          </button>
          <button type="button" className="btn-ghost !h-11 !rounded-2xl px-2" onClick={() => setStatusFilter(statusFilter ? '' : 'PENDIENTE')}>
            Ver filtros
          </button>
        </div>
      </section>

      <div className="mt-5 flex items-center justify-between gap-2">
        <div className="text-xs font-black uppercase tracking-wide text-zinc-500">Estados</div>
        <button
          type="button"
          onClick={() => setShowStatusBar((v) => !v)}
          className="text-sm font-bold text-zinc-900 hover:text-sky-700"
        >
          {showStatusBar ? 'Ocultar estados' : 'Ver estados'}
        </button>
      </div>

      {showStatusBar ? (
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
      ) : null}

      {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

      <div className="mt-4">
        <section className="space-y-3">
          {loading ? (
            <div className="card"><div className="card-body text-sm">Cargando pedidos...</div></div>
          ) : items.length === 0 ? (
            <div className="card"><div className="card-body text-sm">No hay pedidos.</div></div>
          ) : (
            items.map((order) => (
              <div
                key={order.id}
                className={`card transition ${selectedId === order.id ? 'ring-2 ring-sky-200' : ''}`}
              >
                <div className="card-body !p-4 md:!p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedId(order.id)}
                          className="text-left text-[1.05rem] font-black tracking-tight text-zinc-900 hover:text-sky-700"
                        >
                          Pedido #{order.id.slice(0, 6)}
                        </button>
                        <span className={`inline-flex h-7 items-center rounded-full border px-3 text-sm font-bold ${orderStatusBadgeClass(order.status)}`}>
                          {orderStatusLabel(order.status)}
                        </span>
                        <span className="inline-flex h-7 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold text-zinc-800">
                          {order.user ? 'web' : 'local'}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-zinc-700">
                        <span className="font-bold text-zinc-900">{order.user?.name || 'Venta rápida'}</span>
                        <span className="text-zinc-500"> · </span>
                        <span>{detail?.id === order.id && detail.user?.email ? detail.user.email : (order.user?.email || 'sin usuario')}</span>
                        <span className="text-zinc-500"> · </span>
                        <span>{new Date(order.createdAt).toLocaleDateString('es-AR')} {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-zinc-500"> · </span>
                        <span className="font-bold text-zinc-800">hace unos segundos</span>
                      </div>
                    </div>
                    <div className="min-w-[116px] text-right">
                      <div className="text-xs font-black uppercase tracking-wide text-zinc-500">TOTAL</div>
                      <div className="text-[1.05rem] font-black tracking-tight text-zinc-900">${order.total.toLocaleString('es-AR')}</div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center justify-end gap-2">
                    <Link to={`/admin/orders/${encodeURIComponent(order.id)}`} className="btn-outline !h-10 !rounded-2xl px-4 text-sm font-bold shadow-none">
                      Abrir
                    </Link>
                    <button type="button" className="inline-flex h-10 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700">
                      WhatsApp
                    </button>
                    <button type="button" className="inline-flex h-10 items-center justify-center rounded-2xl border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-700">
                      WA pendiente
                    </button>
                    <button type="button" className="btn-ghost !h-10 !rounded-2xl px-2.5 text-lg leading-none shadow-none">
                      …
                    </button>
                    <button type="button" onClick={() => setSelectedId(order.id)} className="btn-primary !h-10 !rounded-2xl px-4 text-sm font-bold">
                      Estado
                    </button>
                  </div>

                  {selectedId === order.id ? (
                    <div className="mt-4 border-t border-zinc-100 pt-4">
                      {loadingDetail ? (
                        <div className="rounded-xl border border-zinc-200 p-4 text-sm">Cargando detalle...</div>
                      ) : !detail || detail.id !== order.id ? (
                        <div className="rounded-xl border border-zinc-200 p-4 text-sm">No se pudo cargar el detalle.</div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            <InfoCard label="Total" value={`$${detail.total.toLocaleString('es-AR')}`} />
                            <InfoCard label="Método" value={detail.paymentMethod || 'sin método'} />
                            <InfoCard label="Items" value={String(detail.items.length)} />
                            <InfoCard label="Fecha" value={new Date(detail.createdAt).toLocaleDateString('es-AR')} />
                          </div>

                          <div className="grid gap-3 lg:grid-cols-[240px_1fr]">
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
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}

          <div className="mt-1 flex flex-wrap gap-2">
            <WhatsappChip active label="WhatsApp: Todos" count={whatsappCounters.all} />
            <WhatsappChip label="WA pendiente" count={whatsappCounters.pending} />
            <WhatsappChip label="WA enviado" count={whatsappCounters.sent} />
            <WhatsappChip label="Sin teléfono" count={whatsappCounters.noPhone} />
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

function WhatsappChip({ label, count, active = false }: { label: string; count: number; active?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition ${
        active
          ? 'border-sky-300 bg-sky-50 text-sky-900'
          : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300'
      }`}
    >
      <span>{label}</span>
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-zinc-200 bg-white px-1 text-[11px] font-black text-zinc-700">
        {count}
      </span>
    </button>
  );
}

