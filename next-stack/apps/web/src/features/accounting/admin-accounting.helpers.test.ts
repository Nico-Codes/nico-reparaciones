import { describe, expect, it } from 'vitest';
import {
  buildAccountingCategoryOptions,
  buildAccountingRequestParams,
  formatAccountingMoney,
  hasAccountingFilters,
  resolveAccountingAmountTone,
  resolveAccountingDirectionClass,
  resolveAccountingNetTone,
} from './admin-accounting.helpers';

describe('admin-accounting.helpers', () => {
  it('formats money and build category options', () => {
    expect(formatAccountingMoney(12500)).toBe('$ 12.500');
    expect(buildAccountingCategoryOptions(['Ventas', 'Compras'])).toEqual([
      { value: '', label: 'Categoria: Todas' },
      { value: 'Ventas', label: 'Ventas' },
      { value: 'Compras', label: 'Compras' },
    ]);
  });

  it('builds accounting request params trimming empty values', () => {
    expect(
      buildAccountingRequestParams({
        q: '  filtro  ',
        direction: 'inflow',
        category: '',
        from: '2026-03-01',
        to: '',
      }),
    ).toEqual({
      q: 'filtro',
      direction: 'inflow',
      category: undefined,
      from: '2026-03-01',
      to: undefined,
    });
  });

  it('resolves tones and active filters correctly', () => {
    expect(resolveAccountingNetTone(10)).toBe('text-emerald-700');
    expect(resolveAccountingNetTone(-10)).toBe('text-rose-700');
    expect(resolveAccountingDirectionClass('Ingreso')).toContain('emerald');
    expect(resolveAccountingDirectionClass('Egreso')).toContain('rose');
    expect(resolveAccountingAmountTone('Ingreso')).toBe('text-emerald-700');
    expect(resolveAccountingAmountTone('Egreso')).toBe('text-rose-700');
    expect(hasAccountingFilters({ q: '', direction: '', category: '' })).toBe(false);
    expect(hasAccountingFilters({ q: 'caja', direction: '', category: '' })).toBe(true);
  });
});
