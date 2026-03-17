import { adminAuthRequest } from './api';

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
  provider: string | null;
  remoteMessageId: string | null;
  providerStatus: string | null;
  errorMessage: string | null;
  status: string;
  message: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  lastAttemptAt: string | null;
  sentAt: string | null;
  failedAt: string | null;
};

export const whatsappApi = {
  templates(params?: { channel?: 'repairs' | 'orders' }) {
    const qs = new URLSearchParams();
    if (params?.channel) qs.set('channel', params.channel);
    return adminAuthRequest<{ channel?: 'repairs' | 'orders'; items: WhatsappTemplateItem[] }>(
      `/admin/whatsapp-templates${qs.size ? `?${qs.toString()}` : ''}`,
    );
  },
  saveTemplates(input: {
    channel?: 'repairs' | 'orders';
    items: Array<Pick<WhatsappTemplateItem, 'templateKey' | 'body' | 'enabled'> & { channel?: 'repairs' | 'orders' }>;
  }) {
    return adminAuthRequest<{ ok: boolean; savedTemplates: string[] }>('/admin/whatsapp-templates', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  logs(params?: { channel?: string; status?: string; q?: string }) {
    const qs = new URLSearchParams();
    if (params?.channel) qs.set('channel', params.channel);
    if (params?.status) qs.set('status', params.status);
    if (params?.q) qs.set('q', params.q);
    return adminAuthRequest<{ items: WhatsappLogItem[] }>(`/admin/whatsapp-logs${qs.size ? `?${qs.toString()}` : ''}`);
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
    return adminAuthRequest<{ item: WhatsappLogItem }>('/admin/whatsapp-logs', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
};
