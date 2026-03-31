import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import type { AdminProduct } from '@/features/catalogAdmin/api';
import type { WarrantyCreateForm } from './admin-warranty-create.helpers';
import { formatMoney } from './admin-warranty-create.helpers';

type WarrantyCreateFeedbackProps = {
  error: string;
};

type WarrantyCreateHeroProps = {
  backTo: string;
};

type WarrantyCreateDetailsSectionProps = {
  form: WarrantyCreateForm;
  loadingRepair: boolean;
  loadingRepairs: boolean;
  loadingProviders: boolean;
  loadingProducts: boolean;
  repairOptions: Array<{ value: string; label: string }>;
  productOptions: Array<{ value: string; label: string }>;
  providerOptions: Array<{ value: string; label: string }>;
  selectedRepairId: string;
  selectedRepairLabel: string;
  onChange: <K extends keyof WarrantyCreateForm>(field: K, value: WarrantyCreateForm[K]) => void;
  onRepairChange: (nextRepairId: string) => void;
  onProductChange: (nextProductId: string) => void;
};

type WarrantyCreateCostsSectionProps = {
  form: WarrantyCreateForm;
  estimatedLoss: number;
  selectedProduct: AdminProduct | null;
  onChange: <K extends keyof WarrantyCreateForm>(field: K, value: WarrantyCreateForm[K]) => void;
};

type WarrantyCreateNotesSectionProps = {
  backTo: string;
  form: WarrantyCreateForm;
  saving: boolean;
  onChange: <K extends keyof WarrantyCreateForm>(field: K, value: WarrantyCreateForm[K]) => void;
  onSave: () => void;
};

export function WarrantyCreateHero({ backTo }: WarrantyCreateHeroProps) {
  return (
    <section className="store-hero">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Nuevo incidente de garantia</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Registra perdida real por garantia para mantener trazabilidad.
          </p>
        </div>
        <Link to={backTo} className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
          Volver
        </Link>
      </div>
    </section>
  );
}

export function WarrantyCreateFeedback({ error }: WarrantyCreateFeedbackProps) {
  if (!error) {
    return null;
  }

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      {error}
    </div>
  );
}

export function WarrantyCreateDetailsSection({
  form,
  loadingRepair,
  loadingRepairs,
  loadingProviders,
  loadingProducts,
  repairOptions,
  productOptions,
  providerOptions,
  selectedRepairId,
  selectedRepairLabel,
  onChange,
  onRepairChange,
  onProductChange,
}: WarrantyCreateDetailsSectionProps) {
  return (
    <section className="card">
      <div className="card-head flex items-center justify-between gap-2">
        <div className="text-xl font-black tracking-tight text-zinc-900">Datos del incidente</div>
        <span className="badge-zinc">Garantia</span>
      </div>
      <div className="card-body space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Origen *</span>
            <CustomSelect
              value={form.source}
              onChange={(value) => onChange('source', value as WarrantyCreateForm['source'])}
              options={[
                { value: 'REPAIR', label: 'Reparacion' },
                { value: 'PRODUCT', label: 'Producto' },
              ]}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar origen"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Titulo *</span>
            <input
              value={form.title}
              onChange={(event) => onChange('title', event.target.value)}
              placeholder="Ej: Cambio de modulo en garantia"
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-bold text-zinc-700">Motivo (opcional)</span>
          <input
            value={form.reason}
            onChange={(event) => onChange('reason', event.target.value)}
            placeholder="Ej: falla de fabrica / devolucion por defecto"
            className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Reparacion asociada</span>
            <CustomSelect
              value={selectedRepairId}
              disabled={form.source !== 'REPAIR'}
              onChange={onRepairChange}
              options={repairOptions}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar reparacion asociada"
            />
            <p className="mt-1 text-xs text-zinc-500">
              {loadingRepairs || loadingRepair
                ? 'Cargando reparaciones...'
                : form.source === 'REPAIR'
                  ? `Seleccionada: ${selectedRepairLabel}`
                  : 'Solo requerido cuando el origen es Reparacion.'}
            </p>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Producto asociado</span>
            <CustomSelect
              value={form.productId}
              disabled={form.source !== 'PRODUCT'}
              onChange={onProductChange}
              options={productOptions}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar producto asociado"
            />
            <p className="mt-1 text-xs text-zinc-500">
              {loadingProducts ? 'Cargando productos...' : 'Selecciona un producto cuando el origen sea Producto.'}
            </p>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Proveedor</span>
              <CustomSelect
                value={form.providerId}
                onChange={(value) => onChange('providerId', value)}
                options={providerOptions}
                triggerClassName="min-h-11 rounded-2xl font-bold"
                ariaLabel="Seleccionar proveedor"
              />
            </label>
            <p className="mt-1 text-xs text-zinc-500">
              {loadingProviders ? 'Cargando proveedores...' : 'Puedes dejarlo manual o autocompletar desde el producto.'}
            </p>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Pedido asociado (opcional)</span>
            <input
              value={form.orderRef}
              onChange={(event) => onChange('orderRef', event.target.value)}
              placeholder="ID de pedido"
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            />
          </label>
        </div>

        <label className="block max-w-md">
          <span className="mb-1 block text-sm font-bold text-zinc-700">Fecha del incidente</span>
          <input
            type="datetime-local"
            value={form.incidentAt}
            onChange={(event) => onChange('incidentAt', event.target.value)}
            className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
          />
        </label>
      </div>
    </section>
  );
}

