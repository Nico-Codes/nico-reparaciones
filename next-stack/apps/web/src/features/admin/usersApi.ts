import { adminAuthRequest } from './api';

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export const adminUsersApi = {
  list(params?: { q?: string; role?: string }) {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.role) qs.set('role', params.role);
    return adminAuthRequest<{ items: AdminUserRow[] }>(`/admin/users${qs.size ? `?${qs.toString()}` : ''}`);
  },
  updateRole(id: string, role: 'USER' | 'ADMIN') {
    return adminAuthRequest<{ item?: AdminUserRow; message?: string }>(`/admin/users/${encodeURIComponent(id)}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },
};
