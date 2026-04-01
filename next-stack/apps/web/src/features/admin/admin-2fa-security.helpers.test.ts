import { describe, expect, it } from 'vitest';
import {
  buildTwoFactorQrUrl,
  hasPendingTwoFactorSetup,
  normalizeTwoFactorCode,
  resolveTwoFactorActionSuccess,
  resolveTwoFactorProtectionLabel,
  resolveTwoFactorStatusLabel,
  resolveTwoFactorStatusMessage,
  validateTwoFactorCode,
} from './admin-2fa-security.helpers';

describe('admin-2fa-security.helpers', () => {
  it('normaliza el codigo TOTP a 6 digitos', () => {
    expect(normalizeTwoFactorCode(' 12a3-45 67 ')).toBe('123456');
  });

  it('valida el codigo segun la accion', () => {
    expect(validateTwoFactorCode('123', 'enable')).toBe('Ingresa un codigo TOTP valido de 6 digitos.');
    expect(validateTwoFactorCode('123', 'disable')).toBe(
      'Ingresa un codigo TOTP valido de 6 digitos para desactivar 2FA.',
    );
    expect(validateTwoFactorCode('123456', 'enable')).toBe('');
  });

  it('arma la URL del QR solo cuando hay otpauthUrl', () => {
    expect(buildTwoFactorQrUrl(null)).toBeNull();
    expect(buildTwoFactorQrUrl('otpauth://totp/demo?secret=abc')).toContain(
      encodeURIComponent('otpauth://totp/demo?secret=abc'),
    );
  });

  it('resuelve labels y mensajes del estado', () => {
    expect(resolveTwoFactorStatusLabel(true)).toBe('2FA activo');
    expect(resolveTwoFactorProtectionLabel(false)).toBe('Pendiente');
    expect(resolveTwoFactorStatusMessage(true)).toContain('codigo TOTP');
    expect(resolveTwoFactorActionSuccess('disable')).toBe('2FA desactivado correctamente.');
  });

  it('detecta setup pendiente cuando hay secreto nuevo o pendiente en backend', () => {
    expect(hasPendingTwoFactorSetup(null, '')).toBe(false);
    expect(hasPendingTwoFactorSetup({ hasPendingSecret: true } as never, '')).toBe(true);
    expect(hasPendingTwoFactorSetup(null, 'ABC123')).toBe(true);
  });
});
