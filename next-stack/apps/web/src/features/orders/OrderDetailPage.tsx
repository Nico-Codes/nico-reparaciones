import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, PackageCheck, ShoppingBag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { ordersApi } from './api';
import {
  formatDateTime,
  money,
  orderCode,
  orderProgressSteps,
  orderStatusLabel,
  orderStatusSummary,
  orderStatusTone,
  paymentMethodLabel,
} from './order-ui';
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
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar el pedido.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const totalItems = useMemo(
    () => order?.items.reduce((accumulator, line) => accumulator + line.quantity, 0) ?? 0,
    [order],
  );

  if (loading) {
    return (
      <PageShell context="account">
        <PageHeader
          context="account"
          eyebrow="Pedidos"
          title="Cargando detalle"
          subtitle="Estamos preparando la información completa del pedido."
          actions={<StatusBadge label="Cargando" tone="info" />}
        />
        <SectionCard>
          <LoadingBlock label="Cargando pedido" lines={5} />
        </SectionCard>
      </PageShell>
    );
  }

  if (error || !order) {
    return (
      <PageShell context="account">
        <PageHeader
          context="account"
          eyebrow="Pedidos"
          title="Pedido no disponible"
          subtitle="No pudimos recuperar el detalle solicitado."
          actions={
            <Button asChild variant="outline" size="sm">
              <Link to="/orders">
                <ArrowLeft className="h-4 w-4" />
                Volver a pedidos
              </Link>
            </Button>
          }
        />
        <SectionCard>
          <EmptyState
            icon={<AlertTriangle className="h-5 w-5" />}
            title={error || 'Pedido no encontrado'}
            description="Volvé al listado de pedidos para revisar otra compra o retomar el flujo desde la tienda."
            actions={
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/orders">Ir a mis pedidos</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/store">Ir a la tienda</Link>
                </Button>
              </div>
            }
          />
        </SectionCard>
      </PageShell>
    );
  }

  const statusLabel = orderStatusLabel(order.status);
  const statusTone = orderStatusTone(order.status);
  const statusSummary = orderStatusSummary(order.status);
  const paymentLabel = paymentMethodLabel(order.paymentMethod);

  return (
    <PageShell context="account">
      <PageHeader
        context="account"
        eyebrow={`Pedido ${orderCode(order.id)}`}
        title="Detalle del pedido"
        subtitle={statusSummary}
        actions={
          <>
            <StatusBadge label={statusLabel} tone={statusTone} />
            <Button asChild variant="outline" size="sm">
              <Link to="/orders">
                <ArrowLeft className="h-4 w-4" />
                Mis pedidos
              </Link>
            </Button>
          </>
        }
      />

      <div className="account-layout">
        <div className="account-stack">
          <SectionCard
            title="Estado y próximos pasos"
            description="Seguimiento del pedido para que veas en qué punto está y qué esperar después."
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)]">
              <ProgressSteps items={orderProgressSteps(order.status)} />

              <div className="account-stack">
                <div className="summary-box">
                  <div className="summary-box__label">Total del pedido</div>
                  <div className="summary-box__value">{money(order.total)}</div>
                  <div className="summary-box__hint">
                    {totalItems} unidades distribuidas en {order.items.length} líneas.
                  </div>
                </div>

                <div className={`ui-alert ${order.status === 'CANCELADO' ? 'ui-alert--danger' : order.status === 'LISTO_RETIRO' ? 'ui-alert--success' : 'ui-alert--info'}`}>
                  <PackageCheck className="mt-0.5 h-4 w-4 flex-none" />
                  <div>
                    <span className="ui-alert__title">{statusLabel}</span>
                    <div className="ui-alert__text">{statusSummary}</div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Productos del pedido"
            description="Detalle de cada producto incluido en la compra con cantidad y subtotal."
            actions={<StatusBadge tone="info" size="sm" label={`${order.items.length} líneas`} />}
          >
            <div className="line-list">
              {order.items.map((line) => (
                <div key={line.id} className="line-item">
                  <div className="line-item__main">
                    <div className="line-item__title">{line.name}</div>
                    <div className="line-item__meta">
                      {line.quantity} × {money(line.unitPrice)}
                    </div>
                  </div>
                  <div className="line-item__total">{money(line.lineTotal)}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <aside className="account-stack account-sticky">
          <SectionCard title="Resumen" description="Datos principales del pedido y del retiro.">
            <div className="fact-list">
              <FactRow label="Código" value={orderCode(order.id)} />
              <FactRow label="Fecha de compra" value={formatDateTime(order.createdAt)} />
              <FactRow label="Última actualización" value={formatDateTime(order.updatedAt)} />
              <FactRow label="Estado" value={statusLabel} />
              <FactRow label="Pago" value={paymentLabel} />
              <FactRow label="Canal" value={order.isQuickSale ? 'Venta rápida' : 'Compra web'} />
            </div>
          </SectionCard>

          <SectionCard tone="muted" title="Ayuda" description="Si necesitás ajustar algo, podés volver a la tienda o revisar el listado completo.">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <Button asChild variant="outline" className="w-full justify-center">
                <Link to="/orders">Ver todos mis pedidos</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-center">
                <Link to="/store">
                  <ShoppingBag className="h-4 w-4" />
                  Seguir comprando
                </Link>
              </Button>
            </div>
          </SectionCard>
        </aside>
      </div>
    </PageShell>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact-row">
      <div className="fact-label">{label}</div>
      <div className="fact-value">{value}</div>
    </div>
  );
}
