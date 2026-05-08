import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PricingService } from './pricing.service.js';

function repairRule(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rule-base',
    name: 'Regla base',
    active: true,
    priority: 0,
    deviceTypeId: null,
    deviceBrandId: null,
    deviceModelGroupId: null,
    deviceModelId: null,
    deviceIssueTypeId: null,
    deviceBrand: null,
    deviceModel: null,
    issueLabel: null,
    basePrice: 10000,
    profitPercent: 20,
    calcMode: 'BASE_PLUS_MARGIN',
    minProfit: null,
    minFinalPrice: null,
    shippingFee: null,
    notes: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createPrismaMock(overrides: Record<string, unknown> = {}) {
  return {
    repairPricingRule: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    supplier: {
      findUnique: vi.fn(),
    },
    deviceBrand: {
      findUnique: vi.fn(),
    },
    deviceModelGroup: {
      findUnique: vi.fn(),
    },
    deviceModel: {
      findUnique: vi.fn(),
    },
    deviceIssueType: {
      findUnique: vi.fn(),
    },
    ...overrides,
  };
}

describe('PricingService', () => {
  it('resolves the most specific repair rule and applies margin, minimum profit and shipping', async () => {
    const specific = repairRule({
      id: 'rule-specific',
      name: 'Samsung modulo',
      priority: 5,
      deviceBrand: 'Samsung',
      issueLabel: 'Modulo',
      basePrice: 10000,
      profitPercent: 20,
      minProfit: 3000,
      shippingFee: 500,
    });
    const global = repairRule({ id: 'rule-global', name: 'Global', basePrice: 5000, profitPercent: 10 });
    const prisma = createPrismaMock({
      repairPricingRule: {
        findMany: vi.fn().mockResolvedValue([global, specific]),
      },
    });
    const service = new PricingService(prisma as never);

    await expect(
      service.resolveRepairPrice({
        deviceBrand: 'Samsung',
        deviceModel: 'A10',
        issueLabel: 'modulo',
      }),
    ).resolves.toMatchObject({
      matched: true,
      rule: { id: 'rule-specific' },
      suggestion: {
        basePrice: 10000,
        profitPercent: 20,
        minProfit: 3000,
        shippingFee: 500,
        suggestedTotal: 13500,
      },
    });
  });

  it('returns unmatched pricing when no active rule applies', async () => {
    const prisma = createPrismaMock({
      repairPricingRule: {
        findMany: vi.fn().mockResolvedValue([
          repairRule({ id: 'iphone', deviceBrand: 'iPhone', issueLabel: 'Bateria' }),
        ]),
      },
    });
    const service = new PricingService(prisma as never);

    await expect(service.resolveRepairPrice({ deviceBrand: 'Samsung', issueLabel: 'Modulo' })).resolves.toMatchObject({
      matched: false,
      suggestion: null,
    });
  });

  it('builds supplier part preview with cost subtotal, margin and snapshot draft', async () => {
    const prisma = createPrismaMock({
      supplier: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'supplier-1',
          name: 'Proveedor',
          active: true,
          searchEnabled: true,
          searchEndpoint: 'https://supplier.test/search?q={query}',
        }),
      },
      repairPricingRule: {
        findMany: vi.fn().mockResolvedValue([
          repairRule({
            id: 'rule-part',
            name: 'Modulo Samsung',
            priority: 10,
            deviceBrand: 'Samsung',
            issueLabel: 'Modulo',
            basePrice: 0,
            profitPercent: 30,
            shippingFee: 200,
          }),
        ]),
      },
    });
    const service = new PricingService(prisma as never);

    await expect(
      service.previewRepairProviderPartPricing({
        supplierId: 'supplier-1',
        supplierSearchQuery: 'Modulo Samsung A10',
        deviceBrand: 'Samsung',
        deviceModel: 'A10',
        issueLabel: 'Modulo',
        quantity: 2,
        extraCost: 100,
        shippingCost: 50,
        part: {
          externalPartId: 'ext-1',
          name: 'Modulo Samsung A10',
          price: 1000,
          availability: 'in_stock',
        },
      }),
    ).resolves.toMatchObject({
      matched: true,
      supplier: { id: 'supplier-1', name: 'Proveedor' },
      calculation: {
        baseCost: 2000,
        extraCost: 100,
        costSubtotal: 2100,
        marginAmount: 630,
        appliedShippingFee: 200,
        shippingCost: 50,
        suggestedQuotedPrice: 2980,
        coversBaseCost: true,
      },
      snapshotDraft: {
        source: 'SUPPLIER_PART',
        supplierId: 'supplier-1',
        pricingRuleId: 'rule-part',
        suggestedQuotedPrice: 2980,
      },
    });
  });

  it('rejects group or model scoped rules without brand context', async () => {
    const service = new PricingService(createPrismaMock() as never);

    await expect(
      service.createRepairRule({
        name: 'Grupo sin marca',
        basePrice: 1000,
        deviceModelGroupId: 'group-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
