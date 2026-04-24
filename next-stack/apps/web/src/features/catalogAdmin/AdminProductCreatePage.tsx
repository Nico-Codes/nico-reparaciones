import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { adminApi } from '@/features/admin/api';
import { useNavigate } from 'react-router-dom';
import { catalogAdminApi, type AdminCategory } from './api';
import {
  AdminProductCreateFeedback,
  AdminProductCreateFormLayout,
  AdminProductCreateHeaderActions,
  AdminProductCreateLoadingState,
} from './admin-product-create.sections';
import {
  buildAdminProductCreatePayload,
  buildAdminProductCreateSummary,
  validateAdminProductCreateDraft,
} from './admin-product-create.helpers';
import { buildHierarchicalCategoryOptions, buildNamedOptions, buildProductMarginStats, slugify } from './admin-product-form.helpers';
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
  const categoryOptions = useMemo(() => buildHierarchicalCategoryOptions(categories, 'Sin categoria'), [categories]);
  const supplierOptions = useMemo(() => buildNamedOptions(suppliers, 'Sin proveedor'), [suppliers]);
  const marginStats = useMemo(() => buildProductMarginStats(costPrice, price), [costPrice, price]);
  const summary = useMemo(
    () =>
      buildAdminProductCreateSummary(
        {
          name,
          categoryId,
          supplierId,
          price,
        },
        finalSlug,
        categories,
        suppliers,
      ),
    [categories, categoryId, finalSlug, name, price, supplierId, suppliers],
  );

  async function save() {
    setSaving(true);
    setError('');
    try {
      const validationError = validateAdminProductCreateDraft(
        {
          name,
          slug,
          costPrice,
          price,
        },
        preventNegativeMargin,
      );
      if (validationError) {
        setError(validationError);
        return;
      }

      const response = await catalogAdminApi.createProduct(
        buildAdminProductCreatePayload({
          name,
          slug,
          sku,
          barcode,
          categoryId,
          supplierId,
          purchaseRef,
          costPrice,
          price,
          stock,
          description,
          featured,
          active,
        }),
      );

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

  if (loading) return <AdminProductCreateLoadingState />;

  return (
    <PageShell context="admin" className="space-y-6">
      <PageHeader
        context="admin"
        eyebrow="Catálogo"
        title="Nuevo producto"
        subtitle="Alta completa con precio, stock, publicación e imagen desde una vista administrativa más clara y ordenada."
        actions={<AdminProductCreateHeaderActions />}
      />

      <AdminProductCreateFeedback error={error} />

      <AdminProductCreateFormLayout
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
        summary={summary}
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
        onFileChange={(file) => {
          if (!file) return;
          clearPreviewObjectUrl();
          const url = URL.createObjectURL(file);
          setImageFile(file);
          setPreviewObjectUrl(url);
          setImagePreview(url);
        }}
        onRemoveImage={() => {
          clearPreviewObjectUrl();
          setImageFile(null);
          setImagePreview(null);
        }}
        onCancel={() => navigate('/admin/productos')}
        onSave={() => void save()}
      />
    </PageShell>
  );
}
