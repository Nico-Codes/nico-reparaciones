import { describe, expect, it } from 'vitest';
import { AdminFinanceService } from './admin-finance.service.js';

describe('AdminFinanceService', () => {
  it('builds accounting summary from delivered orders and warranty incidents', async () => {
    const now = new Date().toISOString();
    const service = new AdminFinanceService(
      {
        order: {
          findMany: async () => [
            {
              id: 'ord_12345678',
              createdAt: new Date(now),
              total: '1000',
            },
          ],
        },
      } as never,
      {
        readIncidents: async () => [
          {
            id: 'inc_1',
            title: 'Pantalla',
            happenedAt: now,
            recoveredAmount: 100,
            lossAmount: 250,
          },
        ],
      } as never,
    );

    const result = await service.accounting();

    expect(result.summary).toMatchObject({
      entriesCount: 3,
      inflowTotal: 1100,
      outflowTotal: 250,
      netTotal: 850,
    });
    expect(result.categories).toEqual(['order_sale', 'warranty_loss', 'warranty_recovery']);
    expect(result.items[0]).toHaveProperty('direction');
  });
});
