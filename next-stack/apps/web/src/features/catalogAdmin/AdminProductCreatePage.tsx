import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import { adminApi } from '@/features/admin/api';
import { catalogAdminApi, type AdminCategory } from './api';
import { productPricingApi } from './productPricingApi';

function peso(n: number) {
  return `$ ${Math.round(n || 0).toLocaleString('es-AR')}`;
}

function slugify(raw: string) {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function AdminProductCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [purchaseRef, setPurchaseRef] = useState('');
  const [costPrice, setCostPrice] = useState('0');
  const [price, setPrice] = useState('0');
  const [stock, setStock] = useState('0');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);

  const [recommendedPrice, setRecommendedPrice] = useState<number | null>(null);
  const [recommendedMarginPercent, setRecommendedMarginPercent] = useState<number | null>(null);
  const [recommendedRuleName, setRecommendedRuleName] = useState<string | null>(null);
  const [pricingHint, setPricingHint] = useState('Definí categoría + costo para calcular automáticamente.');
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [preventNegativeMargin, setPreventNegativeMargin] = useState(true);

  function clearPreviewObjectUrl() {
    setPreviewObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  useEffect(() => {
    return () => {
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    };
  }, [previewObjectUrl]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [cats, settings, providersRes] = await Promise.all([
          catalogAdminApi.categories(),
          productPricingApi.settings().catch(() => null),
          adminApi.providers({ active: '1' }).catch(() => ({ items: [] })),
        ]);
        if (!mounted) return;
        setCategories(cats.items);
        setSuppliers(providersRes.items.map((p) => ({ id: p.id, name: p.name })));
        setPreventNegativeMargin(settings?.preventNegativeMargin ?? true);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Error cargando formulario');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const category = categoryId.trim();
    const cost = Number(costPrice || 0);

    if (!category || !Number.isFinite(cost) || cost < 0) {
      setRecommendedPrice(null);
      setRecommendedMarginPercent(null);
      setRecommendedRuleName(null);
      setPricingHint('Definí categoría + costo para calcular automáticamente.');
      return;
    }

    const timeout = setTimeout(() => {
      void (async () => {
        setLoadingRecommendation(true);
        try {
          const res = await productPricingApi.resolveRecommendedPrice({
            categoryId: category,
            costPrice: cost,
            productId: null,
          });
          setRecommendedPrice(res.recommendedPrice);
          setRecommendedMarginPercent(res.marginPercent);
          setRecommendedRuleName(res.rule?.name ?? null);
          setPricingHint(
            res.rule?.name
              ? `Regla: ${res.rule.name} (${res.marginPercent}% margen).`
              : `Sin regla específica. Margen base: ${res.marginPercent}%.`,
          );
        } catch {
          setRecommendedPrice(null);
          setRecommendedMarginPercent(null);
          setRecommendedRuleName(null);
          setPricingHint('No se pudo calcular el precio recomendado.');
        } finally {
          setLoadingRecommendation(false);
        }
      })();
    }, 280);

    return () => clearTimeout(timeout);
  }, [categoryId, costPrice]);

  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'Sin categoría' },
      ...categories.map((category) => ({ value: category.id, label: category.name })),
    ],
    [categories],
  );

  const supplierOptions = useMemo(
    () => [
      { value: '', label: 'Sin proveedor' },
      ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
    ],
    [suppliers],
  );

  const marginStats = useMemo(() => {
    const c = Number(costPrice || 0);
    const p = Number(price || 0);
    const utility = p - c;
    const margin = c > 0 ? (utility / c) * 100 : 0;
    const tone: 'emerald' | 'amber' | 'rose' = utility > 0 ? 'emerald' : utility === 0 ? 'amber' : 'rose';
    return { utility, margin, tone };
  }, [costPrice, price]);

  async function save() {
    setSaving(true);
    setError('');
    try {
      const trimmedName = name.trim();
      const nextSlug = slugify(slug.trim() || trimmedName);
      if (!trimmedName || nextSlug.length < 2) {
        setError('Nombre y slug válidos son requeridos.');
        return;
      }

      const nextCost = Number(costPrice || 0);
      const nextPrice = Number(price || 0);
      if (preventNegativeMargin && Number.isFinite(nextCost) && Number.isFinite(nextPrice) && nextPrice < nextCost) {
        setError('El precio de venta no puede ser menor al costo (guard de margen activo).');
        return;
      }

      const createRes = await catalogAdminApi.createProduct({
        name: trimmedName,
        slug: nextSlug,
        sku: sku.trim() || null,
        barcode: barcode.trim() || null,
        categoryId: categoryId || null,
        supplierId: supplierId || null,
        purchaseReference: purchaseRef.trim() || null,
        costPrice: Number(costPrice || 0),
        price: Number(price || 0),
        stock: Math.max(0, Math.trunc(Number(stock || 0))),
        description: description.trim() || null,
        featured,
        active,
      });

      if (imageFile) {
        await catalogAdminApi.uploadProductImage(createRes.item.id, imageFile);
      }

      navigate('/admin/productos', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error creando producto');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="store-shell"><div className="card"><div className="card-body">Cargando formulario...</div></div></div>;

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="grid gap-4 md:grid-cols-[1.1fr_auto] md:items-start">
          <div className="grid gap-3 md:grid-cols-[160px_1fr] md:items-start">
            <h1 className="text-2xl font-black leading-tight tracking-tight text-zinc-900 md:text-[2.05rem]">Nuevo<br/>producto</h1>
            <p className="max-w-md pt-1 text-sm text-zinc-600">Alta completa en catálogo con precio, stock, categoría e imagen.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link to="/admin/productos" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">Volver</Link>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

      <section className="card">
        <div className="card-head flex items-center justify-between gap-2">
          <div className="text-xl font-black tracking-tight text-zinc-900">Datos del producto</div>
          <span className="badge-zinc">Alta</span>
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
              <p className="mt-1 text-xs text-zinc-500">Si lo dejás vacío, se genera desde el nombre.</p>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">SKU *</span>
              <input value={sku} onChange={(e) => setSku(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Código de barras (opcional)</span>
            <input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Ej: 7791234567890" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Categoría</span>
              <CustomSelect
                value={categoryId}
                onChange={setCategoryId}
                options={categoryOptions}
                triggerClassName="min-h-11 rounded-2xl font-bold"
                ariaLabel="Seleccionar categoría"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Proveedor</span>
              <CustomSelect
                value={supplierId}
                onChange={setSupplierId}
                options={supplierOptions}
                triggerClassName="min-h-11 rounded-2xl font-bold"
                ariaLabel="Seleccionar proveedor"
              />
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
                <span className="mb-1 block text-sm font-bold text-zinc-700">Precio de venta *</span>
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

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block max-w-md">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Stock *</span>
              <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 rounded-2xl border border-zinc-200 px-3 py-2 text-sm font-bold text-zinc-700">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                Activo
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-zinc-200 px-3 py-2 text-sm font-bold text-zinc-700">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                Destacado
              </label>
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Descripción (opcional)</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Detalles, compatibilidad, color, etc." className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm" />
          </label>

          <div className="grid gap-4 md:grid-cols-[1fr_160px] md:items-start">
            <div>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-zinc-700">Imagen (opcional)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    clearPreviewObjectUrl();
                    const url = URL.createObjectURL(f);
                    setImageFile(f);
                    setPreviewObjectUrl(url);
                    setImagePreview(url);
                  }}
                  className="block h-11 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-bold"
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearPreviewObjectUrl();
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  disabled={saving || !imagePreview}
                  className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold disabled:opacity-60"
                >
                  Quitar imagen
                </button>
                {imageFile ? <span className="badge-zinc">{imageFile.name}</span> : null}
              </div>
              <p className="mt-2 text-xs text-zinc-500">JPG/PNG/WEBP. Máximo 4 MB. Se sube automáticamente al guardar el producto.</p>
            </div>
            <div>
              <div className="mb-1 text-sm font-bold text-zinc-700">Vista previa</div>
              <div className="flex h-[116px] w-[116px] items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-400">
                {imagePreview ? <img src={imagePreview} alt="preview" className="h-full w-full object-cover" /> : 'Sin imagen'}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3 pb-2">
        <button type="button" onClick={() => void save()} disabled={saving} className="btn-primary !h-11 !rounded-2xl px-6 text-sm font-bold">
          {saving ? 'Guardando...' : 'Crear producto'}
        </button>
      </div>
    </div>
  );
}
