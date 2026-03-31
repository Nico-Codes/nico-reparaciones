export type RepairRuleCalcMode = 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL';

export type DeviceTypeOpt = { id: string; name: string; slug: string; active: boolean };
export type BrandOpt = { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean };
export type ModelOpt = {
  id: string;
  brandId: string;
  deviceModelGroupId?: string | null;
  name: string;
  slug: string;
  active: boolean;
  brand: { id: string; name: string; slug: string };
};
export type IssueOpt = { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean };

export type RepairRuleApiItem = {
  id: string;
  name: string;
  active: boolean;
  priority: number;
  deviceTypeId?: string | null;
  deviceBrandId?: string | null;
  deviceModelGroupId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  issueLabel?: string | null;
  basePrice: number;
  profitPercent: number;
  calcMode?: RepairRuleCalcMode;
  minProfit?: number | null;
  minFinalPrice?: number | null;
  shippingFee?: number | null;
  notes?: string | null;
};

export type RepairPricingRuleFormState = {
  name: string;
  deviceTypeId: string;
  brandId: string;
  modelId: string;
  issueId: string;
  brandText: string;
  modelText: string;
  issueText: string;
  basePrice: string;
  profitPercent: string;
  calcMode: RepairRuleCalcMode;
  minProfit: string;
  minFinalPrice: string;
  shippingFee: string;
  priority: string;
  notes: string;
  active: boolean;
};

export type RepairPricingRuleCatalog = {
  deviceTypes: DeviceTypeOpt[];
  brands: BrandOpt[];
  models: ModelOpt[];
  issues: IssueOpt[];
};

export type RepairPricingRuleOption = {
  value: string;
  label: string;
};

export type RepairPricingRuleOptions = {
  deviceTypeOptions: RepairPricingRuleOption[];
  brandOptions: RepairPricingRuleOption[];
  modelOptions: RepairPricingRuleOption[];
  issueOptions: RepairPricingRuleOption[];
  calcModeOptions: RepairPricingRuleOption[];
};

export const REPAIR_RULE_EMPTY_OPTION = { value: '', label: '-' };

export const REPAIR_RULE_CALC_MODE_OPTIONS: RepairPricingRuleOption[] = [
  { value: 'BASE_PLUS_MARGIN', label: 'Base + % margen' },
  { value: 'FIXED_TOTAL', label: 'Total fijo' },
];

export function createRepairPricingRuleFormState(): RepairPricingRuleFormState {
  return {
    name: '',
    deviceTypeId: '',
    brandId: '',
    modelId: '',
    issueId: '',
    brandText: '',
    modelText: '',
    issueText: '',
    basePrice: '0',
    profitPercent: '25',
    calcMode: 'BASE_PLUS_MARGIN',
    minProfit: '',
    minFinalPrice: '',
    shippingFee: '',
    priority: '0',
    notes: '',
    active: true,
  };
}

export function buildRepairPricingRuleFormState(rule: RepairRuleApiItem): RepairPricingRuleFormState {
  return {
    name: rule.name ?? '',
    deviceTypeId: rule.deviceTypeId ?? '',
    brandId: rule.deviceBrandId ?? '',
    modelId: rule.deviceModelId ?? '',
    issueId: rule.deviceIssueTypeId ?? '',
    brandText: rule.deviceBrand ?? '',
    modelText: rule.deviceModel ?? '',
    issueText: rule.issueLabel ?? '',
    basePrice: String(rule.basePrice ?? 0),
    profitPercent: String(rule.profitPercent ?? 0),
    calcMode: rule.calcMode === 'FIXED_TOTAL' ? 'FIXED_TOTAL' : 'BASE_PLUS_MARGIN',
    minProfit: rule.minProfit != null ? String(rule.minProfit) : '',
    minFinalPrice: rule.minFinalPrice != null ? String(rule.minFinalPrice) : '',
    shippingFee: rule.shippingFee != null ? String(rule.shippingFee) : '',
    priority: String(rule.priority ?? 0),
    notes: rule.notes ?? '',
    active: Boolean(rule.active),
  };
}

