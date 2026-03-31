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

export function getSelectedStoreCategoryLabel(categories: StoreCategory[], category: string | null) {
  if (!category) return 'Todas las categorias';
  return categories.find((item) => item.slug === category)?.name ?? 'Categoria actual';
}

export function getStoreSortLabel(sort: string) {
  return STORE_SORT_OPTIONS.find((option) => option.value === sort)?.label ?? 'Relevancia';
}

export function hasStoreActiveFilters(q: string, category: string | null, sort: string) {
  return Boolean(q || category || sort !== 'relevance');
}
