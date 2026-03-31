import { describe, expect, it } from 'vitest';
import {
  buildCategoryStats,
  filterCategories,
  hasCategoryDraftChanges,
  normalizeCategoryDraft,
  slugifyCategoryName,
} from './admin-categories.helpers';
import type { AdminCategory } from './api';

function makeCategory(input: Partial<AdminCategory> & Pick<AdminCategory, 'id' | 'name' | 'slug' | 'active' | 'productsCount'>): AdminCategory {
  return input;
}

describe('admin-categories.helpers', () => {
  it('slugifies names removing accents and noise', () => {
    expect(slugifyCategoryName(' Fundás & Cargadores 2026 ')).toBe('fundas-cargadores-2026');
  });

  it('builds stats and filters categories by name or slug', () => {
    const items = [
      makeCategory({ id: '1', name: 'Fundas', slug: 'fundas', active: true, productsCount: 10 }),
      makeCategory({ id: '2', name: 'Audio', slug: 'audio-premium', active: false, productsCount: 2 }),
    ];

    expect(buildCategoryStats(items)).toEqual({ total: 2, active: 1, inactive: 1 });
    expect(filterCategories(items, 'prem')).toHaveLength(1);
    expect(filterCategories(items, '   ')).toHaveLength(2);
  });

  it('normalizes drafts and detects edit changes', () => {
    const item = makeCategory({ id: '1', name: 'Fundas', slug: 'fundas', active: true, productsCount: 10 });
    const normalized = normalizeCategoryDraft({ name: ' Fundas ', slug: '', active: true });

    expect(normalized).toEqual({ name: 'Fundas', slug: 'fundas', active: true });
    expect(hasCategoryDraftChanges(item, { name: 'Fundas', slug: 'fundas', active: true })).toBe(false);
    expect(hasCategoryDraftChanges(item, { name: 'Fundas pro', slug: 'fundas-pro', active: true })).toBe(true);
  });
});
