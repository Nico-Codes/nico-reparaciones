export type RefreshCookieResponse = {
  cookie: (
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'lax' | 'strict' | 'none';
      maxAge?: number;
      path: string;
      domain?: string;
    },
  ) => unknown;
  clearCookie: (
    name: string,
    options: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'lax' | 'strict' | 'none';
      path: string;
      domain?: string;
    },
  ) => unknown;
};

export const REFRESH_COOKIE_NAME = 'nico_refresh_token';

const REFRESH_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

export function setRefreshCookie(res: RefreshCookieResponse, refreshToken: string) {
  const sameSite = resolveCookieSameSite();
  const domain = cookieDomain();
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: shouldUseSecureCookie(sameSite),
    sameSite,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: '/api/auth',
    ...(domain ? { domain } : {}),
  });
}

export function clearRefreshCookie(res: RefreshCookieResponse) {
  const sameSite = resolveCookieSameSite();
  const domain = cookieDomain();
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: shouldUseSecureCookie(sameSite),
    sameSite,
    path: '/api/auth',
    ...(domain ? { domain } : {}),
  });
}

export function extractCookie(header: string | undefined, name: string) {
  if (!header) return null;
  const prefix = `${name}=`;
  const raw = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!raw) return null;
  const value = raw.slice(prefix.length).trim();
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolveCookieSameSite(): 'lax' | 'strict' | 'none' {
  const value = (process.env.AUTH_COOKIE_SAMESITE ?? '').trim().toLowerCase();
  if (value === 'none' || value === 'strict') return value;
  return 'lax';
}

function shouldUseSecureCookie(sameSite: 'lax' | 'strict' | 'none') {
  if (sameSite === 'none') return true;
  if ((process.env.NODE_ENV ?? '').trim().toLowerCase() === 'production') return true;
  return /^https:\/\//i.test((process.env.API_URL ?? '').trim());
}

function cookieDomain() {
  return (process.env.AUTH_COOKIE_DOMAIN ?? '').trim() || null;
}
