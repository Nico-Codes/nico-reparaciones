import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ordersApi } from './api';
import type { OrderItem } from './types';

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    ordersApi
      .myOrder(id)
      .then((res) => {
        if (active) setOrder(res.item);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Error cargando pedido');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="store-shell">
      <section className="page-head store-hero">
        <div>
          <div className="page-title">Detalle de pedido</div>
          <p className="page-subtitle">Revisá estado, pago e items de tu compra.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/orders">← Mis pedidos</Link>
        </Button>
      </section>

      {loading ? (
        <div className="card">
          <div className="card-body">Cargando detalle...</div>
        </div>
      ) : error || !order ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900 shadow-sm">
          {error || 'Pedido no encontrado'}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="card">
            <div className="card-body">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">Pedido</div>
                  <div className="font-black text-zinc-900">{order.id}</div>
                  <div className="mt-1 text-xs text-zinc-500">{new Date(order.createdAt).toLocaleString('es-AR')}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-zinc-600">{order.status}</div>
                  <div className="text-2xl font-black text-zinc-900">${order.total.toLocaleString('es-AR')}</div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
                Pago: <span className="font-semibold text-zinc-900">{order.paymentMethod || '—'}</span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-body">
              <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">Resumen</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <InfoCard label="Estado" value={order.status} />
                <InfoCard label="Total" value={`$${order.total.toLocaleString('es-AR')}`} />
              </div>
            </div>
          </section>

          <section className="card lg:col-span-2">
            <div className="card-body">
              <div className="mb-2 text-sm font-bold text-zinc-700">Items</div>
              <div className="space-y-2">
                {order.items.map((line) => (
                  <div key={line.id} className="rounded-xl border border-zinc-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-zinc-900">{line.name}</div>
                        <div className="text-xs text-zinc-500">
                          {line.quantity} x ${line.unitPrice.toLocaleString('es-AR')}
                        </div>
                      </div>
                      <div className="text-sm font-black text-zinc-900">${line.lineTotal.toLocaleString('es-AR')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
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
