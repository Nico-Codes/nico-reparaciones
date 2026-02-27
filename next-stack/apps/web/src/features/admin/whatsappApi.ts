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

export type WhatsappTemplateItem = {
  channel?: 'repairs' | 'orders';
  templateKey: string;
  label: string;
  description: string;
  body: string;
  enabled: boolean;
  placeholders: string[];
};

export type WhatsappLogItem = {
  id: string;
  channel: string;
  templateKey: string | null;
  targetType: string | null;
  targetId: string | null;
  phone: string | null;
  recipient: string | null;
  status: string;
  message: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
};

export const whatsappApi = {
  templates(params?: { channel?: 'repairs' | 'orders' }) {
    const qs = new URLSearchParams();
    if (params?.channel) qs.set('channel', params.channel);
    return authRequest<{ channel?: 'repairs' | 'orders'; items: WhatsappTemplateItem[] }>(
      `/admin/whatsapp-templates${qs.size ? `?${qs.toString()}` : ''}`,
    );
  },
  saveTemplates(input: {
    channel?: 'repairs' | 'orders';
    items: Array<Pick<WhatsappTemplateItem, 'templateKey' | 'body' | 'enabled'> & { channel?: 'repairs' | 'orders' }>;
  }) {
    return authRequest<{ ok: boolean; savedTemplates: string[] }>('/admin/whatsapp-templates', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  logs(params?: { channel?: string; status?: string; q?: string }) {
    const qs = new URLSearchParams();
    if (params?.channel) qs.set('channel', params.channel);
    if (params?.status) qs.set('status', params.status);
    if (params?.q) qs.set('q', params.q);
    return authRequest<{ items: WhatsappLogItem[] }>(`/admin/whatsapp-logs${qs.size ? `?${qs.toString()}` : ''}`);
  },
  createLog(input: {
    channel?: string;
    templateKey?: string | null;
    targetType?: string | null;
    targetId?: string | null;
    phone?: string | null;
    recipient?: string | null;
    status?: string;
    message?: string | null;
    meta?: Record<string, unknown> | null;
  }) {
    return authRequest<{ item: WhatsappLogItem }>('/admin/whatsapp-logs', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
};
