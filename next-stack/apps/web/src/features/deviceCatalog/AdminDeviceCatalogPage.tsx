import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function AdminDeviceCatalogPage() {
  const [brands, setBrands] = useState<Array<{ id: string; name: string; slug: string; active: boolean }>>([]);
  const [models, setModels] = useState<Array<{ id: string; brandId: string; name: string; slug: string; active: boolean; brand: { id: string; name: string; slug: string } }>>([]);
  const [issues, setIssues] = useState<Array<{ id: string; name: string; slug: string; active: boolean }>>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [error, setError] = useState('');

  const [brandName, setBrandName] = useState('');
  const [modelName, setModelName] = useState('');
  const [issueName, setIssueName] = useState('');

  async function loadAll() {
    setError('');
    try {
      const [brandsRes, issuesRes] = await Promise.all([deviceCatalogApi.brands(), deviceCatalogApi.issues()]);
      setBrands(brandsRes.items);
      setIssues(issuesRes.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando catálogo');
    }
  }

  async function loadModels(brandId?: string) {
    try {
      const res = await deviceCatalogApi.models(brandId || undefined);
      setModels(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando modelos');
    }
  }

  useEffect(() => {
    void loadAll();
    void loadModels();
  }, []);

  useEffect(() => {
    void loadModels(selectedBrandId || undefined);
  }, [selectedBrandId]);

  const selectableBrands = useMemo(() => brands.filter((brand) => brand.active), [brands]);
  const brandOptions = useMemo(
    () => [{ value: '', label: 'Seleccionar marca' }, ...selectableBrands.map((brand) => ({ value: brand.id, label: brand.name }))],
    [selectableBrands],
  );

  return (
    <div className="store-shell">
      <div className="page-head store-hero">
        <div>
          <div className="page-title">Catálogo de dispositivos</div>
          <div className="page-subtitle">Marcas, modelos y fallas para usar en reparaciones y pricing.</div>
        </div>
        <Link to="/admin" className="btn-outline h-11 w-full justify-center sm:w-auto">Volver a admin</Link>
      </div>
      {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <section className="card">
          <div className="card-body p-4">
            <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Marcas</div>
            <form className="mt-3 flex gap-2" onSubmit={async (e) => {
              e.preventDefault();
              await deviceCatalogApi.createBrand({ name: brandName, slug: slugify(brandName) });
              setBrandName('');
              await loadAll();
            }}>
              <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Samsung" className="h-10 flex-1 rounded-xl border border-zinc-200 px-3 text-sm" required />
              <button className="btn-primary h-10 justify-center px-4" type="submit">Agregar</button>
            </form>
            <div className="mt-3 max-h-96 space-y-2 overflow-auto pr-1">
              {brands.map((brand) => (
                <div key={brand.id} className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 p-2">
                  <button type="button" onClick={() => setSelectedBrandId(brand.id)} className={`text-left text-sm font-semibold ${selectedBrandId === brand.id ? 'text-sky-700' : 'text-zinc-900'}`}>{brand.name}</button>
                  <button type="button" onClick={async () => { await deviceCatalogApi.deleteBrand(brand.id); await loadAll(); await loadModels(selectedBrandId || undefined); }} className="text-xs font-bold text-rose-700">Borrar</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-body p-4">
            <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Modelos</div>
            <form className="mt-3 grid gap-2" onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedBrandId) return;
              await deviceCatalogApi.createModel({ brandId: selectedBrandId, name: modelName, slug: slugify(modelName) });
              setModelName('');
              await loadModels(selectedBrandId);
            }}>
              <CustomSelect
                value={selectedBrandId}
                onChange={setSelectedBrandId}
                options={brandOptions}
                triggerClassName="min-h-10 h-10 rounded-xl text-sm font-bold"
                ariaLabel="Seleccionar marca"
              />
              <input value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="A32 5G" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" required />
              <button className="btn-primary h-10 justify-center px-4" type="submit" disabled={!selectedBrandId}>Agregar modelo</button>
            </form>
            <div className="mt-3 max-h-96 space-y-2 overflow-auto pr-1">
              {models.map((model) => (
                <div key={model.id} className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 p-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-900">{model.name}</div>
                    <div className="text-xs text-zinc-500">{model.brand.name}</div>
                  </div>
                  <button type="button" onClick={async () => { await deviceCatalogApi.deleteModel(model.id); await loadModels(selectedBrandId || undefined); }} className="text-xs font-bold text-rose-700">Borrar</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-body p-4">
            <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Fallas</div>
            <form className="mt-3 flex gap-2" onSubmit={async (e) => {
              e.preventDefault();
              await deviceCatalogApi.createIssue({ name: issueName, slug: slugify(issueName) });
              setIssueName('');
              await loadAll();
            }}>
              <input value={issueName} onChange={(e) => setIssueName(e.target.value)} placeholder="Cambio de módulo" className="h-10 flex-1 rounded-xl border border-zinc-200 px-3 text-sm" required />
              <button className="btn-primary h-10 justify-center px-4" type="submit">Agregar</button>
            </form>
            <div className="mt-3 max-h-96 space-y-2 overflow-auto pr-1">
              {issues.map((issue) => (
                <div key={issue.id} className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 p-2">
                  <div className="text-sm font-semibold text-zinc-900">{issue.name}</div>
                  <button type="button" onClick={async () => { await deviceCatalogApi.deleteIssue(issue.id); await loadAll(); }} className="text-xs font-bold text-rose-700">Borrar</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
