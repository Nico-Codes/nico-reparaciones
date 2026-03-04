import { adminAuthRequest } from './api';

export type AdminSettingItem = {
  id: string | null;
  key: string;
  value: string;
  group: string;
  label: string | null;
  type: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export const adminSettingsApi = {
  list() {
    return adminAuthRequest<{ items: AdminSettingItem[] }>('/admin/settings');
  },
  save(items: Array<Pick<AdminSettingItem, 'key' | 'value' | 'group' | 'label' | 'type'>>) {
    return adminAuthRequest<{ items: AdminSettingItem[] }>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    });
  },
};
