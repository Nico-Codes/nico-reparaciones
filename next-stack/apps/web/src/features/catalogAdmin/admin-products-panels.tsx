import { useEffect, useState } from 'react';
import { Boxes, PackagePlus, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ActionDropdown } from '@/components/ui/action-dropdown';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { LoadingBlock } from '@/components/ui/loading-block';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import {
  ADMIN_PRODUCTS_ACTIVE_OPTIONS,
  ADMIN_PRODUCTS_FEATURED_OPTIONS,
  ADMIN_PRODUCTS_STOCK_OPTIONS,
  buildAdminProductPriceSummary,
  formatAdminProductMoney,
  getAdminProductMarginTone,
  getAdminProductStockTone,
  type AdminProductsStats,
} from './admin-products.helpers';
import type { AdminProduct } from './api';
import type { ProductSelectOption } from './admin-product-form.helpers';

export function AdminProductsStatsPanel({ stats }: { stats: AdminProductsStats }) {
  return (
    <section className="nr-stat-grid" data-reveal>
      <ProductMetricCard label="Catalogo visible" value={String(stats.total)} meta="Productos cargados en esta vista operativa" />
      <ProductMetricCard label="Activos" value={String(stats.active)} meta="Items disponibles para publicar y vender" />
      <ProductMetricCard label="Destacados" value={String(stats.featured)} meta="Productos reforzados en la tienda" />
      <ProductMetricCard label="Stock critico" value={String(stats.lowStock + stats.noStock)} meta="Items con poco stock o agotados" />
    </section>
  );
}

export function AdminProductsFiltersPanel({
  q,
  categoryId,
  activeFilter,
  featuredFilter,
  stockFilter,
  hasFilters,
  loading,
  categoryOptions,
  onQChange,
  onCategoryIdChange,
  onActiveFilterChange,
  onFeaturedFilterChange,
  onStockFilterChange,
  onClear,
  onReload,
}: {
  q: string;
  categoryId: string;
  activeFilter: string;
  featuredFilter: string;
  stockFilter: string;
  hasFilters: boolean;
  loading: boolean;
  categoryOptions: ProductSelectOption[];
  onQChange: (value: string) => void;
  onCategoryIdChange: (value: string) => void;
  onActiveFilterChange: (value: string) => void;
  onFeaturedFilterChange: (value: string) => void;
  onStockFilterChange: (value: string) => void;
  onClear: () => void;
  onReload: () => void;
}) {
  return (
    <FilterBar
      actions={
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {hasFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              Limpiar
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={onReload} disabled={loading}>
            Recargar
          </Button>
        </div>
      }
    >
      <TextField
        value={q}
        onChange={(event) => onQChange(event.target.value)}
        label="Buscar"
        placeholder="Nombre, slug, SKU o codigo"
        leadingIcon={<Tag className="h-4 w-4" />}
        wrapperClassName="min-w-0 sm:min-w-[18rem]"
      />
      <ProductsSelectField label="Categoria" value={categoryId} onChange={onCategoryIdChange} options={categoryOptions} ariaLabel="Filtrar por categoria" />
      <ProductsSelectField label="Estado" value={activeFilter} onChange={onActiveFilterChange} options={ADMIN_PRODUCTS_ACTIVE_OPTIONS} ariaLabel="Filtrar por estado" />
      <ProductsSelectField label="Destacado" value={featuredFilter} onChange={onFeaturedFilterChange} options={ADMIN_PRODUCTS_FEATURED_OPTIONS} ariaLabel="Filtrar por destacado" />
      <ProductsSelectField label="Stock" value={stockFilter} onChange={onStockFilterChange} options={ADMIN_PRODUCTS_STOCK_OPTIONS} ariaLabel="Filtrar por stock" />
    </FilterBar>
  );
}

export function AdminProductsCatalogPanel({
  loading,
  error,
  hasFilters,
  filteredProducts,
  pendingProductIds,
  onClearFilters,
  onPatchProduct,
}: {
  loading: boolean;
  error: string;
  hasFilters: boolean;
  filteredProducts: AdminProduct[];
  pendingProductIds: string[];
  onClearFilters: () => void;
  onPatchProduct: (id: string, patch: Record<string, unknown>) => void;
}) {
  return (
    <SectionCard
      title="Catalogo operativo"
      description="Listado resumido con precio, margen, stock y acciones de edicion rapidas."
      actions={
        <StatusBadge
          tone={hasFilters ? 'accent' : 'neutral'}
          size="sm"
          label={hasFilters ? `${filteredProducts.length} resultados` : 'Vista general'}
        />
      }
    >
      {error ? (
        <div className="ui-alert ui-alert--danger mb-4">
          <Boxes className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No se pudo actualizar el catalogo.</span>
            <div className="ui-alert__text">{error}</div>
          </div>
        </div>
      ) : null}

      <div className="admin-collection">
        {loading ? (
          <SectionCard tone="muted" bodyClassName="space-y-3">
            <LoadingBlock label="Cargando productos" lines={4} />
          </SectionCard>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Tag className="h-5 w-5" />}
            title="No hay productos para mostrar"
            description={
              hasFilters
                ? 'Proba con otra combinacion de filtros o limpia la busqueda.'
                : 'Todavia no se cargaron productos en el catalogo.'
            }
            actions={
              hasFilters ? (
                <Button type="button" variant="outline" onClick={onClearFilters}>
                  Limpiar filtros
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/admin/productos/crear">
                    <PackagePlus className="h-4 w-4" />
                    Crear producto
                  </Link>
                </Button>
              )
            }
          />
        ) : (
          filteredProducts.map((product) => (
            <AdminProductRow
              key={product.id}
              product={product}
              pending={pendingProductIds.includes(product.id)}
              onPatchProduct={onPatchProduct}
            />
          ))
        )}
      </div>
    </SectionCard>
  );
}

