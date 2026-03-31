import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import {
  buildBrandOptions,
  buildGroupOptions,
  buildIssueOptions,
  buildModelOptions,
  buildTypeOptions,
  filterBrandsByDeviceType,
  filterIssuesByDeviceType,
  filterModelsByBrand,
  filterModelsByGroup,
  repairScopeGroupLabel,
  repairScopeTypeLabel,
  REPAIR_PRICING_CALC_MODE_OPTIONS,
  type RepairBrandCatalogItem,
  type RepairDeviceType,
  type RepairIssueCatalogItem,
  type RepairModelCatalogItem,
  type RepairModelGroupItem,
  type RepairPricingCalcMode,
  type RepairRuleRow,
} from './admin-repair-pricing-rules.helpers';

function InlineText({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-xl border border-zinc-200 px-2 text-sm"
    />
  );
}

function TinySelect({
  value,
  onChange,
  options,
  ariaLabel,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      triggerClassName="h-8 min-h-8 rounded-lg px-2 text-xs font-semibold"
      menuClassName="text-xs"
      ariaLabel={ariaLabel}
    />
  );
}

function ScopePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <span className="truncate text-xs font-semibold text-zinc-700" title={value}>
        {value}
      </span>
    </div>
  );
}

function ScopeEditorCell({
  row,
  deviceTypes,
  brandsCatalog,
  modelsCatalog,
  issuesCatalog,
  deviceTypeNames,
  modelGroupNames,
  modelGroupsByBrand,
  onPatch,
}: {
  row: RepairRuleRow;
  deviceTypes: RepairDeviceType[];
  brandsCatalog: RepairBrandCatalogItem[];
  modelsCatalog: RepairModelCatalogItem[];
  issuesCatalog: RepairIssueCatalogItem[];
  deviceTypeNames: Record<string, string>;
  modelGroupNames: Record<string, string>;
  modelGroupsByBrand: Record<string, RepairModelGroupItem[]>;
  onPatch: (rowId: string, patch: Partial<RepairRuleRow>) => void;
}) {
  const filteredBrands = filterBrandsByDeviceType(brandsCatalog, row.deviceTypeId ?? null);
  const filteredModels = filterModelsByBrand(modelsCatalog, row.deviceBrandId ?? null);
  const filteredIssues = filterIssuesByDeviceType(issuesCatalog, row.deviceTypeId ?? null);
  const filteredModelsByGroup = filterModelsByGroup(filteredModels, row.deviceModelGroupId ?? null);
  const groupOptions = row.deviceBrandId ? modelGroupsByBrand[row.deviceBrandId] ?? [] : [];

  return (
    <div className="space-y-1.5">
      <TinySelect
        value={row.deviceTypeId ?? ''}
        onChange={(value) => onPatch(row.id, { deviceTypeId: value || null })}
        options={buildTypeOptions(deviceTypes)}
        ariaLabel="Seleccionar tipo de dispositivo"
      />
      <TinySelect
        value={row.deviceBrandId ?? ''}
        onChange={(value) => onPatch(row.id, { deviceBrandId: value || null })}
        options={buildBrandOptions(filteredBrands)}
        ariaLabel="Seleccionar marca"
      />
      <TinySelect
        value={row.deviceModelGroupId ?? ''}
        onChange={(value) => onPatch(row.id, { deviceModelGroupId: value || null })}
        options={buildGroupOptions(groupOptions, Boolean(row.deviceBrandId))}
        ariaLabel="Seleccionar grupo de modelo"
        disabled={!row.deviceBrandId}
      />
      <TinySelect
        value={row.deviceModelId ?? ''}
        onChange={(value) => onPatch(row.id, { deviceModelId: value || null })}
        options={buildModelOptions(filteredModelsByGroup)}
        ariaLabel="Seleccionar modelo"
      />
      <TinySelect
        value={row.deviceIssueTypeId ?? ''}
        onChange={(value) => onPatch(row.id, { deviceIssueTypeId: value || null })}
        options={buildIssueOptions(filteredIssues)}
        ariaLabel="Seleccionar falla"
      />
      <div className="space-y-1">
        <ScopePill label="Tipo" value={repairScopeTypeLabel(row, deviceTypeNames)} />
        <ScopePill label="Grupo" value={repairScopeGroupLabel(row, modelGroupNames)} />
      </div>
    </div>
  );
}

