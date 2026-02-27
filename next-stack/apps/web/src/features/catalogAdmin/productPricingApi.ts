import { authStorage } from '@/features/auth/storage';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = authStorage.getAccessToken();
  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.message as string) || `Error ${res.status}`);
  return data as T;
}

export type ProductPricingRuleItem = {
  id: string;
  name: string;
  categoryId: string | null;
  productId: string | null;
  costMin: number | null;
  costMax: number | null;
  marginPercent: number;
  priority: number;
  active: boolean;
  category: { id: string; name: string } | null;
  product: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductPricingSettings = {
  defaultMarginPercent: number;
  preventNegativeMargin: boolean;
};

export const productPricingApi = {
  settings() {
    return authRequest<ProductPricingSettings>('/catalog-admin/product-pricing/settings');
  },
  updateSettings(input: ProductPricingSettings) {
    return authRequest<ProductPricingSettings>('/catalog-admin/product-pricing/settings', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  rules() {
    return authRequest<{ items: ProductPricingRuleItem[] }>('/catalog-admin/product-pricing/rules');
  },
  createRule(input: {
    name: string;
    categoryId?: string | null;
    productId?: string | null;
    costMin?: number | null;
    costMax?: number | null;
    marginPercent: number;
    priority?: number;
    active?: boolean;
  }) {
    return authRequest<{ item: ProductPricingRuleItem }>('/catalog-admin/product-pricing/rules', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  updateRule(
    id: string,
    input: Partial<{
      name: string;
      categoryId?: string | null;
      productId?: string | null;
      costMin?: number | null;
      costMax?: number | null;
      marginPercent: number;
      priority?: number;
      active?: boolean;
    }>,
  ) {
    return authRequest<{ item: ProductPricingRuleItem }>(`/catalog-admin/product-pricing/rules/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  deleteRule(id: string) {
    return authRequest<{ ok: boolean }>(`/catalog-admin/product-pricing/rules/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
  resolveRecommendedPrice(params: { categoryId: string; costPrice: number; productId?: string | null }) {
    const qs = new URLSearchParams();
    qs.set('categoryId', params.categoryId);
    qs.set('costPrice', String(Math.max(0, Math.trunc(params.costPrice))));
    if (params.productId) qs.set('productId', params.productId);
    return authRequest<{
      ok: boolean;
      recommendedPrice: number;
      marginPercent: number;
      rule: { id: string; name: string } | null;
    }>(`/catalog-admin/product-pricing/resolve?${qs.toString()}`);
  },
};
