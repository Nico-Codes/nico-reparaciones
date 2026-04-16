import { useEffect, useMemo, useRef, useState } from 'react';
import {
  adminApi,
  type AdminProviderAggregatePartSearchItem,
  type AdminProviderItem,
} from '@/features/admin/api';
import type { RepairPricingSnapshotItem } from './types';
import {
  buildHydratedPart,
  buildProviderFilterOptions,
  buildVisibleProviderSearchState,
  normalizeNullable,
  parseOptionalMoney,
  parsePositiveInteger,
  partKey,
  resolveSelectedProviderFilter,
} from './repair-provider-part-pricing-section.helpers';

type UseRepairProviderPartSearchArgs = {
  activeSnapshot: RepairPricingSnapshotItem | null;
  hydrateKey: string;
  disabled: boolean;
  onResetPreviewAndPending: () => void;
};

export function useRepairProviderPartSearch({
  activeSnapshot,
  hydrateKey,
  disabled,
  onResetPreviewAndPending,
}: UseRepairProviderPartSearchArgs) {
  const providerRequestIdRef = useRef(0);
  const searchRequestIdRef = useRef(0);
  const resetPreviewAndPendingRef = useRef(onResetPreviewAndPending);

  const [providerReloadToken, setProviderReloadToken] = useState(0);
  const [providers, setProviders] = useState<AdminProviderItem[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState('');
  const [supplierFilterId, setSupplierFilterId] = useState('');
  const [partQueryInput, setPartQueryInput] = useState('');
  const [partSearchQuery, setPartSearchQuery] = useState('');
  const [partResults, setPartResults] = useState<AdminProviderAggregatePartSearchItem[]>([]);
  const [selectedPartKey, setSelectedPartKey] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchError, setSearchError] = useState('');
  const [quantityInput, setQuantityInput] = useState('1');
  const [extraCostInput, setExtraCostInput] = useState('');
  const [shippingCostInput, setShippingCostInput] = useState('');

  useEffect(() => {
    resetPreviewAndPendingRef.current = onResetPreviewAndPending;
  }, [onResetPreviewAndPending]);

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
        setProviders(
          response.items.filter(
            (item) => item.active && item.searchEnabled && item.searchInRepairs && Boolean(item.endpoint),
          ),
        );
      } catch (error) {
        if (!mounted || requestId !== providerRequestIdRef.current) return;
        setProvidersError(error instanceof Error ? error.message : 'No pudimos cargar los proveedores con busqueda habilitada.');
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
    if (!searchLoading) return;

    const timer = window.setInterval(() => {
      setSearchProgress((current) => {
        if (current >= 92) return current;
        const next = current + (current < 35 ? 14 : current < 70 ? 9 : 4);
        return Math.min(next, 92);
      });
    }, 220);

    return () => window.clearInterval(timer);
  }, [searchLoading]);

  useEffect(() => {
    setSearchError('');
    resetPreviewAndPendingRef.current();

    if (!activeSnapshot || activeSnapshot.source !== 'SUPPLIER_PART') {
      setSupplierFilterId('');
      setPartQueryInput('');
      setPartSearchQuery('');
      setPartResults([]);
      setSelectedPartKey('');
      setQuantityInput('1');
      setExtraCostInput('');
      setShippingCostInput('');
      return;
    }

    const hydratedPart = buildHydratedPart(activeSnapshot);
    setSupplierFilterId(activeSnapshot.supplierId ?? '');
    setPartQueryInput(activeSnapshot.supplierSearchQuery ?? activeSnapshot.partNameSnapshot);
    setPartSearchQuery(activeSnapshot.supplierSearchQuery ?? activeSnapshot.partNameSnapshot);
    setPartResults(hydratedPart ? [hydratedPart] : []);
    setSelectedPartKey(hydratedPart ? partKey(hydratedPart) : '');
    setQuantityInput(String(activeSnapshot.quantity || 1));
    setExtraCostInput(activeSnapshot.extraCost != null ? String(activeSnapshot.extraCost) : '');
    setShippingCostInput(activeSnapshot.shippingCost != null ? String(activeSnapshot.shippingCost) : '');
  }, [activeSnapshot, hydrateKey]);

  const providerFilterOptions = useMemo(
    () => buildProviderFilterOptions(providers, activeSnapshot),
    [activeSnapshot, providers],
  );

  const selectedProviderFilter = useMemo(
    () => resolveSelectedProviderFilter(providers, supplierFilterId, activeSnapshot),
    [activeSnapshot, providers, supplierFilterId],
  );

  const selectedProviderHint = selectedProviderFilter?.endpoint
    ? `Filtro puntual: ${selectedProviderFilter.name}`
    : 'Se consultaran todos los proveedores reales activos con busqueda configurada.';

  const selectedPart = useMemo(
    () => partResults.find((item) => partKey(item) === selectedPartKey) ?? null,
    [partResults, selectedPartKey],
  );

  const parsedQuantity = useMemo(() => parsePositiveInteger(quantityInput), [quantityInput]);
  const parsedExtraCost = useMemo(() => parseOptionalMoney(extraCostInput, 'extra'), [extraCostInput]);
  const parsedShippingCost = useMemo(() => parseOptionalMoney(shippingCostInput, 'envio'), [shippingCostInput]);
  const visibleSearchState = useMemo(
    () => buildVisibleProviderSearchState(partResults),
    [partResults],
  );

  function clearSearchResults() {
    setPartResults([]);
    setSelectedPartKey('');
  }

  function handleSupplierFilterChange(next: string) {
    setSupplierFilterId(next);
    clearSearchResults();
    resetPreviewAndPendingRef.current();
    setSearchError('');
  }

  function handleSelectPart(nextKey: string) {
    setSelectedPartKey(nextKey);
    resetPreviewAndPendingRef.current();
  }

  async function searchParts() {
    if (searchLoading || disabled) return;
    const query = partQueryInput.trim();
    if (query.length < 2) {
      setSearchError('Ingresa al menos 2 caracteres para buscar repuestos.');
      return;
    }

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;
    setSearchLoading(true);
    setSearchProgress(12);
    setSearchError('');
    setPartSearchQuery(query);
    resetPreviewAndPendingRef.current();

    try {
      const response = await adminApi.searchPartsAcrossProviders({
        q: query,
        supplierId: normalizeNullable(supplierFilterId),
        limitPerSupplier: 6,
        totalLimit: 24,
      });
      if (requestId !== searchRequestIdRef.current) return;
      setPartResults(response.items);
      setSelectedPartKey((current) =>
        current && response.items.some((item) => partKey(item) === current && item.availability !== 'out_of_stock')
          ? current
          : '',
      );
    } catch (error) {
      if (requestId !== searchRequestIdRef.current) return;
      setPartResults([]);
      setSelectedPartKey('');
      setSearchError(error instanceof Error ? error.message : 'No pudimos buscar repuestos en los proveedores configurados.');
    } finally {
      if (requestId === searchRequestIdRef.current) {
        setSearchProgress(100);
        setSearchLoading(false);
      }
    }
  }

  return {
    providersLoading,
    providersError,
    selectedProviderHint,
    providerFilterOptions,
    supplierFilterId,
    partQueryInput,
    quantityInput,
    extraCostInput,
    shippingCostInput,
    searchLoading,
    searchProgress,
    searchError,
    partSearchQuery,
    selectedPart,
    parsedQuantity,
    parsedExtraCost,
    parsedShippingCost,
    selectedPartKey,
    reloadProviders: () => setProviderReloadToken((value) => value + 1),
    handleSupplierFilterChange,
    setPartQueryInput,
    setQuantityInput,
    setExtraCostInput,
    setShippingCostInput,
    searchParts,
    handleSelectPart,
    ...visibleSearchState,
  };
}
