import { describe, expect, it } from 'vitest';
import {
  buildCategoryPathLabel,
  buildHierarchicalCategoryOptions,
  buildNamedOptions,
  buildProductMarginStats,
  slugify,
} from './admin-product-form.helpers';

describe('admin-product-form helpers', () => {
  it('normalizes commercial slugs without accents or spaces', () => {
    expect(slugify(' Modulo de Carga iPhone 12 ')).toBe('modulo-de-carga-iphone-12');
    expect(slugify('')).toBe('');
  });

  it('builds named and hierarchical category options with path labels', () => {
    expect(buildNamedOptions([{ id: 'c1', name: 'Pantallas' }], 'Sin categoria')).toEqual([
      { value: '', label: 'Sin categoria' },
      { value: 'c1', label: 'Pantallas' },
    ]);

    expect(
      buildHierarchicalCategoryOptions(
        [
          { id: 'root', name: 'Accesorios', depth: 0, parent: null },
          { id: 'child', name: 'Cables', depth: 1, parent: { name: 'Accesorios' }, pathLabel: 'Accesorios / Cables' },
        ],
        'Todas',
      ),
    ).toEqual([
      { value: '', label: 'Todas' },
      { value: 'root', label: 'Accesorios' },
      { value: 'child', label: 'Accesorios / Cables' },
    ]);

    expect(buildCategoryPathLabel({ name: 'Cables', parent: { name: 'Accesorios' } })).toBe('Accesorios / Cables');
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
