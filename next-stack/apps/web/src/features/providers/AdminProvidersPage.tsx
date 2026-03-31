import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, type AdminProviderItem } from '@/features/admin/api';
import {
  buildProvidersSummary,
  createInitialProviderDraft,
  moveProviderPriority,
  patchProviderList,
  sortProvidersByPriority,
  toSearchMode,
} from './admin-providers.helpers';
import { ProvidersCreateSection, ProvidersFeedback, ProvidersPrioritySection, ProvidersProbeSection, ProvidersStatsGrid, ProvidersTableSection } from './admin-providers.sections';

export function AdminProvidersPage() {
  const [providers, setProviders] = useState<AdminProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [testQuery, setTestQuery] = useState('modulo a30');
  const [draft, setDraft] = useState(createInitialProviderDraft);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.providers();
      setProviders(res.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error cargando proveedores');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const ordered = useMemo(() => sortProvidersByPriority(providers), [providers]);
  const summary = useMemo(() => buildProvidersSummary(providers), [providers]);

  function updateDraft(patch: Partial<typeof draft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function patchProvider(id: string, patch: Partial<AdminProviderItem>) {
    setProviders((prev) => patchProviderList(prev, id, patch));
  }

  function reorderProvider(id: string, dir: -1 | 1) {
    setProviders((prev) => moveProviderPriority(prev, id, dir));
  }

  async function saveOrder() {
    setSavingOrder(true);
    setError('');
    setMessage('');
    try {
      const res = await adminApi.reorderProviders(sortProvidersByPriority(providers).map((provider) => provider.id));
      setProviders(res.items);
      setMessage('Orden de busqueda actualizado.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el orden');
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron importar sugeridos');
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
      setDraft((current) => ({
        ...createInitialProviderDraft(),
        mode: current.mode,
        endpoint: current.endpoint,
        configJson: current.configJson,
        enabled: current.enabled,
        priority: current.priority,
      }));
      setMessage('Proveedor creado.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el proveedor');
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el proveedor');
      await load();
    }
  }

  async function toggleProvider(row: AdminProviderItem) {
    setError('');
    setMessage('');
    try {
      const res = await adminApi.toggleProvider(row.id);
      patchProvider(row.id, res.item);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cambiar el estado');
    }
  }

  async function probeProvider(row: AdminProviderItem) {
    setError('');
    setMessage('');
    try {
      const res = await adminApi.probeProvider(row.id, testQuery);
      patchProvider(row.id, res.item);
      setMessage(`Prueba en "${row.name}" con "${res.probe.query}": ${res.probe.count} resultados.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo ejecutar la prueba');
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Proveedores</h1>
            <p className="mt-1 text-sm text-zinc-600">Gestiona tus proveedores para trazabilidad de compras y fallas.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={importSuggested} className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Importar sugeridos
            </button>
            <Link to="/admin/garantias" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Ver garantias
            </Link>
          </div>
        </div>
      </section>

      <ProvidersFeedback error={error} message={message} />
      <ProvidersStatsGrid summary={summary} />
      <ProvidersPrioritySection ordered={ordered} savingOrder={savingOrder} onMovePriority={reorderProvider} onSaveOrder={() => void saveOrder()} />
      <ProvidersProbeSection testQuery={testQuery} onTestQueryChange={setTestQuery} />
      <ProvidersCreateSection draft={draft} onDraftChange={updateDraft} onSave={() => void addProvider()} />
      <ProvidersTableSection
        loading={loading}
        ordered={ordered}
        onPatchProvider={patchProvider}
        onSaveProvider={(provider) => void saveProvider(provider)}
        onToggleProvider={(provider) => void toggleProvider(provider)}
        onProbeProvider={(provider) => void probeProvider(provider)}
      />
    </div>
  );
}
