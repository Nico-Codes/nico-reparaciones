import { adminAuthRequest } from './api';

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

export type HelpFaqCreateInput = {
  question: string;
  answer: string;
  category?: string | null;
  active?: boolean;
  sortOrder?: number;
};

export type HelpFaqUpdateInput = Partial<HelpFaqCreateInput>;

export const helpFaqAdminApi = {
  list(params?: { q?: string; active?: string; category?: string }) {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.active) qs.set('active', params.active);
    if (params?.category) qs.set('category', params.category);
    return adminAuthRequest<{ items: HelpFaqAdminItem[] }>(`/admin/help-faq${qs.size ? `?${qs.toString()}` : ''}`);
  },
  create(input: HelpFaqCreateInput) {
    return adminAuthRequest<{ item: HelpFaqAdminItem }>(`/admin/help-faq`, { method: 'POST', body: JSON.stringify(input) });
  },
  update(id: string, input: HelpFaqUpdateInput) {
    return adminAuthRequest<{ item: HelpFaqAdminItem }>(`/admin/help-faq/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
};
