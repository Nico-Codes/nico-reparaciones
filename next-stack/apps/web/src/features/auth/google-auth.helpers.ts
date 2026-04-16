const SOCIAL_RETURN_TO_KEY = 'nico_social_return_to';

export function resolvePostAuthReturnTo(raw: string | null | undefined, fallback = '/store') {
  const value = (raw ?? '').trim();
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('/auth/') || value.startsWith('/api/')) return fallback;
  return value || fallback;
}

export function rememberSocialReturnTo(returnTo: string) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(SOCIAL_RETURN_TO_KEY, resolvePostAuthReturnTo(returnTo));
}

export function consumeSocialReturnTo(fallback = '/store') {
  if (typeof window === 'undefined') return fallback;
  const value = window.sessionStorage.getItem(SOCIAL_RETURN_TO_KEY);
  window.sessionStorage.removeItem(SOCIAL_RETURN_TO_KEY);
  return resolvePostAuthReturnTo(value, fallback);
}

export function readSocialCallbackHash(hash: string) {
  const normalized = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(normalized);
  return {
    resultToken: params.get('result')?.trim() ?? '',
    error: params.get('error')?.trim() ?? '',
  };
}

export const rememberGoogleReturnTo = rememberSocialReturnTo;
export const consumeGoogleReturnTo = consumeSocialReturnTo;
export const readGoogleCallbackHash = readSocialCallbackHash;
