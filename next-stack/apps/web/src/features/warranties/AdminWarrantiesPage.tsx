import { useEffect, useMemo, useState } from 'react';
import { adminApi, type AdminWarrantyItem } from '@/features/admin/api';
import {
  buildAdminWarrantiesQuery,
  createDefaultAdminWarrantiesFilters,
  createDefaultAdminWarrantiesSummary,
  getTopWarrantySupplier,
  type AdminWarrantySupplierStat,
  type AdminWarrantiesFilters,
  type AdminWarrantiesSummary,
} from './admin-warranties.helpers';
import {
  AdminWarrantiesFeedback,
  AdminWarrantiesFiltersSection,
  AdminWarrantiesHero,
  AdminWarrantiesStatsGrid,
  AdminWarrantiesTable,
  AdminWarrantiesTopSupplierSection,
} from './admin-warranties.sections';

export function AdminWarrantiesPage() {
  const [items, setItems] = useState<AdminWarrantyItem[]>([]);
  const [summary, setSummary] = useState<AdminWarrantiesSummary>(() => createDefaultAdminWarrantiesSummary());
  const [supplierStats, setSupplierStats] = useState<AdminWarrantySupplierStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState<AdminWarrantiesFilters>(() => createDefaultAdminWarrantiesFilters());
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await adminApi.warranties(buildAdminWarrantiesQuery(filters));
        if (!mounted) return;
        setItems(response.items);
        setSummary(response.summary);
        setSupplierStats(response.supplierStats);
      } catch (cause) {
        if (!mounted) return;
        setError(cause instanceof Error ? cause.message : 'Error cargando incidentes');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [refreshTick]);

  const topSupplier = useMemo(() => getTopWarrantySupplier(supplierStats), [supplierStats]);

  function patchFilters<K extends keyof AdminWarrantiesFilters>(field: K, value: AdminWarrantiesFilters[K]) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  async function closeIncident(id: string) {
    setError('');
    setMessage('');
    try {
      await adminApi.closeWarranty(id);
      setMessage('Incidente cerrado.');
      setRefreshTick((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cerrar el incidente');
    }
  }

  function clearFilters() {
    setFilters(createDefaultAdminWarrantiesFilters());
    setRefreshTick((value) => value + 1);
  }

  return (
    <div className="store-shell space-y-5">
      <AdminWarrantiesHero />
      <AdminWarrantiesFeedback error={error} message={message} />
      <AdminWarrantiesStatsGrid summary={summary} />
      <AdminWarrantiesTopSupplierSection topSupplier={topSupplier} />
      <AdminWarrantiesFiltersSection
        filters={filters}
        onChange={patchFilters}
        onRefresh={() => setRefreshTick((value) => value + 1)}
        onClear={clearFilters}
      />
      <AdminWarrantiesTable items={items} loading={loading} onClose={(id) => void closeIncident(id)} />
    </div>
  );
}
