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

export type MailTemplateItem = {
  templateKey: 'verify_email' | 'reset_password' | 'order_created' | string;
  label: string;
  description: string;
  subject: string;
  body: string;
  enabled: boolean;
  placeholders: string[];
};

export const mailTemplatesApi = {
  list() {
    return authRequest<{ items: MailTemplateItem[] }>('/admin/mail-templates');
  },
  save(items: Array<Pick<MailTemplateItem, 'templateKey' | 'subject' | 'body' | 'enabled'>>) {
    return authRequest<{ ok: boolean; savedTemplates: string[] }>('/admin/mail-templates', {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    });
  },
};

