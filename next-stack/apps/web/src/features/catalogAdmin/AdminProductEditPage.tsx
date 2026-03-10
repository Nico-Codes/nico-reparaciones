import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ImagePlus, Percent, Sparkles, Tag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import { CustomSelect } from '@/components/ui/custom-select';
import { adminApi } from '@/features/admin/api';
import { catalogAdminApi, type AdminCategory, type AdminProduct } from './api';
import { productPricingApi } from './productPricingApi';

function money(value: number) {
  return `$ ${Math.round(value || 0).toLocaleString('es-AR')}`;
}

function slugify(raw: string) {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function formatDateTime(value: string | null) {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  return `${date.toLocaleDateString('es-AR')} ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
}

export function AdminProductEditPage() {
  const { id = '' } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [product, setProduct] = useState<AdminProduct | null>(null);
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
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
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
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const [categoriesResponse, productResponse, settings, providersResponse] = await Promise.all([
          catalogAdminApi.categories(),
          catalogAdminApi.product(id),
          productPricingApi.settings().catch(() => null),
          adminApi.providers({ active: '1' }).catch(() => ({ items: [] })),
        ]);
        if (!mounted) return;

        const nextProduct = productResponse.item;
        setCategories(categoriesResponse.items);
        setSuppliers(providersResponse.items.map((provider) => ({ id: provider.id, name: provider.name })));
        setProduct(nextProduct);
        setName(nextProduct.name ?? '');
        setSlug(nextProduct.slug ?? '');
        setSku(nextProduct.sku ?? '');
        setBarcode(nextProduct.barcode ?? '');
        setCategoryId(nextProduct.categoryId ?? '');
        setSupplierId(nextProduct.supplierId ?? '');
        setPurchaseRef(nextProduct.purchaseReference ?? '');
        setCostPrice(String(nextProduct.costPrice ?? 0));
        setPrice(String(nextProduct.price ?? 0));
        setStock(String(nextProduct.stock ?? 0));
        setDescription(nextProduct.description ?? '');
        setActive(nextProduct.active);
        setFeatured(nextProduct.featured);
        clearPreviewObjectUrl();
        setImageFile(null);
        setImagePreview(nextProduct.imageUrl ?? null);
        setPreventNegativeMargin(settings?.preventNegativeMargin ?? true);
      } catch (cause) {
        if (!mounted) return;
        setError(cause instanceof Error ? cause.message : 'No se pudo cargar el producto.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [id]);

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
            productId: id || null,
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
  }, [id, categoryId, costPrice]);

  const finalSlug = useMemo(() => slugify(slug.trim() || name.trim()), [name, slug]);

  const categoryOptions = useMemo(
    () => [{ value: '', label: 'Sin categoría' }, ...categories.map((category) => ({ value: category.id, label: category.name }))],
    [categories],
  );

  const supplierOptions = useMemo(
    () => [{ value: '', label: 'Sin proveedor' }, ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))],
    [suppliers],
  );

  const marginStats = useMemo(() => {
    const cost = Number(costPrice || 0);
    const sale = Number(price || 0);
    const utility = sale - cost;
    const margin = cost > 0 ? (utility / cost) * 100 : 0;
    const tone: 'success' | 'warning' | 'danger' = utility > 0 ? 'success' : utility === 0 ? 'warning' : 'danger';
    return { utility, margin, tone };
  }, [costPrice, price]);

  async function save() {
    if (!id) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const nextCost = Number(costPrice || 0);
      const nextPrice = Number(price || 0);
      if (preventNegativeMargin && Number.isFinite(nextCost) && Number.isFinite(nextPrice) && nextPrice < nextCost) {
        setError('El precio de venta no puede quedar por debajo del costo mientras el guard de margen esté activo.');
        return;
      }

      const response = await catalogAdminApi.updateProduct(id, {
        name: name.trim(),
        slug: slugify(slug.trim() || name.trim()),
        sku: sku.trim() || null,
        barcode: barcode.trim() || null,
        categoryId: categoryId || null,
        supplierId: supplierId || null,
        purchaseReference: purchaseRef.trim() || null,
        costPrice: Number(costPrice || 0),
        price: Number(price || 0),
        stock: Math.max(0, Math.trunc(Number(stock || 0))),
        description: description.trim() || null,
        active,
        featured,
      });

      let nextItem = response.item;
      if (imageFile) {
        const imageResponse = await catalogAdminApi.uploadProductImage(id, imageFile);
        nextItem = imageResponse.item;
        clearPreviewObjectUrl();
        setImageFile(null);
      }

      setProduct(nextItem);
      setName(nextItem.name ?? '');
      setSlug(nextItem.slug ?? '');
      setSku(nextItem.sku ?? '');
      setBarcode(nextItem.barcode ?? '');
      setCategoryId(nextItem.categoryId ?? '');
      setSupplierId(nextItem.supplierId ?? '');
      setPurchaseRef(nextItem.purchaseReference ?? '');
      setCostPrice(String(nextItem.costPrice ?? 0));
      setPrice(String(nextItem.price ?? 0));
      setStock(String(nextItem.stock ?? 0));
      setDescription(nextItem.description ?? '');
      setActive(nextItem.active);
      setFeatured(nextItem.featured);
      setImagePreview(nextItem.imageUrl ?? null);
      setSuccess('Los cambios del producto se guardaron correctamente.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  async function removeImage() {
    if (!id) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await catalogAdminApi.removeProductImage(id);
      clearPreviewObjectUrl();
      setImageFile(null);
      setProduct(response.item);
      setImagePreview(response.item.imageUrl ?? null);
      setSuccess('La imagen se quitó del producto.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo quitar la imagen.');
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
          title="Editar producto"
          subtitle="Cargando datos, precios y referencias para preparar la edición."
          actions={<StatusBadge tone="info" label="Cargando" />}
        />
        <SectionCard>
          <LoadingBlock label="Cargando producto" lines={4} />
        </SectionCard>
      </PageShell>
    );
  }

  if (!product) {
    return (
      <PageShell context="admin" className="space-y-6">
        <PageHeader context="admin" eyebrow="Catálogo" title="Producto no encontrado" subtitle="El registro solicitado no está disponible o ya no existe en el panel." />
        <SectionCard>
          <EmptyState title="No encontramos el producto" description={error || 'Volvé al listado para continuar con otra edición.'} actions={<Button asChild><Link to="/admin/productos">Volver al catálogo</Link></Button>} />
        </SectionCard>
      </PageShell>
    );
  }

  return (
    <PageShell context="admin" className="space-y-6">
      <PageHeader
        context="admin"
        eyebrow="Catálogo"
        title="Editar producto"
        subtitle="Actualizá identificación, precio, stock, publicación e imagen desde una vista operativa consistente."
        actions={(
          <>
            <StatusBadge tone={active ? 'success' : 'neutral'} label={active ? 'Activo' : 'Inactivo'} />
            <Button asChild variant="outline" size="sm">
              <Link to={`/admin/productos/${encodeURIComponent(product.id)}/etiqueta`}>Etiqueta</Link>
            </Button>
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
            <span className="ui-alert__title">No se pudo actualizar el producto.</span>
            <div className="ui-alert__text">{error}</div>
          </div>
        </div>
      ) : null}

      {success ? (
        <div className="ui-alert ui-alert--success">
          <Tag className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Producto actualizado.</span>
            <div className="ui-alert__text">{success}</div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.28fr)_minmax(22rem,0.92fr)]">
        <div className="space-y-6">
          <SectionCard
            title="Identificación y clasificación"
            description="Mantené consistentes el nombre, la referencia comercial y la ubicación del producto dentro del catálogo."
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
            description="Controlá el margen, la disponibilidad y el modo en que este producto se expone dentro del sistema."
            actions={<StatusBadge tone={marginStats.tone} size="sm" label={marginStats.tone === 'danger' ? 'Margen negativo' : marginStats.tone === 'warning' ? 'Sin margen' : 'Margen saludable'} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Referencia de compra"
                value={purchaseRef}
                onChange={(event) => setPurchaseRef(event.target.value)}
                placeholder="Ej: Factura 0081-000123"
              />
              <TextField type="number" min={0} label="Stock" value={stock} onChange={(event) => setStock(event.target.value)} />
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
                hint="Disponible para vender y mostrar en el flujo comercial."
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
            description="Actualizá la imagen comercial y revisá la vista previa antes de guardar los cambios."
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
                <span className="ui-field__hint">Formatos permitidos: JPG, PNG o WEBP. Máximo 4 MB.</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => void removeImage()} disabled={saving || (!imagePreview && !product.imagePath)}>
                  Quitar imagen
                </Button>
                {imageFile ? <StatusBadge tone="neutral" size="sm" label={imageFile.name} /> : null}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Resumen y control"
            description="Información útil antes de guardar y referencias del registro actual."
            actions={<Percent className="h-4 w-4 text-zinc-500" />}
          >
            <div className="fact-list">
              <div className="fact-row">
                <span className="fact-label">ID</span>
                <span className="fact-value">#{product.id.slice(0, 8)}</span>
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
                <span className="fact-label">Última actualización</span>
                <span className="fact-value fact-value--text">{formatDateTime(product.updatedAt)}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void save()} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
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
    <div className="ui-field min-w-0">
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

function BooleanChoice({
  checked,
  onChange,
  title,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  hint: string;
}) {
  return (
    <label className={`choice-card ${checked ? 'is-active' : ''}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <div>
        <div className="choice-card__title">{title}</div>
        <div className="choice-card__hint">{hint}</div>
      </div>
    </label>
  );
}
