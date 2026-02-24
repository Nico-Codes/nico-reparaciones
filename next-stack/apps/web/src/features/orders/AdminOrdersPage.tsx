import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ordersApi } from './api';
import type { OrderItem } from './types';

const ORDER_STATUSES = ['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'LISTO_RETIRO', 'ENTREGADO', 'CANCELADO'] as const;

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

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Admin Pedidos (Next)</h1>
            <p className="mt-1 text-sm text-zinc-600">Listado, filtros, detalle y cambio de estado (MVP).</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/admin">Volver a admin</Link>
          </Button>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 grid gap-2 md:grid-cols-[1fr_220px]">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por ID, cliente, email, producto..."
                className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
              />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm">
                <option value="">Todos los estados</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              <InfoCard label="Pedidos listados" value={String(totals.count)} />
              <InfoCard label="Total listado" value={`$${totals.total.toLocaleString('es-AR')}`} />
            </div>

            {loading ? (
              <div className="rounded-xl border border-zinc-200 p-3 text-sm">Cargando pedidos...</div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 p-3 text-sm">No hay pedidos.</div>
            ) : (
              <div className="space-y-2">
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
                        <div className="mt-1 text-xs text-zinc-500 truncate">
                          {order.items.slice(0, 2).map((i) => i.name).join(' · ')}
                          {order.items.length > 2 ? ` +${order.items.length - 2}` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-zinc-900">${order.total.toLocaleString('es-AR')}</div>
                        <div className="text-xs text-zinc-500">{new Date(order.createdAt).toLocaleString('es-AR')}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700">{order.status}</span>
                      <span className="text-xs text-zinc-500">{order.paymentMethod || 'sin método'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            {!selectedId ? (
              <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">Seleccioná un pedido para ver el detalle.</div>
            ) : loadingDetail ? (
              <div className="rounded-xl border border-zinc-200 p-4 text-sm">Cargando detalle...</div>
            ) : !detail ? (
              <div className="rounded-xl border border-zinc-200 p-4 text-sm">No se pudo cargar el detalle.</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">Pedido</div>
                  <div className="mt-1 text-sm font-black break-all text-zinc-900">{detail.id}</div>
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
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
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
          </section>
        </div>
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

