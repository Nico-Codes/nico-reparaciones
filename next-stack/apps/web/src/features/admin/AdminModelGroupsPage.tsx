import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { adminApi } from './api';

type DeviceTypeOpt = { id: string; name: string; slug: string; active: boolean };
type BrandOpt = { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean };
type GroupRow = { id: string; name: string; slug: string; active: boolean };
type ModelRow = { id: string; name: string; slug: string; active: boolean; deviceModelGroupId: string | null };

export function AdminModelGroupsPage() {
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeOpt[]>([]);
  const [brands, setBrands] = useState<BrandOpt[]>([]);
  const [deviceType, setDeviceType] = useState('');
  const [brand, setBrand] = useState('');
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [models, setModels] = useState<ModelRow[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupActive, setNewGroupActive] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingBrandData, setLoadingBrandData] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null);
  const [assigningModelId, setAssigningModelId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadFilters() {
      setLoadingFilters(true);
      setError('');
      try {
        const typesRes = await adminApi.deviceTypes();
        if (!mounted) return;
        setDeviceTypes(typesRes.items.filter((item) => item.active));
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Error cargando catálogo');
      } finally {
        if (mounted) setLoadingFilters(false);
      }
    }
    void loadFilters();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadBrands() {
      setLoadingBrands(true);
      setError('');
      try {
        const brandsRes = await deviceCatalogApi.brands(deviceType || undefined);
        if (!mounted) return;
        const activeBrands = brandsRes.items.filter((item) => item.active);
        setBrands(activeBrands);
        setBrand((prev) => {
          if (!prev) return prev;
          return activeBrands.some((brandItem) => brandItem.id === prev) ? prev : '';
        });
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Error cargando marcas');
        setBrands([]);
        setBrand('');
      } finally {
        if (mounted) setLoadingBrands(false);
      }
    }
    void loadBrands();
    return () => {
      mounted = false;
    };
  }, [deviceType]);

  async function loadBrandData(brandId: string) {
    if (!brandId) {
      setGroups([]);
      setModels([]);
      return;
    }
    setLoadingBrandData(true);
    setError('');
    try {
      const res = await adminApi.modelGroups(brandId);
      setGroups(res.groups);
      setModels(res.models);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando grupos/modelos');
    } finally {
      setLoadingBrandData(false);
    }
  }

  useEffect(() => {
    void loadBrandData(brand);
  }, [brand]);

  const deviceTypeOptions = [{ value: '', label: 'Elegí...' }, ...deviceTypes.map((type) => ({ value: type.id, label: type.name }))];
  const brandOptions = [{ value: '', label: 'Elegí...' }, ...brands.map((brandItem) => ({ value: brandItem.id, label: brandItem.name }))];
  const groupOptions = [{ value: '', label: '- sin grupo -' }, ...groups.map((group) => ({ value: group.id, label: group.name }))];

  async function createGroup() {
    if (!brand || !newGroupName.trim()) return;
    setCreatingGroup(true);
    setError('');
    setSuccess('');
    try {
      await adminApi.createModelGroup({ deviceBrandId: brand, name: newGroupName.trim(), active: newGroupActive });
      setNewGroupName('');
      setNewGroupActive(true);
      setSuccess('Grupo creado.');
      await loadBrandData(brand);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el grupo');
    } finally {
      setCreatingGroup(false);
    }
  }

  function patchGroupLocal(id: string, patch: Partial<GroupRow>) {
    setGroups((prev) => prev.map((group) => (group.id === id ? { ...group, ...patch } : group)));
  }

  async function saveGroup(group: GroupRow) {
    setSavingGroupId(group.id);
    setError('');
    setSuccess('');
    try {
      await adminApi.updateModelGroup(group.id, { deviceBrandId: brand, name: group.name.trim(), active: group.active });
      setSuccess('Grupo actualizado.');
      await loadBrandData(brand);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el grupo');
    } finally {
      setSavingGroupId(null);
    }
  }

  async function assignModel(modelId: string, deviceModelGroupId: string) {
    setAssigningModelId(modelId);
    setError('');
    setSuccess('');
    try {
      await adminApi.assignModelGroup(modelId, { deviceBrandId: brand, deviceModelGroupId: deviceModelGroupId || null });
      setModels((prev) => prev.map((model) => (model.id === modelId ? { ...model, deviceModelGroupId: deviceModelGroupId || null } : model)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo asignar el modelo');
    } finally {
      setAssigningModelId(null);
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Grupos de modelos</h1>
            <p className="mt-1 text-sm text-zinc-600">Sirve para separar PS4 vs PS5, Samsung Serie A vs Serie S, etc.</p>
          </div>
          <Link to="/admin/precios" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Precios
          </Link>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</div> : null}

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
                onChange={setDeviceType}
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
                onChange={setBrand}
                disabled={loadingFilters || loadingBrands}
                options={brandOptions}
                triggerClassName="min-h-11 rounded-2xl font-bold"
                ariaLabel="Seleccionar marca"
              />
            </div>
            <button
              type="button"
              onClick={() => void loadBrandData(brand)}
              disabled={loadingBrands}
              className="btn-outline !h-11 !rounded-2xl px-5 text-sm font-bold disabled:opacity-60"
            >
              Filtrar
            </button>
          </div>
        </div>
      </section>

      {!brand ? (
        <section className="card">
          <div className="card-body py-8 text-sm text-zinc-600">
            Elegí un tipo y una marca para administrar grupos y asignar modelos.
          </div>
        </section>
      ) : (
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
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
                  placeholder="Ej: PS4 / PS5 / Serie A..."
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
                <input type="checkbox" checked={newGroupActive} onChange={(e) => setNewGroupActive(e.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
                <span>Activo</span>
              </label>
              <button
                type="button"
                onClick={() => void createGroup()}
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
                          onChange={(e) => patchGroupLocal(group.id, { name: e.target.value })}
                        />
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
                        <input
                          className="h-4 w-4 rounded border-zinc-300"
                          type="checkbox"
                          checked={group.active}
                          onChange={(e) => patchGroupLocal(group.id, { active: e.target.checked })}
                        />
                        <span>Activo</span>
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => void saveGroup(group)}
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
                          onChange={(value) => void assignModel(model.id, value)}
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
      )}
    </div>
  );
}
