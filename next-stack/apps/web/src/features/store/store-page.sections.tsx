import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState, type RefObject } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Search, ShoppingCart, SlidersHorizontal, Tags, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { LoadingBlock } from '@/components/ui/loading-block';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { CustomSelect } from '@/components/ui/custom-select';
import { cartStorage } from '@/features/cart/storage';
import {
  buildStoreCategoryPathLabel,
  STORE_SORT_OPTIONS,
  type StoreSortOption,
  type StoreSortValue,
} from './store-page.helpers';
import {
  buildSpecialOrderCheckoutUrl,
  getAvailableStoreProductColorOptions,
  requiresStoreProductColorSelection,
} from './store-product-detail.helpers';
import type { StoreCategory, StoreProduct } from './types';

type StoreToolbarSectionProps = {
  qInput: string;
  hasActiveFilters: boolean;
  onQInputChange: (value: string) => void;
  onSubmit: () => void;
  onClearFilters: () => void;
};

type StoreMobileSortSheetProps = {
  open: boolean;
  mobileSortDraft: StoreSortValue;
  onClose: () => void;
  onDraftChange: (value: StoreSortValue) => void;
  onSelect: (value: StoreSortValue) => void;
};

type StoreCategoriesSectionProps = {
  categories: StoreCategory[];
  activeCategory: string | null;
  activeParentSlug: string | null;
  activeChildSlug: string | null;
  subcategories: StoreCategory[];
  sort: string;
  sortOptions: StoreSortOption[];
  mobileSortLabel: string;
  mobileFiltersOpen: boolean;
  mobileSortTriggerRef: RefObject<HTMLButtonElement | null>;
  onSelectCategory: (category: string | null) => void;
  onSortChange: (value: string) => void;
  onToggleMobileFilters: () => void;
};

type StoreResultsSectionProps = {
  products: StoreProduct[];
  q: string;
  selectedCategoryLabel: string;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
};

function usePopupPresence(open: boolean, exitMs = 180) {
  const [shouldRender, setShouldRender] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setClosing(false);
      return;
    }
    if (!shouldRender) return;

    setClosing(true);
    const timeout = window.setTimeout(() => {
      setShouldRender(false);
      setClosing(false);
    }, exitMs);

    return () => window.clearTimeout(timeout);
  }, [exitMs, open, shouldRender]);

  return { shouldRender, closing };
}

export function StoreToolbarSection({
  qInput,
  hasActiveFilters,
  onQInputChange,
  onSubmit,
  onClearFilters,
}: StoreToolbarSectionProps) {
  return (
    <FilterBar className="store-toolbar">
      <form
        id="store-filter-form"
        className="store-filter-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="store-filter-grid__search">
          <div className="store-desktop-search">
            <TextField
              label="Buscar"
              value={qInput}
              onChange={(event) => onQInputChange(event.target.value)}
              placeholder="Ej. iPhone, display, bateria"
            />
          </div>

          <div className="store-mobile-controls">
            <TextField
              aria-label="Buscar productos"
              value={qInput}
              onChange={(event) => onQInputChange(event.target.value)}
              placeholder="Buscar productos"
              wrapperClassName="store-mobile-controls__search"
            />
            <Button
              type="submit"
              size="icon"
              className="store-mobile-search-submit"
              aria-label="Buscar productos"
              title="Buscar productos"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="store-filter-grid__actions">
          <Button
            type="submit"
            size="icon"
            className="store-filter-grid__apply"
            aria-label="Buscar productos"
            title="Buscar productos"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </Button>
          {hasActiveFilters ? (
            <Button type="button" variant="outline" className="store-filter-grid__clear" onClick={onClearFilters}>
              Limpiar
            </Button>
          ) : null}
        </div>
      </form>
    </FilterBar>
  );
}

