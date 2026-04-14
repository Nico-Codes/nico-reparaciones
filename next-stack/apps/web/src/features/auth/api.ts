import type { AuthResponse } from './types';
import { authStorage } from './storage';
import { authJsonRequest, publicJsonRequest } from './http';
import { apiOrigin } from './http';
import { resolvePostAuthReturnTo } from './google-auth.helpers';

export const authApi = {
  register(input: { name: string; email: string; password: string }) {
    return publicJsonRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  login(input: { email: string; password: string; twoFactorCode?: string }) {
    return publicJsonRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  googleStartUrl(returnTo?: string) {
    const url = new URL('/api/auth/google/start', apiOrigin);
    url.searchParams.set('returnTo', resolvePostAuthReturnTo(returnTo));
    return url.toString();
  },
  googleComplete(resultToken: string) {
    return publicJsonRequest<AuthResponse>('/auth/google/complete', {
      method: 'POST',
      body: JSON.stringify({ resultToken }),
    });
  },
  me(accessToken?: string) {
    if (accessToken) {
      return publicJsonRequest<{ user: AuthResponse['user'] }>('/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
    return authJsonRequest<{ user: AuthResponse['user'] }>('/auth/me', { method: 'GET' });
  },
  account() {
    return authJsonRequest<{ user: AuthResponse['user'] }>('/auth/account', { method: 'GET' });
  },
  updateAccount(input: { name: string; email: string }) {
    return authJsonRequest<{ user: AuthResponse['user']; emailVerification?: { required: boolean; status: string; previewToken?: string } }>(
      '/auth/account',
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
    );
  },
  updateAccountPassword(input: { currentPassword: string; newPassword: string }) {
    return authJsonRequest<{ ok: boolean; message: string }>('/auth/account/password', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  refresh(refreshToken?: string) {
    const token = refreshToken ?? authStorage.getRefreshToken();
    return publicJsonRequest<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: token }),
    });
  },
  forgotPassword(email: string) {
    return publicJsonRequest<{ ok: boolean; message: string; previewToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  resetPassword(input: { token: string; password: string }) {
    return publicJsonRequest<{ ok: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  requestVerifyEmail() {
    return authJsonRequest<{ ok: boolean; status: string; previewToken?: string }>('/auth/verify-email/request', {
      method: 'POST',
    });
  },
  confirmVerifyEmail(token: string) {
    return publicJsonRequest<{ ok: boolean; message: string }>('/auth/verify-email/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
  bootstrapAdmin(input: { setupKey: string; name: string; email: string; password: string }) {
    return publicJsonRequest<AuthResponse & { ok: boolean; message: string }>('/auth/bootstrap-admin', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
