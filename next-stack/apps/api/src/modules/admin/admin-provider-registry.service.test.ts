import { describe, expect, it } from 'vitest';
import { AdminProviderRegistryService } from './admin-provider-registry.service.js';

function createService() {
  return new AdminProviderRegistryService({} as never, {} as never);
}

function createRegistryPrisma(initialRows: Array<Record<string, unknown>>) {
  const rows = [...initialRows];

  const txSupplier = {
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { id: string };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }) => {
      const index = rows.findIndex((item) => item.id === where.id);
      if (index >= 0) {
        rows[index] = {
          ...rows[index],
          ...update,
        };
        return rows[index];
      }
      rows.push(create);
      return create;
    },
    deleteMany: async ({ where }: { where?: { id?: { notIn?: string[] } } } = {}) => {
      const keepIds = where?.id?.notIn;
      if (!keepIds) {
        rows.splice(0, rows.length);
        return { count: 0 };
      }

      const keep = new Set(keepIds);
      let deleted = 0;
      for (let index = rows.length - 1; index >= 0; index -= 1) {
        if (!keep.has(String(rows[index]?.id ?? ''))) {
          rows.splice(index, 1);
          deleted += 1;
        }
      }
      return { count: deleted };
    },
  };

  return {
    rows,
    prisma: {
      supplier: {
        findMany: async () => rows,
      },
      product: {
        groupBy: async () => [],
      },
      $transaction: async (callback: (tx: { supplier: typeof txSupplier }) => Promise<unknown>) =>
        callback({ supplier: txSupplier }),
    },
  };
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

  it('imports default providers by canonical name without duplicating existing rows', async () => {
    const now = new Date('2026-04-15T12:00:00.000Z');
    const { rows, prisma } = createRegistryPrisma([
      {
        id: 'sup_evophone',
        name: 'eVoPhOnE',
        phone: null,
        notes: null,
        active: true,
        searchPriority: 999,
        searchEnabled: false,
        searchMode: 'html',
        searchEndpoint: 'https://legacy.example/search?q={query}',
        searchConfigJson: '{"legacy":true}',
        lastProbeStatus: 'none',
        lastProbeQuery: null,
        lastProbeCount: 0,
        lastProbeError: null,
        lastProbeAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'sup_custom',
        name: 'Proveedor Personalizado',
        phone: null,
        notes: null,
        active: true,
        searchPriority: 500,
        searchEnabled: false,
        searchMode: 'html',
        searchEndpoint: null,
        searchConfigJson: null,
        lastProbeStatus: 'none',
        lastProbeQuery: null,
        lastProbeCount: 0,
        lastProbeError: null,
        lastProbeAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const service = new AdminProviderRegistryService(
      prisma as never,
      { readIncidents: async () => [] } as never,
    );

    const result = await service.importDefaultProviders();

    expect(result.updated).toBe(1);
    expect(result.created).toBe(7);
    expect(rows.filter((item) => String(item.name).toLowerCase() === 'evophone')).toHaveLength(1);
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'sup_evophone',
          searchPriority: 20,
          searchEnabled: true,
          searchMode: 'html',
          searchEndpoint: 'https://www.evophone.com.ar/?s={query}&post_type=product&dgwt_wcas=1',
          searchConfigJson: expect.stringContaining('"profile":"woodmart"'),
        }),
        expect.objectContaining({
          id: 'sup_custom',
          name: 'Proveedor Personalizado',
        }),
        expect.objectContaining({
          name: 'El Reparador de PC',
          searchMode: 'json',
          searchEndpoint: 'https://api.elreparadordepc.com/api/web/tenant/www?in_stock=false&q={query}',
        }),
      ]),
    );
  });
});
