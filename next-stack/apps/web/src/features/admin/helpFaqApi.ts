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

export type HelpFaqAdminItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export const helpFaqAdminApi = {
  list(params?: { q?: string; active?: string; category?: string }) {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.active) qs.set('active', params.active);
    if (params?.category) qs.set('category', params.category);
    return authRequest<{ items: HelpFaqAdminItem[] }>(`/admin/help-faq${qs.size ? `?${qs.toString()}` : ''}`);
  },
  create(input: { question: string; answer: string; category?: string | null; active?: boolean; sortOrder?: number }) {
    return authRequest<{ item: HelpFaqAdminItem }>(`/admin/help-faq`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  update(id: string, input: Partial<{ question: string; answer: string; category: string | null; active: boolean; sortOrder: number }>) {
    return authRequest<{ item: HelpFaqAdminItem }>(`/admin/help-faq/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
};

