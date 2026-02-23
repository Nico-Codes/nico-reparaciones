import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ordersApi } from './api';
import type { OrderItem } from './types';

export function MyOrdersPage() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    ordersApi.myOrders()
      .then((res) => { if (active) setItems(res.items); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Error cargando pedidos'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h1 className="text-2xl font-black tracking-tight">Mis pedidos (Next)</h1>
          <Button variant="outline" asChild><Link to="/store">Ir a tienda</Link></Button>
        </div>
        {error ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">Cargando pedidos...</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">Todavía no hay pedidos.</div>
        ) : (
          <div className="space-y-3">
            {items.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`} className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-black text-zinc-900">Pedido #{order.id.slice(0, 8)}</div>
                    <div className="text-xs text-zinc-500">{new Date(order.createdAt).toLocaleString('es-AR')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-zinc-600">{order.status}</div>
                    <div className="text-lg font-black text-zinc-900">${order.total.toLocaleString('es-AR')}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
