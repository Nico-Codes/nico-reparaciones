import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { adminApi } from './api';

type DeviceTypeItem = { id: string; name: string; slug: string; active: boolean };
type BrandItem = { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean };
type ModelItem = {
  id: string;
  brandId: string;
  name: string;
  slug: string;
  active: boolean;
  brand: { id: string; name: string; slug: string };
};
type IssueItem = { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean };

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function AdminDevicesCatalogPage() {
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeItem[]>([]);
  const [deviceType, setDeviceType] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [error, setError] = useState('');

  const [brandDraft, setBrandDraft] = useState('');
  const [modelDraft, setModelDraft] = useState('');
  const [issueDraft, setIssueDraft] = useState('');

  async function loadDeviceTypes() {
    const res = await adminApi.deviceTypes();
    setDeviceTypes(res.items.filter((t) => t.active));
    setDeviceType((prev) => prev || res.items.find((t) => t.active)?.id || '');
  }

  async function loadBrandsAndIssues(typeId?: string) {
    const [b, i] = await Promise.all([deviceCatalogApi.brands(typeId), deviceCatalogApi.issues(typeId)]);
    setBrands(b.items);
    setIssues(i.items);
  }

  async function loadModels(brandId?: string) {
    const res = await deviceCatalogApi.models(brandId || undefined);
    setModels(res.items);
  }

  async function refreshAll() {
    setError('');
    try {
      await loadDeviceTypes();
      await loadBrandsAndIssues(deviceType || undefined);
      await loadModels(selectedBrandId || undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando catálogo');
    }
  }

  useEffect(() => {
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadBrandsAndIssues(deviceType || undefined).catch((e) =>
      setError(e instanceof Error ? e.message : 'Error cargando marcas/fallas'),
    );
  }, [deviceType]);

  useEffect(() => {
    void loadModels(selectedBrandId || undefined).catch((e) =>
      setError(e instanceof Error ? e.message : 'Error cargando modelos'),
    );
  }, [selectedBrandId]);

  const activeBrands = useMemo(() => brands.filter((b) => b.active), [brands]);
  const filteredModels = useMemo(
    () => (selectedBrandId ? models.filter((m) => m.brandId === selectedBrandId) : models),
    [models, selectedBrandId],
  );

  async function handleCreateBrand() {
    if (!brandDraft.trim() || !deviceType) return;
    await deviceCatalogApi.createBrand({ deviceTypeId: deviceType, name: brandDraft.trim(), slug: slugify(brandDraft), active: true });
    setBrandDraft('');
    await refreshAll();
  }

  async function handleCreateModel() {
    if (!selectedBrandId || !modelDraft.trim()) return;
    await deviceCatalogApi.createModel({ brandId: selectedBrandId, name: modelDraft.trim(), slug: slugify(modelDraft) });
    setModelDraft('');
    await refreshAll();
  }

  async function handleCreateIssue() {
    if (!issueDraft.trim() || !deviceType) return;
    await deviceCatalogApi.createIssue({ deviceTypeId: deviceType, name: issueDraft.trim(), slug: slugify(issueDraft), active: true });
    setIssueDraft('');
    await refreshAll();
  }

  async function renameBrand(item: BrandItem) {
    const next = window.prompt('Nuevo nombre de marca', item.name)?.trim();
    if (!next || next === item.name) return;
    await deviceCatalogApi.updateBrand(item.id, { name: next, slug: slugify(next) });
    await refreshAll();
  }

  async function toggleBrand(item: BrandItem) {
    await deviceCatalogApi.updateBrand(item.id, { active: !item.active });
    await refreshAll();
  }

  async function renameModel(item: ModelItem) {
    const next = window.prompt('Nuevo nombre de modelo', item.name)?.trim();
    if (!next || next === item.name) return;
    await deviceCatalogApi.updateModel(item.id, { name: next, slug: slugify(next) });
    await refreshAll();
  }

  async function toggleModel(item: ModelItem) {
    await deviceCatalogApi.updateModel(item.id, { active: !item.active });
    await refreshAll();
  }

  async function renameIssue(item: IssueItem) {
    const next = window.prompt('Nuevo nombre de falla', item.name)?.trim();
    if (!next || next === item.name) return;
    await deviceCatalogApi.updateIssue(item.id, { name: next, slug: slugify(next) });
    await refreshAll();
  }

  async function toggleIssue(item: IssueItem) {
    await deviceCatalogApi.updateIssue(item.id, { active: !item.active });
    await refreshAll();
  }

  return (
    <div className="store-shell space-y-6">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Catálogo de dispositivos</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Gestiona marcas, modelos y fallas por tipo. En lugar de borrar, desactiva.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/tiposreparacion" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Tipos
            </Link>
            <Link to="/admin/precios" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Precios
            </Link>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

      <section className="card">
        <div className="card-head">
          <div className="text-xl font-black tracking-tight text-zinc-900">Filtro de catálogo</div>
          <p className="mt-1 text-sm text-zinc-500">Selecciona tipo y marca para administrar cada bloque.</p>
        </div>
        <div className="card-body space-y-3">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-zinc-800">Tipo</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              >
                <option value="">Elegí...</option>
                {deviceTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-zinc-800">Marca (para modelos)</label>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              >
                <option value="">{activeBrands[0]?.name ?? 'Motorola'}</option>
                {activeBrands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-2 text-xs text-zinc-500 lg:grid-cols-3">
            <p>Esto filtra marcas y fallas.</p>
            <p>Esto filtra modelos.</p>
            <p className="lg:text-right">Tip: en "Nueva reparación" solo se muestran ítems activos.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="card">
          <div className="card-head flex items-center justify-between gap-2">
            <div className="text-2xl font-black tracking-tight text-zinc-900">Marcas</div>
            <span className="badge-zinc">{brands.length}</span>
          </div>
          <div className="card-body space-y-3">
            <div className="flex gap-2">
              <input
                value={brandDraft}
                onChange={(e) => setBrandDraft(e.target.value)}
                placeholder="Ej: Samsung"
                className="h-11 flex-1 rounded-2xl border border-zinc-200 px-3 text-sm"
              />
              <button type="button" className="btn-primary !h-11 !rounded-2xl px-4 text-sm font-bold" onClick={() => void handleCreateBrand()}>
                Agregar
              </button>
            </div>

            <div className="rounded-2xl border border-zinc-200">
              <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-zinc-100 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500">
                <div>Nombre</div>
                <div>Estado</div>
              </div>
              <div className="max-h-44 overflow-auto">
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    className="grid grid-cols-[1fr_auto] gap-3 border-b border-zinc-100 px-3 py-2.5 text-sm last:border-b-0"
                  >
                    <div>
                      <div className="font-bold text-zinc-900">{brand.name}</div>
                      <button type="button" className="mt-1 text-xs font-semibold text-sky-700" onClick={() => void renameBrand(brand)}>
                        Renombrar
                      </button>
                      <button type="button" className="mt-1 ml-3 text-xs font-semibold text-zinc-700" onClick={() => void toggleBrand(brand)}>
                        {brand.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                    <span className={brand.active ? 'badge-emerald self-center' : 'badge-zinc self-center'}>
                      {brand.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-head flex items-center justify-between gap-2">
            <div className="text-2xl font-black tracking-tight text-zinc-900">Modelos</div>
            <span className="badge-zinc">{filteredModels.length}</span>
          </div>
          <div className="card-body space-y-3">
            <div className="flex gap-2">
              <input
                value={modelDraft}
                onChange={(e) => setModelDraft(e.target.value)}
                placeholder="Ej: A52 / iPhone 12"
                className="h-11 flex-1 rounded-2xl border border-zinc-200 px-3 text-sm"
                disabled={!selectedBrandId}
              />
              <button
                type="button"
                className="btn-primary !h-11 !rounded-2xl px-4 text-sm font-bold"
                disabled={!selectedBrandId}
                onClick={() => void handleCreateModel()}
              >
                Agregar
              </button>
            </div>

            <div className="rounded-2xl border border-zinc-200">
              <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-zinc-100 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500">
                <div>Nombre</div>
                <div>Estado</div>
              </div>
              <div className="max-h-44 overflow-auto">
                {filteredModels.map((model) => (
                  <div
                    key={model.id}
                    className="grid grid-cols-[1fr_auto] gap-3 border-b border-zinc-100 px-3 py-2.5 text-sm last:border-b-0"
                  >
                    <div>
                      <div className="font-bold text-zinc-900">{model.name}</div>
                      <div className="text-xs text-zinc-500">Grupo: -</div>
                      <button type="button" className="mt-1 text-xs font-semibold text-sky-700" onClick={() => void renameModel(model)}>
                        Renombrar
                      </button>
                      <button type="button" className="mt-1 ml-3 text-xs font-semibold text-zinc-700" onClick={() => void toggleModel(model)}>
                        {model.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                    <span className={model.active ? 'badge-emerald self-center' : 'badge-zinc self-center'}>
                      {model.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Link to="/admin/gruposmodelos" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
              Administrar grupos de modelos
            </Link>
          </div>
        </section>

        <section className="card">
          <div className="card-head flex items-center justify-between gap-2">
            <div className="text-2xl font-black tracking-tight text-zinc-900">Fallas</div>
            <span className="badge-zinc">{issues.length}</span>
          </div>
          <div className="card-body space-y-3">
            <div className="flex gap-2">
              <input
                value={issueDraft}
                onChange={(e) => setIssueDraft(e.target.value)}
                placeholder="Ej: No carga / Pantalla"
                className="h-11 flex-1 rounded-2xl border border-zinc-200 px-3 text-sm"
              />
              <button type="button" className="btn-primary !h-11 !rounded-2xl px-4 text-sm font-bold" onClick={() => void handleCreateIssue()}>
                Agregar
              </button>
            </div>

            <div className="rounded-2xl border border-zinc-200">
              <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-zinc-100 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500">
                <div>Nombre</div>
                <div>Estado</div>
              </div>
              <div className="max-h-44 overflow-auto">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="grid grid-cols-[1fr_auto] gap-3 border-b border-zinc-100 px-3 py-2.5 text-sm last:border-b-0"
                  >
                    <div>
                      <div className="font-bold text-zinc-900">{issue.name}</div>
                      <div className="text-xs text-zinc-500">slug: {issue.slug}</div>
                      <button type="button" className="mt-1 text-xs font-semibold text-sky-700" onClick={() => void renameIssue(issue)}>
                        Renombrar
                      </button>
                      <button type="button" className="mt-1 ml-3 text-xs font-semibold text-zinc-700" onClick={() => void toggleIssue(issue)}>
                        {issue.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                    <span className={issue.active ? 'badge-emerald self-center' : 'badge-zinc self-center'}>
                      {issue.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
