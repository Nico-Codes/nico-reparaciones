import { describe, expect, it } from 'vitest';
import {
  buildStoreCategoryPathLabel,
  buildStoreFallbackHero,
  buildStoreHeroVisualVars,
  buildStoreSearchParams,
  getSelectedStoreCategoryLabel,
  getStoreSortLabel,
  hasStoreActiveFilters,
  resolveStoreCategorySelection,
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

  it('derives parent and child category labels', () => {
    const categories = [
      {
        id: '1',
        name: 'Accesorios',
        slug: 'accesorios',
        parentId: null,
        parentSlug: null,
        parentName: null,
        productsCount: 10,
        children: [
          {
            id: '2',
            name: 'Cables',
            slug: 'cables',
            parentId: '1',
            parentSlug: 'accesorios',
            parentName: 'Accesorios',
            productsCount: 4,
            children: [],
          },
        ],
      },
    ];

    expect(buildStoreCategoryPathLabel({ name: 'Cables', parentName: 'Accesorios' })).toBe('Accesorios / Cables');
    expect(getSelectedStoreCategoryLabel(categories, null)).toBe('Todas las categorias');
    expect(getSelectedStoreCategoryLabel(categories, 'accesorios')).toBe('Accesorios');
    expect(getSelectedStoreCategoryLabel(categories, 'cables')).toBe('Accesorios / Cables');
    expect(getSelectedStoreCategoryLabel(categories, 'missing')).toBe('Categoria actual');

    expect(resolveStoreCategorySelection(categories, 'cables')).toMatchObject({
      activeParent: { slug: 'accesorios' },
      activeChild: { slug: 'cables' },
    });
    expect(resolveStoreCategorySelection(categories, 'accesorios').subcategories).toHaveLength(1);
    expect(getStoreSortLabel('price_asc')).toBe('Menor precio');
    expect(hasStoreActiveFilters('', null, 'relevance')).toBe(false);
    expect(hasStoreActiveFilters('iphone', null, 'relevance')).toBe(true);
    expect(hasStoreActiveFilters('', 'accesorios', 'relevance')).toBe(true);
  });
});
