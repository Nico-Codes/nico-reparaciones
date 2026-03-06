import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import { adminApi } from '@/features/admin/api';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { repairsApi } from '@/features/repairs/api';

type RepairRuleRow = {
  id: string;
  name: string;
  active: boolean;
  brand: string;
  model: string;
  repairType: string;
  basePrice: string;
  percent: string;
  minProfit: string;
  calcMode: 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL';
  minFinalPrice: string;
  shippingFee: string;
  priority: string;
  notes: string;
  deviceTypeId?: string | null;
  deviceBrandId?: string | null;
  deviceModelGroupId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
};

function fromApi(row: any): RepairRuleRow {
  return {
    id: row.id,
    name: row.name ?? '',
    active: Boolean(row.active),
    brand: row.deviceBrand ?? '',
    model: row.deviceModel ?? '',
    repairType: row.issueLabel ?? '',
    basePrice: String(row.basePrice ?? 0),
    percent: String(row.profitPercent ?? 0),
    minProfit: row.minProfit != null ? String(row.minProfit) : '',
    calcMode: row.calcMode === 'FIXED_TOTAL' ? 'FIXED_TOTAL' : 'BASE_PLUS_MARGIN',
    minFinalPrice: row.minFinalPrice != null ? String(row.minFinalPrice) : '',
    shippingFee: row.shippingFee != null ? String(row.shippingFee) : '',
    priority: String(row.priority ?? 0),
    notes: row.notes ?? '',
    deviceTypeId: row.deviceTypeId ?? null,
    deviceBrandId: row.deviceBrandId ?? null,
    deviceModelGroupId: row.deviceModelGroupId ?? null,
    deviceModelId: row.deviceModelId ?? null,
    deviceIssueTypeId: row.deviceIssueTypeId ?? null,
  };
}

