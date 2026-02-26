import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type ProviderRow = {
  id: string;
  name: string;
  priority: number;
  phone: string;
  products: number;
  incidents: number;
  warrantiesOk: number;
  warrantiesExpired: number;
  loss: number;
  score: number;
  confidenceLabel: string;
  active: boolean;
  searchEnabled: boolean;
  statusProbe: 'ok' | 'none';
  lastProbeAt: string;
  lastQuery: string;
  lastResults: number;
  mode: string;
  endpoint: string;
  configJson: string;
  notes: string;
};

const INITIAL_PROVIDERS: ProviderRow[] = [
  {
    id: 'pr-1',
    name: 'Okey Rosario',
    priority: 10,
    phone: '',
    products: 0,
    incidents: 0,
    warrantiesOk: 0,
    warrantiesExpired: 0,
    loss: 0,
    score: 80,
    confidenceLabel: 'Confiable',
    active: true,
    searchEnabled: true,
    statusProbe: 'ok',
    lastProbeAt: '13/02 09:44',
    lastQuery: 'modulo a30',
    lastResults: 3,
    mode: 'HTML simple',
    endpoint: 'https://okeyrosario.com.ar/?s={query}&post_type=product',
    configJson: '{"candidate_paths":["/producto/"],"exclude_paths":["/categoria-producto/","add-to-cart="],"context_window":12000}',
    notes: '',
  },
  {
    id: 'pr-2',
    name: 'Evophone',
    priority: 20,
    phone: '',
    products: 0,
    incidents: 0,
    warrantiesOk: 0,
    warrantiesExpired: 0,
    loss: 0,
    score: 80,
    confidenceLabel: 'Confiable',
    active: true,
    searchEnabled: true,
    statusProbe: 'ok',
    lastProbeAt: '13/02 09:25',
    lastQuery: 'modulo a30',
    lastResults: 3,
    mode: 'HTML simple',
    endpoint: 'https://www.evophone.com.ar/?s={query}&post_type=product',
    configJson: '{"candidate_paths":["/producto/"],"exclude_paths":["/categoria-producto/","add-to-cart="],"context_window":12000}',
    notes: '',
  },
  {
    id: 'pr-3',
    name: 'CeluPhone',
    priority: 30,
    phone: '',
    products: 0,
    incidents: 0,
    warrantiesOk: 0,
    warrantiesExpired: 0,
    loss: 0,
    score: 80,
    confidenceLabel: 'Confiable',
    active: true,
    searchEnabled: true,
    statusProbe: 'ok',
    lastProbeAt: '13/02 09:29',
    lastQuery: 'modulo a30',
    lastResults: 3,
    mode: 'HTML simple',
    endpoint: 'https://celuphone.com.ar/?s={query}&post_type=product',
    configJson: '{"candidate_paths":["/producto/"],"exclude_paths":["/categoria-producto/","add-to-cart="],"context_window":12000}',
    notes: '',
  },
  {
    id: 'pr-4',
    name: 'Electrostore',
    priority: 40,
    phone: '',
    products: 0,
    incidents: 0,
    warrantiesOk: 0,
    warrantiesExpired: 0,
    loss: 0,
    score: 80,
    confidenceLabel: 'Confiable',
    active: true,
    searchEnabled: true,
    statusProbe: 'none',
    lastProbeAt: '13/02 09:16',
    lastQuery: 'modulo a30',
    lastResults: 0,
    mode: 'HTML simple',
    endpoint: 'https://electrostore.com.ar/?s={query}&post_type=product',
    configJson: '{"candidate_paths":["/producto/"],"exclude_paths":["/categoria-producto/","add-to-cart="],"context_window":12000}',
    notes: '',
  },
  {
    id: 'pr-5',
    name: 'El Reparador de PC',
    priority: 50,
    phone: '',
    products: 0,
    incidents: 0,
    warrantiesOk: 0,
    warrantiesExpired: 0,
    loss: 0,
    score: 80,
    confidenceLabel: 'Confiable',
    active: true,
    searchEnabled: true,
    statusProbe: 'none',
    lastProbeAt: '13/02 09:16',
    lastQuery: 'modulo a30',
    lastResults: 0,
    mode: 'HTML simple',
    endpoint: 'https://www.elreparadordepc.com/search_producto?term={query}',
    configJson: '{"candidate_paths":["/producto/"],"exclude_paths":["/categoria/","/carrito","/deseos"],"candidate_url_regex":"\\/producto\\/\\d+\\/[^"]+","context_window":12000}',
    notes: '',
  },
  {
    id: 'pr-6',
    name: 'Tienda Movil Rosario',
    priority: 60,
    phone: '',
    products: 0,
    incidents: 0,
    warrantiesOk: 0,
    warrantiesExpired: 0,
    loss: 0,
    score: 80,
    confidenceLabel: 'Confiable',
    active: true,
    searchEnabled: true,
    statusProbe: 'none',
    lastProbeAt: '13/02 09:17',
    lastQuery: 'modulo a30',
    lastResults: 0,
    mode: 'HTML simple',
    endpoint: 'https://tiendamovilrosario.com.ar/?s={query}&post_type=product',
    configJson: '{"candidate_paths":["/producto/"],"exclude_paths":["/product-category/","add-to-cart="],"context_window":12000}',
    notes: '',
  },
  {
    id: 'pr-7',
    name: 'Puntocell',
    priority: 70,
    phone: '',
    products: 0,
    incidents: 1,
    warrantiesOk: 0,
    warrantiesExpired: 0,
    loss: 16000,
    score: 77,
    confidenceLabel: 'Confiable',
    active: true,
    searchEnabled: true,
    statusProbe: 'none',
    lastProbeAt: '13/02 09:17',
    lastQuery: 'modulo a30',
    lastResults: 0,
    mode: 'HTML simple',
    endpoint: 'https://www.puntocell.com.ar/shop?search={query}',
    configJson: '{"item_regex":"<\\/div class=\\\"oe_product[\\s\\S]*?<\\/form>[\\s\\S]*?<\\/div>","name_regex":"product_item_title[\\s\\S]*?<a[^>]*>(.*?)<\\/a>","price_regex":"ARS[^0-9]{0,20}([0-9\\.,]+)","url_regex":"href=\\\"([^\\\"]*\\/shop\\/[^\\\"]+)\\\"","context_window":12000}',
    notes: '',
  },
];

