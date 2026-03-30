import { useEffect, useMemo, useRef, useState } from 'react';
import { adminApi, type AdminProviderAggregatePartSearchItem, type AdminProviderAggregateSearchSupplierItem, type AdminProviderItem } from '@/features/admin/api';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { repairsApi, type RepairProviderPartPricingPreviewResult } from './api';
import { buildRepairPricingInput } from './repair-pricing';
import {
  buildHydratedPart,
  buildProviderFilterOptions,
  isSmokeSupplierName,
  normalizeNullable,
  parseOptionalMoney,
  parsePositiveInteger,
  partKey,
  type RepairProviderPartPricingSectionProps,
} from './repair-provider-part-pricing-section.helpers';
import { RepairProviderPartPricingPreviewPanel } from './repair-provider-part-pricing-section.preview';
import {
  RepairProviderPartPricingSearchControls,
  RepairProviderPartPricingSearchResults,
  RepairProviderPartPricingSelectedPartSummary,
} from './repair-provider-part-pricing-section.search';
import { RepairProviderPartPricingSnapshotPanels } from './repair-provider-part-pricing-section.snapshot';

export function RepairProviderPartPricingSection({
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
  const providerRequestIdRef = useRef(0);
  const searchRequestIdRef = useRef(0);
  const previewRequestIdRef = useRef(0);
  const pendingSnapshotKeyRef = useRef('');
  const pendingSnapshotChangeRef = useRef(onPendingSnapshotDraftChange);

  const [providerReloadToken, setProviderReloadToken] = useState(0);
  const [providers, setProviders] = useState<AdminProviderItem[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState('');
  const [supplierFilterId, setSupplierFilterId] = useState('');
  const [partQueryInput, setPartQueryInput] = useState('');
  const [partSearchQuery, setPartSearchQuery] = useState('');
  const [partResults, setPartResults] = useState<AdminProviderAggregatePartSearchItem[]>([]);
  const [searchSuppliers, setSearchSuppliers] = useState<AdminProviderAggregateSearchSupplierItem[]>([]);
  const [selectedPartKey, setSelectedPartKey] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [previewResult, setPreviewResult] = useState<RepairProviderPartPricingPreviewResult | null>(null);
  const [previewResolvedKey, setPreviewResolvedKey] = useState('');
  const [previewTouched, setPreviewTouched] = useState(false);
  const [quantityInput, setQuantityInput] = useState('1');
  const [extraCostInput, setExtraCostInput] = useState('');
  const [shippingCostInput, setShippingCostInput] = useState('');

  useEffect(() => {
    pendingSnapshotChangeRef.current = onPendingSnapshotDraftChange;
  }, [onPendingSnapshotDraftChange]);

  useEffect(() => {
    const requestId = providerRequestIdRef.current + 1;
    providerRequestIdRef.current = requestId;
    let mounted = true;
    setProvidersLoading(true);
    setProvidersError('');

    async function loadProviders() {
      try {
        const response = await adminApi.providers({ active: '1' });
        if (!mounted || requestId !== providerRequestIdRef.current) return;
        setProviders(response.items.filter((item) => item.active && item.searchEnabled && Boolean(item.endpoint)));
      } catch (error) {
        if (!mounted || requestId !== providerRequestIdRef.current) return;
        setProvidersError(error instanceof Error ? error.message : 'No pudimos cargar los proveedores con búsqueda habilitada.');
      } finally {
        if (mounted && requestId === providerRequestIdRef.current) setProvidersLoading(false);
      }
    }

    void loadProviders();
    return () => {
      mounted = false;
    };
  }, [providerReloadToken]);

  useEffect(() => {
    pendingSnapshotKeyRef.current = '';
    setSearchError('');
    setPreviewError('');
    setPreviewResult(null);
    setPreviewResolvedKey('');
    setPreviewTouched(false);

    if (!activeSnapshot || activeSnapshot.source !== 'SUPPLIER_PART') {
      setSupplierFilterId('');
      setPartQueryInput('');
      setPartSearchQuery('');
      setPartResults([]);
      setSearchSuppliers([]);
      setSelectedPartKey('');
      setQuantityInput('1');
      setExtraCostInput('');
      setShippingCostInput('');
      pendingSnapshotChangeRef.current(null);
      return;
    }

    const hydratedPart = buildHydratedPart(activeSnapshot);
    setSupplierFilterId(activeSnapshot.supplierId ?? '');
    setPartQueryInput(activeSnapshot.supplierSearchQuery ?? activeSnapshot.partNameSnapshot);
    setPartSearchQuery(activeSnapshot.supplierSearchQuery ?? activeSnapshot.partNameSnapshot);
    setPartResults(hydratedPart ? [hydratedPart] : []);
    setSearchSuppliers(
      hydratedPart
        ? [
            {
              supplier: hydratedPart.supplier,
              status: 'ok',
              total: 1,
              error: null,
              url: activeSnapshot.partUrlSnapshot ?? '',
            },
          ]
        : [],
    );
    setSelectedPartKey(hydratedPart ? partKey(hydratedPart) : '');
    setQuantityInput(String(activeSnapshot.quantity || 1));
    setExtraCostInput(activeSnapshot.extraCost != null ? String(activeSnapshot.extraCost) : '');
    setShippingCostInput(activeSnapshot.shippingCost != null ? String(activeSnapshot.shippingCost) : '');
    pendingSnapshotChangeRef.current(null);
  }, [activeSnapshot, hydrateKey]);

  const providerFilterOptions = useMemo(
    () => buildProviderFilterOptions(providers, activeSnapshot),
    [activeSnapshot, providers],
  );

  const selectedProviderFilter = useMemo(() => {
    if (!supplierFilterId) return null;
    return (
      providers.find((item) => item.id === supplierFilterId) ?? {
        id: supplierFilterId,
        name: activeSnapshot?.supplierNameSnapshot || 'Proveedor histórico',
        endpoint: activeSnapshot?.supplierEndpointSnapshot ?? '',
      }
    );
  }, [activeSnapshot?.supplierEndpointSnapshot, activeSnapshot?.supplierNameSnapshot, providers, supplierFilterId]);

  const selectedProviderHint = selectedProviderFilter?.endpoint
    ? `Filtro puntual: ${selectedProviderFilter.name}`
    : 'Se consultarán todos los proveedores activos con búsqueda configurada.';

  const selectedPart = useMemo(
    () => partResults.find((item) => partKey(item) === selectedPartKey) ?? null,
    [partResults, selectedPartKey],
  );
  const technicalPricingInput = useMemo(() => buildRepairPricingInput(technicalContext), [technicalContext]);
  const parsedQuantity = useMemo(() => parsePositiveInteger(quantityInput), [quantityInput]);
  const parsedExtraCost = useMemo(() => parseOptionalMoney(extraCostInput, 'extra'), [extraCostInput]);
  const parsedShippingCost = useMemo(() => parseOptionalMoney(shippingCostInput, 'envío'), [shippingCostInput]);

  const previewInputState = useMemo(() => {
    if (!technicalPricingInput.canResolve) {
      return { canResolve: false, reason: technicalPricingInput.reason, key: '', input: null };
    }
    if (!selectedPart) {
      return { canResolve: false, reason: 'Busca una vez en proveedores y selecciona un repuesto antes de calcular.', key: '', input: null };
    }
    if (selectedPart.price == null) {
      return { canResolve: false, reason: 'La opción elegida no trae un precio utilizable.', key: '', input: null };
    }
    if (parsedQuantity.error) return { canResolve: false, reason: parsedQuantity.error, key: '', input: null };
    if (parsedExtraCost.error) return { canResolve: false, reason: parsedExtraCost.error, key: '', input: null };
    if (parsedShippingCost.error) return { canResolve: false, reason: parsedShippingCost.error, key: '', input: null };

    const input = {
      supplierId: selectedPart.supplier.id,
      supplierSearchQuery: normalizeNullable(partSearchQuery),
      quantity: parsedQuantity.value ?? 1,
      extraCost: parsedExtraCost.value ?? 0,
      shippingCost: parsedShippingCost.value ?? 0,
      deviceTypeId: technicalPricingInput.input.deviceTypeId ?? null,
      deviceBrandId: technicalPricingInput.input.deviceBrandId ?? null,
      deviceModelGroupId: technicalPricingInput.input.deviceModelGroupId ?? null,
      deviceModelId: technicalPricingInput.input.deviceModelId ?? null,
      deviceIssueTypeId: technicalPricingInput.input.deviceIssueTypeId ?? null,
      deviceBrand: technicalPricingInput.input.deviceBrand ?? null,
      deviceModel: technicalPricingInput.input.deviceModel ?? null,
      issueLabel: technicalPricingInput.input.issueLabel ?? null,
      part: {
        externalPartId: selectedPart.externalPartId ?? null,
        name: selectedPart.name,
        sku: selectedPart.sku ?? null,
        brand: selectedPart.brand ?? null,
        price: selectedPart.price,
        availability: selectedPart.availability ?? 'unknown',
        url: selectedPart.url ?? null,
      },
    };

    const key = JSON.stringify([
      technicalPricingInput.key,
      selectedPart.supplier.id,
      normalizeNullable(partSearchQuery) ?? '',
      partKey(selectedPart),
      input.quantity,
      input.extraCost ?? 0,
      input.shippingCost ?? 0,
    ]);

    return { canResolve: true, reason: '', key, input };
  }, [
    parsedExtraCost.error,
    parsedExtraCost.value,
    parsedQuantity.error,
    parsedQuantity.value,
    parsedShippingCost.error,
    parsedShippingCost.value,
    partSearchQuery,
    selectedPart,
    technicalPricingInput,
  ]);

  const previewResultIsCurrent = previewResolvedKey === previewInputState.key;
  const activePreviewResult = previewResultIsCurrent ? previewResult : null;
  const activePreviewError = previewResultIsCurrent ? previewError : '';
  const previewNeedsRefresh = previewTouched && !!previewResolvedKey && previewResolvedKey !== previewInputState.key;
  const previewSuggested = activePreviewResult?.matched ? activePreviewResult.calculation.suggestedQuotedPrice ?? null : null;
  const pendingSnapshotIsCurrent =
    Boolean(pendingSnapshotDraft) && !!pendingSnapshotKeyRef.current && pendingSnapshotKeyRef.current === previewInputState.key;

  const visiblePartResults = useMemo(
    () => partResults.filter((item) => !isSmokeSupplierName(item.supplier.name)),
    [partResults],
  );
  const visibleSearchSuppliers = useMemo(
    () => searchSuppliers.filter((item) => !isSmokeSupplierName(item.supplier.name)),
    [searchSuppliers],
  );
  const visibleSearchSummary = useMemo(
    () => ({
      searchedSuppliers: visibleSearchSuppliers.length,
      suppliersWithResults: visibleSearchSuppliers.filter((item) => item.status === 'ok' && item.total > 0).length,
      failedSuppliers: visibleSearchSuppliers.filter((item) => item.status === 'error').length,
      totalResults: visiblePartResults.length,
    }),
    [visiblePartResults.length, visibleSearchSuppliers],
  );
  const visibleFailedSupplierNames = useMemo(
    () => visibleSearchSuppliers.filter((item) => item.status === 'error').map((item) => item.supplier.name),
    [visibleSearchSuppliers],
  );
  const hiddenSmokeSupplierCount = useMemo(
    () => searchSuppliers.filter((item) => isSmokeSupplierName(item.supplier.name)).length,
    [searchSuppliers],
  );
  const hiddenSmokeFailureCount = useMemo(
    () => searchSuppliers.filter((item) => item.status === 'error' && isSmokeSupplierName(item.supplier.name)).length,
    [searchSuppliers],
  );
  const hasTechnicalSearchDetails = visibleFailedSupplierNames.length > 0 || hiddenSmokeSupplierCount > 0;

  useEffect(() => {
    if (!pendingSnapshotDraft) {
      pendingSnapshotKeyRef.current = '';
      return;
    }
    if (!previewInputState.key || pendingSnapshotKeyRef.current === previewInputState.key) return;
    onPendingSnapshotDraftChange(null);
    pendingSnapshotKeyRef.current = '';
  }, [pendingSnapshotDraft, previewInputState.key, onPendingSnapshotDraftChange]);

  const statusBadge = useMemo(() => {
    if (pendingSnapshotIsCurrent) return { label: 'Snapshot listo', tone: 'success' as const };
    if (previewLoading || searchLoading || providersLoading) return { label: 'Cargando', tone: 'info' as const };
    if (providersError || searchError || activePreviewError) return { label: 'Error', tone: 'danger' as const };
    if (previewNeedsRefresh) return { label: 'Recalcular', tone: 'warning' as const };
    if (activePreviewResult?.matched && activePreviewResult.snapshotDraft) return { label: 'Preview listo', tone: 'success' as const };
    if (activePreviewResult && !activePreviewResult.matched) return { label: 'Sin regla', tone: 'warning' as const };
    return { label: activeSnapshot ? 'Snapshot activo' : 'Opcional', tone: 'neutral' as const };
  }, [
    activePreviewError,
    activePreviewResult,
    activeSnapshot,
    pendingSnapshotIsCurrent,
    previewLoading,
    previewNeedsRefresh,
    providersError,
    providersLoading,
    searchError,
    searchLoading,
  ]);

  function clearPreviewAndPending() {
    setPreviewResult(null);
    setPreviewResolvedKey('');
    setPreviewTouched(false);
    onPendingSnapshotDraftChange(null);
    pendingSnapshotKeyRef.current = '';
  }

  function clearSearchResults() {
    setPartResults([]);
    setSearchSuppliers([]);
    setSelectedPartKey('');
  }

  function handleSupplierFilterChange(next: string) {
    setSupplierFilterId(next);
    clearSearchResults();
    clearPreviewAndPending();
    setSearchError('');
  }

  function handleSelectPart(nextKey: string) {
    setSelectedPartKey(nextKey);
    clearPreviewAndPending();
  }

  async function searchParts() {
    if (searchLoading || disabled) return;
    const query = partQueryInput.trim();
    if (query.length < 2) {
      setSearchError('Ingresá al menos 2 caracteres para buscar repuestos.');
      return;
    }

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;
    setSearchLoading(true);
    setSearchError('');
    setPartSearchQuery(query);
    clearPreviewAndPending();

    try {
      const response = await adminApi.searchPartsAcrossProviders({
        q: query,
        supplierId: normalizeNullable(supplierFilterId),
        limitPerSupplier: 6,
        totalLimit: 24,
      });
      if (requestId !== searchRequestIdRef.current) return;
      setSearchSuppliers(response.suppliers);
      setPartResults(response.items);
      setSelectedPartKey((current) =>
        current && response.items.some((item) => partKey(item) === current) ? current : '',
      );
    } catch (error) {
      if (requestId !== searchRequestIdRef.current) return;
      setSearchSuppliers([]);
      setPartResults([]);
      setSelectedPartKey('');
      setSearchError(error instanceof Error ? error.message : 'No pudimos buscar repuestos en los proveedores configurados.');
    } finally {
      if (requestId === searchRequestIdRef.current) setSearchLoading(false);
    }
  }

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
      onStatusMessage?.('Se copió el sugerido y se preparó el snapshot para guardar.');
    } else {
      onStatusMessage?.(
        mode === 'create'
          ? 'Snapshot listo para guardarse al crear la reparación.'
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

  return (
    <SectionCard
      title="Proveedor y repuesto"
      description="Buscá una vez en todos los proveedores activos, elegí la mejor opción y calculá el presupuesto con costo real antes de aplicarlo al caso."
      actions={<StatusBadge label={statusBadge.label} tone={statusBadge.tone} size="sm" />}
    >
      <div data-admin-repair-provider-part>
        <RepairProviderPartPricingSnapshotPanels
          mode={mode}
          activeSnapshot={activeSnapshot}
          quotedPriceValue={quotedPriceValue}
          snapshotHistory={snapshotHistory}
        />

        <RepairProviderPartPricingSearchControls
          compactMode={compactMode}
          disabled={disabled}
          providersLoading={providersLoading}
          providersError={providersError}
          selectedProviderHint={selectedProviderHint}
          providerFilterOptions={providerFilterOptions}
          supplierFilterId={supplierFilterId}
          partQueryInput={partQueryInput}
          quantityInput={quantityInput}
          extraCostInput={extraCostInput}
          shippingCostInput={shippingCostInput}
          quantityHint={parsedQuantity.error || 'Cantidad de repuestos a considerar.'}
          extraCostHint={parsedExtraCost.error || 'Costo adicional manual si aplica.'}
          shippingCostHint={parsedShippingCost.error || 'Envío real del proveedor si corresponde.'}
          searchLoading={searchLoading}
          onProviderReload={() => setProviderReloadToken((value) => value + 1)}
          onSupplierFilterChange={handleSupplierFilterChange}
          onPartQueryChange={setPartQueryInput}
          onQuantityChange={setQuantityInput}
          onExtraCostChange={setExtraCostInput}
          onShippingCostChange={setShippingCostInput}
          onSearch={() => void searchParts()}
        />

        <RepairProviderPartPricingSearchResults
          searchLoading={searchLoading}
          searchError={searchError}
          partSearchQuery={partSearchQuery}
          visiblePartResults={visiblePartResults}
          visibleSearchSummary={visibleSearchSummary}
          visibleFailedSupplierNames={visibleFailedSupplierNames}
          hiddenSmokeSupplierCount={hiddenSmokeSupplierCount}
          hiddenSmokeFailureCount={hiddenSmokeFailureCount}
          hasTechnicalSearchDetails={hasTechnicalSearchDetails}
          selectedPartKey={selectedPartKey}
          disabled={disabled}
          onSelectPart={handleSelectPart}
        />

        <RepairProviderPartPricingSelectedPartSummary selectedPart={selectedPart} />

        <RepairProviderPartPricingPreviewPanel
          compactMode={compactMode}
          mode={mode}
          disabled={disabled}
          previewInputState={{ canResolve: previewInputState.canResolve, reason: previewInputState.reason }}
          previewLoading={previewLoading}
          activePreviewError={activePreviewError}
          previewNeedsRefresh={previewNeedsRefresh}
          activePreviewResult={activePreviewResult}
          previewSuggested={previewSuggested}
          quotedPriceValue={quotedPriceValue}
          pendingSnapshotIsCurrent={pendingSnapshotIsCurrent}
          onCalculatePreview={() => void calculatePreview()}
          onApplySuggestedPrice={applySuggestedPrice}
          onApplySnapshotDraft={applySnapshotDraft}
          onClearPendingSnapshot={clearPendingSnapshot}
        />
      </div>
    </SectionCard>
  );
}
