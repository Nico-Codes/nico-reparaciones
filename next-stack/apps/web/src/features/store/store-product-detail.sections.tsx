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
  getStoreProductAvailabilityLabel,
  getStoreProductFallbackDescription,
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
  hasStock: boolean;
};

type StoreProductMediaSectionProps = {
  item: StoreProduct;
};

type StoreProductPurchaseSectionProps = {
  item: StoreProduct;
  hasStock: boolean;
  qty: number;
  maxQty: number;
  onQtyChange: (value: number) => void;
  onAddToCart: () => void;
};

type StoreProductMetaSectionProps = {
  item: StoreProduct;
  hasStock: boolean;
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
  return (
    <nav className="product-detail-breadcrumb" aria-label="Breadcrumb">
      <Link to="/store" className="font-black">Tienda</Link>
      <span className="mx-2">/</span>
      {item.category ? (
        <>
          <Link to={`/store?category=${encodeURIComponent(item.category.slug)}`} className="font-black">
            {item.category.name}
          </Link>
          <span className="mx-2">/</span>
        </>
      ) : null}
      <span className="text-zinc-500">{item.name}</span>
    </nav>
  );
}

export function StoreProductHeaderActions({ item, hasStock }: StoreProductHeaderActionsProps) {
  return (
    <>
      <StatusBadge
        label={hasStock ? `Stock ${item.stock}` : 'Sin stock'}
        tone={resolveStoreProductStockTone(item)}
      />
      {item.featured ? <StatusBadge label="Destacado" tone="accent" /> : null}
    </>
  );
}

export function StoreProductMediaSection({ item }: StoreProductMediaSectionProps) {
  return (
    <SectionCard className="media-surface overflow-hidden" bodyClassName="p-0">
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
  hasStock,
  qty,
  maxQty,
  onQtyChange,
  onAddToCart,
}: StoreProductPurchaseSectionProps) {
  return (
    <SectionCard
      title="Compra rapida"
      description="Elegi la cantidad y agrega el producto al carrito con el precio actualizado."
    >
      <div className="summary-box">
        <div className="summary-box__label">Precio</div>
        <div className="summary-box__value">{formatStoreProductMoney(item.price)}</div>
      </div>

      {!hasStock ? (
        <div className="ui-alert ui-alert--warning mt-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Sin stock por ahora</span>
            <div className="ui-alert__text">Podes consultar disponibilidad por WhatsApp o seguir recorriendo el catalogo.</div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-700">
        {getStoreProductFallbackDescription(item)}
      </div>

      <div className="mt-5 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-end">
          <div>
            <label className="ui-field__label" htmlFor="productQty">Cantidad</label>
            <div className="quantity-stepper mt-1.5">
              <button
                type="button"
                className="quantity-stepper__button"
                onClick={() => onQtyChange(Math.max(1, qty - 1))}
                disabled={!hasStock || qty <= 1}
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
                onChange={(event) => onQtyChange(clampStoreProductQuantity(Number(event.target.value), item.stock))}
                className="quantity-stepper__input"
                inputMode="numeric"
                disabled={!hasStock}
              />
              <button
                type="button"
                className="quantity-stepper__button"
                onClick={() => onQtyChange(Math.min(maxQty, qty + 1))}
                disabled={!hasStock || qty >= maxQty}
                aria-label="Sumar cantidad"
              >
                +
              </button>
            </div>
          </div>

          <Button type="button" className="w-full justify-center" onClick={onAddToCart} disabled={!hasStock}>
            <ShoppingCart className="h-4 w-4" />
            {hasStock ? 'Agregar al carrito' : 'Sin stock'}
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild variant="outline" className="w-full justify-center">
            <Link to="/cart">Ver carrito</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-center">
            <Link to="/store">Seguir comprando</Link>
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

export function StoreProductMetaSection({ item, hasStock }: StoreProductMetaSectionProps) {
  return (
    <SectionCard title="Informacion rapida" description="Datos utiles para compra y seguimiento del producto.">
      <div className="meta-grid">
        <div className="meta-tile">
          <div className="meta-tile__label">Categoria</div>
          <div className="meta-tile__value">{item.category?.name || 'Sin categoria'}</div>
        </div>
        <div className="meta-tile">
          <div className="meta-tile__label">Disponibilidad</div>
          <div className="meta-tile__value">{getStoreProductAvailabilityLabel(item)}</div>
        </div>
        <div className="meta-tile">
          <div className="meta-tile__label">SKU</div>
          <div className="meta-tile__value">{item.sku || 'No informado'}</div>
        </div>
        <div className="meta-tile">
          <div className="meta-tile__label">Codigo</div>
          <div className="meta-tile__value">{item.barcode || 'No informado'}</div>
        </div>
      </div>
    </SectionCard>
  );
}

export function StoreProductHelpSection() {
  return (
    <SectionCard title="Necesitas ayuda?" description="Tambien podes consultar el estado de una reparacion o seguir navegando el catalogo.">
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
