import { Link } from 'react-router-dom';
import type { AdminCategory, AdminProduct } from '@/features/catalogAdmin/api';
import type {
  ProductPricingRuleForm,
  ProductPricingSimulationResult,
  ProductRuleRow,
} from './admin-product-pricing-rules.helpers';
import { buildProductOptions, categoryNameById, filterProductsByCategory } from './admin-product-pricing-rules.helpers';
import {
  ProductPricingEditableInput,
  ProductPricingEditableSelect,
  ProductPricingInputField,
  ProductPricingSelectField,
} from './admin-product-pricing-rules.fields';

export function AdminProductPricingHeaderActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link to="/admin/calculos" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
        Reglas de calculo
      </Link>
      <Link to="/admin/productos" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
        Productos
      </Link>
    </div>
  );
}

export function ProductPricingPreferencesPanel({
  defaultMargin,
  blockNegative,
  loading,
  savingPrefs,
  onDefaultMarginChange,
  onBlockNegativeChange,
  onSave,
}: {
  defaultMargin: string;
  blockNegative: boolean;
  loading: boolean;
  savingPrefs: boolean;
  onDefaultMarginChange: (value: string) => void;
  onBlockNegativeChange: (value: boolean) => void;
  onSave: () => void;
}) {
  return (
    <section className="card">
      <div className="card-head">
        <div className="text-xl font-black tracking-tight text-zinc-900">Preferencias de calculo</div>
      </div>
      <div className="card-body space-y-3">
        <div>
          <label className="mb-2 block text-sm font-bold text-zinc-900">Margen por defecto (%)</label>
          <input
            value={defaultMargin}
            onChange={(event) => onDefaultMarginChange(event.target.value)}
            className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
          />
          <p className="mt-2 text-sm text-zinc-500">Se usa cuando no hay una regla puntual para el producto o la categoria.</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-zinc-900">
          <input
            type="checkbox"
            checked={blockNegative}
            onChange={(event) => onBlockNegativeChange(event.target.checked)}
            className="h-4 w-4"
          />
          Bloquear ventas con margen negativo (precio menor al costo)
        </label>
        <div className="pt-1 text-right">
          <button
            type="button"
            onClick={onSave}
            disabled={loading || savingPrefs}
            className="btn-primary !h-10 !rounded-xl px-4 text-sm font-bold disabled:opacity-60"
          >
            {savingPrefs ? 'Guardando...' : 'Guardar preferencias'}
          </button>
        </div>
      </div>
    </section>
  );
}

