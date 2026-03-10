import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, PackageCheck, ReceiptText, ShoppingBag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
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

const ORDER_STATUSES = ['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'LISTO_RETIRO', 'ENTREGADO', 'CANCELADO'] as const;

const ORDER_STATUS_OPTIONS = ORDER_STATUSES.map((status) => ({
  value: status,
  label: orderStatusLabel(status),
}));

export function AdminOrderDetailPage() {
  const { id = '' } = useParams();
  const [item, setItem] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState('PENDIENTE');
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await ordersApi.adminOrder(id);
      setItem(res.item);
      setStatus(res.item.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el pedido.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function saveStatus() {
    if (!item) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await ordersApi.adminUpdateStatus(item.id, status);
      setItem(res.item);
      setStatus(res.item.status);
      setNotice('Estado actualizado correctamente.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el estado.');
    } finally {
      setSaving(false);
    }
  }

  const totalItems = useMemo(
    () => item?.items.reduce((accumulator, line) => accumulator + line.quantity, 0) ?? 0,
    [item],
  );

  if (loading) {
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

  if (error && !item) {
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

  if (!item) {
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

  const statusLabel = orderStatusLabel(item.status);
  const statusTone = orderStatusTone(item.status);
  const statusSummary = orderStatusSummary(item.status);
  const customerLabel = item.user?.name || 'Venta rápida';
  const contactLabel = item.user?.email || 'Sin contacto registrado';
  const channelLabel = item.isQuickSale ? 'Venta rápida' : 'Compra web';
  const paymentLabel = paymentMethodLabel(item.paymentMethod);

  return (
    <PageShell context="admin" className="space-y-5">
      <PageHeader
        context="admin"
        eyebrow="Pedidos"
        title={`Pedido ${orderCode(item.id)}`}
        subtitle={`${customerLabel} · ${formatDateTime(item.createdAt)}`}
        actions={
          <>
            <StatusBadge label={statusLabel} tone={statusTone} />
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/orders">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/admin/orders/${item.id}/print`} target="_blank" rel="noreferrer">Imprimir</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/admin/orders/${item.id}/ticket`} target="_blank" rel="noreferrer">Ticket</a>
            </Button>
          </>
        }
      />

      <div className="nr-stat-grid">
        <div className="nr-stat-card">
          <div className="nr-stat-card__label">Total</div>
          <div className="nr-stat-card__value">{money(item.total)}</div>
          <div className="nr-stat-card__meta">Importe confirmado del pedido.</div>
        </div>
        <div className="nr-stat-card">
          <div className="nr-stat-card__label">Ítems</div>
          <div className="nr-stat-card__value">{totalItems}</div>
          <div className="nr-stat-card__meta">{item.items.length} líneas en la operación.</div>
        </div>
        <div className="nr-stat-card">
          <div className="nr-stat-card__label">Canal</div>
          <div className="nr-stat-card__value">{channelLabel}</div>
          <div className="nr-stat-card__meta">{paymentLabel}</div>
        </div>
      </div>

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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.8fr)]">
        <div className="space-y-5">
          <SectionCard
            title="Seguimiento"
            description="Estado actual del pedido y próximos pasos para el retiro o cierre de la operación."
            actions={<StatusBadge label={statusLabel} tone={statusTone} size="sm" />}
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
              <ProgressSteps items={orderProgressSteps(item.status)} />

              <div className="account-stack">
                <div className="summary-box">
                  <div className="summary-box__label">Resumen operativo</div>
                  <div className="summary-box__value">{money(item.total)}</div>
                  <div className="summary-box__hint">
                    {channelLabel}. {item.items.length} líneas y {totalItems} unidades registradas.
                  </div>
                </div>

                <div className={`ui-alert ${item.status === 'CANCELADO' ? 'ui-alert--danger' : item.status === 'LISTO_RETIRO' ? 'ui-alert--success' : 'ui-alert--info'}`}>
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
              <FactRow label="Código" value={orderCode(item.id)} />
              <FactRow label="Cliente" value={customerLabel} />
              <FactRow label="Contacto" value={contactLabel} />
              <FactRow label="Creado" value={formatDateTime(item.createdAt)} />
              <FactRow label="Última actualización" value={formatDateTime(item.updatedAt)} />
              <FactRow label="Pago" value={paymentLabel} />
              <FactRow label="Canal" value={channelLabel} />
            </div>
          </SectionCard>

          <SectionCard title="Actualizar estado" description="Guardá cambios de estado sin salir del detalle.">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-zinc-700">Estado del pedido</label>
                <CustomSelect
                  value={status}
                  onChange={setStatus}
                  options={ORDER_STATUS_OPTIONS}
                  className="w-full"
                  triggerClassName="min-h-10 rounded-xl"
                  ariaLabel="Estado del pedido"
                />
              </div>
              <Button type="button" onClick={() => void saveStatus()} disabled={saving} className="w-full justify-center">
                {saving ? 'Guardando...' : 'Guardar estado'}
              </Button>
            </div>
          </SectionCard>

          <SectionCard tone="muted" title="Siguiente paso" description="Usá este panel para revisar la operación y mantener el estado al día.">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <Button asChild variant="outline" className="w-full justify-center">
                <a href={`/admin/orders/${item.id}/print`} target="_blank" rel="noreferrer">Imprimir comprobante</a>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-center">
                <a href={`/admin/orders/${item.id}/ticket`} target="_blank" rel="noreferrer">Abrir ticket</a>
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
      <div className="fact-value fact-value--text">{value}</div>
    </div>
  );
}
