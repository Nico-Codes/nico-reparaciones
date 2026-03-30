import { describe, expect, it } from 'vitest';
import { AdminWarrantyRegistryService } from './admin-warranty-registry.service.js';

describe('AdminWarrantyRegistryService', () => {
  it('normalizes warranty incidents from persistence rows', async () => {
    const service = new AdminWarrantyRegistryService({
      warrantyIncident: {
        findMany: async () => [
          {
            id: 'inc_1',
            sourceType: 'other',
            status: 'other',
            title: '  Modulo roto  ',
            reason: '  Golpe  ',
            repairId: ' rep_1 ',
            productId: null,
            orderId: ' ',
            supplierId: ' sup_1 ',
            quantity: 0.2,
            unitCost: '10.5',
            costOrigin: 'other',
            extraCost: '1.25',
            recoveredAmount: '2',
            lossAmount: '9.75',
            happenedAt: new Date('2026-03-28T10:00:00.000Z'),
            resolvedAt: null,
            notes: '  revisar  ',
            createdBy: ' usr_1 ',
            createdAt: new Date('2026-03-28T10:00:00.000Z'),
            updatedAt: new Date('2026-03-28T11:00:00.000Z'),
          },
        ],
      },
    } as never);

    const [row] = await service.readIncidents();

    expect(row).toMatchObject({
      id: 'inc_1',
      sourceType: 'repair',
      status: 'open',
      title: 'Modulo roto',
      reason: 'Golpe',
      repairId: 'rep_1',
      orderId: null,
      supplierId: 'sup_1',
      quantity: 1,
      unitCost: 10.5,
      costOrigin: 'manual',
      extraCost: 1.25,
      recoveredAmount: 2,
      lossAmount: 9.75,
      notes: 'revisar',
      createdBy: 'usr_1',
    });
  });
});
