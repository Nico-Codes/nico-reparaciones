import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogAdminApi, type AdminCategory, type AdminProduct } from './api';

export function AdminProductsPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);

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
    void loadCategories().catch((e) => setError(e instanceof Error ? e.message : 'Error cargando categorias'));
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [q, categoryId, activeFilter]);

  const rows = useMemo(() => products.slice(0, 80), [products]);
  const tableCols = '32px 2.5fr 0.85fr 0.9fr 1.05fr 0.65fr 0.95fr 0.95fr 1.05fr 1.9fr 1.1fr';

  async function patchProduct(id: string, patch: Record<string, unknown>) {
    try {
      const res = await catalogAdminApi.updateProduct(id, patch);
      setProducts((prev) => prev.map((p) => (p.id === id ? res.item : p)));
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
            <p className="mt-1 text-sm text-zinc-600">Administra catalogo con identificacion por SKU y codigo de barras.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">Categorias</button>
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
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm font-bold">
              <option value="">Categoria: Todas</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm font-bold">
              <option value="">Estado: Todos</option>
              <option value="1">Estado: Activos</option>
              <option value="0">Estado: Inactivos</option>
            </select>
            <select className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm font-bold">
              <option>Destacado: Todos</option>
            </select>
            <select className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm font-bold">
              <option>Stock: Todos</option>
            </select>
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
              <div>CATEGORIA</div>
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
              rows.map((p, idx) => {
                const cost = Number(p.costPrice ?? 0);
                const sale = Number(p.price ?? 0);
                const marginPct = cost > 0 ? Math.round(((sale - cost) / cost) * 100) : 0;
                const marginVal = Math.max(0, sale - cost);
                return (
                  <div
                    key={p.id}
                    className={`grid items-center gap-0 px-2 py-2 ${idx ? 'border-t border-zinc-100' : ''}`} style={{ gridTemplateColumns: tableCols }}
                  >
                    <div><input type="checkbox" aria-label={`Seleccionar ${p.name}`} /></div>

                    <div className="flex min-w-0 items-center gap-2">
                      <div className="h-8 w-8 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                        {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" loading="lazy" /> : null}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black tracking-tight text-zinc-900">{p.name}</div>
                        <div className="text-xs text-zinc-500">ID: {p.id.slice(0, 4)}</div>
                      </div>
                    </div>

                    <div className="truncate text-xs font-black leading-tight text-zinc-800">{p.sku || '-'}</div>
                    <div className="truncate text-xs leading-tight text-zinc-800">{p.barcode || '-'}</div>
                    <div className="truncate text-xs text-zinc-900">{p.category?.name || '-'}</div>
                    <div className="truncate text-xs text-zinc-900">{p.supplier?.name || '-'}</div>

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
                        <div className="text-xs font-black text-emerald-700">{p.stock}</div>
                      </div>
                      <QuickStockCell value={p.stock} onSave={(v) => void patchProduct(p.id, { stock: Math.max(0, Math.trunc(v)) })} />
                    </div>

                    <div className="relative flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setOpenActionsId((prev) => (prev === p.id ? null : p.id))}
                        className="btn-outline !h-8 !rounded-xl px-2.5 text-xs font-bold"
                        aria-expanded={openActionsId === p.id}
                      >
                        Acciones
                      </button>
                      {openActionsId === p.id ? (
                        <div className="absolute right-0 top-10 z-20 min-w-[180px] rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.28)]">
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                void patchProduct(p.id, { active: !p.active });
                                setOpenActionsId(null);
                              }}
                              className="flex h-9 w-full items-center justify-between rounded-xl px-3 text-sm font-bold text-zinc-800 hover:bg-zinc-50"
                            >
                              <span>Estado</span>
                              <Pill tone={p.active ? 'emerald' : 'zinc'}>{p.active ? 'Activo' : 'Inactivo'}</Pill>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void patchProduct(p.id, { featured: !p.featured });
                                setOpenActionsId(null);
                              }}
                              className="flex h-9 w-full items-center justify-between rounded-xl px-3 text-sm font-bold text-zinc-800 hover:bg-zinc-50"
                            >
                              <span>Destacado</span>
                              <Pill tone={p.featured ? 'amber' : 'zinc'}>{p.featured ? 'Si' : 'No'}</Pill>
                            </button>
                            <button type="button" className="flex h-9 w-full items-center rounded-xl px-3 text-sm font-bold text-zinc-800 hover:bg-zinc-50">
                              Etiqueta
                            </button>
                            <Link
                              to={`/admin/productos/${encodeURIComponent(p.id)}/editar`}
                              onClick={() => setOpenActionsId(null)}
                              className="flex h-9 w-full items-center rounded-xl px-3 text-sm font-bold text-zinc-800 hover:bg-zinc-50"
                            >
                              Editar
                            </Link>
                          </div>
                        </div>
                      ) : null}
                    </div>
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
