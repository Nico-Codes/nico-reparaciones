import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cartStorage } from '@/features/cart/storage';
import { storeApi } from './api';
import type { StoreProduct } from './types';

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
      .then((res) => {
        if (!active) return;
        setItem(res.item);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Producto no encontrado');
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
    setQty((prev) => Math.min(Math.max(1, prev), maxQty));
  }, [item?.id, item?.stock]);

  const hasStock = (item?.stock ?? 0) > 0;
  const maxQty = useMemo(() => Math.max(1, item?.stock ?? 1), [item?.stock]);
  const money = (n: number) => `$ ${n.toLocaleString('es-AR')}`;

  function addToCart() {
    if (!item || !hasStock) return;
    cartStorage.add(item.id, qty, { productName: item.name });
  }

  if (loading) {
    return <div className="card"><div className="card-body">Cargando producto...</div></div>;
  }

  if (error || !item) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm">
        {error || 'Producto no encontrado'}
      </div>
    );
  }

  return (
    <div className="store-shell">
      <div className="product-detail-breadcrumb">
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
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="card overflow-hidden product-detail-media-card">
          <div className="aspect-square bg-zinc-50 sm:aspect-[4/3]">
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
              <div className="flex h-full w-full items-center justify-center text-sm font-black text-zinc-400">
                Sin imagen
              </div>
            )}
          </div>
        </div>

        <div className="card product-detail-info-card">
          <div className="card-body p-4 sm:p-4.5">
            <div className="page-title">{item.name}</div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={hasStock ? 'badge-emerald' : 'badge-rose'}>
                {hasStock ? `Disponible: ${item.stock}` : 'Sin stock'}
              </span>
              {item.featured ? <span className="badge-zinc">Destacado</span> : null}
            </div>

            <div className="product-detail-price-box mt-4">
              <div className="text-xs font-black uppercase tracking-wide text-zinc-500">Precio</div>
              <div className="text-3xl font-black tracking-tight text-zinc-900">{money(item.price)}</div>
            </div>

            {!hasStock ? (
              <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-black text-rose-800">
                Sin stock por ahora. Podés consultar disponibilidad por WhatsApp.
              </div>
            ) : null}

            {item.description ? <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-700">{item.description}</div> : null}

            <div className="mt-5 grid gap-3">
              <div className="grid gap-2.5 sm:grid-cols-[auto_1fr] sm:items-end">
                <div>
                  <label className="text-xs font-black uppercase tracking-wide text-zinc-600" htmlFor="productQty">
                    Cantidad
                  </label>
                  <div className="mt-1 inline-flex items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-1">
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-base font-black text-zinc-800 hover:bg-zinc-100 disabled:opacity-40"
                      onClick={() => setQty((v) => Math.max(1, v - 1))}
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
                      onChange={(e) => {
                        const next = Number(e.target.value) || 1;
                        setQty(Math.min(maxQty, Math.max(1, next)));
                      }}
                      className="h-10 w-14 border-0 bg-transparent text-center text-base font-black text-zinc-900 focus:ring-0"
                      inputMode="numeric"
                      disabled={!hasStock}
                    />

                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-base font-black text-zinc-800 hover:bg-zinc-100 disabled:opacity-40"
                      onClick={() => setQty((v) => Math.min(maxQty, v + 1))}
                      disabled={!hasStock || qty >= maxQty}
                      aria-label="Sumar cantidad"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  className="btn-primary h-11 w-full justify-center product-detail-buy-btn"
                  type="button"
                  onClick={addToCart}
                  disabled={!hasStock}
                  aria-label="Agregar al carrito"
                >
                  {hasStock ? 'Agregar al carrito' : 'Sin stock'}
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Link to="/cart" className="btn-outline h-11 w-full justify-center">Ver carrito</Link>
                <Link to="/store" className="btn-ghost h-11 w-full justify-center">Seguir comprando</Link>
              </div>
            </div>

            <div className="mt-4 text-xs text-zinc-500">
              ¿Necesitás reparar tu equipo? Usá <Link className="font-black" to="/reparacion">Consultar reparación</Link>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
