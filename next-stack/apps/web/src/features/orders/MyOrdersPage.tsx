import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { ordersApi } from './api';
import type { OrderItem } from './types';

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  READY_PICKUP: 'Listo para retirar',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const ORDER_STATUS_TONES: Record<string, 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'danger'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PREPARING: 'accent',
  READY_PICKUP: 'success',
  DELIVERED: 'neutral',
  CANCELLED: 'danger',
};

export function MyOrdersPage() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    ordersApi
      .myOrders()
      .then((res) => {
        if (active) setItems(res.items);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudieron cargar tus pedidos.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <PageShell context="account">
      <PageHeader
        context="account"
        eyebrow="Pedidos"
        title="Seguimiento de compras"
        subtitle="Consulta el historial de compras y el estado actual de cada pedido."
        actions={
          <Button variant="outline" asChild>
            <Link to="/store">Ir a la tienda</Link>
          </Button>
        }
      />

      {error ? (
        <SectionCard tone="info" className="border-rose-200 bg-rose-50">
          <div className="text-sm font-semibold text-rose-700">{error}</div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Mis pedidos"
        description="Listado cronológico con estado, fecha y total."
        actions={items.length > 0 ? <StatusBadge tone="info" size="sm" label={`${items.length} registros`} /> : null}
      >
        {loading ? (
          <LoadingBlock lines={5} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Todavía no hiciste pedidos"
            description="Cuando completes una compra, aparecerá aquí con su estado y total."
            actions={
              <Button asChild>
                <Link to="/store">Explorar productos</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3">
            {items.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-4 transition hover:-translate-y-0.5 hover:border-zinc-200 hover:bg-white hover:shadow-[0_16px_34px_-24px_rgba(15,23,42,0.35)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-extrabold text-zinc-950">
                      Pedido #{order.id.slice(0, 8)}
                    </div>
                    <div className="text-sm text-zinc-600">
                      {new Date(order.createdAt).toLocaleString('es-AR')}
                    </div>
                  </div>

                  <div className="text-right">
                    <StatusBadge
                      tone={ORDER_STATUS_TONES[order.status] ?? 'neutral'}
                      size="sm"
                      label={ORDER_STATUS_LABELS[order.status] ?? order.status}
                    />
                    <div className="mt-2 text-lg font-black tracking-tight text-zinc-950">
                      $ {order.total.toLocaleString('es-AR')}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  );
}
