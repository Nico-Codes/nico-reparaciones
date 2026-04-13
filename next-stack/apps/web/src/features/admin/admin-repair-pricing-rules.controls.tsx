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
  type RepairBrandCatalogItem,
  type RepairDeviceType,
  type RepairIssueCatalogItem,
  type RepairModelCatalogItem,
  type RepairModelGroupItem,
  type RepairRuleRow,
} from './admin-repair-pricing-rules.helpers';

export function InlineText({
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

export function TinySelect({
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

export function ScopeEditorCell({
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
