import { AlertTriangle, PackageSearch, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import type { AdminProviderAggregatePartSearchItem } from '@/features/admin/api';
import { money } from './repair-ui';
import {
  availabilityLabel,
  availabilityTone,
  isSelectableProviderPart,
  partKey,
} from './repair-provider-part-pricing-section.helpers';

export type RepairProviderPartPricingSearchResultsProps = {
  searchLoading: boolean;
  searchProgress: number;
  searchError: string;
  partSearchQuery: string;
  visiblePartResults: AdminProviderAggregatePartSearchItem[];
  selectedPartKey: string;
  disabled: boolean;
  onSelectPart: (key: string) => void;
};

export function RepairProviderPartSearchResults({
  searchLoading,
  searchProgress,
  searchError,
  partSearchQuery,
  visiblePartResults,
  selectedPartKey,
  disabled,
  onSelectPart,
}: RepairProviderPartPricingSearchResultsProps) {
  return (
    <div className="mt-4">
      {searchLoading ? (
        <RepairProviderPartSearchLoadingState progress={searchProgress} />
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
          <div className="ui-alert ui-alert--info">
            <Truck className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <span className="ui-alert__title">Resultados listos</span>
              <div className="ui-alert__text">
                Elegi el repuesto correcto de la lista y usalo para calcular el costo real del caso.
              </div>
            </div>
          </div>

          {visiblePartResults.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="h-5 w-5" />}
              title="Sin resultados para esta busqueda"
              description="No encontramos un repuesto utilizable con esa consulta exacta. Proba otra descripcion o acota a un proveedor puntual."
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
  const outOfStock = part.availability === 'out_of_stock';
  const missingPrice = part.price == null;
  const selectionDisabled = disabled || !isSelectableProviderPart(part);

  return (
    <div
      role={selectionDisabled ? undefined : 'button'}
      tabIndex={selectionDisabled ? -1 : 0}
      aria-pressed={selected}
      aria-disabled={selectionDisabled}
      className={`admin-entity-row provider-search-result-row w-full text-left ${selected ? 'ring-2 ring-sky-300' : ''} ${
        selectionDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
      }`}
      onClick={() => {
        if (selectionDisabled) return;
        onSelectPart(currentKey);
      }}
      onKeyDown={(event) => {
        if (selectionDisabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelectPart(currentKey);
        }
      }}
    >
      <div className="min-w-0">
        <div className="provider-search-result-row__supplier">
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
              if (selectionDisabled) return;
              onSelectPart(currentKey);
            }}
            disabled={selectionDisabled}
          >
            {outOfStock ? 'Sin stock' : missingPrice ? 'Sin precio' : selected ? 'Seleccionado' : 'Elegir'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RepairProviderPartSearchLoadingState({ progress }: { progress: number }) {
  const safeProgress = Math.max(8, Math.min(progress, 100));
  const phaseLabel =
    safeProgress < 35
      ? 'Preparando consulta exacta'
      : safeProgress < 75
        ? 'Buscando en proveedores reales'
        : 'Ordenando resultados por precio';

  return (
    <div className="provider-search-loading" aria-busy="true" aria-live="polite">
      <div className="provider-search-loading__top">
        <div>
          <div className="provider-search-loading__title">Buscando repuestos</div>
          <div className="provider-search-loading__hint">{phaseLabel}</div>
        </div>
        <Truck className="h-4 w-4 text-sky-600" />
      </div>
      <div
        className="provider-search-progress"
        role="progressbar"
        aria-label="Progreso de busqueda de repuestos"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(safeProgress)}
      >
        <div className="provider-search-progress__fill" style={{ width: `${safeProgress}%` }} />
      </div>
      <div className="mt-3 space-y-2">
        <div className="provider-search-loading__skeleton provider-search-loading__skeleton--wide" />
        <div className="provider-search-loading__skeleton" />
        <div className="provider-search-loading__skeleton provider-search-loading__skeleton--short" />
      </div>
    </div>
  );
}
