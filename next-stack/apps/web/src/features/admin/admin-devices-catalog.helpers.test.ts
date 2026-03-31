import { describe, expect, it } from 'vitest';
import {
  buildBrandOptions,
  buildDeviceTypeOptions,
  getActiveBrands,
  getDefaultDeviceTypeId,
  getFilteredModels,
  slugify,
  type BrandItem,
  type DeviceTypeItem,
  type ModelItem,
} from './admin-devices-catalog.helpers';

describe('admin-devices-catalog.helpers', () => {
  it('slugifies names and resolves the first active device type', () => {
    const types: DeviceTypeItem[] = [
      { id: '1', name: 'Tablet', slug: 'tablet', active: false },
      { id: '2', name: 'Telefono', slug: 'telefono', active: true },
    ];

    expect(slugify('Cambio de Módulo')).toBe('cambio-de-modulo');
    expect(getDefaultDeviceTypeId(types)).toBe('2');
  });

  it('filters active brands and builds select options', () => {
    const brands: BrandItem[] = [
      { id: 'b1', name: 'Samsung', slug: 'samsung', active: true, deviceTypeId: '2' },
      { id: 'b2', name: 'Motorola', slug: 'motorola', active: false, deviceTypeId: '2' },
    ];

    const activeBrands = getActiveBrands(brands);
    expect(activeBrands).toHaveLength(1);
    expect(buildBrandOptions(activeBrands)).toEqual([
      { value: '', label: 'Samsung' },
      { value: 'b1', label: 'Samsung' },
    ]);
    expect(buildDeviceTypeOptions([{ id: '2', name: 'Telefono', slug: 'telefono', active: true }])).toEqual([
      { value: '', label: 'Elegi...' },
      { value: '2', label: 'Telefono' },
    ]);
  });

  it('filters models by selected brand only when needed', () => {
    const models: ModelItem[] = [
      {
        id: 'm1',
        brandId: 'b1',
        name: 'A52',
        slug: 'a52',
        active: true,
        brand: { id: 'b1', name: 'Samsung', slug: 'samsung' },
      },
      {
        id: 'm2',
        brandId: 'b2',
        name: 'G52',
        slug: 'g52',
        active: true,
        brand: { id: 'b2', name: 'Motorola', slug: 'motorola' },
      },
    ];

    expect(getFilteredModels(models, '')).toHaveLength(2);
    expect(getFilteredModels(models, 'b1')).toEqual([models[0]]);
  });
});
