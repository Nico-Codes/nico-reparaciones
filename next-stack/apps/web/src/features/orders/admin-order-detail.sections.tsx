import { ArrowLeft, PackageCheck, ReceiptText, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { type AdminOrderDetailFact, type AdminOrderDetailView, ORDER_STATUS_OPTIONS, money } from './admin-order-detail.helpers';
import { orderProgressSteps } from './order-ui';
import type { OrderItem } from './types';

export function AdminOrderDetailLoadingState() {
  return (
    <PageShell context="admin">
      <PageHeader
        context="admin"
        eyebrow="Pedidos"
        title="Cargando detalle"
        subtitle="Estamos preparando la información completa del pedido."
        actions={<StatusBadge label="Cargando" tone="info" />}
      />
      <SectionCard>
        <LoadingBlock label="Cargando pedido" lines={6} />
      </SectionCard>
    </PageShell>
  );
}

export function AdminOrderDetailUnavailableState({ error }: { error: string }) {
  return (
    <PageShell context="admin">
      <PageHeader
        context="admin"
        eyebrow="Pedidos"
        title="Pedido no disponible"
        subtitle="No pudimos recuperar el detalle solicitado."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/orders">
              <ArrowLeft className="h-4 w-4" />
              Volver a pedidos
            </Link>
          </Button>
        }
      />
      <SectionCard>
        <EmptyState
          icon={<ReceiptText className="h-5 w-5" />}
          title={error}
          description="Volvé al listado para revisar otro pedido o reintentá la carga desde el panel."
          actions={
            <Button asChild>
              <Link to="/admin/orders">Ir al listado</Link>
            </Button>
          }
        />
      </SectionCard>
    </PageShell>
  );
}

export function AdminOrderDetailNotFoundState() {
  return (
    <PageShell context="admin">
      <PageHeader
        context="admin"
        eyebrow="Pedidos"
        title="Pedido no encontrado"
        subtitle="El registro solicitado no está disponible en este momento."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/orders">Volver a pedidos</Link>
          </Button>
        }
      />
      <SectionCard>
        <EmptyState
          icon={<ShoppingBag className="h-5 w-5" />}
          title="No encontramos el pedido"
          description="Revisá el listado completo y abrí otro pedido desde la grilla principal."
        />
      </SectionCard>
    </PageShell>
  );
}

export function AdminOrderDetailHeaderActions({ view }: { view: AdminOrderDetailView }) {
  return (
    <>
      <StatusBadge label={view.statusLabel} tone={view.statusTone} />
      <Button asChild variant="outline" size="sm">
        <Link to="/admin/orders">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a href={view.printHref} target="_blank" rel="noreferrer">
          Imprimir
        </a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a href={view.ticketHref} target="_blank" rel="noreferrer">
          Ticket
        </a>
      </Button>
    </>
  );
}

export function AdminOrderDetailMetrics({ view }: { view: AdminOrderDetailView }) {
  return (
    <section className="nr-stat-grid">
      {view.metrics.map((metric) => (
        <div key={metric.label} className="nr-stat-card">
          <div className="nr-stat-card__label">{metric.label}</div>
          <div className="nr-stat-card__value">{metric.value}</div>
          <div className="nr-stat-card__meta">{metric.meta}</div>
        </div>
      ))}
    </section>
  );
}

export function AdminOrderDetailAlerts({ error, notice }: { error: string; notice: string }) {
  return (
    <>
      {error ? (
        <div className="ui-alert ui-alert--danger" data-reveal>
          <ReceiptText className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No se pudo completar la acción</span>
            <div className="ui-alert__text">{error}</div>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div className="ui-alert ui-alert--success" data-reveal>
          <PackageCheck className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Estado guardado</span>
            <div className="ui-alert__text">{notice}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function AdminOrderDetailBody({
  item,
  status,
  saving,
  view,
  onStatusChange,
  onSaveStatus,
}: {
  item: OrderItem;
  status: string;
  saving: boolean;
  view: AdminOrderDetailView;
  onStatusChange: (value: string) => void;
  onSaveStatus: () => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.8fr)]">
      <div className="space-y-5">
        <SectionCard
          title="Seguimiento"
          description="Estado actual del pedido y próximos pasos para el retiro o cierre de la operación."
          actions={<StatusBadge label={view.statusLabel} tone={view.statusTone} size="sm" />}
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
            <ProgressSteps items={orderProgressSteps(item.status)} />

            <div className="account-stack">
              <div className="summary-box">
                <div className="summary-box__label">Resumen operativo</div>
                <div className="summary-box__value">{money(item.total)}</div>
                <div className="summary-box__hint">
                  {view.channelLabel}. {item.items.length} líneas y {view.totalItems} unidades registradas.
                </div>
              </div>

              <div className={`ui-alert ${view.statusAlertClassName}`}>
                <PackageCheck className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <span className="ui-alert__title">{view.statusLabel}</span>
                  <div className="ui-alert__text">{view.statusSummary}</div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Productos del pedido"
          description="Detalle completo de los artículos incluidos, con precio unitario y subtotal."
          actions={<StatusBadge label={`${item.items.length} líneas`} tone="info" size="sm" />}
        >
          <div className="line-list">
            {item.items.map((line) => (
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
        <SectionCard title="Cliente y operación" description="Datos principales del pedido para gestionar seguimiento y retiro.">
          <div className="fact-list">
            {view.facts.map((fact) => (
              <FactRow key={fact.label} fact={fact} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Actualizar estado" description="Guardá cambios de estado sin salir del detalle.">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-bold text-zinc-700">Estado del pedido</label>
              <CustomSelect
                value={status}
                onChange={onStatusChange}
                options={ORDER_STATUS_OPTIONS}
                className="w-full"
                triggerClassName="min-h-10 rounded-xl"
                ariaLabel="Estado del pedido"
              />
            </div>
            <Button type="button" onClick={onSaveStatus} disabled={saving} className="w-full justify-center">
              {saving ? 'Guardando...' : 'Guardar estado'}
            </Button>
          </div>
        </SectionCard>

        <SectionCard tone="muted" title="Siguiente paso" description="Usá este panel para revisar la operación y mantener el estado al día.">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Button asChild variant="outline" className="w-full justify-center">
              <a href={view.printHref} target="_blank" rel="noreferrer">
                Imprimir comprobante
              </a>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-center">
              <a href={view.ticketHref} target="_blank" rel="noreferrer">
                Abrir ticket
              </a>
            </Button>
          </div>
        </SectionCard>
      </aside>
    </div>
  );
}

function FactRow({ fact }: { fact: AdminOrderDetailFact }) {
  return (
    <div className="fact-row">
      <div className="fact-label">{fact.label}</div>
      <div className="fact-value fact-value--text">{fact.value}</div>
    </div>
  );
}
