import { describe, expect, it } from 'vitest';
import { AdminProviderRegistryService } from './admin-provider-registry.service.js';

function createService() {
  return new AdminProviderRegistryService({} as never, {} as never);
}

describe('AdminProviderRegistryService', () => {
  it('serializes provider score and probe metadata', () => {
    const service = createService();

    const item = service.serializeProvider(
      {
        id: 'sup_1',
        name: 'Proveedor Demo',
        phone: null,
        notes: 'Notas',
        active: true,
        searchPriority: 20,
        searchEnabled: true,
        searchMode: 'html',
        searchEndpoint: 'https://example.com?q={query}',
        searchConfigJson: '{"mode":"html"}',
        lastProbeStatus: 'ok',
        lastProbeQuery: 'modulo a30',
        lastProbeCount: 4,
        lastProbeError: null,
        lastProbeAt: '2026-03-30T12:00:00.000Z',
        createdAt: '2026-03-30T11:00:00.000Z',
        updatedAt: '2026-03-30T12:00:00.000Z',
      },
      { incidents: 3, openIncidents: 1, closedIncidents: 2, loss: 5000 },
      7,
    );

    expect(item).toMatchObject({
      id: 'sup_1',
      name: 'Proveedor Demo',
      priority: 20,
      products: 7,
      incidents: 3,
      warrantiesOk: 2,
      warrantiesExpired: 1,
      searchEnabled: true,
      statusProbe: 'ok',
      lastResults: 4,
      mode: 'HTML simple',
    });
    expect(item.score).toBeGreaterThan(0);
  });
});
