import { AlertTriangle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  clampCartQuantity,
  formatCartMoney,
  getCartLineAvailabilityLabel,
  isCartSpecialOrderLine,
  resolveCartStockTone,
} from './cart.helpers';
import type { CartQuoteLine } from './types';

type CartHeaderActionsProps = {
  itemsCount: number;
};

type CartEmptyStateProps = {
  hasItems: boolean;
};

type CartFeedbackProps = {
  message: string;
};

type CartLinesSectionProps = {
  lines: CartQuoteLine[];
  validCount: number;
  hasStockIssue: boolean;
  loading: boolean;
  hasQuote: boolean;
  onUpdate: (productId: string, quantity: number, variantId?: string | null) => void;
  onRemove: (productId: string, variantId?: string | null) => void;
};

type CartSummarySectionProps = {
  total: number;
  hasStockIssue: boolean;
  canCheckout: boolean;
  onCheckout: () => void;
  onClear: () => void;
};

export function CartHeaderActions({ itemsCount }: CartHeaderActionsProps) {
  return (
    <>
      <StatusBadge label={`${itemsCount} productos`} tone="info" />
      <Button asChild variant="outline" size="sm">
        <Link to="/store">Seguir comprando</Link>
      </Button>
    </>
  );
}

export function CartEmptyState({ hasItems }: CartEmptyStateProps) {
  return (
    <PageShell context="store" className="space-y-6">
      <PageHeader
        context="store"
        eyebrow="Compra"
        title="Carrito"
        subtitle={
          hasItems
            ? 'Tu seleccion queda lista para continuar cuando los productos vuelvan a estar disponibles.'
            : 'Tu seleccion queda lista para continuar cuando sumes productos.'
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/store">Ir a la tienda</Link>
          </Button>
        }
      />
      <SectionCard>
        <EmptyState
          title="Tu carrito esta vacio"
          description="Agrega productos desde la tienda para ver el resumen y continuar con la compra."
          actions={
            <Button asChild>
              <Link to="/store">Explorar productos</Link>
            </Button>
          }
        />
      </SectionCard>
    </PageShell>
  );
}

export function CartFeedback({ message }: CartFeedbackProps) {
  if (!message) return null;

  return (
    <div className="ui-alert ui-alert--danger">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
      <div>
        <span className="ui-alert__title">No pudimos cotizar el carrito.</span>
        <div className="ui-alert__text">{message}</div>
      </div>
    </div>
  );
}

export function CartLinesSection({
  lines,
  validCount,
  hasStockIssue,
  loading,
  hasQuote,
  onUpdate,
  onRemove,
}: CartLinesSectionProps) {
  return (
    <SectionCard
      title="Productos seleccionados"
      description="El carrito se actualiza con precios y disponibilidad real del catalogo."
      actions={<StatusBadge label={`${validCount} validos`} tone={hasStockIssue ? 'warning' : 'success'} />}
    >
      {loading && !hasQuote ? (
        <LoadingBlock label="Cotizando carrito" lines={4} />
      ) : (
        <div className="line-list">
          {lines.map((line) => {
            const isSpecialOrder = isCartSpecialOrderLine(line);
            const isOut = !isSpecialOrder && line.stockAvailable <= 0;
            const disableQuantity = !line.valid || isOut;
            const clampedQuantity = clampCartQuantity(line.quantity, line.stockAvailable, line.fulfillmentMode);

            return (
              <article key={`${line.productId}:${line.variantId ?? 'base'}`} className="line-item">
                <div className="line-item__main flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="line-item__title">{line.name || 'Producto'}</div>
                    <StatusBadge
                      label={getCartLineAvailabilityLabel(line)}
                      tone={resolveCartStockTone(line.valid, line.stockAvailable, line.fulfillmentMode)}
                      size="sm"
                    />
                    {!line.valid && line.reason ? <StatusBadge label="Requiere ajuste" tone="danger" size="sm" /> : null}
                  </div>

                  <div className="line-item__meta">
                    {line.slug ? (
                      <Link to={`/store/${line.slug}`} className="font-semibold text-sky-700 hover:text-sky-800">
                        Ver producto
                      </Link>
                    ) : null}
                    {line.slug ? ' · ' : ''}
                    {isSpecialOrder ? 'Modalidad por encargue · ' : ''}
                    {line.selectedColorLabel ? `Color ${line.selectedColorLabel} · ` : ''}
                    Precio unitario {formatCartMoney(line.unitPrice)}
                  </div>

                  {!line.valid && line.reason ? (
                    <div className="ui-alert ui-alert--warning mt-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                      <div>
                        <span className="ui-alert__title">Ajuste requerido</span>
                        <div className="ui-alert__text">{line.reason}</div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="quantity-stepper">
                      <button
                        type="button"
                        className="quantity-stepper__button"
                        onClick={() => onUpdate(line.productId, Math.max(1, line.quantity - 1), line.variantId)}
                        disabled={disableQuantity || line.quantity <= 1}
                        aria-label="Restar"
                      >
                        -
                      </button>
                      <label className="sr-only" htmlFor={`qty_${line.productId}`}>
                        Cantidad
                      </label>
                      <input
                        id={`qty_${line.productId}`}
                        type="number"
                        min={1}
                        max={clampedQuantity}
                        inputMode="numeric"
                        value={line.quantity}
                        onChange={(event) =>
                          onUpdate(
                            line.productId,
                            clampCartQuantity(Number(event.target.value), line.stockAvailable, line.fulfillmentMode),
                            line.variantId,
                          )
                        }
                        className="quantity-stepper__input"
                        disabled={disableQuantity}
                      />
                      <button
                        type="button"
                        className="quantity-stepper__button"
                        onClick={() => onUpdate(line.productId, Math.min(clampedQuantity, line.quantity + 1), line.variantId)}
                        disabled={disableQuantity || line.quantity >= clampedQuantity}
                        aria-label="Sumar"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-right">
                        <div className="summary-box__label">Subtotal</div>
                        <div className="text-lg font-black text-zinc-950">{formatCartMoney(line.lineTotal)}</div>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(line.productId, line.variantId)}>
                        <Trash2 className="h-4 w-4" />
                        Quitar
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

export function CartSummarySection({
  total,
  hasStockIssue,
  canCheckout,
  onCheckout,
  onClear,
}: CartSummarySectionProps) {
  return (
    <SectionCard
      className="commerce-sticky"
      title="Resumen"
      description="Cuando todas las lineas son validas podes confirmar el pedido en el checkout."
    >
      <div className="summary-box">
        <div className="summary-box__label">Total estimado</div>
        <div className="summary-box__value">{formatCartMoney(total)}</div>
      </div>

      {hasStockIssue ? (
        <div className="ui-alert ui-alert--warning mt-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Hay productos para revisar</span>
            <div className="ui-alert__text">Ajusta las cantidades o quita los items invalidos antes de continuar.</div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2">
        <Button type="button" className="w-full justify-center" disabled={!canCheckout} onClick={onCheckout}>
          Finalizar compra
        </Button>
        <Button type="button" variant="outline" className="w-full justify-center" onClick={onClear}>
          Vaciar carrito
        </Button>
      </div>
    </SectionCard>
  );
}
