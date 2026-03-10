import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Search, ShoppingCart, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { TextField } from '@/components/ui/text-field';
import { CustomSelect } from '@/components/ui/custom-select';
import { cartStorage } from '@/features/cart/storage';
import { storeApi } from './api';
import type { StoreCategory, StoreHeroConfig, StoreProduct, StoreProductsResponse } from './types';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'newest', label: 'Más nuevos' },
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
  const [error, setError] = useState('');
  const [qInput, setQInput] = useState(searchParams.get('q') ?? '');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const mobileSortTriggerRef = useRef<HTMLButtonElement | null>(null);
  const bodyOverflowRef = useRef('');
  const bodyPaddingRightRef = useRef('');

  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category');
  const sort = (searchParams.get('sort') ?? 'relevance') as StoreProductsResponse['meta']['sort'];
  const [mobileSortDraft, setMobileSortDraft] = useState(sort);

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
        setError((prev) => prev || (err instanceof Error ? err.message : 'No se pudo cargar la tienda.'));
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    storeApi
      .products({ q, category, sort, page: 1, pageSize: 24 })
      .then((productsRes) => {
        if (!active) return;
        setProductsData(productsRes);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'No se pudo cargar la tienda.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [q, category, sort]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMobileFiltersOpen(false);
      mobileSortTriggerRef.current?.focus();
    };

    setMobileSortDraft(sort);

    const body = document.body;
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    bodyOverflowRef.current = body.style.overflow;
    bodyPaddingRightRef.current = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = bodyOverflowRef.current;
      document.body.style.paddingRight = bodyPaddingRightRef.current;
    };
  }, [mobileFiltersOpen, sort]);

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

  const sortOptions = useMemo(
    () => SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
    [],
  );
  const selectedCategoryLabel = useMemo(
    () => (category ? categories.find((item) => item.slug === category)?.name ?? 'Categoría actual' : 'Todas las categorías'),
    [categories, category],
  );

  const products = productsData?.items ?? [];
  const isInitialLoading = loading && !productsData;
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

  const heroVisualVars = {
    ['--hero-fade-desktop' as string]: hero.fadeRgbDesktop,
    ['--hero-fade-mobile' as string]: hero.fadeRgbMobile,
    ['--hero-fade-intensity' as string]: hero.fadeIntensity,
    ['--hero-fade-size' as string]: `${hero.fadeSize}px`,
    ['--hero-fade-hold' as string]: `${hero.fadeHold}%`,
    ['--hero-fade-mid-alpha' as string]: fadeMidAlphaComputed,
  } as CSSProperties;

  const mobileSortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label ?? 'Relevancia';

  const mobileSortSheet =
    mobileFiltersOpen && typeof document !== 'undefined'
      ? createPortal(
          <div className="store-mobile-sort-overlay" role="presentation">
            <button
              type="button"
              className="store-mobile-sort-backdrop"
              aria-label="Cerrar panel de orden"
              onClick={() => {
                setMobileFiltersOpen(false);
                mobileSortTriggerRef.current?.focus();
              }}
            />
            <div className="store-mobile-sort-sheet" role="dialog" aria-modal="true" aria-labelledby="store-mobile-sort-title">
              <div className="store-mobile-sort-sheet__header">
                <div className="store-mobile-sort-sheet__heading">
                  <h2 id="store-mobile-sort-title" className="store-mobile-sort-sheet__title">Ordenar productos</h2>
                  <p className="store-mobile-sort-sheet__subtitle">Elegí cómo querés ver el catálogo.</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Cerrar ordenamiento"
                  onClick={() => {
                    setMobileFiltersOpen(false);
                    mobileSortTriggerRef.current?.focus();
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="store-mobile-sort-options">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`store-mobile-sort-option ${mobileSortDraft === option.value ? 'is-active' : ''}`}
                    onClick={() => setMobileSortDraft(option.value)}
                  >
                    <span>{option.label}</span>
                    {mobileSortDraft === option.value ? <Check className="h-4 w-4" /> : null}
                  </button>
                ))}
              </div>

              <div className="store-mobile-sort-actions">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMobileFiltersOpen(false);
                    mobileSortTriggerRef.current?.focus();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    applyQuery({ sort: mobileSortDraft });
                    setMobileFiltersOpen(false);
                    mobileSortTriggerRef.current?.focus();
                  }}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <PageShell context="store" className="page-shell--store-front" data-store-shell>
      <div className="store-front-band store-front-band--flush" style={heroVisualVars}>
        <section className="store-front-hero">
          <picture className="store-front-hero__picture" aria-hidden="true">
            <source media="(max-width: 767px)" srcSet={hero.imageMobile || hero.imageDesktop} />
            <img src={hero.imageDesktop} alt="" className="store-front-hero__media" loading="eager" decoding="async" />
          </picture>
        </section>
        <div className="store-front-fade" aria-hidden="true" />
      </div>
      <FilterBar
        className="store-toolbar"
        actions={
          <div className="store-toolbar-actions store-toolbar-actions--desktop">
            <Button type="submit" form="store-filter-form">
              Aplicar
            </Button>
            {(q || sort !== 'relevance' || category) ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQInput('');
                  setMobileFiltersOpen(false);
                  setSearchParams(new URLSearchParams());
                }}
          >
                Limpiar
              </Button>
            ) : null}
          </div>
        }
      >
        <form
          id="store-filter-form"
          className="store-filter-grid"
          onSubmit={(event) => {
            event.preventDefault();
            applyQuery({ q: qInput });
          }}
        >
          <div className="store-filter-grid__search">
            <div className="store-desktop-search">
              <TextField
                label="Buscar"
                value={qInput}
                onChange={(event) => setQInput(event.target.value)}
                placeholder="Ej. iPhone, display, batería"
                leadingIcon={<Search className="h-4 w-4" />}
              />
            </div>

            <div className="store-mobile-controls">
              <TextField
                aria-label="Buscar productos"
                value={qInput}
                onChange={(event) => setQInput(event.target.value)}
                placeholder="Buscar productos"
                leadingIcon={<Search className="h-4 w-4" />}
                wrapperClassName="store-mobile-controls__search"
              />
              <div className="store-mobile-controls__sort">
                <Button
                  ref={mobileSortTriggerRef}
                  type="button"
                  variant="outline"
                  className="store-mobile-sort-btn"
                  aria-label={`Ordenar productos. Orden actual: ${mobileSortLabel}`}
                  aria-expanded={mobileFiltersOpen}
                  onClick={() => setMobileFiltersOpen((value) => !value)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="store-mobile-sort-btn__label">Ordenar</span>
                </Button>
              </div>
            </div>

            <div className="store-mobile-apply-row">
              <Button type="submit" className="w-full">
                Aplicar
              </Button>
            </div>
          </div>

          <div className="store-filter-grid__sort space-y-2">
            <label className="store-sort-label text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Ordenar</label>
            <div className="store-desktop-sort">
              <CustomSelect
                value={sort}
                onChange={(value) => applyQuery({ sort: value })}
                options={sortOptions}
                triggerClassName="min-h-11 rounded-2xl font-semibold"
                ariaLabel="Ordenar productos"
              />
            </div>
          </div>
        </form>
      </FilterBar>

      {categories.length > 0 ? (
        <SectionCard className="store-categories" title="Categorías" description="Filtrá el catálogo sin perder el contexto de compra.">
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
        </SectionCard>
      ) : null}

      {error ? (
        <SectionCard tone="info" className="border-rose-200 bg-rose-50">
          <div className="text-sm font-semibold text-rose-700">{error}</div>
        </SectionCard>
      ) : null}
      {mobileSortSheet}

      {isInitialLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SectionCard key={index} title="Cargando catálogo" description="Preparando resultados.">
              <LoadingBlock lines={4} />
            </SectionCard>
          ))}
        </div>
      ) : (
        <div data-store-results-shell className={loading ? 'is-loading' : ''}>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
              {products.map((product) => (
                <StoreGridCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <SectionCard>
              <EmptyState
                title={q ? 'No encontramos productos para tu búsqueda' : 'Todavía no hay productos publicados'}
                description={
                  q
                    ? `No encontramos coincidencias para "${q}"${selectedCategoryLabel !== 'Todas las categorías' ? ` en "${selectedCategoryLabel}"` : ''}.`
                    : 'Cuando el catálogo tenga productos activos, aparecerán acá con su stock real.'
                }
                actions={
                  <>
                    {(q || category) ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setQInput('');
                          setMobileFiltersOpen(false);
                          setSearchParams(new URLSearchParams());
                        }}
                      >
                        Limpiar filtros
                      </Button>
                    ) : null}
                    <Button variant="ghost" asChild>
                      <Link to="/reparacion">Consultar reparación</Link>
                    </Button>
                  </>
                }
              />
            </SectionCard>
          )}
        </div>
      )}
    </PageShell>
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

        <div className="product-meta">{product.category?.name ?? 'Producto general'}</div>

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


