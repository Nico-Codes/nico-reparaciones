import { describe, expect, it } from 'vitest';
import { DeviceCatalogService } from './device-catalog.service.js';

describe('DeviceCatalogService', () => {
  it('blocks deleting a brand used by repairs', async () => {
    const service = new DeviceCatalogService({
      repair: {
        count: async ({ where }: { where: { deviceBrandId?: string } }) => (where.deviceBrandId === 'brand_1' ? 1 : 0),
      },
      repairPricingRule: {
        count: async () => 0,
      },
    } as never);

    await expect(service.deleteBrand('brand_1')).rejects.toThrow(
      'No se puede eliminar la marca porque ya esta en uso por reparaciones o reglas de precio. Desactivala si no queres usarla mas.',
    );
  });

  it('blocks deleting an issue used by pricing rules', async () => {
    const service = new DeviceCatalogService({
      repair: {
        count: async () => 0,
      },
      repairPricingRule: {
        count: async ({ where }: { where: { deviceIssueTypeId?: string } }) =>
          where.deviceIssueTypeId === 'issue_1' ? 2 : 0,
      },
    } as never);

    await expect(service.deleteIssue('issue_1')).rejects.toThrow(
      'No se puede eliminar la falla porque ya esta en uso por reparaciones o reglas de precio. Desactivala si no queres usarla mas.',
    );
  });

  it('deletes a model when it is unused', async () => {
    let deletedId = '';
    const service = new DeviceCatalogService({
      repair: {
        count: async () => 0,
      },
      repairPricingRule: {
        count: async () => 0,
      },
      deviceModel: {
        delete: async ({ where }: { where: { id: string } }) => {
          deletedId = where.id;
          return { id: where.id };
        },
      },
    } as never);

    await expect(service.deleteModel('model_ok')).resolves.toEqual({ ok: true });
    expect(deletedId).toBe('model_ok');
  });
});
