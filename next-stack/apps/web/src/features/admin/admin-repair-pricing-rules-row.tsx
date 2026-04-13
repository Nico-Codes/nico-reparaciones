import { Link } from 'react-router-dom';
import {
  REPAIR_PRICING_CALC_MODE_OPTIONS,
  type RepairBrandCatalogItem,
  type RepairDeviceType,
  type RepairIssueCatalogItem,
  type RepairModelCatalogItem,
  type RepairModelGroupItem,
  type RepairPricingCalcMode,
  type RepairRuleRow,
} from './admin-repair-pricing-rules.helpers';
import { InlineText, ScopeEditorCell, TinySelect } from './admin-repair-pricing-rules.controls';

export function RepairPricingRuleRowCard({
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
