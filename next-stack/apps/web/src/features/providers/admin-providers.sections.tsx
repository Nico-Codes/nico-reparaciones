import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import type { AdminProviderItem } from '@/features/admin/api';
import {
  money,
  providerModeOptions,
  type AdminProviderDraft,
  type ProvidersSummary,
} from './admin-providers.helpers';

export function ProvidersFeedback({ error, message }: { error: string; message: string }) {
  return (
    <>
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>
      ) : null}
    </>
  );
}

export function ProvidersStatsGrid({ summary }: { summary: ProvidersSummary }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="INCIDENTES" value={String(summary.totalIncidents)} />
      <StatCard title="ABIERTOS" value={String(summary.openIncidents)} valueClass="text-amber-600" />
      <StatCard title="CERRADOS" value={String(summary.closedIncidents)} />
      <StatCard title="PERDIDA" value={money(summary.accumulatedLoss)} valueClass="text-rose-700" />
    </div>
  );
}

export function ProvidersPrioritySection({
  ordered,
  savingOrder,
  onMovePriority,
  onSaveOrder,
}: {
  ordered: AdminProviderItem[];
  savingOrder: boolean;
  onMovePriority: (id: string, dir: -1 | 1) => void;
  onSaveOrder: () => void;
}) {
  return (
    <section className="card">
      <div className="card-head flex items-center justify-between gap-2">
        <div className="text-xl font-black tracking-tight text-zinc-900">Prioridad de busqueda</div>
        <span className="badge-zinc">Ajuste manual</span>
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
              <button type="button" onClick={() => onMovePriority(provider.id, -1)} className="btn-ghost !h-8 !w-8 !rounded-xl p-0 text-base font-black">
                ↑
              </button>
              <button type="button" onClick={() => onMovePriority(provider.id, 1)} className="btn-ghost !h-8 !w-8 !rounded-xl p-0 text-base font-black">
                ↓
              </button>
            </div>
          </div>
        ))}
        <button type="button" disabled={savingOrder} onClick={onSaveOrder} className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold disabled:opacity-60">
          {savingOrder ? 'Guardando...' : 'Guardar orden'}
        </button>
        <p className="text-sm text-zinc-500">Este orden se usa en la busqueda progresiva de repuestos.</p>
      </div>
    </section>
  );
}

export function ProvidersProbeSection({
  testQuery,
  onTestQueryChange,
}: {
  testQuery: string;
  onTestQueryChange: (value: string) => void;
}) {
  return (
    <section className="card">
      <div className="card-body">
        <label className="mb-2 block text-sm font-bold text-zinc-900">Query de prueba para "Probar busqueda"</label>
        <div className="flex flex-wrap gap-2">
          <input
            value={testQuery}
            onChange={(event) => onTestQueryChange(event.target.value)}
            className="h-11 min-w-[260px] flex-1 rounded-2xl border border-zinc-200 px-3 text-sm"
          />
        </div>
      </div>
    </section>
  );
}

export function ProvidersCreateSection({
  draft,
  onDraftChange,
  onSave,
}: {
  draft: AdminProviderDraft;
  onDraftChange: (patch: Partial<AdminProviderDraft>) => void;
  onSave: () => void;
}) {
  return (
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
              onChange={(event) => onDraftChange({ name: event.target.value })}
              placeholder="Ej: Importadora Centro"
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-zinc-700">Telefono (opcional)</label>
            <input
              value={draft.phone}
              onChange={(event) => onDraftChange({ phone: event.target.value })}
              placeholder="Ej: 3511234567"
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-bold text-zinc-700">Prioridad de busqueda</label>
            <input
              value={draft.priority}
              onChange={(event) => onDraftChange({ priority: event.target.value })}
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-zinc-700">Notas (opcional)</label>
          <textarea
            value={draft.notes}
            onChange={(event) => onDraftChange({ notes: event.target.value })}
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
              onChange={(event) => onDraftChange({ enabled: event.target.checked })}
              className="h-4 w-4"
            />
            <label htmlFor="draft-enabled" className="text-sm font-bold text-zinc-900">
              Habilitar busqueda de repuestos
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-zinc-700">Modo</label>
              <CustomSelect
                value={draft.mode}
                onChange={(value) => onDraftChange({ mode: value })}
                options={providerModeOptions}
                triggerClassName="min-h-11 rounded-2xl font-bold"
                ariaLabel="Seleccionar modo de busqueda"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-zinc-700">Endpoint (usar {'{query}'})</label>
              <input
                value={draft.endpoint}
                onChange={(event) => onDraftChange({ endpoint: event.target.value })}
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-bold text-zinc-700">Config JSON (opcional)</label>
            <textarea
              value={draft.configJson}
              onChange={(event) => onDraftChange({ configJson: event.target.value })}
              rows={3}
              className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button type="button" onClick={onSave} className="btn-primary !h-11 !rounded-xl px-5 text-sm font-bold">
          Guardar proveedor
        </button>
      </div>
    </section>
  );
}

