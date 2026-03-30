import { AlertTriangle, Calculator, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingBlock } from '@/components/ui/loading-block';
import { money } from './repair-ui';
import { previewModeLabel } from './repair-provider-part-pricing-section.helpers';
import type { RepairProviderPartPricingPreviewResult } from './api';

type PreviewInputState = {
  canResolve: boolean;
  reason: string;
};

type Props = {
  compactMode: boolean;
  mode: 'create' | 'detail';
  disabled: boolean;
  previewInputState: PreviewInputState;
  previewLoading: boolean;
  activePreviewError: string;
  previewNeedsRefresh: boolean;
  activePreviewResult: RepairProviderPartPricingPreviewResult | null;
  previewSuggested: number | null;
  quotedPriceValue: number | null;
  pendingSnapshotIsCurrent: boolean;
  onCalculatePreview: () => void;
  onApplySuggestedPrice: () => void;
  onApplySnapshotDraft: () => void;
  onClearPendingSnapshot: () => void;
};

export function RepairProviderPartPricingPreviewPanel({
  compactMode,
  mode,
  disabled,
  previewInputState,
  previewLoading,
  activePreviewError,
  previewNeedsRefresh,
  activePreviewResult,
  previewSuggested,
  quotedPriceValue,
  pendingSnapshotIsCurrent,
  onCalculatePreview,
  onApplySuggestedPrice,
  onApplySnapshotDraft,
  onClearPendingSnapshot,
}: Props) {
  return (
    <>
      <div className="mt-4">
        {!previewInputState.canResolve ? (
          <div className="ui-alert ui-alert--info">
            <Calculator className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <span className="ui-alert__title">Preview no disponible todavía</span>
              <div className="ui-alert__text">{previewInputState.reason}</div>
            </div>
          </div>
        ) : previewLoading ? (
          <LoadingBlock label="Calculando con proveedor y repuesto" lines={4} />
        ) : activePreviewError ? (
          <div className="ui-alert ui-alert--danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <span className="ui-alert__title">No pudimos calcular el preview</span>
              <div className="ui-alert__text">{activePreviewError}</div>
            </div>
          </div>
        ) : previewNeedsRefresh ? (
          <div className="ui-alert ui-alert--warning">
            <Calculator className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <span className="ui-alert__title">El preview quedó desactualizado</span>
              <div className="ui-alert__text">
                Recalculá para que el costo, la regla y el sugerido reflejen el proveedor, repuesto y contexto técnico
                actuales.
              </div>
            </div>
          </div>
        ) : activePreviewResult?.matched && activePreviewResult.snapshotDraft ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="summary-box">
                <div className="summary-box__label">Sugerido con costo real</div>
                <div className="summary-box__value">
                  {money(activePreviewResult.calculation.suggestedQuotedPrice, 'Sin sugerencia')}
                </div>
                <div className="summary-box__hint">
                  {activePreviewResult.rule?.name ?? 'Regla activa'} · {previewModeLabel(activePreviewResult)}
                </div>
              </div>
              <div className="summary-box">
                <div className="summary-box__label">Presupuesto actual</div>
                <div className="summary-box__value">{money(quotedPriceValue, 'Sin definir')}</div>
                <div className="summary-box__hint">
                  {pendingSnapshotIsCurrent
                    ? 'Hay un snapshot listo para guardar.'
                    : 'Podés usar el sugerido o mantener un override manual.'}
                </div>
              </div>
            </div>

            {compactMode ? (
              <details className="nr-disclosure">
                <summary className="nr-disclosure__summary">
                  <span className="nr-disclosure__title">Ver detalle del cálculo</span>
                  <span className="nr-disclosure__meta">{previewModeLabel(activePreviewResult)}</span>
                </summary>
                <div className="nr-disclosure__body">
                  <PreviewFacts result={activePreviewResult} />
                </div>
              </details>
            ) : (
              <PreviewFacts result={activePreviewResult} />
            )}

            {pendingSnapshotIsCurrent ? (
              <div className="ui-alert ui-alert--success">
                <Truck className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <span className="ui-alert__title">Snapshot listo para guardar</span>
                  <div className="ui-alert__text">
                    {mode === 'create'
                      ? 'Al crear la reparación se guardará este proveedor, repuesto y cálculo como snapshot activo.'
                      : 'Al guardar el caso, este snapshot reemplazará al activo y quedará trazado históricamente.'}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : activePreviewResult ? (
          <div className="ui-alert ui-alert--warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <span className="ui-alert__title">No encontramos una regla aplicable</span>
              <div className="ui-alert__text">
                El proveedor y el repuesto se encontraron, pero no hay una regla activa que cierre el cálculo para este
                contexto técnico.
              </div>
            </div>
          </div>
        ) : (
          <div className="ui-alert ui-alert--info">
            <Calculator className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <span className="ui-alert__title">Listo para calcular</span>
              <div className="ui-alert__text">
                Cuando el repuesto elegido y el contexto técnico estén definidos, calculá el preview y decidí si querés
                aplicarlo.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCalculatePreview}
          disabled={!previewInputState.canResolve || previewLoading || disabled}
          data-admin-repair-part-preview
        >
          {previewLoading ? 'Calculando...' : activePreviewResult || previewNeedsRefresh ? 'Recalcular preview' : 'Calcular preview'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onApplySuggestedPrice}
          disabled={previewSuggested == null || previewLoading || disabled}
          data-admin-repair-part-use-suggested
        >
          Usar sugerido
        </Button>
        <Button
          type="button"
          onClick={onApplySnapshotDraft}
          disabled={!activePreviewResult?.matched || !activePreviewResult.snapshotDraft || previewLoading || disabled}
          data-admin-repair-part-apply-snapshot
        >
          {mode === 'create' ? 'Aplicar snapshot al crear' : 'Aplicar snapshot al guardar'}
        </Button>
        {pendingSnapshotIsCurrent ? (
          <Button type="button" variant="outline" onClick={onClearPendingSnapshot} disabled={previewLoading || disabled}>
            Limpiar snapshot
          </Button>
        ) : null}
      </div>
    </>
  );
}

function PreviewFacts({ result }: { result: RepairProviderPartPricingPreviewResult }) {
  return (
    <div className="fact-list">
      <div className="fact-row">
        <div className="fact-label">Costo base</div>
        <div className="fact-value">{money(result.calculation.baseCost, 'Sin costo')}</div>
      </div>
      <div className="fact-row">
        <div className="fact-label">Extras / envío</div>
        <div className="fact-value fact-value--text">
          {money(result.calculation.extraCost, '0')} · Envío {money(result.calculation.shippingCost, '0')}
        </div>
      </div>
      <div className="fact-row">
        <div className="fact-label">Margen / modo</div>
        <div className="fact-value fact-value--text">
          {result.calculation.calcMode === 'FIXED_TOTAL'
            ? 'Total fijo según regla'
            : `${result.calculation.marginPercent ?? 0}% · ${previewModeLabel(result)}`}
        </div>
      </div>
      <div className="fact-row">
        <div className="fact-label">Piso / fee</div>
        <div className="fact-value fact-value--text">
          {result.calculation.minFinalPrice != null ? `Piso ${money(result.calculation.minFinalPrice, '0')}` : 'Sin piso'}
          {result.calculation.appliedShippingFee != null
            ? ` · Fee ${money(result.calculation.appliedShippingFee, '0')}`
            : ''}
        </div>
      </div>
    </div>
  );
}
