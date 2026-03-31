import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ImagePlus, PackagePlus, Percent, Sparkles, Tag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import { adminApi } from '@/features/admin/api';
import { catalogAdminApi, type AdminCategory } from './api';
import { BooleanChoice, SelectField } from './admin-product-form.controls';
import { buildNamedOptions, buildProductMarginStats, money, slugify } from './admin-product-form.helpers';
import { productPricingApi } from './productPricingApi';

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
  const [pricingHint, setPricingHint] = useState('Definí categoría y costo para calcular automáticamente.');
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [preventNegativeMargin, setPreventNegativeMargin] = useState(true);

  function clearPreviewObjectUrl() {
    setPreviewObjectUrl((current) => {
      if (current) URL.revokeObjectURL(current);
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
        const [categoriesResponse, settings, providersResponse] = await Promise.all([
          catalogAdminApi.categories(),
          productPricingApi.settings().catch(() => null),
          adminApi.providers({ active: '1' }).catch(() => ({ items: [] })),
        ]);
        if (!mounted) return;
        setCategories(categoriesResponse.items);
        setSuppliers(providersResponse.items.map((provider) => ({ id: provider.id, name: provider.name })));
        setPreventNegativeMargin(settings?.preventNegativeMargin ?? true);
      } catch (cause) {
        if (!mounted) return;
        setError(cause instanceof Error ? cause.message : 'No se pudo cargar el formulario.');
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
      setPricingHint('Definí categoría y costo para calcular automáticamente.');
      return;
    }

    const timeout = setTimeout(() => {
      void (async () => {
        setLoadingRecommendation(true);
        try {
          const response = await productPricingApi.resolveRecommendedPrice({
            categoryId: category,
            costPrice: cost,
            productId: null,
          });
          setRecommendedPrice(response.recommendedPrice);
          setRecommendedMarginPercent(response.marginPercent);
          setRecommendedRuleName(response.rule?.name ?? null);
          setPricingHint(
            response.rule?.name
              ? `Regla aplicada: ${response.rule.name} (${response.marginPercent}% de margen).`
              : `Sin regla específica. Margen base sugerido: ${response.marginPercent}%.`,
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

  const finalSlug = useMemo(() => slugify(slug.trim() || name.trim()), [name, slug]);

  const categoryOptions = useMemo(() => buildNamedOptions(categories, 'Sin categoria'), [categories]);
  const supplierOptions = useMemo(() => buildNamedOptions(suppliers, 'Sin proveedor'), [suppliers]);
  const marginStats = useMemo(() => buildProductMarginStats(costPrice, price), [costPrice, price]);

  async function save() {
    setSaving(true);
    setError('');
    try {
      const trimmedName = name.trim();
      const nextSlug = slugify(slug.trim() || trimmedName);
      if (!trimmedName || nextSlug.length < 2) {
        setError('Completá un nombre válido para generar el producto.');
        return;
      }

      const nextCost = Number(costPrice || 0);
      const nextPrice = Number(price || 0);
      if (preventNegativeMargin && Number.isFinite(nextCost) && Number.isFinite(nextPrice) && nextPrice < nextCost) {
        setError('El precio de venta no puede quedar por debajo del costo mientras el guard de margen esté activo.');
        return;
      }

      const response = await catalogAdminApi.createProduct({
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
        await catalogAdminApi.uploadProductImage(response.item.id, imageFile);
      }

      navigate('/admin/productos', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el producto.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageShell context="admin" className="space-y-6">
        <PageHeader
          context="admin"
          eyebrow="Catálogo"
          title="Nuevo producto"
          subtitle="Cargando categorías, proveedores y reglas de precio para preparar el alta."
          actions={<StatusBadge tone="info" label="Preparando" />}
        />
        <SectionCard>
          <LoadingBlock label="Cargando formulario de producto" lines={4} />
        </SectionCard>
      </PageShell>
    );
  }

  return (
    <PageShell context="admin" className="space-y-6">
      <PageHeader
        context="admin"
        eyebrow="Catálogo"
        title="Nuevo producto"
        subtitle="Alta completa con precio, stock, publicación e imagen desde una vista administrativa más clara y ordenada."
        actions={(
          <>
            <StatusBadge tone="accent" label="Alta" />
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/productos">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
          </>
        )}
      />

      {error ? (
        <div className="ui-alert ui-alert--danger">
          <Tag className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No se pudo preparar el alta del producto.</span>
            <div className="ui-alert__text">{error}</div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.28fr)_minmax(22rem,0.92fr)]">
        <div className="space-y-6">
          <SectionCard
            title="Identificación y clasificación"
            description="Datos base para que el producto quede correctamente indexado y fácil de encontrar en catálogo."
            actions={<StatusBadge tone="neutral" size="sm" label={finalSlug ? `Slug: ${finalSlug}` : 'Sin slug'} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Nombre" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej: Módulo de carga iPhone 12" />
              <TextField label="Slug" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="Se genera automáticamente si queda vacío" hint="Si lo dejás vacío, se construye a partir del nombre." />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextField label="SKU interno" value={sku} onChange={(event) => setSku(event.target.value)} placeholder="Ej: IP12-MOD-CARGA" />
              <TextField label="Código de barras" value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="Ej: 7791234567890" />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <SelectField label="Categoría" value={categoryId} onChange={setCategoryId} options={categoryOptions} ariaLabel="Seleccionar categoría" />
              <SelectField label="Proveedor" value={supplierId} onChange={setSupplierId} options={supplierOptions} ariaLabel="Seleccionar proveedor" />
            </div>

            <div className="mt-4">
              <TextAreaField
                label="Descripción comercial"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Detalle, compatibilidad, color, observaciones y argumentos de venta."
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Precio, stock y publicación"
            description="Definí el costo, el precio sugerido y cómo querés mostrar el producto dentro del sistema."
            actions={<StatusBadge tone={marginStats.tone} size="sm" label={marginStats.tone === 'danger' ? 'Margen negativo' : marginStats.tone === 'warning' ? 'Sin margen' : 'Margen saludable'} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Referencia de compra"
                value={purchaseRef}
                onChange={(event) => setPurchaseRef(event.target.value)}
                placeholder="Ej: Factura 0081-000123"
              />
              <TextField type="number" min={0} label="Stock inicial" value={stock} onChange={(event) => setStock(event.target.value)} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextField type="number" min={0} label="Precio de costo" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} />
              <TextField type="number" min={0} label="Precio de venta" value={price} onChange={(event) => setPrice(event.target.value)} />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.88fr)]">
              <div className="summary-box">
                <div className="summary-box__label">Precio recomendado</div>
                <div className="summary-box__value">{loadingRecommendation ? 'Calculando…' : money(recommendedPrice ?? 0)}</div>
                <div className="summary-box__hint">{pricingHint}</div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setPrice(String(recommendedPrice ?? 0))} disabled={recommendedPrice == null || loadingRecommendation}>
                    <Sparkles className="h-4 w-4" />
                    Usar recomendado
                  </Button>
                  {recommendedRuleName ? <StatusBadge tone="info" size="sm" label={recommendedRuleName} /> : null}
                </div>
              </div>
              <div className="summary-box">
                <div className="summary-box__label">Margen estimado</div>
                <div className="summary-box__value">
                  {marginStats.margin >= 0 ? '+' : ''}
                  {marginStats.margin.toFixed(1)}%
                </div>
                <div className="summary-box__hint">Utilidad estimada: {money(marginStats.utility)}.</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge tone={preventNegativeMargin ? 'warning' : 'neutral'} size="sm" label={preventNegativeMargin ? 'Guard de margen activo' : 'Margen libre'} />
                  {recommendedMarginPercent != null ? <StatusBadge tone="accent" size="sm" label={`${recommendedMarginPercent}% sugerido`} /> : null}
                </div>
              </div>
            </div>

            <div className="choice-grid mt-4">
              <BooleanChoice
                checked={active}
                onChange={setActive}
                title="Producto activo"
                hint="Disponible para publicar y vender dentro del sistema."
              />
              <BooleanChoice
                checked={featured}
                onChange={setFeatured}
                title="Producto destacado"
                hint="Se usa para reforzar visibilidad en módulos comerciales."
              />
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            tone="info"
            title="Imagen del producto"
            description="Adjuntá la imagen comercial desde esta misma vista y revisá la previsualización antes de guardar."
            actions={<ImagePlus className="h-4 w-4 text-sky-600" />}
          >
            <div className="media-surface">
              <div className="media-surface__frame flex items-center justify-center overflow-hidden">
                {imagePreview ? <img src={imagePreview} alt="Vista previa del producto" className="h-full w-full object-cover" /> : <div className="media-surface__placeholder">Sin imagen cargada</div>}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="ui-field">
                <span className="ui-field__label">Archivo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    clearPreviewObjectUrl();
                    const url = URL.createObjectURL(file);
                    setImageFile(file);
                    setPreviewObjectUrl(url);
                    setImagePreview(url);
                  }}
                  className="block min-h-[2.85rem] w-full rounded-[0.95rem] border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-[0_1px_2px_rgba(15,23,42,0.06)] file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-bold"
                />
                <span className="ui-field__hint">Formatos permitidos: JPG, PNG o WEBP. Maximo 4 MB.</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearPreviewObjectUrl();
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  disabled={!imagePreview}
                >
                  Quitar imagen
                </Button>
                {imageFile ? <StatusBadge tone="neutral" size="sm" label={imageFile.name} /> : null}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Resumen previo"
            description="Último control antes de crear el producto en el catálogo."
            actions={<Percent className="h-4 w-4 text-zinc-500" />}
          >
            <div className="fact-list">
              <div className="fact-row">
                <span className="fact-label">Nombre</span>
                <span className="fact-value fact-value--text">{name.trim() || 'Sin completar'}</span>
              </div>
              <div className="fact-row">
                <span className="fact-label">Slug final</span>
                <span className="fact-value fact-value--text">{finalSlug || 'Sin generar'}</span>
              </div>
              <div className="fact-row">
                <span className="fact-label">Categoría</span>
                <span className="fact-value fact-value--text">{categories.find((category) => category.id === categoryId)?.name || 'Sin categoría'}</span>
              </div>
              <div className="fact-row">
                <span className="fact-label">Proveedor</span>
                <span className="fact-value fact-value--text">{suppliers.find((supplier) => supplier.id === supplierId)?.name || 'Sin proveedor'}</span>
              </div>
              <div className="fact-row">
                <span className="fact-label">Venta</span>
                <span className="fact-value">{money(Number(price || 0))}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/productos')}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void save()} disabled={saving}>
                <PackagePlus className="h-4 w-4" />
                {saving ? 'Guardando…' : 'Crear producto'}
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
