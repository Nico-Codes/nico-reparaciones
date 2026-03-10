import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { ordersApi } from './api';
import { formatDateTime, money, orderCode, orderStatusLabel, orderStatusSummary, orderStatusTone, paymentMethodLabel } from './order-ui';
import type { OrderItem } from './types';

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
    <PageShell context="account" data-my-orders-page>
      <PageHeader
        context="account"
        eyebrow="Pedidos"
        title="Seguimiento de compras"
        subtitle="Consultá el historial de compras y el estado actual de cada pedido desde tu cuenta."
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
        title="Historial de pedidos"
        description="Listado cronológico con estado, fecha de compra y total del pedido."
        actions={items.length > 0 ? <StatusBadge tone="info" size="sm" label={`${items.length} registros`} /> : null}
      >
        {loading ? (
          <LoadingBlock lines={5} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-5 w-5" />}
            title="Todavía no hiciste pedidos"
            description="Cuando completes una compra, aparecerá acá con su estado, total y acceso al detalle."
            actions={
              <Button asChild>
                <Link to="/store">Explorar productos</Link>
              </Button>
            }
          />
        ) : (
          <div className="account-list">
            {items.map((order) => (
              <article key={order.id} className="account-record">
                <div className="account-record__top">
                  <div className="account-record__heading">
                    <div className="account-record__title-row">
                      <div className="account-record__title">Pedido {orderCode(order.id)}</div>
                      <StatusBadge
                        tone={orderStatusTone(order.status)}
                        size="sm"
                        label={orderStatusLabel(order.status)}
                      />
                      <StatusBadge
                        tone={order.user ? 'info' : 'neutral'}
                        size="sm"
                        label={order.user ? 'Compra web' : 'Venta local'}
                      />
                    </div>
                    <div className="account-record__meta">
                      <span>{formatDateTime(order.createdAt)}</span>
                      <span>{order.items.length} ítems</span>
                    </div>
                    <div className="account-record__description">
                      {orderStatusSummary(order.status)}
                    </div>
                  </div>

                  <div className="account-record__aside">
                    <span className="account-record__label">Total</span>
                    <div className="account-record__value">{money(order.total)}</div>
                  </div>
                </div>

                <div className="account-record__actions">
                  <div className="account-record__actions-group">
                    <StatusBadge
                      tone={order.paymentMethod ? 'neutral' : 'warning'}
                      size="sm"
                      label={paymentMethodLabel(order.paymentMethod)}
                    />
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/orders/${order.id}`}>Ver detalle</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  );
}
