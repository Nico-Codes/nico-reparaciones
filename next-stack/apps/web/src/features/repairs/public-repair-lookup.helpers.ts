import { formatDateTime, money } from './repair-ui';
import type { PublicRepairLookupItem } from './types';

export function normalizePublicRepairLookupValue(value: string) {
  return value.trim();
}

export function canSubmitPublicRepairLookup(repairId: string, customerPhone: string) {
  return normalizePublicRepairLookupValue(repairId).length > 0 && normalizePublicRepairLookupValue(customerPhone).length > 0;
}

export function buildPublicRepairLookupPayload(repairId: string, customerPhone: string) {
  return {
    repairId: normalizePublicRepairLookupValue(repairId),
    customerPhone: normalizePublicRepairLookupValue(customerPhone),
  };
}

export function resolvePublicRepairLookupError(cause: unknown) {
  return cause instanceof Error ? cause.message : 'No pudimos consultar la reparacion.';
}

export function buildPublicRepairLookupFacts(item: PublicRepairLookupItem) {
  return [
    { label: 'Cliente', value: item.customerName },
    { label: 'Telefono', value: item.customerPhoneMasked ?? 'No informado' },
    { label: 'Equipo', value: [item.deviceBrand, item.deviceModel].filter(Boolean).join(' ') || 'No informado' },
    { label: 'Falla reportada', value: item.issueLabel ?? 'No informada' },
    { label: 'Presupuesto', value: money(item.quotedPrice) },
    { label: 'Total final', value: money(item.finalPrice) },
    { label: 'Creada', value: formatDateTime(item.createdAt) },
    { label: 'Ultima actualizacion', value: formatDateTime(item.updatedAt) },
  ];
}
