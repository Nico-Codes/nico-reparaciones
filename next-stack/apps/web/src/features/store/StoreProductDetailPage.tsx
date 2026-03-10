import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Package, ShieldCheck, ShoppingCart, Wrench } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { cartStorage } from '@/features/cart/storage';
import { storeApi } from './api';
import type { StoreProduct } from './types';

type BadgeTone = 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'danger';

function money(value: number) {
  return `$ ${value.toLocaleString('es-AR')}`;
}

function stockTone(item: StoreProduct | null): BadgeTone {
  if (!item) return 'neutral';
  if (item.stock <= 0) return 'danger';
  if (item.stock <= 3) return 'warning';
  return 'success';
}

export function StoreProductDetailPage() {
  const { slug = '' } = useParams();
  const [item, setItem] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    storeApi
      .product(slug)
      .then((response) => {
        if (!active) return;
        setItem(response.item);
      })
      .catch((cause) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : 'Producto no encontrado');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!item) return;
    const maxQty = Math.max(1, item.stock || 1);
    setQty((current) => Math.min(Math.max(1, current), maxQty));
  }, [item?.id, item?.stock]);

  const hasStock = (item?.stock ?? 0) > 0;
  const maxQty = useMemo(() => Math.max(1, item?.stock ?? 1), [item?.stock]);

  function addToCart() {
    if (!item || !hasStock) return;
    cartStorage.add(item.id, qty, { productName: item.name });
  }

  if (loading) {
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
          <LoadingBlock label="Cargando producto" lines={4} />
        </SectionCard>
      </PageShell>
    );
  }

  if (error || !item) {
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
            title={error || 'Producto no encontrado'}
            description="Volvé al catálogo para seguir navegando o buscá un producto disponible."
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

  return (
    <PageShell context="store" className="space-y-5">
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

      <PageHeader
        context="store"
        eyebrow={item.category?.name || 'Producto'}
        title={item.name}
        subtitle="Compra directa con retiro en local y stock validado desde el panel administrativo."
        actions={(
          <>
            <StatusBadge label={hasStock ? `Stock ${item.stock}` : 'Sin stock'} tone={stockTone(item)} />
            {item.featured ? <StatusBadge label="Destacado" tone="accent" /> : null}
          </>
        )}
      />

      <div className="commerce-layout commerce-layout--product">
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

        <div className="commerce-stack commerce-sticky">
          <SectionCard
            title="Compra rápida"
            description="Elegí la cantidad y agregá el producto al carrito con el precio actualizado."
          >
            <div className="summary-box">
              <div className="summary-box__label">Precio</div>
              <div className="summary-box__value">{money(item.price)}</div>
            </div>

            {!hasStock ? (
              <div className="ui-alert ui-alert--warning mt-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <span className="ui-alert__title">Sin stock por ahora</span>
                  <div className="ui-alert__text">Podés consultar disponibilidad por WhatsApp o seguir recorriendo el catálogo.</div>
                </div>
              </div>
            ) : null}

            {item.description ? (
              <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-700">{item.description}</div>
            ) : (
              <div className="mt-4 text-sm leading-relaxed text-zinc-600">
                Producto listo para compra directa. Si necesitás más contexto técnico, podés contactarte desde la tienda o consultarnos por reparación.
              </div>
            )}

            <div className="mt-5 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-end">
                <div>
                  <label className="ui-field__label" htmlFor="productQty">Cantidad</label>
                  <div className="quantity-stepper mt-1.5">
                    <button
                      type="button"
                      className="quantity-stepper__button"
                      onClick={() => setQty((value) => Math.max(1, value - 1))}
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
                      onChange={(event) => {
                        const next = Number(event.target.value) || 1;
                        setQty(Math.min(maxQty, Math.max(1, next)));
                      }}
                      className="quantity-stepper__input"
                      inputMode="numeric"
                      disabled={!hasStock}
                    />
                    <button
                      type="button"
                      className="quantity-stepper__button"
                      onClick={() => setQty((value) => Math.min(maxQty, value + 1))}
                      disabled={!hasStock || qty >= maxQty}
                      aria-label="Sumar cantidad"
                    >
                      +
                    </button>
                  </div>
                </div>

                <Button type="button" className="w-full justify-center" onClick={addToCart} disabled={!hasStock}>
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

          <SectionCard title="Información rápida" description="Datos útiles para compra y seguimiento del producto.">
            <div className="meta-grid">
              <div className="meta-tile">
                <div className="meta-tile__label">Categoría</div>
                <div className="meta-tile__value">{item.category?.name || 'Sin categoría'}</div>
              </div>
              <div className="meta-tile">
                <div className="meta-tile__label">Disponibilidad</div>
                <div className="meta-tile__value">{hasStock ? `${item.stock} unidades` : 'Consultar disponibilidad'}</div>
              </div>
              <div className="meta-tile">
                <div className="meta-tile__label">SKU</div>
                <div className="meta-tile__value">{item.sku || 'No informado'}</div>
              </div>
              <div className="meta-tile">
                <div className="meta-tile__label">Código</div>
                <div className="meta-tile__value">{item.barcode || 'No informado'}</div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="¿Necesitás ayuda?" description="También podés consultar el estado de una reparación o seguir navegando el catálogo.">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild variant="outline" className="w-full justify-center">
                <Link to="/reparacion">
                  <Wrench className="h-4 w-4" />
                  Consultar reparación
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-center">
                <Link to="/store">
                  <ArrowLeft className="h-4 w-4" />
                  Volver al catálogo
                </Link>
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
