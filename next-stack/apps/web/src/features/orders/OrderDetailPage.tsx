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
    ordersApi.myOrder(id)
      .then((res) => { if (active) setOrder(res.item); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Error cargando pedido'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h1 className="text-2xl font-black tracking-tight">Detalle de pedido</h1>
          <Button variant="outline" asChild><Link to="/orders">← Mis pedidos</Link></Button>
        </div>
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">Cargando detalle...</div>
        ) : error || !order ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900 shadow-sm">{error || 'Pedido no encontrado'}</div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">Pedido</div>
                <div className="font-black text-zinc-900">{order.id}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-zinc-600">{order.status}</div>
                <div className="text-2xl font-black text-zinc-900">${order.total.toLocaleString('es-AR')}</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-zinc-600">Pago: <span className="font-semibold text-zinc-900">{order.paymentMethod || '—'}</span></div>
            <div className="mt-4 space-y-2">
              {order.items.map((line) => (
                <div key={line.id} className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 p-3">
                  <div>
                    <div className="font-bold text-zinc-900">{line.name}</div>
                    <div className="text-xs text-zinc-500">{line.quantity} x ${line.unitPrice.toLocaleString('es-AR')}</div>
                  </div>
                  <div className="font-black text-zinc-900">${line.lineTotal.toLocaleString('es-AR')}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