function AdminProductRow({
  product,
  pending,
  onPatchProduct,
}: {
  product: AdminProduct;
  pending: boolean;
  onPatchProduct: (id: string, patch: Record<string, unknown>) => void;
}) {
  const { cost, sale, marginValue, marginPercent } = buildAdminProductPriceSummary(product);

  return (
    <article className="admin-entity-row">
      <div className="admin-entity-row__top">
        <div className="admin-entity-row__heading">
          <div className="admin-entity-row__title-row">
            <div className="admin-entity-row__title">{product.name}</div>
            <StatusBadge tone={product.active ? 'success' : 'neutral'} size="sm" label={product.active ? 'Activo' : 'Inactivo'} />
            {product.featured ? <StatusBadge tone="accent" size="sm" label="Destacado" /> : null}
            <StatusBadge tone={getAdminProductStockTone(product.stock)} size="sm" label={product.stock > 0 ? `Stock ${product.stock}` : 'Sin stock'} />
          </div>
          <div className="admin-entity-row__meta">
            <span>{product.category?.name || 'Sin categoria'}</span>
            <span>{product.supplier?.name || 'Sin proveedor'}</span>
            <span>SKU: {product.sku || 'No informado'}</span>
            <span>Codigo: {product.barcode || 'No informado'}</span>
          </div>
        </div>

        <div className="admin-entity-row__aside">
          <span className="admin-entity-row__eyebrow">Venta</span>
          <div className="admin-entity-row__value">{formatAdminProductMoney(sale)}</div>
        </div>
      </div>

      <div className="mt-4 detail-grid">
        <div className="detail-stack">
          <div className="detail-panel">
            <div className="detail-panel__label">Costo</div>
            <div className="detail-panel__value">{formatAdminProductMoney(cost)}</div>
          </div>
          <div className="detail-panel">
            <div className="detail-panel__label">Margen</div>
            <div className="detail-panel__value">
              {marginPercent >= 0 ? '+' : ''}
              {marginPercent}% · {formatAdminProductMoney(marginValue)}
            </div>
          </div>
        </div>

        <div className="detail-panel">
          <div className="detail-panel__label">Descripcion comercial</div>
          <div className="detail-panel__value">{product.description?.trim() || 'Sin descripcion cargada.'}</div>
        </div>
      </div>

      <div className="admin-entity-row__actions">
        <div className="flex flex-wrap items-center gap-2">
          <ProductsQuickStockEditor
            disabled={pending}
            value={product.stock}
            onSave={(nextValue) => onPatchProduct(product.id, { stock: Math.max(0, Math.trunc(nextValue)) })}
          />
          <StatusBadge
            tone={getAdminProductMarginTone(marginValue)}
            size="sm"
            label={marginValue > 0 ? 'Margen positivo' : marginValue === 0 ? 'Sin margen' : 'Margen negativo'}
          />
        </div>

        <ActionDropdown
          className="flex items-center justify-end"
          renderTrigger={({ open, toggle, triggerRef, menuId }) => (
            <Button
              ref={triggerRef}
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={toggle}
              aria-haspopup="menu"
              aria-controls={menuId}
              aria-expanded={open ? 'true' : 'false'}
            >
              Acciones
            </Button>
          )}
          menuClassName="min-w-[12rem]"
        >
          {(close) => (
            <>
              <button
                type="button"
                onClick={() => {
                  onPatchProduct(product.id, { active: !product.active });
                  close();
                }}
                disabled={pending}
                className="dropdown-item flex items-center justify-between gap-2 disabled:pointer-events-none disabled:opacity-60"
              >
                <span>Estado</span>
                <StatusBadge tone={product.active ? 'success' : 'neutral'} size="sm" label={product.active ? 'Activo' : 'Inactivo'} />
              </button>
              <button
                type="button"
                onClick={() => {
                  onPatchProduct(product.id, { featured: !product.featured });
                  close();
                }}
                disabled={pending}
                className="dropdown-item flex items-center justify-between gap-2 disabled:pointer-events-none disabled:opacity-60"
              >
                <span>Destacado</span>
                <StatusBadge tone={product.featured ? 'accent' : 'neutral'} size="sm" label={product.featured ? 'Si' : 'No'} />
              </button>
              <Link to={`/admin/productos/${encodeURIComponent(product.id)}/etiqueta`} onClick={close} className="dropdown-item">
                Etiqueta
              </Link>
              <Link to={`/admin/productos/${encodeURIComponent(product.id)}/editar`} onClick={close} className="dropdown-item">
                Editar
              </Link>
            </>
          )}
        </ActionDropdown>
      </div>
    </article>
  );
}

