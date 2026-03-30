import { AlertTriangle, PackageSearch, RefreshCcw, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import type {
  AdminProviderAggregatePartSearchItem,
  AdminProviderAggregateSearchSupplierItem,
} from '@/features/admin/api';
import { money } from './repair-ui';
import {
  availabilityLabel,
  availabilityTone,
  partKey,
  type ProviderFilterOption,
} from './repair-provider-part-pricing-section.helpers';

type SearchControlsProps = {
  compactMode: boolean;
  disabled: boolean;
  providersLoading: boolean;
  providersError: string;
  selectedProviderHint: string;
  providerFilterOptions: ProviderFilterOption[];
  supplierFilterId: string;
  partQueryInput: string;
  quantityInput: string;
  extraCostInput: string;
  shippingCostInput: string;
  quantityHint: string;
  extraCostHint: string;
  shippingCostHint: string;
  searchLoading: boolean;
  onProviderReload: () => void;
  onSupplierFilterChange: (next: string) => void;
  onPartQueryChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onExtraCostChange: (value: string) => void;
  onShippingCostChange: (value: string) => void;
  onSearch: () => void;
};

type SearchResultsProps = {
  searchLoading: boolean;
  searchError: string;
  partSearchQuery: string;
  visiblePartResults: AdminProviderAggregatePartSearchItem[];
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

type SelectedPartSummaryProps = {
  selectedPart: AdminProviderAggregatePartSearchItem | null;
};

export function RepairProviderPartPricingSearchControls({
  compactMode,
  disabled,
  providersLoading,
  providersError,
  selectedProviderHint,
  providerFilterOptions,
  supplierFilterId,
  partQueryInput,
  quantityInput,
  extraCostInput,
  shippingCostInput,
  quantityHint,
  extraCostHint,
  shippingCostHint,
  searchLoading,
  onProviderReload,
  onSupplierFilterChange,
  onPartQueryChange,
  onQuantityChange,
  onExtraCostChange,
  onShippingCostChange,
  onSearch,
}: SearchControlsProps) {
  return (
    <>
      {providersError ? (
        <div className="ui-alert ui-alert--danger mb-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div className="grow">
            <span className="ui-alert__title">No pudimos cargar proveedores con búsqueda</span>
            <div className="ui-alert__text">{providersError}</div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onProviderReload}
            disabled={providersLoading || disabled}
          >
            <RefreshCcw className="h-4 w-4" />
            Reintentar
          </Button>
        </div>
      ) : null}

      <div className={compactMode ? 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]' : 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem_auto]'}>
        <TextField
          label="Buscar repuesto"
          value={partQueryInput}
          onChange={(event) => onPartQueryChange(event.target.value)}
          placeholder="Ej: módulo Samsung A10"
          hint={selectedProviderHint}
          disabled={disabled}
          data-admin-repair-part-query
        />
        {!compactMode ? (
          <div className="ui-field">
            <span className="ui-field__label">Proveedor puntual (opcional)</span>
            <CustomSelect
              value={supplierFilterId}
              onChange={onSupplierFilterChange}
              options={providerFilterOptions}
              disabled={providersLoading || disabled}
              className="w-full"
              triggerClassName="min-h-11 rounded-[1rem]"
              ariaLabel="Filtrar búsqueda por proveedor"
            />
            <span className="ui-field__hint">Podés acotar la búsqueda a un proveedor si querés un fallback manual.</span>
          </div>
        ) : null}
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            onClick={onSearch}
            disabled={searchLoading || disabled}
            data-admin-repair-part-search
          >
            {searchLoading ? 'Buscando...' : 'Buscar en proveedores'}
          </Button>
        </div>
      </div>

      {compactMode ? (
        <details className="nr-disclosure mt-4">
          <summary className="nr-disclosure__summary">
            <span className="nr-disclosure__title">Ajustes avanzados del cálculo</span>
            <span className="nr-disclosure__meta">Proveedor puntual, cantidad, extras y envío</span>
          </summary>
          <div className="nr-disclosure__body">
            <div className="ui-field">
              <span className="ui-field__label">Proveedor puntual (opcional)</span>
              <CustomSelect
                value={supplierFilterId}
                onChange={onSupplierFilterChange}
                options={providerFilterOptions}
                disabled={providersLoading || disabled}
                className="w-full"
                triggerClassName="min-h-11 rounded-[1rem]"
                ariaLabel="Filtrar búsqueda por proveedor"
              />
              <span className="ui-field__hint">Usalo solo si querés repetir la búsqueda contra un proveedor puntual.</span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <TextField
                label="Cantidad"
                value={quantityInput}
                onChange={(event) => onQuantityChange(event.target.value)}
                inputMode="numeric"
                placeholder="1"
                hint={quantityHint}
                disabled={disabled}
              />
              <TextField
                label="Extra"
                value={extraCostInput}
                onChange={(event) => onExtraCostChange(event.target.value)}
                inputMode="decimal"
                placeholder="0"
                hint={extraCostHint}
                disabled={disabled}
              />
              <TextField
                label="Envío"
                value={shippingCostInput}
                onChange={(event) => onShippingCostChange(event.target.value)}
                inputMode="decimal"
                placeholder="0"
                hint={shippingCostHint}
                disabled={disabled}
              />
            </div>
          </div>
        </details>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <TextField
            label="Cantidad"
            value={quantityInput}
            onChange={(event) => onQuantityChange(event.target.value)}
            inputMode="numeric"
            placeholder="1"
            hint={quantityHint}
            disabled={disabled}
          />
          <TextField
            label="Extra"
            value={extraCostInput}
            onChange={(event) => onExtraCostChange(event.target.value)}
            inputMode="decimal"
            placeholder="0"
            hint={extraCostHint}
            disabled={disabled}
          />
          <TextField
            label="Envío"
            value={shippingCostInput}
            onChange={(event) => onShippingCostChange(event.target.value)}
            inputMode="decimal"
            placeholder="0"
            hint={shippingCostHint}
            disabled={disabled}
          />
        </div>
      )}
    </>
  );
}

