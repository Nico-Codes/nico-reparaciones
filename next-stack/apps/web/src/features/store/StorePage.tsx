import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cartStorage } from '@/features/cart/storage';
import { useCartCount } from '@/features/cart/useCart';
import { storeApi } from './api';
import type { StoreCategory, StoreHeroConfig, StoreProduct, StoreProductsResponse } from './types';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'newest', label: 'Mas nuevos' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'name_asc', label: 'Nombre A-Z' },
  { value: 'name_desc', label: 'Nombre Z-A' },
  { value: 'stock_desc', label: 'Más stock' },
] as const;

export function StorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [productsData, setProductsData] = useState<StoreProductsResponse | null>(null);
  const [heroConfig, setHeroConfig] = useState<StoreHeroConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [qInput, setQInput] = useState(searchParams.get('q') ?? '');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const cartCount = useCartCount();

  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category');
  const sort = (searchParams.get('sort') ?? 'relevance') as StoreProductsResponse['meta']['sort'];

  useEffect(() => {
    let active = true;
    Promise.all([storeApi.hero(), storeApi.categories()])
      .then(([heroRes, categoriesRes]) => {
        if (!active) return;
        setHeroConfig(heroRes);
        setCategories(categoriesRes.items);
      })
      .catch((err) => {
        if (!active) return;
        setError((prev) => prev || (err instanceof Error ? err.message : 'Error cargando tienda'));
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    storeApi.products({ q, category, sort, page: 1, pageSize: 24 })
      .then((productsRes) => {
        if (!active) return;
        setProductsData(productsRes);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Error cargando tienda');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [q, category, sort]);

  function applyQuery(next: { q?: string; category?: string | null; sort?: string }) {
    const params = new URLSearchParams(searchParams);
    if (next.q !== undefined) {
      const value = next.q.trim();
      if (value) params.set('q', value);
      else params.delete('q');
    }
    if (next.category !== undefined) {
      if (next.category) params.set('category', next.category);
      else params.delete('category');
    }
    if (next.sort !== undefined) {
      if (next.sort && next.sort !== 'relevance') params.set('sort', next.sort);
      else params.delete('sort');
    }
    setSearchParams(params);
  }

  const selectedCategoryLabel = useMemo(() => {
    if (!category) return 'Todas';
    return categories.find((c) => c.slug === category)?.name ?? category;
  }, [categories, category]);

  const products = productsData?.items ?? [];
  const showHero = !category;
  const hero = heroConfig ?? {
    imageDesktop: '/brand/logo.png',
    imageMobile: '/brand/logo.png',
    fadeRgbDesktop: '14, 165, 233',
    fadeRgbMobile: '14, 165, 233',
    fadeIntensity: 42,
    fadeSize: 96,
    fadeHold: 12,
    fadeMidAlpha: '0.58',
    title: '',
    subtitle: '',
  };

  const fadeMidAlphaComputed = (() => {
    const baseAlpha = Number(hero.fadeMidAlpha);
    const intensity = Number(hero.fadeIntensity);
    if (!Number.isFinite(baseAlpha)) return '0.58';
    if (!Number.isFinite(intensity) || intensity <= 0) return String(Math.max(0, Math.min(1, baseAlpha)));
    const scaled = baseAlpha * (intensity / 42);
    return String(Math.max(0, Math.min(1, scaled)));
  })();

  return (
    <div data-store-shell className={`store-shell ${showHero ? 'store-shell--hero' : ''}`}>
      {showHero ? (
        <>
          <section
            className="store-front-hero store-front-hero--fullbleed store-front-hero--flush"
            style={{ ['--hero-fade-desktop' as string]: hero.fadeRgbDesktop, ['--hero-fade-mobile' as string]: hero.fadeRgbMobile }}
          >
            <picture className="store-front-hero__picture" aria-hidden="true">
              <source media="(max-width: 767px)" srcSet={hero.imageMobile || hero.imageDesktop} />
              <img
                src={hero.imageDesktop}
                alt=""
                className="store-front-hero__media"
                loading="eager"
                decoding="async"
              />
            </picture>
          </section>
          <div
            className="store-front-fade store-front-hero--fullbleed"
            style={
              {
                ['--hero-fade-desktop' as string]: hero.fadeRgbDesktop,
                ['--hero-fade-mobile' as string]: hero.fadeRgbMobile,
                ['--hero-fade-intensity' as string]: hero.fadeIntensity,
                ['--hero-fade-size' as string]: `${hero.fadeSize}px`,
                ['--hero-fade-hold' as string]: `${hero.fadeHold}%`,
                ['--hero-fade-mid-alpha' as string]: fadeMidAlphaComputed,
              } as React.CSSProperties
            }
            aria-hidden="true"
          />
        </>
      ) : (
        <div className="store-hero page-head">
          <div>
            <div className="page-title">Tienda</div>
            <div className="page-subtitle">Productos con stock real para retiro en local.</div>
          </div>
          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
            <Link to="/cart" className="btn-primary h-11 w-full justify-center sm:w-auto">
              Ver carrito {cartCount > 0 ? <span className="badge-zinc ml-1">{cartCount}</span> : null}
            </Link>
            <Link to="/reparacion" className="btn-outline h-11 w-full justify-center sm:w-auto">Consultar reparación</Link>
          </div>
        </div>
      )}

      <div className="card mt-4 store-toolbar" data-store-toolbar>
        <div className="card-body">
          <form
            className="grid gap-3 md:grid-cols-12 md:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              applyQuery({ q: qInput });
            }}
          >
            <div className="md:col-span-7">
              <div className="text-xs font-black text-zinc-700">Buscar</div>
              <div className="store-mobile-search-row mt-1">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={qInput}
                    onChange={(e) => setQInput(e.target.value)}
                    placeholder="Ej: iPhone, display, bateria..."
                    className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-base font-semibold text-zinc-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-200/40 sm:text-sm md:h-11 md:py-0"
                  />
                </div>

                <button
                  type="button"
                  className="store-mobile-sort-btn md:hidden"
                  onClick={() => setMobileFiltersOpen((v) => !v)}
                  aria-label="Ordenar resultados"
                  aria-expanded={mobileFiltersOpen}
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </button>

                <div className={`store-mobile-sort-menu md:hidden ${mobileFiltersOpen ? '' : 'hidden'}`}>
                  <div className="store-mobile-sort-title">Ordenar por</div>
                  <div className="grid gap-1">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`store-mobile-sort-option ${sort === opt.value ? 'is-active' : ''}`}
                        onClick={() => {
                          applyQuery({ sort: opt.value });
                          setMobileFiltersOpen(false);
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:col-span-3 md:block">
              <div className="text-xs font-black text-zinc-700">Ordenar</div>
              <select
                value={sort}
                onChange={(e) => applyQuery({ sort: e.target.value })}
                className="mt-1 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-200/40 md:py-0"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="hidden md:col-span-2 md:flex md:items-center md:gap-2">
              <button type="submit" className="btn-primary h-11 w-full justify-center md:min-w-28">Aplicar</button>
              {(q || sort !== 'relevance') ? (
                <button
                  type="button"
                  className="btn-outline h-11 w-full justify-center md:min-w-28"
                  onClick={() => {
                    setQInput('');
                    setSearchParams(new URLSearchParams());
                  }}
                >
                  Limpiar
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>

      <div data-store-results-shell className={loading ? 'is-loading' : ''}>
        {categories.length > 0 ? (
          <div className="card mt-4 store-categories">
            <div className="card-body">
              <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 md:flex-wrap md:overflow-visible">
                <button
                  type="button"
                  onClick={() => applyQuery({ category: null })}
                  className={`nav-pill shrink-0 whitespace-nowrap ${!category ? 'nav-pill-active' : ''}`}
                >
                  Todas
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => applyQuery({ category: cat.slug })}
                    className={`nav-pill shrink-0 whitespace-nowrap ${category === cat.slug ? 'nav-pill-active' : ''}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</div>
        ) : null}

        <div className="mt-8" id="productos">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
              {products.map((product) => (
                <StoreGridCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            !loading && (
              <div className="card">
                <div className="card-body space-y-3">
                  <div className="font-black">{q ? 'Sin resultados' : 'No hay productos'}</div>
                  <div className="muted">
                    {q
                      ? `No encontramos productos para "${q}"${selectedCategoryLabel !== 'Todas' ? ` en "${selectedCategoryLabel}"` : ''}.`
                      : 'Todavía no hay productos para mostrar.'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {q || category ? (
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => {
                          setQInput('');
                          setSearchParams(new URLSearchParams());
                        }}
                      >
                        Limpiar busqueda
                      </button>
                    ) : null}
                    {category ? <Link className="btn-outline" to="/store">Ver todas</Link> : null}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function StoreGridCard({ product }: { product: StoreProduct }) {
  const hasStock = product.stock > 0;
  return (
    <div className="product-card product-card-grid">
      <Link className="product-image" to={`/store/${product.slug}`}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" decoding="async" />
        ) : (
          <div className="product-image-placeholder">Sin imagen</div>
        )}
      </Link>

      <div className="product-body">
        <Link className="product-title" to={`/store/${product.slug}`}>
          {product.name}
        </Link>

        <div className="product-meta">{product.category?.name ?? ''}</div>

        <div className="product-row">
          <div className="product-price">$ {product.price.toLocaleString('es-AR')}</div>

          <div className="product-actions">
            <span className={`badge-stock ${hasStock ? 'is-in' : 'is-out'}`}>
              {hasStock ? `Stock: ${product.stock}` : 'Sin stock'}
            </span>

            <button
              type="button"
              className={`btn-cart ${hasStock ? '' : 'is-disabled'}`}
              disabled={!hasStock}
              aria-label="Agregar al carrito"
              title={hasStock ? 'Agregar al carrito' : 'Sin stock'}
              onClick={() => cartStorage.add(product.id, 1, { productName: product.name })}
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