function money(value: number) {
  return `$ ${value.toLocaleString('es-AR')}`;
}

function statusTone(status: ProviderRow['statusProbe']) {
  return status === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-300 bg-amber-50 text-amber-700';
}

export function AdminProvidersPage() {
  const [providers, setProviders] = useState(INITIAL_PROVIDERS);
  const [testQuery, setTestQuery] = useState('modulo a30');
  const [draft, setDraft] = useState({
    name: '', phone: '', priority: '100', notes: '', enabled: true, mode: 'JSON API', endpoint: 'https://proveedor.com/api/search?q={query}', configJson: '{"items_path":"items","name_field":"title","price_field":"price","stock_field":"stock","url_field":"url"}'
  });

  const ordered = useMemo(() => [...providers].sort((a, b) => a.priority - b.priority), [providers]);
  const totalIncidents = providers.reduce((acc, p) => acc + p.incidents, 0);
  const openIncidents = totalIncidents;
  const closedIncidents = 0;
  const accumulatedLoss = providers.reduce((acc, p) => acc + p.loss, 0);

  function movePriority(id: string, dir: -1 | 1) {
    setProviders((prev) => {
      const sorted = [...prev].sort((a, b) => a.priority - b.priority);
      const idx = sorted.findIndex((p) => p.id === id);
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

  function patchProvider(id: string, patch: Partial<ProviderRow>) {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function importSuggested() {
    setProviders((prev) => {
      const names = new Set(prev.map((p) => p.name));
      const suggestions = ['Okey Rosario', 'Evophone', 'CeluPhone', 'Electrostore', 'El Reparador de PC', 'Tienda Movil Rosario', 'Puntocell'];
      const next = [...prev];
      let max = Math.max(...prev.map((p) => p.priority), 0);
      for (const name of suggestions) {
        if (names.has(name)) continue;
        max += 10;
        next.push({
          ...INITIAL_PROVIDERS[0], id: `pr-${Math.random().toString(36).slice(2, 7)}`, name, priority: max, endpoint: '', configJson: '{}', statusProbe: 'none', lastProbeAt: '-', lastQuery: testQuery, lastResults: 0,
        });
      }
      return next;
    });
  }

  function addProvider() {
    if (!draft.name.trim()) return;
    setProviders((prev) => [
      ...prev,
      {
        id: `pr-${Math.random().toString(36).slice(2, 8)}`,
        name: draft.name.trim(),
        priority: Number(draft.priority) || 100,
        phone: draft.phone.trim(),
        products: 0,
        incidents: 0,
        warrantiesOk: 0,
        warrantiesExpired: 0,
        loss: 0,
        score: 80,
        confidenceLabel: 'Confiable',
        active: true,
        searchEnabled: draft.enabled,
        statusProbe: 'none',
        lastProbeAt: '-',
        lastQuery: testQuery,
        lastResults: 0,
        mode: draft.mode,
        endpoint: draft.endpoint,
        configJson: draft.configJson,
        notes: draft.notes,
      },
    ]);
    setDraft((d) => ({ ...d, name: '', phone: '', notes: '' }));
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Proveedores</h1>
            <p className="mt-1 text-sm text-zinc-600">Gestiona tus lugares de compra para trazabilidad de fallas.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={importSuggested} className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">Importar sugeridos</button>
            <Link to="/admin/garantias" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">Ver garantias</Link>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head flex items-center justify-between gap-2">
          <div className="text-xl font-black tracking-tight text-zinc-900">Prioridad de busqueda</div>
          <span className="badge-zinc">Arrastra para ordenar</span>
        </div>
        <div className="card-body space-y-2.5">
          {ordered.map((p, idx) => (
            <div key={`${p.id}-priority`} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2.5">
              <div>
                <div className="text-lg font-black tracking-tight text-zinc-900">{p.name}</div>
                <div className="text-sm text-zinc-500">Prioridad #{idx + 1}</div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => movePriority(p.id, -1)} className="btn-ghost !h-8 !w-8 !rounded-xl p-0 text-base font-black">↑</button>
                <button type="button" onClick={() => movePriority(p.id, 1)} className="btn-ghost !h-8 !w-8 !rounded-xl p-0 text-base font-black">↓</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">Guardar orden</button>
          <p className="text-sm text-zinc-500">Este orden se usa en la busqueda progresiva de repuestos (primero arriba, luego abajo).</p>
        </div>
      </section>

      <section className="card">
        <div className="card-body">
          <label className="mb-2 block text-sm font-bold text-zinc-900">Query de prueba para "Probar busqueda"</label>
          <div className="flex flex-wrap gap-2">
            <input value={testQuery} onChange={(e) => setTestQuery(e.target.value)} className="h-11 min-w-[260px] flex-1 rounded-2xl border border-zinc-200 px-3 text-sm" />
            <button type="button" className="btn-outline !h-11 !rounded-xl px-4 text-sm font-bold">Aplicar query</button>
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
              <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Ej: Importadora Centro" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-zinc-700">Telefono (opcional)</label>
              <input value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} placeholder="Ej: 3511234567" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-zinc-700">Prioridad de busqueda</label>
              <input value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-zinc-700">Notas (opcional)</label>
            <textarea value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} rows={3} placeholder="Contacto, zona, tiempos, etc." className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm" />
          </div>
          <div className="rounded-2xl border border-zinc-200 p-4">
            <div className="mb-3 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1">
              <input id="draft-enabled" type="checkbox" checked={draft.enabled} onChange={(e) => setDraft((d) => ({ ...d, enabled: e.target.checked }))} className="h-4 w-4" />
              <label htmlFor="draft-enabled" className="text-sm font-bold text-zinc-900">Habilitar busqueda de repuestos</label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-bold text-zinc-700">Modo</label>
                <select value={draft.mode} onChange={(e) => setDraft((d) => ({ ...d, mode: e.target.value }))} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
                  <option>JSON API</option>
                  <option>HTML simple</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-zinc-700">Endpoint (usar {'{query}'})</label>
                <input value={draft.endpoint} onChange={(e) => setDraft((d) => ({ ...d, endpoint: e.target.value }))} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-sm font-bold text-zinc-700">Config JSON (opcional)</label>
              <textarea value={draft.configJson} onChange={(e) => setDraft((d) => ({ ...d, configJson: e.target.value }))} rows={3} className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm" />
            </div>
          </div>
          <button type="button" onClick={addProvider} className="btn-primary !h-11 !rounded-xl px-5 text-sm font-bold">Guardar proveedor</button>
        </div>
      </section>

      <section className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              <div className="grid grid-cols-[1.25fr_0.7fr_0.55fr_0.65fr_0.8fr_0.7fr_0.65fr_0.95fr_0.9fr_1.35fr] gap-3 bg-zinc-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500">
                <div>PROVEEDOR</div><div>TELEFONO</div><div className="text-right">PRODUCTOS</div><div className="text-right">INCIDENTES</div><div className="text-center">GARANTIAS OK</div><div className="text-right">PERDIDA</div><div className="text-center">PUNTUACION</div><div className="text-center">ESTADO</div><div className="text-center">ACCIONES</div><div className="text-left">CONFIG</div>
              </div>
              {ordered.map((p, idx) => (
                <div key={p.id} className={idx ? 'border-t border-zinc-100' : ''}>
                  <div className="grid grid-cols-[1.25fr_0.7fr_0.55fr_0.65fr_0.8fr_0.7fr_0.65fr_0.95fr_0.9fr_1.35fr] items-center gap-3 px-3 py-3">
                    <div className="text-lg font-black tracking-tight text-zinc-900">{p.name}</div>
                    <div className="text-sm text-zinc-500">{p.phone || '-'}</div>
                    <div className="text-right text-lg font-black text-zinc-900">{p.products}</div>
                    <div className="text-right text-lg font-black text-zinc-900">{p.incidents}</div>
                    <div className="text-center text-sm font-bold text-zinc-900">
                      <div>{p.warrantiesOk}/{p.warrantiesExpired}</div>
                      <div className="text-zinc-500">Sin garantias vencidas</div>
                    </div>
                    <div className={`text-right text-xl font-black ${p.loss > 0 ? 'text-rose-700' : 'text-zinc-900'}`}>{p.loss > 0 ? money(p.loss) : '$ 0'}</div>
                    <div className="text-center">
                      <div className="inline-flex h-8 items-center rounded-full border border-sky-200 bg-sky-50 px-3 text-sm font-black text-sky-700">{p.score}/100</div>
                      <div className="mt-1 text-xs font-bold text-zinc-700">{p.confidenceLabel}</div>
                      <div className="mt-1 text-xs text-zinc-500">{p.lastProbeAt} | q: "{p.lastQuery}" | n: {p.lastResults}</div>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex h-8 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-sm font-black text-emerald-700">{p.active ? 'Activo' : 'Inactivo'}</div>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" onClick={() => patchProvider(p.id, { searchEnabled: !p.searchEnabled })} className="inline-flex h-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-3 text-sm font-black text-sky-700">Buscador {p.searchEnabled ? 'ON' : 'OFF'}</button>
                      <button type="button" className="btn-outline !h-9 !rounded-xl px-3 text-sm font-bold">Probar busqueda</button>
                      <button type="button" onClick={() => patchProvider(p.id, { active: !p.active })} className="btn-outline !h-9 !rounded-xl px-3 text-sm font-bold">{p.active ? 'Desactivar' : 'Activar'}</button>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-[1.2fr_1fr] gap-2">
                        <input value={p.name} onChange={(e) => patchProvider(p.id, { name: e.target.value })} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
                        <input value={p.notes} onChange={(e) => patchProvider(p.id, { notes: e.target.value })} placeholder="Notas" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
                      </div>
                      <div className="grid grid-cols-[0.45fr_0.6fr_auto] gap-2 items-center">
                        <input value={String(p.priority)} onChange={(e) => patchProvider(p.id, { priority: Number(e.target.value) || p.priority })} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
                        <label className="flex items-center justify-center gap-2 text-sm font-bold text-zinc-700"><input type="checkbox" checked={p.searchEnabled} onChange={(e) => patchProvider(p.id, { searchEnabled: e.target.checked })} />Busqueda de repuestos habilitada</label>
                        <button type="button" className="text-sm font-black text-zinc-900">Actualizar</button>
                      </div>
                      <div className="grid grid-cols-[0.75fr_1.25fr] gap-2">
                        <select value={p.mode} onChange={(e) => patchProvider(p.id, { mode: e.target.value })} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm">
                          <option>HTML simple</option>
                          <option>JSON API</option>
                        </select>
                        <input value={p.endpoint} onChange={(e) => patchProvider(p.id, { endpoint: e.target.value })} className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
                      </div>
                      <textarea value={p.configJson} onChange={(e) => patchProvider(p.id, { configJson: e.target.value })} rows={2} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
                    </div>
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
