import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { repairsApi } from './api';
import {
  buildAdminRepairStats,
  filterAdminRepairItems,
  hasAdminRepairFilters,
} from './admin-repairs-list.helpers';
import {
  AdminRepairsFilters,
  AdminRepairsHeaderActions,
  AdminRepairsMetrics,
  AdminRepairsOperationsSection,
} from './admin-repairs-list.sections';
import type { RepairItem } from './types';

export function AdminRepairsListPage() {
  const [items, setItems] = useState<RepairItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await repairsApi.adminList();
      setItems(response.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el listado de reparaciones.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredItems = useMemo(
    () => filterAdminRepairItems(items, query, statusFilter),
    [items, query, statusFilter],
  );

  const stats = useMemo(() => buildAdminRepairStats(items), [items]);
  const hasFilters = hasAdminRepairFilters(query, statusFilter);

  return (
    <PageShell context="admin" className="space-y-6" data-admin-repairs-page>
      <PageHeader
        context="admin"
        eyebrow="Servicio tecnico"
        title="Reparaciones"
        subtitle="Vista operativa para seguimiento, atencion al cliente y acceso rapido al detalle de cada caso."
        actions={<AdminRepairsHeaderActions total={stats.total} onRefresh={() => void load()} />}
      />

      <AdminRepairsMetrics stats={stats} />

      <AdminRepairsFilters
        query={query}
        statusFilter={statusFilter}
        hasFilters={hasFilters}
        onQueryChange={setQuery}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={() => {
          setQuery('');
          setStatusFilter('');
        }}
        onReload={() => void load()}
      />

      <AdminRepairsOperationsSection
        error={error}
        loading={loading}
        items={filteredItems}
        statusFilter={statusFilter}
        hasFilters={hasFilters}
        onClearFilters={() => {
          setQuery('');
          setStatusFilter('');
        }}
      />
    </PageShell>
  );
}
