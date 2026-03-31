import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import type { RepairPricingRuleFormState, RepairPricingRuleOption, RepairRuleCalcMode } from './admin-repair-pricing-rule-form.helpers';

export function AdminRepairPricingRuleHero({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <section className="store-hero">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">{title}</h1>
          <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>
        </div>
        <Link to="/admin/precios" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
          Volver
        </Link>
      </div>
    </section>
  );
}

export function AdminRepairPricingRuleError({ error }: { error: string }) {
  if (!error) return null;
  return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div>;
}

export function AdminRepairPricingRuleLoading({ label }: { label: string }) {
  return (
    <section className="card mx-auto w-full max-w-[820px]">
      <div className="card-body">{label}</div>
    </section>
  );
}

export function AdminRepairPricingRuleFormCard({
  form,
  deviceTypeOptions,
  brandOptions,
  modelOptions,
  issueOptions,
  calcModeOptions,
  loading,
  saving,
  canSave,
  onFieldChange,
  onDeviceTypeChange,
  onBrandChange,
  onModelChange,
  onIssueChange,
  onCalcModeChange,
  onSave,
}: {
  form: RepairPricingRuleFormState;
  deviceTypeOptions: RepairPricingRuleOption[];
  brandOptions: RepairPricingRuleOption[];
  modelOptions: RepairPricingRuleOption[];
  issueOptions: RepairPricingRuleOption[];
  calcModeOptions: RepairPricingRuleOption[];
  loading: boolean;
  saving: boolean;
  canSave: boolean;
  onFieldChange: (field: keyof RepairPricingRuleFormState, value: string | boolean) => void;
  onDeviceTypeChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onIssueChange: (value: string) => void;
  onCalcModeChange: (value: RepairRuleCalcMode) => void;
  onSave: () => void;
}) {
  return (
    <section className="card mx-auto w-full max-w-[820px]">
      <div className="card-body space-y-4 md:space-y-5">
        <Field label="Nombre de la regla *">
          <input
            value={form.name}
            onChange={(event) => onFieldChange('name', event.target.value)}
            className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            placeholder="Ej: Módulo Samsung A línea media"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Tipo de dispositivo (catálogo, opcional)">
            <CustomSelect
              value={form.deviceTypeId}
              onChange={onDeviceTypeChange}
              options={deviceTypeOptions}
              disabled={loading}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar tipo de dispositivo"
            />
          </Field>
          <Field label="Marca (catálogo, opcional)">
            <CustomSelect
              value={form.brandId}
              onChange={onBrandChange}
              options={brandOptions}
              disabled={loading}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar marca"
            />
          </Field>
          <Field label="Modelo (catálogo, opcional)">
            <CustomSelect
              value={form.modelId}
              onChange={onModelChange}
              options={modelOptions}
              disabled={loading}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar modelo"
            />
          </Field>
        </div>

        <Field label="Tipo de reparación / falla (catálogo, opcional)">
          <CustomSelect
            value={form.issueId}
            onChange={onIssueChange}
            options={issueOptions}
            disabled={loading}
            triggerClassName="min-h-11 rounded-2xl font-bold"
            ariaLabel="Seleccionar tipo de reparación"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Base (costo/base) *">
            <input value={form.basePrice} onChange={(event) => onFieldChange('basePrice', event.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
          </Field>
          <Field label="Margen (%) *">
            <input
              value={form.profitPercent}
              onChange={(event) => onFieldChange('profitPercent', event.target.value)}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              disabled={form.calcMode === 'FIXED_TOTAL'}
            />
          </Field>
          <Field label="Prioridad">
            <input value={form.priority} onChange={(event) => onFieldChange('priority', event.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Modo de cálculo">
            <CustomSelect
              value={form.calcMode}
              onChange={(value) => onCalcModeChange(value as RepairRuleCalcMode)}
              options={calcModeOptions}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar modo de cálculo"
            />
          </Field>
          <Field label="Mínimo de ganancia (opcional)">
            <input
              value={form.minProfit}
              onChange={(event) => onFieldChange('minProfit', event.target.value)}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              placeholder="0"
              disabled={form.calcMode === 'FIXED_TOTAL'}
            />
          </Field>
          <Field label="Mínimo final (opcional)">
            <input
              value={form.minFinalPrice}
              onChange={(event) => onFieldChange('minFinalPrice', event.target.value)}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              placeholder="0"
            />
          </Field>
          <Field label="Envío (opcional)">
            <input
              value={form.shippingFee}
              onChange={(event) => onFieldChange('shippingFee', event.target.value)}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              placeholder="0"
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Marca (texto fallback)">
            <input value={form.brandText} onChange={(event) => onFieldChange('brandText', event.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" placeholder="Samsung" />
          </Field>
          <Field label="Modelo (texto fallback)">
            <input value={form.modelText} onChange={(event) => onFieldChange('modelText', event.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" placeholder="A32" />
          </Field>
          <Field label="Reparación (texto fallback)">
            <input value={form.issueText} onChange={(event) => onFieldChange('issueText', event.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" placeholder="Módulo" />
          </Field>
        </div>

        <Field label="Notas (opcional)">
          <textarea value={form.notes} onChange={(event) => onFieldChange('notes', event.target.value)} rows={4} className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm" />
        </Field>

        <label className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800">
          <input type="checkbox" checked={form.active} onChange={(event) => onFieldChange('active', event.target.checked)} className="h-4 w-4" />
          Activa
        </label>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <Link to="/admin/precios" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Cancelar
          </Link>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || loading || !canSave}
            className="btn-primary !h-10 !rounded-xl px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-zinc-800">{label}</label>
      {children}
    </div>
  );
}
