import { adminAuthRequest } from './api';

export type AdminTwoFactorStatus = {
  enabled: boolean;
  hasSecret: boolean;
  hasPendingSecret: boolean;
  accountEmail: string;
  otpauthUrl: string | null;
  pendingSecretMasked: string | null;
};

export const adminSecurityApi = {
  twoFactorStatus() {
    return adminAuthRequest<AdminTwoFactorStatus>('/admin/security/2fa');
  },
  twoFactorGenerate() {
    return adminAuthRequest<{ ok: boolean; secret: string; secretMasked: string; otpauthUrl: string; accountEmail: string }>(
      '/admin/security/2fa/generate',
      { method: 'POST' },
    );
  },
  twoFactorEnable(code: string) {
    return adminAuthRequest<{ ok: boolean; enabled: boolean }>('/admin/security/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },
  twoFactorDisable(code?: string) {
    return adminAuthRequest<{ ok: boolean; enabled: boolean }>('/admin/security/2fa/disable', {
      method: 'POST',
      body: JSON.stringify(code ? { code } : {}),
    });
  },
};
