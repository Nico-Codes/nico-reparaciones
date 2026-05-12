import type { AdminProviderItem } from '@/features/admin/api';
import {
  type AdminProviderDraft,
  type ProviderConfirmAction,
  type ProvidersSummary,
} from './admin-providers.helpers';
import {
  ProvidersCreatePanel,
  ProvidersPriorityPanel,
  ProvidersStatsPanel,
  ProvidersTablePanel,
} from './admin-providers-panels';

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
  return <ProvidersStatsPanel summary={summary} />;
}

export function ProvidersPrioritySection(props: {
  ordered: AdminProviderItem[];
  savingOrder: boolean;
  onMovePriority: (id: string, dir: -1 | 1) => void;
  onSaveOrder: () => void;
  onRequestToggle: (provider: AdminProviderItem) => void;
  onRequestDelete: (provider: AdminProviderItem) => void;
}) {
  return <ProvidersPriorityPanel {...props} />;
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

export function ProvidersCreateSection(props: {
  draft: AdminProviderDraft;
  onDraftChange: (patch: Partial<AdminProviderDraft>) => void;
  onSave: () => void;
}) {
  return <ProvidersCreatePanel {...props} />;
}

export function ProvidersTableSection(props: {
  loading: boolean;
  ordered: AdminProviderItem[];
  onPatchProvider: (id: string, patch: Partial<AdminProviderItem>) => void;
  onSaveProvider: (provider: AdminProviderItem) => void;
  onRequestToggle: (provider: AdminProviderItem) => void;
  onRequestDelete: (provider: AdminProviderItem) => void;
  onProbeProvider: (provider: AdminProviderItem) => void;
}) {
  return <ProvidersTablePanel {...props} />;
}

export function ProvidersConfirmDialog(props: {
  action: ProviderConfirmAction | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { action, pending, onCancel, onConfirm } = props;
  if (!action) return null;

  const isDelete = action.type === 'delete';
  const title = isDelete ? 'Eliminar proveedor' : action.provider.active ? 'Desactivar proveedor' : 'Activar proveedor';
  const confirmLabel = isDelete ? 'Eliminar definitivamente' : action.provider.active ? 'Desactivar' : 'Activar';
  const warning = isDelete
    ? 'Esta accion elimina el proveedor del registro. Si tenia productos o movimientos asociados, el historial queda sin proveedor vinculado.'
    : action.provider.active
      ? 'El proveedor dejara de aparecer como activo y no participara en operaciones normales hasta que lo vuelvas a activar.'
      : 'El proveedor volvera a estar disponible para operaciones y configuraciones activas.';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="provider-confirm-title">
      <button type="button" className="absolute inset-0 bg-slate-950/45" aria-label="Cerrar confirmacion" onClick={pending ? undefined : onCancel} />
      <div className="relative w-full max-w-lg rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-2xl">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Confirmacion requerida</div>
        <h2 id="provider-confirm-title" className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{warning}</p>
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Proveedor: <span className="font-black">{action.provider.name}</span>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={pending} className="btn-outline !h-11 !rounded-xl px-5 text-sm font-bold disabled:opacity-60">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`${isDelete ? 'bg-rose-600 text-white hover:bg-rose-700' : 'btn-primary'} inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-black disabled:opacity-60`}
          >
            {pending ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
