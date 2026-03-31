import { describe, expect, it } from 'vitest';
import { buildNamedOptions, buildProductMarginStats, slugify } from './admin-product-form.helpers';

describe('admin-product-form helpers', () => {
  it('normalizes commercial slugs without accents or spaces', () => {
    expect(slugify(' Módulo de Carga iPhone 12 ')).toBe('modulo-de-carga-iphone-12');
    expect(slugify('')).toBe('');
  });

  it('builds select options with an empty leading option', () => {
    expect(buildNamedOptions([{ id: 'c1', name: 'Pantallas' }], 'Sin categoria')).toEqual([
      { value: '', label: 'Sin categoria' },
      { value: 'c1', label: 'Pantallas' },
    ]);
  });

  it('computes margin stats with positive and negative outcomes', () => {
    expect(buildProductMarginStats('100', '140')).toEqual({
      utility: 40,
      margin: 40,
      tone: 'success',
    });

    expect(buildProductMarginStats('100', '100').tone).toBe('warning');
    expect(buildProductMarginStats('100', '80').tone).toBe('danger');
  });
});
