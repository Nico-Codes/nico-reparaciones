import { AlertTriangle, Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandIcon } from '@/components/brand/BrandIcon';
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
  isCartSpecialOrderLine,
} from './cart.helpers';
import type { CartQuoteLine } from './types';

type CartHeaderActionsProps = {
  itemsCount: number;
};

type CartEmptyStateProps = {
  hasItems: boolean;
  message?: string;
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
  onQuantityLimit: (productName: string, maxQuantity: number) => void;
};

type CartSummarySectionProps = {
  total: number;
  hasStockIssue: boolean;
  canCheckout: boolean;
  onCheckout: () => void;
  onClear: () => void;
};

type CartStockLimitPopupProps = {
  message: string;
  onClose: () => void;
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

export function CartEmptyState({ hasItems, message = '' }: CartEmptyStateProps) {
  return (
    <PageShell context="store" className="space-y-6">
      <PageHeader
        context="store"
        className="cart-page-header"
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
      {message ? (
        <div className="ui-alert ui-alert--info">
          <BrandIcon slot="icon_alert" className="mt-0.5 h-4 w-4 flex-none" fallback={<AlertTriangle className="h-4 w-4" />} />
          <div>
            <span className="ui-alert__title">Carrito actualizado</span>
            <div className="ui-alert__text">{message}</div>
          </div>
        </div>
      ) : null}
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
      <BrandIcon slot="icon_alert" className="mt-0.5 h-4 w-4 flex-none" fallback={<AlertTriangle className="h-4 w-4" />} />
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
  onQuantityLimit,
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
            const maxQuantity = clampCartQuantity(999, line.stockAvailable, line.fulfillmentMode);
            const plusAtLimit = line.quantity >= maxQuantity;
            const productHref = line.slug ? `/store/${line.slug}` : null;
            const lineKey = `${line.productId}:${line.variantId ?? 'base'}`;

            return (
              <article key={lineKey} className="line-item cart-line-item">
                {productHref ? (
                  <Link to={productHref} className="line-item__media" aria-label={`Ver ${line.name || 'producto'}`}>
                    <span className="line-item__media-frame">
                      {line.imageUrl ? (
                        <img src={line.imageUrl} alt={line.name || 'Producto'} loading="lazy" decoding="async" />
                      ) : (
                        <span>Sin imagen</span>
                      )}
                    </span>
                  </Link>
                ) : (
                  <div className="line-item__media" aria-hidden="true">
                    <span className="line-item__media-frame">
                      {line.imageUrl ? (
                        <img src={line.imageUrl} alt="" loading="lazy" decoding="async" />
                      ) : (
                        <span>Sin imagen</span>
                      )}
                    </span>
                  </div>
                )}

                <div className="line-item__main">
                  <div className="line-item__heading">
                    <div className="line-item__title">{line.name || 'Producto'}</div>
                    {!line.valid && line.reason ? <StatusBadge label="Requiere ajuste" tone="danger" size="sm" /> : null}
                  </div>

                  <div className="line-item__meta">
                    {productHref ? (
                      <Link to={productHref} className="font-semibold text-sky-700 hover:text-sky-800">
                        Ver producto
                      </Link>
                    ) : null}
                    {isSpecialOrder ? <span>Por encargue</span> : null}
                    {line.selectedColorLabel ? <span>Color {line.selectedColorLabel}</span> : null}
                    <span>Unidad {formatCartMoney(line.unitPrice)}</span>
                  </div>

                  {!line.valid && line.reason ? (
                    <div className="ui-alert ui-alert--warning mt-3">
                      <BrandIcon slot="icon_alert" className="mt-0.5 h-4 w-4 flex-none" fallback={<AlertTriangle className="h-4 w-4" />} />
                      <div>
                        <span className="ui-alert__title">Ajuste requerido</span>
                        <div className="ui-alert__text">{line.reason}</div>
                      </div>
                    </div>
                  ) : null}

                  <div className="line-item__actions">
                    <div className="quantity-stepper">
                      <button
                        type="button"
                        className="quantity-stepper__button"
                        onClick={() =>
                          onUpdate(
                            line.productId,
                            clampCartQuantity(line.quantity - 1, line.stockAvailable, line.fulfillmentMode),
                            line.variantId,
                          )
                        }
                        disabled={disableQuantity || line.quantity <= 1}
                        aria-label="Restar"
                      >
                        <BrandIcon slot="icon_minus" className="h-3.5 w-3.5" fallback={<Minus className="h-3.5 w-3.5" aria-hidden="true" />} />
                      </button>
                      <output className="quantity-stepper__value" aria-label="Cantidad">
                        {line.quantity}
                      </output>
                      <button
                        type="button"
                        className={`quantity-stepper__button ${plusAtLimit ? 'is-disabled' : ''}`}
                        onClick={() => {
                          if (plusAtLimit) {
                            onQuantityLimit(line.name || 'Producto', maxQuantity);
                            return;
                          }
                          onUpdate(
                            line.productId,
                            clampCartQuantity(line.quantity + 1, line.stockAvailable, line.fulfillmentMode),
                            line.variantId,
                          );
                        }}
                        disabled={disableQuantity}
                        aria-disabled={plusAtLimit ? 'true' : undefined}
                        aria-label="Sumar"
                      >
                        <BrandIcon slot="icon_plus" className="h-3.5 w-3.5" fallback={<Plus className="h-3.5 w-3.5" aria-hidden="true" />} />
                      </button>
                    </div>

                    <div className="line-item__total">
                      <div className="line-item__total-label">Subtotal</div>
                      <div className="line-item__total-value">{formatCartMoney(line.lineTotal)}</div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="line-item__remove"
                      onClick={() => onRemove(line.productId, line.variantId)}
                    >
                      <BrandIcon slot="icon_trash" className="h-4 w-4" fallback={<Trash2 className="h-4 w-4" />} />
                      <span>Quitar</span>
                    </Button>
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

export function CartStockLimitPopup({ message, onClose }: CartStockLimitPopupProps) {
  if (!message) return null;

  return (
    <div className="cart-stock-popup" role="alert" aria-live="assertive">
      <div>
        <div className="cart-stock-popup__title">Stock maximo alcanzado</div>
        <div className="cart-stock-popup__text">{message}</div>
      </div>
      <button type="button" className="cart-stock-popup__close" onClick={onClose} aria-label="Cerrar aviso">
        Cerrar
      </button>
    </div>
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
          <BrandIcon slot="icon_alert" className="mt-0.5 h-4 w-4 flex-none" fallback={<AlertTriangle className="h-4 w-4" />} />
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
