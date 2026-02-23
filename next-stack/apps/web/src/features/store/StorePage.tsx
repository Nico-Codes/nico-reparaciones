import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { storeApi } from './api';
import type { StoreCategory, StoreProduct, StoreProductsResponse } from './types';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'newest', label: 'Más nuevos' },
  { value: 'price_asc', label: 'Precio menor' },
  { value: 'price_desc', label: 'Precio mayor' },
] as const;

export function StorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [productsData, setProductsData] = useState<StoreProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [qInput, setQInput] = useState(searchParams.get('q') ?? '');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category');
  const sort = (searchParams.get('sort') ?? 'relevance') as StoreProductsResponse['meta']['sort'];

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      storeApi.categories(),
      storeApi.products({ q, category, sort, page: 1, pageSize: 24 }),
    ])
      .then(([categoriesRes, productsRes]) => {
        if (!active) return;
        setCategories(categoriesRes.items);
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
      params.set('sort', next.sort);
    }
    setSearchParams(params, { replace: false });
  }

  const selectedCategoryLabel = useMemo(() => {
    if (!category) return 'Todas';
    return categories.find((c) => c.slug === category)?.name ?? category;
  }, [categories, category]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 p-6 text-white shadow-lg md:p-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold">
              <Star className="h-4 w-4" />
              Tienda Next (API + React)
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight md:text-4xl">Catálogo público migrado</h1>
            <p className="mt-2 text-sm text-sky-50 md:text-base">
              Primera versión real de la tienda en el nuevo stack. Búsqueda, categorías y orden conectados al API NestJS.
            </p>
          </div>
        </section>

        <section className="relative z-10 mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <form
            className="grid gap-3 md:grid-cols-[1fr_220px_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              applyQuery({ q: qInput });
            }}>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Buscar productos, SKU, código..."
                className="h-11 w-full rounded-xl border border-zinc-200 pl-9 pr-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <div className="hidden md:block">
              <select
                value={sort}
                onChange={(e) => applyQuery({ sort: e.target.value })}
                className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm font-semibold">
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="h-11 flex-1 md:flex-none">Aplicar</Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 md:hidden"
                onClick={() => setMobileFiltersOpen((v) => !v)}
                aria-expanded={mobileFiltersOpen}>
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </form>

          <div className={`${mobileFiltersOpen ? 'mt-3 block' : 'hidden'} md:hidden`}>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-500">Ordenar</span>
              <select
                value={sort}
                onChange={(e) => applyQuery({ sort: e.target.value })}
                className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm font-semibold">
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyQuery({ category: null })}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                !category ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}>
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => applyQuery({ category: cat.slug })}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  category === cat.slug ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}>
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-600">
          <div>
            {loading
              ? 'Cargando productos...'
              : productsData
                ? `${productsData.meta.total} productos · Categoría: ${selectedCategoryLabel}`
                : 'Sin resultados'}
          </div>
          {(q || category) ? (
            <button
              type="button"
              onClick={() => {
                setQInput('');
                setSearchParams(new URLSearchParams(sort && sort !== 'relevance' ? { sort } : {}));
              }}
              className="text-sm font-semibold text-sky-700 hover:text-sky-800">
              Limpiar filtros
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            {error}. Si todavía no corriste migraciones del nuevo stack, la tienda mostrará vacío.
          </div>
        ) : null}

        <section className={`mt-4 transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>
          {productsData && productsData.items.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productsData.items.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            !loading && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
                <div className="text-lg font-black text-zinc-900">No hay productos para mostrar</div>
                <div className="mt-1 text-sm text-zinc-600">
                  Podés cargar datos en PostgreSQL del nuevo stack y esta vista ya los tomará.
                </div>
              </div>
            )
          )}
        </section>
      </div>
    </div>
  );
}

function ProductCard({ item }: { item: StoreProduct }) {
  return (
    <Link
      to={`/store/${item.slug}`}
      className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="line-clamp-2 text-sm font-black text-zinc-900">{item.name}</div>
          <div className="mt-1 text-xs text-zinc-500">{item.category?.name ?? 'Sin categoría'}</div>
        </div>
        {item.featured ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            Destacado
          </span>
        ) : null}
      </div>
      <div className="text-2xl font-black tracking-tight text-zinc-900">
        ${item.price.toLocaleString('es-AR')}
      </div>
      <div className="mt-2 text-xs text-zinc-500">
        Stock: <span className={`font-bold ${item.stock > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{item.stock}</span>
      </div>
      {item.description ? <div className="mt-2 line-clamp-2 text-sm text-zinc-600">{item.description}</div> : null}
      <div className="mt-4 text-sm font-semibold text-sky-700 transition group-hover:text-sky-800">Ver detalle →</div>
    </Link>
  );
}
