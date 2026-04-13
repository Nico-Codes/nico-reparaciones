import { useMemo, useRef, useState } from 'react';
import { repairsApi, type RepairPricingResolveResult } from './api';
import { formatSuggestedPriceInput } from './repair-pricing';
import type { AdminRepairCreateFormErrors } from './admin-repair-create.helpers';

type PricingInputState = {
  canResolve: boolean;
  reason: string;
  key: string;
  input: Parameters<typeof repairsApi.pricingResolve>[0];
};

export function useAdminRepairCreatePricing({
  pricingInput,
  quotedPriceValue,
  submitting,
  setQuotedPrice,
  setFieldErrors,
}: {
  pricingInput: PricingInputState;
  quotedPriceValue: number | null;
  submitting: boolean;
  setQuotedPrice: (value: string) => void;
  setFieldErrors: React.Dispatch<React.SetStateAction<AdminRepairCreateFormErrors>>;
}) {
  const pricingRequestId = useRef(0);

  const [pricingError, setPricingError] = useState('');
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingResult, setPricingResult] = useState<RepairPricingResolveResult | null>(null);
  const [pricingResolvedKey, setPricingResolvedKey] = useState('');
  const [pricingTouched, setPricingTouched] = useState(false);

  const pricingResultIsCurrent = pricingResolvedKey === pricingInput.key;
  const activePricingResult = pricingResultIsCurrent ? pricingResult : null;
  const activePricingError = pricingResultIsCurrent ? pricingError : '';
  const pricingNeedsRefresh = pricingTouched && !!pricingResolvedKey && pricingResolvedKey !== pricingInput.key;
  const suggestedTotal = activePricingResult?.matched ? activePricingResult.suggestion?.suggestedTotal ?? null : null;
  const canUseSuggested = suggestedTotal != null && suggestedTotal !== quotedPriceValue;

  const pricingBadge = useMemo(() => {
    if (!pricingInput.canResolve) return { label: 'Datos insuficientes', tone: 'neutral' as const };
    if (pricingLoading) return { label: 'Calculando', tone: 'info' as const };
    if (activePricingError) return { label: 'Error', tone: 'danger' as const };
    if (pricingNeedsRefresh) return { label: 'Recalcular', tone: 'warning' as const };
    if (activePricingResult?.matched && activePricingResult.suggestion) return { label: 'Sugerencia lista', tone: 'success' as const };
    if (activePricingResult && !activePricingResult.matched) return { label: 'Sin regla', tone: 'warning' as const };
    return { label: 'Pendiente', tone: 'neutral' as const };
  }, [activePricingError, activePricingResult, pricingInput.canResolve, pricingLoading, pricingNeedsRefresh]);

  async function recalculateSuggestedPrice() {
    if (!pricingInput.canResolve || pricingLoading || submitting) return;

    const requestId = pricingRequestId.current + 1;
    pricingRequestId.current = requestId;
    setPricingTouched(true);
    setPricingLoading(true);
    setPricingError('');

    try {
      const response = await repairsApi.pricingResolve(pricingInput.input);
      if (requestId !== pricingRequestId.current) return;
      setPricingResult(response);
      setPricingResolvedKey(pricingInput.key);
    } catch (error) {
      if (requestId !== pricingRequestId.current) return;
      setPricingResult(null);
      setPricingResolvedKey(pricingInput.key);
      setPricingError(error instanceof Error ? error.message : 'No pudimos calcular una sugerencia automatica.');
    } finally {
      if (requestId === pricingRequestId.current) setPricingLoading(false);
    }
  }

  function useSuggestedPrice() {
    if (suggestedTotal == null) return;
    setQuotedPrice(formatSuggestedPriceInput(suggestedTotal));
    setFieldErrors((current) => ({ ...current, quotedPrice: undefined }));
  }

  return {
    pricingLoading,
    activePricingError,
    activePricingResult,
    pricingNeedsRefresh,
    canUseSuggested,
    pricingBadge,
    recalculateSuggestedPrice,
    useSuggestedPrice,
  };
}
