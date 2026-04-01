import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
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

  return (
    <SectionCard
      title="Proveedor y repuesto"
      description="Busca una vez en todos los proveedores activos, elige la mejor opcion y calcula el presupuesto con costo real antes de aplicarlo al caso."
      actions={<StatusBadge label={pricing.statusBadge.label} tone={pricing.statusBadge.tone} size="sm" />}
    >
      <div data-admin-repair-provider-part>
        <RepairProviderPartPricingSnapshotPanels {...pricing.snapshotPanelsProps} />
        <RepairProviderPartPricingSearchControls {...pricing.searchControlsProps} />
        <RepairProviderPartPricingSearchResults {...pricing.searchResultsProps} />
        <RepairProviderPartPricingSelectedPartSummary selectedPart={pricing.selectedPart} />
        <RepairProviderPartPricingPreviewPanel {...pricing.previewPanelProps} />
      </div>
    </SectionCard>
  );
}
