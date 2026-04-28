import { describe, expect, it } from 'vitest';
import type { AdminProduct } from '@/features/catalogAdmin/api';
import {
  addQuickSaleLine,
  buildQuickSaleTotals,
  filterQuickSaleProducts,
  findQuickSaleProductByCode,
  hasInvalidQuickSaleCart,
  quickSalePaymentOptions,
  updateQuickSaleLineQty,
  validateQuickSalePhone,
} from './admin-quick-sales.helpers';

function makeProduct(input: Partial<AdminProduct> & Pick<AdminProduct, 'id' | 'name' | 'price' | 'stock'>): AdminProduct {
  return {
    slug: input.slug ?? input.name.toLowerCase().replace(/\s+/g, '-'),
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
    hasColorOptions: input.hasColorOptions ?? false,
    requiresColorSelection: input.requiresColorSelection ?? false,
    colorOptions: input.colorOptions ?? [],
    lastImportedAt: input.lastImportedAt ?? null,
    createdAt: input.createdAt ?? null,
    updatedAt: input.updatedAt ?? null,
    ...input,
  };
}

describe('admin-quick-sales helpers', () => {
  it('exposes payment options and validates optional phone input', () => {
    expect(quickSalePaymentOptions()).toHaveLength(3);
    expect(validateQuickSalePhone('')).toBe('');
    expect(validateQuickSalePhone('11-22')).toContain('al menos 6 digitos');
    expect(validateQuickSalePhone('11 2233 4455')).toBe('');
  });

  it('filters products and finds exact matches by sku or barcode', () => {
    const items = [
      makeProduct({ id: 'a', name: 'Pinza', price: 100, stock: 3, sku: 'ABC-1' }),
      makeProduct({ id: 'b', name: 'Cable', price: 50, stock: 0, barcode: '999' }),
      makeProduct({ id: 'c', name: 'Mouse', price: 80, stock: 2, active: false, barcode: '111' }),
      makeProduct({ id: 'd', name: 'iPhone 13', price: 1000, stock: 0, fulfillmentMode: 'SPECIAL_ORDER' }),
    ];

    expect(filterQuickSaleProducts(items).map((product) => product.id)).toEqual(['a']);
    expect(findQuickSaleProductByCode(items, 'abc-1')?.id).toBe('a');
    expect(findQuickSaleProductByCode(items, '999')?.id).toBe('b');
  });

  it('adds lines, caps quantities by stock and computes totals', () => {
    const pinza = makeProduct({ id: 'a', name: 'Pinza', price: 100, stock: 3 });
    const cable = makeProduct({ id: 'b', name: 'Cable', price: 50, stock: 2 });

    const first = addQuickSaleLine([], pinza, 2);
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error('expected cart result');

    const second = addQuickSaleLine(first.cart, pinza, 2);
    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error('expected cart result');

    const third = addQuickSaleLine(second.cart, cable, 1);
    expect(third.ok).toBe(true);
    if (!third.ok) throw new Error('expected cart result');

    expect(third.cart.map((line) => line.quantity)).toEqual([3, 1]);
    expect(buildQuickSaleTotals(third.cart)).toEqual({ itemsCount: 4, total: 350 });
  });

  it('detects invalid cart lines after quantity updates', () => {
    const pinza = makeProduct({ id: 'a', name: 'Pinza', price: 100, stock: 2 });
    const added = addQuickSaleLine([], pinza, 1);
    if (!added.ok) throw new Error('expected cart result');

    const validCart = updateQuickSaleLineQty(added.cart, pinza.id, 2);
    const invalidCart = updateQuickSaleLineQty(added.cart, pinza.id, 10);

    expect(hasInvalidQuickSaleCart(validCart)).toBe(false);
    expect(hasInvalidQuickSaleCart(invalidCart)).toBe(false);
    expect(invalidCart[0]?.quantity).toBe(2);
  });
});