function RepairPricingRuleRowCard({
  row,
  deviceTypes,
  brandsCatalog,
  modelsCatalog,
  issuesCatalog,
  deviceTypeNames,
  modelGroupNames,
  modelGroupsByBrand,
  saving,
  deleting,
  onPatchRow,
  onPatchScope,
  onSave,
  onDelete,
}: {
  row: RepairRuleRow;
  deviceTypes: RepairDeviceType[];
  brandsCatalog: RepairBrandCatalogItem[];
  modelsCatalog: RepairModelCatalogItem[];
  issuesCatalog: RepairIssueCatalogItem[];
  deviceTypeNames: Record<string, string>;
  modelGroupNames: Record<string, string>;
  modelGroupsByBrand: Record<string, RepairModelGroupItem[]>;
  saving: boolean;
  deleting: boolean;
  onPatchRow: (id: string, patch: Partial<RepairRuleRow>) => void;
  onPatchScope: (id: string, patch: Partial<RepairRuleRow>) => void;
  onSave: (row: RepairRuleRow) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-[0.55fr_1fr_1.8fr_0.85fr_0.85fr_0.85fr_0.85fr_0.7fr_0.7fr_0.8fr_0.7fr_0.7fr_0.7fr_1.15fr] gap-3 border-b border-zinc-100 px-4 py-3 text-sm">
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={row.active}
          onChange={(event) => onPatchRow(row.id, { active: event.target.checked })}
          className="h-4 w-4"
        />
      </div>
      <InlineText value={row.name} onChange={(value) => onPatchRow(row.id, { name: value })} />
      <ScopeEditorCell
        row={row}
        deviceTypes={deviceTypes}
        brandsCatalog={brandsCatalog}
        modelsCatalog={modelsCatalog}
        issuesCatalog={issuesCatalog}
        deviceTypeNames={deviceTypeNames}
        modelGroupNames={modelGroupNames}
        modelGroupsByBrand={modelGroupsByBrand}
        onPatch={onPatchScope}
      />
      <InlineText value={row.brand} onChange={(value) => onPatchRow(row.id, { brand: value })} />
      <InlineText value={row.model} onChange={(value) => onPatchRow(row.id, { model: value })} />
      <InlineText value={row.repairType} onChange={(value) => onPatchRow(row.id, { repairType: value })} />
      <TinySelect
        value={row.calcMode}
        onChange={(value) => onPatchRow(row.id, { calcMode: value as RepairPricingCalcMode })}
        options={[...REPAIR_PRICING_CALC_MODE_OPTIONS]}
        ariaLabel="Seleccionar modo de calculo"
      />
      <InlineText value={row.basePrice} onChange={(value) => onPatchRow(row.id, { basePrice: value })} />
      <InlineText value={row.percent} onChange={(value) => onPatchRow(row.id, { percent: value })} />
      <InlineText value={row.minProfit} onChange={(value) => onPatchRow(row.id, { minProfit: value })} />
      <InlineText value={row.minFinalPrice} onChange={(value) => onPatchRow(row.id, { minFinalPrice: value })} />
      <InlineText value={row.shippingFee} onChange={(value) => onPatchRow(row.id, { shippingFee: value })} />
      <InlineText value={row.priority} onChange={(value) => onPatchRow(row.id, { priority: value })} />
      <div className="flex items-center gap-2">
        <Link
          to={`/admin/precios/${encodeURIComponent(row.id)}/editar`}
          className="btn-outline !h-8 !rounded-xl px-3 text-sm font-bold"
        >
          Editar
        </Link>
        <button
          type="button"
          onClick={() => onSave(row)}
          disabled={saving || deleting}
          className="btn-outline !h-8 !rounded-xl px-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? '...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => onDelete(row.id)}
          disabled={saving || deleting}
          className="inline-flex h-8 items-center rounded-xl border border-rose-200 bg-white px-3 text-sm font-bold text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleting ? '...' : 'Eliminar'}
        </button>
      </div>
    </div>
  );
}

