import type { AdminCategory } from './api';

export type AdminCategoryTone = 'success' | 'neutral';

export type AdminCategoryDraft = {
  name: string;
  slug: string;
  active: boolean;
};

export type AdminCategoryStats = {
  total: number;
  active: number;
  inactive: number;
};

export function slugifyCategoryName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function getCategoryTone(active: boolean): AdminCategoryTone {
  return active ? 'success' : 'neutral';
}

export function buildCategoryStats(items: AdminCategory[]): AdminCategoryStats {
  return {
    total: items.length,
    active: items.filter((item) => item.active).length,
    inactive: items.filter((item) => !item.active).length,
  };
}

export function filterCategories(items: AdminCategory[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) => `${item.name} ${item.slug}`.toLowerCase().includes(normalized));
}

export function normalizeCategoryDraft(draft: AdminCategoryDraft): AdminCategoryDraft {
  const normalizedName = draft.name.trim();
  const normalizedSlug = (draft.slug.trim() || slugifyCategoryName(normalizedName)).slice(0, 120);

  return {
    name: normalizedName,
    slug: normalizedSlug,
    active: draft.active,
  };
}

export function hasCategoryDraftChanges(item: AdminCategory | null, draft: AdminCategoryDraft) {
  if (!item) return true;

  const normalizedDraft = normalizeCategoryDraft(draft);
  return (
    item.name !== normalizedDraft.name ||
    item.slug !== normalizedDraft.slug ||
    item.active !== normalizedDraft.active
  );
}
