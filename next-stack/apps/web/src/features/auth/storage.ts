import type { AuthTokens, AuthUser } from './types';

const ACCESS_KEY = 'nico_next_access_token';
const REFRESH_KEY = 'nico_next_refresh_token';
const USER_KEY = 'nico_next_user';

function emitAuthChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('nico:auth-changed'));
}

export const authStorage = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
  },
  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },
  setSession(user: AuthUser, tokens: AuthTokens) {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    emitAuthChanged();
  },
  setUser(user: AuthUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    emitAuthChanged();
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    emitAuthChanged();
  },
};
