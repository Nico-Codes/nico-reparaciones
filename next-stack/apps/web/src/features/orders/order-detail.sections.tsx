import { AlertTriangle, ArrowLeft, ExternalLink, MessageCircle, PackageCheck, ReceiptText, ShoppingBag, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { money, orderProgressSteps } from './order-ui';
import type { CheckoutTransferDetails, OrderItem } from './types';
import {
  buildOrderDetailLinesMeta,
  orderHasSpecialOrderLines,
  buildOrderReservationSummary,
  buildOrderDetailStatusMeta,
  buildOrderDetailSummaryFacts,
  orderUsesTransferPayment,
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
              <BrandIcon slot="icon_arrow_left" className="h-4 w-4" fallback={<ArrowLeft className="h-4 w-4" />} />
              Volver a pedidos
            </Link>
          </Button>
        }
      />
      <SectionCard>
        <EmptyState
          icon={<BrandIcon slot="icon_alert" className="h-5 w-5" fallback={<AlertTriangle className="h-5 w-5" />} />}
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

export function OrderDetailLayout({
  order,
  transferDetails,
  transferWhatsappUrl,
  reservationWhatsappUrl,
  reservationDialogOpen,
  proofFile,
  proofUploading,
  proofFeedback,
  proofFeedbackTone,
  onProofFileChange,
  onProofUpload,
  onCloseReservationDialog,
}: {
  order: OrderItem;
  transferDetails: CheckoutTransferDetails | null;
  transferWhatsappUrl: string | null;
  reservationWhatsappUrl: string | null;
  reservationDialogOpen: boolean;
  proofFile: File | null;
  proofUploading: boolean;
  proofFeedback: string;
  proofFeedbackTone: 'success' | 'warning';
  onProofFileChange: (file: File | null) => void;
  onProofUpload: () => void;
  onCloseReservationDialog: () => void;
}) {
  const status = buildOrderDetailStatusMeta(order);
  const summaryFacts = buildOrderDetailSummaryFacts(order);
  const linesMeta = buildOrderDetailLinesMeta(order);
  const showTransferDetails = orderUsesTransferPayment(order.paymentMethod);
  const hasSpecialOrderLines = orderHasSpecialOrderLines(order);
  const reservationSummary = hasSpecialOrderLines ? buildOrderReservationSummary(order) : null;

  return (
    <PageShell context="account">
      {reservationDialogOpen && reservationSummary ? (
        <OrderReservationDialog
          order={order}
          reservationSummary={reservationSummary}
          reservationWhatsappUrl={reservationWhatsappUrl}
          onClose={onCloseReservationDialog}
        />
      ) : null}

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
                <BrandIcon slot="icon_arrow_left" className="h-4 w-4" fallback={<ArrowLeft className="h-4 w-4" />} />
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

                {hasSpecialOrderLines ? (
                  <div className="ui-alert ui-alert--info">
                    <BrandIcon slot="icon_package" className="mt-0.5 h-4 w-4 flex-none" fallback={<PackageCheck className="h-4 w-4" />} />
                    <div>
                      <span className="ui-alert__title">Incluye productos por encargue</span>
                      <div className="ui-alert__text">Al menos una linea del pedido se gestiona por proveedor y no descuenta stock local.</div>
                    </div>
                  </div>
                ) : null}

                <div className={`ui-alert ui-alert--${resolveOrderDetailAlertTone(order.status)}`}>
                  <BrandIcon slot="icon_package" className="mt-0.5 h-4 w-4 flex-none" fallback={<PackageCheck className="h-4 w-4" />} />
                  <div>
                    <span className="ui-alert__title">{status.statusLabel}</span>
                    <div className="ui-alert__text">{status.statusSummary}</div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {reservationSummary ? (
            <SectionCard
              title="Reserva por encargo"
              description="Para completar la reserva, envia los datos por WhatsApp y coordina la sena con el local."
              actions={<StatusBadge tone={reservationSummary.statusTone} size="sm" label={reservationSummary.statusLabel} />}
            >
              <div className="grid gap-3 md:grid-cols-3">
                <div className="summary-box">
                  <div className="summary-box__label">Total del pedido</div>
                  <div className="summary-box__value">{money(order.total)}</div>
                </div>
                <div className="summary-box">
                  <div className="summary-box__label">Sena 10%</div>
                  <div className="summary-box__value">{money(reservationSummary.depositAmount)}</div>
                </div>
                <div className="summary-box">
                  <div className="summary-box__label">Reserva hasta</div>
                  <div className="summary-box__value">{reservationSummary.deadlineLabel}</div>
                </div>
              </div>

              <div className="ui-alert ui-alert--info mt-4">
                <BrandIcon slot="icon_package" className="mt-0.5 h-4 w-4 flex-none" fallback={<PackageCheck className="h-4 w-4" />} />
                <div>
                  <span className="ui-alert__title">Condiciones del encargo</span>
                  <div className="ui-alert__text">
                    El producto y el precio quedan reservados por {reservationSummary.reservationDays} dias. Para sostener la reserva se pide una sena del {reservationSummary.depositPercent}%.
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {reservationWhatsappUrl ? (
                  <Button asChild>
                    <a href={reservationWhatsappUrl} target="_blank" rel="noreferrer">
                      <BrandIcon slot="icon_whatsapp" className="h-4 w-4" fallback={<MessageCircle className="h-4 w-4" />} />
                      Enviar datos por WhatsApp
                      <BrandIcon slot="icon_external_link" className="h-4 w-4" fallback={<ExternalLink className="h-4 w-4" />} />
                    </a>
                  </Button>
                ) : (
                  <Button type="button" disabled>
                    <BrandIcon slot="icon_whatsapp" className="h-4 w-4" fallback={<MessageCircle className="h-4 w-4" />} />
                    WhatsApp no configurado
                  </Button>
                )}
              </div>
            </SectionCard>
          ) : null}

          <SectionCard
            title="Productos del pedido"
            description="Detalle de cada producto incluido en la compra con cantidad y subtotal."
            actions={<StatusBadge tone="info" size="sm" label={`${linesMeta.lines} lineas`} />}
          >
            <div className="line-list">
              {order.items.map((line) => (
                <div key={line.id} className="line-item">
                  <div className="line-item__main">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="line-item__title">{line.name}</div>
                      {line.fulfillmentMode === 'SPECIAL_ORDER' ? (
                        <StatusBadge tone="accent" size="sm" label="Por encargue" />
                      ) : null}
                    </div>
                    <div className="line-item__meta">
                      {line.quantity} × {money(line.unitPrice)}
                      {line.selectedColorLabel ? ` · Color ${line.selectedColorLabel}` : ''}
                    </div>
                  </div>
                  <div className="line-item__total">{money(line.lineTotal)}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {showTransferDetails ? (
            <SectionCard
              title="Pago por transferencia"
              description="Aqui ves los datos para pagar y el envio del comprobante una vez registrado el pedido."
              actions={
                <StatusBadge
                  tone={transferDetails?.available ? 'info' : 'warning'}
                  size="sm"
                  label={transferDetails?.available ? 'Datos publicados' : 'Datos pendientes'}
                />
              }
            >
              {transferDetails?.available ? (
                <>
                  <div className="summary-box">
                    <div className="summary-box__label">{transferDetails.title}</div>
                    <div className="summary-box__hint">{transferDetails.description}</div>
                  </div>

                  <div className="checkout-transfer-grid mt-4">
                    {transferDetails.fields.map((field) => (
                      <div key={field.key} className="checkout-transfer-item">
                        <div className="checkout-transfer-item__label">{field.label}</div>
                        <div className="checkout-transfer-item__value">{field.value}</div>
                      </div>
                    ))}
                  </div>

                  {transferDetails.note ? (
                    <div className="checkout-transfer-card__note">{transferDetails.note}</div>
                  ) : null}

                </>
              ) : (
                <div className="ui-alert ui-alert--warning">
                  <BrandIcon slot="icon_alert" className="mt-0.5 h-4 w-4 flex-none" fallback={<AlertTriangle className="h-4 w-4" />} />
                  <div>
                    <span className="ui-alert__title">Transferencia sin datos visibles</span>
                    <div className="ui-alert__text">
                      El pedido quedo marcado como transferencia, pero el negocio todavia no
                      publico alias, CVU u otros datos bancarios.
                    </div>
                  </div>
                </div>
              )}

              <div className="order-transfer-actions">
                <div className="order-transfer-proof-card">
                  <div className="order-transfer-proof-card__header">
                    <div>
                      <div className="order-transfer-proof-card__title">Comprobante</div>
                      <div className="order-transfer-proof-card__description">
                        Sube una imagen o PDF del pago para dejarlo adjunto al pedido.
                      </div>
                    </div>
                    <StatusBadge
                      tone={order.transferProofUrl ? 'success' : 'neutral'}
                      size="sm"
                      label={order.transferProofUrl ? 'Comprobante cargado' : 'Pendiente'}
                    />
                  </div>

                  <div className="order-transfer-proof-card__controls">
                    <label className="order-transfer-proof-picker">
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,.pdf"
                        onChange={(event) => onProofFileChange(event.target.files?.[0] ?? null)}
                        disabled={proofUploading}
                      />
                      <span>{proofFile ? proofFile.name : 'Elegir comprobante'}</span>
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={onProofUpload}
                      disabled={!proofFile || proofUploading}
                    >
                      <BrandIcon slot="icon_upload" className="h-4 w-4" fallback={<Upload className="h-4 w-4" />} />
                      {proofUploading ? 'Subiendo...' : 'Subir comprobante'}
                    </Button>
                    {order.transferProofUrl ? (
                      <Button asChild variant="outline" size="sm">
                        <a href={order.transferProofUrl} target="_blank" rel="noreferrer">
                          <BrandIcon slot="icon_receipt" className="h-4 w-4" fallback={<ReceiptText className="h-4 w-4" />} />
                          Ver comprobante
                        </a>
                      </Button>
                    ) : null}
                  </div>

                  {order.transferProofUploadedAt ? (
                    <div className="order-transfer-proof-card__meta">
                      Ultima carga: {new Date(order.transferProofUploadedAt).toLocaleString('es-AR')}
                    </div>
                  ) : null}

                  {proofFeedback ? (
                    <div className={`ui-alert ui-alert--${proofFeedbackTone}`}>
                      <BrandIcon slot="icon_alert" className="mt-0.5 h-4 w-4 flex-none" fallback={<AlertTriangle className="h-4 w-4" />} />
                      <div>
                        <div className="ui-alert__text">{proofFeedback}</div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="order-transfer-proof-card">
                  <div className="order-transfer-proof-card__header">
                    <div>
                      <div className="order-transfer-proof-card__title">Enviar por WhatsApp</div>
                      <div className="order-transfer-proof-card__description">
                        Si prefieres, manda el comprobante directamente al WhatsApp del local.
                      </div>
                    </div>
                    <StatusBadge
                      tone={transferWhatsappUrl ? 'info' : 'warning'}
                      size="sm"
                      label={transferWhatsappUrl ? 'WhatsApp disponible' : 'WhatsApp no configurado'}
                    />
                  </div>

                  {transferWhatsappUrl ? (
                    <Button asChild variant="outline">
                      <a href={transferWhatsappUrl} target="_blank" rel="noreferrer">
                        <BrandIcon slot="icon_whatsapp" className="h-4 w-4" fallback={<MessageCircle className="h-4 w-4" />} />
                        Enviar comprobante por WhatsApp
                        <BrandIcon slot="icon_external_link" className="h-4 w-4" fallback={<ExternalLink className="h-4 w-4" />} />
                      </a>
                    </Button>
                  ) : (
                    <div className="ui-alert ui-alert--warning">
                      <BrandIcon slot="icon_alert" className="mt-0.5 h-4 w-4 flex-none" fallback={<AlertTriangle className="h-4 w-4" />} />
                      <div>
                        <span className="ui-alert__title">WhatsApp del local no configurado</span>
                        <div className="ui-alert__text">
                          Completa el telefono del local desde configuracion del negocio para habilitar este enlace.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          ) : null}
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
                  <BrandIcon slot="icon_tienda" className="h-4 w-4" fallback={<ShoppingBag className="h-4 w-4" />} />
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

function OrderReservationDialog({
  order,
  reservationSummary,
  reservationWhatsappUrl,
  onClose,
}: {
  order: OrderItem;
  reservationSummary: ReturnType<typeof buildOrderReservationSummary>;
  reservationWhatsappUrl: string | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6" role="presentation">
      <div className="w-full max-w-xl rounded-[2rem] border border-sky-100 bg-white p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="reservation-dialog-title">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-sky-600">Reserva creada</div>
            <h2 id="reservation-dialog-title" className="mt-1 text-2xl font-black text-zinc-950">
              Finaliza la gestion por WhatsApp
            </h2>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>

        <div className="ui-alert ui-alert--info mt-4">
          <BrandIcon slot="icon_whatsapp" className="mt-0.5 h-4 w-4 flex-none" fallback={<MessageCircle className="h-4 w-4" />} />
          <div>
            <span className="ui-alert__title">Necesitamos tus datos por WhatsApp</span>
            <div className="ui-alert__text">
              Para mantener la reserva del pedido, envia el mensaje automatico al local y coordina la sena del {reservationSummary.depositPercent}%.
            </div>
          </div>
        </div>

        <div className="meta-grid mt-4">
          <div className="meta-tile">
            <div className="meta-tile__label">Pedido</div>
            <div className="meta-tile__value">#{order.id.slice(0, 8)}</div>
          </div>
          <div className="meta-tile">
            <div className="meta-tile__label">Sena</div>
            <div className="meta-tile__value">{money(reservationSummary.depositAmount)}</div>
          </div>
          <div className="meta-tile">
            <div className="meta-tile__label">Reserva hasta</div>
            <div className="meta-tile__value">{reservationSummary.deadlineLabel}</div>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:flex sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="w-full justify-center sm:w-auto">
            Lo hago despues
          </Button>
          {reservationWhatsappUrl ? (
            <Button asChild className="w-full justify-center sm:w-auto">
              <a href={reservationWhatsappUrl} target="_blank" rel="noreferrer">
                <BrandIcon slot="icon_whatsapp" className="h-4 w-4" fallback={<MessageCircle className="h-4 w-4" />} />
                Enviar por WhatsApp
                <BrandIcon slot="icon_external_link" className="h-4 w-4" fallback={<ExternalLink className="h-4 w-4" />} />
              </a>
            </Button>
          ) : (
            <Button type="button" disabled className="w-full justify-center sm:w-auto">
              WhatsApp no configurado
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