export function WarrantyCreateCostsSection({
  form,
  estimatedLoss,
  selectedProduct,
  onChange,
}: WarrantyCreateCostsSectionProps) {
  return (
    <section className="card">
      <div className="card-head flex items-center justify-between gap-2">
        <div className="text-xl font-black tracking-tight text-zinc-900">Costos y recupero</div>
        <span className="badge-zinc">Finanzas</span>
      </div>
      <div className="card-body space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Cantidad *</span>
            <input
              type="number"
              min="1"
              value={form.qty}
              onChange={(event) => onChange('qty', event.target.value)}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            />
          </label>
          <div>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Costo unitario *</span>
              <input
                type="number"
                min="0"
                value={form.unitCost}
                onChange={(event) => onChange('unitCost', event.target.value)}
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              />
            </label>
            <p className="mt-1 text-xs text-zinc-500">
              Se autocompleta desde la reparacion o el producto cuando existe contexto.
            </p>
            <div className="mt-2">
              <span className="inline-flex h-7 items-center rounded-full border border-sky-300 bg-sky-50 px-3 text-xs font-bold text-sky-700">
                Origen costo: {form.source === 'REPAIR' ? 'Reparacion' : selectedProduct ? 'Producto' : 'Manual'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Costo extra</span>
            <input
              type="number"
              min="0"
              value={form.extraCost}
              onChange={(event) => onChange('extraCost', event.target.value)}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Monto recuperado</span>
            <input
              type="number"
              min="0"
              value={form.recoveredAmount}
              onChange={(event) => onChange('recoveredAmount', event.target.value)}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <div className="text-xs font-black uppercase tracking-wide text-rose-700">PERDIDA ESTIMADA</div>
          <div className="mt-1 text-4xl font-black tracking-tight text-rose-700">
            {formatMoney(estimatedLoss)}
          </div>
        </div>
      </div>
    </section>
  );
}

export function WarrantyCreateNotesSection({
  backTo,
  form,
  saving,
  onChange,
  onSave,
}: WarrantyCreateNotesSectionProps) {
  return (
    <section className="card">
      <div className="card-body space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-zinc-700">Notas internas (opcional)</span>
          <textarea
            value={form.notes}
            onChange={(event) => onChange('notes', event.target.value)}
            rows={4}
            placeholder="Detalle del caso, proveedor, decision tomada, etc."
            className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
          />
        </label>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link to={backTo} className="btn-outline !h-11 !rounded-2xl px-6 text-sm font-bold">
            Cancelar
          </Link>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="btn-primary !h-11 !rounded-2xl px-6 text-sm font-bold disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar incidente'}
          </button>
        </div>
      </div>
    </section>
  );
}