export function buildRepairPricingRuleOptions(
  catalog: RepairPricingRuleCatalog,
  form: Pick<RepairPricingRuleFormState, 'deviceTypeId' | 'brandId'>,
): RepairPricingRuleOptions {
  const filteredBrands = form.deviceTypeId
    ? catalog.brands.filter((brand) => brand.deviceTypeId === form.deviceTypeId)
    : catalog.brands;
  const filteredModels = form.brandId
    ? catalog.models.filter((model) => model.brandId === form.brandId)
    : catalog.models;
  const filteredIssues = form.deviceTypeId
    ? catalog.issues.filter((issue) => issue.deviceTypeId === form.deviceTypeId)
    : catalog.issues;

  return {
    deviceTypeOptions: [REPAIR_RULE_EMPTY_OPTION, ...catalog.deviceTypes.map((type) => ({ value: type.id, label: type.name }))],
    brandOptions: [REPAIR_RULE_EMPTY_OPTION, ...filteredBrands.map((brand) => ({ value: brand.id, label: brand.name }))],
    modelOptions: [REPAIR_RULE_EMPTY_OPTION, ...filteredModels.map((model) => ({ value: model.id, label: model.name }))],
    issueOptions: [REPAIR_RULE_EMPTY_OPTION, ...filteredIssues.map((issue) => ({ value: issue.id, label: issue.name }))],
    calcModeOptions: REPAIR_RULE_CALC_MODE_OPTIONS,
  };
}

export function applyRepairPricingRuleDeviceType(
  form: RepairPricingRuleFormState,
  nextDeviceTypeId: string,
  issues: IssueOpt[],
): RepairPricingRuleFormState {
  return {
    ...form,
    deviceTypeId: nextDeviceTypeId,
    brandId: '',
    modelId: '',
    issueId: isRepairPricingRuleIssueCompatible(form.issueId, issues, nextDeviceTypeId) ? form.issueId : '',
  };
}

export function applyRepairPricingRuleBrand(
  form: RepairPricingRuleFormState,
  brandId: string,
  brands: BrandOpt[],
  issues: IssueOpt[],
): RepairPricingRuleFormState {
  const selectedBrand = brands.find((brand) => brand.id === brandId);
  const nextDeviceTypeId =
    selectedBrand?.deviceTypeId && selectedBrand.deviceTypeId !== form.deviceTypeId
      ? selectedBrand.deviceTypeId
      : form.deviceTypeId;

  return {
    ...form,
    deviceTypeId: nextDeviceTypeId,
    brandId,
    modelId: '',
    issueId: isRepairPricingRuleIssueCompatible(form.issueId, issues, nextDeviceTypeId) ? form.issueId : '',
  };
}

export function buildRepairPricingRulePayload(form: RepairPricingRuleFormState, catalog: Pick<RepairPricingRuleCatalog, 'brands' | 'models' | 'issues'>) {
  return {
    name: form.name.trim() || `Regla ${form.issueText || 'reparación'}`,
    active: form.active,
    priority: Number(form.priority || 0),
    deviceTypeId: form.deviceTypeId || (catalog.brands.find((brand) => brand.id === form.brandId)?.deviceTypeId ?? null),
    deviceBrandId: form.brandId || null,
    deviceModelGroupId: catalog.models.find((model) => model.id === form.modelId)?.deviceModelGroupId ?? null,
    deviceModelId: form.modelId || null,
    deviceIssueTypeId: form.issueId || null,
    deviceBrand: form.brandText.trim() || (catalog.brands.find((brand) => brand.id === form.brandId)?.name ?? null),
    deviceModel: form.modelText.trim() || (catalog.models.find((model) => model.id === form.modelId)?.name ?? null),
    issueLabel: form.issueText.trim() || (catalog.issues.find((issue) => issue.id === form.issueId)?.name ?? null),
    basePrice: Number(form.basePrice || 0),
    profitPercent: Number(form.profitPercent || 0),
    calcMode: form.calcMode,
    minProfit: form.minProfit ? Number(form.minProfit) : null,
    minFinalPrice: form.minFinalPrice ? Number(form.minFinalPrice) : null,
    shippingFee: form.shippingFee ? Number(form.shippingFee) : null,
    notes: form.notes.trim() || null,
  };
}

export function canSaveRepairPricingRule(form: RepairPricingRuleFormState) {
  return Boolean(form.name.trim() || form.issueText.trim() || form.issueId);
}

export function isRepairPricingRuleIssueCompatible(issueId: string, issues: IssueOpt[], deviceTypeId: string) {
  if (!issueId) return true;
  return issues.some((issue) => issue.id === issueId && (!deviceTypeId || issue.deviceTypeId === deviceTypeId));
}
