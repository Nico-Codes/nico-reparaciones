import { describe, expect, it } from 'vitest';
import { DeviceCatalogService } from './device-catalog.service.js';

describe('DeviceCatalogService', () => {
  it('blocks creating a model when an equivalent name already exists in the brand', async () => {
    const service = new DeviceCatalogService({
      deviceModel: {
        findMany: async () => [
          { id: 'model_1', name: 'A13', slug: 'A13' },
        ],
      },
    } as never);

    await expect(service.createModel({ brandId: 'brand_1', name: 'a 13', slug: 'a-13' })).rejects.toThrow(
      'Ya existe un modelo equivalente dentro de esta marca: "A13". Reutilizalo o renombralo antes de crear otro.',
    );
  });

  it('blocks renaming a model to an equivalent name already used by another model in the brand', async () => {
    const service = new DeviceCatalogService({
      deviceModel: {
        findUnique: async () => ({ id: 'model_2', brandId: 'brand_1', name: 'A14', slug: 'a14' }),
        findMany: async () => [
          { id: 'model_1', name: 'A13', slug: 'A13' },
          { id: 'model_2', name: 'A14', slug: 'a14' },
        ],
      },
    } as never);

    await expect(service.updateModel('model_2', { name: 'a13' })).rejects.toThrow(
      'Ya existe un modelo equivalente dentro de esta marca: "A13". Reutilizalo o renombralo antes de crear otro.',
    );
  });

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
