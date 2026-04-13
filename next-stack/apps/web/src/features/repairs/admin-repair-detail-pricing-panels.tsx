import { AlertTriangle, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingBlock } from '@/components/ui/loading-block';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/status-badge';
import type { RepairPricingResolveResult } from './api';
import { pricingRuleModeLabel } from './repair-pricing';
import { money } from './repair-ui';

type PricingSectionProps = {
  pricingInputState: {
    canResolve: boolean;
    reason: string;
  };
  pricingBadge: {
    label: string;
    tone: StatusBadgeProps['tone'];
  };
  pricingLoading: boolean;
  activePricingError: string;
  pricingNeedsRefresh: boolean;
  activePricingResult: RepairPricingResolveResult | null;
  quotedPriceValue: number | null;
  canUseSuggested: boolean;
  saving: boolean;
  onRecalculate: () => void;
  onUseSuggested: () => void;
};

export function AdminRepairDetailSuggestedPricingSection({
  pricingInputState,
  pricingBadge,
  pricingLoading,
  activePricingError,
  pricingNeedsRefresh,
  activePricingResult,
  quotedPriceValue,
  canUseSuggested,
  saving,
  onRecalculate,
  onUseSuggested,
}: PricingSectionProps) {
  return (
    <SectionCard
      title="Presupuesto sugerido"
      description="Consulta las reglas activas para comparar el presupuesto cargado con una sugerencia calculada."
      actions={<StatusBadge label={pricingBadge.label} tone={pricingBadge.tone} size="sm" />}
    >
      {!pricingInputState.canResolve ? (
        <InfoAlert title="Datos insuficientes para calcular" description={pricingInputState.reason} />
      ) : pricingLoading ? (
        <LoadingBlock label="Calculando presupuesto sugerido" lines={4} />
      ) : activePricingError ? (
        <DangerAlert title="No pudimos resolver una sugerencia" description={activePricingError} />
      ) : pricingNeedsRefresh ? (
        <WarningAlert
          title="Los datos cambiaron"
          description="Recalcula la sugerencia para comparar el presupuesto con las reglas activas actuales."
        />
      ) : activePricingResult?.matched && activePricingResult.suggestion ? (
        <PricingResolvedSummary activePricingResult={activePricingResult} quotedPriceValue={quotedPriceValue} />
      ) : activePricingResult ? (
        <WarningAlert
          title="No hay una regla aplicable"
          description="Puedes seguir con presupuesto manual o ajustar la informacion del caso y volver a calcular."
        />
      ) : (
        <InfoAlert
          title="Listo para calcular"
          description="Usa la informacion actual del caso para comparar tu presupuesto con las reglas activas."
        />
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onRecalculate}
          disabled={!pricingInputState.canResolve || pricingLoading || saving}
          data-admin-repair-detail-calc
        >
          {pricingLoading ? 'Calculando...' : activePricingResult || pricingNeedsRefresh ? 'Recalcular' : 'Calcular sugerido'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onUseSuggested}
          disabled={!canUseSuggested || pricingLoading || saving}
          data-admin-repair-detail-use-suggested
        >
          Usar sugerido
        </Button>
      </div>
    </SectionCard>
  );
}

function PricingResolvedSummary({
  activePricingResult,
  quotedPriceValue,
}: {
  activePricingResult: RepairPricingResolveResult;
  quotedPriceValue: number | null;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="summary-box">
          <div className="summary-box__label">Presupuesto cargado</div>
          <div className="summary-box__value">{money(quotedPriceValue, 'Sin definir')}</div>
          <div className="summary-box__hint">Es el valor editable del caso antes de guardar cambios.</div>
        </div>
        <div className="summary-box">
          <div className="summary-box__label">Sugerido por reglas</div>
          <div className="summary-box__value">{money(activePricingResult.suggestion?.suggestedTotal ?? null, 'Sin sugerencia')}</div>
          <div className="summary-box__hint">
            {activePricingResult.rule?.name ?? 'Regla activa'} · {pricingRuleModeLabel(activePricingResult)}
          </div>
        </div>
      </div>

      <div className="fact-list">
        <div className="fact-row">
          <div className="fact-label">Base</div>
          <div className="fact-value">{money(activePricingResult.suggestion?.basePrice ?? null, 'Sin base')}</div>
        </div>
        <div className="fact-row">
          <div className="fact-label">Margen / total</div>
          <div className="fact-value fact-value--text">
            {activePricingResult.suggestion?.calcMode === 'FIXED_TOTAL'
              ? 'Total fijo definido por regla'
              : `${activePricingResult.suggestion?.profitPercent}%${
                  activePricingResult.suggestion?.minProfit != null
                    ? ` · minimo $ ${activePricingResult.suggestion.minProfit.toLocaleString('es-AR')}`
                    : ''
                }`}
          </div>
        </div>
        <div className="fact-row">
          <div className="fact-label">Piso / envio</div>
          <div className="fact-value fact-value--text">
            {activePricingResult.suggestion?.minFinalPrice != null
              ? `Piso $ ${activePricingResult.suggestion.minFinalPrice.toLocaleString('es-AR')}`
              : 'Sin piso'}
            {activePricingResult.suggestion?.shippingFee != null
              ? ` · Envio $ ${activePricingResult.suggestion.shippingFee.toLocaleString('es-AR')}`
              : ''}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoAlert({ title, description }: { title: string; description: string }) {
  return (
    <div className="ui-alert ui-alert--info">
      <Calculator className="mt-0.5 h-4 w-4 flex-none" />
      <div>
        <span className="ui-alert__title">{title}</span>
        <div className="ui-alert__text">{description}</div>
      </div>
    </div>
  );
}

function WarningAlert({ title, description }: { title: string; description: string }) {
  return (
    <div className="ui-alert ui-alert--warning">
      <Calculator className="mt-0.5 h-4 w-4 flex-none" />
      <div>
        <span className="ui-alert__title">{title}</span>
        <div className="ui-alert__text">{description}</div>
      </div>
    </div>
  );
}

function DangerAlert({ title, description }: { title: string; description: string }) {
  return (
    <div className="ui-alert ui-alert--danger">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
      <div>
        <span className="ui-alert__title">{title}</span>
        <div className="ui-alert__text">{description}</div>
      </div>
    </div>
  );
}
