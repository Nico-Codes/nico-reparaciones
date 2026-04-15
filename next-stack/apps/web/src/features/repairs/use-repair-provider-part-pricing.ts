import { useEffect, useMemo, useRef, useState } from 'react';
import { repairsApi, type RepairProviderPartPricingPreviewResult } from './api';
import {
  buildProviderPricingStatusBadge,
  normalizeNullable,
  partKey,
  type RepairProviderPartPricingSectionProps,
} from './repair-provider-part-pricing-section.helpers';
import { buildRepairPricingInput } from './repair-pricing';
import { useRepairProviderPartSearch } from './use-repair-provider-part-search';

export function useRepairProviderPartPricing({
  mode,
  compactMode = false,
  technicalContext,
  quotedPriceValue,
  disabled = false,
  activeSnapshot = null,
  snapshotHistory = [],
  pendingSnapshotDraft,
  onPendingSnapshotDraftChange,
  onUseSuggestedPrice,
  onStatusMessage,
  hydrateKey,
}: RepairProviderPartPricingSectionProps) {
  const previewRequestIdRef = useRef(0);
  const pendingSnapshotKeyRef = useRef('');

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [previewResult, setPreviewResult] = useState<RepairProviderPartPricingPreviewResult | null>(null);
  const [previewResolvedKey, setPreviewResolvedKey] = useState('');
  const [previewTouched, setPreviewTouched] = useState(false);

  function clearPreviewAndPending() {
    setPreviewResult(null);
    setPreviewResolvedKey('');
    setPreviewTouched(false);
    setPreviewError('');
    onPendingSnapshotDraftChange(null);
    pendingSnapshotKeyRef.current = '';
  }

  const search = useRepairProviderPartSearch({
    activeSnapshot,
    hydrateKey,
    disabled,
    onResetPreviewAndPending: clearPreviewAndPending,
  });

  const technicalPricingInput = useMemo(() => buildRepairPricingInput(technicalContext), [technicalContext]);

  const previewInputState = useMemo(() => {
    if (!technicalPricingInput.canResolve) {
      return { canResolve: false, reason: technicalPricingInput.reason, key: '', input: null };
    }
    if (!search.selectedPart) {
      return { canResolve: false, reason: 'Busca una vez en proveedores y selecciona un repuesto antes de calcular.', key: '', input: null };
    }
    if (search.selectedPart.price == null) {
      return { canResolve: false, reason: 'La opcion elegida no trae un precio utilizable.', key: '', input: null };
    }
    if (search.parsedQuantity.error) return { canResolve: false, reason: search.parsedQuantity.error, key: '', input: null };
    if (search.parsedExtraCost.error) return { canResolve: false, reason: search.parsedExtraCost.error, key: '', input: null };
    if (search.parsedShippingCost.error) return { canResolve: false, reason: search.parsedShippingCost.error, key: '', input: null };

    const input = {
      supplierId: search.selectedPart.supplier.id,
      supplierSearchQuery: normalizeNullable(search.partSearchQuery),
      quantity: search.parsedQuantity.value ?? 1,
      extraCost: search.parsedExtraCost.value ?? 0,
      shippingCost: search.parsedShippingCost.value ?? 0,
      deviceTypeId: technicalPricingInput.input.deviceTypeId ?? null,
      deviceBrandId: technicalPricingInput.input.deviceBrandId ?? null,
      deviceModelGroupId: technicalPricingInput.input.deviceModelGroupId ?? null,
      deviceModelId: technicalPricingInput.input.deviceModelId ?? null,
      deviceIssueTypeId: technicalPricingInput.input.deviceIssueTypeId ?? null,
      deviceBrand: technicalPricingInput.input.deviceBrand ?? null,
      deviceModel: technicalPricingInput.input.deviceModel ?? null,
      issueLabel: technicalPricingInput.input.issueLabel ?? null,
      part: {
        externalPartId: search.selectedPart.externalPartId ?? null,
        name: search.selectedPart.name,
        sku: search.selectedPart.sku ?? null,
        brand: search.selectedPart.brand ?? null,
        price: search.selectedPart.price,
        availability: search.selectedPart.availability ?? 'unknown',
        url: search.selectedPart.url ?? null,
      },
    };

    const key = JSON.stringify([
      technicalPricingInput.key,
      search.selectedPart.supplier.id,
      normalizeNullable(search.partSearchQuery) ?? '',
      partKey(search.selectedPart),
      input.quantity,
      input.extraCost ?? 0,
      input.shippingCost ?? 0,
    ]);

    return { canResolve: true, reason: '', key, input };
  }, [
    search.parsedExtraCost.error,
    search.parsedExtraCost.value,
    search.parsedQuantity.error,
    search.parsedQuantity.value,
    search.parsedShippingCost.error,
    search.parsedShippingCost.value,
    search.partSearchQuery,
    search.selectedPart,
    technicalPricingInput,
  ]);

  const previewResultIsCurrent = previewResolvedKey === previewInputState.key;
  const activePreviewResult = previewResultIsCurrent ? previewResult : null;
  const activePreviewError = previewResultIsCurrent ? previewError : '';
  const previewNeedsRefresh = previewTouched && !!previewResolvedKey && previewResolvedKey !== previewInputState.key;
  const previewSuggested = activePreviewResult?.matched ? activePreviewResult.calculation.suggestedQuotedPrice ?? null : null;
  const pendingSnapshotIsCurrent =
    Boolean(pendingSnapshotDraft) && !!pendingSnapshotKeyRef.current && pendingSnapshotKeyRef.current === previewInputState.key;

  useEffect(() => {
    if (!pendingSnapshotDraft) {
      pendingSnapshotKeyRef.current = '';
      return;
    }
    if (!previewInputState.key || pendingSnapshotKeyRef.current === previewInputState.key) return;
    onPendingSnapshotDraftChange(null);
    pendingSnapshotKeyRef.current = '';
  }, [pendingSnapshotDraft, previewInputState.key, onPendingSnapshotDraftChange]);

  const statusBadge = useMemo(
    () =>
      buildProviderPricingStatusBadge({
        pendingSnapshotIsCurrent,
        previewLoading,
        searchLoading: search.searchLoading,
        providersLoading: search.providersLoading,
        providersError: search.providersError,
        searchError: search.searchError,
        activePreviewError,
        previewNeedsRefresh,
        activePreviewResult,
        activeSnapshot,
      }),
    [
      activePreviewError,
      activePreviewResult,
      activeSnapshot,
      pendingSnapshotIsCurrent,
      previewLoading,
      previewNeedsRefresh,
      search.providersError,
      search.providersLoading,
      search.searchError,
      search.searchLoading,
    ],
  );

  async function calculatePreview() {
    if (!previewInputState.canResolve || !previewInputState.input || previewLoading || disabled) return;
    const requestId = previewRequestIdRef.current + 1;
    previewRequestIdRef.current = requestId;
    setPreviewTouched(true);
    setPreviewLoading(true);
    setPreviewError('');
    onPendingSnapshotDraftChange(null);
    pendingSnapshotKeyRef.current = '';

    try {
      const response = await repairsApi.pricingProviderPartPreview(previewInputState.input);
      if (requestId !== previewRequestIdRef.current) return;
      setPreviewResult(response);
      setPreviewResolvedKey(previewInputState.key);
    } catch (error) {
      if (requestId !== previewRequestIdRef.current) return;
      setPreviewResult(null);
      setPreviewResolvedKey(previewInputState.key);
      setPreviewError(error instanceof Error ? error.message : 'No pudimos calcular el presupuesto con proveedor y repuesto.');
    } finally {
      if (requestId === previewRequestIdRef.current) setPreviewLoading(false);
    }
  }

  function applySuggestedPrice() {
    if (previewSuggested == null) return;
    onUseSuggestedPrice(previewSuggested);
  }

  function applySnapshotDraft() {
    if (!activePreviewResult?.matched || !activePreviewResult.snapshotDraft) return;
    if (quotedPriceValue == null && previewSuggested != null) {
      onUseSuggestedPrice(previewSuggested);
      onStatusMessage?.('Se copio el sugerido y se preparo el snapshot para guardar.');
    } else {
      onStatusMessage?.(
        mode === 'create'
          ? 'Snapshot listo para guardarse al crear la reparacion.'
          : 'Snapshot listo para guardarse con los cambios del caso.',
      );
    }
    onPendingSnapshotDraftChange(activePreviewResult.snapshotDraft);
    pendingSnapshotKeyRef.current = previewInputState.key;
  }

  function clearPendingSnapshot() {
    onPendingSnapshotDraftChange(null);
    pendingSnapshotKeyRef.current = '';
  }

  return {
    statusBadge,
    selectedPart: search.selectedPart,
    snapshotPanelsProps: {
      mode,
      activeSnapshot,
      quotedPriceValue,
      snapshotHistory,
    },
    searchControlsProps: {
      compactMode,
      disabled,
      providersLoading: search.providersLoading,
      providersError: search.providersError,
      selectedProviderHint: search.selectedProviderHint,
      providerFilterOptions: search.providerFilterOptions,
      supplierFilterId: search.supplierFilterId,
      partQueryInput: search.partQueryInput,
      quantityInput: search.quantityInput,
      extraCostInput: search.extraCostInput,
      shippingCostInput: search.shippingCostInput,
      quantityHint: search.parsedQuantity.error || 'Cantidad de repuestos a considerar.',
      extraCostHint: search.parsedExtraCost.error || 'Costo adicional manual si aplica.',
      shippingCostHint: search.parsedShippingCost.error || 'Envio real del proveedor si corresponde.',
      searchLoading: search.searchLoading,
      onProviderReload: search.reloadProviders,
      onSupplierFilterChange: search.handleSupplierFilterChange,
      onPartQueryChange: search.setPartQueryInput,
      onQuantityChange: search.setQuantityInput,
      onExtraCostChange: search.setExtraCostInput,
      onShippingCostChange: search.setShippingCostInput,
      onSearch: () => void search.searchParts(),
    },
    searchResultsProps: {
      searchLoading: search.searchLoading,
      searchError: search.searchError,
      partSearchQuery: search.partSearchQuery,
      visiblePartResults: search.visiblePartResults,
      visibleSearchSuppliers: search.visibleSearchSuppliers,
      visibleSearchSummary: search.visibleSearchSummary,
      visibleFailedSupplierNames: search.visibleFailedSupplierNames,
      hiddenSmokeSupplierCount: search.hiddenSmokeSupplierCount,
      hiddenSmokeFailureCount: search.hiddenSmokeFailureCount,
      hasTechnicalSearchDetails: search.hasTechnicalSearchDetails,
      selectedPartKey: search.selectedPartKey,
      disabled,
      onSelectPart: search.handleSelectPart,
    },
    previewPanelProps: {
      compactMode,
      mode,
      disabled,
      previewInputState: { canResolve: previewInputState.canResolve, reason: previewInputState.reason },
      previewLoading,
      activePreviewError,
      previewNeedsRefresh,
      activePreviewResult,
      previewSuggested,
      quotedPriceValue,
      pendingSnapshotIsCurrent,
      onCalculatePreview: () => void calculatePreview(),
      onApplySuggestedPrice: applySuggestedPrice,
      onApplySnapshotDraft: applySnapshotDraft,
      onClearPendingSnapshot: clearPendingSnapshot,
    },
  };
}
