import type { AdminProduct } from './api';
import type { ProductSelectOption } from './admin-product-form.helpers';
import type { AdminProductsStats } from './admin-products.helpers';
import {
  AdminProductsCatalogPanel,
  AdminProductsFiltersPanel,
  AdminProductsStatsPanel,
} from './admin-products-panels';

export function AdminProductsStatsGrid({ stats }: { stats: AdminProductsStats }) {
  return <AdminProductsStatsPanel stats={stats} />;
}

export function AdminProductsFilters(props: {
  q: string;
  categoryId: string;
  activeFilter: string;
  featuredFilter: string;
  stockFilter: string;
  hasFilters: boolean;
  loading: boolean;
  categoryOptions: ProductSelectOption[];
  onQChange: (value: string) => void;
  onCategoryIdChange: (value: string) => void;
  onActiveFilterChange: (value: string) => void;
  onFeaturedFilterChange: (value: string) => void;
  onStockFilterChange: (value: string) => void;
  onClear: () => void;
  onReload: () => void;
}) {
  return <AdminProductsFiltersPanel {...props} />;
}

export function AdminProductsCatalogSection(props: {
  loading: boolean;
  error: string;
  hasFilters: boolean;
  filteredProducts: AdminProduct[];
  pendingProductIds: string[];
  onClearFilters: () => void;
  onPatchProduct: (id: string, patch: Record<string, unknown>) => void;
}) {
  return <AdminProductsCatalogPanel {...props} />;
}
