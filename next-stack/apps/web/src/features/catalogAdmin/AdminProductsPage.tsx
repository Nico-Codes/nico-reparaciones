import { useEffect, useMemo, useState } from 'react';
import { Boxes, PackagePlus, RefreshCcw, Search, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ActionDropdown } from '@/components/ui/action-dropdown';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { catalogAdminApi, type AdminCategory, type AdminProduct } from './api';

function money(value: number) {
  return `$ ${value.toLocaleString('es-AR')}`;
}

function marginTone(value: number): 'success' | 'warning' | 'danger' {
  if (value > 0) return 'success';
  if (value === 0) return 'warning';
  return 'danger';
}

function stockTone(stock: number): 'success' | 'warning' | 'danger' {
  if (stock <= 0) return 'danger';
  if (stock <= 3) return 'warning';
  return 'success';
}

export function AdminProductsPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  async function loadCategories() {
    const response = await catalogAdminApi.categories();
    setCategories(response.items);
  }

  async function loadProducts() {
    setLoading(true);
    setError('');
    try {
      const response = await catalogAdminApi.products({ q, categoryId: categoryId || undefined, active: activeFilter || undefined });
      setProducts(response.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories().catch((cause) => setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las categorías.'));
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [q, categoryId, activeFilter]);

  const filteredProducts = useMemo(
    () =>
      products
        .filter((product) => {
          if (featuredFilter === '1' && !product.featured) return false;
          if (featuredFilter === '0' && product.featured) return false;
          if (stockFilter === 'with' && product.stock <= 0) return false;
          if (stockFilter === 'empty' && product.stock > 0) return false;
          return true;
        })
        .slice(0, 80),
    [products, featuredFilter, stockFilter],
  );

  const stats = useMemo(
    () => ({
      total: products.length,
      active: products.filter((product) => product.active).length,
      featured: products.filter((product) => product.featured).length,
      lowStock: products.filter((product) => product.stock > 0 && product.stock <= 3).length,
      noStock: products.filter((product) => product.stock <= 0).length,
    }),
    [products],
  );

  const hasFilters = Boolean(q.trim() || categoryId || activeFilter || featuredFilter || stockFilter);

  const categoryOptions = useMemo(
    () => [{ value: '', label: 'Todas las categorías' }, ...categories.map((category) => ({ value: category.id, label: category.name }))],
    [categories],
  );

  const activeOptions = [
    { value: '', label: 'Todos los estados' },
    { value: '1', label: 'Solo activos' },
    { value: '0', label: 'Solo inactivos' },
  ];

  const featuredOptions = [
    { value: '', label: 'Todo el catálogo' },
    { value: '1', label: 'Solo destacados' },
    { value: '0', label: 'Solo no destacados' },
  ];

  const stockOptions = [
    { value: '', label: 'Todo el stock' },
    { value: 'with', label: 'Con stock' },
    { value: 'empty', label: 'Sin stock' },
  ];

  async function patchProduct(id: string, patch: Record<string, unknown>) {
    try {
      const response = await catalogAdminApi.updateProduct(id, patch);
      setProducts((current) => current.map((product) => (product.id === id ? response.item : product)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el producto.');
    }
  }

  return (
    <PageShell context="admin" className="space-y-6">
      <PageHeader
        context="admin"
        eyebrow="Catálogo"
        title="Productos"
        subtitle="Administrá el catálogo, el stock y la información comercial con una sola vista operativa y sin ruido visual innecesario."
        actions={
          <>
            <StatusBadge tone="info" label={`${products.length} en catálogo`} />
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/categorias">Categorías</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/admin/productos/crear">
                <PackagePlus className="h-4 w-4" />
                Nuevo producto
              </Link>
            </Button>
          </>
        }
      />

      <section className="nr-stat-grid" data-reveal>
        <MetricCard label="Catálogo visible" value={String(stats.total)} meta="Productos cargados en esta vista operativa" />
        <MetricCard label="Activos" value={String(stats.active)} meta="Items disponibles para publicar y vender" />
        <MetricCard label="Destacados" value={String(stats.featured)} meta="Productos reforzados en la tienda" />
        <MetricCard label="Stock crítico" value={String(stats.lowStock + stats.noStock)} meta="Items con poco stock o agotados" />
      </section>

      <FilterBar
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            {hasFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQ('');
                  setCategoryId('');
                  setActiveFilter('');
                  setFeaturedFilter('');
                  setStockFilter('');
                }}
              >
                Limpiar
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={() => void loadProducts()}>
              <RefreshCcw className="h-4 w-4" />
              Recargar
            </Button>
          </div>
        }
      >
        <TextField
          value={q}
          onChange={(event) => setQ(event.target.value)}
          label="Buscar"
          placeholder="Nombre, slug, SKU o código"
          leadingIcon={<Search className="h-4 w-4" />}
          wrapperClassName="min-w-0 sm:min-w-[18rem]"
        />
        <SelectField label="Categoría" value={categoryId} onChange={setCategoryId} options={categoryOptions} ariaLabel="Filtrar por categoría" />
        <SelectField label="Estado" value={activeFilter} onChange={setActiveFilter} options={activeOptions} ariaLabel="Filtrar por estado" />
        <SelectField label="Destacado" value={featuredFilter} onChange={setFeaturedFilter} options={featuredOptions} ariaLabel="Filtrar por destacado" />
        <SelectField label="Stock" value={stockFilter} onChange={setStockFilter} options={stockOptions} ariaLabel="Filtrar por stock" />
      </FilterBar>

      <SectionCard
        title="Catálogo operativo"
        description="Listado resumido con precio, margen, stock y acciones de edición rápidas."
        actions={<StatusBadge tone={hasFilters ? 'accent' : 'neutral'} size="sm" label={hasFilters ? `${filteredProducts.length} resultados` : 'Vista general'} />}
      >
        {error ? (
          <div className="ui-alert ui-alert--danger mb-4">
            <Boxes className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <span className="ui-alert__title">No se pudo actualizar el catálogo.</span>
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
              description={hasFilters ? 'Probá con otra combinación de filtros o limpiá la búsqueda.' : 'Todavía no se cargaron productos en el catálogo.'}
              actions={
                hasFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setQ('');
                      setCategoryId('');
                      setActiveFilter('');
                      setFeaturedFilter('');
                      setStockFilter('');
                    }}
                  >
                    Limpiar filtros
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/admin/productos/crear">Crear producto</Link>
                  </Button>
                )
              }
            />
          ) : (
            filteredProducts.map((product) => {
              const cost = Number(product.costPrice ?? 0);
              const sale = Number(product.price ?? 0);
              const marginValue = sale - cost;
              const marginPercent = cost > 0 ? Math.round(((sale - cost) / cost) * 100) : 0;
              return (
                <article key={product.id} className="admin-entity-row">
                  <div className="admin-entity-row__top">
                    <div className="admin-entity-row__heading">
                      <div className="admin-entity-row__title-row">
                        <div className="admin-entity-row__title">{product.name}</div>
                        <StatusBadge tone={product.active ? 'success' : 'neutral'} size="sm" label={product.active ? 'Activo' : 'Inactivo'} />
                        {product.featured ? <StatusBadge tone="accent" size="sm" label="Destacado" /> : null}
                        <StatusBadge tone={stockTone(product.stock)} size="sm" label={product.stock > 0 ? `Stock ${product.stock}` : 'Sin stock'} />
                      </div>
                      <div className="admin-entity-row__meta">
                        <span>{product.category?.name || 'Sin categoría'}</span>
                        <span>{product.supplier?.name || 'Sin proveedor'}</span>
                        <span>SKU: {product.sku || 'No informado'}</span>
                        <span>Código: {product.barcode || 'No informado'}</span>
                      </div>
                    </div>
                    <div className="admin-entity-row__aside">
                      <span className="admin-entity-row__eyebrow">Venta</span>
                      <div className="admin-entity-row__value">{money(sale)}</div>
                    </div>
                  </div>

                  <div className="mt-4 detail-grid">
                    <div className="detail-stack">
                      <div className="detail-panel">
                        <div className="detail-panel__label">Costo</div>
                        <div className="detail-panel__value">{money(cost)}</div>
                      </div>
                      <div className="detail-panel">
                        <div className="detail-panel__label">Margen</div>
                        <div className="detail-panel__value">
                          {marginPercent >= 0 ? '+' : ''}
                          {marginPercent}% · {money(marginValue)}
                        </div>
                      </div>
                    </div>

                    <div className="detail-panel">
                      <div className="detail-panel__label">Descripción comercial</div>
                      <div className="detail-panel__value">{product.description?.trim() || 'Sin descripción cargada.'}</div>
                    </div>
                  </div>

                  <div className="admin-entity-row__actions">
                    <div className="flex flex-wrap items-center gap-2">
                      <QuickStockEditor value={product.stock} onSave={(nextValue) => void patchProduct(product.id, { stock: Math.max(0, Math.trunc(nextValue)) })} />
                      <StatusBadge tone={marginTone(marginValue)} size="sm" label={marginValue > 0 ? 'Margen positivo' : marginValue === 0 ? 'Sin margen' : 'Margen negativo'} />
                    </div>

                    <ActionDropdown
                      className="flex items-center justify-end"
                      renderTrigger={({ open, toggle, triggerRef, menuId }) => (
                        <Button
                          ref={triggerRef}
                          type="button"
                          variant="outline"
                          size="sm"
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
                              void patchProduct(product.id, { active: !product.active });
                              close();
                            }}
                            className="dropdown-item flex items-center justify-between gap-2"
                          >
                            <span>Estado</span>
                            <StatusBadge tone={product.active ? 'success' : 'neutral'} size="sm" label={product.active ? 'Activo' : 'Inactivo'} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void patchProduct(product.id, { featured: !product.featured });
                              close();
                            }}
                            className="dropdown-item flex items-center justify-between gap-2"
                          >
                            <span>Destacado</span>
                            <StatusBadge tone={product.featured ? 'accent' : 'neutral'} size="sm" label={product.featured ? 'Sí' : 'No'} />
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
            })
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}

function MetricCard({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <article className="nr-stat-card">
      <div className="nr-stat-card__label">{label}</div>
      <div className="nr-stat-card__value">{value}</div>
      <div className="nr-stat-card__meta">{meta}</div>
    </article>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  ariaLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
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

function QuickStockEditor({ value, onSave }: { value: number; onSave: (value: number) => void }) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);

  return (
    <div className="flex items-center gap-2 rounded-[1rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
      <input
        type="number"
        min="0"
        value={local}
        onChange={(event) => setLocal(event.target.value)}
        className="h-8 w-[72px] rounded-xl border border-zinc-200 bg-white px-2 text-center text-sm font-bold"
        aria-label="Stock rápido"
      />
      <Button type="button" variant="outline" size="sm" onClick={() => onSave(Number(local || 0))}>
        Guardar
      </Button>
    </div>
  );
}
