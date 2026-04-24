import type { CSSProperties } from 'react';
import type { StoreCategory, StoreHeroConfig, StoreProductsResponse } from './types';

export type StoreSortValue = StoreProductsResponse['meta']['sort'];
export type StoreQueryPatch = {
  q?: string;
  category?: string | null;
  sort?: string;
};
export type StoreSortOption = {
  value: StoreSortValue;
  label: string;
};

export type StoreCategorySelection = {
  activeCategory: StoreCategory | null;
  activeParent: StoreCategory | null;
  activeChild: StoreCategory | null;
  subcategories: StoreCategory[];
};

const STORE_HERO_FALLBACK: StoreHeroConfig = {
  imageDesktop: '/brand/logo.png',
  imageMobile: '/brand/logo.png',
  fadeRgbDesktop: '14, 165, 233',
  fadeRgbMobile: '14, 165, 233',
  fadeIntensity: 42,
  fadeSize: 96,
  fadeHold: 12,
  fadeMidAlpha: '0.58',
  title: '',
  subtitle: '',
};

export const STORE_SORT_OPTIONS: readonly StoreSortOption[] = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'newest', label: 'Mas nuevos' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'name_asc', label: 'Nombre A-Z' },
  { value: 'name_desc', label: 'Nombre Z-A' },
  { value: 'stock_desc', label: 'Mas stock' },
] as const;

export function buildStoreSortOptions(): StoreSortOption[] {
  return STORE_SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label }));
}

export function buildStoreSearchParams(searchParams: URLSearchParams, next: StoreQueryPatch) {
  const params = new URLSearchParams(searchParams);

  if (next.q !== undefined) {
    const value = next.q.trim();
    if (value) params.set('q', value);
    else params.delete('q');
  }

  if (next.category !== undefined) {
    if (next.category) params.set('category', next.category);
    else params.delete('category');
  }

  if (next.sort !== undefined) {
    if (next.sort && next.sort !== 'relevance') params.set('sort', next.sort);
    else params.delete('sort');
  }

  return params;
}

export function buildStoreFallbackHero(): StoreHeroConfig {
  return { ...STORE_HERO_FALLBACK };
}

export function buildStoreHeroVisualVars(hero: StoreHeroConfig): CSSProperties {
  const baseAlpha = Number(hero.fadeMidAlpha);
  const intensity = Number(hero.fadeIntensity);
  const normalizedBaseAlpha = Number.isFinite(baseAlpha) ? Math.max(0, Math.min(1, baseAlpha)) : 0.58;
  const scaledAlpha =
    Number.isFinite(intensity) && intensity > 0 ? normalizedBaseAlpha * (intensity / 42) : normalizedBaseAlpha;

  return {
    ['--hero-fade-desktop' as string]: hero.fadeRgbDesktop,
    ['--hero-fade-mobile' as string]: hero.fadeRgbMobile,
    ['--hero-fade-intensity' as string]: hero.fadeIntensity,
    ['--hero-fade-size' as string]: `${hero.fadeSize}px`,
    ['--hero-fade-hold' as string]: `${hero.fadeHold}%`,
    ['--hero-fade-mid-alpha' as string]: String(Math.max(0, Math.min(1, scaledAlpha))),
  } as CSSProperties;
}

export function buildStoreCategoryPathLabel(category: {
  name: string;
  pathLabel?: string;
  parentName?: string | null;
  parent?: { name: string } | null;
}) {
  if (category.pathLabel) return category.pathLabel;
  const parentName = category.parentName ?? category.parent?.name ?? null;
  return parentName ? `${parentName} / ${category.name}` : category.name;
}

export function findStoreCategoryBySlug(categories: StoreCategory[], slug: string | null) {
  if (!slug) return null;
  for (const category of categories) {
    if (category.slug === slug) return category;
    const child = category.children.find((item) => item.slug === slug);
    if (child) return child;
  }
  return null;
}

export function resolveStoreCategorySelection(categories: StoreCategory[], slug: string | null): StoreCategorySelection {
  if (!slug) {
    return {
      activeCategory: null,
      activeParent: null,
      activeChild: null,
      subcategories: [],
    };
  }

  for (const category of categories) {
    if (category.slug === slug) {
      return {
        activeCategory: category,
        activeParent: category,
        activeChild: null,
        subcategories: category.children,
      };
    }

    const child = category.children.find((item) => item.slug === slug);
    if (child) {
      return {
        activeCategory: child,
        activeParent: category,
        activeChild: child,
        subcategories: category.children,
      };
    }
  }

  return {
    activeCategory: null,
    activeParent: null,
    activeChild: null,
    subcategories: [],
  };
}

export function getSelectedStoreCategoryLabel(categories: StoreCategory[], category: string | null) {
  const selection = resolveStoreCategorySelection(categories, category);
  if (!selection.activeCategory) return category ? 'Categoria actual' : 'Todas las categorias';
  return buildStoreCategoryPathLabel(selection.activeCategory);
}

export function getStoreSortLabel(sort: string) {
  return STORE_SORT_OPTIONS.find((option) => option.value === sort)?.label ?? 'Relevancia';
}

export function hasStoreActiveFilters(q: string, category: string | null, sort: string) {
  return Boolean(q || category || sort !== 'relevance');
}
