import { ArrowLeft, ShieldCheck, ShoppingCart, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  clampStoreProductQuantity,
  formatStoreProductMoney,
  getStoreProductCtaLabel,
  getStoreProductFallbackDescription,
  isStoreProductSpecialOrder,
  requiresStoreProductColorSelection,
  resolveStoreProductStockTone,
} from './store-product-detail.helpers';
import type { StoreProduct } from './types';

type StoreProductLoadingStateProps = {
  message: string;
};

type StoreProductEmptyStateProps = {
  message: string;
};

type StoreProductBreadcrumbProps = {
  item: StoreProduct;
};

type StoreProductHeaderActionsProps = {
  item: StoreProduct;
  canPurchase: boolean;
};

type StoreProductMediaSectionProps = {
  item: StoreProduct;
};

type StoreProductPurchaseSectionProps = {
  item: StoreProduct;
  canPurchase: boolean;
  qty: number;
  maxQty: number;
  selectedColorId: string | null;
  onQtyChange: (value: number) => void;
  onSelectColor: (value: string) => void;
  onAddToCart: () => void;
};

export function StoreProductLoadingState({ message }: StoreProductLoadingStateProps) {
  return (
    <PageShell context="store" className="space-y-5">
      <PageHeader
        context="store"
        eyebrow="Tienda"
        title="Cargando producto"
        subtitle="Estamos preparando la ficha del producto."
        actions={<StatusBadge label="Cargando" tone="info" />}
      />
      <SectionCard bodyClassName="space-y-4">
        <LoadingBlock label={message} lines={4} />
      </SectionCard>
    </PageShell>
  );
}

export function StoreProductEmptyState({ message }: StoreProductEmptyStateProps) {
  return (
    <PageShell context="store" className="space-y-5">
      <PageHeader
        context="store"
        eyebrow="Tienda"
        title="Producto no disponible"
        subtitle="No pudimos cargar la ficha solicitada."
        actions={<StatusBadge label="No disponible" tone="danger" />}
      />
      <SectionCard>
        <EmptyState
          title={message}
          description="Volve al catalogo para seguir navegando o busca un producto disponible."
          actions={(
            <Button asChild variant="outline">
              <Link to="/store">Volver a la tienda</Link>
            </Button>
          )}
        />
      </SectionCard>
    </PageShell>
  );
}

export function StoreProductBreadcrumb({ item }: StoreProductBreadcrumbProps) {
  const parentCategory = item.category?.parent ?? null;
  const category = item.category ?? null;

  return (
    <nav className="product-detail-breadcrumb" aria-label="Breadcrumb">
      <Link to="/store" className="font-black">Tienda</Link>
      <span className="mx-2">/</span>
      {parentCategory ? (
        <>
          <Link to={`/store?category=${encodeURIComponent(parentCategory.slug)}`} className="font-black">
            {parentCategory.name}
          </Link>
          <span className="mx-2">/</span>
        </>
      ) : null}
      {category ? (
        <>
          <Link to={`/store?category=${encodeURIComponent(category.slug)}`} className="font-black">
            {category.name}
          </Link>
          <span className="mx-2">/</span>
        </>
      ) : null}
      <span className="text-zinc-500">{item.name}</span>
    </nav>
  );
}

export function StoreProductHeaderActions({ item, canPurchase }: StoreProductHeaderActionsProps) {
  const isSpecialOrder = isStoreProductSpecialOrder(item);
  return (
    <>
      <StatusBadge
        label={isSpecialOrder ? 'Por encargue' : canPurchase ? 'En Stock' : 'Sin stock'}
        tone={resolveStoreProductStockTone(item)}
      />
      {item.featured ? <StatusBadge label="Destacado" tone="accent" /> : null}
    </>
  );
}

export function StoreProductMediaSection({ item }: StoreProductMediaSectionProps) {
  return (
    <SectionCard className="media-surface product-detail-media overflow-hidden" bodyClassName="p-0">
      <div className="media-surface__frame">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
            width={1200}
            height={1200}
          />
        ) : (
          <div className="media-surface__placeholder">Sin imagen disponible</div>
        )}
      </div>
    </SectionCard>
  );
}

