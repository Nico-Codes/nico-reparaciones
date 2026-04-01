import { AlertTriangle, ArrowLeft, PackageCheck, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { money, orderProgressSteps } from './order-ui';
import type { OrderItem } from './types';
import {
  buildOrderDetailLinesMeta,
  buildOrderDetailStatusMeta,
  buildOrderDetailSummaryFacts,
  resolveOrderDetailAlertTone,
} from './order-detail.helpers';

export function OrderDetailLoading() {
  return (
    <PageShell context="account">
      <PageHeader
        context="account"
        eyebrow="Pedidos"
        title="Cargando detalle"
        subtitle="Estamos preparando la informacion completa del pedido."
        actions={<StatusBadge label="Cargando" tone="info" />}
      />
      <SectionCard>
        <LoadingBlock label="Cargando pedido" lines={5} />
      </SectionCard>
    </PageShell>
  );
}

export function OrderDetailEmpty({ error }: { error: string }) {
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
          description="Volve al listado de pedidos para revisar otra compra o retomar el flujo desde la tienda."
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

export function OrderDetailLayout({ order }: { order: OrderItem }) {
  const status = buildOrderDetailStatusMeta(order);
  const summaryFacts = buildOrderDetailSummaryFacts(order);
  const linesMeta = buildOrderDetailLinesMeta(order);

  return (
    <PageShell context="account">
      <PageHeader
        context="account"
        eyebrow={`Pedido ${status.code}`}
        title="Detalle del pedido"
        subtitle={status.statusSummary}
        actions={
          <>
            <StatusBadge label={status.statusLabel} tone={status.statusTone} />
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
            title="Estado y proximos pasos"
            description="Seguimiento del pedido para que veas en que punto esta y que esperar despues."
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)]">
              <ProgressSteps items={orderProgressSteps(order.status)} />

              <div className="account-stack">
                <div className="summary-box">
                  <div className="summary-box__label">Total del pedido</div>
                  <div className="summary-box__value">{linesMeta.total}</div>
                  <div className="summary-box__hint">
                    {linesMeta.totalItems} unidades distribuidas en {linesMeta.lines} lineas.
                  </div>
                </div>

                <div className={`ui-alert ui-alert--${resolveOrderDetailAlertTone(order.status)}`}>
                  <PackageCheck className="mt-0.5 h-4 w-4 flex-none" />
                  <div>
                    <span className="ui-alert__title">{status.statusLabel}</span>
                    <div className="ui-alert__text">{status.statusSummary}</div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Productos del pedido"
            description="Detalle de cada producto incluido en la compra con cantidad y subtotal."
            actions={<StatusBadge tone="info" size="sm" label={`${linesMeta.lines} lineas`} />}
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
              {summaryFacts.map((fact) => (
                <FactRow key={fact.label} label={fact.label} value={fact.value} />
              ))}
            </div>
          </SectionCard>

          <SectionCard tone="muted" title="Ayuda" description="Si necesitas ajustar algo, podes volver a la tienda o revisar el listado completo.">
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
