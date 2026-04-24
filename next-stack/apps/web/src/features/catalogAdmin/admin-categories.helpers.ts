import type { AdminCategory } from './api';
import { buildCategoryPathLabel } from './admin-product-form.helpers';

export type AdminCategoryTone = 'success' | 'neutral';

export type AdminCategoryDraft = {
  name: string;
  slug: string;
  parentId: string;
  active: boolean;
};

export type AdminCategoryStats = {
  total: number;
  active: number;
  inactive: number;
  parents: number;
  children: number;
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
    parents: items.filter((item) => item.depth === 0).length,
    children: items.filter((item) => item.depth > 0).length,
  };
}

export function filterCategories(items: AdminCategory[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) =>
    `${item.name} ${item.slug} ${item.parent?.name ?? ''} ${item.pathLabel}`.toLowerCase().includes(normalized),
  );
}

export function normalizeCategoryDraft(draft: AdminCategoryDraft): AdminCategoryDraft {
  const normalizedName = draft.name.trim();
  const normalizedSlug = (draft.slug.trim() || slugifyCategoryName(normalizedName)).slice(0, 120);

  return {
    name: normalizedName,
    slug: normalizedSlug,
    parentId: draft.parentId.trim(),
    active: draft.active,
  };
}

export function hasCategoryDraftChanges(item: AdminCategory | null, draft: AdminCategoryDraft) {
  if (!item) return true;

  const normalizedDraft = normalizeCategoryDraft(draft);
  return (
    item.name !== normalizedDraft.name ||
    item.slug !== normalizedDraft.slug ||
    (item.parentId ?? '') !== normalizedDraft.parentId ||
    item.active !== normalizedDraft.active
  );
}

export function buildCategoryParentOptions(items: AdminCategory[], currentId: string | null) {
  return [
    { value: '', label: 'Sin categoria padre' },
    ...items
      .filter((item) => item.depth === 0 && item.id !== currentId)
      .map((item) => ({ value: item.id, label: buildCategoryPathLabel(item) })),
  ];
}
