import { CustomSelect } from '@/components/ui/custom-select';
import type { AdminProviderItem } from '@/features/admin/api';
import {
  type AdminProviderDraft,
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
  onToggleProvider: (provider: AdminProviderItem) => void;
  onProbeProvider: (provider: AdminProviderItem) => void;
}) {
  return <ProvidersTablePanel {...props} />;
}
