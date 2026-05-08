import { describe, expect, it } from 'vitest';
import { slugifyDeviceCatalogValue } from './device-catalog.helpers';

describe('device-catalog.helpers', () => {
  it('normalizes device catalog labels into stable slugs', () => {
    expect(slugifyDeviceCatalogValue('Samsung Galaxy A13')).toBe('samsung-galaxy-a13');
    expect(slugifyDeviceCatalogValue('Cambio de Módulo / Pin de carga')).toBe('cambio-de-modulo-pin-de-carga');
    expect(slugifyDeviceCatalogValue('  iPhone 15 Pro Max  ')).toBe('iphone-15-pro-max');
  });
});
