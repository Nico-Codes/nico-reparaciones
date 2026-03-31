import type { AdminRepairCreateInput } from './api';

export type DeviceTypeItem = { id: string; name: string; slug: string; active: boolean };
export type BrandItem = { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean };
export type ModelItem = {
  id: string;
  brandId: string;
  deviceModelGroupId?: string | null;
  name: string;
  slug: string;
  active: boolean;
  brand: { id: string; name: string; slug: string };
};
export type IssueItem = { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean };

export type AdminRepairCreateFormErrors = Partial<Record<'customerName' | 'customerPhone' | 'quotedPrice', string>>;

export type AdminRepairCreateFormValues = {
  customerName: string;
  customerPhone: string;
  deviceTypeId: string;
  deviceBrandId: string;
  deviceModelId: string;
  deviceIssueTypeId: string;
  deviceBrand: string;
  deviceModel: string;
  issueLabel: string;
  quotedPrice: string;
  notes: string;
};

export type AdminRepairCreateResolvedValues = {
  brand: string | null;
  model: string | null;
  issue: string | null;
  quotedPrice: number | null;
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

export function parseOptionalMoney(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return { value: null, error: '' };
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, error: 'Ingresa un importe valido mayor o igual a 0.' };
  }
  return { value: parsed, error: '' };
}

export function buildDeviceTypeOptions(items: DeviceTypeItem[]) {
  return [{ value: '', label: 'No usar catalogo' }, ...items.map((item) => ({ value: item.id, label: item.name }))];
}

export function buildBrandOptions(items: BrandItem[]) {
  return [{ value: '', label: 'Marca manual' }, ...items.map((item) => ({ value: item.id, label: item.name }))];
}

export function buildModelOptions(items: ModelItem[]) {
  return [{ value: '', label: 'Modelo manual' }, ...items.map((item) => ({ value: item.id, label: item.name }))];
}

export function buildIssueOptions(items: IssueItem[]) {
  return [{ value: '', label: 'Falla manual' }, ...items.map((item) => ({ value: item.id, label: item.name }))];
}

export function buildRepairCreateDevicePreview(brand: string | null, model: string | null) {
  return [brand, model].filter(Boolean).join(' ') || 'Pendiente de definir';
}

export function validateRepairCreateForm(input: {
  customerName: string;
  customerPhone: string;
  quotedPriceError: string;
  quotedPriceValue: number | null;
  pendingPricingSnapshotDraft: AdminRepairCreateInput['pricingSnapshotDraft'];
}) {
  const nextErrors: AdminRepairCreateFormErrors = {};

  if (input.customerName.trim().length < 2) {
    nextErrors.customerName = 'Ingresa al menos 2 caracteres para identificar al cliente.';
  }

  const phoneError = validatePhone(input.customerPhone);
  if (phoneError) {
    nextErrors.customerPhone = phoneError;
  }

  if (input.quotedPriceError) {
    nextErrors.quotedPrice = input.quotedPriceError;
  }

  if (input.pendingPricingSnapshotDraft && input.quotedPriceValue == null) {
    nextErrors.quotedPrice = 'Define un presupuesto antes de guardar un snapshot aplicado.';
  }

  return nextErrors;
}

export function buildRepairCreatePayload(input: {
  form: AdminRepairCreateFormValues;
  resolved: AdminRepairCreateResolvedValues;
  pendingPricingSnapshotDraft: AdminRepairCreateInput['pricingSnapshotDraft'];
}) {
  return {
    customerName: input.form.customerName.trim(),
    customerPhone: normalizeNullable(input.form.customerPhone),
    deviceTypeId: normalizeNullable(input.form.deviceTypeId),
    deviceBrandId: normalizeNullable(input.form.deviceBrandId),
    deviceModelId: normalizeNullable(input.form.deviceModelId),
    deviceIssueTypeId: normalizeNullable(input.form.deviceIssueTypeId),
    deviceBrand: input.resolved.brand,
    deviceModel: input.resolved.model,
    issueLabel: input.resolved.issue,
    quotedPrice: input.resolved.quotedPrice,
    notes: normalizeNullable(input.form.notes),
    pricingSnapshotDraft: input.pendingPricingSnapshotDraft,
  } satisfies AdminRepairCreateInput;
}
