import { createPortal } from 'react-dom';
import type { RefObject } from 'react';
import { Link } from 'react-router-dom';
import { Check, Search, ShoppingCart, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { LoadingBlock } from '@/components/ui/loading-block';
import { SectionCard } from '@/components/ui/section-card';
import { TextField } from '@/components/ui/text-field';
import { CustomSelect } from '@/components/ui/custom-select';
import { cartStorage } from '@/features/cart/storage';
import { STORE_SORT_OPTIONS, type StoreSortOption, type StoreSortValue } from './store-page.helpers';
import type { StoreCategory, StoreProduct } from './types';

type StoreToolbarSectionProps = {
  qInput: string;
  sort: string;
  sortOptions: StoreSortOption[];
  mobileSortLabel: string;
  mobileFiltersOpen: boolean;
  hasActiveFilters: boolean;
  mobileSortTriggerRef: RefObject<HTMLButtonElement | null>;
  onQInputChange: (value: string) => void;
  onSubmit: () => void;
  onSortChange: (value: string) => void;
  onToggleMobileFilters: () => void;
  onClearFilters: () => void;
};

type StoreMobileSortSheetProps = {
  open: boolean;
  mobileSortDraft: StoreSortValue;
  onClose: () => void;
  onDraftChange: (value: StoreSortValue) => void;
  onApply: () => void;
};

type StoreCategoriesSectionProps = {
  categories: StoreCategory[];
  activeCategory: string | null;
  onSelectCategory: (category: string | null) => void;
};

type StoreResultsSectionProps = {
  products: StoreProduct[];
  q: string;
  selectedCategoryLabel: string;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
};

export function StoreToolbarSection({
  qInput,
  sort,
  sortOptions,
  mobileSortLabel,
  mobileFiltersOpen,
  hasActiveFilters,
  mobileSortTriggerRef,
  onQInputChange,
  onSubmit,
  onSortChange,
  onToggleMobileFilters,
  onClearFilters,
}: StoreToolbarSectionProps) {
  return (
    <FilterBar
      className="store-toolbar"
      actions={
        <div className="store-toolbar-actions store-toolbar-actions--desktop">
          <Button type="submit" form="store-filter-form">
            Aplicar
          </Button>
          {hasActiveFilters ? (
            <Button type="button" variant="outline" onClick={onClearFilters}>
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
              leadingIcon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="store-mobile-controls">
            <TextField
              aria-label="Buscar productos"
              value={qInput}
              onChange={(event) => onQInputChange(event.target.value)}
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
                onClick={onToggleMobileFilters}
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
              onChange={onSortChange}
              options={sortOptions}
              triggerClassName="min-h-11 rounded-2xl font-semibold"
              ariaLabel="Ordenar productos"
            />
          </div>
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
  onApply,
}: StoreMobileSortSheetProps) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="store-mobile-sort-overlay" role="presentation">
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
              onClick={() => onDraftChange(option.value)}
            >
              <span>{option.label}</span>
              {mobileSortDraft === option.value ? <Check className="h-4 w-4" /> : null}
            </button>
          ))}
        </div>

        <div className="store-mobile-sort-actions">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" size="sm" onClick={onApply}>
            Aplicar
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function StoreCategoriesSection({ categories, activeCategory, onSelectCategory }: StoreCategoriesSectionProps) {
  if (categories.length === 0) return null;

  return (
    <SectionCard className="store-categories" bodyClassName="store-categories__body">
      <div className="store-categories__rail" aria-label="Categorias del catalogo">
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`nav-pill shrink-0 whitespace-nowrap ${!activeCategory ? 'nav-pill-active' : ''}`}
        >
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectCategory(category.slug)}
            className={`nav-pill shrink-0 whitespace-nowrap ${activeCategory === category.slug ? 'nav-pill-active' : ''}`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </SectionCard>
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
