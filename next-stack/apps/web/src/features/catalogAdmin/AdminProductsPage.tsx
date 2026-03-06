import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ActionDropdown } from '@/components/ui/action-dropdown';
import { CustomSelect } from '@/components/ui/custom-select';
import { catalogAdminApi, type AdminCategory, type AdminProduct } from './api';

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
    const res = await catalogAdminApi.categories();
    setCategories(res.items);
  }

  async function loadProducts() {
    setLoading(true);
    setError('');
    try {
      const res = await catalogAdminApi.products({ q, categoryId: categoryId || undefined, active: activeFilter || undefined });
      setProducts(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando productos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories().catch((e) => setError(e instanceof Error ? e.message : 'Error cargando categorías'));
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [q, categoryId, activeFilter]);

  const rows = useMemo(() => products.slice(0, 80), [products]);
  const tableCols = '32px 2.5fr 0.85fr 0.9fr 1.05fr 0.65fr 0.95fr 0.95fr 1.05fr 1.9fr 1.1fr';
  const categoryOptions = useMemo(
    () => [{ value: '', label: 'Categoría: Todas' }, ...categories.map((category) => ({ value: category.id, label: category.name }))],
    [categories],
  );
  const activeOptions = [
    { value: '', label: 'Estado: Todos' },
    { value: '1', label: 'Estado: Activos' },
    { value: '0', label: 'Estado: Inactivos' },
  ];
  const featuredOptions = [
    { value: '', label: 'Destacado: Todos' },
    { value: '1', label: 'Destacado: Sí' },
    { value: '0', label: 'Destacado: No' },
  ];
  const stockOptions = [
    { value: '', label: 'Stock: Todos' },
    { value: 'with', label: 'Stock: Con stock' },
    { value: 'empty', label: 'Stock: Sin stock' },
  ];

  async function patchProduct(id: string, patch: Record<string, unknown>) {
    try {
      const res = await catalogAdminApi.updateProduct(id, patch);
      setProducts((prev) => prev.map((product) => (product.id === id ? res.item : product)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error actualizando producto');
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Productos</h1>
            <p className="mt-1 text-sm text-zinc-600">Administra catálogo con identificación por SKU y código de barras.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/categorias" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">Categorías</Link>
            <Link to="/admin/productos/crear" className="btn-primary !h-10 !rounded-xl px-5 text-sm font-bold">+ Nuevo producto</Link>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

      <section className="card">
        <div className="card-body">
          <div className="grid gap-3 xl:grid-cols-[1.3fr_1.05fr_0.9fr_0.95fr_0.9fr_auto]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, slug, SKU"
              className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm"
            />
            <CustomSelect value={categoryId} onChange={setCategoryId} options={categoryOptions} triggerClassName="min-h-11 rounded-2xl font-bold" ariaLabel="Filtrar por categoría" />
            <CustomSelect value={activeFilter} onChange={setActiveFilter} options={activeOptions} triggerClassName="min-h-11 rounded-2xl font-bold" ariaLabel="Filtrar por estado" />
            <CustomSelect value={featuredFilter} onChange={setFeaturedFilter} options={featuredOptions} triggerClassName="min-h-11 rounded-2xl font-bold" ariaLabel="Filtrar por destacado" />
            <CustomSelect value={stockFilter} onChange={setStockFilter} options={stockOptions} triggerClassName="min-h-11 rounded-2xl font-bold" ariaLabel="Filtrar por stock" />
            <button type="button" onClick={() => void loadProducts()} className="btn-outline !h-11 !rounded-xl px-5 text-sm font-bold">
              Filtrar
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_8px_30px_-18px_#0f172a47]">
        <div>
          <div>
            <div className="grid gap-0 bg-zinc-50 px-2 py-2 text-[11px] font-black uppercase tracking-wide text-zinc-500" style={{ gridTemplateColumns: tableCols }}>
              <div><input type="checkbox" aria-label="Seleccionar todo" /></div>
              <div>PRODUCTO</div>
              <div>SKU</div>
              <div>BARCODE</div>
              <div>CATEGORÍA</div>
              <div>PROV.</div>
              <div className="text-right">COSTO</div>
              <div className="text-right">VENTA</div>
              <div>MARGEN</div>
              <div>STOCK</div>
              <div>ACCIONES</div>
            </div>

            {loading ? (
              <div className="p-4 text-sm text-zinc-600">Cargando productos...</div>
            ) : rows.length === 0 ? (
              <div className="p-4 text-sm text-zinc-600">No hay productos.</div>
            ) : (
              rows.map((product, idx) => {
                const cost = Number(product.costPrice ?? 0);
                const sale = Number(product.price ?? 0);
                const marginPct = cost > 0 ? Math.round(((sale - cost) / cost) * 100) : 0;
                const marginVal = Math.max(0, sale - cost);
                return (
                  <div
                    key={product.id}
                    className={`grid items-center gap-0 px-2 py-2 ${idx ? 'border-t border-zinc-100' : ''}`}
                    style={{ gridTemplateColumns: tableCols }}
                  >
                    <div><input type="checkbox" aria-label={`Seleccionar ${product.name}`} /></div>

                    <div className="flex min-w-0 items-center gap-2">
                      <div className="h-8 w-8 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" loading="lazy" /> : null}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black tracking-tight text-zinc-900">{product.name}</div>
                        <div className="text-xs text-zinc-500">ID: {product.id.slice(0, 4)}</div>
                      </div>
                    </div>

                    <div className="truncate text-xs font-black leading-tight text-zinc-800">{product.sku || '-'}</div>
                    <div className="truncate text-xs leading-tight text-zinc-800">{product.barcode || '-'}</div>
                    <div className="truncate text-xs text-zinc-900">{product.category?.name || '-'}</div>
                    <div className="truncate text-xs text-zinc-900">{product.supplier?.name || '-'}</div>

                    <div className="text-right">
                      <div className="text-xs font-black leading-tight text-zinc-900">$ {cost.toLocaleString('es-AR')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black leading-tight text-zinc-900">$ {sale.toLocaleString('es-AR')}</div>
                    </div>

                    <div>
                      <div className="inline-flex min-h-[34px] w-full flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-1.5 py-1 text-center">
                        <div className="text-[11px] font-black tracking-tight text-emerald-800">M: {marginPct >= 0 ? '+' : ''}{marginPct}%</div>
                        <div className="text-[10px] font-black text-emerald-700">$ {marginVal.toLocaleString('es-AR')}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="inline-flex min-h-[34px] min-w-[42px] flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-1.5 py-1 text-center">
                        <div className="text-[11px] font-black tracking-tight text-emerald-800">Stock</div>
                        <div className="text-xs font-black text-emerald-700">{product.stock}</div>
                      </div>
                      <QuickStockCell value={product.stock} onSave={(nextValue) => void patchProduct(product.id, { stock: Math.max(0, Math.trunc(nextValue)) })} />
                    </div>

                    <ActionDropdown
                      className="flex items-center justify-end"
                      renderTrigger={({ open, toggle, triggerRef, menuId }) => (
                        <button
                          ref={triggerRef}
                          type="button"
                          onClick={toggle}
                          className="btn-outline !h-8 !rounded-xl px-2.5 text-xs font-bold"
                          aria-haspopup="menu"
                          aria-controls={menuId}
                          aria-expanded={open ? 'true' : 'false'}
                        >
                          Acciones
                        </button>
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
                            <Pill tone={product.active ? 'emerald' : 'zinc'}>{product.active ? 'Activo' : 'Inactivo'}</Pill>
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
                            <Pill tone={product.featured ? 'amber' : 'zinc'}>{product.featured ? 'Sí' : 'No'}</Pill>
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
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Pill({ children, tone = 'zinc' }: { children: React.ReactNode; tone?: 'zinc' | 'emerald' | 'amber' }) {
  const tones = {
    zinc: 'border-zinc-200 bg-zinc-50 text-zinc-800',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
  } as const;
  return <span className={`inline-flex h-8 items-center rounded-full border px-3 text-sm font-bold ${tones[tone]}`}>{children}</span>;
}

function QuickStockCell({ value, onSave }: { value: number; onSave: (value: number) => void }) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min="0"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="h-8 w-[68px] rounded-xl border border-zinc-200 px-2 text-center text-sm font-bold"
      />
      <button type="button" onClick={() => onSave(Number(local || 0))} className="btn-outline !h-8 !rounded-xl px-2 text-xs font-bold">
        OK
      </button>
    </div>
  );
}