export function ProductPricingSimulatorPanel({
  simCategoryId,
  simProductId,
  simCost,
  simResult,
  simLoading,
  categoryOptions,
  productOptions,
  message,
  onCategoryChange,
  onProductChange,
  onCostChange,
}: {
  simCategoryId: string;
  simProductId: string;
  simCost: string;
  simResult: ProductPricingSimulationResult | null;
  simLoading: boolean;
  categoryOptions: Array<{ value: string; label: string }>;
  productOptions: Array<{ value: string; label: string }>;
  message: string;
  onCategoryChange: (value: string) => void;
  onProductChange: (value: string) => void;
  onCostChange: (value: string) => void;
}) {
  return (
    <section className="card">
      <div className="card-head">
        <div className="text-xl font-black tracking-tight text-zinc-900">Simulador rapido</div>
      </div>
      <div className="card-body space-y-3">
        <ProductPricingSelectField label="Categoria" value={simCategoryId} onChange={onCategoryChange} options={categoryOptions} />
        <ProductPricingSelectField label="Producto (opcional)" value={simProductId} onChange={onProductChange} options={productOptions} />
        <ProductPricingInputField label="Costo" value={simCost} onChange={onCostChange} />
        <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700" data-loading={simLoading || undefined}>
          {message}
        </div>
        {simResult ? (
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-zinc-500">
            {simResult.ruleName ? 'Resolucion con regla especifica' : 'Resolucion con margen por defecto'}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ProductPricingCreateRulePanel({
  form,
  loading,
  creatingRule,
  categoryOptions,
  productOptions,
  onPatch,
  onCreate,
}: {
  form: ProductPricingRuleForm;
  loading: boolean;
  creatingRule: boolean;
  categoryOptions: Array<{ value: string; label: string }>;
  productOptions: Array<{ value: string; label: string }>;
  onPatch: (patch: Partial<ProductPricingRuleForm>) => void;
  onCreate: () => void;
}) {
  return (
    <section className="card">
      <div className="card-head">
        <div className="text-xl font-black tracking-tight text-zinc-900">Nueva regla</div>
      </div>
      <div className="card-body space-y-4">
        <ProductPricingInputField
          label="Nombre *"
          value={form.name}
          onChange={(value) => onPatch({ name: value })}
          placeholder="Ej: Cables economicos (< 5000) +50%"
        />
        <div className="grid gap-3 md:grid-cols-3">
          <ProductPricingSelectField
            label="Categoria (opcional)"
            value={form.categoryId}
            onChange={(value) => onPatch({ categoryId: value, productId: '' })}
            options={categoryOptions}
          />
          <ProductPricingSelectField
            label="Producto (opcional)"
            value={form.productId}
            onChange={(value) => onPatch({ productId: value })}
            options={productOptions}
          />
          <ProductPricingInputField
            label="Margen % *"
            value={form.marginPercent}
            onChange={(value) => onPatch({ marginPercent: value })}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <ProductPricingInputField label="Costo minimo" value={form.costMin} onChange={(value) => onPatch({ costMin: value })} placeholder="Ej: 0" />
          <ProductPricingInputField label="Costo maximo" value={form.costMax} onChange={(value) => onPatch({ costMax: value })} placeholder="Ej: 5000" />
          <ProductPricingInputField label="Prioridad" value={form.priority} onChange={(value) => onPatch({ priority: value })} />
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-zinc-900">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => onPatch({ active: event.target.checked })}
            className="h-4 w-4"
          />
          Regla activa
        </label>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCreate}
            disabled={loading || creatingRule || !form.name.trim()}
            className="btn-primary !h-11 !rounded-xl px-5 text-sm font-bold disabled:opacity-60"
          >
            {creatingRule ? 'Creando...' : 'Crear regla'}
          </button>
        </div>
      </div>
    </section>
  );
}

export function ProductPricingRulesListPanel({
  rules,
  loading,
  products,
  categories,
  categoryOptions,
  savingRuleId,
  deletingRuleId,
  onPatchRule,
  onSaveRule,
  onRemoveRule,
}: {
  rules: ProductRuleRow[];
  loading: boolean;
  products: AdminProduct[];
  categories: AdminCategory[];
  categoryOptions: Array<{ value: string; label: string }>;
  savingRuleId: string | null;
  deletingRuleId: string | null;
  onPatchRule: (id: string, patch: Partial<ProductRuleRow>) => void;
  onSaveRule: (rule: ProductRuleRow) => void;
  onRemoveRule: (id: string) => void;
}) {
  const categoryLookup = new Map(categories.map((category) => [category.id, categoryNameById(categories, category.id)]));
  const productLookup = new Map(products.map((product) => [product.id, product.name]));

  return (
    <section className="card">
      <div className="card-head flex items-center justify-between gap-3">
        <div className="text-xl font-black tracking-tight text-zinc-900">Reglas cargadas</div>
        <span className="inline-flex h-7 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold text-zinc-700">
          {rules.length} reglas
        </span>
      </div>
      <div className="card-body">
        <div className="space-y-3">
          {loading ? <div className="text-sm text-zinc-600">Cargando reglas...</div> : null}
          {!loading && rules.length === 0 ? <div className="text-sm text-zinc-600">Sin reglas cargadas.</div> : null}
          {rules.map((rule) => (
            <ProductPricingRuleCard
              key={rule.id}
              rule={rule}
              products={products}
              categories={categories}
              categoryOptions={categoryOptions}
              categoryName={categoryLookup.get(rule.categoryId ?? '') ?? 'Todas'}
              productName={productLookup.get(rule.productId ?? '') ?? 'Todos'}
              saving={savingRuleId === rule.id}
              deleting={deletingRuleId === rule.id}
              onPatch={(patch) => onPatchRule(rule.id, patch)}
              onSave={() => onSaveRule(rule)}
              onDelete={() => onRemoveRule(rule.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductPricingRuleCard({
  rule,
  products,
  categories,
  categoryOptions,
  categoryName,
  productName,
  saving,
  deleting,
  onPatch,
  onSave,
  onDelete,
}: {
  rule: ProductRuleRow;
  products: AdminProduct[];
  categories: AdminCategory[];
  categoryOptions: Array<{ value: string; label: string }>;
  categoryName: string;
  productName: string;
  saving: boolean;
  deleting: boolean;
  onPatch: (patch: Partial<ProductRuleRow>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const filteredProducts = filterProductsByCategory(products, categories, rule.categoryId ?? '');
  const productOptions = buildProductOptions(filteredProducts, 'Todos');

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3">
      <div className="grid gap-3 md:grid-cols-[1.6fr_0.9fr_0.9fr_0.7fr_0.8fr_0.8fr_0.8fr]">
        <ProductPricingEditableInput label="Nombre" value={rule.name} onChange={(value) => onPatch({ name: value })} />
        <ProductPricingEditableSelect
          label="Categoria"
          value={rule.categoryId ?? ''}
          onChange={(value) => onPatch({ categoryId: value || null, productId: null })}
          options={categoryOptions}
        />
        <ProductPricingEditableSelect
          label="Producto"
          value={rule.productId ?? ''}
          onChange={(value) => onPatch({ productId: value || null })}
          options={productOptions}
        />
        <ProductPricingEditableInput label="%" value={rule.marginPercent} onChange={(value) => onPatch({ marginPercent: value })} />
        <ProductPricingEditableInput label="Min" value={rule.costMin} onChange={(value) => onPatch({ costMin: value })} />
        <ProductPricingEditableInput label="Max" value={rule.costMax} onChange={(value) => onPatch({ costMax: value })} />
        <ProductPricingEditableInput label="Prioridad" value={rule.priority} onChange={(value) => onPatch({ priority: value })} />
      </div>
      <div className="mt-2 text-xs text-zinc-500">
        Aplica a: {categoryName} / {productName}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-bold text-zinc-900">
          <input
            type="checkbox"
            checked={rule.active}
            onChange={(event) => onPatch({ active: event.target.checked })}
            className="h-4 w-4"
          />
          Activa
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving || deleting}
            className="btn-outline !h-8 !rounded-xl px-3 text-sm font-bold disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-xl border border-rose-200 bg-white px-3 text-sm font-bold text-rose-600 disabled:opacity-60"
            onClick={onDelete}
            disabled={saving || deleting}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
