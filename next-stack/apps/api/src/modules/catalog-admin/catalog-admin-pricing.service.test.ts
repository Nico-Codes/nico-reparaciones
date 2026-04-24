import { Prisma, type ProductPricingRule } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { CatalogAdminPricingService } from './catalog-admin-pricing.service.js';

function createSupport() {
  return {
    validateCategoryId: vi.fn(async (value?: string | null) => value?.trim() || null),
    nullable: (value?: string | null) => {
      const normalized = (value ?? '').trim();
      return normalized || null;
    },
    clampNumber: (value: number, min: number, max: number, fallback: number) => {
      if (!Number.isFinite(value)) return fallback;
      return Math.max(min, Math.min(max, value));
    },
  } as never;
}

function createRule(overrides?: Partial<ProductPricingRule>): ProductPricingRule {
  return {
    id: 'rule-1',
    name: 'Rule',
    categoryId: null,
    productId: null,
    costMin: null,
    costMax: null,
    marginPercent: new Prisma.Decimal(35),
    priority: 0,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('CatalogAdminPricingService', () => {
  it('prefers the most specific matching pricing rule', async () => {
    const prisma = {
      appSetting: {
        findUnique: vi.fn(async () => null),
      },
      category: {
        findUnique: vi.fn(async () => ({ id: 'cat-1', parentId: 'cat-root' })),
      },
      productPricingRule: {
        findMany: vi.fn(async () => [
          createRule({ id: 'rule-parent', name: 'Categoria padre', categoryId: 'cat-root', marginPercent: new Prisma.Decimal(40), priority: 10 }),
          createRule({
            id: 'rule-product',
            name: 'Producto especifico',
            categoryId: 'cat-1',
            productId: 'prod-1',
            marginPercent: new Prisma.Decimal(55),
            priority: 5,
          }),
        ]),
      },
    } as never;

    const service = new CatalogAdminPricingService(prisma, createSupport());
    const result = await service.resolveRecommendedProductPrice({
      categoryId: 'cat-1',
      costPrice: 1000,
      productId: 'prod-1',
    });

    expect(result).toMatchObject({
      ok: true,
      recommendedPrice: 1550,
      marginPercent: 55,
      rule: { id: 'rule-product', name: 'Producto especifico' },
    });
  });

  it('falls back from child category to parent category before global rules', async () => {
    const prisma = {
      appSetting: {
        findUnique: vi.fn(async () => null),
      },
      category: {
        findUnique: vi.fn(async () => ({ id: 'cat-child', parentId: 'cat-root' })),
      },
      productPricingRule: {
        findMany: vi.fn(async () => [
          createRule({ id: 'rule-global', name: 'Global', categoryId: null, marginPercent: new Prisma.Decimal(20), priority: 50 }),
          createRule({ id: 'rule-parent', name: 'Padre', categoryId: 'cat-root', marginPercent: new Prisma.Decimal(35), priority: 5 }),
        ]),
      },
    } as never;

    const service = new CatalogAdminPricingService(prisma, createSupport());
    const result = await service.resolveRecommendedProductPrice({
      categoryId: 'cat-child',
      costPrice: 2000,
      productId: null,
    });

    expect(result).toMatchObject({
      ok: true,
      recommendedPrice: 2700,
      marginPercent: 35,
      rule: { id: 'rule-parent', name: 'Padre' },
    });
  });

  it('falls back to default settings when no rule matches', async () => {
    const prisma = {
      appSetting: {
        findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
          if (where.key === 'product_default_margin_percent') return { value: '25' };
          if (where.key === 'product_prevent_negative_margin') return { value: '1' };
          return null;
        }),
      },
      category: {
        findUnique: vi.fn(async () => ({ id: 'cat-1', parentId: null })),
      },
      productPricingRule: {
        findMany: vi.fn(async () => []),
      },
    } as never;

    const service = new CatalogAdminPricingService(prisma, createSupport());
    const result = await service.resolveRecommendedProductPrice({
      categoryId: 'cat-1',
      costPrice: 2000,
      productId: null,
    });

    expect(result).toMatchObject({
      ok: true,
      recommendedPrice: 2500,
      marginPercent: 25,
      rule: null,
    });
  });
});
