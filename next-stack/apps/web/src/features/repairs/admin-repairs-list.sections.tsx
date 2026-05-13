import { AlertTriangle, Plus, RefreshCcw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { LoadingBlock } from '@/components/ui/loading-block';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import {
  formatDateTime,
  getRepairDeviceLabel,
  getRepairIssueLabel,
  repairCode,
  REPAIR_STATUS_FILTER_OPTIONS,
  repairStatusLabel,
  repairStatusTone,
} from './admin-repairs-list.helpers';
import { getRepairIssueIconFallback, resolveRepairIssueIconSlot } from '@/features/admin/repair-issue-icons';
import type { RepairItem } from './types';

export function AdminRepairsHeaderActions({
  total,
  onRefresh,
}: {
  total: number;
  onRefresh: () => void;
}) {
  return (
    <>
      <StatusBadge label={`${total} ingresos`} tone="info" />
      <Button asChild size="sm" data-admin-repair-create-cta>
        <Link to="/admin/repairs/create">
          <Plus className="h-4 w-4" />
          Nueva reparacion
        </Link>
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCcw className="h-4 w-4" />
        Actualizar
      </Button>
    </>
  );
}

export function AdminRepairsMetrics({
  stats,
}: {
  stats: {
    total: number;
    waitingApproval: number;
    readyPickup: number;
    completed: number;
  };
}) {
  return (
    <section className="nr-stat-grid" data-reveal>
      <MetricCard label="Ingresos visibles" value={String(stats.total)} meta="Total cargado en el panel" />
      <MetricCard label="Esperando aprobacion" value={String(stats.waitingApproval)} meta="Casos listos para presupuesto" />
      <MetricCard label="Listas para retirar" value={String(stats.readyPickup)} meta="Equipos terminados pendientes de entrega" />
      <MetricCard label="Entregadas" value={String(stats.completed)} meta="Casos cerrados correctamente" />
    </section>
  );
}

export function AdminRepairsFilters({
  query,
  statusFilter,
  hasFilters,
  onQueryChange,
  onStatusFilterChange,
  onClearFilters,
  onReload,
}: {
  query: string;
  statusFilter: string;
  hasFilters: boolean;
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onClearFilters: () => void;
  onReload: () => void;
}) {
  return (
    <FilterBar
      actions={(
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {hasFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={onClearFilters}>
              Limpiar
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={onReload}>
            <RefreshCcw className="h-4 w-4" />
            Recargar
          </Button>
        </div>
      )}
    >
      <TextField
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        label="Buscar"
        placeholder="Codigo, cliente, telefono o equipo"
        leadingIcon={<Search className="h-4 w-4" />}
        wrapperClassName="min-w-0 sm:min-w-[18rem]"
      />
      <div className="ui-field min-w-0 sm:min-w-[14rem]">
        <span className="ui-field__label">Estado</span>
        <CustomSelect
          value={statusFilter}
          onChange={onStatusFilterChange}
          options={REPAIR_STATUS_FILTER_OPTIONS}
          className="w-full"
          triggerClassName="min-h-11 rounded-[1rem]"
          ariaLabel="Filtrar reparaciones por estado"
        />
      </div>
    </FilterBar>
  );
}

export function AdminRepairsOperationsSection({
  error,
  loading,
  items,
  statusFilter,
  hasFilters,
  onClearFilters,
}: {
  error: string;
  loading: boolean;
  items: RepairItem[];
  statusFilter: string;
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <SectionCard
      title="Mesa operativa"
      description="Listado compacto con contexto suficiente para decidir el siguiente paso sin cargar ruido visual innecesario."
      actions={<StatusBadge label={statusFilter ? repairStatusLabel(statusFilter) : 'Todos los estados'} tone={statusFilter ? repairStatusTone(statusFilter) : 'neutral'} />}
    >
      {error ? (
        <div className="ui-alert ui-alert--danger mb-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No se pudo cargar el listado.</span>
            <div className="ui-alert__text">{error}</div>
          </div>
        </div>
      ) : null}

      <div className="admin-repairs-grid">
        {loading ? (
          <SectionCard tone="muted" bodyClassName="space-y-3">
            <LoadingBlock label="Cargando reparaciones" lines={4} />
          </SectionCard>
        ) : items.length === 0 ? (
          <EmptyState
            title="No hay reparaciones para mostrar"
            description={hasFilters ? 'Proba otra busqueda o volve a todos los estados.' : 'Todavia no hay reparaciones registradas en el panel.'}
            actions={
              hasFilters ? (
                <Button type="button" variant="outline" onClick={onClearFilters}>
                  Limpiar filtros
                </Button>
              ) : undefined
            }
          />
        ) : (
          items.map((repair) => <AdminRepairCard key={repair.id} repair={repair} />)
        )}
      </div>
    </SectionCard>
  );
}

function AdminRepairCard({ repair }: { repair: RepairItem }) {
  const issueLabel = getRepairIssueLabel(repair);
  const iconSlot = repair.issueIconSlot || resolveRepairIssueIconSlot(issueLabel);

  return (
    <article className="admin-repair-card">
      <div className="admin-repair-card__top">
        <span className="admin-repair-card__icon">
          <BrandIcon slot={iconSlot} className="h-full w-full" fallback={getRepairIssueIconFallback(iconSlot)} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="admin-repair-card__customer">{repair.customerName}</div>
          <div className="admin-repair-card__code">{repairCode(repair.id)}</div>
        </div>
        <StatusBadge label={repairStatusLabel(repair.status)} tone={repairStatusTone(repair.status)} />
      </div>

      <div className="admin-repair-card__body">
        <div className="admin-repair-card__field">
          <span>Fecha</span>
          <strong>{formatDateTime(repair.createdAt)}</strong>
        </div>
        <div className="admin-repair-card__field">
          <span>Equipo</span>
          <strong>{getRepairDeviceLabel(repair)}</strong>
        </div>
        <div className="admin-repair-card__field">
          <span>Falla</span>
          <strong>{issueLabel}</strong>
        </div>
      </div>

      <div className="admin-repair-card__actions">
        <Button asChild variant="outline" size="sm">
          <Link to={`/admin/repairs/${encodeURIComponent(repair.id)}`}>Ver detalle</Link>
        </Button>
      </div>
    </article>
  );
}

function MetricCard({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <article className="nr-stat-card">
      <div className="nr-stat-card__label">{label}</div>
      <div className="nr-stat-card__value">{value}</div>
      <div className="nr-stat-card__meta">{meta}</div>
    </article>
  );
}
