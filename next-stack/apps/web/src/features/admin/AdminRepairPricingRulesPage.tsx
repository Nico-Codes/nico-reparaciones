import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
      setDeviceTypes(catalogTypes.items.filter((x) => x.active));
      setBrandsCatalog(catalogBrands.items.filter((x) => x.active));
      setModelsCatalog(catalogModels.items.filter((x) => x.active));
      setIssuesCatalog(catalogIssues.items.filter((x) => x.active));

      const { names: groupLookups, byBrand } = await loadModelGroupLookups(catalogBrands.items.filter((x) => x.active).map((b) => b.id));
      setDeviceTypeNames(Object.fromEntries(catalogTypes.items.map((t) => [t.id, t.name])));
      setModelGroupNames(groupLookups);
      setModelGroupsByBrand(byBrand);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando reglas');
    } finally {
      setLoading(false);
    }
  }

  async function loadModelGroupLookups(brandIds: string[]) {
    if (brandIds.length === 0) return { names: {} as Record<string, string>, byBrand: {} as Record<string, Array<{ id: string; name: string; slug: string; active: boolean }>> };
    const settled = await Promise.allSettled(brandIds.map((brandId) => adminApi.modelGroups(brandId)));
    const names: Record<string, string> = {};
    const byBrand: Record<string, Array<{ id: string; name: string; slug: string; active: boolean }>> = {};
    settled.forEach((res, idx) => {
      if (res.status !== 'fulfilled') return;
      const brandId = brandIds[idx];
      byBrand[brandId] = res.value.groups.filter((g) => g.active);
      for (const g of res.value.groups) names[g.id] = g.name;
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
          next.deviceIssueTypeId = next.deviceIssueTypeId && issuesCatalog.some((i) => i.id === next.deviceIssueTypeId && (!next.deviceTypeId || i.deviceTypeId === next.deviceTypeId))
            ? next.deviceIssueTypeId
            : null;
        }
        if ('deviceBrandId' in patch) {
          const brand = brandsCatalog.find((b) => b.id === next.deviceBrandId);
          next.deviceTypeId = brand?.deviceTypeId ?? next.deviceTypeId ?? null;
          next.deviceModelId = null;
          next.deviceModelGroupId = null;
          if (brand) next.brand = brand.name;
        }
        if ('deviceModelId' in patch) {
          const model = modelsCatalog.find((m) => m.id === next.deviceModelId);
          next.deviceModelGroupId = model?.deviceModelGroupId ?? null;
          if (model) next.model = model.name;
        }
        if ('deviceModelGroupId' in patch) {
          next.deviceModelId = null;
        }
        if ('deviceIssueTypeId' in patch) {
          const issue = issuesCatalog.find((i) => i.id === next.deviceIssueTypeId);
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

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Reglas de precios (auto)</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Configura cálculo automático por tipo, marca, grupo/modelo y falla con edición en línea.
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
                <div>Envio</div>
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
                  <InlineText value={row.name} onChange={(v) => patchRow(row.id, { name: v })} />
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
                  <InlineText value={row.brand} onChange={(v) => patchRow(row.id, { brand: v })} />
                  <InlineText value={row.model} onChange={(v) => patchRow(row.id, { model: v })} />
                  <InlineText value={row.repairType} onChange={(v) => patchRow(row.id, { repairType: v })} />
                  <select
                    value={row.calcMode}
                    onChange={(e) => patchRow(row.id, { calcMode: e.target.value as 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL' })}
                    className="h-10 w-full rounded-xl border border-zinc-200 px-2 text-xs"
                  >
                    <option value="BASE_PLUS_MARGIN">Base+%</option>
                    <option value="FIXED_TOTAL">Fijo</option>
                  </select>
                  <InlineText value={row.basePrice} onChange={(v) => patchRow(row.id, { basePrice: v })} />
                  <InlineText value={row.percent} onChange={(v) => patchRow(row.id, { percent: v })} />
                  <InlineText value={row.minProfit} onChange={(v) => patchRow(row.id, { minProfit: v })} />
                  <InlineText value={row.minFinalPrice} onChange={(v) => patchRow(row.id, { minFinalPrice: v })} />
                  <InlineText value={row.shippingFee} onChange={(v) => patchRow(row.id, { shippingFee: v })} />
                  <InlineText value={row.priority} onChange={(v) => patchRow(row.id, { priority: v })} />
                  <div className="flex items-center gap-2">
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

function InlineText({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-xl border border-zinc-200 px-2 text-sm"
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
  const filteredBrands = brandsCatalog.filter((b) => !row.deviceTypeId || b.deviceTypeId === row.deviceTypeId);
  const filteredModels = modelsCatalog.filter((m) => !row.deviceBrandId || m.brandId === row.deviceBrandId);
  const filteredIssues = issuesCatalog.filter((i) => !row.deviceTypeId || i.deviceTypeId === row.deviceTypeId);
  const groupOptions = row.deviceBrandId ? (modelGroupsByBrand[row.deviceBrandId] ?? []) : [];

  return (
    <div className="space-y-1.5">
      <select
        value={row.deviceTypeId ?? ''}
        onChange={(e) => onPatch(row.id, { deviceTypeId: e.target.value || null })}
        className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs"
        title="Tipo de dispositivo"
      >
        <option value="">Tipo: Global</option>
        {deviceTypes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <select
        value={row.deviceBrandId ?? ''}
        onChange={(e) => onPatch(row.id, { deviceBrandId: e.target.value || null })}
        className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs"
        title="Marca"
      >
        <option value="">Marca: Todas</option>
        {filteredBrands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <select
        value={row.deviceModelGroupId ?? ''}
        onChange={(e) => onPatch(row.id, { deviceModelGroupId: e.target.value || null })}
        className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs"
        title="Grupo de modelo"
        disabled={!row.deviceBrandId}
      >
        <option value="">{row.deviceBrandId ? 'Grupo: Todos' : 'Grupo: primero marca'}</option>
        {groupOptions.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <select
        value={row.deviceModelId ?? ''}
        onChange={(e) => onPatch(row.id, { deviceModelId: e.target.value || null })}
        className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs"
        title="Modelo"
      >
        <option value="">Modelo: Todos</option>
        {filteredModels
          .filter((m) => !row.deviceModelGroupId || m.deviceModelGroupId === row.deviceModelGroupId)
          .map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
          ))}
      </select>
      <select
        value={row.deviceIssueTypeId ?? ''}
        onChange={(e) => onPatch(row.id, { deviceIssueTypeId: e.target.value || null })}
        className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs"
        title="Falla / tipo de reparación"
      >
        <option value="">Falla: Todas</option>
        {filteredIssues.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name}
          </option>
        ))}
      </select>
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
