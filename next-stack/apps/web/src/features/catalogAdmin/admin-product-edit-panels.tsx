import { useEffect, useState } from 'react';
import { ImagePlus, Percent, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import type { AdminCategory, AdminProduct } from './api';
import { BooleanChoice, SelectField } from './admin-product-form.controls';
import {
  findCategoryPathLabel,
  formatDateTime,
  money,
  PRODUCT_NAME_MAX_LENGTH,
  type ProductMarginStats,
  type ProductSelectOption,
} from './admin-product-form.helpers';

export type AdminProductEditFormLayoutProps = {
  product: AdminProduct;
  categories: AdminCategory[];
  suppliers: Array<{ id: string; name: string }>;
  deviceTypes: Array<{ id: string; name: string; active: boolean }>;
  deviceBrands: Array<{ id: string; deviceTypeId?: string | null; name: string; active: boolean }>;
  deviceModelGroups: Array<{ id: string; deviceBrandId: string; name: string; active: boolean }>;
  deviceModels: Array<{ id: string; brandId: string; deviceModelGroupId?: string | null; name: string; active: boolean }>;
  deviceIssues: Array<{ id: string; deviceTypeId?: string | null; name: string; active: boolean }>;
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
  publishedToStore: boolean;
  repairUsageEnabled: boolean;
  imagePreview: string | null;
  imageFileName: string | null;
  saving: boolean;
  colorSaving: boolean;
  newColorLabel: string;
  newColorAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
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
  onPublishedToStoreChange: (value: boolean) => void;
  onRepairUsageEnabledChange: (value: boolean) => void;
  onApplyRecommendedPrice: () => void;
  onFileChange: (file: File | null) => void;
  onRemoveImage: () => void;
  onNewColorLabelChange: (value: string) => void;
  onNewColorAvailabilityChange: (value: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN') => void;
  onCreateColorVariant: () => void;
  onUpdateColorVariant: (
    variantId: string,
    input: Partial<{ label: string; supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'; active: boolean }>,
  ) => void;
  onCreateRepairPartApplicability: (input: Partial<{
    deviceTypeId: string | null;
    deviceBrandId: string | null;
    deviceModelGroupId: string | null;
    deviceModelId: string | null;
    deviceIssueTypeId: string | null;
    notes: string | null;
    active: boolean;
  }>) => void;
  onUpdateRepairPartApplicability: (applicabilityId: string, input: Partial<{ active: boolean }>) => void;
  onDeleteRepairPartApplicability: (applicabilityId: string) => void;
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
  publishedToStore,
  repairUsageEnabled,
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
  onPublishedToStoreChange,
  onRepairUsageEnabledChange,
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
  | 'publishedToStore'
  | 'repairUsageEnabled'
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
  | 'onPublishedToStoreChange'
  | 'onRepairUsageEnabledChange'
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
          <TextField
            label="Nombre"
            value={name}
            maxLength={PRODUCT_NAME_MAX_LENGTH}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Ej: Modulo de carga iPhone 12"
            hint={`${name.trim().length}/${PRODUCT_NAME_MAX_LENGTH} caracteres. Usa detalles para informacion extra.`}
          />
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
            label="Detalles del producto"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={4}
            placeholder="Compatibilidad, color, observaciones y argumentos de venta. Esto se ve en la ficha del producto."
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
            checked={publishedToStore}
            onChange={onPublishedToStoreChange}
            title="Publicar en tienda"
            hint="Si esta apagado, el producto queda como stock interno."
          />
          <BooleanChoice
            checked={repairUsageEnabled}
            onChange={onRepairUsageEnabledChange}
            title="Usar en reparaciones"
            hint="Permite sugerir este producto como repuesto interno compatible."
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

function AdminProductEditColorPanel({
  product,
  colorSaving,
  newColorLabel,
  newColorAvailability,
  onNewColorLabelChange,
  onNewColorAvailabilityChange,
  onCreateColorVariant,
  onUpdateColorVariant,
}: Pick<
  AdminProductEditFormLayoutProps,
  | 'product'
  | 'colorSaving'
  | 'newColorLabel'
  | 'newColorAvailability'
  | 'onNewColorLabelChange'
  | 'onNewColorAvailabilityChange'
  | 'onCreateColorVariant'
  | 'onUpdateColorVariant'
>) {
  if (product.fulfillmentMode !== 'SPECIAL_ORDER') return null;

  const total = product.colorOptions.filter((option) => option.active).length;
  const available = product.colorOptions.filter((option) => option.active && option.supplierAvailability === 'IN_STOCK').length;
  const outOfStock = product.colorOptions.filter((option) => option.active && option.supplierAvailability === 'OUT_OF_STOCK').length;
  const hasPendingColorFallback = product.colorOptions.some(
    (option) => option.active && (option.label.trim().toLowerCase() === 'color a confirmar' || option.sourceSheetKey?.endsWith('::pending-color')),
  );
  const colorState = product.requiresColorSelection
    ? hasPendingColorFallback
      ? { tone: 'warning' as const, label: 'Color a confirmar' }
      : available > 0
        ? { tone: 'success' as const, label: 'Colores disponibles' }
        : { tone: 'danger' as const, label: 'Sin color real' }
    : { tone: 'neutral' as const, label: 'Color opcional' };

  return (
    <SectionCard
      tone="info"
      title="Colores por proveedor"
      description="Edita colores importados o agrega uno manual para que el cliente pueda elegirlo en tienda."
      actions={<StatusBadge tone={colorState.tone} size="sm" label={colorState.label} />}
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <ColorMetric label="Total" value={total} />
        <ColorMetric label="Disponibles" value={available} />
        <ColorMetric label="Sin stock" value={outOfStock} />
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <TextField
            label="Nuevo color"
            value={newColorLabel}
            onChange={(event) => onNewColorLabelChange(event.target.value)}
            placeholder="Ej: Negro"
          />
          <label className="ui-field">
            <span className="ui-field__label">Disponibilidad</span>
            <span className="ui-field__control">
              <select
                className="ui-input"
                value={newColorAvailability}
                onChange={(event) =>
                  onNewColorAvailabilityChange(event.target.value as 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN')
                }
              >
                <option value="IN_STOCK">Disponible</option>
                <option value="OUT_OF_STOCK">Sin stock</option>
                <option value="UNKNOWN">A confirmar</option>
              </select>
            </span>
          </label>
        </div>
        <div className="mt-3 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onCreateColorVariant} disabled={colorSaving || !newColorLabel.trim()}>
            Agregar color
          </Button>
        </div>
      </div>

      {product.colorOptions.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-zinc-300 px-4 py-5 text-sm font-semibold text-zinc-500">
          Este producto por encargue todavia no tiene colores cargados.
        </div>
      ) : (
        <div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
          {product.colorOptions.map((variant) => (
            <ColorVariantEditor
              key={variant.id}
              variant={variant}
              disabled={colorSaving}
              onSave={(input) => onUpdateColorVariant(variant.id, input)}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function AdminProductEditRepairApplicabilityPanel({
  product,
  disabled,
  deviceTypes,
  deviceBrands,
  deviceModelGroups,
  deviceModels,
  deviceIssues,
  onCreateRepairPartApplicability,
  onUpdateRepairPartApplicability,
  onDeleteRepairPartApplicability,
}: {
  product: AdminProduct;
  disabled: boolean;
  deviceTypes: AdminProductEditFormLayoutProps['deviceTypes'];
  deviceBrands: AdminProductEditFormLayoutProps['deviceBrands'];
  deviceModelGroups: AdminProductEditFormLayoutProps['deviceModelGroups'];
  deviceModels: AdminProductEditFormLayoutProps['deviceModels'];
  deviceIssues: AdminProductEditFormLayoutProps['deviceIssues'];
  onCreateRepairPartApplicability: AdminProductEditFormLayoutProps['onCreateRepairPartApplicability'];
  onUpdateRepairPartApplicability: AdminProductEditFormLayoutProps['onUpdateRepairPartApplicability'];
  onDeleteRepairPartApplicability: AdminProductEditFormLayoutProps['onDeleteRepairPartApplicability'];
}) {
  const [deviceTypeId, setDeviceTypeId] = useState('');
  const [deviceBrandId, setDeviceBrandId] = useState('');
  const [deviceModelGroupId, setDeviceModelGroupId] = useState('');
  const [deviceModelId, setDeviceModelId] = useState('');
  const [deviceIssueTypeId, setDeviceIssueTypeId] = useState('');
  const [notes, setNotes] = useState('');

  if (!product.repairUsageEnabled) return null;

  const typeOptions = buildSimpleOptions(deviceTypes, 'Todos los tipos');
  const brandOptions = buildSimpleOptions(
    deviceBrands.filter((item) => !deviceTypeId || item.deviceTypeId === deviceTypeId),
    'Todas las marcas',
  );
  const groupOptions = buildSimpleOptions(
    deviceModelGroups.filter((item) => !deviceBrandId || item.deviceBrandId === deviceBrandId),
    'Todos los grupos',
  );
  const modelOptions = buildSimpleOptions(
    deviceModels.filter((item) => !deviceBrandId || item.brandId === deviceBrandId),
    'Todos los modelos',
  );
  const issueOptions = buildSimpleOptions(
    deviceIssues.filter((item) => !deviceTypeId || !item.deviceTypeId || item.deviceTypeId === deviceTypeId),
    'Todas las fallas',
  );
  const hasScope = Boolean(deviceTypeId || deviceBrandId || deviceModelGroupId || deviceModelId || deviceIssueTypeId);

  return (
    <SectionCard
      title="Compatibilidad para reparaciones"
      description="Define cuando este producto debe sugerirse como repuesto interno antes de buscar proveedor externo."
      actions={<StatusBadge tone={product.repairApplicabilities.length ? 'info' : 'warning'} size="sm" label={`${product.repairApplicabilities.length} reglas`} />}
    >
      <div className="grid gap-3">
        <SelectField label="Tipo" value={deviceTypeId} onChange={(value) => { setDeviceTypeId(value); setDeviceBrandId(''); setDeviceModelGroupId(''); setDeviceModelId(''); setDeviceIssueTypeId(''); }} options={typeOptions} ariaLabel="Tipo compatible" />
        <SelectField label="Marca" value={deviceBrandId} onChange={(value) => { setDeviceBrandId(value); setDeviceModelGroupId(''); setDeviceModelId(''); }} options={brandOptions} ariaLabel="Marca compatible" />
        <SelectField label="Grupo" value={deviceModelGroupId} onChange={setDeviceModelGroupId} options={groupOptions} ariaLabel="Grupo compatible" />
        <SelectField label="Modelo" value={deviceModelId} onChange={setDeviceModelId} options={modelOptions} ariaLabel="Modelo compatible" />
        <SelectField label="Falla" value={deviceIssueTypeId} onChange={setDeviceIssueTypeId} options={issueOptions} ariaLabel="Falla compatible" />
        <TextAreaField label="Notas" value={notes} rows={2} onChange={(event) => setNotes(event.target.value)} placeholder="Ej: modulo OLED compatible con revision A." />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !hasScope}
          onClick={() => {
            onCreateRepairPartApplicability({
              deviceTypeId: deviceTypeId || null,
              deviceBrandId: deviceBrandId || null,
              deviceModelGroupId: deviceModelGroupId || null,
              deviceModelId: deviceModelId || null,
              deviceIssueTypeId: deviceIssueTypeId || null,
              notes: notes.trim() || null,
              active: true,
            });
            setNotes('');
          }}
        >
          Agregar compatibilidad
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {product.repairApplicabilities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-4 text-sm font-semibold text-zinc-500">
            Sin compatibilidades cargadas. El repuesto no se sugerira automaticamente hasta agregar al menos una.
          </div>
        ) : (
          product.repairApplicabilities.map((item) => (
            <div key={item.id} className="rounded-2xl border border-zinc-200 bg-white px-3 py-3">
              <div className="text-sm font-black text-zinc-900">{buildApplicabilityLabel(item, { deviceTypes, deviceBrands, deviceModelGroups, deviceModels, deviceIssues })}</div>
              {item.notes ? <div className="mt-1 text-xs font-semibold text-zinc-500">{item.notes}</div> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onUpdateRepairPartApplicability(item.id, { active: !item.active })}>
                  {item.active ? 'Desactivar' : 'Activar'}
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onDeleteRepairPartApplicability(item.id)}>
                  Borrar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}

function buildSimpleOptions(items: Array<{ id: string; name: string }>, emptyLabel: string): ProductSelectOption[] {
  return [{ value: '', label: emptyLabel }, ...items.map((item) => ({ value: item.id, label: item.name }))];
}

function buildApplicabilityLabel(
  item: AdminProduct['repairApplicabilities'][number],
  catalog: Pick<AdminProductEditFormLayoutProps, 'deviceTypes' | 'deviceBrands' | 'deviceModelGroups' | 'deviceModels' | 'deviceIssues'>,
) {
  const values = [
    findById(catalog.deviceTypes, item.deviceTypeId),
    findById(catalog.deviceBrands, item.deviceBrandId),
    findById(catalog.deviceModelGroups, item.deviceModelGroupId),
    findById(catalog.deviceModels, item.deviceModelId),
    findById(catalog.deviceIssues, item.deviceIssueTypeId),
  ].filter(Boolean);
  return values.join(' / ') || 'Alcance tecnico general';
}

function findById(items: Array<{ id: string; name: string }>, id?: string | null) {
  return id ? items.find((item) => item.id === id)?.name ?? null : null;
}

function ColorMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50 px-3 py-2">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">{label}</div>
      <div className="mt-1 text-lg font-black text-zinc-950">{value}</div>
    </div>
  );
}

function ColorVariantEditor({
  variant,
  disabled,
  onSave,
}: {
  variant: AdminProduct['colorOptions'][number];
  disabled: boolean;
  onSave: (input: Partial<{ label: string; supplierAvailability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'; active: boolean }>) => void;
}) {
  const [label, setLabel] = useState(variant.label);
  const [availability, setAvailability] = useState(variant.supplierAvailability);
  const [active, setActive] = useState(variant.active);

  useEffect(() => {
    setLabel(variant.label);
    setAvailability(variant.supplierAvailability);
    setActive(variant.active);
  }, [variant.id, variant.label, variant.supplierAvailability, variant.active]);

  const changed =
    label.trim() !== variant.label ||
    availability !== variant.supplierAvailability ||
    active !== variant.active;

  return (
    <div className={`rounded-3xl border px-3 py-3 ${active ? 'border-zinc-200 bg-white' : 'border-zinc-200 bg-zinc-50 opacity-75'}`}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
        <TextField label="Etiqueta" value={label} onChange={(event) => setLabel(event.target.value)} />
        <label className="ui-field">
          <span className="ui-field__label">Estado proveedor</span>
          <span className="ui-field__control">
            <select
              className="ui-input"
              value={availability}
              onChange={(event) => setAvailability(event.target.value as 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN')}
              disabled={disabled}
            >
              <option value="IN_STOCK">Disponible</option>
              <option value="OUT_OF_STOCK">Sin stock</option>
              <option value="UNKNOWN">A confirmar</option>
            </select>
          </span>
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !changed || !label.trim()}
          onClick={() => onSave({ label: label.trim(), supplierAvailability: availability, active })}
        >
          Guardar
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} disabled={disabled} />
          Activo en tienda
        </label>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={active ? 'success' : 'neutral'} size="sm" label={active ? 'Activo' : 'Inactivo'} />
          <StatusBadge
            tone={availability === 'IN_STOCK' ? 'success' : availability === 'OUT_OF_STOCK' ? 'warning' : 'neutral'}
            size="sm"
            label={availability === 'IN_STOCK' ? 'Disponible' : availability === 'OUT_OF_STOCK' ? 'Sin stock' : 'A confirmar'}
          />
        </div>
      </div>
    </div>
  );
}

function AdminProductEditAsidePanels({
  product,
  categories,
  suppliers,
  deviceTypes,
  deviceBrands,
  deviceModelGroups,
  deviceModels,
  deviceIssues,
  categoryId,
  supplierId,
  finalSlug,
  imagePreview,
  imageFileName,
  saving,
  colorSaving,
  newColorLabel,
  newColorAvailability,
  onFileChange,
  onRemoveImage,
  onNewColorLabelChange,
  onNewColorAvailabilityChange,
  onCreateColorVariant,
  onUpdateColorVariant,
  onCreateRepairPartApplicability,
  onUpdateRepairPartApplicability,
  onDeleteRepairPartApplicability,
  onCancel,
  onSave,
}: Pick<
  AdminProductEditFormLayoutProps,
  | 'product'
  | 'categories'
  | 'suppliers'
  | 'deviceTypes'
  | 'deviceBrands'
  | 'deviceModelGroups'
  | 'deviceModels'
  | 'deviceIssues'
  | 'categoryId'
  | 'supplierId'
  | 'finalSlug'
  | 'imagePreview'
  | 'imageFileName'
  | 'saving'
  | 'colorSaving'
  | 'newColorLabel'
  | 'newColorAvailability'
  | 'onFileChange'
  | 'onRemoveImage'
  | 'onNewColorLabelChange'
  | 'onNewColorAvailabilityChange'
  | 'onCreateColorVariant'
  | 'onUpdateColorVariant'
  | 'onCreateRepairPartApplicability'
  | 'onUpdateRepairPartApplicability'
  | 'onDeleteRepairPartApplicability'
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
        <div className="mt-3 rounded-[1rem] border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800">
          Dimensiones recomendadas: 1200 x 1200 px. Imagen cuadrada para tienda y detalle.
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
            <span className="ui-field__hint">Recomendado: 1200 x 1200 px. Formatos permitidos: JPG, PNG o WEBP. Maximo 4 MB.</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onRemoveImage} disabled={saving || (!imagePreview && !product.imagePath)}>
              Quitar imagen
            </Button>
            {imageFileName ? <StatusBadge tone="neutral" size="sm" label={imageFileName} /> : null}
          </div>
        </div>
      </SectionCard>

      <AdminProductEditRepairApplicabilityPanel
        product={product}
        disabled={colorSaving}
        deviceTypes={deviceTypes}
        deviceBrands={deviceBrands}
        deviceModelGroups={deviceModelGroups}
        deviceModels={deviceModels}
        deviceIssues={deviceIssues}
        onCreateRepairPartApplicability={onCreateRepairPartApplicability}
        onUpdateRepairPartApplicability={onUpdateRepairPartApplicability}
        onDeleteRepairPartApplicability={onDeleteRepairPartApplicability}
      />

      <AdminProductEditColorPanel
        product={product}
        colorSaving={colorSaving}
        newColorLabel={newColorLabel}
        newColorAvailability={newColorAvailability}
        onNewColorLabelChange={onNewColorLabelChange}
        onNewColorAvailabilityChange={onNewColorAvailabilityChange}
        onCreateColorVariant={onCreateColorVariant}
        onUpdateColorVariant={onUpdateColorVariant}
      />

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
            <span className="fact-value fact-value--text">{findCategoryPathLabel(categories, categoryId, 'Sin categoria')}</span>
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
