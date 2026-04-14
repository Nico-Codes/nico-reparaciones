import { describe, expect, it } from 'vitest';
import { readGoogleCallbackHash, resolvePostAuthReturnTo } from './google-auth.helpers';

describe('google auth helpers', () => {
  it('normalizes safe internal return targets', () => {
    expect(resolvePostAuthReturnTo('/orders/123')).toBe('/orders/123');
    expect(resolvePostAuthReturnTo('/auth/login')).toBe('/store');
    expect(resolvePostAuthReturnTo('/api/auth/login')).toBe('/store');
    expect(resolvePostAuthReturnTo('https://google.com')).toBe('/store');
  });

  it('reads result token and error from callback hash', () => {
    expect(readGoogleCallbackHash('#result=abc123')).toEqual({
      resultToken: 'abc123',
      error: '',
    });
    expect(readGoogleCallbackHash('#error=Cancelado')).toEqual({
      resultToken: '',
      error: 'Cancelado',
    });
  });
});
