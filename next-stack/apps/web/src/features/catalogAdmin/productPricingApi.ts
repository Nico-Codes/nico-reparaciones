import { authJsonRequest } from '@/features/auth/http';

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
    return authJsonRequest<ProductPricingSettings>('/catalog-admin/product-pricing/settings');
  },
  updateSettings(input: ProductPricingSettings) {
    return authJsonRequest<ProductPricingSettings>('/catalog-admin/product-pricing/settings', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  rules() {
    return authJsonRequest<{ items: ProductPricingRuleItem[] }>('/catalog-admin/product-pricing/rules');
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
    return authJsonRequest<{ item: ProductPricingRuleItem }>('/catalog-admin/product-pricing/rules', {
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
    return authJsonRequest<{ item: ProductPricingRuleItem }>(`/catalog-admin/product-pricing/rules/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  deleteRule(id: string) {
    return authJsonRequest<{ ok: boolean }>(`/catalog-admin/product-pricing/rules/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
  resolveRecommendedPrice(params: { categoryId: string; costPrice: number; productId?: string | null }) {
    const qs = new URLSearchParams();
    qs.set('categoryId', params.categoryId);
    qs.set('costPrice', String(Math.max(0, Math.trunc(params.costPrice))));
    if (params.productId) qs.set('productId', params.productId);
    return authJsonRequest<{
      ok: boolean;
      recommendedPrice: number;
      marginPercent: number;
      rule: { id: string; name: string } | null;
    }>(`/catalog-admin/product-pricing/resolve?${qs.toString()}`);
  },
};
