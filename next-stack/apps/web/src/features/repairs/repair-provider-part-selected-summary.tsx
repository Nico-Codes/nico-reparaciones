import type { AdminProviderAggregatePartSearchItem } from '@/features/admin/api';
import { money } from './repair-ui';
import { availabilityLabel } from './repair-provider-part-pricing-section.helpers';

export function RepairProviderPartSelectedSummary({
  selectedPart,
}: {
  selectedPart: AdminProviderAggregatePartSearchItem | null;
}) {
  if (!selectedPart) return null;

  return (
    <div className="mt-4 summary-box">
      <div className="summary-box__label">Opcion seleccionada</div>
      <div className="summary-box__value">{selectedPart.supplier.name}</div>
      <div className="summary-box__hint">
        {selectedPart.name} | {money(selectedPart.price, 'Sin precio')} | {availabilityLabel(selectedPart.availability)}
      </div>
    </div>
  );
}