export function StoreProductPurchaseSection({
  item,
  canPurchase,
  qty,
  maxQty,
  selectedColorId,
  onQtyChange,
  onSelectColor,
  onAddToCart,
}: StoreProductPurchaseSectionProps) {
  const isSpecialOrder = isStoreProductSpecialOrder(item);
  const actionLabel = getStoreProductCtaLabel(item);
  const requiresColorSelection = requiresStoreProductColorSelection(item);
  const canSubmit = canPurchase && (!requiresColorSelection || Boolean(selectedColorId));

  return (
    <SectionCard className="product-purchase-card" title={isSpecialOrder ? 'Encargar producto' : 'Comprar producto'}>
      <div className="summary-box">
        <div className="summary-box__label">Precio</div>
        <div className="summary-box__value">{formatStoreProductMoney(item.price)}</div>
      </div>

      {!canPurchase ? (
        <div className="ui-alert ui-alert--warning mt-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Sin stock por ahora</span>
            <div className="ui-alert__text">Podes consultar disponibilidad por WhatsApp o seguir recorriendo el catalogo.</div>
          </div>
        </div>
      ) : null}

      {requiresColorSelection ? (
        <div className="product-color-picker">
          <div className="product-color-picker__header">
            <div>
              <div className="ui-field__label">Elegi un color</div>
            </div>
            <StatusBadge
              tone="info"
              size="sm"
              label={`${item.colorOptions.filter((option) => option.active && option.supplierAvailability === 'IN_STOCK').length} disponibles`}
            />
          </div>
          <div className="product-color-options">
            {item.colorOptions.map((option) => {
              const disabled = !option.active || option.supplierAvailability !== 'IN_STOCK';
              const selected = selectedColorId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`product-color-option ${selected ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}
                  disabled={disabled}
                  onClick={() => onSelectColor(option.id)}
                >
                  {option.label}
                  {disabled ? ' - Sin stock' : ''}
                </button>
              );
            })}
          </div>
          {!selectedColorId ? (
            <div className="text-xs text-zinc-500">Selecciona un color disponible para poder encargarlo.</div>
          ) : null}
        </div>
      ) : null}

      <div className="product-purchase-flow">
        <div className="product-purchase-actions">
          <div className="product-quantity-control">
            <label className="ui-field__label" htmlFor="productQty">Cantidad</label>
            <div className="quantity-stepper mt-1.5">
              <button
                type="button"
                className="quantity-stepper__button"
                onClick={() => onQtyChange(Math.max(1, qty - 1))}
                disabled={!canPurchase || qty <= 1}
                aria-label="Restar cantidad"
              >
                -
              </button>
              <input
                id="productQty"
                type="number"
                value={qty}
                min={1}
                max={maxQty}
                onChange={(event) => onQtyChange(clampStoreProductQuantity(Number(event.target.value), item.stock, item.fulfillmentMode))}
                className="quantity-stepper__input"
                inputMode="numeric"
                disabled={!canPurchase}
              />
              <button
                type="button"
                className="quantity-stepper__button"
                onClick={() => onQtyChange(Math.min(maxQty, qty + 1))}
                disabled={!canPurchase || qty >= maxQty}
                aria-label="Sumar cantidad"
              >
                +
              </button>
            </div>
          </div>

          <Button type="button" className="w-full justify-center" onClick={onAddToCart} disabled={!canSubmit}>
            {isSpecialOrder ? <ShieldCheck className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            {canSubmit || (isSpecialOrder && canPurchase) ? actionLabel : 'Sin stock'}
          </Button>
        </div>

        <details className="product-detail-details">
          <summary className="product-detail-details__summary">Detalles del producto</summary>
          <div className="product-detail-details__content">
            {getStoreProductFallbackDescription(item)}
          </div>
        </details>

        {isSpecialOrder ? (
          <Button asChild variant="outline" className="w-full justify-center">
            <Link to="/store">Volver a tienda</Link>
          </Button>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline" className="w-full justify-center">
              <Link to="/cart">Ver carrito</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-center">
              <Link to="/store">Seguir comprando</Link>
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

export function StoreProductHelpSection() {
  return (
    <SectionCard className="product-help-card" title="Necesitas ayuda?">
      <div className="grid gap-2 sm:grid-cols-2">
        <Button asChild variant="outline" className="w-full justify-center">
          <Link to="/reparacion">
            <Wrench className="h-4 w-4" />
            Consultar reparacion
          </Link>
        </Button>
        <Button asChild variant="ghost" className="w-full justify-center">
          <Link to="/store">
            <ArrowLeft className="h-4 w-4" />
            Volver al catalogo
          </Link>
        </Button>
      </div>
    </SectionCard>
  );
}
