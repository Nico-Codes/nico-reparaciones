import { ArrowLeft, ImagePlus, PackagePlus, Percent, Sparkles, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import type { AdminCategory } from './api';
import { BooleanChoice, SelectField } from './admin-product-form.controls';
import { money, type ProductMarginStats, type ProductSelectOption } from './admin-product-form.helpers';
import type { AdminProductCreateSummaryItem } from './admin-product-create.helpers';

export function AdminProductCreateLoadingState() {
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

export function AdminProductCreateHeaderActions() {
  return (
    <>
      <StatusBadge tone="accent" label="Alta" />
      <Button asChild variant="outline" size="sm">
        <Link to="/admin/productos">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </Button>
    </>
  );
}

export function AdminProductCreateFeedback({ error }: { error: string }) {
  if (!error) return null;
  return (
    <div className="ui-alert ui-alert--danger">
      <Tag className="mt-0.5 h-4 w-4 flex-none" />
      <div>
        <span className="ui-alert__title">No se pudo preparar el alta del producto.</span>
        <div className="ui-alert__text">{error}</div>
      </div>
    </div>
  );
}

type AdminProductCreateFormLayoutProps = {
  categories: AdminCategory[];
  suppliers: Array<{ id: string; name: string }>;
  categoryOptions: ProductSelectOption[];
  supplierOptions: ProductSelectOption[];
  finalSlug: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string;
  categoryId: string;
  supplierId: string;
  purchaseRef: string;
  costPrice: string;
  price: string;
  stock: string;
  description: string;
  active: boolean;
  featured: boolean;
  imagePreview: string | null;
  imageFileName: string | null;
  saving: boolean;
  recommendedPrice: number | null;
  recommendedMarginPercent: number | null;
  recommendedRuleName: string | null;
  pricingHint: string;
  loadingRecommendation: boolean;
  preventNegativeMargin: boolean;
  marginStats: ProductMarginStats;
  summary: AdminProductCreateSummaryItem[];
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onSkuChange: (value: string) => void;
  onBarcodeChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSupplierChange: (value: string) => void;
  onPurchaseRefChange: (value: string) => void;
  onCostPriceChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onStockChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onActiveChange: (value: boolean) => void;
  onFeaturedChange: (value: boolean) => void;
  onApplyRecommendedPrice: () => void;
  onFileChange: (file: File | null) => void;
  onRemoveImage: () => void;
  onCancel: () => void;
  onSave: () => void;
};

export function AdminProductCreateFormLayout({
  categories,
  suppliers,
  categoryOptions,
  supplierOptions,
  finalSlug,
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
  active,
  featured,
  imagePreview,
  imageFileName,
  saving,
  recommendedPrice,
  recommendedMarginPercent,
  recommendedRuleName,
  pricingHint,
  loadingRecommendation,
  preventNegativeMargin,
  marginStats,
  summary,
  onNameChange,
  onSlugChange,
  onSkuChange,
  onBarcodeChange,
  onCategoryChange,
  onSupplierChange,
  onPurchaseRefChange,
  onCostPriceChange,
  onPriceChange,
  onStockChange,
  onDescriptionChange,
  onActiveChange,
  onFeaturedChange,
  onApplyRecommendedPrice,
  onFileChange,
  onRemoveImage,
  onCancel,
  onSave,
}: AdminProductCreateFormLayoutProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.28fr)_minmax(22rem,0.92fr)]">
      <div className="space-y-6">
        <SectionCard
          title="Identificación y clasificación"
          description="Datos base para que el producto quede correctamente indexado y fácil de encontrar en catálogo."
          actions={<StatusBadge tone="neutral" size="sm" label={finalSlug ? `Slug: ${finalSlug}` : 'Sin slug'} />}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Nombre" value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Ej: Módulo de carga iPhone 12" />
            <TextField label="Slug" value={slug} onChange={(event) => onSlugChange(event.target.value)} placeholder="Se genera automáticamente si queda vacío" hint="Si lo dejás vacío, se construye a partir del nombre." />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextField label="SKU interno" value={sku} onChange={(event) => onSkuChange(event.target.value)} placeholder="Ej: IP12-MOD-CARGA" />
            <TextField label="Código de barras" value={barcode} onChange={(event) => onBarcodeChange(event.target.value)} placeholder="Ej: 7791234567890" />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SelectField label="Categoría" value={categoryId} onChange={onCategoryChange} options={categoryOptions} ariaLabel="Seleccionar categoría" />
            <SelectField label="Proveedor" value={supplierId} onChange={onSupplierChange} options={supplierOptions} ariaLabel="Seleccionar proveedor" />
          </div>

          <div className="mt-4">
            <TextAreaField
              label="Descripción comercial"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
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
            <TextField label="Referencia de compra" value={purchaseRef} onChange={(event) => onPurchaseRefChange(event.target.value)} placeholder="Ej: Factura 0081-000123" />
            <TextField type="number" min={0} label="Stock inicial" value={stock} onChange={(event) => onStockChange(event.target.value)} />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextField type="number" min={0} label="Precio de costo" value={costPrice} onChange={(event) => onCostPriceChange(event.target.value)} />
            <TextField type="number" min={0} label="Precio de venta" value={price} onChange={(event) => onPriceChange(event.target.value)} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.88fr)]">
            <div className="summary-box">
              <div className="summary-box__label">Precio recomendado</div>
              <div className="summary-box__value">{loadingRecommendation ? 'Calculando…' : money(recommendedPrice ?? 0)}</div>
              <div className="summary-box__hint">{pricingHint}</div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onApplyRecommendedPrice} disabled={recommendedPrice == null || loadingRecommendation}>
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
            <BooleanChoice checked={active} onChange={onActiveChange} title="Producto activo" hint="Disponible para publicar y vender dentro del sistema." />
            <BooleanChoice checked={featured} onChange={onFeaturedChange} title="Producto destacado" hint="Se usa para reforzar visibilidad en módulos comerciales." />
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
                onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
                className="block min-h-[2.85rem] w-full rounded-[0.95rem] border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-[0_1px_2px_rgba(15,23,42,0.06)] file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-bold"
              />
              <span className="ui-field__hint">Formatos permitidos: JPG, PNG o WEBP. Maximo 4 MB.</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onRemoveImage} disabled={!imagePreview}>
                Quitar imagen
              </Button>
              {imageFileName ? <StatusBadge tone="neutral" size="sm" label={imageFileName} /> : null}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Resumen previo"
          description="Último control antes de crear el producto en el catálogo."
          actions={<Percent className="h-4 w-4 text-zinc-500" />}
        >
          <div className="fact-list">
            {summary.map((item) => (
              <div key={item.label} className="fact-row">
                <span className="fact-label">{item.label}</span>
                <span className={item.tone === 'money' ? 'fact-value' : 'fact-value fact-value--text'}>{item.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="button" onClick={onSave} disabled={saving}>
              <PackagePlus className="h-4 w-4" />
              {saving ? 'Guardando…' : 'Crear producto'}
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
