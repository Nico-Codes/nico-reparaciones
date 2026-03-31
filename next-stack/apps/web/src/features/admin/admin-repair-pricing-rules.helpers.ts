export type RepairPricingCalcMode = 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL';

export type RepairRuleRow = {
  id: string;
  name: string;
  active: boolean;
  brand: string;
  model: string;
  repairType: string;
  basePrice: string;
  percent: string;
  minProfit: string;
  calcMode: RepairPricingCalcMode;
  minFinalPrice: string;
  shippingFee: string;
  priority: string;
  notes: string;
  deviceTypeId?: string | null;
  deviceBrandId?: string | null;
  deviceModelGroupId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
};

export type RepairDeviceType = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
};

export type RepairBrandCatalogItem = {
  id: string;
  deviceTypeId?: string | null;
  name: string;
  slug: string;
  active: boolean;
};

export type RepairModelCatalogItem = {
  id: string;
  brandId: string;
  deviceModelGroupId?: string | null;
  name: string;
  slug: string;
  active: boolean;
  brand: {
    id: string;
    name: string;
    slug: string;
  };
};

export type RepairIssueCatalogItem = {
  id: string;
  deviceTypeId?: string | null;
  name: string;
  slug: string;
  active: boolean;
};

export type RepairModelGroupItem = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
};

type RepairScopeCatalogs = {
  brandsCatalog: RepairBrandCatalogItem[];
  modelsCatalog: RepairModelCatalogItem[];
  issuesCatalog: RepairIssueCatalogItem[];
};

export const REPAIR_PRICING_CALC_MODE_OPTIONS = [
  { value: 'BASE_PLUS_MARGIN', label: 'Base + %' },
  { value: 'FIXED_TOTAL', label: 'Fijo' },
] as const;

export function fromApiRepairRule(row: any): RepairRuleRow {
  return {
    id: row.id,
    name: row.name ?? '',
    active: Boolean(row.active),
    brand: row.deviceBrand ?? '',
    model: row.deviceModel ?? '',
    repairType: row.issueLabel ?? '',
    basePrice: String(row.basePrice ?? 0),
    percent: String(row.profitPercent ?? 0),
    minProfit: row.minProfit != null ? String(row.minProfit) : '',
    calcMode: row.calcMode === 'FIXED_TOTAL' ? 'FIXED_TOTAL' : 'BASE_PLUS_MARGIN',
    minFinalPrice: row.minFinalPrice != null ? String(row.minFinalPrice) : '',
    shippingFee: row.shippingFee != null ? String(row.shippingFee) : '',
    priority: String(row.priority ?? 0),
    notes: row.notes ?? '',
    deviceTypeId: row.deviceTypeId ?? null,
    deviceBrandId: row.deviceBrandId ?? null,
    deviceModelGroupId: row.deviceModelGroupId ?? null,
    deviceModelId: row.deviceModelId ?? null,
    deviceIssueTypeId: row.deviceIssueTypeId ?? null,
  };
}

export function applyRepairScopePatch(
  row: RepairRuleRow,
  patch: Partial<RepairRuleRow>,
  catalogs: RepairScopeCatalogs,
): RepairRuleRow {
  const next = { ...row, ...patch };

  if ('deviceTypeId' in patch) {
    next.deviceBrandId = null;
    next.deviceModelId = null;
    next.deviceModelGroupId = null;
    next.deviceIssueTypeId =
      next.deviceIssueTypeId &&
      catalogs.issuesCatalog.some(
        (issue) => issue.id === next.deviceIssueTypeId && (!next.deviceTypeId || issue.deviceTypeId === next.deviceTypeId),
      )
        ? next.deviceIssueTypeId
        : null;
  }

  if ('deviceBrandId' in patch) {
    const brand = catalogs.brandsCatalog.find((item) => item.id === next.deviceBrandId);
    next.deviceTypeId = brand?.deviceTypeId ?? next.deviceTypeId ?? null;
    next.deviceModelId = null;
    next.deviceModelGroupId = null;
    if (brand) next.brand = brand.name;
  }

  if ('deviceModelId' in patch) {
    const model = catalogs.modelsCatalog.find((item) => item.id === next.deviceModelId);
    next.deviceModelGroupId = model?.deviceModelGroupId ?? null;
    if (model) next.model = model.name;
  }

  if ('deviceModelGroupId' in patch) {
    next.deviceModelId = null;
  }

  if ('deviceIssueTypeId' in patch) {
    const issue = catalogs.issuesCatalog.find((item) => item.id === next.deviceIssueTypeId);
    if (issue) next.repairType = issue.name;
  }

  return next;
}

