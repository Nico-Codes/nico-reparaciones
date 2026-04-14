import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import type { GroupRow, ModelGroupOption, ModelRow } from './admin-model-groups.helpers';

export function AdminModelGroupsHero() {
  return (
    <section className="store-hero">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Grupos de modelos</h1>
          <p className="mt-1 text-sm text-zinc-600">Sirve para separar PS4 vs PS5, Samsung Serie A vs Serie S, etc.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/calculos/reparaciones" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Hub reparaciones
          </Link>
          <Link to="/admin/precios" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Precios
          </Link>
        </div>
      </div>
    </section>
  );
}

export function AdminModelGroupsAlerts({ error, success }: { error: string; success: string }) {
  return (
    <>
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</div> : null}
    </>
  );
}

export function AdminModelGroupsFilters({
  deviceType,
  brand,
  loadingFilters,
  loadingBrands,
  deviceTypeOptions,
  brandOptions,
  onDeviceTypeChange,
  onBrandChange,
  onReload,
}: {
  deviceType: string;
  brand: string;
  loadingFilters: boolean;
  loadingBrands: boolean;
  deviceTypeOptions: ModelGroupOption[];
  brandOptions: ModelGroupOption[];
  onDeviceTypeChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onReload: () => void;
}) {
  return (
    <section className="card">
      <div className="card-head flex items-center justify-between gap-2">
        <div>
          <div className="text-xl font-black tracking-tight text-zinc-900">Filtro de catálogo</div>
          <p className="mt-1 text-sm text-zinc-500">Elegí tipo y marca para crear o editar grupos.</p>
        </div>
      </div>
      <div className="card-body">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-zinc-800">Tipo dispositivo</label>
            <CustomSelect
              value={deviceType}
              onChange={onDeviceTypeChange}
              disabled={loadingFilters}
              options={deviceTypeOptions}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar tipo de dispositivo"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-zinc-800">Marca</label>
            <CustomSelect
              value={brand}
              onChange={onBrandChange}
              disabled={loadingFilters || loadingBrands}
              options={brandOptions}
              triggerClassName="min-h-11 rounded-2xl font-bold"
              ariaLabel="Seleccionar marca"
            />
          </div>
          <button
            type="button"
            onClick={onReload}
            disabled={loadingBrands}
            className="btn-outline !h-11 !rounded-2xl px-5 text-sm font-bold disabled:opacity-60"
          >
            Filtrar
          </button>
        </div>
      </div>
    </section>
  );
}

export function AdminModelGroupsEmptyState() {
  return (
    <section className="card">
      <div className="card-body py-8 text-sm text-zinc-600">Elegí un tipo y una marca para administrar grupos y asignar modelos.</div>
    </section>
  );
}

export function AdminModelGroupsContent({
  groups,
  models,
  groupOptions,
  newGroupName,
  newGroupActive,
  loadingBrandData,
  creatingGroup,
  savingGroupId,
  assigningModelId,
  onNewGroupNameChange,
  onNewGroupActiveChange,
  onCreateGroup,
  onPatchGroup,
  onSaveGroup,
  onAssignModel,
}: {
  groups: GroupRow[];
  models: ModelRow[];
  groupOptions: ModelGroupOption[];
  newGroupName: string;
  newGroupActive: boolean;
  loadingBrandData: boolean;
  creatingGroup: boolean;
  savingGroupId: string | null;
  assigningModelId: string | null;
  onNewGroupNameChange: (value: string) => void;
  onNewGroupActiveChange: (value: boolean) => void;
  onCreateGroup: () => void;
  onPatchGroup: (groupId: string, patch: Partial<GroupRow>) => void;
  onSaveGroup: (group: GroupRow) => void;
  onAssignModel: (modelId: string, groupId: string) => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="card">
        <div className="card-head">
          <div className="font-black">Crear grupo</div>
          <span className="badge-zinc">{loadingBrandData ? '--' : groups.length}</span>
        </div>
        <div className="card-body space-y-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-zinc-800">Nombre</label>
            <input
              value={newGroupName}
              onChange={(event) => onNewGroupNameChange(event.target.value)}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              placeholder="Ej: PS4 / PS5 / Serie A..."
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
            <input type="checkbox" checked={newGroupActive} onChange={(event) => onNewGroupActiveChange(event.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
            <span>Activo</span>
          </label>
          <button
            type="button"
            onClick={onCreateGroup}
            disabled={creatingGroup || !newGroupName.trim()}
            className="btn-primary !h-11 !w-full !rounded-2xl justify-center disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingGroup ? 'Creando...' : 'Crear'}
          </button>
        </div>

        <div className="card-body border-t border-zinc-100">
          <div className="mb-3 font-black">Grupos existentes</div>
          <div className="space-y-2">
            {loadingBrandData ? <div className="h-20 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50" /> : null}
            {!loadingBrandData && groups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-600">No hay grupos cargados para esta marca.</div>
            ) : null}
            {groups.map((group) => (
              <div key={group.id} className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                <div className="grid items-end gap-3 sm:grid-cols-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-black uppercase text-zinc-500">Nombre</label>
                    <input
                      className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm"
                      value={group.name}
                      onChange={(event) => onPatchGroup(group.id, { name: event.target.value })}
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
                    <input
                      className="h-4 w-4 rounded border-zinc-300"
                      type="checkbox"
                      checked={group.active}
                      onChange={(event) => onPatchGroup(group.id, { active: event.target.checked })}
                    />
                    <span>Activo</span>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => onSaveGroup(group)}
                  disabled={savingGroupId === group.id || !group.name.trim()}
                  className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingGroupId === group.id ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="font-black">Asignar modelos a grupos</div>
            <div className="text-xs text-zinc-500">Al cambiar el select, se guarda solo.</div>
          </div>
          <span className="badge-zinc">{loadingBrandData ? '--' : models.length}</span>
        </div>
        <div className="card-body">
          <div className="space-y-2">
            {loadingBrandData ? <div className="h-24 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50" /> : null}
            {!loadingBrandData && models.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-600">No hay modelos para esta marca.</div>
            ) : null}
            {models.map((model) => (
              <div key={model.id} className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-zinc-900">{model.name}</div>
                    <div className="text-xs text-zinc-500">ID: {model.id}</div>
                  </div>
                  <div className="w-full sm:w-56">
                    <label className="mb-1 block text-xs font-black uppercase text-zinc-500 sm:hidden">Grupo</label>
                    <CustomSelect
                      value={model.deviceModelGroupId ?? ''}
                      onChange={(value) => onAssignModel(model.id, value)}
                      options={groupOptions}
                      disabled={assigningModelId === model.id}
                      triggerClassName="min-h-11 rounded-xl font-bold"
                      ariaLabel="Seleccionar grupo"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
