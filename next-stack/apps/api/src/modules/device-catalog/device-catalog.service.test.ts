import { describe, expect, it } from 'vitest';
import { DeviceCatalogService } from './device-catalog.service.js';

describe('DeviceCatalogService', () => {
  it('reuses an equivalent brand in the same device type instead of creating a duplicate', async () => {
    let createCalled = false;
    const service = new DeviceCatalogService({
      deviceBrand: {
        findMany: async () => [
          { id: 'brand_1', deviceTypeId: 'type_1', name: 'SAMSUNG', slug: 'samsung', active: true },
        ],
        create: async () => {
          createCalled = true;
          return null;
        },
      },
    } as never);

    await expect(service.createBrand({ deviceTypeId: 'type_1', name: ' samsung ', slug: 'samsung' })).resolves.toMatchObject({
      id: 'brand_1',
      name: 'SAMSUNG',
    });
    expect(createCalled).toBe(false);
  });

  it('uses a unique slug when creating the same brand name in another device type', async () => {
    let payload: { deviceTypeId: string | null; name: string; slug: string; active: boolean } | null = null;
    const service = new DeviceCatalogService({
      deviceBrand: {
        findMany: async () => [],
        findUnique: async ({ where }: { where: { slug: string } }) =>
          where.slug === 'samsung' ? { id: 'brand_other' } : null,
        create: async ({ data }: { data: { deviceTypeId: string | null; name: string; slug: string; active: boolean } }) => {
          payload = data;
          return data;
        },
      },
    } as never);

    await service.createBrand({ deviceTypeId: 'type_2', name: 'Samsung', slug: 'samsung' });

    expect(payload).toEqual({
      deviceTypeId: 'type_2',
      name: 'SAMSUNG',
      slug: 'samsung-2',
      active: true,
    });
  });

  it('reuses an equivalent issue in the same device type instead of creating a duplicate', async () => {
    let createCalled = false;
    const service = new DeviceCatalogService({
      deviceIssueType: {
        findMany: async () => [
          { id: 'issue_1', deviceTypeId: 'type_1', name: 'MODULO', slug: 'modulo', active: true },
        ],
        create: async () => {
          createCalled = true;
          return null;
        },
      },
    } as never);

    await expect(service.createIssue({ deviceTypeId: 'type_1', name: 'módulo', slug: 'modulo' })).resolves.toMatchObject({
      id: 'issue_1',
      name: 'MODULO',
    });
    expect(createCalled).toBe(false);
  });

  it('stores model names in uppercase when creating them', async () => {
    let payload: { brandId: string; name: string; slug: string; active: boolean } | null = null;
    const service = new DeviceCatalogService({
      deviceModel: {
        findMany: async () => [],
        create: async ({ data }: { data: { brandId: string; name: string; slug: string; active: boolean } }) => {
          payload = data;
          return data;
        },
      },
    } as never);

    await service.createModel({ brandId: 'brand_1', name: 'a13', slug: 'a13' });

    expect(payload).toEqual({
      brandId: 'brand_1',
      name: 'A13',
      slug: 'a13',
      active: true,
    });
  });

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
