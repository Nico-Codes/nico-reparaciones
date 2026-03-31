import { useEffect, useMemo, useRef, useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  AdminProductsCatalogSection,
  AdminProductsFilters,
  AdminProductsStatsGrid,
} from './admin-products.sections';
import {
  buildAdminProductCategoryOptions,
  buildAdminProductsStats,
  filterAdminProducts,
  hasAdminProductFilters,
} from './admin-products.helpers';
import { catalogAdminApi, type AdminCategory, type AdminProduct } from './api';

export function AdminProductsPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([]);
  const productsRequestIdRef = useRef(0);

  async function loadCategories() {
    const response = await catalogAdminApi.categories();
    setCategories(response.items);
  }

  async function loadProducts() {
    const requestId = ++productsRequestIdRef.current;
    setLoading(true);
    setError('');

    try {
      const response = await catalogAdminApi.products({
        q,
        categoryId: categoryId || undefined,
        active: activeFilter || undefined,
      });
      if (requestId !== productsRequestIdRef.current) return;
      setProducts(response.items);
    } catch (cause) {
      if (requestId !== productsRequestIdRef.current) return;
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los productos.');
    } finally {
      if (requestId !== productsRequestIdRef.current) return;
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories().catch((cause) =>
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las categorias.'),
    );
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [q, categoryId, activeFilter]);

  const filteredProducts = useMemo(
    () => filterAdminProducts(products, featuredFilter, stockFilter),
    [products, featuredFilter, stockFilter],
  );
  const stats = useMemo(() => buildAdminProductsStats(products), [products]);
  const hasFilters = hasAdminProductFilters({
    q,
    categoryId,
    activeFilter,
    featuredFilter,
    stockFilter,
  });
  const categoryOptions = useMemo(
    () => buildAdminProductCategoryOptions(categories),
    [categories],
  );

  function clearFilters() {
    setQ('');
    setCategoryId('');
    setActiveFilter('');
    setFeaturedFilter('');
    setStockFilter('');
  }

  async function patchProduct(id: string, patch: Record<string, unknown>) {
    if (pendingProductIds.includes(id)) return;

    try {
      setPendingProductIds((current) => [...current, id]);
      const response = await catalogAdminApi.updateProduct(id, patch);
      setProducts((current) => current.map((product) => (product.id === id ? response.item : product)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el producto.');
    } finally {
      setPendingProductIds((current) => current.filter((productId) => productId !== id));
    }
  }

  return (
    <PageShell context="admin" className="space-y-6">
      <PageHeader
        context="admin"
        eyebrow="Catalogo"
        title="Productos"
        subtitle="Administra el catalogo, el stock y la informacion comercial con una sola vista operativa y sin ruido visual innecesario."
        actions={
          <>
            <StatusBadge tone="info" label={`${products.length} en catalogo`} />
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/categorias">Categorias</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/admin/productos/crear">
                <PackagePlus className="h-4 w-4" />
                Nuevo producto
              </Link>
            </Button>
          </>
        }
      />

      <AdminProductsStatsGrid stats={stats} />

      <AdminProductsFilters
        q={q}
        categoryId={categoryId}
        activeFilter={activeFilter}
        featuredFilter={featuredFilter}
        stockFilter={stockFilter}
        hasFilters={hasFilters}
        loading={loading}
        categoryOptions={categoryOptions}
        onQChange={setQ}
        onCategoryIdChange={setCategoryId}
        onActiveFilterChange={setActiveFilter}
        onFeaturedFilterChange={setFeaturedFilter}
        onStockFilterChange={setStockFilter}
        onClear={clearFilters}
        onReload={() => void loadProducts()}
      />

      <AdminProductsCatalogSection
        loading={loading}
        error={error}
        hasFilters={hasFilters}
        filteredProducts={filteredProducts}
        pendingProductIds={pendingProductIds}
        onClearFilters={clearFilters}
        onPatchProduct={(id, patch) => void patchProduct(id, patch)}
      />
    </PageShell>
  );
}
