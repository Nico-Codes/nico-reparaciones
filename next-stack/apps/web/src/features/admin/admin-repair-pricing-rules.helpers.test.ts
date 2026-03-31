import { describe, expect, it } from 'vitest';
import {
  applyRepairScopePatch,
  buildBrandOptions,
  buildGroupOptions,
  buildIssueOptions,
  buildModelOptions,
  buildTypeOptions,
  fromApiRepairRule,
  repairScopeGroupLabel,
  repairScopeTypeLabel,
  toRepairPricingRuleUpdateInput,
  type RepairBrandCatalogItem,
  type RepairIssueCatalogItem,
  type RepairModelCatalogItem,
  type RepairModelGroupItem,
  type RepairRuleRow,
} from './admin-repair-pricing-rules.helpers';

function makeRow(input: Partial<RepairRuleRow> = {}): RepairRuleRow {
  return {
    id: input.id ?? 'rule-1',
    name: input.name ?? 'Cambio de modulo',
    active: input.active ?? true,
    brand: input.brand ?? '',
    model: input.model ?? '',
    repairType: input.repairType ?? '',
    basePrice: input.basePrice ?? '10000',
    percent: input.percent ?? '40',
    minProfit: input.minProfit ?? '1000',
    calcMode: input.calcMode ?? 'BASE_PLUS_MARGIN',
    minFinalPrice: input.minFinalPrice ?? '0',
    shippingFee: input.shippingFee ?? '500',
    priority: input.priority ?? '2',
    notes: input.notes ?? '',
    deviceTypeId: input.deviceTypeId ?? null,
    deviceBrandId: input.deviceBrandId ?? null,
    deviceModelGroupId: input.deviceModelGroupId ?? null,
    deviceModelId: input.deviceModelId ?? null,
    deviceIssueTypeId: input.deviceIssueTypeId ?? null,
  };
}

const brandsCatalog: RepairBrandCatalogItem[] = [
  { id: 'brand-a', deviceTypeId: 'type-phone', name: 'Samsung', slug: 'samsung', active: true },
];

const modelsCatalog: RepairModelCatalogItem[] = [
  {
    id: 'model-a',
    brandId: 'brand-a',
    deviceModelGroupId: 'group-a',
    name: 'Galaxy A10',
    slug: 'galaxy-a10',
    active: true,
    brand: { id: 'brand-a', name: 'Samsung', slug: 'samsung' },
  },
];

const issuesCatalog: RepairIssueCatalogItem[] = [
  { id: 'issue-phone', deviceTypeId: 'type-phone', name: 'Modulo', slug: 'modulo', active: true },
  { id: 'issue-tablet', deviceTypeId: 'type-tablet', name: 'Bateria', slug: 'bateria', active: true },
];

const modelGroups: RepairModelGroupItem[] = [
  { id: 'group-a', name: 'Serie A', slug: 'serie-a', active: true },
];

describe('admin-repair-pricing-rules.helpers', () => {
  it('maps api rows and builds update payloads', () => {
    const row = fromApiRepairRule({
      id: 'rule-9',
      name: 'Samsung modulo',
      active: 1,
      deviceBrand: 'Samsung',
      deviceModel: 'Galaxy A10',
      issueLabel: 'Modulo',
      basePrice: 15000,
      profitPercent: 55,
      minProfit: 1800,
      calcMode: 'FIXED_TOTAL',
      minFinalPrice: 22000,
      shippingFee: 900,
      priority: 4,
      notes: 'Test',
      deviceTypeId: 'type-phone',
      deviceBrandId: 'brand-a',
      deviceModelGroupId: 'group-a',
      deviceModelId: 'model-a',
      deviceIssueTypeId: 'issue-phone',
    });

    expect(row).toMatchObject({
      id: 'rule-9',
      calcMode: 'FIXED_TOTAL',
      basePrice: '15000',
      percent: '55',
      minProfit: '1800',
      minFinalPrice: '22000',
      shippingFee: '900',
      priority: '4',
    });

    expect(toRepairPricingRuleUpdateInput(row)).toEqual({
      name: 'Samsung modulo',
      active: true,
      priority: 4,
      deviceTypeId: 'type-phone',
      deviceBrandId: 'brand-a',
      deviceModelGroupId: 'group-a',
      deviceModelId: 'model-a',
      deviceIssueTypeId: 'issue-phone',
      deviceBrand: 'Samsung',
      deviceModel: 'Galaxy A10',
      issueLabel: 'Modulo',
      basePrice: 15000,
      profitPercent: 55,
      minProfit: 1800,
      calcMode: 'FIXED_TOTAL',
      minFinalPrice: 22000,
      shippingFee: 900,
      notes: 'Test',
    });
  });

  it('patches scope dependencies and derived labels', () => {
    const initial = makeRow({ deviceTypeId: 'type-tablet', deviceIssueTypeId: 'issue-tablet' });

    const withBrand = applyRepairScopePatch(initial, { deviceBrandId: 'brand-a' }, { brandsCatalog, modelsCatalog, issuesCatalog });
    expect(withBrand.deviceTypeId).toBe('type-phone');
    expect(withBrand.deviceModelId).toBeNull();
    expect(withBrand.deviceModelGroupId).toBeNull();
    expect(withBrand.brand).toBe('Samsung');

    const withModel = applyRepairScopePatch(withBrand, { deviceModelId: 'model-a' }, { brandsCatalog, modelsCatalog, issuesCatalog });
    expect(withModel.deviceModelGroupId).toBe('group-a');
    expect(withModel.model).toBe('Galaxy A10');

    const withIssue = applyRepairScopePatch(withModel, { deviceIssueTypeId: 'issue-phone' }, { brandsCatalog, modelsCatalog, issuesCatalog });
    expect(withIssue.repairType).toBe('Modulo');

    const withTypeReset = applyRepairScopePatch(withIssue, { deviceTypeId: 'type-tablet' }, { brandsCatalog, modelsCatalog, issuesCatalog });
    expect(withTypeReset.deviceBrandId).toBeNull();
    expect(withTypeReset.deviceModelId).toBeNull();
    expect(withTypeReset.deviceModelGroupId).toBeNull();
    expect(withTypeReset.deviceIssueTypeId).toBeNull();
  });

  it('builds scope options and summary labels', () => {
    expect(buildTypeOptions([{ id: 'type-phone', name: 'Celulares', slug: 'celulares', active: true }])).toEqual([
      { value: '', label: 'Tipo: Global' },
      { value: 'type-phone', label: 'Celulares' },
    ]);
    expect(buildBrandOptions(brandsCatalog)[1]).toEqual({ value: 'brand-a', label: 'Samsung' });
    expect(buildGroupOptions(modelGroups, true)[0]).toEqual({ value: '', label: 'Grupo: Todos' });
    expect(buildModelOptions(modelsCatalog)[1]).toEqual({ value: 'model-a', label: 'Galaxy A10' });
    expect(buildIssueOptions(issuesCatalog)[1]).toEqual({ value: 'issue-phone', label: 'Modulo' });

    const row = makeRow({ deviceTypeId: 'type-phone', deviceModelGroupId: 'group-a' });
    expect(repairScopeTypeLabel(row, { 'type-phone': 'Celulares' })).toBe('Celulares');
    expect(repairScopeGroupLabel(row, { 'group-a': 'Serie A' })).toBe('Serie A');
  });
});
