import { AlertTriangle, PackageSearch, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { StatusBadge } from '@/components/ui/status-badge';
import type { AdminProviderAggregatePartSearchItem } from '@/features/admin/api';
import { money } from './repair-ui';
import { availabilityLabel, availabilityTone, partKey } from './repair-provider-part-pricing-section.helpers';

export type RepairProviderPartPricingSearchResultsProps = {
  searchLoading: boolean;
  searchError: string;
  partSearchQuery: string;
  visiblePartResults: AdminProviderAggregatePartSearchItem[];
  selectedPartKey: string;
  disabled: boolean;
  onSelectPart: (key: string) => void;
};

export function RepairProviderPartSearchResults({
  searchLoading,
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
