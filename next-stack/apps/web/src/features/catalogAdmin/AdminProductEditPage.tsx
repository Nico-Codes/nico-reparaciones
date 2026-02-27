import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { catalogAdminApi, type AdminCategory, type AdminProduct } from './api';
import { productPricingApi } from './productPricingApi';

function peso(n: number) {
  return `$ ${Math.round(n || 0).toLocaleString('es-AR')}`;
}

export function AdminProductEditPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [provider, setProvider] = useState('Sin proveedor');
  const [purchaseRef, setPurchaseRef] = useState('');
  const [costPrice, setCostPrice] = useState('0');
  const [price, setPrice] = useState('0');
  const [stock, setStock] = useState('0');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [recommendedPrice, setRecommendedPrice] = useState<number | null>(null);
  const [recommendedMarginPercent, setRecommendedMarginPercent] = useState<number | null>(null);
  const [recommendedRuleName, setRecommendedRuleName] = useState<string | null>(null);
  const [pricingHint, setPricingHint] = useState('Define categoria + costo para calcular automaticamente.');
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [preventNegativeMargin, setPreventNegativeMargin] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const [cats, prod, settings] = await Promise.all([
          catalogAdminApi.categories(),
          catalogAdminApi.product(id),
          productPricingApi.settings().catch(() => null),
        ]);
        if (!mounted) return;
        setCategories(cats.items);
        setProduct(prod.item);
        setName(prod.item.name ?? '');
        setSlug(prod.item.slug ?? '');
        setSku(prod.item.sku ?? '');
        setBarcode(prod.item.barcode ?? '');
        setCategoryId(prod.item.categoryId ?? '');
        setCostPrice(String(prod.item.costPrice ?? 0));
        setPrice(String(prod.item.price ?? 0));
        setStock(String(prod.item.stock ?? 0));
        setDescription(prod.item.description ?? '');
        setPreventNegativeMargin(settings?.preventNegativeMargin ?? true);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Error cargando producto');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    const category = categoryId.trim();
    const cost = Number(costPrice || 0);

    if (!category || !Number.isFinite(cost) || cost < 0) {
      setRecommendedPrice(null);
      setRecommendedMarginPercent(null);
      setRecommendedRuleName(null);
      setPricingHint('Define categoria + costo para calcular automaticamente.');
      return;
    }

    const timeout = setTimeout(() => {
      void (async () => {
        setLoadingRecommendation(true);
        try {
          const res = await productPricingApi.resolveRecommendedPrice({
            categoryId: category,
            costPrice: cost,
            productId: id || null,
          });
          setRecommendedPrice(res.recommendedPrice);
          setRecommendedMarginPercent(res.marginPercent);
          setRecommendedRuleName(res.rule?.name ?? null);
          setPricingHint(
            res.rule?.name
              ? `Regla: ${res.rule.name} (${res.marginPercent}% margen).`
              : `Sin regla especifica. Margen base: ${res.marginPercent}%.`,
          );
        } catch {
          setRecommendedPrice(null);
          setRecommendedMarginPercent(null);
          setRecommendedRuleName(null);
          setPricingHint('No se pudo calcular precio recomendado.');
        } finally {
          setLoadingRecommendation(false);
        }
      })();
    }, 280);

    return () => clearTimeout(timeout);
  }, [id, categoryId, costPrice]);

  const marginStats = useMemo(() => {
    const c = Number(costPrice || 0);
    const p = Number(price || 0);
    const utility = p - c;
    const margin = c > 0 ? ((utility / c) * 100) : 0;
    const tone: 'emerald' | 'amber' | 'rose' = utility > 0 ? 'emerald' : utility === 0 ? 'amber' : 'rose';
    return { utility, margin, tone };
  }, [costPrice, price]);

  async function save() {
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      const nextCost = Number(costPrice || 0);
      const nextPrice = Number(price || 0);
      if (preventNegativeMargin && Number.isFinite(nextCost) && Number.isFinite(nextPrice) && nextPrice < nextCost) {
        setError('El precio de venta no puede ser menor al costo (guard de margen activo).');
        return;
      }

      const res = await catalogAdminApi.updateProduct(id, {
        name: name.trim(),
        slug: (slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
        sku: sku.trim() || null,
        barcode: barcode.trim() || null,
        categoryId: categoryId || null,
        costPrice: Number(costPrice || 0),
        price: Number(price || 0),
        stock: Math.max(0, Math.trunc(Number(stock || 0))),
        description: description.trim() || null,
      });
      setProduct(res.item);
      setName(res.item.name ?? '');
      setSlug(res.item.slug ?? '');
      setSku(res.item.sku ?? '');
      setBarcode(res.item.barcode ?? '');
      setCategoryId(res.item.categoryId ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando producto');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="store-shell"><div className="card"><div className="card-body">Cargando producto...</div></div></div>;

  if (!product) {
    return <div className="store-shell"><div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error || 'Producto no encontrado'}</div></div>;
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="grid gap-4 md:grid-cols-[1.1fr_auto] md:items-start">
          <div className="grid gap-3 md:grid-cols-[160px_1fr] md:items-start">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 md:text-[2.05rem] leading-tight">Editar<br/>producto</h1>
            <p className="pt-1 text-sm text-zinc-600 md:max-w-md">Actualiza identificacion, precio, stock, categoria e imagen.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button type="button" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">Garantia</button>
            <button type="button" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">Etiqueta</button>
            <Link to="/admin/productos" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">Volver</Link>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

      <section className="card">
        <div className="card-head flex items-center justify-between gap-2">
          <div className="text-xl font-black tracking-tight text-zinc-900">Datos del producto</div>
          <span className="badge-zinc">ID #{product.id.slice(0, 2)}</span>
        </div>
        <div className="card-body space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Nombre *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-zinc-700">Slug (opcional)</span>
                <input value={slug} onChange={(e) => setSlug(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
              </label>
              <p className="mt-1 text-xs text-zinc-500">Si lo dejas vacio, se genera desde el nombre.</p>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">SKU interno *</span>
              <input value={sku} onChange={(e) => setSku(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Codigo de barras (opcional)</span>
            <input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Ej: 7791234567890" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Categoria *</span>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
                <option value="">Sin categoria</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Proveedor</span>
              <select value={provider} onChange={(e) => setProvider(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
                <option>Sin proveedor</option>
                <option>Puntocell</option>
                <option>Evophone</option>
                <option>Celuphone</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Referencia de compra (opcional)</span>
            <input value={purchaseRef} onChange={(e) => setPurchaseRef(e.target.value)} placeholder="Ej: Factura 0081-000123, lote A12" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Precio de costo *</span>
              <input type="number" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </label>
            <div>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-zinc-700">Precio de venta (recomendado)</span>
                <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setPrice(String(recommendedPrice ?? 0))} disabled={recommendedPrice == null || loadingRecommendation} className="btn-outline !h-8 !rounded-xl px-3 text-xs font-bold disabled:opacity-60">Usar recomendado</button>
                <span className="badge-zinc">{loadingRecommendation ? 'Calculando...' : `Recomendado: ${peso(recommendedPrice ?? 0)}`}</span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">{pricingHint}</p>
              {recommendedRuleName ? (
                <p className="mt-1 text-xs text-zinc-500">Regla aplicada: {recommendedRuleName} ({recommendedMarginPercent ?? 0}% margen)</p>
              ) : null}
              <div className={`mt-2 rounded-xl border px-3 py-2 text-sm font-bold ${marginStats.tone === 'emerald' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : marginStats.tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                Margen {marginStats.margin >= 0 ? '+' : ''}{marginStats.margin.toFixed(1)}%. Utilidad: {peso(marginStats.utility)}.
              </div>
            </div>
          </div>

          <label className="block max-w-md">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Stock *</span>
            <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Descripcion (opcional)</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Detalles, compatibilidad, color, etc." className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm" />
          </label>

          <div className="grid gap-4 md:grid-cols-[1fr_160px] md:items-start">
            <div>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-zinc-700">Imagen (opcional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const url = URL.createObjectURL(f);
                    setImagePreview(url);
                  }}
                  className="block h-11 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-bold"
                />
              </label>
              <button type="button" className="btn-outline mt-2 !h-10 !rounded-xl px-4 text-sm font-bold">Usar camara</button>
              <p className="mt-2 text-xs text-zinc-500">En escritorio, usa el boton "Usar camara". En celular, puedes usar camara o archivo. Si subes una nueva, reemplaza la actual y se recorta automaticamente en cuadrado.</p>
            </div>
            <div>
              <div className="mb-1 text-sm font-bold text-zinc-700">Vista previa</div>
              <div className="flex h-[116px] w-[116px] items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-400 overflow-hidden">
                {imagePreview ? <img src={imagePreview} alt="preview" className="h-full w-full object-cover" /> : 'Sin imagen'}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <button type="button" className="text-2xl font-medium tracking-tight text-zinc-900">Eliminar producto</button>
        <button type="button" onClick={() => void save()} disabled={saving} className="btn-primary !h-11 !rounded-2xl px-6 text-sm font-bold">
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}