import { AlertTriangle, PackageSearch, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { StatusBadge } from '@/components/ui/status-badge';
import type {
  AdminProviderAggregatePartSearchItem,
  AdminProviderAggregateSearchSupplierItem,
} from '@/features/admin/api';
import { money } from './repair-ui';
import { availabilityLabel, availabilityTone, partKey } from './repair-provider-part-pricing-section.helpers';

export type RepairProviderPartPricingSearchResultsProps = {
  searchLoading: boolean;
  searchError: string;
  partSearchQuery: string;
  visiblePartResults: AdminProviderAggregatePartSearchItem[];
  visibleSearchSuppliers: AdminProviderAggregateSearchSupplierItem[];
  visibleSearchSummary: {
    searchedSuppliers: number;
    suppliersWithResults: number;
    failedSuppliers: number;
    totalResults: number;
  };
  visibleFailedSupplierNames: string[];
  hiddenSmokeSupplierCount: number;
  hiddenSmokeFailureCount: number;
  hasTechnicalSearchDetails: boolean;
  selectedPartKey: string;
  disabled: boolean;
  onSelectPart: (key: string) => void;
};

export function RepairProviderPartSearchResults({
  searchLoading,
  searchError,
  partSearchQuery,
  visiblePartResults,
  visibleSearchSuppliers,
  visibleSearchSummary,
  visibleFailedSupplierNames,
  hiddenSmokeSupplierCount,
  hiddenSmokeFailureCount,
  hasTechnicalSearchDetails,
  selectedPartKey,
  disabled,
  onSelectPart,
}: RepairProviderPartPricingSearchResultsProps) {
  const visibleSearchHasFailures = visibleFailedSupplierNames.length > 0;

  return (
    <div className="mt-4">
      {searchLoading ? (
        <LoadingBlock label="Buscando repuestos en proveedores" lines={4} />
      ) : searchError ? (
        <div className="ui-alert ui-alert--danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No pudimos buscar repuestos</span>
            <div className="ui-alert__text">{searchError}</div>
          </div>
        </div>
      ) : !partSearchQuery ? (
        <EmptyState
          icon={<PackageSearch className="h-5 w-5" />}
          title="Todavia no buscaste repuestos"
          description="Escribi el repuesto una vez y consulta todos los proveedores activos. Luego podras elegir la mejor opcion para el calculo."
        />
      ) : (
        <div className="space-y-3">
          {visibleSearchSummary.searchedSuppliers > 0 ? (
            <div className={`ui-alert ${visibleSearchHasFailures ? 'ui-alert--warning' : 'ui-alert--info'}`}>
              <Truck className="mt-0.5 h-4 w-4 flex-none" />
              <div>
                <span className="ui-alert__title">Resultados agregados listos</span>
                <div className="ui-alert__text">
                  Consultamos {visibleSearchSummary.searchedSuppliers} proveedores, {visibleSearchSummary.suppliersWithResults}{' '}
                  devolvieron resultados y obtuvimos {visibleSearchSummary.totalResults} opciones comparables.
                  {visibleSearchHasFailures
                    ? ` ${visibleFailedSupplierNames.length} proveedor${visibleFailedSupplierNames.length === 1 ? '' : 'es'} no respondieron.`
                    : ''}
                </div>
              </div>
            </div>
          ) : null}

          {visibleSearchSuppliers.length > 0 ? (
            <RepairProviderPartSearchSupplierStatusList suppliers={visibleSearchSuppliers} />
          ) : null}

          {hasTechnicalSearchDetails ? (
            <RepairProviderPartSearchTechnicalDetails
              visibleFailedSupplierNames={visibleFailedSupplierNames}
              hiddenSmokeSupplierCount={hiddenSmokeSupplierCount}
              hiddenSmokeFailureCount={hiddenSmokeFailureCount}
            />
          ) : null}

          {visiblePartResults.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="h-5 w-5" />}
              title="Sin resultados para esta busqueda"
              description={
                visibleSearchHasFailures
                  ? `No hubo resultados utilizables. ${visibleFailedSupplierNames.length} proveedor${visibleFailedSupplierNames.length === 1 ? '' : 'es'} no respondieron.`
                  : 'No encontramos un repuesto utilizable con esa consulta. Proba otra descripcion o acota a un proveedor puntual.'
              }
            />
          ) : (
            visiblePartResults.map((part) => (
              <RepairProviderPartSearchResultRow
                key={partKey(part)}
                part={part}
                selected={selectedPartKey === partKey(part)}
                disabled={disabled}
                onSelectPart={onSelectPart}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function RepairProviderPartSearchSupplierStatusList({
  suppliers,
}: {
  suppliers: AdminProviderAggregateSearchSupplierItem[];
}) {
  return (
    <div className="grid gap-2 lg:grid-cols-2">
      {suppliers.map((item) => {
        const statusLabel =
          item.status === 'ok' ? 'Con resultados' : item.status === 'empty' ? 'Sin resultados' : 'Error';
        const statusTone =
          item.status === 'ok' ? 'success' : item.status === 'empty' ? 'neutral' : 'danger';

        return (
          <div
            key={item.supplier.id}
            className="rounded-2xl border border-zinc-200 bg-white/90 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-900">{item.supplier.name}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  {item.total > 0 ? `${item.total} resultado${item.total === 1 ? '' : 's'} detectado${item.total === 1 ? '' : 's'}` : 'Sin coincidencias utilizables'}
                </div>
              </div>
              <StatusBadge label={statusLabel} tone={statusTone} size="sm" />
            </div>

            {item.error ? <div className="mt-2 text-xs text-rose-600">{item.error}</div> : null}

            {item.url ? (
              <div className="mt-2">
                <Button asChild variant="ghost" size="sm">
                  <a href={item.url} target="_blank" rel="noreferrer">
                    Abrir busqueda
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function RepairProviderPartSearchTechnicalDetails({
  visibleFailedSupplierNames,
  hiddenSmokeSupplierCount,
  hiddenSmokeFailureCount,
}: {
  visibleFailedSupplierNames: string[];
  hiddenSmokeSupplierCount: number;
  hiddenSmokeFailureCount: number;
}) {
  return (
    <details className="rounded-2xl border border-zinc-200 bg-white/90 px-4 py-3 text-sm text-zinc-600">
      <summary className="cursor-pointer select-none font-medium text-zinc-800">Ver detalle tecnico</summary>
      <div className="mt-3 space-y-2 text-xs leading-5 text-zinc-500">
        {visibleFailedSupplierNames.length > 0 ? <div>Fallos visibles: {visibleFailedSupplierNames.join(', ')}.</div> : null}
        {hiddenSmokeSupplierCount > 0 ? (
          <div>
            Se omitieron {hiddenSmokeSupplierCount} proveedor{hiddenSmokeSupplierCount === 1 ? '' : 'es'} de smoke/test del
            resumen visible.
            {hiddenSmokeFailureCount > 0
              ? ` ${hiddenSmokeFailureCount} de esos proveedor${hiddenSmokeFailureCount === 1 ? '' : 'es'} fallaron durante la consulta.`
              : ''}
          </div>
        ) : null}
      </div>
    </details>
  );
}

function RepairProviderPartSearchResultRow({
  part,
  selected,
  disabled,
  onSelectPart,
}: {
  part: AdminProviderAggregatePartSearchItem;
  selected: boolean;
  disabled: boolean;
  onSelectPart: (key: string) => void;
}) {
  const currentKey = partKey(part);

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      className={`admin-entity-row w-full text-left ${selected ? 'ring-2 ring-sky-300' : ''} ${
        disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
      }`}
      onClick={() => {
        if (disabled) return;
        onSelectPart(currentKey);
      }}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelectPart(currentKey);
        }
      }}
    >
      <div className="min-w-0">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          {part.supplier.name}
        </div>
        <div className="admin-entity-row__title flex items-center gap-2">
          <span>{part.name}</span>
          <StatusBadge label={availabilityLabel(part.availability)} tone={availabilityTone(part.availability)} size="sm" />
        </div>
        <div className="admin-entity-row__meta">
          {part.brand || 'Marca no informada'}
          {part.sku ? ` | SKU ${part.sku}` : ''}
          {part.url ? ' | con enlace' : ' | sin enlace directo'}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="text-sm font-semibold text-zinc-900">{money(part.price, 'Sin precio')}</div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {part.url ? (
            <Button asChild variant="ghost" size="sm">
              <a
                href={part.url}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                Ver articulo
              </a>
            </Button>
          ) : (
            <span className="text-xs font-medium text-zinc-500">Sin enlace</span>
          )}
          <Button
            type="button"
            variant={selected ? 'secondary' : 'outline'}
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              if (disabled) return;
              onSelectPart(currentKey);
            }}
            disabled={disabled}
          >
            {selected ? 'Seleccionado' : 'Elegir'}
          </Button>
        </div>
      </div>
    </div>
  );
}
