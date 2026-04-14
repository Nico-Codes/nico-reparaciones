import { describe, expect, it } from 'vitest';
import { buildRepairTypeCreateInput, buildRepairTypeUpdateInput, updateRepairTypeRows } from './admin-repair-types.helpers';

describe('admin-repair-types.helpers', () => {
  it('arma el payload de alta con slug', () => {
    expect(buildRepairTypeCreateInput('Pantalla rota', true, 'type-phone')).toEqual({
      deviceTypeId: 'type-phone',
      name: 'Pantalla rota',
      slug: 'pantalla-rota',
      active: true,
    });
  });

  it('arma el payload de update con fallback slug', () => {
    expect(buildRepairTypeUpdateInput({ name: 'Modulo', slug: '', active: true } as never).slug).toBe('modulo');
  });

  it('actualiza una fila localmente', () => {
    expect(updateRepairTypeRows([{ id: '1', name: 'A', slug: 'a', active: true }], '1', { name: 'B' })[0].name).toBe('B');
  });
});
