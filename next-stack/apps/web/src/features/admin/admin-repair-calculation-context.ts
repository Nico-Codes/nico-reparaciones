import type { BrandItem, DeviceTypeItem, IssueItem, ModelItem } from './admin-devices-catalog.helpers';
import type { RepairRuleRow } from './admin-repair-pricing-rules.helpers';

export type RepairCalculationScope = {
  deviceTypeId: string;
  deviceBrandId: string;
  deviceModelGroupId: string;
  deviceModelId: string;
  deviceIssueTypeId: string;
};

export type RepairCalculationGroupItem = {
  id: string;
  deviceBrandId: string;
  name: string;
  slug: string;
  active: boolean;
};

export type RepairCalculationCatalog = {
  deviceTypes: DeviceTypeItem[];
  brands: BrandItem[];
  groups: RepairCalculationGroupItem[];
  models: ModelItem[];
  issues: IssueItem[];
};

type SearchParamsReader = {
  get: (key: string) => string | null;
};

export const EMPTY_REPAIR_CALCULATION_SCOPE: RepairCalculationScope = {
  deviceTypeId: '',
  deviceBrandId: '',
  deviceModelGroupId: '',
  deviceModelId: '',
  deviceIssueTypeId: '',
};

const SCOPE_KEYS: Array<keyof RepairCalculationScope> = [
  'deviceTypeId',
  'deviceBrandId',
  'deviceModelGroupId',
  'deviceModelId',
  'deviceIssueTypeId',
];

function normalizeId(value: string | null | undefined) {
  return (value ?? '').trim();
}

function issueMatchesType(issueId: string, deviceTypeId: string, issues: IssueItem[]) {
  if (!issueId) return true;
  const issue = issues.find((item) => item.id === issueId);
  if (!issue) return false;
  return !deviceTypeId || !issue.deviceTypeId || issue.deviceTypeId === deviceTypeId;
}

export function readRepairCalculationScope(searchParams: SearchParamsReader): RepairCalculationScope {
  return {
    deviceTypeId: normalizeId(searchParams.get('deviceTypeId')),
    deviceBrandId: normalizeId(searchParams.get('deviceBrandId')),
    deviceModelGroupId: normalizeId(searchParams.get('deviceModelGroupId')),
    deviceModelId: normalizeId(searchParams.get('deviceModelId')),
    deviceIssueTypeId: normalizeId(searchParams.get('deviceIssueTypeId')),
  };
}

