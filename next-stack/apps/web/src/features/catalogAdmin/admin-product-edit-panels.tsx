import { ImagePlus, Percent, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import type { AdminCategory, AdminProduct } from './api';
import { BooleanChoice, SelectField } from './admin-product-form.controls';
import { formatDateTime, money, type ProductMarginStats, type ProductSelectOption } from './admin-product-form.helpers';

export type AdminProductEditFormLayoutProps = {
  product: AdminProduct;
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

function AdminProductEditMainPanels({
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
  recommendedPrice,
  recommendedMarginPercent,
  recommendedRuleName,
  pricingHint,
  loadingRecommendation,
  preventNegativeMargin,
  marginStats,
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
}: Pick<
  AdminProductEditFormLayoutProps,
  | 'categoryOptions'
  | 'supplierOptions'
  | 'finalSlug'
  | 'name'
  | 'slug'
  | 'sku'
  | 'barcode'
  | 'categoryId'
  | 'supplierId'
  | 'purchaseRef'
  | 'costPrice'
  | 'price'
  | 'stock'
  | 'description'
  | 'active'
  | 'featured'
  | 'recommendedPrice'
  | 'recommendedMarginPercent'
  | 'recommendedRuleName'
  | 'pricingHint'
  | 'loadingRecommendation'
  | 'preventNegativeMargin'
  | 'marginStats'
  | 'onNameChange'
  | 'onSlugChange'
  | 'onSkuChange'
  | 'onBarcodeChange'
  | 'onCategoryChange'
  | 'onSupplierChange'
  | 'onPurchaseRefChange'
  | 'onCostPriceChange'
  | 'onPriceChange'
  | 'onStockChange'
  | 'onDescriptionChange'
  | 'onActiveChange'
  | 'onFeaturedChange'
  | 'onApplyRecommendedPrice'
>) {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Identificacion y clasificacion"
        description="Mantene consistentes el nombre, la referencia comercial y la ubicacion del producto dentro del catalogo."
        actions={<StatusBadge tone="neutral" size="sm" label={finalSlug ? `Slug: ${finalSlug}` : 'Sin slug'} />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Nombre" value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Ej: Modulo de carga iPhone 12" />
          <TextField
            label="Slug"
            value={slug}
            onChange={(event) => onSlugChange(event.target.value)}
            placeholder="Se genera automaticamente si queda vacio"
            hint="Si lo dejas vacio, se construye a partir del nombre."
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField label="SKU interno" value={sku} onChange={(event) => onSkuChange(event.target.value)} placeholder="Ej: IP12-MOD-CARGA" />
          <TextField label="Codigo de barras" value={barcode} onChange={(event) => onBarcodeChange(event.target.value)} placeholder="Ej: 7791234567890" />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectField label="Categoria" value={categoryId} onChange={onCategoryChange} options={categoryOptions} ariaLabel="Seleccionar categoria" />
          <SelectField label="Proveedor" value={supplierId} onChange={onSupplierChange} options={supplierOptions} ariaLabel="Seleccionar proveedor" />
        </div>

        <div className="mt-4">
          <TextAreaField
            label="Descripcion comercial"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={4}
            placeholder="Detalle, compatibilidad, color, observaciones y argumentos de venta."
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Precio, stock y publicacion"
        description="Controla el margen, la disponibilidad y el modo en que este producto se expone dentro del sistema."
        actions={<StatusBadge tone={marginStats.tone} size="sm" label={marginStats.tone === 'danger' ? 'Margen negativo' : marginStats.tone === 'warning' ? 'Sin margen' : 'Margen saludable'} />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Referencia de compra" value={purchaseRef} onChange={(event) => onPurchaseRefChange(event.target.value)} placeholder="Ej: Factura 0081-000123" />
          <TextField type="number" min={0} label="Stock" value={stock} onChange={(event) => onStockChange(event.target.value)} />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField type="number" min={0} label="Precio de costo" value={costPrice} onChange={(event) => onCostPriceChange(event.target.value)} />
          <TextField type="number" min={0} label="Precio de venta" value={price} onChange={(event) => onPriceChange(event.target.value)} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.88fr)]">
          <div className="summary-box">
            <div className="summary-box__label">Precio recomendado</div>
            <div className="summary-box__value">{loadingRecommendation ? 'Calculando...' : money(recommendedPrice ?? 0)}</div>
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
          <BooleanChoice
            checked={active}
            onChange={onActiveChange}
            title="Producto activo"
            hint="Disponible para vender y mostrar en el flujo comercial."
          />
          <BooleanChoice
            checked={featured}
            onChange={onFeaturedChange}
            title="Producto destacado"
            hint="Se usa para reforzar visibilidad en modulos comerciales."
          />
        </div>
      </SectionCard>
    </div>
  );
}

function AdminProductEditAsidePanels({
  product,
  categories,
  suppliers,
  categoryId,
  supplierId,
  finalSlug,
  imagePreview,
  imageFileName,
  saving,
  onFileChange,
  onRemoveImage,
  onCancel,
  onSave,
}: Pick<
  AdminProductEditFormLayoutProps,
  | 'product'
  | 'categories'
  | 'suppliers'
  | 'categoryId'
  | 'supplierId'
  | 'finalSlug'
  | 'imagePreview'
  | 'imageFileName'
  | 'saving'
  | 'onFileChange'
  | 'onRemoveImage'
  | 'onCancel'
  | 'onSave'
>) {
  return (
    <div className="space-y-6">
      <SectionCard
        tone="info"
        title="Imagen del producto"
        description="Actualiza la imagen comercial y revisa la vista previa antes de guardar los cambios."
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
            <Button type="button" variant="outline" size="sm" onClick={onRemoveImage} disabled={saving || (!imagePreview && !product.imagePath)}>
              Quitar imagen
            </Button>
            {imageFileName ? <StatusBadge tone="neutral" size="sm" label={imageFileName} /> : null}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Resumen y control"
        description="Informacion util antes de guardar y referencias del registro actual."
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
            <span className="fact-label">Categoria</span>
            <span className="fact-value fact-value--text">{categories.find((category) => category.id === categoryId)?.name || 'Sin categoria'}</span>
          </div>
          <div className="fact-row">
            <span className="fact-label">Proveedor</span>
            <span className="fact-value fact-value--text">{suppliers.find((supplier) => supplier.id === supplierId)?.name || 'Sin proveedor'}</span>
          </div>
          <div className="fact-row">
            <span className="fact-label">Ultima actualizacion</span>
            <span className="fact-value fact-value--text">{formatDateTime(product.updatedAt)}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

export function AdminProductEditFormLayout(props: AdminProductEditFormLayoutProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.28fr)_minmax(22rem,0.92fr)]">
      <AdminProductEditMainPanels {...props} />
      <AdminProductEditAsidePanels {...props} />
    </div>
  );
}
