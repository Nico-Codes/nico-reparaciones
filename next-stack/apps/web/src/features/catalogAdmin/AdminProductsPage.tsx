import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { catalogAdminApi, type AdminCategory, type AdminProduct } from './api';

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function AdminProductsPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [catName, setCatName] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    price: '',
    costPrice: '',
    stock: '0',
    sku: '',
    barcode: '',
    categoryId: '',
    active: true,
    featured: false,
  });

  async function loadCategories() {
    const res = await catalogAdminApi.categories();
    setCategories(res.items);
  }

  async function loadProducts() {
    setLoading(true);
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

  const totals = useMemo(() => ({
    count: products.length,
    stock: products.reduce((acc, p) => acc + p.stock, 0),
  }), [products]);

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = catName.trim();
    if (!name) return;
    await catalogAdminApi.createCategory({ name, slug: slugify(name), active: true });
    setCatName('');
    await loadCategories();
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    await catalogAdminApi.createProduct({
      name: productForm.name,
      slug: productForm.slug || slugify(productForm.name),
      price: Number(productForm.price || 0),
      costPrice: productForm.costPrice ? Number(productForm.costPrice) : null,
      stock: Number(productForm.stock || 0),
      sku: productForm.sku || null,
      barcode: productForm.barcode || null,
      categoryId: productForm.categoryId || null,
      active: productForm.active,
      featured: productForm.featured,
    });
    setProductForm({ name: '', slug: '', price: '', costPrice: '', stock: '0', sku: '', barcode: '', categoryId: '', active: true, featured: false });
    await loadProducts();
  }

  async function patchProduct(id: string, patch: Record<string, unknown>) {
    try {
      const res = await catalogAdminApi.updateProduct(id, patch);
      setProducts((prev) => prev.map((p) => (p.id === id ? res.item : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error actualizando producto');
    }
  }

  async function patchCategory(id: string, patch: Record<string, unknown>) {
    try {
      const res = await catalogAdminApi.updateCategory(id, patch);
      setCategories((prev) => prev.map((c) => (c.id === id ? res.item : c)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error actualizando categoría');
    }
  }

  return (
    <div className="store-shell">
      <div className="page-head store-hero">
          <div>
            <div className="page-title">Productos y categorías</div>
            <div className="page-subtitle">Gestión básica de catálogo con edición rápida de stock, precio y estados.</div>
          </div>
          <Link to="/admin" className="btn-outline h-11 w-full justify-center sm:w-auto">Volver a admin</Link>
      </div>

      {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-[380px_1fr]">
          <div className="space-y-4">
            <section className="card">
              <div className="card-body p-4">
              <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Nueva categoría</div>
              <form className="mt-3 flex gap-2" onSubmit={(e) => void createCategory(e)}>
                <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Accesorios" className="h-10 flex-1 rounded-xl border border-zinc-200 px-3 text-sm" />
                <button className="btn-primary h-10 justify-center px-4" type="submit">Agregar</button>
              </form>
              <div className="mt-3 space-y-2 max-h-80 overflow-auto pr-1">
                {categories.map((c) => (
                  <div key={c.id} className="rounded-xl border border-zinc-200 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">{c.name}</div>
                        <div className="text-xs text-zinc-500">{c.productsCount} productos</div>
                      </div>
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700">
                        <input type="checkbox" checked={c.active} onChange={(e) => void patchCategory(c.id, { active: e.target.checked })} />
                        Activa
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </section>

            <section className="card">
              <div className="card-body p-4">
              <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Nuevo producto</div>
              <form className="mt-3 grid gap-2" onSubmit={(e) => void createProduct(e)}>
                <input
                  value={productForm.name}
                  onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value, slug: p.slug || slugify(e.target.value) }))}
                  placeholder="Nombre producto"
                  className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
                  required
                />
                <input value={productForm.slug} onChange={(e) => setProductForm((p) => ({ ...p, slug: e.target.value }))} placeholder="slug-producto" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={productForm.price} onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))} type="number" min="0" placeholder="Precio venta" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" required />
                  <input value={productForm.costPrice} onChange={(e) => setProductForm((p) => ({ ...p, costPrice: e.target.value }))} type="number" min="0" placeholder="Costo (opc.)" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input value={productForm.stock} onChange={(e) => setProductForm((p) => ({ ...p, stock: e.target.value }))} type="number" min="0" placeholder="Stock" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
                  <input value={productForm.sku} onChange={(e) => setProductForm((p) => ({ ...p, sku: e.target.value }))} placeholder="SKU" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
                  <input value={productForm.barcode} onChange={(e) => setProductForm((p) => ({ ...p, barcode: e.target.value }))} placeholder="Código" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
                </div>
                <select value={productForm.categoryId} onChange={(e) => setProductForm((p) => ({ ...p, categoryId: e.target.value }))} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm">
                  <option value="">Sin categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={productForm.active} onChange={(e) => setProductForm((p) => ({ ...p, active: e.target.checked }))} /> Activo</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={productForm.featured} onChange={(e) => setProductForm((p) => ({ ...p, featured: e.target.checked }))} /> Destacado</label>
                </div>
                <button className="btn-primary h-11 w-full justify-center" type="submit">Crear producto</button>
              </form>
              </div>
            </section>
          </div>

          <section className="card">
            <div className="card-body p-4">
            <div className="mb-3 grid gap-2 md:grid-cols-[1fr_220px_180px]">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto / sku / Código..." className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm">
                <option value="">Todas las categorías</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm">
                <option value="">Activos e inactivos</option>
                <option value="1">Solo activos</option>
                <option value="0">Solo inactivos</option>
              </select>
            </div>

            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              <InfoCard label="Productos listados" value={String(totals.count)} />
              <InfoCard label="Stock total listado" value={String(totals.stock)} />
            </div>

            {loading ? (
              <div className="rounded-xl border border-zinc-200 p-3 text-sm">Cargando productos...</div>
            ) : products.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 p-3 text-sm">No hay productos.</div>
            ) : (
              <div className="space-y-2">
                {products.map((p) => (
                  <div key={p.id} className="rounded-xl border border-zinc-200 p-3">
                    <div className="grid gap-3 md:grid-cols-[1.3fr_auto]">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-zinc-900">{p.name}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {p.category?.name || 'Sin categoría'} · SKU {p.sku || '—'} · Código {p.barcode || '—'}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge active={p.active}>{p.active ? 'Activo' : 'Inactivo'}</Badge>
                          <Badge active={p.featured} color="amber">{p.featured ? 'Destacado' : 'Normal'}</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:w-[280px]">
                        <QuickNumber
                          label="Precio"
                          value={p.price}
                          onSave={(v) => void patchProduct(p.id, { price: v })}
                          money
                        />
                        <QuickNumber
                          label="Stock"
                          value={p.stock}
                          onSave={(v) => void patchProduct(p.id, { stock: Math.max(0, Math.trunc(v)) })}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={p.active} onChange={(e) => void patchProduct(p.id, { active: e.target.checked })} />
                        Activo
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={p.featured} onChange={(e) => void patchProduct(p.id, { featured: e.target.checked })} />
                        Destacado
                      </label>
                      <select value={p.categoryId ?? ''} onChange={(e) => void patchProduct(p.id, { categoryId: e.target.value || null })} className="h-9 rounded-xl border border-zinc-200 px-3 text-sm">
                        <option value="">Sin categoría</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </section>
        </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-black text-zinc-900">{value}</div>
    </div>
  );
}

function Badge({ children, active, color = 'sky' }: { children: React.ReactNode; active: boolean; color?: 'sky' | 'amber' }) {
  const on = color === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-sky-200 bg-sky-50 text-sky-800';
  const off = 'border-zinc-200 bg-zinc-100 text-zinc-600';
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${active ? on : off}`}>{children}</span>;
}

function QuickNumber({
  label,
  value,
  onSave,
  money = false,
}: {
  label: string;
  value: number;
  onSave: (value: number) => void;
  money?: boolean;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</span>
      <div className="flex gap-1">
        <input
          type="number"
          min="0"
          step={money ? '0.01' : '1'}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          className="h-9 w-full rounded-xl border border-zinc-200 px-2 text-sm"
        />
        <button
          type="button"
          onClick={() => onSave(Number(local || 0))}
          className="h-9 rounded-xl border border-zinc-200 bg-white px-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
        >
          OK
        </button>
      </div>
    </label>
  );
}