export function AdminRepairPricingRulesPage() {
  const [rows, setRows] = useState<RepairRuleRow[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<Array<{ id: string; name: string; slug: string; active: boolean }>>([]);
  const [brandsCatalog, setBrandsCatalog] = useState<Array<{ id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean }>>([]);
  const [modelsCatalog, setModelsCatalog] = useState<Array<{ id: string; brandId: string; deviceModelGroupId?: string | null; name: string; slug: string; active: boolean; brand: { id: string; name: string; slug: string } }>>([]);
  const [issuesCatalog, setIssuesCatalog] = useState<Array<{ id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean }>>([]);
  const [deviceTypeNames, setDeviceTypeNames] = useState<Record<string, string>>({});
  const [modelGroupNames, setModelGroupNames] = useState<Record<string, string>>({});
  const [modelGroupsByBrand, setModelGroupsByBrand] = useState<Record<string, Array<{ id: string; name: string; slug: string; active: boolean }>>>({});
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
        adminApi.deviceTypes().catch(() => ({ items: [] as Array<{ id: string; name: string; slug: string; active: boolean }> })),
        deviceCatalogApi.brands().catch(() => ({ items: [] as Array<{ id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean }> })),
        deviceCatalogApi.models().catch(() => ({ items: [] as Array<{ id: string; brandId: string; deviceModelGroupId?: string | null; name: string; slug: string; active: boolean; brand: { id: string; name: string; slug: string } }> })),
        deviceCatalogApi.issues().catch(() => ({ items: [] as Array<{ id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean }> })),
      ]);
      const nextRows = res.items.map(fromApi);
      setRows(nextRows);
      setDeviceTypes(catalogTypes.items.filter((item) => item.active));
      setBrandsCatalog(catalogBrands.items.filter((item) => item.active));
      setModelsCatalog(catalogModels.items.filter((item) => item.active));
      setIssuesCatalog(catalogIssues.items.filter((item) => item.active));

      const { names: groupLookups, byBrand } = await loadModelGroupLookups(catalogBrands.items.filter((item) => item.active).map((brand) => brand.id));
      setDeviceTypeNames(Object.fromEntries(catalogTypes.items.map((type) => [type.id, type.name])));
      setModelGroupNames(groupLookups);
      setModelGroupsByBrand(byBrand);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando reglas');
    } finally {
      setLoading(false);
    }
  }

  async function loadModelGroupLookups(brandIds: string[]) {
    if (brandIds.length === 0) {
      return {
        names: {} as Record<string, string>,
        byBrand: {} as Record<string, Array<{ id: string; name: string; slug: string; active: boolean }>>,
      };
    }
    const settled = await Promise.allSettled(brandIds.map((brandId) => adminApi.modelGroups(brandId)));
    const names: Record<string, string> = {};
    const byBrand: Record<string, Array<{ id: string; name: string; slug: string; active: boolean }>> = {};
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
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const next = { ...row, ...patch };
        if ('deviceTypeId' in patch) {
          next.deviceBrandId = null;
          next.deviceModelId = null;
          next.deviceModelGroupId = null;
          next.deviceIssueTypeId =
            next.deviceIssueTypeId &&
            issuesCatalog.some((issue) => issue.id === next.deviceIssueTypeId && (!next.deviceTypeId || issue.deviceTypeId === next.deviceTypeId))
              ? next.deviceIssueTypeId
              : null;
        }
        if ('deviceBrandId' in patch) {
          const brand = brandsCatalog.find((item) => item.id === next.deviceBrandId);
          next.deviceTypeId = brand?.deviceTypeId ?? next.deviceTypeId ?? null;
          next.deviceModelId = null;
          next.deviceModelGroupId = null;
          if (brand) next.brand = brand.name;
        }
        if ('deviceModelId' in patch) {
          const model = modelsCatalog.find((item) => item.id === next.deviceModelId);
          next.deviceModelGroupId = model?.deviceModelGroupId ?? null;
          if (model) next.model = model.name;
        }
        if ('deviceModelGroupId' in patch) {
          next.deviceModelId = null;
        }
        if ('deviceIssueTypeId' in patch) {
          const issue = issuesCatalog.find((item) => item.id === next.deviceIssueTypeId);
          if (issue) next.repairType = issue.name;
        }
        return next;
      }),
    );
  }

  async function saveRow(row: RepairRuleRow) {
    setSavingId(row.id);
    setError('');
    setSuccess('');
    try {
      await repairsApi.pricingRulesUpdate(row.id, {
        name: row.name.trim(),
        active: row.active,
        priority: Number(row.priority || 0),
        deviceTypeId: row.deviceTypeId ?? null,
        deviceBrandId: row.deviceBrandId ?? null,
        deviceModelGroupId: row.deviceModelGroupId ?? null,
        deviceModelId: row.deviceModelId ?? null,
        deviceIssueTypeId: row.deviceIssueTypeId ?? null,
        deviceBrand: row.brand.trim() || null,
        deviceModel: row.model.trim() || null,
        issueLabel: row.repairType.trim() || null,
        basePrice: Number(row.basePrice || 0),
        profitPercent: Number(row.percent || 0),
        minProfit: row.minProfit ? Number(row.minProfit) : null,
        calcMode: row.calcMode,
        minFinalPrice: row.minFinalPrice ? Number(row.minFinalPrice) : null,
        shippingFee: row.shippingFee ? Number(row.shippingFee) : null,
        notes: row.notes.trim() || null,
      });
      setSuccess('Regla guardada.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la regla');
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la regla');
    } finally {
      setDeletingId(null);
    }
  }

  const calcModeOptions = useMemo(
    () => [
      { value: 'BASE_PLUS_MARGIN', label: 'Base + %' },
      { value: 'FIXED_TOTAL', label: 'Fijo' },
    ],
    [],
  );

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Reglas de precios (auto)</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Configurá cálculo automático por tipo, marca, grupo/modelo y falla con edición en línea.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/tiposdispositivo" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">Dispositivos</Link>
            <Link to="/admin/catalogodispositivos" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">Catálogo</Link>
            <Link to="/admin/gruposmodelos" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">Grupos</Link>
            <Link to="/admin/tiposreparacion" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">Tipos</Link>
            <Link to="/admin/precios/crear" className="btn-primary !h-10 !rounded-xl px-4 text-sm font-bold">
              + Nueva regla
            </Link>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</div> : null}

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
                <div>Reparación</div>
                <div>Modo</div>
                <div>Base</div>
                <div>%</div>
                <div>Min gan.</div>
                <div>Min</div>
                <div>Envío</div>
                <div>Prioridad</div>
                <div>Acciones</div>
              </div>

              {loading ? <div className="p-4 text-sm text-zinc-600">Cargando reglas...</div> : null}
              {!loading && rows.length === 0 ? <div className="p-4 text-sm text-zinc-600">Sin reglas cargadas.</div> : null}

              {rows.map((row) => (
                <div key={row.id} className="grid grid-cols-[0.55fr_1fr_1.8fr_0.85fr_0.85fr_0.85fr_0.85fr_0.7fr_0.7fr_0.8fr_0.7fr_0.7fr_0.7fr_1.15fr] gap-3 border-b border-zinc-100 px-4 py-3 text-sm">
                  <div className="flex items-center">
                    <input type="checkbox" checked={row.active} onChange={(e) => patchRow(row.id, { active: e.target.checked })} className="h-4 w-4" />
                  </div>
                  <InlineText value={row.name} onChange={(value) => patchRow(row.id, { name: value })} />
                  <ScopeEditorCell
                    row={row}
                    deviceTypes={deviceTypes}
                    brandsCatalog={brandsCatalog}
                    modelsCatalog={modelsCatalog}
                    issuesCatalog={issuesCatalog}
                    deviceTypeNames={deviceTypeNames}
                    modelGroupNames={modelGroupNames}
                    modelGroupsByBrand={modelGroupsByBrand}
                    onPatch={patchScope}
                  />
                  <InlineText value={row.brand} onChange={(value) => patchRow(row.id, { brand: value })} />
                  <InlineText value={row.model} onChange={(value) => patchRow(row.id, { model: value })} />
                  <InlineText value={row.repairType} onChange={(value) => patchRow(row.id, { repairType: value })} />
                  <TinySelect
                    value={row.calcMode}
                    onChange={(value) => patchRow(row.id, { calcMode: value as 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL' })}
                    options={calcModeOptions}
                    ariaLabel="Seleccionar modo de cálculo"
                  />
                  <InlineText value={row.basePrice} onChange={(value) => patchRow(row.id, { basePrice: value })} />
                  <InlineText value={row.percent} onChange={(value) => patchRow(row.id, { percent: value })} />
                  <InlineText value={row.minProfit} onChange={(value) => patchRow(row.id, { minProfit: value })} />
                  <InlineText value={row.minFinalPrice} onChange={(value) => patchRow(row.id, { minFinalPrice: value })} />
                  <InlineText value={row.shippingFee} onChange={(value) => patchRow(row.id, { shippingFee: value })} />
                  <InlineText value={row.priority} onChange={(value) => patchRow(row.id, { priority: value })} />
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/precios/${encodeURIComponent(row.id)}/editar`}
                      className="btn-outline !h-8 !rounded-xl px-3 text-sm font-bold"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => void saveRow(row)}
                      disabled={savingId === row.id || deletingId === row.id}
                      className="btn-outline !h-8 !rounded-xl px-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingId === row.id ? '...' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteRow(row.id)}
                      disabled={savingId === row.id || deletingId === row.id}
                      className="inline-flex h-8 items-center rounded-xl border border-rose-200 bg-white px-3 text-sm font-bold text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === row.id ? '...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InlineText({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
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
  deviceTypes: Array<{ id: string; name: string; slug: string; active: boolean }>;
  brandsCatalog: Array<{ id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean }>;
  modelsCatalog: Array<{ id: string; brandId: string; deviceModelGroupId?: string | null; name: string; slug: string; active: boolean; brand: { id: string; name: string; slug: string } }>;
  issuesCatalog: Array<{ id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean }>;
  deviceTypeNames: Record<string, string>;
  modelGroupNames: Record<string, string>;
  modelGroupsByBrand: Record<string, Array<{ id: string; name: string; slug: string; active: boolean }>>;
  onPatch: (rowId: string, patch: Partial<RepairRuleRow>) => void;
}) {
  const filteredBrands = brandsCatalog.filter((brand) => !row.deviceTypeId || brand.deviceTypeId === row.deviceTypeId);
  const filteredModels = modelsCatalog.filter((model) => !row.deviceBrandId || model.brandId === row.deviceBrandId);
  const filteredIssues = issuesCatalog.filter((issue) => !row.deviceTypeId || issue.deviceTypeId === row.deviceTypeId);
  const groupOptions = row.deviceBrandId ? (modelGroupsByBrand[row.deviceBrandId] ?? []) : [];

  const typeOptions = [{ value: '', label: 'Tipo: Global' }, ...deviceTypes.map((type) => ({ value: type.id, label: type.name }))];
  const brandOptions = [{ value: '', label: 'Marca: Todas' }, ...filteredBrands.map((brand) => ({ value: brand.id, label: brand.name }))];
  const groupSelectOptions = [{ value: '', label: row.deviceBrandId ? 'Grupo: Todos' : 'Grupo: primero marca' }, ...groupOptions.map((group) => ({ value: group.id, label: group.name }))];
  const modelOptions = [{ value: '', label: 'Modelo: Todos' }, ...filteredModels.filter((model) => !row.deviceModelGroupId || model.deviceModelGroupId === row.deviceModelGroupId).map((model) => ({ value: model.id, label: model.name }))];
  const issueOptions = [{ value: '', label: 'Falla: Todas' }, ...filteredIssues.map((issue) => ({ value: issue.id, label: issue.name }))];

  return (
    <div className="space-y-1.5">
      <TinySelect
        value={row.deviceTypeId ?? ''}
        onChange={(value) => onPatch(row.id, { deviceTypeId: value || null })}
        options={typeOptions}
        ariaLabel="Seleccionar tipo de dispositivo"
      />
      <TinySelect
        value={row.deviceBrandId ?? ''}
        onChange={(value) => onPatch(row.id, { deviceBrandId: value || null })}
        options={brandOptions}
        ariaLabel="Seleccionar marca"
      />
      <TinySelect
        value={row.deviceModelGroupId ?? ''}
        onChange={(value) => onPatch(row.id, { deviceModelGroupId: value || null })}
        options={groupSelectOptions}
        ariaLabel="Seleccionar grupo de modelo"
        disabled={!row.deviceBrandId}
      />
      <TinySelect
        value={row.deviceModelId ?? ''}
        onChange={(value) => onPatch(row.id, { deviceModelId: value || null })}
        options={modelOptions}
        ariaLabel="Seleccionar modelo"
      />
      <TinySelect
        value={row.deviceIssueTypeId ?? ''}
        onChange={(value) => onPatch(row.id, { deviceIssueTypeId: value || null })}
        options={issueOptions}
        ariaLabel="Seleccionar falla"
      />
      <div className="space-y-1">
        <ScopePill label="Tipo" value={row.deviceTypeId ? (deviceTypeNames[row.deviceTypeId] ?? row.deviceTypeId) : 'Global'} />
        <ScopePill label="Grupo" value={row.deviceModelGroupId ? (modelGroupNames[row.deviceModelGroupId] ?? row.deviceModelGroupId) : 'Todos'} />
      </div>
    </div>
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
