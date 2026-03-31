import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageShell } from '@/components/ui/page-shell';
import { storeApi } from './api';
import {
  buildStoreFallbackHero,
  buildStoreHeroVisualVars,
  buildStoreSearchParams,
  buildStoreSortOptions,
  getSelectedStoreCategoryLabel,
  getStoreSortLabel,
  hasStoreActiveFilters,
  type StoreQueryPatch,
} from './store-page.helpers';
import {
  StoreCategoriesSection,
  StoreErrorSection,
  StoreLoadingGrid,
  StoreMobileSortSheet,
  StoreResultsSection,
  StoreToolbarSection,
} from './store-page.sections';
import type { StoreCategory, StoreHeroConfig, StoreProductsResponse } from './types';

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

  function applyQuery(next: StoreQueryPatch) {
    setSearchParams(buildStoreSearchParams(new URLSearchParams(searchParams), next));
  }

  function clearFilters() {
    setQInput('');
    setMobileFiltersOpen(false);
    setSearchParams(new URLSearchParams());
  }

  const sortOptions = useMemo(() => buildStoreSortOptions(), []);
  const selectedCategoryLabel = useMemo(
    () => getSelectedStoreCategoryLabel(categories, category),
    [categories, category],
  );
  const hasActiveFilters = hasStoreActiveFilters(q, category, sort);

  const products = productsData?.items ?? [];
  const isInitialLoading = loading && !productsData;
  const hero = heroConfig ?? buildStoreFallbackHero();
  const heroVisualVars = buildStoreHeroVisualVars(hero);
  const mobileSortLabel = getStoreSortLabel(sort);

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

      <StoreToolbarSection
        qInput={qInput}
        sort={sort}
        sortOptions={sortOptions}
        mobileSortLabel={mobileSortLabel}
        mobileFiltersOpen={mobileFiltersOpen}
        hasActiveFilters={hasActiveFilters}
        mobileSortTriggerRef={mobileSortTriggerRef}
        onQInputChange={setQInput}
        onSubmit={() => applyQuery({ q: qInput })}
        onSortChange={(value) => applyQuery({ sort: value })}
        onToggleMobileFilters={() => setMobileFiltersOpen((value) => !value)}
        onClearFilters={clearFilters}
      />

      <StoreCategoriesSection
        categories={categories}
        activeCategory={category}
        onSelectCategory={(value) => applyQuery({ category: value })}
      />

      {error ? <StoreErrorSection message={error} /> : null}

      <StoreMobileSortSheet
        open={mobileFiltersOpen}
        mobileSortDraft={mobileSortDraft}
        onClose={() => {
          setMobileFiltersOpen(false);
          mobileSortTriggerRef.current?.focus();
        }}
        onDraftChange={setMobileSortDraft}
        onApply={() => {
          applyQuery({ sort: mobileSortDraft });
          setMobileFiltersOpen(false);
          mobileSortTriggerRef.current?.focus();
        }}
      />

      {isInitialLoading ? (
        <StoreLoadingGrid />
      ) : (
        <div data-store-results-shell className={loading ? 'is-loading' : ''}>
          <StoreResultsSection
            products={products}
            q={q}
            selectedCategoryLabel={selectedCategoryLabel}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        </div>
      )}
    </PageShell>
  );
}
