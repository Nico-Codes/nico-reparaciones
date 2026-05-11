import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { RepairInternalStockSuggestionsPanel } from './RepairInternalStockSuggestionsPanel';
import type { RepairProviderPartPricingSectionProps } from './repair-provider-part-pricing-section.helpers';
import { RepairProviderPartPricingPreviewPanel } from './repair-provider-part-pricing-section.preview';
import {
  RepairProviderPartPricingSearchControls,
  RepairProviderPartPricingSearchResults,
  RepairProviderPartPricingSelectedPartSummary,
} from './repair-provider-part-pricing-section.search';
import { RepairProviderPartPricingSnapshotPanels } from './repair-provider-part-pricing-section.snapshot';
import { useRepairProviderPartPricing } from './use-repair-provider-part-pricing';

export function RepairProviderPartPricingSection(props: RepairProviderPartPricingSectionProps) {
  const pricing = useRepairProviderPartPricing(props);
  const [hasInternalStockSuggestions, setHasInternalStockSuggestions] = useState(false);
  const [showExternalSearch, setShowExternalSearch] = useState(true);

  useEffect(() => {
    setShowExternalSearch(!hasInternalStockSuggestions);
  }, [hasInternalStockSuggestions, props.hydrateKey]);

  return (
    <SectionCard
      title="Proveedor y repuesto"
      description="Busca una vez en todos los proveedores activos, elige la mejor opcion y calcula el presupuesto con costo real antes de aplicarlo al caso."
      actions={<StatusBadge label={pricing.statusBadge.label} tone={pricing.statusBadge.tone} size="sm" />}
    >
      <div data-admin-repair-provider-part>
        <RepairInternalStockSuggestionsPanel
          mode={props.mode}
          technicalContext={props.technicalContext}
          disabled={props.disabled}
          onPendingSnapshotDraftChange={props.onPendingSnapshotDraftChange}
          onUseSuggestedPrice={props.onUseSuggestedPrice}
          onStatusMessage={props.onStatusMessage}
          onSuggestionsStateChange={setHasInternalStockSuggestions}
          onOpenExternalSearch={() => setShowExternalSearch(true)}
        />
        <RepairProviderPartPricingSnapshotPanels {...pricing.snapshotPanelsProps} />
        {hasInternalStockSuggestions && !showExternalSearch ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/80 px-4 py-3 text-sm font-semibold text-zinc-600">
            Hay stock interno compatible. La busqueda externa esta minimizada para evitar compras innecesarias.
            <div className="mt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowExternalSearch(true)}>
                Buscar proveedor externo
              </Button>
            </div>
          </div>
        ) : (
          <>
            <RepairProviderPartPricingSearchControls {...pricing.searchControlsProps} />
            <RepairProviderPartPricingSearchResults {...pricing.searchResultsProps} />
            <RepairProviderPartPricingSelectedPartSummary selectedPart={pricing.selectedPart} />
            <RepairProviderPartPricingPreviewPanel {...pricing.previewPanelProps} />
          </>
        )}
      </div>
    </SectionCard>
  );
}