export function buildRepairCalculationSearch(scope: Partial<RepairCalculationScope>) {
  const searchParams = new URLSearchParams();
  for (const key of SCOPE_KEYS) {
    const value = normalizeId(scope[key]);
    if (value) searchParams.set(key, value);
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function applyRepairCalculationScopePatch(
  scope: RepairCalculationScope,
  patch: Partial<RepairCalculationScope>,
  catalog: RepairCalculationCatalog,
): RepairCalculationScope {
  const next = { ...scope, ...patch };

  if ('deviceTypeId' in patch) {
    next.deviceBrandId = '';
    next.deviceModelGroupId = '';
    next.deviceModelId = '';
    if (!issueMatchesType(next.deviceIssueTypeId, next.deviceTypeId, catalog.issues)) {
      next.deviceIssueTypeId = '';
    }
  }

  if ('deviceBrandId' in patch) {
    const brand = catalog.brands.find((item) => item.id === next.deviceBrandId);
    next.deviceModelGroupId = '';
    next.deviceModelId = '';
    if (!brand) {
      next.deviceBrandId = '';
    } else {
      next.deviceTypeId = brand.deviceTypeId ?? next.deviceTypeId;
    }
    if (!issueMatchesType(next.deviceIssueTypeId, next.deviceTypeId, catalog.issues)) {
      next.deviceIssueTypeId = '';
    }
  }

  if ('deviceModelGroupId' in patch) {
    const group = catalog.groups.find((item) => item.id === next.deviceModelGroupId);
    if (!group) {
      next.deviceModelGroupId = '';
      next.deviceModelId = '';
    } else {
      next.deviceBrandId = group.deviceBrandId;
      next.deviceTypeId =
        catalog.brands.find((brand) => brand.id === group.deviceBrandId)?.deviceTypeId ?? next.deviceTypeId;
      const currentModel = catalog.models.find((item) => item.id === next.deviceModelId);
      if (
        currentModel &&
        (currentModel.brandId !== group.deviceBrandId ||
          (currentModel.deviceModelGroupId ?? '') !== group.id)
      ) {
        next.deviceModelId = '';
      }
    }
    if (!issueMatchesType(next.deviceIssueTypeId, next.deviceTypeId, catalog.issues)) {
      next.deviceIssueTypeId = '';
    }
  }

  if ('deviceModelId' in patch) {
    const model = catalog.models.find((item) => item.id === next.deviceModelId);
    if (!model) {
      next.deviceModelId = '';
    } else {
      next.deviceBrandId = model.brandId;
      next.deviceModelGroupId = model.deviceModelGroupId ?? '';
      next.deviceTypeId = catalog.brands.find((brand) => brand.id === model.brandId)?.deviceTypeId ?? next.deviceTypeId;
    }
    if (!issueMatchesType(next.deviceIssueTypeId, next.deviceTypeId, catalog.issues)) {
      next.deviceIssueTypeId = '';
    }
  }

  if ('deviceIssueTypeId' in patch) {
    const issue = catalog.issues.find((item) => item.id === next.deviceIssueTypeId);
    if (!issue) {
      next.deviceIssueTypeId = '';
    } else if (issue.deviceTypeId && issue.deviceTypeId !== next.deviceTypeId) {
      next.deviceTypeId = issue.deviceTypeId;
      const currentBrand = catalog.brands.find((brand) => brand.id === next.deviceBrandId);
      if (!currentBrand || currentBrand.deviceTypeId !== issue.deviceTypeId) {
        next.deviceBrandId = '';
        next.deviceModelGroupId = '';
        next.deviceModelId = '';
      }
    }
  }

  return next;
}

export function hydrateRepairCalculationScope(
  rawScope: RepairCalculationScope,
  catalog: RepairCalculationCatalog,
): RepairCalculationScope {
  let scope = { ...EMPTY_REPAIR_CALCULATION_SCOPE };

  if (rawScope.deviceTypeId) {
    scope = applyRepairCalculationScopePatch(scope, { deviceTypeId: rawScope.deviceTypeId }, catalog);
  }
  if (rawScope.deviceBrandId) {
    scope = applyRepairCalculationScopePatch(scope, { deviceBrandId: rawScope.deviceBrandId }, catalog);
  }
  if (rawScope.deviceModelGroupId) {
    scope = applyRepairCalculationScopePatch(scope, { deviceModelGroupId: rawScope.deviceModelGroupId }, catalog);
  }
  if (rawScope.deviceModelId) {
    scope = applyRepairCalculationScopePatch(scope, { deviceModelId: rawScope.deviceModelId }, catalog);
  }
  if (rawScope.deviceIssueTypeId) {
    scope = applyRepairCalculationScopePatch(scope, { deviceIssueTypeId: rawScope.deviceIssueTypeId }, catalog);
  }

  return scope;
}

export function filterRepairRulesByScope(
  rows: RepairRuleRow[],
  scope: RepairCalculationScope,
  catalog: Pick<RepairCalculationCatalog, 'brands' | 'models' | 'issues'>,
) {
  const selectedBrandName = catalog.brands.find((item) => item.id === scope.deviceBrandId)?.name.toLowerCase() ?? '';
  const selectedModelName = catalog.models.find((item) => item.id === scope.deviceModelId)?.name.toLowerCase() ?? '';
  const selectedIssueName = catalog.issues.find((item) => item.id === scope.deviceIssueTypeId)?.name.toLowerCase() ?? '';

  return rows.filter((row) => {
    if (scope.deviceTypeId && row.deviceTypeId && row.deviceTypeId !== scope.deviceTypeId) return false;
    if (scope.deviceBrandId) {
      if (row.deviceBrandId && row.deviceBrandId !== scope.deviceBrandId) return false;
      if (!row.deviceBrandId && row.brand.trim() && selectedBrandName && row.brand.trim().toLowerCase() !== selectedBrandName) {
        return false;
      }
    }
    if (scope.deviceModelGroupId && row.deviceModelGroupId && row.deviceModelGroupId !== scope.deviceModelGroupId) {
      return false;
    }
    if (scope.deviceModelId) {
      if (row.deviceModelId && row.deviceModelId !== scope.deviceModelId) return false;
      if (!row.deviceModelId && row.model.trim() && selectedModelName && row.model.trim().toLowerCase() !== selectedModelName) {
        return false;
      }
    }
    if (scope.deviceIssueTypeId) {
      if (row.deviceIssueTypeId && row.deviceIssueTypeId !== scope.deviceIssueTypeId) return false;
      if (!row.deviceIssueTypeId && row.repairType.trim() && selectedIssueName && row.repairType.trim().toLowerCase() !== selectedIssueName) {
        return false;
      }
    }
    return true;
  });
}

export function buildRepairRuleSpecificity(row: RepairRuleRow) {
  const dimensions = [
    row.deviceTypeId ? 'Tipo' : '',
    row.deviceBrandId ? 'Marca' : '',
    row.deviceModelGroupId ? 'Grupo' : '',
    row.deviceModelId ? 'Modelo' : '',
    row.deviceIssueTypeId ? 'Falla' : '',
    !row.deviceBrandId && row.brand.trim() ? 'Marca texto' : '',
    !row.deviceModelId && row.model.trim() ? 'Modelo texto' : '',
    !row.deviceIssueTypeId && row.repairType.trim() ? 'Falla texto' : '',
  ].filter(Boolean);

  const level = dimensions.length;
  const tone =
    level >= 5 ? 'maxima' : level >= 4 ? 'muy-alta' : level >= 3 ? 'alta' : level >= 2 ? 'media' : level >= 1 ? 'base' : 'global';

  return {
    level,
    tone,
    shortLabel: level === 0 ? 'Global' : `S${level}`,
    label: level === 0 ? 'Global' : dimensions.join(' + '),
  };
}

export function buildRepairScopeSummary(
  scope: RepairCalculationScope,
  catalog: RepairCalculationCatalog,
) {
  const typeName = catalog.deviceTypes.find((item) => item.id === scope.deviceTypeId)?.name ?? 'Todos';
  const brandName = catalog.brands.find((item) => item.id === scope.deviceBrandId)?.name ?? 'Todas';
  const groupName = catalog.groups.find((item) => item.id === scope.deviceModelGroupId)?.name ?? 'Todos';
  const modelName = catalog.models.find((item) => item.id === scope.deviceModelId)?.name ?? 'Todos';
  const issueName = catalog.issues.find((item) => item.id === scope.deviceIssueTypeId)?.name ?? 'Todas';

  return [
    { label: 'Tipo', value: typeName },
    { label: 'Marca', value: brandName },
    { label: 'Grupo', value: groupName },
    { label: 'Modelo', value: modelName },
    { label: 'Falla', value: issueName },
  ];
}

export function sortRowsByFocusId<T extends { id: string }>(rows: T[], focusId: string) {
  if (!focusId) return rows;
  return [...rows].sort((left, right) => {
    if (left.id === focusId) return -1;
    if (right.id === focusId) return 1;
    return 0;
  });
}