function ProductMetricCard({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <article className="nr-stat-card">
      <div className="nr-stat-card__label">{label}</div>
      <div className="nr-stat-card__value">{value}</div>
      <div className="nr-stat-card__meta">{meta}</div>
    </article>
  );
}

function ProductsSelectField({
  label,
  value,
  onChange,
  options,
  ariaLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ProductSelectOption[];
  ariaLabel: string;
}) {
  return (
    <div className="ui-field min-w-0 sm:min-w-[12rem]">
      <span className="ui-field__label">{label}</span>
      <CustomSelect
        value={value}
        onChange={onChange}
        options={options}
        className="w-full"
        triggerClassName="min-h-11 rounded-[1rem]"
        ariaLabel={ariaLabel}
      />
    </div>
  );
}

function ProductsQuickStockEditor({
  value,
  onSave,
  disabled = false,
}: {
  value: number;
  onSave: (value: number) => void;
  disabled?: boolean;
}) {
  const [local, setLocal] = useState(String(value));

  useEffect(() => setLocal(String(value)), [value]);

  const nextValue = Number(local || 0);
  const canSave = !disabled && Number.isFinite(nextValue) && Math.max(0, Math.trunc(nextValue)) !== value;

  return (
    <div className="flex items-center gap-2 rounded-[1rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
      <input
        type="number"
        min="0"
        value={local}
        onChange={(event) => setLocal(event.target.value)}
        disabled={disabled}
        className="h-8 w-[72px] rounded-xl border border-zinc-200 bg-white px-2 text-center text-sm font-bold"
        aria-label="Stock rapido"
      />
      <Button type="button" variant="outline" size="sm" onClick={() => onSave(Number(local || 0))} disabled={!canSave}>
        Guardar
      </Button>
    </div>
  );
}
