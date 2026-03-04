import { authStorage } from '@/features/auth/storage';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

function authHeaders() {
  const token = authStorage.getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers as HeadersInit;
}

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.message as string) || `Error ${res.status}`);
  return data as T;
}

async function authMultipartRequest<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data?.message as string) || `Error ${res.status}`);
  return data as T;
}

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  productsCount: number;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  purchaseReference: string | null;
  imagePath: string | null;
  imageUrl: string | null;
  price: number;
  costPrice: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
  sku: string | null;
  barcode: string | null;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  supplierId: string | null;
  supplier: { id: string; name: string } | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export const catalogAdminApi = {
  categories() {
    return authRequest<{ items: AdminCategory[] }>('/catalog-admin/categories');
  },
  createCategory(input: { name: string; slug: string; active?: boolean }) {
    return authRequest<{ item: AdminCategory }>('/catalog-admin/categories', { method: 'POST', body: JSON.stringify(input) });
  },
  updateCategory(id: string, input: Partial<{ name: string; slug: string; active: boolean }>) {
    return authRequest<{ item: AdminCategory }>(`/catalog-admin/categories/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  products(params?: { q?: string; categoryId?: string; active?: string }) {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.categoryId) qs.set('categoryId', params.categoryId);
    if (params?.active) qs.set('active', params.active);
    return authRequest<{ items: AdminProduct[] }>('/catalog-admin/products' + (qs.size ? `?${qs.toString()}` : ''));
  },
  product(id: string) {
    return authRequest<{ item: AdminProduct }>(`/catalog-admin/products/${encodeURIComponent(id)}`);
  },
  createProduct(input: unknown) {
    return authRequest<{ item: AdminProduct }>('/catalog-admin/products', { method: 'POST', body: JSON.stringify(input) });
  },
  updateProduct(id: string, input: unknown) {
    return authRequest<{ item: AdminProduct }>(`/catalog-admin/products/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  uploadProductImage(id: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    return authMultipartRequest<{ item: AdminProduct; upload: { path: string; url: string | null } }>(
      `/catalog-admin/products/${encodeURIComponent(id)}/image`,
      form,
    );
  },
  removeProductImage(id: string) {
    return authRequest<{ item: AdminProduct }>(`/catalog-admin/products/${encodeURIComponent(id)}/image`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    });
  },
};
