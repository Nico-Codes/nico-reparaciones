import { formatDateTime, money, repairStatusSummary, repairStatusTone } from './repair-ui';
import type { PublicRepairQuoteApprovalItem } from './types';

export function canLoadPublicRepairQuoteApproval(id: string, token: string) {
  return id.trim().length > 0 && token.trim().length > 0;
}

export function resolvePublicRepairQuoteApprovalLoadError(cause: unknown) {
  return cause instanceof Error ? cause.message : 'No pudimos abrir el enlace de aprobacion.';
}

export function resolvePublicRepairQuoteApprovalActionError(cause: unknown) {
  return cause instanceof Error ? cause.message : 'No pudimos guardar tu decision.';
}

export function buildPublicRepairQuoteApprovalFacts(item: PublicRepairQuoteApprovalItem) {
  return [
    { label: 'Cliente', value: item.customerName },
    { label: 'Telefono', value: item.customerPhoneMasked ?? 'No informado' },
    { label: 'Equipo', value: [item.deviceBrand, item.deviceModel].filter(Boolean).join(' ') || 'No informado' },
    { label: 'Falla reportada', value: item.issueLabel || 'No informada' },
    { label: 'Presupuesto', value: item.finalPrice != null ? money(item.finalPrice) : money(item.quotedPrice) },
    { label: 'Ultima actualizacion', value: formatDateTime(item.updatedAt) },
  ];
}

export function buildPublicRepairQuoteApprovalMeta(item: PublicRepairQuoteApprovalItem) {
  return {
    description: repairStatusSummary(item.status),
    tone: repairStatusTone(item.status),
  };
}
