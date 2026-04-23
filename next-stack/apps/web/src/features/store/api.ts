import type {
  StoreBrandingAssets,
  StoreCategory,
  StoreHeroConfig,
  StoreHomeResponse,
  StoreProduct,
  StoreProductsResponse,
} from './types';
import { publicJsonRequest } from '@/features/auth/http';

async function request<T>(path: string): Promise<T> {
  return publicJsonRequest<T>(path, { method: 'GET' });
}

export const storeApi = {
  home() {
    return request<StoreHomeResponse>('/store/home');
  },
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
