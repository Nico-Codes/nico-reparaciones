import { describe, expect, it } from 'vitest';
import {
  buildAdminProductCategoryOptions,
  buildAdminProductPriceSummary,
  buildAdminProductsStats,
  filterAdminProducts,
  getAdminProductMarginTone,
  getAdminProductStockTone,
  hasAdminProductFilters,
} from './admin-products.helpers';
import type { AdminCategory, AdminProduct } from './api';

function makeProduct(
  input: Partial<AdminProduct> & Pick<AdminProduct, 'id' | 'name' | 'slug' | 'price' | 'stock' | 'active' | 'featured'>,
): AdminProduct {
  return {
    description: null,
    purchaseReference: null,
    imagePath: null,
    imageUrl: null,
    costPrice: null,
    fulfillmentMode: 'INVENTORY',
    supplierAvailability: 'IN_STOCK',
    sourcePriceUsd: null,
    sku: null,
    barcode: null,
    categoryId: null,
    category: null,
    supplierId: null,
    supplier: null,
    specialOrderProfile: null,
    hasColorOptions: false,
    colorOptions: [],
    lastImportedAt: null,
    createdAt: null,
    updatedAt: null,
    ...input,
  };
}

describe('admin-products.helpers', () => {
  it('builds product stats and filters by featured/stock', () => {
    const products = [
      makeProduct({ id: '1', name: 'A', slug: 'a', price: 100, stock: 5, active: true, featured: true }),
      makeProduct({ id: '2', name: 'B', slug: 'b', price: 50, stock: 0, active: false, featured: false }),
      makeProduct({ id: '3', name: 'C', slug: 'c', price: 20, stock: 2, active: true, featured: false }),
      makeProduct({
        id: '4',
        name: 'D',
        slug: 'd',
        price: 300,
        stock: 0,
        active: true,
        featured: false,
        fulfillmentMode: 'SPECIAL_ORDER',
      }),
    ];

    expect(buildAdminProductsStats(products)).toEqual({
      total: 4,
      active: 3,
      featured: 1,
      lowStock: 1,
      noStock: 1,
      specialOrder: 1,
    });
    expect(filterAdminProducts(products, '1', '', '')).toHaveLength(1);
    expect(filterAdminProducts(products, '', 'empty', '')).toHaveLength(1);
    expect(filterAdminProducts(products, '', '', 'SPECIAL_ORDER')).toHaveLength(1);
  });

  it('builds hierarchical category options and detects active filters', () => {
    const categories: AdminCategory[] = [
      {
        id: 'root',
        name: 'Accesorios',
        slug: 'accesorios',
        parentId: null,
        parent: null,
        depth: 0,
        active: true,
        directProductsCount: 1,
        totalProductsCount: 2,
        productsCount: 2,
        childrenCount: 1,
        pathLabel: 'Accesorios',
      },
      {
        id: 'child',
        name: 'Fundas',
        slug: 'fundas',
        parentId: 'root',
        parent: { id: 'root', name: 'Accesorios', slug: 'accesorios' },
        depth: 1,
        active: true,
        directProductsCount: 1,
        totalProductsCount: 1,
        productsCount: 1,
        childrenCount: 0,
        pathLabel: 'Accesorios / Fundas',
      },
    ];

    expect(buildAdminProductCategoryOptions(categories)).toEqual([
      { value: '', label: 'Todas las categorias' },
      { value: 'root', label: 'Accesorios' },
      { value: 'child', label: 'Accesorios / Fundas' },
    ]);
    expect(
      hasAdminProductFilters({
        q: '',
        categoryId: '',
        activeFilter: '',
        featuredFilter: '',
        stockFilter: '',
        fulfillmentFilter: '',
      }),
    ).toBe(false);
    expect(
      hasAdminProductFilters({
        q: 'iphone',
        categoryId: '',
        activeFilter: '',
        featuredFilter: '',
        stockFilter: '',
        fulfillmentFilter: '',
      }),
    ).toBe(true);
  });

  it('summarizes prices and derives tones', () => {
    const summary = buildAdminProductPriceSummary(
      makeProduct({ id: '1', name: 'A', slug: 'a', price: 150, stock: 1, active: true, featured: false, costPrice: 100 }),
    );

    expect(summary).toEqual({ cost: 100, sale: 150, marginValue: 50, marginPercent: 50 });
    expect(getAdminProductMarginTone(50)).toBe('success');
    expect(getAdminProductMarginTone(0)).toBe('warning');
    expect(getAdminProductStockTone(0)).toBe('danger');
    expect(getAdminProductStockTone(2)).toBe('warning');
  });
});
