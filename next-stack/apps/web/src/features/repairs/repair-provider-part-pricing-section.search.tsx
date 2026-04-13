import type {
  AdminProviderAggregatePartSearchItem,
} from '@/features/admin/api';
import type { ProviderFilterOption } from './repair-provider-part-pricing-section.helpers';
import {
  RepairProviderPartSearchControls,
  type RepairProviderPartPricingSearchControlsProps,
} from './repair-provider-part-search-controls';
import {
  RepairProviderPartSearchResults,
  type RepairProviderPartPricingSearchResultsProps,
} from './repair-provider-part-search-results';
import { RepairProviderPartSelectedSummary } from './repair-provider-part-selected-summary';

export function RepairProviderPartPricingSearchControls(
  props: RepairProviderPartPricingSearchControlsProps,
) {
  return <RepairProviderPartSearchControls {...props} />;
}

export function RepairProviderPartPricingSearchResults(
  props: RepairProviderPartPricingSearchResultsProps,
) {
  return <RepairProviderPartSearchResults {...props} />;
}

export function RepairProviderPartPricingSelectedPartSummary({
  selectedPart,
}: {
  selectedPart: AdminProviderAggregatePartSearchItem | null;
}) {
  return <RepairProviderPartSelectedSummary selectedPart={selectedPart} />;
}
