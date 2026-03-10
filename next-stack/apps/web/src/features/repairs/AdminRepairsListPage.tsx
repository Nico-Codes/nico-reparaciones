import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCcw, Search, ShieldCheck, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { repairsApi } from './api';
import type { RepairItem } from './types';

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Recibido',
  DIAGNOSING: 'Diagnosticando',
  WAITING_APPROVAL: 'Esperando aprobación',
  REPAIRING: 'En reparación',
  READY_PICKUP: 'Listo para retirar',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

type BadgeTone = 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'danger';

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function statusTone(status: string): BadgeTone {
  switch (status) {
    case 'RECEIVED':
      return 'info';
    case 'DIAGNOSING':
    case 'REPAIRING':
      return 'accent';
    case 'WAITING_APPROVAL':
      return 'warning';
    case 'READY_PICKUP':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'neutral';
  }
}

const STATUS_FILTER_OPTIONS = [{ value: '', label: 'Todos los estados' }, ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))];

function repairCode(id: string) {
  return `R-${id.slice(0, 13)}`;
}

function money(value: number | null) {
  return value != null ? `$ ${value.toLocaleString('es-AR')}` : 'Sin definir';
}

function formatDateTime(dateIso: string) {
  const date = new Date(dateIso);
  return `${date.toLocaleDateString('es-AR')} ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
}

function timeAgo(dateIso: string) {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 60) return `hace ${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} día${days === 1 ? '' : 's'}`;
  const weeks = Math.floor(days / 7);
  return `hace ${weeks} semana${weeks === 1 ? '' : 's'}`;
}

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
      setError(cause instanceof Error ? cause.message : 'Error cargando reparaciones');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const base = items.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return [
        repairCode(item.id),
        item.customerName,
        item.customerPhone ?? '',
        item.deviceBrand ?? '',
        item.deviceModel ?? '',
        item.issueLabel ?? '',
        statusLabel(item.status),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });

    return base.slice(0, 50);
  }, [items, query, statusFilter]);

  const stats = useMemo(() => ({
    total: items.length,
    waitingApproval: items.filter((item) => item.status === 'WAITING_APPROVAL').length,
    readyPickup: items.filter((item) => item.status === 'READY_PICKUP').length,
    completed: items.filter((item) => item.status === 'DELIVERED').length,
  }), [items]);

  const hasFilters = query.trim().length > 0 || statusFilter.length > 0;

  return (
    <PageShell context="admin" className="space-y-6" data-admin-repairs-page>
      <PageHeader
        context="admin"
        eyebrow="Servicio técnico"
        title="Reparaciones"
        subtitle="Vista operativa para seguimiento, atención al cliente y acceso rápido al detalle de cada caso."
        actions={(
          <>
            <StatusBadge label={`${stats.total} ingresos`} tone="info" />
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </Button>
          </>
        )}
      />

      <section className="nr-stat-grid" data-reveal>
        <MetricCard label="Ingresos visibles" value={String(stats.total)} meta="Total cargado en el panel" />
        <MetricCard label="Esperando aprobación" value={String(stats.waitingApproval)} meta="Casos listos para presupuesto" />
        <MetricCard label="Listas para retirar" value={String(stats.readyPickup)} meta="Equipos terminados pendientes de entrega" />
        <MetricCard label="Entregadas" value={String(stats.completed)} meta="Casos cerrados correctamente" />
      </section>

      <FilterBar
        actions={(
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            {hasFilters ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => { setQuery(''); setStatusFilter(''); }}>
                Limpiar
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCcw className="h-4 w-4" />
              Recargar
            </Button>
          </div>
        )}
      >
        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          label="Buscar"
          placeholder="Código, cliente, teléfono o equipo"
          leadingIcon={<Search className="h-4 w-4" />}
          wrapperClassName="min-w-0 sm:min-w-[18rem]"
        />
        <div className="ui-field min-w-0 sm:min-w-[14rem]">
          <span className="ui-field__label">Estado</span>
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTER_OPTIONS}
            className="w-full"
            triggerClassName="min-h-11 rounded-[1rem]"
            ariaLabel="Filtrar reparaciones por estado"
          />
        </div>
      </FilterBar>

      <SectionCard
        title="Mesa operativa"
        description="Listado compacto con contexto suficiente para decidir el siguiente paso sin cargar ruido visual innecesario."
        actions={<StatusBadge label={statusFilter ? statusLabel(statusFilter) : 'Todos los estados'} tone={statusFilter ? statusTone(statusFilter) : 'neutral'} />}
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

        <div className="admin-collection">
          {loading ? (
            <SectionCard tone="muted" bodyClassName="space-y-3">
              <LoadingBlock label="Cargando reparaciones" lines={4} />
            </SectionCard>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title="No hay reparaciones para mostrar"
              description={hasFilters ? 'Prueba otra búsqueda o vuelve a todos los estados.' : 'Todavía no hay reparaciones registradas en el panel.'}
              actions={hasFilters ? <Button type="button" variant="outline" onClick={() => { setQuery(''); setStatusFilter(''); }}>Limpiar filtros</Button> : undefined}
            />
          ) : (
            filteredItems.map((repair) => {
              const displayPrice = repair.finalPrice ?? repair.quotedPrice;
              const issueLabel = repair.issueLabel || 'Sin diagnóstico registrado';
              const deviceLabel = [repair.deviceBrand, repair.deviceModel].filter(Boolean).join(' ') || 'Equipo sin identificar';
              return (
                <article key={repair.id} className="admin-entity-row">
                  <div className="admin-entity-row__top">
                    <div className="admin-entity-row__heading">
                      <div className="admin-entity-row__title-row">
                        <div className="admin-entity-row__title">{repairCode(repair.id)}</div>
                        <StatusBadge label={statusLabel(repair.status)} tone={statusTone(repair.status)} />
                        {repair.finalPrice != null ? <StatusBadge label="Precio final cargado" tone="success" /> : null}
                      </div>
                      <div className="admin-entity-row__meta">
                        <span>{repair.customerName}</span>
                        <span>{repair.customerPhone || 'Sin teléfono'}</span>
                        <span>{formatDateTime(repair.createdAt)}</span>
                        <span>{timeAgo(repair.createdAt)}</span>
                      </div>
                    </div>
                    <div className="admin-entity-row__aside">
                      <span className="admin-entity-row__eyebrow">Importe de referencia</span>
                      <div className="admin-entity-row__value">{money(displayPrice)}</div>
                    </div>
                  </div>

                  <div className="mt-4 detail-grid">
                    <div className="detail-stack">
                      <div className="detail-panel">
                        <div className="detail-panel__label">Equipo</div>
                        <div className="detail-panel__value">{deviceLabel}</div>
                      </div>
                      <div className="detail-panel">
                        <div className="detail-panel__label">Estado comercial</div>
                        <div className="detail-panel__value">
                          {repair.finalPrice != null ? 'Presupuesto final confirmado' : repair.quotedPrice != null ? 'Con presupuesto cargado' : 'Sin presupuesto cargado'}
                        </div>
                      </div>
                    </div>

                    <div className="detail-panel">
                      <div className="detail-panel__label">Falla reportada</div>
                      <div className="detail-panel__value">{issueLabel}</div>
                    </div>
                  </div>

                  <div className="admin-entity-row__actions">
                    <StatusBadge label={repair.userId ? 'Cliente web' : 'Ingreso interno'} tone="neutral" />
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/admin/repairs/${encodeURIComponent(repair.id)}`}>Ver detalle</Link>
                    </Button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </SectionCard>
    </PageShell>
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
