import { Link } from 'react-router-dom';
import type {
  RepairBrandCatalogItem,
  RepairDeviceType,
  RepairIssueCatalogItem,
  RepairModelCatalogItem,
  RepairModelGroupItem,
  RepairRuleRow,
} from './admin-repair-pricing-rules.helpers';
import { RepairPricingRuleRowCard } from './admin-repair-pricing-rules-row';

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