export function StoreMobileSortSheet({
  open,
  mobileSortDraft,
  onClose,
  onDraftChange,
  onSelect,
}: StoreMobileSortSheetProps) {
  const { shouldRender, closing } = usePopupPresence(open);

  if (!shouldRender || typeof document === 'undefined') return null;

  return createPortal(
    <div className={`store-mobile-sort-overlay ${closing ? 'is-closing' : ''}`} role="presentation">
      <button type="button" className="store-mobile-sort-backdrop" aria-label="Cerrar panel de orden" onClick={onClose} />
      <div className="store-mobile-sort-sheet" role="dialog" aria-modal="true" aria-labelledby="store-mobile-sort-title">
        <div className="store-mobile-sort-sheet__header">
          <div className="store-mobile-sort-sheet__heading">
            <h2 id="store-mobile-sort-title" className="store-mobile-sort-sheet__title">
              Ordenar productos
            </h2>
            <p className="store-mobile-sort-sheet__subtitle">Elegi como queres ver el catalogo.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Cerrar ordenamiento" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="store-mobile-sort-options">
          {STORE_SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`store-mobile-sort-option ${mobileSortDraft === option.value ? 'is-active' : ''}`}
              onClick={() => {
                onDraftChange(option.value);
                onSelect(option.value);
              }}
            >
              <span>{option.label}</span>
              {mobileSortDraft === option.value ? <Check className="h-4 w-4" /> : null}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function StoreCategoriesSection({
  categories,
  activeCategory,
  activeParentSlug,
  activeChildSlug,
  sort,
  sortOptions,
  mobileSortLabel,
  mobileFiltersOpen,
  mobileSortTriggerRef,
  onSelectCategory,
  onSortChange,
  onToggleMobileFilters,
}: StoreCategoriesSectionProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedParentSlug, setExpandedParentSlug] = useState<string | null>(activeParentSlug);

  const activeParent = useMemo(
    () => categories.find((category) => category.slug === activeParentSlug) ?? null,
    [categories, activeParentSlug],
  );
  const activeChild = useMemo(
    () => activeParent?.children.find((category) => category.slug === activeChildSlug) ?? null,
    [activeParent, activeChildSlug],
  );
  const selectedLabel = activeChild
    ? buildStoreCategoryPathLabel({ ...activeChild, parentName: activeParent?.name ?? null })
    : activeParent?.name ?? 'Todas las categorias';
  useEffect(() => {
    if (!open) return;
    setSearchTerm('');
    setExpandedParentSlug(activeParentSlug);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeParentSlug, open]);

  if (categories.length === 0) return null;

  return (
    <SectionCard className="store-categories" bodyClassName="store-categories__body">
      <div className="store-categories__summary">
        <button
          type="button"
          className="store-categories__trigger store-categories__trigger--category"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span className="store-categories__trigger-icon" aria-hidden="true">
            <Tags className="h-4 w-4" />
          </span>
          <span className="store-categories__trigger-copy">
            <span>Categorias</span>
            <strong>{selectedLabel}</strong>
          </span>
          <ChevronDown className="store-categories__trigger-caret h-4 w-4" aria-hidden="true" />
        </button>
        <div className="store-categories__sort-desktop" aria-label="Ordenar productos">
          <span className="store-categories__sort-icon" aria-hidden="true">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <CustomSelect
            value={sort}
            onChange={onSortChange}
            options={sortOptions}
            className="store-categories__sort-select"
            triggerClassName="store-categories__sort-trigger"
            ariaLabel="Ordenar productos"
          />
        </div>
        <Button
          ref={mobileSortTriggerRef}
          type="button"
          variant="outline"
          className="store-categories__sort-mobile store-mobile-sort-btn"
          aria-label={`Ordenar productos. Orden actual: ${mobileSortLabel}`}
          aria-expanded={mobileFiltersOpen}
          onClick={onToggleMobileFilters}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="store-mobile-sort-btn__label">Ordenar</span>
        </Button>
        {activeCategory ? (
          <button
            type="button"
            className="store-categories__clear"
            onClick={() => {
              onSelectCategory(null);
              setOpen(false);
            }}
          >
            Limpiar
          </button>
        ) : null}
      </div>
      <StoreCategoryPickerPanel
        open={open}
        categories={categories}
        activeCategory={activeCategory}
        activeParentSlug={activeParentSlug}
        activeChildSlug={activeChildSlug}
        expandedParentSlug={expandedParentSlug}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onExpandedParentChange={setExpandedParentSlug}
        onClose={() => setOpen(false)}
        onSelectCategory={(category) => {
          onSelectCategory(category);
          setOpen(false);
        }}
      />
    </SectionCard>
  );
}

function StoreCategoryPickerPanel({
  open,
  categories,
  activeCategory,
  activeParentSlug,
  activeChildSlug,
  expandedParentSlug,
  searchTerm,
  onSearchTermChange,
  onExpandedParentChange,
  onClose,
  onSelectCategory,
}: {
  open: boolean;
  categories: StoreCategory[];
  activeCategory: string | null;
  activeParentSlug: string | null;
  activeChildSlug: string | null;
  expandedParentSlug: string | null;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onExpandedParentChange: (value: string | null) => void;
  onClose: () => void;
  onSelectCategory: (category: string | null) => void;
}) {
  const { shouldRender, closing } = usePopupPresence(open);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleCategories = useMemo(() => {
    if (!normalizedSearch) return categories;
    return categories.filter((category) => {
      const parentMatches = category.name.toLowerCase().includes(normalizedSearch);
      const childMatches = category.children.some((child) => child.name.toLowerCase().includes(normalizedSearch));
      return parentMatches || childMatches;
    });
  }, [categories, normalizedSearch]);

  if (!shouldRender || typeof document === 'undefined') return null;

  return createPortal(
    <div className={`store-category-picker ${closing ? 'is-closing' : ''}`} role="presentation">
      <button type="button" className="store-category-picker__backdrop" aria-label="Cerrar categorias" onClick={onClose} />
      <div className="store-category-picker__dialog" role="dialog" aria-modal="true" aria-labelledby="store-category-picker-title">
        <div className="store-category-picker__header">
          <div>
            <h2 id="store-category-picker-title">Elegir categoria</h2>
            <p>Filtra el catalogo sin ocupar espacio en la tienda.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Cerrar categorias" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <label className="store-category-picker__search">
          <Search className="h-4 w-4" aria-hidden="true" />
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Buscar categoria o subcategoria"
            autoFocus
          />
        </label>

        <div className="store-category-picker__list">
          <button
            type="button"
            className={`store-category-option store-category-option--all ${!activeCategory ? 'is-active' : ''}`}
            onClick={() => onSelectCategory(null)}
          >
            <span>
              <strong>Todas las categorias</strong>
              <small>Ver todo el catalogo</small>
            </span>
            {!activeCategory ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
          </button>

          {visibleCategories.map((category) => {
            const parentMatches = normalizedSearch && category.name.toLowerCase().includes(normalizedSearch);
            const visibleChildren = normalizedSearch
              ? category.children.filter((child) => parentMatches || child.name.toLowerCase().includes(normalizedSearch))
              : category.children;
            const expanded = expandedParentSlug === category.slug || (Boolean(normalizedSearch) && visibleChildren.length > 0);
            const isParentActive = activeParentSlug === category.slug && activeCategory === category.slug;

            return (
              <div key={category.id} className={`store-category-group ${expanded ? 'is-expanded' : ''}`}>
                <button
                  type="button"
                  className={`store-category-option ${activeParentSlug === category.slug ? 'is-parent-active' : ''}`}
                  onClick={() => onExpandedParentChange(expanded ? null : category.slug)}
                >
                  <span>
                    <strong>{category.name}</strong>
                    <small>{category.productsCount} productos</small>
                  </span>
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </button>

                <div className="store-category-group__children" aria-hidden={!expanded}>
                  <div className="store-category-group__children-inner">
                    <button
                      type="button"
                      tabIndex={expanded ? undefined : -1}
                      className={`store-category-child ${isParentActive ? 'is-active' : ''}`}
                      onClick={() => onSelectCategory(category.slug)}
                    >
                      <span>Todo en {category.name}</span>
                      {isParentActive ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                    </button>
                    {visibleChildren.map((child) => {
                      const isChildActive = activeChildSlug === child.slug;
                      return (
                        <button
                          key={child.id}
                          type="button"
                          tabIndex={expanded ? undefined : -1}
                          className={`store-category-child ${isChildActive ? 'is-active' : ''}`}
                          onClick={() => onSelectCategory(child.slug)}
                        >
                          <span>{child.name}</span>
                          <small>{child.productsCount}</small>
                          {isChildActive ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {visibleCategories.length === 0 ? (
            <div className="store-category-picker__empty">No hay categorias que coincidan con esa busqueda.</div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function StoreErrorSection({ message }: { message: string }) {
  return (
    <SectionCard tone="info" className="border-rose-200 bg-rose-50">
      <div className="text-sm font-semibold text-rose-700">{message}</div>
    </SectionCard>
  );
}

export function StoreLoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <SectionCard key={index} title="Cargando catalogo" description="Preparando resultados.">
          <LoadingBlock lines={4} />
        </SectionCard>
      ))}
    </div>
  );
}

export function StoreResultsSection({
  products,
  q,
  selectedCategoryLabel,
  hasActiveFilters,
  onClearFilters,
}: StoreResultsSectionProps) {
  if (products.length > 0) {
    return (
      <div className="store-products-grid grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {products.map((product) => (
          <StoreGridCard key={product.id} product={product} />
        ))}
      </div>
    );
  }

  return (
    <SectionCard>
      <EmptyState
        title={q ? 'No encontramos productos para tu busqueda' : 'Todavia no hay productos publicados'}
        description={
          q
            ? `No encontramos coincidencias para "${q}"${selectedCategoryLabel !== 'Todas las categorias' ? ` en "${selectedCategoryLabel}"` : ''}.`
            : 'Cuando el catalogo tenga productos activos, apareceran aca con su stock real.'
        }
        actions={
          <>
            {hasActiveFilters ? (
              <Button type="button" variant="outline" onClick={onClearFilters}>
                Limpiar filtros
              </Button>
            ) : null}
            <Button variant="ghost" asChild>
              <Link to="/reparacion">Consultar reparacion</Link>
            </Button>
          </>
        }
      />
    </SectionCard>
  );
}

function StoreGridCard({ product }: { product: StoreProduct }) {
  const navigate = useNavigate();
  const isSpecialOrder = product.fulfillmentMode === 'SPECIAL_ORDER';
  const requiresColorSelection = requiresStoreProductColorSelection(product);
  const availableColorOptions = getAvailableStoreProductColorOptions(product);
  const canPurchase = isSpecialOrder
    ? requiresColorSelection
      ? availableColorOptions.length > 0
      : product.supplierAvailability !== 'OUT_OF_STOCK'
    : product.stock > 0;
  const canAddDirectly = !requiresColorSelection || availableColorOptions.length === 1;
  const quickVariantId = requiresColorSelection ? availableColorOptions[0]?.id ?? null : null;
  const actionLabel = !canPurchase
    ? 'Sin stock'
    : requiresColorSelection && !canAddDirectly
      ? 'Elegir color'
      : isSpecialOrder
        ? 'Encargar'
        : 'Agregar al carrito';
  const useTextAction = isSpecialOrder;

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

        <div className="flex flex-wrap gap-1.5">
          {isSpecialOrder ? <StatusBadge tone="accent" size="sm" label="Por encargue" /> : null}
          {requiresColorSelection ? <StatusBadge tone="info" size="sm" label="Elegir color" /> : null}
        </div>

        <div className="product-purchase-block">
          <div className="product-meta">{product.category ? buildStoreCategoryPathLabel(product.category) : 'Producto general'}</div>

          <div className="product-row">
            <div className="product-price">$ {product.price.toLocaleString('es-AR')}</div>

            <div className="product-actions">
              <button
                type="button"
                className={`btn-cart ${useTextAction ? 'btn-cart--label' : ''} ${canPurchase ? '' : 'is-disabled'}`}
                disabled={!canPurchase}
                aria-label={actionLabel}
                title={canPurchase ? actionLabel : 'Sin stock'}
                onClick={() => {
                  if (!canAddDirectly) {
                    navigate(`/store/${product.slug}`);
                    return;
                  }
                  if (isSpecialOrder) {
                    navigate(buildSpecialOrderCheckoutUrl(product.id, 1, quickVariantId));
                    return;
                  }
                  cartStorage.add(product.id, 1, { productName: product.name, variantId: quickVariantId });
                }}
              >
                {useTextAction ? (
                  <span>{actionLabel}</span>
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
