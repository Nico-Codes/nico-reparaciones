import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { deviceCatalogApi } from './api';

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
      const [b, i] = await Promise.all([deviceCatalogApi.brands(), deviceCatalogApi.issues()]);
      setBrands(b.items);
      setIssues(i.items);
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

  const selectableBrands = useMemo(() => brands.filter((b) => b.active), [brands]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-black tracking-tight">Catálogo de dispositivos (Next)</h1>
        <p className="mt-1 text-sm text-zinc-600">Marcas, modelos y fallas administrables para usar en reparaciones y pricing.</p>
        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Marcas</div>
            <form className="mt-3 flex gap-2" onSubmit={async (e) => {
              e.preventDefault();
              await deviceCatalogApi.createBrand({ name: brandName, slug: slugify(brandName) });
              setBrandName('');
              await loadAll();
            }}>
              <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Samsung" className="h-10 flex-1 rounded-xl border border-zinc-200 px-3 text-sm" required />
              <Button className="h-10">Agregar</Button>
            </form>
            <div className="mt-3 space-y-2 max-h-96 overflow-auto pr-1">
              {brands.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 p-2">
                  <button type="button" onClick={() => setSelectedBrandId(b.id)} className={`text-left text-sm font-semibold ${selectedBrandId === b.id ? 'text-sky-700' : 'text-zinc-900'}`}>{b.name}</button>
                  <button type="button" onClick={async () => { await deviceCatalogApi.deleteBrand(b.id); await loadAll(); await loadModels(selectedBrandId || undefined); }} className="text-xs font-bold text-rose-700">Borrar</button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Modelos</div>
            <form className="mt-3 grid gap-2" onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedBrandId) return;
              await deviceCatalogApi.createModel({ brandId: selectedBrandId, name: modelName, slug: slugify(modelName) });
              setModelName('');
              await loadModels(selectedBrandId);
            }}>
              <select value={selectedBrandId} onChange={(e) => setSelectedBrandId(e.target.value)} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm">
                <option value="">Seleccionar marca</option>
                {selectableBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <input value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="A32 5G" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" required />
              <Button className="h-10" disabled={!selectedBrandId}>Agregar modelo</Button>
            </form>
            <div className="mt-3 space-y-2 max-h-96 overflow-auto pr-1">
              {models.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 p-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-900">{m.name}</div>
                    <div className="text-xs text-zinc-500">{m.brand.name}</div>
                  </div>
                  <button type="button" onClick={async () => { await deviceCatalogApi.deleteModel(m.id); await loadModels(selectedBrandId || undefined); }} className="text-xs font-bold text-rose-700">Borrar</button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Fallas</div>
            <form className="mt-3 flex gap-2" onSubmit={async (e) => {
              e.preventDefault();
              await deviceCatalogApi.createIssue({ name: issueName, slug: slugify(issueName) });
              setIssueName('');
              await loadAll();
            }}>
              <input value={issueName} onChange={(e) => setIssueName(e.target.value)} placeholder="Cambio de módulo" className="h-10 flex-1 rounded-xl border border-zinc-200 px-3 text-sm" required />
              <Button className="h-10">Agregar</Button>
            </form>
            <div className="mt-3 space-y-2 max-h-96 overflow-auto pr-1">
              {issues.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 p-2">
                  <div className="text-sm font-semibold text-zinc-900">{i.name}</div>
                  <button type="button" onClick={async () => { await deviceCatalogApi.deleteIssue(i.id); await loadAll(); }} className="text-xs font-bold text-rose-700">Borrar</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
