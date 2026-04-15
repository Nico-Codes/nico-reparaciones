import type { AdminProviderItem } from '@/features/admin/api';

export type AdminProviderDraft = {
  name: string;
  phone: string;
  priority: string;
  notes: string;
  enabled: boolean;
  searchInRepairs: boolean;
  mode: string;
  endpoint: string;
  configJson: string;
};

export type ProvidersSummary = {
  totalIncidents: number;
  openIncidents: number;
  closedIncidents: number;
  accumulatedLoss: number;
};

export const providerModeOptions = [
  { value: 'JSON API', label: 'JSON API' },
  { value: 'HTML simple', label: 'HTML simple' },
];

export function money(value: number) {
  return `$ ${value.toLocaleString('es-AR')}`;
}

export function toSearchMode(modeLabel: string) {
  return modeLabel.toLowerCase().includes('json') ? 'json' : 'html';
}

export function createInitialProviderDraft(): AdminProviderDraft {
  return {
    name: '',
    phone: '',
    priority: '100',
    notes: '',
    enabled: true,
    searchInRepairs: false,
    mode: 'JSON API',
    endpoint: 'https://proveedor.com/api/search?q={query}',
    configJson:
      '{"items_path":"items","name_field":"title","price_field":"price","stock_field":"stock","url_field":"url"}',
  };
}

export function sortProvidersByPriority(providers: AdminProviderItem[]) {
  return [...providers].sort((a, b) => a.priority - b.priority);
}

export function buildProvidersSummary(providers: AdminProviderItem[]): ProvidersSummary {
  return providers.reduce<ProvidersSummary>(
    (acc, provider) => {
      acc.totalIncidents += provider.incidents;
      acc.openIncidents += provider.warrantiesExpired;
      acc.closedIncidents += provider.warrantiesOk;
      acc.accumulatedLoss += provider.loss;
      return acc;
    },
    {
      totalIncidents: 0,
      openIncidents: 0,
      closedIncidents: 0,
      accumulatedLoss: 0,
    },
  );
}

export function moveProviderPriority(providers: AdminProviderItem[], id: string, dir: -1 | 1) {
  const sorted = sortProvidersByPriority(providers).map((provider) => ({ ...provider }));
  const idx = sorted.findIndex((provider) => provider.id === id);
  const target = idx + dir;
  if (idx < 0 || target < 0 || target >= sorted.length) return providers;

  const current = sorted[idx];
  const other = sorted[target];
  const currentPriority = current.priority;
  current.priority = other.priority;
  other.priority = currentPriority;
  return sortProvidersByPriority(sorted);
}

export function patchProviderList(providers: AdminProviderItem[], id: string, patch: Partial<AdminProviderItem>) {
  return providers.map((provider) => (provider.id === id ? { ...provider, ...patch } : provider));
}
