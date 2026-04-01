import { describe, expect, it } from 'vitest';
import { buildDeviceTypeDisplaySlug, buildDeviceTypeUpdateInput, updateDeviceTypeRows } from './admin-device-types.helpers';

describe('admin-device-types.helpers', () => {
  it('resuelve slug de display con fallback', () => {
    expect(buildDeviceTypeDisplaySlug({ name: 'Consola', slug: '', active: true } as never)).toBe('consola');
  });

  it('arma payload de update', () => {
    expect(buildDeviceTypeUpdateInput({ name: ' Tablet ', active: true } as never)).toEqual({ name: 'Tablet', active: true });
  });

  it('actualiza filas localmente', () => {
    expect(updateDeviceTypeRows([{ id: '1', name: 'A', slug: 'a', active: true }], '1', { active: false })[0].active).toBe(false);
  });
});
