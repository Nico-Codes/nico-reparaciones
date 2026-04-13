import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { TextField } from '@/components/ui/text-field';
import type { ProviderFilterOption } from './repair-provider-part-pricing-section.helpers';

export type RepairProviderPartPricingSearchControlsProps = {
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

export function RepairProviderPartSearchControls({
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
}: RepairProviderPartPricingSearchControlsProps) {
  return (
    <>
      {providersError ? (
        <div className="ui-alert ui-alert--danger mb-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div className="grow">
            <span className="ui-alert__title">No pudimos cargar proveedores con busqueda</span>
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
          placeholder="Ej: modulo Samsung A10"
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
              ariaLabel="Filtrar busqueda por proveedor"
            />
            <span className="ui-field__hint">Podes acotar la busqueda a un proveedor si queres un fallback manual.</span>
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
            <span className="nr-disclosure__title">Ajustes avanzados del calculo</span>
            <span className="nr-disclosure__meta">Proveedor puntual, cantidad, extras y envio</span>
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
                ariaLabel="Filtrar busqueda por proveedor"
              />
              <span className="ui-field__hint">Usalo solo si queres repetir la busqueda contra un proveedor puntual.</span>
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
                label="Envio"
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
            label="Envio"
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