export function RepairProviderPartPricingSearchResults({
  searchLoading,
  searchError,
  partSearchQuery,
  visiblePartResults,
  visibleSearchSummary,
  visibleFailedSupplierNames,
  hiddenSmokeSupplierCount,
  hiddenSmokeFailureCount,
  hasTechnicalSearchDetails,
  selectedPartKey,
  disabled,
  onSelectPart,
}: SearchResultsProps) {
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
          title="Todavía no buscaste repuestos"
          description="Escribí el repuesto una vez y consultá todos los proveedores activos. Luego podrás elegir la mejor opción para el cálculo."
        />
      ) : visiblePartResults.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="h-5 w-5" />}
          title="Sin resultados para esta búsqueda"
          description={
            visibleSearchHasFailures
              ? `No hubo resultados utilizables. ${visibleFailedSupplierNames.length} proveedor${visibleFailedSupplierNames.length === 1 ? '' : 'es'} no respondieron.`
              : 'No encontramos un repuesto utilizable con esa consulta. Probá otra descripción o acotá a un proveedor puntual.'
          }
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

          {hasTechnicalSearchDetails ? (
            <details className="rounded-2xl border border-zinc-200 bg-white/90 px-4 py-3 text-sm text-zinc-600">
              <summary className="cursor-pointer select-none font-medium text-zinc-800">Ver detalle técnico</summary>
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
          ) : null}

          {visiblePartResults.map((part) => {
            const currentKey = partKey(part);
            const selected = selectedPartKey === currentKey;

            return (
              <div
                key={currentKey}
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
                    {part.sku ? ` · SKU ${part.sku}` : ''}
                    {part.url ? ' · con enlace' : ' · sin enlace directo'}
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
                          Ver artículo
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
          })}
        </div>
      )}
    </div>
  );
}

export function RepairProviderPartPricingSelectedPartSummary({ selectedPart }: SelectedPartSummaryProps) {
  if (!selectedPart) return null;

  return (
    <div className="mt-4 summary-box">
      <div className="summary-box__label">Opción seleccionada</div>
      <div className="summary-box__value">{selectedPart.supplier.name}</div>
      <div className="summary-box__hint">
        {selectedPart.name} · {money(selectedPart.price, 'Sin precio')} · {availabilityLabel(selectedPart.availability)}
      </div>
    </div>
  );
}
