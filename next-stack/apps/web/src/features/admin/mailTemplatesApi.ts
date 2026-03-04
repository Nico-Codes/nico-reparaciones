import { adminAuthRequest } from './api';

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
    return adminAuthRequest<{ items: MailTemplateItem[] }>('/admin/mail-templates');
  },
  save(items: Array<Pick<MailTemplateItem, 'templateKey' | 'subject' | 'body' | 'enabled'>>) {
    return adminAuthRequest<{ ok: boolean; savedTemplates: string[] }>('/admin/mail-templates', {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    });
  },
};
