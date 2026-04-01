import type { AdminTwoFactorStatus } from './adminSecurityApi';

export type TwoFactorAction = 'enable' | 'disable';

export function normalizeTwoFactorCode(value: string) {
  return value.replace(/\D+/g, '').slice(0, 6);
}

export function validateTwoFactorCode(code: string, action: TwoFactorAction) {
  if (normalizeTwoFactorCode(code).length >= 6) return '';
  if (action === 'disable') return 'Ingresa un codigo TOTP valido de 6 digitos para desactivar 2FA.';
  return 'Ingresa un codigo TOTP valido de 6 digitos.';
}

export function buildTwoFactorQrUrl(otpauthUrl: string | null) {
  if (!otpauthUrl) return null;
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpauthUrl)}`;
}

export function resolveTwoFactorEnabled(status: AdminTwoFactorStatus | null) {
  return status?.enabled ?? false;
}

export function resolveTwoFactorAccountEmail(status: AdminTwoFactorStatus | null) {
  return status?.accountEmail ?? 'admin@admin.com';
}

export function resolveTwoFactorStatusTone(enabled: boolean) {
  return enabled ? 'success' : 'warning';
}

export function resolveTwoFactorStatusLabel(enabled: boolean) {
  return enabled ? '2FA activo' : '2FA inactivo';
}

export function resolveTwoFactorProtectionLabel(enabled: boolean) {
  return enabled ? 'Protegida' : 'Pendiente';
}

export function resolveTwoFactorStatusMessage(enabled: boolean) {
  if (enabled) return 'El panel ya exige un codigo TOTP ademas de la contrasena al iniciar sesion.';
  return 'Todavia no hay doble factor activo. Configuralo para sumar una capa real de seguridad.';
}

export function hasPendingTwoFactorSetup(status: AdminTwoFactorStatus | null, generatedSecret: string) {
  return Boolean(status?.hasPendingSecret || generatedSecret);
}

export function resolveTwoFactorSecretValue(status: AdminTwoFactorStatus | null, generatedSecret: string) {
  return generatedSecret || status?.pendingSecretMasked || '(secreto oculto)';
}

export function resolveTwoFactorLoadError(cause: unknown) {
  return cause instanceof Error ? cause.message : 'No pudimos cargar el estado de 2FA.';
}

export function resolveTwoFactorGenerateError(cause: unknown) {
  return cause instanceof Error ? cause.message : 'No pudimos generar el secreto 2FA.';
}

export function resolveTwoFactorActionError(cause: unknown, action: TwoFactorAction) {
  if (cause instanceof Error) return cause.message;
  if (action === 'disable') return 'No pudimos desactivar 2FA.';
  return 'No pudimos activar 2FA.';
}

export function resolveTwoFactorGenerateSuccess() {
  return 'Se genero un secreto nuevo. Configuralo en tu app TOTP y validalo con un codigo actual.';
}

export function resolveTwoFactorActionSuccess(action: TwoFactorAction) {
  if (action === 'disable') return '2FA desactivado correctamente.';
  return '2FA activado correctamente.';
}
