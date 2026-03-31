import { useEffect, useState } from 'react';
import { adminApi } from '@/features/admin/api';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { repairsApi } from '@/features/repairs/api';
import {
  applyRepairScopePatch,
  fromApiRepairRule,
  toRepairPricingRuleUpdateInput,
  type RepairBrandCatalogItem,
  type RepairDeviceType,
  type RepairIssueCatalogItem,
  type RepairModelCatalogItem,
  type RepairModelGroupItem,
  type RepairRuleRow,
} from './admin-repair-pricing-rules.helpers';
import { RepairPricingHeaderActions, RepairPricingRulesTableSection } from './admin-repair-pricing-rules.sections';

export function AdminRepairPricingRulesPage() {
  const [rows, setRows] = useState<RepairRuleRow[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<RepairDeviceType[]>([]);
  const [brandsCatalog, setBrandsCatalog] = useState<RepairBrandCatalogItem[]>([]);
  const [modelsCatalog, setModelsCatalog] = useState<RepairModelCatalogItem[]>([]);
  const [issuesCatalog, setIssuesCatalog] = useState<RepairIssueCatalogItem[]>([]);
  const [deviceTypeNames, setDeviceTypeNames] = useState<Record<string, string>>({});
  const [modelGroupNames, setModelGroupNames] = useState<Record<string, string>>({});
  const [modelGroupsByBrand, setModelGroupsByBrand] = useState<Record<string, RepairModelGroupItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [res, catalogTypes, catalogBrands, catalogModels, catalogIssues] = await Promise.all([
        repairsApi.pricingRulesList(),
        adminApi.deviceTypes().catch(() => ({ items: [] as RepairDeviceType[] })),
        deviceCatalogApi.brands().catch(() => ({ items: [] as RepairBrandCatalogItem[] })),
        deviceCatalogApi.models().catch(() => ({ items: [] as RepairModelCatalogItem[] })),
        deviceCatalogApi.issues().catch(() => ({ items: [] as RepairIssueCatalogItem[] })),
      ]);
      const activeTypes = catalogTypes.items.filter((item) => item.active);
      const activeBrands = catalogBrands.items.filter((item) => item.active);
      const activeModels = catalogModels.items.filter((item) => item.active);
      const activeIssues = catalogIssues.items.filter((item) => item.active);
      const { names: groupLookups, byBrand } = await loadModelGroupLookups(activeBrands.map((brand) => brand.id));

      setRows(res.items.map(fromApiRepairRule));
      setDeviceTypes(activeTypes);
      setBrandsCatalog(activeBrands);
      setModelsCatalog(activeModels);
      setIssuesCatalog(activeIssues);
      setDeviceTypeNames(Object.fromEntries(activeTypes.map((type) => [type.id, type.name])));
      setModelGroupNames(groupLookups);
      setModelGroupsByBrand(byBrand);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error cargando reglas');
    } finally {
      setLoading(false);
    }
  }

  async function loadModelGroupLookups(brandIds: string[]) {
    if (brandIds.length === 0) {
      return {
        names: {} as Record<string, string>,
        byBrand: {} as Record<string, RepairModelGroupItem[]>,
      };
    }

    const settled = await Promise.allSettled(brandIds.map((brandId) => adminApi.modelGroups(brandId)));
    const names: Record<string, string> = {};
    const byBrand: Record<string, RepairModelGroupItem[]> = {};

    settled.forEach((result, index) => {
      if (result.status !== 'fulfilled') return;
      const brandId = brandIds[index];
      byBrand[brandId] = result.value.groups.filter((group) => group.active);
      for (const group of result.value.groups) names[group.id] = group.name;
    });

    return { names, byBrand };
  }

  useEffect(() => {
    void load();
  }, []);

  function patchRow(id: string, patch: Partial<RepairRuleRow>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function patchScope(rowId: string, patch: Partial<RepairRuleRow>) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? applyRepairScopePatch(row, patch, { brandsCatalog, modelsCatalog, issuesCatalog }) : row,
      ),
    );
  }

  async function saveRow(row: RepairRuleRow) {
    setSavingId(row.id);
    setError('');
    setSuccess('');
    try {
      await repairsApi.pricingRulesUpdate(row.id, toRepairPricingRuleUpdateInput(row));
      setSuccess('Regla guardada.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la regla');
    } finally {
      setSavingId(null);
    }
  }

  async function deleteRow(id: string) {
    setDeletingId(id);
    setError('');
    setSuccess('');
    try {
      await repairsApi.pricingRulesDelete(id);
      setSuccess('Regla eliminada.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar la regla');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Reglas de precios (auto)</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Configura calculo automatico por tipo, marca, grupo/modelo y falla con edicion en linea.
            </p>
          </div>
          <RepairPricingHeaderActions />
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</div> : null}

      <RepairPricingRulesTableSection
        rows={rows}
        loading={loading}
        deviceTypes={deviceTypes}
        brandsCatalog={brandsCatalog}
        modelsCatalog={modelsCatalog}
        issuesCatalog={issuesCatalog}
        deviceTypeNames={deviceTypeNames}
        modelGroupNames={modelGroupNames}
        modelGroupsByBrand={modelGroupsByBrand}
        savingId={savingId}
        deletingId={deletingId}
        onPatchRow={patchRow}
        onPatchScope={patchScope}
        onSaveRow={(row) => void saveRow(row)}
        onDeleteRow={(id) => void deleteRow(id)}
      />
    </div>
  );
}
