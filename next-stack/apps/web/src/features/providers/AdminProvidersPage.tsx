import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import { adminApi, type AdminProviderItem } from '@/features/admin/api';

function money(value: number) {
  return `$ ${value.toLocaleString('es-AR')}`;
}

function toSearchMode(modeLabel: string) {
  return modeLabel.toLowerCase().includes('json') ? 'json' : 'html';
}

const providerModeOptions = [
  { value: 'JSON API', label: 'JSON API' },
  { value: 'HTML simple', label: 'HTML simple' },
];

export function AdminProvidersPage() {
  const [providers, setProviders] = useState<AdminProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [testQuery, setTestQuery] = useState('modulo a30');
  const [draft, setDraft] = useState({
    name: '',
    phone: '',
    priority: '100',
    notes: '',
    enabled: true,
    mode: 'JSON API',
    endpoint: 'https://proveedor.com/api/search?q={query}',
    configJson:
      '{"items_path":"items","name_field":"title","price_field":"price","stock_field":"stock","url_field":"url"}',
  });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.providers();
      setProviders(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando proveedores');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const ordered = useMemo(
    () => [...providers].sort((a, b) => a.priority - b.priority),
    [providers],
  );
  const totalIncidents = providers.reduce((acc, provider) => acc + provider.incidents, 0);
  const openIncidents = providers.reduce((acc, provider) => acc + provider.warrantiesExpired, 0);
  const closedIncidents = providers.reduce((acc, provider) => acc + provider.warrantiesOk, 0);
  const accumulatedLoss = providers.reduce((acc, provider) => acc + provider.loss, 0);

  function movePriority(id: string, dir: -1 | 1) {
    setProviders((prev) => {
      const sorted = [...prev].sort((a, b) => a.priority - b.priority);
      const idx = sorted.findIndex((provider) => provider.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= sorted.length) return prev;
      const current = sorted[idx];
      const other = sorted[target];
      const currentPriority = current.priority;
      current.priority = other.priority;
      other.priority = currentPriority;
      return [...sorted];
    });
  }

  function patchProvider(id: string, patch: Partial<AdminProviderItem>) {
    setProviders((prev) => prev.map((provider) => (provider.id === id ? { ...provider, ...patch } : provider)));
  }

  async function saveOrder() {
    setSavingOrder(true);
    setError('');
    setMessage('');
    try {
      const res = await adminApi.reorderProviders(
        [...providers]
          .sort((a, b) => a.priority - b.priority)
          .map((provider) => provider.id),
      );
      setProviders(res.items);
      setMessage('Orden de búsqueda actualizado.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el orden');
    } finally {
      setSavingOrder(false);
    }
  }

  async function importSuggested() {
    setError('');
    setMessage('');
    try {
      const res = await adminApi.importDefaultProviders();
      setProviders(res.items);
      setMessage(`Sugeridos importados. Nuevos: ${res.created}. Actualizados: ${res.updated}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron importar sugeridos');
    }
  }

  async function addProvider() {
    if (!draft.name.trim()) return;
    setError('');
    setMessage('');
    try {
      const res = await adminApi.createProvider({
        name: draft.name.trim(),
        phone: draft.phone.trim() || null,
        notes: draft.notes.trim() || null,
        searchPriority: Number(draft.priority) || 100,
        searchEnabled: draft.enabled,
        searchMode: toSearchMode(draft.mode),
        searchEndpoint: draft.endpoint.trim() || null,
        searchConfigJson: draft.configJson.trim() || null,
        active: true,
      });
      setProviders((prev) => [...prev, res.item]);
      setDraft((state) => ({ ...state, name: '', phone: '', notes: '' }));
      setMessage('Proveedor creado.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el proveedor');
    }
  }

  async function saveProvider(row: AdminProviderItem) {
    setError('');
    setMessage('');
    try {
      const res = await adminApi.updateProvider(row.id, {
        name: row.name,
        phone: row.phone || null,
        notes: row.notes || null,
        searchPriority: row.priority,
        searchEnabled: row.searchEnabled,
        searchMode: toSearchMode(row.mode),
        searchEndpoint: row.endpoint || null,
        searchConfigJson: row.configJson || null,
        active: row.active,
      });
      patchProvider(row.id, res.item);
      setMessage(`Proveedor "${res.item.name}" actualizado.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el proveedor');
      await load();
    }
  }

  async function toggleProvider(row: AdminProviderItem) {
    setError('');
    setMessage('');
    try {
      const res = await adminApi.toggleProvider(row.id);
      patchProvider(row.id, res.item);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el estado');
    }
  }

  async function probeProvider(row: AdminProviderItem) {
    setError('');
    setMessage('');
    try {
      const res = await adminApi.probeProvider(row.id, testQuery);
      patchProvider(row.id, res.item);
      setMessage(`Prueba en "${row.name}" con "${res.probe.query}": ${res.probe.count} resultados.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo ejecutar la prueba');
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Proveedores</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Gestiona tus proveedores para trazabilidad de compras y fallas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={importSuggested}
              className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold"
            >
              Importar sugeridos
            </button>
            <Link to="/admin/garantias" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Ver garantías
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="INCIDENTES" value={String(totalIncidents)} />
        <StatCard title="ABIERTOS" value={String(openIncidents)} valueClass="text-amber-600" />
        <StatCard title="CERRADOS" value={String(closedIncidents)} />
        <StatCard title="PÉRDIDA" value={money(accumulatedLoss)} valueClass="text-rose-700" />
      </div>

      <section className="card">
        <div className="card-head flex items-center justify-between gap-2">
          <div className="text-xl font-black tracking-tight text-zinc-900">Prioridad de búsqueda</div>
          <span className="badge-zinc">Arrastra para ordenar</span>
        </div>
        <div className="card-body space-y-2.5">
          {ordered.map((provider, idx) => (
            <div
              key={`${provider.id}-priority`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2.5"
            >
              <div>
                <div className="text-lg font-black tracking-tight text-zinc-900">{provider.name}</div>
                <div className="text-sm text-zinc-500">Prioridad #{idx + 1}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => movePriority(provider.id, -1)}
                  className="btn-ghost !h-8 !w-8 !rounded-xl p-0 text-base font-black"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => movePriority(provider.id, 1)}
                  className="btn-ghost !h-8 !w-8 !rounded-xl p-0 text-base font-black"
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            disabled={savingOrder}
            onClick={saveOrder}
            className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold disabled:opacity-60"
          >
            {savingOrder ? 'Guardando...' : 'Guardar orden'}
          </button>
          <p className="text-sm text-zinc-500">
            Este orden se usa en la búsqueda progresiva de repuestos (primero arriba, luego abajo).
          </p>
        </div>
      </section>

      <section className="card">
        <div className="card-body">
          <label className="mb-2 block text-sm font-bold text-zinc-900">
            Query de prueba para &quot;Probar búsqueda&quot;
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              className="h-11 min-w-[260px] flex-1 rounded-2xl border border-zinc-200 px-3 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div className="text-xl font-black tracking-tight text-zinc-900">Nuevo proveedor</div>
        </div>
        <div className="card-body space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-zinc-700">Nombre *</label>
              <input
                value={draft.name}
                onChange={(e) => setDraft((state) => ({ ...state, name: e.target.value }))}
                placeholder="Ej: Importadora Centro"
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-zinc-700">Teléfono (opcional)</label>
              <input
                value={draft.phone}
                onChange={(e) => setDraft((state) => ({ ...state, phone: e.target.value }))}
                placeholder="Ej: 3511234567"
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-zinc-700">Prioridad de búsqueda</label>
              <input
                value={draft.priority}
                onChange={(e) => setDraft((state) => ({ ...state, priority: e.target.value }))}
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-zinc-700">Notas (opcional)</label>
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft((state) => ({ ...state, notes: e.target.value }))}
              rows={3}
              placeholder="Contacto, zona, tiempos, etc."
              className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="rounded-2xl border border-zinc-200 p-4">
            <div className="mb-3 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1">
              <input
                id="draft-enabled"
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => setDraft((state) => ({ ...state, enabled: e.target.checked }))}
                className="h-4 w-4"
              />
              <label htmlFor="draft-enabled" className="text-sm font-bold text-zinc-900">
                Habilitar búsqueda de repuestos
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-bold text-zinc-700">Modo</label>
                <CustomSelect
                  value={draft.mode}
                  onChange={(value) => setDraft((state) => ({ ...state, mode: value }))}
                  options={providerModeOptions}
                  triggerClassName="min-h-11 rounded-2xl font-bold"
                  ariaLabel="Seleccionar modo de búsqueda"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-zinc-700">Endpoint (usar {'{query}'})</label>
                <input
                  value={draft.endpoint}
                  onChange={(e) => setDraft((state) => ({ ...state, endpoint: e.target.value }))}
                  className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-sm font-bold text-zinc-700">Config JSON (opcional)</label>
              <textarea
                value={draft.configJson}
                onChange={(e) => setDraft((state) => ({ ...state, configJson: e.target.value }))}
                rows={3}
                className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={addProvider}
            className="btn-primary !h-11 !rounded-xl px-5 text-sm font-bold"
          >
            Guardar proveedor
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-5 text-sm text-zinc-600">Cargando proveedores...</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[1200px]">
                <div className="grid grid-cols-[1.25fr_0.7fr_0.55fr_0.65fr_0.8fr_0.7fr_0.65fr_0.95fr_0.9fr_1.35fr] gap-3 bg-zinc-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500">
                  <div>PROVEEDOR</div>
                  <div>TELÉFONO</div>
                  <div className="text-right">PRODUCTOS</div>
                  <div className="text-right">INCIDENTES</div>
                  <div className="text-center">GARANTÍAS OK</div>
                  <div className="text-right">PÉRDIDA</div>
                  <div className="text-center">PUNTUACIÓN</div>
                  <div className="text-center">ESTADO</div>
                  <div className="text-center">ACCIONES</div>
                  <div className="text-left">CONFIG</div>
                </div>
                {ordered.map((provider, idx) => (
                  <div key={provider.id} className={idx ? 'border-t border-zinc-100' : ''}>
                    <div className="grid grid-cols-[1.25fr_0.7fr_0.55fr_0.65fr_0.8fr_0.7fr_0.65fr_0.95fr_0.9fr_1.35fr] items-center gap-3 px-3 py-3">
                      <div className="text-lg font-black tracking-tight text-zinc-900">{provider.name}</div>
                      <div className="text-sm text-zinc-500">{provider.phone || '-'}</div>
                      <div className="text-right text-lg font-black text-zinc-900">{provider.products}</div>
                      <div className="text-right text-lg font-black text-zinc-900">{provider.incidents}</div>
                      <div className="text-center text-sm font-bold text-zinc-900">
                        <div>
                          {provider.warrantiesOk}/{provider.warrantiesExpired}
                        </div>
                        <div className="text-zinc-500">Tasa visible de incidentes</div>
                      </div>
                      <div className={`text-right text-xl font-black ${provider.loss > 0 ? 'text-rose-700' : 'text-zinc-900'}`}>
                        {provider.loss > 0 ? money(provider.loss) : '$ 0'}
                      </div>
                      <div className="text-center">
                        <div className="inline-flex h-8 items-center rounded-full border border-sky-200 bg-sky-50 px-3 text-sm font-black text-sky-700">
                          {provider.score}/100
                        </div>
                        <div className="mt-1 text-xs font-bold text-zinc-700">{provider.confidenceLabel}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {provider.lastProbeAt} | q: &quot;{provider.lastQuery}&quot; | n: {provider.lastResults}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="inline-flex h-8 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-sm font-black text-emerald-700">
                          {provider.active ? 'Activo' : 'Inactivo'}
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => void saveProvider({ ...provider, searchEnabled: !provider.searchEnabled })}
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-3 text-sm font-black text-sky-700"
                        >
                          Buscador {provider.searchEnabled ? 'ON' : 'OFF'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void probeProvider(provider)}
                          className="btn-outline !h-9 !rounded-xl px-3 text-sm font-bold"
                        >
                          Probar búsqueda
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleProvider(provider)}
                          className="btn-outline !h-9 !rounded-xl px-3 text-sm font-bold"
                        >
                          {provider.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div className="grid grid-cols-[1.2fr_1fr] gap-2">
                          <input
                            value={provider.name}
                            onChange={(e) => patchProvider(provider.id, { name: e.target.value })}
                            className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
                          />
                          <input
                            value={provider.notes}
                            onChange={(e) => patchProvider(provider.id, { notes: e.target.value })}
                            placeholder="Notas"
                            className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-[0.45fr_0.6fr_auto] items-center gap-2">
                          <input
                            value={String(provider.priority)}
                            onChange={(e) => patchProvider(provider.id, { priority: Number(e.target.value) || provider.priority })}
                            className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
                          />
                          <label className="flex items-center justify-center gap-2 text-sm font-bold text-zinc-700">
                            <input
                              type="checkbox"
                              checked={provider.searchEnabled}
                              onChange={(e) => patchProvider(provider.id, { searchEnabled: e.target.checked })}
                            />
                            Búsqueda habilitada
                          </label>
                          <button
                            type="button"
                            onClick={() => void saveProvider(provider)}
                            className="text-sm font-black text-zinc-900"
                          >
                            Actualizar
                          </button>
                        </div>
                        <div className="grid grid-cols-[0.75fr_1.25fr] gap-2">
                          <CustomSelect
                            value={provider.mode}
                            onChange={(value) => patchProvider(provider.id, { mode: value })}
                            options={providerModeOptions}
                            triggerClassName="h-10 min-h-10 rounded-xl px-3 text-sm font-bold"
                            ariaLabel="Seleccionar modo de proveedor"
                          />
                          <input
                            value={provider.endpoint}
                            onChange={(e) => patchProvider(provider.id, { endpoint: e.target.value })}
                            className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
                          />
                        </div>
                        <textarea
                          value={provider.configJson}
                          onChange={(e) => patchProvider(provider.id, { configJson: e.target.value })}
                          rows={2}
                          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {!ordered.length ? (
                  <div className="px-4 py-8 text-center text-sm text-zinc-600">Aún no hay proveedores cargados.</div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard(props: { title: string; value: string; valueClass?: string }) {
  return (
    <section className="card">
      <div className="card-body">
        <div className="text-sm font-black uppercase tracking-wide text-zinc-500">{props.title}</div>
        <div className={`mt-2 text-5xl font-black tracking-tight ${props.valueClass ?? 'text-zinc-900'}`}>
          {props.value}
        </div>
      </div>
    </section>
  );
}
