import { describe, expect, it } from 'vitest';
import {
  buildStoreFallbackHero,
  buildStoreHeroVisualVars,
  buildStoreSearchParams,
  getSelectedStoreCategoryLabel,
  getStoreSortLabel,
  hasStoreActiveFilters,
} from './store-page.helpers';

describe('store-page.helpers', () => {
  it('builds and cleans search params while preserving unrelated values', () => {
    const params = buildStoreSearchParams(new URLSearchParams('page=2&category=old&sort=price_desc'), {
      q: '  iphone  ',
      category: null,
      sort: 'relevance',
    });

    expect(params.get('page')).toBe('2');
    expect(params.get('q')).toBe('iphone');
    expect(params.get('category')).toBeNull();
    expect(params.get('sort')).toBeNull();
  });

  it('resolves fallback hero vars and scales fade alpha by intensity', () => {
    const hero = buildStoreFallbackHero();
    const vars = buildStoreHeroVisualVars({
      ...hero,
      fadeIntensity: 84,
      fadeMidAlpha: '0.5',
    });

    expect(hero.imageDesktop).toBe('/brand/logo.png');
    expect(vars['--hero-fade-size' as keyof typeof vars]).toBe('96px');
    expect(vars['--hero-fade-mid-alpha' as keyof typeof vars]).toBe('1');
  });

  it('derives category labels, sort labels and active filters', () => {
    const categories = [
      { id: '1', name: 'Displays', slug: 'displays', productsCount: 10 },
      { id: '2', name: 'Baterias', slug: 'baterias', productsCount: 8 },
    ];

    expect(getSelectedStoreCategoryLabel(categories, null)).toBe('Todas las categorias');
    expect(getSelectedStoreCategoryLabel(categories, 'displays')).toBe('Displays');
    expect(getSelectedStoreCategoryLabel(categories, 'missing')).toBe('Categoria actual');
    expect(getStoreSortLabel('price_asc')).toBe('Menor precio');
    expect(hasStoreActiveFilters('', null, 'relevance')).toBe(false);
    expect(hasStoreActiveFilters('iphone', null, 'relevance')).toBe(true);
    expect(hasStoreActiveFilters('', 'displays', 'relevance')).toBe(true);
  });
});
