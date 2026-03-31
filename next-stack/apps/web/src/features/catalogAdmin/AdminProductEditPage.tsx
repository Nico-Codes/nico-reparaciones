import { useEffect, useMemo, useState } from 'react';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { adminApi } from '@/features/admin/api';
import { Link, useParams } from 'react-router-dom';
import { catalogAdminApi, type AdminCategory, type AdminProduct } from './api';
import { productPricingApi } from './productPricingApi';
import { AdminProductEditFeedback, AdminProductEditFormLayout, AdminProductEditHeaderActions, AdminProductEditMissingState } from './admin-product-edit.sections';
import { buildNamedOptions, buildProductMarginStats, slugify } from './admin-product-form.helpers';

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
  const [pricingHint, setPricingHint] = useState('Defini categoria y costo para calcular automaticamente.');
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [preventNegativeMargin, setPreventNegativeMargin] = useState(true);

  function clearPreviewObjectUrl() {
    setPreviewObjectUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }

  function syncProductForm(nextProduct: AdminProduct) {
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
    setImagePreview(nextProduct.imageUrl ?? null);
  }

  function handleImageSelection(file: File | null) {
    if (!file) return;
    clearPreviewObjectUrl();
    const url = URL.createObjectURL(file);
    setImageFile(file);
    setPreviewObjectUrl(url);
    setImagePreview(url);
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

        setCategories(categoriesResponse.items);
        setSuppliers(providersResponse.items.map((provider) => ({ id: provider.id, name: provider.name })));
        syncProductForm(productResponse.item);
        clearPreviewObjectUrl();
        setImageFile(null);
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
      setPricingHint('Defini categoria y costo para calcular automaticamente.');
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
              : `Sin regla especifica. Margen base sugerido: ${response.marginPercent}%.`,
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
  const categoryOptions = useMemo(() => buildNamedOptions(categories, 'Sin categoria'), [categories]);
  const supplierOptions = useMemo(() => buildNamedOptions(suppliers, 'Sin proveedor'), [suppliers]);
  const marginStats = useMemo(() => buildProductMarginStats(costPrice, price), [costPrice, price]);

  async function save() {
    if (!id) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const nextCost = Number(costPrice || 0);
      const nextPrice = Number(price || 0);
      if (preventNegativeMargin && Number.isFinite(nextCost) && Number.isFinite(nextPrice) && nextPrice < nextCost) {
        setError('El precio de venta no puede quedar por debajo del costo mientras el guard de margen este activo.');
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

      syncProductForm(nextItem);
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
      setSuccess('La imagen se quito del producto.');
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
          eyebrow="Catalogo"
          title="Editar producto"
          subtitle="Cargando datos, precios y referencias para preparar la edicion."
          actions={<StatusBadge tone="info" label="Cargando" />}
        />
        <SectionCard>
          <LoadingBlock label="Cargando producto" lines={4} />
        </SectionCard>
      </PageShell>
    );
  }

  if (!product) {
    return <AdminProductEditMissingState error={error} />;
  }

  return (
    <PageShell context="admin" className="space-y-6">
      <PageHeader
        context="admin"
        eyebrow="Catalogo"
        title="Editar producto"
        subtitle="Actualiza identificacion, precio, stock, publicacion e imagen desde una vista operativa consistente."
        actions={<AdminProductEditHeaderActions active={active} productId={product.id} />}
      />

      <AdminProductEditFeedback error={error} success={success} />

      <AdminProductEditFormLayout
        product={product}
        categories={categories}
        suppliers={suppliers}
        categoryOptions={categoryOptions}
        supplierOptions={supplierOptions}
        finalSlug={finalSlug}
        name={name}
        slug={slug}
        sku={sku}
        barcode={barcode}
        categoryId={categoryId}
        supplierId={supplierId}
        purchaseRef={purchaseRef}
        costPrice={costPrice}
        price={price}
        stock={stock}
        description={description}
        active={active}
        featured={featured}
        imagePreview={imagePreview}
        imageFileName={imageFile?.name ?? null}
        saving={saving}
        recommendedPrice={recommendedPrice}
        recommendedMarginPercent={recommendedMarginPercent}
        recommendedRuleName={recommendedRuleName}
        pricingHint={pricingHint}
        loadingRecommendation={loadingRecommendation}
        preventNegativeMargin={preventNegativeMargin}
        marginStats={marginStats}
        onNameChange={setName}
        onSlugChange={setSlug}
        onSkuChange={setSku}
        onBarcodeChange={setBarcode}
        onCategoryChange={setCategoryId}
        onSupplierChange={setSupplierId}
        onPurchaseRefChange={setPurchaseRef}
        onCostPriceChange={setCostPrice}
        onPriceChange={setPrice}
        onStockChange={setStock}
        onDescriptionChange={setDescription}
        onActiveChange={setActive}
        onFeaturedChange={setFeatured}
        onApplyRecommendedPrice={() => setPrice(String(recommendedPrice ?? 0))}
        onFileChange={handleImageSelection}
        onRemoveImage={() => void removeImage()}
        onCancel={() => window.history.back()}
        onSave={() => void save()}
      />
    </PageShell>
  );
}