export function toRepairPricingRuleUpdateInput(row: RepairRuleRow) {
  return {
    name: row.name.trim(),
    active: row.active,
    priority: Number(row.priority || 0),
    deviceTypeId: row.deviceTypeId ?? null,
    deviceBrandId: row.deviceBrandId ?? null,
    deviceModelGroupId: row.deviceModelGroupId ?? null,
    deviceModelId: row.deviceModelId ?? null,
    deviceIssueTypeId: row.deviceIssueTypeId ?? null,
    deviceBrand: row.brand.trim() || null,
    deviceModel: row.model.trim() || null,
    issueLabel: row.repairType.trim() || null,
    basePrice: Number(row.basePrice || 0),
    profitPercent: Number(row.percent || 0),
    minProfit: row.minProfit ? Number(row.minProfit) : null,
    calcMode: row.calcMode,
    minFinalPrice: row.minFinalPrice ? Number(row.minFinalPrice) : null,
    shippingFee: row.shippingFee ? Number(row.shippingFee) : null,
    notes: row.notes.trim() || null,
  };
}

export function filterBrandsByDeviceType(brandsCatalog: RepairBrandCatalogItem[], deviceTypeId: string | null | undefined) {
  return brandsCatalog.filter((brand) => !deviceTypeId || brand.deviceTypeId === deviceTypeId);
}

export function filterModelsByBrand(modelsCatalog: RepairModelCatalogItem[], deviceBrandId: string | null | undefined) {
  return modelsCatalog.filter((model) => !deviceBrandId || model.brandId === deviceBrandId);
}

export function filterModelsByGroup(modelsCatalog: RepairModelCatalogItem[], deviceModelGroupId: string | null | undefined) {
  return modelsCatalog.filter((model) => !deviceModelGroupId || model.deviceModelGroupId === deviceModelGroupId);
}

export function filterIssuesByDeviceType(issuesCatalog: RepairIssueCatalogItem[], deviceTypeId: string | null | undefined) {
  return issuesCatalog.filter((issue) => !deviceTypeId || issue.deviceTypeId === deviceTypeId);
}

export function buildTypeOptions(deviceTypes: RepairDeviceType[]) {
  return [{ value: '', label: 'Tipo: Global' }, ...deviceTypes.map((type) => ({ value: type.id, label: type.name }))];
}

export function buildBrandOptions(brandsCatalog: RepairBrandCatalogItem[]) {
  return [{ value: '', label: 'Marca: Todas' }, ...brandsCatalog.map((brand) => ({ value: brand.id, label: brand.name }))];
}

export function buildGroupOptions(modelGroups: RepairModelGroupItem[], hasBrand: boolean) {
  return [
    { value: '', label: hasBrand ? 'Grupo: Todos' : 'Grupo: primero marca' },
    ...modelGroups.map((group) => ({ value: group.id, label: group.name })),
  ];
}

export function buildModelOptions(modelsCatalog: RepairModelCatalogItem[]) {
  return [{ value: '', label: 'Modelo: Todos' }, ...modelsCatalog.map((model) => ({ value: model.id, label: model.name }))];
}

export function buildIssueOptions(issuesCatalog: RepairIssueCatalogItem[]) {
  return [{ value: '', label: 'Falla: Todas' }, ...issuesCatalog.map((issue) => ({ value: issue.id, label: issue.name }))];
}

export function repairScopeTypeLabel(row: RepairRuleRow, deviceTypeNames: Record<string, string>) {
  return row.deviceTypeId ? (deviceTypeNames[row.deviceTypeId] ?? row.deviceTypeId) : 'Global';
}

export function repairScopeGroupLabel(row: RepairRuleRow, modelGroupNames: Record<string, string>) {
  return row.deviceModelGroupId ? (modelGroupNames[row.deviceModelGroupId] ?? row.deviceModelGroupId) : 'Todos';
}