export function ProvidersTableSection({
  loading,
  ordered,
  onPatchProvider,
  onSaveProvider,
  onToggleProvider,
  onProbeProvider,
}: {
  loading: boolean;
  ordered: AdminProviderItem[];
  onPatchProvider: (id: string, patch: Partial<AdminProviderItem>) => void;
  onSaveProvider: (provider: AdminProviderItem) => void;
  onToggleProvider: (provider: AdminProviderItem) => void;
  onProbeProvider: (provider: AdminProviderItem) => void;
}) {
  return (
    <section className="card">
      <div className="card-body p-0">
        {loading ? (
          <div className="p-5 text-sm text-zinc-600">Cargando proveedores...</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              <div className="grid grid-cols-[1.25fr_0.7fr_0.55fr_0.65fr_0.8fr_0.7fr_0.65fr_0.95fr_0.9fr_1.35fr] gap-3 bg-zinc-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500">
                <div>PROVEEDOR</div>
                <div>TELEFONO</div>
                <div className="text-right">PRODUCTOS</div>
                <div className="text-right">INCIDENTES</div>
                <div className="text-center">GARANTIAS OK</div>
                <div className="text-right">PERDIDA</div>
                <div className="text-center">PUNTUACION</div>
                <div className="text-center">ESTADO</div>
                <div className="text-center">ACCIONES</div>
                <div className="text-left">CONFIG</div>
              </div>
              {ordered.map((provider, idx) => (
                <ProviderRow
                  key={provider.id}
                  provider={provider}
                  bordered={Boolean(idx)}
                  onPatchProvider={onPatchProvider}
                  onSaveProvider={onSaveProvider}
                  onToggleProvider={onToggleProvider}
                  onProbeProvider={onProbeProvider}
                />
              ))}
              {!ordered.length ? <div className="px-4 py-8 text-center text-sm text-zinc-600">Aun no hay proveedores cargados.</div> : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ProviderRow({
  provider,
  bordered,
  onPatchProvider,
  onSaveProvider,
  onToggleProvider,
  onProbeProvider,
}: {
  provider: AdminProviderItem;
  bordered: boolean;
  onPatchProvider: (id: string, patch: Partial<AdminProviderItem>) => void;
  onSaveProvider: (provider: AdminProviderItem) => void;
  onToggleProvider: (provider: AdminProviderItem) => void;
  onProbeProvider: (provider: AdminProviderItem) => void;
}) {
  return (
    <div className={bordered ? 'border-t border-zinc-100' : ''}>
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
            {provider.lastProbeAt} | q: "{provider.lastQuery}" | n: {provider.lastResults}
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
            onClick={() => onSaveProvider({ ...provider, searchEnabled: !provider.searchEnabled })}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-3 text-sm font-black text-sky-700"
          >
            Buscador {provider.searchEnabled ? 'ON' : 'OFF'}
          </button>
          <button type="button" onClick={() => onProbeProvider(provider)} className="btn-outline !h-9 !rounded-xl px-3 text-sm font-bold">
            Probar busqueda
          </button>
          <button type="button" onClick={() => onToggleProvider(provider)} className="btn-outline !h-9 !rounded-xl px-3 text-sm font-bold">
            {provider.active ? 'Desactivar' : 'Activar'}
          </button>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-[1.2fr_1fr] gap-2">
            <input
              value={provider.name}
              onChange={(event) => onPatchProvider(provider.id, { name: event.target.value })}
              className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
            />
            <input
              value={provider.notes}
              onChange={(event) => onPatchProvider(provider.id, { notes: event.target.value })}
              placeholder="Notas"
              className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
            />
          </div>
          <div className="grid grid-cols-[0.45fr_0.6fr_auto] items-center gap-2">
            <input
              value={String(provider.priority)}
              onChange={(event) => onPatchProvider(provider.id, { priority: Number(event.target.value) || provider.priority })}
              className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
            />
            <label className="flex items-center justify-center gap-2 text-sm font-bold text-zinc-700">
              <input
                type="checkbox"
                checked={provider.searchEnabled}
                onChange={(event) => onPatchProvider(provider.id, { searchEnabled: event.target.checked })}
              />
              Busqueda habilitada
            </label>
            <button type="button" onClick={() => onSaveProvider(provider)} className="text-sm font-black text-zinc-900">
              Actualizar
            </button>
          </div>
          <div className="grid grid-cols-[0.75fr_1.25fr] gap-2">
            <CustomSelect
              value={provider.mode}
              onChange={(value) => onPatchProvider(provider.id, { mode: value })}
              options={providerModeOptions}
              triggerClassName="h-10 min-h-10 rounded-xl px-3 text-sm font-bold"
              ariaLabel="Seleccionar modo de proveedor"
            />
            <input
              value={provider.endpoint}
              onChange={(event) => onPatchProvider(provider.id, { endpoint: event.target.value })}
              className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
            />
          </div>
          <textarea
            value={provider.configJson}
            onChange={(event) => onPatchProvider(provider.id, { configJson: event.target.value })}
            rows={2}
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, valueClass }: { title: string; value: string; valueClass?: string }) {
  return (
    <section className="card">
      <div className="card-body">
        <div className="text-sm font-black uppercase tracking-wide text-zinc-500">{title}</div>
        <div className={`mt-2 text-5xl font-black tracking-tight ${valueClass ?? 'text-zinc-900'}`}>{value}</div>
      </div>
    </section>
  );
}