export function RepairPricingHeaderActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link to="/admin/tiposdispositivo" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
        Dispositivos
      </Link>
      <Link to="/admin/catalogodispositivos" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
        Catalogo
      </Link>
      <Link to="/admin/gruposmodelos" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
        Grupos
      </Link>
      <Link to="/admin/tiposreparacion" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
        Tipos
      </Link>
      <Link to="/admin/precios/crear" className="btn-primary !h-10 !rounded-xl px-4 text-sm font-bold">
        + Nueva regla
      </Link>
    </div>
  );
}

export function RepairPricingRulesTableSection({
  rows,
  loading,
  deviceTypes,
  brandsCatalog,
  modelsCatalog,
  issuesCatalog,
  deviceTypeNames,
  modelGroupNames,
  modelGroupsByBrand,
  savingId,
  deletingId,
  onPatchRow,
  onPatchScope,
  onSaveRow,
  onDeleteRow,
}: {
  rows: RepairRuleRow[];
  loading: boolean;
  deviceTypes: RepairDeviceType[];
  brandsCatalog: RepairBrandCatalogItem[];
  modelsCatalog: RepairModelCatalogItem[];
  issuesCatalog: RepairIssueCatalogItem[];
  deviceTypeNames: Record<string, string>;
  modelGroupNames: Record<string, string>;
  modelGroupsByBrand: Record<string, RepairModelGroupItem[]>;
  savingId: string | null;
  deletingId: string | null;
  onPatchRow: (id: string, patch: Partial<RepairRuleRow>) => void;
  onPatchScope: (id: string, patch: Partial<RepairRuleRow>) => void;
  onSaveRow: (row: RepairRuleRow) => void;
  onDeleteRow: (id: string) => void;
}) {
  return (
    <section className="card">
      <div className="card-body p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            <div className="grid grid-cols-[0.55fr_1fr_1.8fr_0.85fr_0.85fr_0.85fr_0.85fr_0.7fr_0.7fr_0.8fr_0.7fr_0.7fr_0.7fr_1.15fr] gap-3 border-b border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-black uppercase tracking-wide text-zinc-500">
              <div>Activo</div>
              <div>Nombre</div>
              <div>Scope</div>
              <div>Marca</div>
              <div>Modelo</div>
              <div>Reparacion</div>
              <div>Modo</div>
              <div>Base</div>
              <div>%</div>
              <div>Min gan.</div>
              <div>Min</div>
              <div>Envio</div>
              <div>Prioridad</div>
              <div>Acciones</div>
            </div>

            {loading ? <div className="p-4 text-sm text-zinc-600">Cargando reglas...</div> : null}
            {!loading && rows.length === 0 ? <div className="p-4 text-sm text-zinc-600">Sin reglas cargadas.</div> : null}

            {rows.map((row) => (
              <RepairPricingRuleRowCard
                key={row.id}
                row={row}
                deviceTypes={deviceTypes}
                brandsCatalog={brandsCatalog}
                modelsCatalog={modelsCatalog}
                issuesCatalog={issuesCatalog}
                deviceTypeNames={deviceTypeNames}
                modelGroupNames={modelGroupNames}
                modelGroupsByBrand={modelGroupsByBrand}
                saving={savingId === row.id}
                deleting={deletingId === row.id}
                onPatchRow={onPatchRow}
                onPatchScope={onPatchScope}
                onSave={onSaveRow}
                onDelete={onDeleteRow}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
