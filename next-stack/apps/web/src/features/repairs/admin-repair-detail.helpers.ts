import type { RepairPricingSnapshotDraft } from './api';
import { repairStatusLabel } from './repair-ui';
import type { RepairItem } from './types';

export const DETAIL_STATUS_OPTIONS = [
  'RECEIVED',
  'DIAGNOSING',
  'WAITING_APPROVAL',
  'REPAIRING',
  'READY_PICKUP',
  'DELIVERED',
  'CANCELLED',
].map((status) => ({
  value: status,
  label: repairStatusLabel(status),
}));

export type AdminRepairDetailFormErrors = Partial<Record<'customerName' | 'customerPhone' | 'quotedPrice' | 'finalPrice', string>>;

export type AdminRepairDetailFormValues = {
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  issueLabel: string;
  status: string;
  quotedPrice: string;
  finalPrice: string;
  notes: string;
};

export type AdminRepairDetailNormalizedDraft = {
  customerName: string;
  customerPhone: string | null;
  deviceBrand: string | null;
  deviceModel: string | null;
  issueLabel: string | null;
  status: string;
  quotedPrice: number | null;
  finalPrice: number | null;
  notes: string | null;
};

export type AdminRepairDetailPatch = Partial<
  Pick<
    RepairItem,
    'customerName' | 'customerPhone' | 'deviceBrand' | 'deviceModel' | 'issueLabel' | 'status' | 'quotedPrice' | 'finalPrice' | 'notes'
  >
> & {
  pricingSnapshotDraft?: RepairPricingSnapshotDraft;
};

export function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function normalizePhone(value: string) {
  return value.replace(/\D+/g, '');
}

export function validatePhone(value: string) {
  const digits = normalizePhone(value);
  if (!digits) return '';
  if (digits.length < 6) return 'Ingresa un telefono valido con al menos 6 digitos.';
  if (digits.length > 20) return 'El telefono no puede superar los 20 digitos.';
  return '';
}

export function parseOptionalMoney(value: string, fieldLabel: string) {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return { value: null, error: '' };
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, error: `Ingresa un ${fieldLabel.toLowerCase()} valido mayor o igual a 0.` };
  }
  return { value: parsed, error: '' };
}

export function eventTypeLabel(eventType: string) {
  switch (eventType) {
    case 'CREATED':
      return 'Alta del caso';
    case 'UPDATED':
      return 'Edicion manual';
    case 'STATUS_CHANGED':
      return 'Cambio de estado';
    default:
      return eventType;
  }
}

export function sameNullableString(left: string | null, right: string | null) {
  return (left ?? null) === (right ?? null);
}

export function repairDetailStatusAlertTone(status: string) {
  if (status === 'CANCELLED') return 'danger' as const;
  if (status === 'READY_PICKUP' || status === 'DELIVERED') return 'success' as const;
  if (status === 'WAITING_APPROVAL') return 'warning' as const;
  return 'info' as const;
}

export function buildRepairDetailSummary(quotedPrice: number | null, finalPrice: number | null, timelineCount: number) {
  return {
    quoted: quotedPrice,
    final: finalPrice,
    timelineCount,
  };
}

export function hasRepairDetailChanges(
  item: RepairItem | null,
  draft: AdminRepairDetailNormalizedDraft,
  pendingPricingSnapshotDraft: RepairPricingSnapshotDraft | null,
) {
  if (!item) return false;
  return !(
    item.customerName === draft.customerName &&
    sameNullableString(item.customerPhone, draft.customerPhone) &&
    sameNullableString(item.deviceBrand, draft.deviceBrand) &&
    sameNullableString(item.deviceModel, draft.deviceModel) &&
    sameNullableString(item.issueLabel, draft.issueLabel) &&
    item.status === draft.status &&
    item.quotedPrice === draft.quotedPrice &&
    item.finalPrice === draft.finalPrice &&
    sameNullableString(item.notes, draft.notes) &&
    !pendingPricingSnapshotDraft
  );
}

export function buildRepairDetailPatch(
  item: RepairItem,
  draft: AdminRepairDetailNormalizedDraft,
  pendingPricingSnapshotDraft: RepairPricingSnapshotDraft | null,
) {
  const patch: AdminRepairDetailPatch = {};

  if (item.customerName !== draft.customerName) patch.customerName = draft.customerName;
  if (!sameNullableString(item.customerPhone, draft.customerPhone)) patch.customerPhone = draft.customerPhone;
  if (!sameNullableString(item.deviceBrand, draft.deviceBrand)) patch.deviceBrand = draft.deviceBrand;
  if (!sameNullableString(item.deviceModel, draft.deviceModel)) patch.deviceModel = draft.deviceModel;
  if (!sameNullableString(item.issueLabel, draft.issueLabel)) patch.issueLabel = draft.issueLabel;
  if (item.status !== draft.status) patch.status = draft.status;
  if (item.quotedPrice !== draft.quotedPrice) patch.quotedPrice = draft.quotedPrice;
  if (item.finalPrice !== draft.finalPrice) patch.finalPrice = draft.finalPrice;
  if (!sameNullableString(item.notes, draft.notes)) patch.notes = draft.notes;
  if (pendingPricingSnapshotDraft) patch.pricingSnapshotDraft = pendingPricingSnapshotDraft;

  return patch;
}
