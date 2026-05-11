import { useEffect, useMemo, useRef, useState } from 'react';
import { PackageCheck, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingBlock } from '@/components/ui/loading-block';
import { StatusBadge } from '@/components/ui/status-badge';
import { catalogAdminApi, type AdminProduct, type AdminRepairPartApplicability } from '@/features/catalogAdmin/api';
import { repairsApi } from './api';
import { buildRepairPricingInput } from './repair-pricing';
import { money } from './repair-ui';
import type { RepairProviderPartPricingSectionProps } from './repair-provider-part-pricing-section.helpers';

type Suggestion = {
  product: AdminProduct;
  applicability: AdminRepairPartApplicability;
  score: number;
  matchKind: 'exact' | 'probable';
};

type Props = Pick<
  RepairProviderPartPricingSectionProps,
  | 'technicalContext'
  | 'disabled'
  | 'mode'
  | 'onPendingSnapshotDraftChange'
  | 'onUseSuggestedPrice'
  | 'onStatusMessage'
> & {
  onSuggestionsStateChange: (hasSuggestions: boolean) => void;
  onOpenExternalSearch: () => void;
};

export function RepairInternalStockSuggestionsPanel({
  technicalContext,
  disabled = false,
  mode,
  onPendingSnapshotDraftChange,
  onUseSuggestedPrice,
  onStatusMessage,
  onSuggestionsStateChange,
  onOpenExternalSearch,
}: Props) {
  const requestIdRef = useRef(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applyingId, setApplyingId] = useState('');

  const pricingInput = useMemo(() => buildRepairPricingInput(technicalContext), [technicalContext]);

  async function loadSuggestions() {
    const requestId = ++requestIdRef.current;
    if (!pricingInput.canResolve) {
      setSuggestions([]);
      setError('');
      onSuggestionsStateChange(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await catalogAdminApi.repairPartSuggestions({
        ...pricingInput.input,
        limit: 5,
      });
      if (requestId !== requestIdRef.current) return;
      setSuggestions(response.items);
      onSuggestionsStateChange(response.items.length > 0);
    } catch (cause) {
      if (requestId !== requestIdRef.current) return;
      setSuggestions([]);
      onSuggestionsStateChange(false);
      setError(cause instanceof Error ? cause.message : 'No pudimos revisar el stock interno compatible.');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    void loadSuggestions();
  }, [pricingInput.key]);

  async function applyInternalPart(suggestion: Suggestion) {
    if (disabled || applyingId || !pricingInput.canResolve) return;
    setApplyingId(suggestion.product.id);
    setError('');
    onPendingSnapshotDraftChange(null);

    try {
      const response = await repairsApi.pricingInternalPartPreview({
        productId: suggestion.product.id,
        applicabilityId: suggestion.applicability.id,
        quantity: 1,
        extraCost: 0,
        shippingCost: 0,
        ...pricingInput.input,
      });
      if (!response.matched || !response.snapshotDraft || response.calculation.suggestedQuotedPrice == null) {
        throw new Error('El repuesto existe, pero falta una regla de precio aplicable para este equipo y falla.');
      }
      onUseSuggestedPrice(response.calculation.suggestedQuotedPrice);
      onPendingSnapshotDraftChange(response.snapshotDraft);
      onStatusMessage?.(
        mode === 'create'
          ? 'Repuesto interno listo: se descontara stock al crear la reparacion.'
          : 'Repuesto interno listo: se descontara stock al guardar el caso.',
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos preparar el repuesto interno.');
    } finally {
      setApplyingId('');
    }
  }

  if (!pricingInput.canResolve && !loading) return null;

  if (loading) {
    return (
      <div className="mb-4">
        <LoadingBlock label="Revisando stock interno compatible" lines={2} />
      </div>
    );
  }

  if (suggestions.length === 0 && !error) return null;

  return (
    <div className="mb-4 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4" data-admin-repair-internal-stock>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Stock interno compatible</div>
          <div className="mt-1 text-sm font-semibold text-zinc-700">
            Si usas un repuesto interno, el stock se descuenta al guardar el caso. La busqueda externa queda como alternativa.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={suggestions.length > 0 ? 'success' : 'warning'} size="sm" label={`${suggestions.length} sugeridos`} />
          <Button type="button" variant="outline" size="sm" onClick={() => void loadSuggestions()} disabled={disabled || loading}>
            <RefreshCw className="h-4 w-4" />
            Revisar
          </Button>
        </div>
      </div>

      {error ? (
        <div className="ui-alert ui-alert--warning mt-4">
          <PackageCheck className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No pudimos usar stock interno</span>
            <div className="ui-alert__text">{error}</div>
          </div>
        </div>
      ) : null}

      {suggestions.length > 0 ? (
        <div className="mt-4 space-y-3">
          {suggestions.map((suggestion) => (
            <div key={`${suggestion.product.id}:${suggestion.applicability.id}`} className="rounded-2xl border border-emerald-200 bg-white p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-black text-zinc-950">{suggestion.product.name}</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-500">
                    Costo {money(suggestion.product.costPrice, 'Sin costo')} · Stock {suggestion.product.stock}
                  </div>
                  {suggestion.applicability.notes ? (
                    <div className="mt-1 text-xs font-semibold text-zinc-500">{suggestion.applicability.notes}</div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge
                      tone={suggestion.matchKind === 'exact' ? 'success' : 'info'}
                      size="sm"
                      label={suggestion.matchKind === 'exact' ? 'Match exacto' : 'Match probable'}
                    />
                    {!suggestion.product.publishedToStore ? <StatusBadge tone="neutral" size="sm" label="Stock interno" /> : null}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={disabled || applyingId === suggestion.product.id}
                  onClick={() => void applyInternalPart(suggestion)}
                  data-admin-repair-use-internal-part
                >
                  {applyingId === suggestion.product.id ? 'Preparando...' : 'Usar repuesto interno'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        <Button type="button" variant="ghost" size="sm" onClick={onOpenExternalSearch}>
          <Search className="h-4 w-4" />
          Buscar proveedor externo de todos modos
        </Button>
      </div>
    </div>
  );
}
