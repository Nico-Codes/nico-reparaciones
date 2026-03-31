import type { AdminProduct } from './api';
import { buildNamedOptions, money, type ProductSelectOption } from './admin-product-form.helpers';
import type { AdminCategory } from './api';

export type AdminProductsStats = {
  total: number;
  active: number;
  featured: number;
  lowStock: number;
  noStock: number;
};

export type AdminProductsStockTone = 'success' | 'warning' | 'danger';
export type AdminProductsMarginTone = 'success' | 'warning' | 'danger';

export const ADMIN_PRODUCTS_ACTIVE_OPTIONS: ProductSelectOption[] = [
  { value: '', label: 'Todos los estados' },
  { value: '1', label: 'Solo activos' },
  { value: '0', label: 'Solo inactivos' },
];

export const ADMIN_PRODUCTS_FEATURED_OPTIONS: ProductSelectOption[] = [
  { value: '', label: 'Todo el catalogo' },
  { value: '1', label: 'Solo destacados' },
  { value: '0', label: 'Solo no destacados' },
];

export const ADMIN_PRODUCTS_STOCK_OPTIONS: ProductSelectOption[] = [
  { value: '', label: 'Todo el stock' },
  { value: 'with', label: 'Con stock' },
  { value: 'empty', label: 'Sin stock' },
];

export function formatAdminProductMoney(value: number) {
  return money(value);
}

export function getAdminProductMarginTone(value: number): AdminProductsMarginTone {
  if (value > 0) return 'success';
  if (value === 0) return 'warning';
  return 'danger';
}

export function getAdminProductStockTone(stock: number): AdminProductsStockTone {
  if (stock <= 0) return 'danger';
  if (stock <= 3) return 'warning';
  return 'success';
}

export function buildAdminProductsStats(products: AdminProduct[]): AdminProductsStats {
  return {
    total: products.length,
    active: products.filter((product) => product.active).length,
    featured: products.filter((product) => product.featured).length,
    lowStock: products.filter((product) => product.stock > 0 && product.stock <= 3).length,
    noStock: products.filter((product) => product.stock <= 0).length,
  };
}

export function filterAdminProducts(products: AdminProduct[], featuredFilter: string, stockFilter: string) {
  return products
    .filter((product) => {
      if (featuredFilter === '1' && !product.featured) return false;
      if (featuredFilter === '0' && product.featured) return false;
      if (stockFilter === 'with' && product.stock <= 0) return false;
      if (stockFilter === 'empty' && product.stock > 0) return false;
      return true;
    })
    .slice(0, 80);
}

export function hasAdminProductFilters(filters: {
  q: string;
  categoryId: string;
  activeFilter: string;
  featuredFilter: string;
  stockFilter: string;
}) {
  return Boolean(
    filters.q.trim() ||
      filters.categoryId ||
      filters.activeFilter ||
      filters.featuredFilter ||
      filters.stockFilter,
  );
}

export function buildAdminProductCategoryOptions(categories: AdminCategory[]) {
  return buildNamedOptions(categories, 'Todas las categorias');
}

export function buildAdminProductPriceSummary(product: AdminProduct) {
  const cost = Number(product.costPrice ?? 0);
  const sale = Number(product.price ?? 0);
  const marginValue = sale - cost;
  const marginPercent = cost > 0 ? Math.round(((sale - cost) / cost) * 100) : 0;

  return {
    cost,
    sale,
    marginValue,
    marginPercent,
  };
}
