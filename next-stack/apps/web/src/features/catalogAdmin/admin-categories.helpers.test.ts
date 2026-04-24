import { describe, expect, it } from 'vitest';
import {
  buildCategoryStats,
  filterCategories,
  hasCategoryDraftChanges,
  normalizeCategoryDraft,
  slugifyCategoryName,
} from './admin-categories.helpers';
import type { AdminCategory } from './api';

function makeCategory(
  input: Partial<AdminCategory> & Pick<AdminCategory, 'id' | 'name' | 'slug'>,
): AdminCategory {
  return {
    parentId: input.parentId ?? null,
    parent: input.parent ?? null,
    depth: input.depth ?? 0,
    active: input.active ?? true,
    directProductsCount: input.directProductsCount ?? 0,
    totalProductsCount: input.totalProductsCount ?? input.productsCount ?? 0,
    productsCount: input.productsCount ?? 0,
    childrenCount: input.childrenCount ?? 0,
    pathLabel: input.pathLabel ?? (input.parent?.name ? `${input.parent.name} / ${input.name}` : input.name),
    ...input,
  };
}

describe('admin-categories.helpers', () => {
  it('slugifies names removing accents and noise', () => {
    expect(slugifyCategoryName(' Fundas & Cargadores 2026 ')).toBe('fundas-cargadores-2026');
  });

  it('builds stats and filters categories by hierarchy too', () => {
    const items = [
      makeCategory({ id: '1', name: 'Accesorios', slug: 'accesorios', active: true, productsCount: 10, depth: 0, childrenCount: 2 }),
      makeCategory({
        id: '2',
        name: 'Cables',
        slug: 'cables',
        active: false,
        productsCount: 2,
        depth: 1,
        parentId: '1',
        parent: { id: '1', name: 'Accesorios', slug: 'accesorios' },
      }),
    ];

    expect(buildCategoryStats(items)).toEqual({ total: 2, active: 1, inactive: 1, parents: 1, children: 1 });
    expect(filterCategories(items, 'accesorios / cables')).toHaveLength(1);
    expect(filterCategories(items, '   ')).toHaveLength(2);
  });

  it('normalizes drafts and detects edit changes including parent changes', () => {
    const item = makeCategory({ id: '1', name: 'Fundas', slug: 'fundas', active: true, productsCount: 10, parentId: null });
    const normalized = normalizeCategoryDraft({ name: ' Fundas ', slug: '', parentId: '  ', active: true });

    expect(normalized).toEqual({ name: 'Fundas', slug: 'fundas', parentId: '', active: true });
    expect(hasCategoryDraftChanges(item, { name: 'Fundas', slug: 'fundas', parentId: '', active: true })).toBe(false);
    expect(hasCategoryDraftChanges(item, { name: 'Fundas', slug: 'fundas', parentId: 'cat-root', active: true })).toBe(true);
  });
});
