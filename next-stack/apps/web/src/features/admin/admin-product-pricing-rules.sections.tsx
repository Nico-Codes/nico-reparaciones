import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import type { AdminCategory, AdminProduct } from '@/features/catalogAdmin/api';
import type {
  ProductPricingRuleForm,
  ProductPricingSimulationResult,
  ProductRuleRow,
} from './admin-product-pricing-rules.helpers';

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-zinc-900">{label}</label>
      <CustomSelect
        value={value}
        onChange={onChange}
        options={options}
        triggerClassName="min-h-11 rounded-2xl font-bold"
        ariaLabel={label}
      />
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-zinc-900">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
      />
    </div>
  );
}

function EditableInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-black text-zinc-700">{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
      />
    </div>
  );
}

function EditableSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-black text-zinc-700">{label}</div>
      <CustomSelect
        value={value}
        onChange={onChange}
        options={options}
        triggerClassName="min-h-11 rounded-2xl font-bold"
        ariaLabel={label}
      />
    </div>
  );
}

export function AdminProductPricingHeaderActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link to="/admin/calculos" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
        Reglas de cálculo
      </Link>
      <Link to="/admin/productos" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
        Productos
      </Link>
    </div>
  );
}

export function ProductPricingPreferencesSection({
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
        <div className="text-xl font-black tracking-tight text-zinc-900">Preferencias de cálculo</div>
      </div>
      <div className="card-body space-y-3">
        <div>
          <label className="mb-2 block text-sm font-bold text-zinc-900">Margen por defecto (%)</label>
          <input
            value={defaultMargin}
            onChange={(event) => onDefaultMarginChange(event.target.value)}
            className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
          />
          <p className="mt-2 text-sm text-zinc-500">Se usa cuando no hay una regla puntual para el producto o la categoría.</p>
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

export function ProductPricingSimulatorSection({
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
        <div className="text-xl font-black tracking-tight text-zinc-900">Simulador rápido</div>
      </div>
      <div className="card-body space-y-3">
        <SelectField
          label="Categoría"
          value={simCategoryId}
          onChange={onCategoryChange}
          options={categoryOptions}
        />
        <SelectField
          label="Producto (opcional)"
          value={simProductId}
          onChange={onProductChange}
          options={productOptions}
        />
        <InputField label="Costo" value={simCost} onChange={onCostChange} />
        <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700" data-loading={simLoading || undefined}>
          {message}
        </div>
        {simResult ? (
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-zinc-500">
            {simResult.ruleName ? 'Resolución con regla específica' : 'Resolución con margen por defecto'}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ProductPricingCreateRuleSection({
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
        <InputField
          label="Nombre *"
          value={form.name}
          onChange={(value) => onPatch({ name: value })}
          placeholder="Ej: Cables económicos (< 5000) +50%"
        />
        <div className="grid gap-3 md:grid-cols-3">
          <SelectField
            label="Categoría (opcional)"
            value={form.categoryId}
            onChange={(value) => onPatch({ categoryId: value, productId: '' })}
            options={categoryOptions}
          />
          <SelectField
            label="Producto (opcional)"
            value={form.productId}
            onChange={(value) => onPatch({ productId: value })}
            options={productOptions}
          />
          <InputField
            label="Margen % *"
            value={form.marginPercent}
            onChange={(value) => onPatch({ marginPercent: value })}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <InputField label="Costo mínimo" value={form.costMin} onChange={(value) => onPatch({ costMin: value })} placeholder="Ej: 0" />
          <InputField label="Costo máximo" value={form.costMax} onChange={(value) => onPatch({ costMax: value })} placeholder="Ej: 5000" />
          <InputField label="Prioridad" value={form.priority} onChange={(value) => onPatch({ priority: value })} />
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

function ProductPricingRuleCard({
  rule,
  products,
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
  categoryOptions: Array<{ value: string; label: string }>;
  categoryName: string;
  productName: string;
  saving: boolean;
  deleting: boolean;
  onPatch: (patch: Partial<ProductRuleRow>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3">
      <div className="grid gap-3 md:grid-cols-[1.6fr_0.9fr_0.9fr_0.7fr_0.8fr_0.8fr_0.8fr]">
        <EditableInput label="Nombre" value={rule.name} onChange={(value) => onPatch({ name: value })} />
        <EditableSelect
          label="Categoría"
          value={rule.categoryId ?? ''}
          onChange={(value) => onPatch({ categoryId: value || null, productId: null })}
          options={categoryOptions}
        />
        <EditableSelect
          label="Producto"
          value={rule.productId ?? ''}
          onChange={(value) => onPatch({ productId: value || null })}
          options={[
            { value: '', label: 'Todos' },
            ...products
              .filter((product) => !rule.categoryId || product.categoryId === rule.categoryId)
              .map((product) => ({ value: product.id, label: product.name })),
          ]}
        />
        <EditableInput label="%" value={rule.marginPercent} onChange={(value) => onPatch({ marginPercent: value })} />
        <EditableInput label="Min" value={rule.costMin} onChange={(value) => onPatch({ costMin: value })} />
        <EditableInput label="Max" value={rule.costMax} onChange={(value) => onPatch({ costMax: value })} />
        <EditableInput label="Prioridad" value={rule.priority} onChange={(value) => onPatch({ priority: value })} />
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

export function ProductPricingRulesListSection({
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
  const categoryLookup = new Map(categories.map((category) => [category.id, category.name]));
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
