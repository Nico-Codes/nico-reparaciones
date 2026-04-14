const GOOGLE_RETURN_TO_KEY = 'nico_google_return_to';

export function resolvePostAuthReturnTo(raw: string | null | undefined, fallback = '/store') {
  const value = (raw ?? '').trim();
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('/auth/') || value.startsWith('/api/')) return fallback;
  return value || fallback;
}

export function rememberGoogleReturnTo(returnTo: string) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(GOOGLE_RETURN_TO_KEY, resolvePostAuthReturnTo(returnTo));
}

export function consumeGoogleReturnTo(fallback = '/store') {
  if (typeof window === 'undefined') return fallback;
  const value = window.sessionStorage.getItem(GOOGLE_RETURN_TO_KEY);
  window.sessionStorage.removeItem(GOOGLE_RETURN_TO_KEY);
  return resolvePostAuthReturnTo(value, fallback);
}

export function readGoogleCallbackHash(hash: string) {
  const normalized = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(normalized);
  return {
    resultToken: params.get('result')?.trim() ?? '',
    error: params.get('error')?.trim() ?? '',
  };
}
