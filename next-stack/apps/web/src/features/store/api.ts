import type { StoreBrandingAssets, StoreCategory, StoreHeroConfig, StoreProduct, StoreProductsResponse } from './types';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data?.message as string) || `Error ${res.status}`);
  }
  return data as T;
}

export const storeApi = {
  hero() {
    return request<StoreHeroConfig>('/store/hero');
  },
  branding() {
    return request<StoreBrandingAssets>('/store/branding');
  },
  categories() {
    return request<{ items: StoreCategory[] }>('/store/categories');
  },
  products(params: { q?: string; category?: string | null; sort?: string; page?: number; pageSize?: number }) {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.category) qs.set('category', params.category);
    if (params.sort) qs.set('sort', params.sort);
    if (params.page) qs.set('page', String(params.page));
    if (params.pageSize) qs.set('pageSize', String(params.pageSize));
    return request<StoreProductsResponse>(`/store/products${qs.size ? `?${qs.toString()}` : ''}`);
  },
  product(slug: string) {
    return request<{ item: StoreProduct }>(`/store/products/${encodeURIComponent(slug)}`);
  },
};
