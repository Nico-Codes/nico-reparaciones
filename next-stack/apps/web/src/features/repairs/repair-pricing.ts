import type { RepairPricingResolveInput, RepairPricingResolveResult } from './api';

type RepairPricingSource = {
  deviceTypeId?: string | null;
  deviceBrandId?: string | null;
  deviceModelGroupId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  issueLabel?: string | null;
};

function cleanText(value?: string | null) {
  const trimmed = value?.trim() ?? '';
  return trimmed || undefined;
}

function cleanId(value?: string | null) {
  const trimmed = value?.trim() ?? '';
  return trimmed || undefined;
}

export function buildRepairPricingInput(source: RepairPricingSource): {
  input: RepairPricingResolveInput;
  key: string;
  canResolve: boolean;
  reason: string;
} {
  const input: RepairPricingResolveInput = {
    deviceTypeId: cleanId(source.deviceTypeId),
    deviceBrandId: cleanId(source.deviceBrandId),
    deviceModelGroupId: cleanId(source.deviceModelGroupId),
    deviceModelId: cleanId(source.deviceModelId),
    deviceIssueTypeId: cleanId(source.deviceIssueTypeId),
    deviceBrand: cleanText(source.deviceBrand),
    deviceModel: cleanText(source.deviceModel),
    issueLabel: cleanText(source.issueLabel),
  };

  const hasIssue = Boolean(input.deviceIssueTypeId || input.issueLabel);
  const hasDeviceContext = Boolean(
    input.deviceTypeId ||
      input.deviceBrandId ||
      input.deviceModelGroupId ||
      input.deviceModelId ||
      input.deviceBrand ||
      input.deviceModel,
  );

  let reason = '';
  if (!hasIssue) {
    reason = 'Carga o selecciona una falla para calcular una sugerencia automatica.';
  } else if (!hasDeviceContext) {
    reason = 'Agrega al menos un dato del equipo (tipo, marca o modelo) para consultar reglas activas.';
  }

  const key = JSON.stringify([
    input.deviceTypeId ?? '',
    input.deviceBrandId ?? '',
    input.deviceModelGroupId ?? '',
    input.deviceModelId ?? '',
    input.deviceIssueTypeId ?? '',
    input.deviceBrand ?? '',
    input.deviceModel ?? '',
    input.issueLabel ?? '',
  ]);

  return {
    input,
    key,
    canResolve: hasIssue && hasDeviceContext,
    reason,
  };
}

export function formatSuggestedPriceInput(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function pricingRuleModeLabel(result: RepairPricingResolveResult | null) {
  const mode = result?.suggestion?.calcMode ?? result?.rule?.calcMode;
  if (mode === 'FIXED_TOTAL') return 'Total fijo';
  return 'Base + margen';
}


