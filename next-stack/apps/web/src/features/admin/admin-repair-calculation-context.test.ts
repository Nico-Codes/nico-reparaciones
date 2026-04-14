import { describe, expect, it } from 'vitest';
import {
  EMPTY_REPAIR_CALCULATION_SCOPE,
  applyRepairCalculationScopePatch,
  buildRepairCalculationSearch,
  buildRepairRuleSpecificity,
  filterRepairRulesByScope,
  hydrateRepairCalculationScope,
  type RepairCalculationCatalog,
} from './admin-repair-calculation-context';
import type { RepairRuleRow } from './admin-repair-pricing-rules.helpers';

const catalog: RepairCalculationCatalog = {
  deviceTypes: [
    { id: 'type-phone', name: 'Celular', slug: 'celular', active: true },
    { id: 'type-console', name: 'Consola', slug: 'consola', active: true },
  ],
  brands: [
    { id: 'brand-samsung', deviceTypeId: 'type-phone', name: 'Samsung', slug: 'samsung', active: true },
    { id: 'brand-sony', deviceTypeId: 'type-console', name: 'Sony', slug: 'sony', active: true },
  ],
  groups: [
    { id: 'group-a', deviceBrandId: 'brand-samsung', name: 'Serie A', slug: 'serie-a', active: true },
  ],
  models: [
    {
      id: 'model-a32',
      brandId: 'brand-samsung',
      deviceModelGroupId: 'group-a',
      name: 'A32',
      slug: 'a32',
      active: true,
      brand: { id: 'brand-samsung', name: 'Samsung', slug: 'samsung' },
    },
  ],
  issues: [
    { id: 'issue-screen', deviceTypeId: 'type-phone', name: 'Modulo', slug: 'modulo', active: true },
    { id: 'issue-hdmi', deviceTypeId: 'type-console', name: 'HDMI', slug: 'hdmi', active: true },
  ],
};

const rules: RepairRuleRow[] = [
  {
    id: 'rule-global',
    name: 'Global',
    active: true,
    brand: '',
    model: '',
    repairType: '',
    basePrice: '100',
    percent: '30',
    minProfit: '',
    calcMode: 'BASE_PLUS_MARGIN',
    minFinalPrice: '',
    shippingFee: '',
    priority: '0',
    notes: '',
    deviceTypeId: null,
    deviceBrandId: null,
    deviceModelGroupId: null,
    deviceModelId: null,
    deviceIssueTypeId: null,
  },
  {
    id: 'rule-samsung-screen',
    name: 'Samsung modulo',
    active: true,
    brand: 'Samsung',
    model: '',
    repairType: 'Modulo',
    basePrice: '200',
    percent: '35',
    minProfit: '',
    calcMode: 'BASE_PLUS_MARGIN',
    minFinalPrice: '',
    shippingFee: '',
    priority: '20',
    notes: '',
    deviceTypeId: 'type-phone',
    deviceBrandId: 'brand-samsung',
    deviceModelGroupId: null,
    deviceModelId: null,
    deviceIssueTypeId: 'issue-screen',
  },
];

describe('admin-repair-calculation-context', () => {
  it('hidrata el scope respetando el arbol tipo -> marca -> grupo -> modelo y falla por tipo', () => {
    const hydrated = hydrateRepairCalculationScope(
      {
        deviceTypeId: '',
        deviceBrandId: 'brand-samsung',
        deviceModelGroupId: 'group-a',
        deviceModelId: 'model-a32',
        deviceIssueTypeId: 'issue-screen',
      },
      catalog,
    );

    expect(hydrated).toEqual({
      deviceTypeId: 'type-phone',
      deviceBrandId: 'brand-samsung',
      deviceModelGroupId: 'group-a',
      deviceModelId: 'model-a32',
      deviceIssueTypeId: 'issue-screen',
    });
  });

  it('limpia dependencias cuando cambia el tipo de dispositivo', () => {
    const next = applyRepairCalculationScopePatch(
      {
        deviceTypeId: 'type-phone',
        deviceBrandId: 'brand-samsung',
        deviceModelGroupId: 'group-a',
        deviceModelId: 'model-a32',
        deviceIssueTypeId: 'issue-screen',
      },
      { deviceTypeId: 'type-console' },
      catalog,
    );

    expect(next).toEqual({
      deviceTypeId: 'type-console',
      deviceBrandId: '',
      deviceModelGroupId: '',
      deviceModelId: '',
      deviceIssueTypeId: '',
    });
  });

  it('filtra reglas visibles para el scope actual sin perder las globales', () => {
    const visible = filterRepairRulesByScope(
      rules,
      {
        ...EMPTY_REPAIR_CALCULATION_SCOPE,
        deviceTypeId: 'type-phone',
        deviceBrandId: 'brand-samsung',
        deviceIssueTypeId: 'issue-screen',
      },
      catalog,
    );

    expect(visible.map((row) => row.id)).toEqual(['rule-global', 'rule-samsung-screen']);
  });

  it('calcula la especificidad visible para explicar prioridad de matching', () => {
    expect(buildRepairRuleSpecificity(rules[0])).toEqual({
      level: 0,
      tone: 'global',
      shortLabel: 'Global',
      label: 'Global',
    });
    expect(buildRepairRuleSpecificity(rules[1]).label).toBe('Tipo + Marca + Falla');
  });

  it('arma query string limpia con solo el contexto activo', () => {
    expect(
      buildRepairCalculationSearch({
        deviceTypeId: 'type-phone',
        deviceBrandId: 'brand-samsung',
        deviceModelGroupId: '',
        deviceModelId: '',
        deviceIssueTypeId: 'issue-screen',
      }),
    ).toBe('?deviceTypeId=type-phone&deviceBrandId=brand-samsung&deviceIssueTypeId=issue-screen');
  });
});
