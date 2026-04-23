import { describe, expect, it } from 'vitest';
import type { AdminCategory, AdminProduct } from '@/features/catalogAdmin/api';
import type { ProductPricingRuleItem } from '@/features/catalogAdmin/productPricingApi';
import {
  buildCategoryOptions,
  buildProductOptions,
  categoryNameById,
  createEmptyProductRuleForm,
  filterProductsByCategory,
  fromApiRule,
  productNameById,
  productPricingSimulationText,
  toCreateRuleInput,
  toUpdateRuleInput,
} from './admin-product-pricing-rules.helpers';

function makeCategory(input: Partial<AdminCategory> & Pick<AdminCategory, 'id' | 'name'>): AdminCategory {
  return {
    slug: input.slug ?? input.name.toLowerCase(),
    active: input.active ?? true,
    productsCount: input.productsCount ?? 0,
    ...input,
  };
}

function makeProduct(input: Partial<AdminProduct> & Pick<AdminProduct, 'id' | 'name' | 'price' | 'stock'>): AdminProduct {
  return {
    slug: input.slug ?? input.name.toLowerCase(),
    description: input.description ?? null,
    purchaseReference: input.purchaseReference ?? null,
    imagePath: input.imagePath ?? null,
    imageUrl: input.imageUrl ?? null,
    costPrice: input.costPrice ?? null,
    fulfillmentMode: input.fulfillmentMode ?? 'INVENTORY',
    supplierAvailability: input.supplierAvailability ?? 'IN_STOCK',
    sourcePriceUsd: input.sourcePriceUsd ?? null,
    active: input.active ?? true,
    featured: input.featured ?? false,
    sku: input.sku ?? null,
    barcode: input.barcode ?? null,
    categoryId: input.categoryId ?? null,
    category: input.category ?? null,
    supplierId: input.supplierId ?? null,
    supplier: input.supplier ?? null,
    specialOrderProfile: input.specialOrderProfile ?? null,
    lastImportedAt: input.lastImportedAt ?? null,
    createdAt: input.createdAt ?? null,
    updatedAt: input.updatedAt ?? null,
    ...input,
  };
}

function makeRule(input: Partial<ProductPricingRuleItem> & Pick<ProductPricingRuleItem, 'id' | 'name'>): ProductPricingRuleItem {
  return {
    categoryId: input.categoryId ?? null,
    productId: input.productId ?? null,
    costMin: input.costMin ?? null,
    costMax: input.costMax ?? null,
    marginPercent: input.marginPercent ?? 35,
    priority: input.priority ?? 0,
    active: input.active ?? true,
    category: input.category ?? null,
    product: input.product ?? null,
    createdAt: input.createdAt ?? '2026-03-31T00:00:00.000Z',
    updatedAt: input.updatedAt ?? '2026-03-31T00:00:00.000Z',
    ...input,
  };
}

describe('admin-product-pricing-rules helpers', () => {
  it('maps api rules and converts form/update payloads', () => {
    const row = fromApiRule(
      makeRule({
        id: 'r1',
        name: 'Cables',
        categoryId: 'c1',
        productId: 'p1',
        costMin: 100,
        costMax: 5000,
        marginPercent: 55,
        priority: 7,
      }),
    );

    expect(row).toMatchObject({
      id: 'r1',
      name: 'Cables',
      categoryId: 'c1',
      productId: 'p1',
      marginPercent: '55',
      costMin: '100',
      costMax: '5000',
      priority: '7',
    });

    const form = createEmptyProductRuleForm();
    form.name = '  Nueva regla  ';
    form.categoryId = 'c1';
    form.marginPercent = '40';
    form.costMax = '2500';

    expect(toCreateRuleInput(form)).toMatchObject({
      name: 'Nueva regla',
      categoryId: 'c1',
      productId: null,
      marginPercent: 40,
      costMin: null,
      costMax: 2500,
    });

    expect(toUpdateRuleInput(row)).toMatchObject({
      name: 'Cables',
      categoryId: 'c1',
      productId: 'p1',
      marginPercent: 55,
      priority: 7,
    });
  });

  it('builds filtered options and scope labels', () => {
    const categories = [makeCategory({ id: 'c1', name: 'Cables' }), makeCategory({ id: 'c2', name: 'Mouse' })];
    const products = [
      makeProduct({ id: 'p1', name: 'USB-C', categoryId: 'c1', price: 100, stock: 5 }),
      makeProduct({ id: 'p2', name: 'Inalambrico', categoryId: 'c2', price: 200, stock: 3 }),
    ];

    expect(buildCategoryOptions(categories, 'Seleccionar')).toEqual([
      { value: '', label: 'Seleccionar' },
      { value: 'c1', label: 'Cables' },
      { value: 'c2', label: 'Mouse' },
    ]);
    expect(buildProductOptions(filterProductsByCategory(products, 'c1'))).toEqual([
      { value: '', label: 'Todos' },
      { value: 'p1', label: 'USB-C' },
    ]);
    expect(categoryNameById(categories, 'c2')).toBe('Mouse');
    expect(productNameById(products, 'missing')).toBe('Todos');
  });

  it('builds the simulator text for each state', () => {
    expect(productPricingSimulationText('', false, null)).toBe('Seleccioná una categoría para simular.');
    expect(productPricingSimulationText('c1', true, null)).toBe('Simulando...');
    expect(productPricingSimulationText('c1', false, null)).toBe('No se pudo calcular en este momento.');
    expect(
      productPricingSimulationText('c1', false, {
        recommendedPrice: 7800,
        marginPercent: 56,
        ruleName: 'Cables premium',
      }),
    ).toContain('Regla: Cables premium - Margen: +56%');
  });
});
