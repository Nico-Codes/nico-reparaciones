import { describe, expect, it } from 'vitest';
import type { AdminProviderItem } from '@/features/admin/api';
import {
  buildProvidersSummary,
  createInitialProviderDraft,
  moveProviderPriority,
  patchProviderList,
  sortProvidersByPriority,
  toSearchMode,
} from './admin-providers.helpers';

function makeProvider(input: Partial<AdminProviderItem> & Pick<AdminProviderItem, 'id' | 'name' | 'priority'>): AdminProviderItem {
  return {
    id: input.id,
    name: input.name,
    priority: input.priority,
    phone: input.phone ?? '',
    products: input.products ?? 0,
    incidents: input.incidents ?? 0,
    warrantiesOk: input.warrantiesOk ?? 0,
    warrantiesExpired: input.warrantiesExpired ?? 0,
    loss: input.loss ?? 0,
    score: input.score ?? 0,
    confidenceLabel: input.confidenceLabel ?? 'Media',
    active: input.active ?? true,
    searchEnabled: input.searchEnabled ?? true,
    searchInRepairs: input.searchInRepairs ?? false,
    statusProbe: input.statusProbe ?? 'none',
    lastProbeAt: input.lastProbeAt ?? '-',
    lastQuery: input.lastQuery ?? '',
    lastResults: input.lastResults ?? 0,
    mode: input.mode ?? 'JSON API',
    endpoint: input.endpoint ?? '',
    configJson: input.configJson ?? '',
    notes: input.notes ?? '',
  };
}

describe('admin-providers helpers', () => {
  it('creates the default provider draft with search enabled', () => {
    expect(createInitialProviderDraft()).toMatchObject({
      name: '',
      priority: '100',
      enabled: true,
      searchInRepairs: false,
      mode: 'JSON API',
    });
  });

  it('normalizes provider search mode labels', () => {
    expect(toSearchMode('JSON API')).toBe('json');
    expect(toSearchMode('HTML simple')).toBe('html');
  });

  it('sorts and reorders providers by priority', () => {
    const providers = [
      makeProvider({ id: 'b', name: 'B', priority: 20 }),
      makeProvider({ id: 'a', name: 'A', priority: 10 }),
    ];

    expect(sortProvidersByPriority(providers).map((provider) => provider.id)).toEqual(['a', 'b']);
    expect(moveProviderPriority(providers, 'b', -1).map((provider) => provider.id)).toEqual(['b', 'a']);
  });

  it('builds summary stats and patches a single provider', () => {
    const providers = [
      makeProvider({ id: 'a', name: 'A', priority: 10, incidents: 2, warrantiesOk: 1, warrantiesExpired: 1, loss: 150 }),
      makeProvider({ id: 'b', name: 'B', priority: 20, incidents: 3, warrantiesOk: 2, warrantiesExpired: 1, loss: 50 }),
    ];

    expect(buildProvidersSummary(providers)).toEqual({
      totalIncidents: 5,
      openIncidents: 2,
      closedIncidents: 3,
      accumulatedLoss: 200,
    });

    expect(patchProviderList(providers, 'b', { notes: 'ok' })[1].notes).toBe('ok');
  });
});
