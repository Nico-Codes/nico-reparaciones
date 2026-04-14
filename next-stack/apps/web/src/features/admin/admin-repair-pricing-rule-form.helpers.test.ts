import { describe, expect, it } from 'vitest';
import {
  applyRepairPricingRuleBrand,
  applyRepairPricingRuleDeviceType,
  buildRepairPricingRuleOptions,
  buildRepairPricingRulePayload,
  canSaveRepairPricingRule,
  createRepairPricingRuleFormState,
} from './admin-repair-pricing-rule-form.helpers';

const catalog = {
  deviceTypes: [
    { id: 'type-a', name: 'Celular', slug: 'celular', active: true },
    { id: 'type-b', name: 'Consola', slug: 'consola', active: true },
  ],
  brands: [
    { id: 'brand-a', deviceTypeId: 'type-a', name: 'Samsung', slug: 'samsung', active: true },
    { id: 'brand-b', deviceTypeId: 'type-b', name: 'Sony', slug: 'sony', active: true },
  ],
  modelGroupsByBrand: {
    'brand-a': [{ id: 'group-a', name: 'Serie A', slug: 'serie-a', active: true }],
    'brand-b': [],
  },
  models: [
    {
      id: 'model-a',
      brandId: 'brand-a',
      deviceModelGroupId: 'group-a',
      name: 'A32',
      slug: 'a32',
      active: true,
      brand: { id: 'brand-a', name: 'Samsung', slug: 'samsung' },
    },
  ],
  issues: [
    { id: 'issue-a', deviceTypeId: 'type-a', name: 'Módulo', slug: 'modulo', active: true },
    { id: 'issue-b', deviceTypeId: 'type-b', name: 'HDMI', slug: 'hdmi', active: true },
  ],
};

describe('admin-repair-pricing-rule-form.helpers', () => {
  it('filters brand, model and issue options from current scope', () => {
    const options = buildRepairPricingRuleOptions(catalog, {
      deviceTypeId: 'type-a',
      brandId: 'brand-a',
      modelGroupId: '',
    });

    expect(options.brandOptions.map((item) => item.value)).toEqual(['', 'brand-a']);
    expect(options.groupOptions.map((item) => item.value)).toEqual(['', 'group-a']);
    expect(options.modelOptions.map((item) => item.value)).toEqual(['', 'model-a']);
    expect(options.issueOptions.map((item) => item.value)).toEqual(['', 'issue-a']);
  });

  it('syncs device type and clears dependent fields when brand or device type changes', () => {
    const form = {
      ...createRepairPricingRuleFormState(),
      deviceTypeId: 'type-a',
      brandId: 'brand-a',
      modelId: 'model-a',
      issueId: 'issue-a',
    };

    expect(applyRepairPricingRuleDeviceType(form, 'type-b', catalog.issues)).toMatchObject({
      deviceTypeId: 'type-b',
      brandId: '',
      modelId: '',
      issueId: '',
    });

    expect(applyRepairPricingRuleBrand(form, 'brand-b', catalog.brands, catalog.issues)).toMatchObject({
      deviceTypeId: 'type-b',
      brandId: 'brand-b',
      modelId: '',
      issueId: '',
    });
  });

  it('builds payload with catalog fallback names and group id', () => {
    const payload = buildRepairPricingRulePayload(
      {
        ...createRepairPricingRuleFormState(),
        brandId: 'brand-a',
        modelId: 'model-a',
        issueId: 'issue-a',
        basePrice: '100',
        profitPercent: '25',
        shippingFee: '10',
      },
      catalog,
    );

    expect(payload.deviceTypeId).toBe('type-a');
    expect(payload.deviceBrand).toBe('Samsung');
    expect(payload.deviceModel).toBe('A32');
    expect(payload.issueLabel).toBe('Módulo');
    expect(payload.deviceModelGroupId).toBe('group-a');
    expect(payload.shippingFee).toBe(10);
  });

  it('requires either name or issue info before saving', () => {
    expect(canSaveRepairPricingRule(createRepairPricingRuleFormState())).toBe(false);
    expect(canSaveRepairPricingRule({ ...createRepairPricingRuleFormState(), issueText: 'Módulo' })).toBe(true);
  });
});
