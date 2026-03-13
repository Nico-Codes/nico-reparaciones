import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Calculator, PackageSearch, RefreshCcw, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import {
  adminApi,
  type AdminProviderAggregatePartSearchItem,
  type AdminProviderAggregatePartSearchResult,
  type AdminProviderAggregateSearchSupplierItem,
  type AdminProviderItem,
} from '@/features/admin/api';
import {
  repairsApi,
  type RepairPricingSnapshotDraft,
  type RepairProviderPartPricingPreviewResult,
} from './api';
import { buildRepairPricingInput } from './repair-pricing';
import { money } from './repair-ui';
import type { RepairPricingSnapshotItem } from './types';

type TechnicalContext = {
  deviceTypeId?: string | null;
  deviceBrandId?: string | null;
  deviceModelGroupId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  issueLabel?: string | null;
};

type Props = {
  mode: 'create' | 'detail';
  compactMode?: boolean;
  technicalContext: TechnicalContext;
  quotedPriceValue: number | null;
  disabled?: boolean;
  activeSnapshot?: RepairPricingSnapshotItem | null;
  snapshotHistory?: RepairPricingSnapshotItem[];
  pendingSnapshotDraft: RepairPricingSnapshotDraft | null;
  onPendingSnapshotDraftChange: (draft: RepairPricingSnapshotDraft | null) => void;
  onUseSuggestedPrice: (value: number) => void;
  onStatusMessage?: (message: string) => void;
  hydrateKey: string;
};

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function parsePositiveInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { value: 1, error: '' };
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 999) {
    return { value: null, error: 'Ingresá una cantidad válida entre 1 y 999.' };
  }
  return { value: parsed, error: '' };
}

function parseOptionalMoney(value: string, label: string) {
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) return { value: 0, error: '' };
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, error: `Ingresá un ${label.toLowerCase()} válido mayor o igual a 0.` };
  }
  return { value: parsed, error: '' };
}

function partKey(
  part: Pick<AdminProviderAggregatePartSearchItem, 'externalPartId' | 'sku' | 'url' | 'name' | 'supplier'>,
) {
  return [part.supplier.id, part.externalPartId ?? '', part.sku ?? '', part.url ?? '', part.name.trim().toLowerCase()].join('::');
}

function buildHydratedPart(snapshot: RepairPricingSnapshotItem): AdminProviderAggregatePartSearchItem | null {
  if (snapshot.source !== 'SUPPLIER_PART' || !snapshot.supplierId) return null;
  return {
    externalPartId: snapshot.externalPartId ?? snapshot.id,
    name: snapshot.partNameSnapshot,
    sku: snapshot.partSkuSnapshot,
    brand: snapshot.partBrandSnapshot,
    price: snapshot.baseCost,
    availability: (snapshot.partAvailabilitySnapshot as 'in_stock' | 'out_of_stock' | 'unknown' | null) ?? 'unknown',
    url: snapshot.partUrlSnapshot,
    rawLabel: snapshot.partNameSnapshot,
    supplier: {
      id: snapshot.supplierId,
      name: snapshot.supplierNameSnapshot || 'Proveedor sin nombre',
      priority: 0,
      endpoint: snapshot.supplierEndpointSnapshot ?? null,
      mode: 'html',
    },
  };
}

function availabilityLabel(value: 'in_stock' | 'out_of_stock' | 'unknown' | null | undefined) {
  if (value === 'in_stock') return 'Disponible';
  if (value === 'out_of_stock') return 'Sin stock';
  return 'Disponibilidad no informada';
}

function availabilityTone(value: 'in_stock' | 'out_of_stock' | 'unknown' | null | undefined) {
  if (value === 'in_stock') return 'success' as const;
  if (value === 'out_of_stock') return 'danger' as const;
  return 'neutral' as const;
}

function isSmokeSupplierName(name: string | null | undefined) {
  return (name ?? '').trim().toLowerCase().startsWith('smoke supplier');
}

function previewModeLabel(result: RepairProviderPartPricingPreviewResult | null) {
  return result?.calculation.calcMode === 'FIXED_TOTAL' ? 'Total fijo' : 'Base + margen';
}

function snapshotStatusLabel(snapshot: RepairPricingSnapshotItem, activeSnapshotId?: string | null) {
  if (activeSnapshotId && snapshot.id === activeSnapshotId) return 'Activo';
  if (snapshot.status === 'SUPERSEDED') return 'Reemplazado';
  if (snapshot.status === 'DISCARDED') return 'Descartado';
  if (snapshot.status === 'DRAFT') return 'Borrador';
  return 'Aplicado';
}

function snapshotStatusTone(snapshot: RepairPricingSnapshotItem, activeSnapshotId?: string | null) {
  if (activeSnapshotId && snapshot.id === activeSnapshotId) return 'success' as const;
  if (snapshot.status === 'SUPERSEDED') return 'warning' as const;
  if (snapshot.status === 'DISCARDED') return 'danger' as const;
  if (snapshot.status === 'DRAFT') return 'neutral' as const;
  return 'info' as const;
}

function snapshotValueOrigin(snapshot: RepairPricingSnapshotItem, currentQuotedPrice: number | null) {
  if (snapshot.manualOverridePrice != null) {
    return {
      title: 'Snapshot aplicado con override manual',
      description: 'El operador aplicó el cálculo, pero guardó un presupuesto distinto al sugerido dentro del mismo snapshot.',
      tone: 'warning' as const,
    };
  }
  if (currentQuotedPrice != null && snapshot.appliedQuotedPrice != null && currentQuotedPrice !== snapshot.appliedQuotedPrice) {
    return {
      title: 'El presupuesto actual ya no coincide con el snapshot activo',
      description: 'El valor del caso fue modificado manualmente después de aplicar este cálculo.',
      tone: 'warning' as const,
    };
  }
  return {
    title: 'Precio aplicado según cálculo',
    description: 'El presupuesto actual coincide con el snapshot activo y no registra override manual.',
    tone: 'success' as const,
  };
}

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
}: Props) {
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
  const [searchSummary, setSearchSummary] = useState<AdminProviderAggregatePartSearchResult['summary'] | null>(null);
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
      setSearchSummary(null);
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
    setSearchSummary(
      hydratedPart
        ? {
            searchedSuppliers: 1,
            suppliersWithResults: 1,
            failedSuppliers: 0,
            totalResults: 1,
          }
        : null,
    );
    setSelectedPartKey(hydratedPart ? partKey(hydratedPart) : '');
    setQuantityInput(String(activeSnapshot.quantity || 1));
    setExtraCostInput(activeSnapshot.extraCost != null ? String(activeSnapshot.extraCost) : '');
    setShippingCostInput(activeSnapshot.shippingCost != null ? String(activeSnapshot.shippingCost) : '');
    pendingSnapshotChangeRef.current(null);
  }, [activeSnapshot, hydrateKey]);

  const providerFilterOptions = useMemo(() => {
    const base = providers.map((item) => ({ value: item.id, label: item.name }));
    const historicalMissing =
      activeSnapshot?.supplierId &&
      !base.some((item) => item.value === activeSnapshot.supplierId) &&
      activeSnapshot.supplierNameSnapshot
        ? [{ value: activeSnapshot.supplierId, label: `${activeSnapshot.supplierNameSnapshot} (histórico)` }]
        : [];
    return [{ value: '', label: 'Todos los proveedores activos' }, ...historicalMissing, ...base];
  }, [activeSnapshot?.supplierId, activeSnapshot?.supplierNameSnapshot, providers]);

  const selectedProviderFilter = useMemo(() => {
    if (!supplierFilterId) return null;
    return (
      providers.find((item) => item.id === supplierFilterId) ?? {
        id: supplierFilterId,
        name: activeSnapshot?.supplierNameSnapshot || 'Proveedor histórico',
        priority: 0,
        phone: '',
        products: 0,
        incidents: 0,
        warrantiesOk: 0,
        warrantiesExpired: 0,
        loss: 0,
        score: 0,
        confidenceLabel: '',
        active: true,
        searchEnabled: true,
        statusProbe: 'none' as const,
        lastProbeAt: '',
        lastQuery: '',
        lastResults: 0,
        mode: 'html',
        endpoint: activeSnapshot?.supplierEndpointSnapshot ?? '',
        configJson: '',
        notes: '',
      }
    );
  }, [activeSnapshot?.supplierEndpointSnapshot, activeSnapshot?.supplierNameSnapshot, providers, supplierFilterId]);
  const selectedPart = useMemo(() => partResults.find((item) => partKey(item) === selectedPartKey) ?? null, [partResults, selectedPartKey]);
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
  const activeSnapshotOrigin = activeSnapshot ? snapshotValueOrigin(activeSnapshot, quotedPriceValue) : null;
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
  const visibleSearchHasFailures = visibleFailedSupplierNames.length > 0;
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
    setPreviewResult(null);
    setPreviewResolvedKey('');
    setPreviewTouched(false);
    onPendingSnapshotDraftChange(null);
    pendingSnapshotKeyRef.current = '';

    try {
      const response = await adminApi.searchPartsAcrossProviders({
        q: query,
        supplierId: normalizeNullable(supplierFilterId),
        limitPerSupplier: 6,
        totalLimit: 24,
      });
      if (requestId !== searchRequestIdRef.current) return;
      setSearchSuppliers(response.suppliers);
      setSearchSummary(response.summary);
      setPartResults(response.items);
      setSelectedPartKey((current) =>
        current && response.items.some((item) => partKey(item) === current) ? current : '',
      );
    } catch (error) {
      if (requestId !== searchRequestIdRef.current) return;
      setSearchSuppliers([]);
      setSearchSummary(null);
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
        {activeSnapshot ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4" data-admin-repair-active-snapshot>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Snapshot activo</div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">
                  {activeSnapshot.supplierNameSnapshot || 'Proveedor sin nombre'} · {activeSnapshot.partNameSnapshot}
                </div>
                <div className="mt-1 text-sm text-zinc-600">
                  {activeSnapshot.partSkuSnapshot ? `SKU ${activeSnapshot.partSkuSnapshot} · ` : ''}
                  {money(activeSnapshot.baseCost, 'Sin costo base')} · {activeSnapshot.pricingRuleNameSnapshot || 'Sin regla asociada'}
                </div>
                <div className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
                  {activeSnapshot.appliedAt
                    ? `Aplicado ${new Date(activeSnapshot.appliedAt).toLocaleString('es-AR')}`
                    : `Creado ${new Date(activeSnapshot.createdAt).toLocaleString('es-AR')}`}
                </div>
              </div>
              <StatusBadge
                label={snapshotStatusLabel(activeSnapshot, activeSnapshot.id)}
                tone={snapshotStatusTone(activeSnapshot, activeSnapshot.id)}
                size="sm"
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="detail-panel">
                <div className="detail-panel__label">Sugerido por cálculo</div>
                <div className="detail-panel__value">{money(activeSnapshot.suggestedQuotedPrice, 'Sin sugerido')}</div>
              </div>
              <div className="detail-panel">
                <div className="detail-panel__label">Precio aplicado al caso</div>
                <div className="detail-panel__value">{money(activeSnapshot.appliedQuotedPrice, 'Sin aplicar')}</div>
                {activeSnapshot.manualOverridePrice != null ? (
                  <div className="mt-1 text-xs font-medium text-amber-700">
                    Override manual: {money(activeSnapshot.manualOverridePrice, 'Sin override')}
                  </div>
                ) : null}
              </div>
              <div className="detail-panel">
                <div className="detail-panel__label">Presupuesto actual</div>
                <div className="detail-panel__value">{money(quotedPriceValue, 'Sin definir')}</div>
              </div>
            </div>

            {activeSnapshotOrigin ? (
              <div className={`ui-alert mt-4 ${activeSnapshotOrigin.tone === 'success' ? 'ui-alert--success' : 'ui-alert--warning'}`}>
                <Truck className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <span className="ui-alert__title">{activeSnapshotOrigin.title}</span>
                  <div className="ui-alert__text">{activeSnapshotOrigin.description}</div>
                </div>
              </div>
            ) : null}

            <div className="mt-4 fact-list">
              <div className="fact-row">
                <div className="fact-label">Cantidad</div>
                <div className="fact-value fact-value--text">{activeSnapshot.quantity}</div>
              </div>
              <div className="fact-row">
                <div className="fact-label">Extras / envío</div>
                <div className="fact-value fact-value--text">
                  {money(activeSnapshot.extraCost, '0')} · Envío {money(activeSnapshot.shippingCost, '0')}
                </div>
              </div>
              <div className="fact-row">
                <div className="fact-label">Regla aplicada</div>
                <div className="fact-value fact-value--text">
                  {activeSnapshot.pricingRuleNameSnapshot || 'Sin regla'} ·{' '}
                  {activeSnapshot.calcModeSnapshot === 'FIXED_TOTAL' ? 'Total fijo' : 'Base + margen'}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {mode === 'detail' ? (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-zinc-950">Historial de snapshots</div>
                <div className="text-sm text-zinc-500">Últimos cálculos persistidos para este caso.</div>
              </div>
              <StatusBadge
                label={snapshotHistory.length > 0 ? `${snapshotHistory.length} registrados` : 'Sin historial'}
                tone={snapshotHistory.length > 0 ? 'info' : 'neutral'}
                size="sm"
              />
            </div>

            {snapshotHistory.length === 0 ? (
              <EmptyState
                icon={<Truck className="h-5 w-5" />}
                title="Todavía no hay snapshots guardados"
                description="Cuando apliques un cálculo con proveedor y repuesto, quedará trazado acá para futuras revisiones."
              />
            ) : (
              <div className="space-y-3" data-admin-repair-snapshot-history>
                {snapshotHistory.map((snapshot) => {
                  const origin = snapshotValueOrigin(
                    snapshot,
                    activeSnapshot?.id === snapshot.id ? quotedPriceValue : snapshot.appliedQuotedPrice,
                  );
                  return (
                    <div key={snapshot.id} className="detail-panel">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="detail-panel__label">
                            {snapshot.supplierNameSnapshot || 'Proveedor sin nombre'} · {snapshot.partNameSnapshot}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-zinc-900">
                            {money(snapshot.baseCost, 'Sin costo base')}
                            {snapshot.partSkuSnapshot ? ` · SKU ${snapshot.partSkuSnapshot}` : ''}
                          </div>
                          <div className="mt-1 text-sm text-zinc-500">
                            {snapshot.pricingRuleNameSnapshot || 'Sin regla asociada'} ·{' '}
                            {snapshot.appliedAt
                              ? new Date(snapshot.appliedAt).toLocaleString('es-AR')
                              : new Date(snapshot.createdAt).toLocaleString('es-AR')}
                          </div>
                        </div>
                        <StatusBadge
                          label={snapshotStatusLabel(snapshot, activeSnapshot?.id ?? null)}
                          tone={snapshotStatusTone(snapshot, activeSnapshot?.id ?? null)}
                          size="sm"
                        />
                      </div>

                      <div className="mt-3 fact-list">
                        <div className="fact-row">
                          <div className="fact-label">Sugerido</div>
                          <div className="fact-value">{money(snapshot.suggestedQuotedPrice, 'Sin sugerido')}</div>
                        </div>
                        <div className="fact-row">
                          <div className="fact-label">Aplicado</div>
                          <div className="fact-value">{money(snapshot.appliedQuotedPrice, 'Sin aplicar')}</div>
                        </div>
                        <div className="fact-row">
                          <div className="fact-label">Lectura operativa</div>
                          <div className="fact-value fact-value--text">{origin.title}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {providersError ? (
          <div className="ui-alert ui-alert--danger mb-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            <div className="grow">
              <span className="ui-alert__title">No pudimos cargar proveedores con búsqueda</span>
              <div className="ui-alert__text">{providersError}</div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setProviderReloadToken((value) => value + 1)}
              disabled={providersLoading || disabled}
            >
              <RefreshCcw className="h-4 w-4" />
              Reintentar
            </Button>
          </div>
        ) : null}

        <div className={compactMode ? 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]' : 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem_auto]'}>
          <TextField
            label="Buscar repuesto"
            value={partQueryInput}
            onChange={(event) => setPartQueryInput(event.target.value)}
            placeholder="Ej: módulo Samsung A10"
            hint={
              selectedProviderFilter?.endpoint
                ? `Filtro puntual: ${selectedProviderFilter.name}`
                  : 'Se consultarán todos los proveedores activos con búsqueda configurada.'
            }
            disabled={disabled}
            data-admin-repair-part-query
          />
          {!compactMode ? (
            <div className="ui-field">
              <span className="ui-field__label">Proveedor puntual (opcional)</span>
              <CustomSelect
                value={supplierFilterId}
                onChange={(next) => {
                  setSupplierFilterId(next);
                  setPartResults([]);
                  setSearchSuppliers([]);
                  setSearchSummary(null);
                  setSelectedPartKey('');
                  setPreviewResult(null);
                  setPreviewResolvedKey('');
                  setPreviewTouched(false);
                  setSearchError('');
                  onPendingSnapshotDraftChange(null);
                  pendingSnapshotKeyRef.current = '';
                }}
                options={providerFilterOptions}
                disabled={providersLoading || disabled}
                className="w-full"
                triggerClassName="min-h-11 rounded-[1rem]"
                ariaLabel="Filtrar búsqueda por proveedor"
              />
              <span className="ui-field__hint">Podés acotar la búsqueda a un proveedor si querés un fallback manual.</span>
            </div>
          ) : null}
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => void searchParts()}
              disabled={searchLoading || disabled}
              data-admin-repair-part-search
            >
              {searchLoading ? 'Buscando...' : 'Buscar en proveedores'}
            </Button>
          </div>
        </div>

        {compactMode ? (
          <details className="nr-disclosure mt-4">
            <summary className="nr-disclosure__summary">
              <span className="nr-disclosure__title">Ajustes avanzados del cálculo</span>
              <span className="nr-disclosure__meta">Proveedor puntual, cantidad, extras y envío</span>
            </summary>
            <div className="nr-disclosure__body">
              <div className="ui-field">
                <span className="ui-field__label">Proveedor puntual (opcional)</span>
                <CustomSelect
                  value={supplierFilterId}
                  onChange={(next) => {
                    setSupplierFilterId(next);
                    setPartResults([]);
                    setSearchSuppliers([]);
                    setSearchSummary(null);
                    setSelectedPartKey('');
                    setPreviewResult(null);
                    setPreviewResolvedKey('');
                    setPreviewTouched(false);
                    setSearchError('');
                    onPendingSnapshotDraftChange(null);
                    pendingSnapshotKeyRef.current = '';
                  }}
                  options={providerFilterOptions}
                  disabled={providersLoading || disabled}
                  className="w-full"
                  triggerClassName="min-h-11 rounded-[1rem]"
                  ariaLabel="Filtrar búsqueda por proveedor"
                />
                <span className="ui-field__hint">Usalo solo si querés repetir la búsqueda contra un proveedor puntual.</span>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <TextField
                  label="Cantidad"
                  value={quantityInput}
                  onChange={(event) => setQuantityInput(event.target.value)}
                  inputMode="numeric"
                  placeholder="1"
                  hint={parsedQuantity.error || 'Cantidad de repuestos a considerar.'}
                  disabled={disabled}
                />
                <TextField
                  label="Extra"
                  value={extraCostInput}
                  onChange={(event) => setExtraCostInput(event.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                  hint={parsedExtraCost.error || 'Costo adicional manual si aplica.'}
                  disabled={disabled}
                />
                <TextField
                  label="Envío"
                  value={shippingCostInput}
                  onChange={(event) => setShippingCostInput(event.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                  hint={parsedShippingCost.error || 'Envío real del proveedor si corresponde.'}
                  disabled={disabled}
                />
              </div>
            </div>
          </details>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <TextField
              label="Cantidad"
              value={quantityInput}
              onChange={(event) => setQuantityInput(event.target.value)}
              inputMode="numeric"
              placeholder="1"
              hint={parsedQuantity.error || 'Cantidad de repuestos a considerar.'}
              disabled={disabled}
            />
            <TextField
              label="Extra"
              value={extraCostInput}
              onChange={(event) => setExtraCostInput(event.target.value)}
              inputMode="decimal"
              placeholder="0"
              hint={parsedExtraCost.error || 'Costo adicional manual si aplica.'}
              disabled={disabled}
            />
            <TextField
              label="Envío"
              value={shippingCostInput}
              onChange={(event) => setShippingCostInput(event.target.value)}
              inputMode="decimal"
              placeholder="0"
              hint={parsedShippingCost.error || 'Envío real del proveedor si corresponde.'}
              disabled={disabled}
            />
          </div>
        )}

        <div className="mt-4">
          {searchLoading ? (
            <LoadingBlock label="Buscando repuestos en proveedores" lines={4} />
          ) : searchError ? (
            <div className="ui-alert ui-alert--danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
              <div>
                <span className="ui-alert__title">No pudimos buscar repuestos</span>
                <div className="ui-alert__text">{searchError}</div>
              </div>
            </div>
          ) : !partSearchQuery ? (
            <EmptyState
              icon={<PackageSearch className="h-5 w-5" />}
              title="Todavía no buscaste repuestos"
              description="Escribí el repuesto una vez y consultá todos los proveedores activos. Luego podrás elegir la mejor opción para el cálculo."
            />
          ) : visiblePartResults.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="h-5 w-5" />}
              title="Sin resultados para esta búsqueda"
              description={
                visibleSearchHasFailures
                  ? `No hubo resultados utilizables. ${visibleFailedSupplierNames.length} proveedor${visibleFailedSupplierNames.length === 1 ? '' : 'es'} no respondieron.`
                  : 'No encontramos un repuesto utilizable con esa consulta. Probá otra descripción o acotá a un proveedor puntual.'
              }
            />
          ) : (
            <div className="space-y-3">
              {visibleSearchSummary.searchedSuppliers > 0 ? (
                <div className={`ui-alert ${visibleSearchHasFailures ? 'ui-alert--warning' : 'ui-alert--info'}`}>
                  <Truck className="mt-0.5 h-4 w-4 flex-none" />
                  <div>
                    <span className="ui-alert__title">Resultados agregados listos</span>
                    <div className="ui-alert__text">
                      Consultamos {visibleSearchSummary.searchedSuppliers} proveedores, {visibleSearchSummary.suppliersWithResults}{' '}
                      devolvieron resultados y obtuvimos {visibleSearchSummary.totalResults} opciones comparables.
                      {visibleSearchHasFailures
                        ? ` ${visibleFailedSupplierNames.length} proveedor${visibleFailedSupplierNames.length === 1 ? '' : 'es'} no respondieron.`
                        : ''}
                    </div>
                  </div>
                </div>
              ) : null}

              {hasTechnicalSearchDetails ? (
                <details className="rounded-2xl border border-zinc-200 bg-white/90 px-4 py-3 text-sm text-zinc-600">
                  <summary className="cursor-pointer select-none font-medium text-zinc-800">Ver detalle técnico</summary>
                  <div className="mt-3 space-y-2 text-xs leading-5 text-zinc-500">
                    {visibleFailedSupplierNames.length > 0 ? (
                      <div>
                        Fallos visibles: {visibleFailedSupplierNames.join(', ')}.
                      </div>
                    ) : null}
                    {hiddenSmokeSupplierCount > 0 ? (
                      <div>
                        Se omitieron {hiddenSmokeSupplierCount} proveedor{hiddenSmokeSupplierCount === 1 ? '' : 'es'} de smoke/test del resumen visible.
                        {hiddenSmokeFailureCount > 0
                          ? ` ${hiddenSmokeFailureCount} de esos proveedor${hiddenSmokeFailureCount === 1 ? '' : 'es'} fallaron durante la consulta.`
                          : ''}
                      </div>
                    ) : null}
                  </div>
                </details>
              ) : null}

              {visiblePartResults.map((part) => {
                const currentKey = partKey(part);
                const selected = selectedPartKey === currentKey;
                const selectPart = () => {
                  setSelectedPartKey(currentKey);
                  setPreviewResult(null);
                  setPreviewResolvedKey('');
                  setPreviewTouched(false);
                  onPendingSnapshotDraftChange(null);
                  pendingSnapshotKeyRef.current = '';
                };
                return (
                  <div
                    key={currentKey}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-pressed={selected}
                    className={`admin-entity-row w-full text-left ${selected ? 'ring-2 ring-sky-300' : ''} ${
                      disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                    }`}
                    onClick={() => {
                      if (disabled) return;
                      selectPart();
                    }}
                    onKeyDown={(event) => {
                      if (disabled) return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        selectPart();
                      }
                    }}
                  >
                    <div className="min-w-0">
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                        {part.supplier.name}
                      </div>
                      <div className="admin-entity-row__title flex items-center gap-2">
                        <span>{part.name}</span>
                        <StatusBadge label={availabilityLabel(part.availability)} tone={availabilityTone(part.availability)} size="sm" />
                      </div>
                      <div className="admin-entity-row__meta">
                        {part.brand || 'Marca no informada'}
                        {part.sku ? ` · SKU ${part.sku}` : ''}
                        {part.url ? ' · con enlace' : ' · sin enlace directo'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-sm font-semibold text-zinc-900">{money(part.price, 'Sin precio')}</div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {part.url ? (
                          <Button asChild variant="ghost" size="sm">
                            <a
                              href={part.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                            >
                              Ver artículo
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs font-medium text-zinc-500">Sin enlace</span>
                        )}
                        <Button
                          type="button"
                          variant={selected ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (disabled) return;
                            selectPart();
                          }}
                          disabled={disabled}
                        >
                          {selected ? 'Seleccionado' : 'Elegir'}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedPart ? (
          <div className="mt-4 summary-box">
            <div className="summary-box__label">Opción seleccionada</div>
            <div className="summary-box__value">{selectedPart.supplier.name}</div>
            <div className="summary-box__hint">
              {selectedPart.name} · {money(selectedPart.price, 'Sin precio')} · {availabilityLabel(selectedPart.availability)}
            </div>
          </div>
        ) : null}

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
                  Recalculá para que el costo, la regla y el sugerido reflejen el proveedor, repuesto y contexto técnico actuales.
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
                    <div className="fact-list">
                      <div className="fact-row">
                        <div className="fact-label">Costo base</div>
                        <div className="fact-value">{money(activePreviewResult.calculation.baseCost, 'Sin costo')}</div>
                      </div>
                      <div className="fact-row">
                        <div className="fact-label">Extras / envío</div>
                        <div className="fact-value fact-value--text">
                          {money(activePreviewResult.calculation.extraCost, '0')} · Envío{' '}
                          {money(activePreviewResult.calculation.shippingCost, '0')}
                        </div>
                      </div>
                      <div className="fact-row">
                        <div className="fact-label">Margen / modo</div>
                        <div className="fact-value fact-value--text">
                          {activePreviewResult.calculation.calcMode === 'FIXED_TOTAL'
                            ? 'Total fijo según regla'
                            : `${activePreviewResult.calculation.marginPercent ?? 0}% · ${previewModeLabel(activePreviewResult)}`}
                        </div>
                      </div>
                      <div className="fact-row">
                        <div className="fact-label">Piso / fee</div>
                        <div className="fact-value fact-value--text">
                          {activePreviewResult.calculation.minFinalPrice != null
                            ? `Piso ${money(activePreviewResult.calculation.minFinalPrice, '0')}`
                            : 'Sin piso'}
                          {activePreviewResult.calculation.appliedShippingFee != null
                            ? ` · Fee ${money(activePreviewResult.calculation.appliedShippingFee, '0')}`
                            : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              ) : (
                <div className="fact-list">
                  <div className="fact-row">
                    <div className="fact-label">Costo base</div>
                    <div className="fact-value">{money(activePreviewResult.calculation.baseCost, 'Sin costo')}</div>
                  </div>
                  <div className="fact-row">
                    <div className="fact-label">Extras / envío</div>
                    <div className="fact-value fact-value--text">
                      {money(activePreviewResult.calculation.extraCost, '0')} · Envío{' '}
                      {money(activePreviewResult.calculation.shippingCost, '0')}
                    </div>
                  </div>
                  <div className="fact-row">
                    <div className="fact-label">Margen / modo</div>
                    <div className="fact-value fact-value--text">
                      {activePreviewResult.calculation.calcMode === 'FIXED_TOTAL'
                        ? 'Total fijo según regla'
                        : `${activePreviewResult.calculation.marginPercent ?? 0}% · ${previewModeLabel(activePreviewResult)}`}
                    </div>
                  </div>
                  <div className="fact-row">
                    <div className="fact-label">Piso / fee</div>
                    <div className="fact-value fact-value--text">
                      {activePreviewResult.calculation.minFinalPrice != null
                        ? `Piso ${money(activePreviewResult.calculation.minFinalPrice, '0')}`
                        : 'Sin piso'}
                      {activePreviewResult.calculation.appliedShippingFee != null
                        ? ` · Fee ${money(activePreviewResult.calculation.appliedShippingFee, '0')}`
                        : ''}
                    </div>
                  </div>
                </div>
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
                  El proveedor y el repuesto se encontraron, pero no hay una regla activa que cierre el cálculo para este contexto técnico.
                </div>
              </div>
            </div>
          ) : (
            <div className="ui-alert ui-alert--info">
              <Calculator className="mt-0.5 h-4 w-4 flex-none" />
              <div>
                <span className="ui-alert__title">Listo para calcular</span>
                <div className="ui-alert__text">
                  Cuando el repuesto elegido y el contexto técnico estén definidos, calculá el preview y decidí si querés aplicarlo.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void calculatePreview()}
            disabled={!previewInputState.canResolve || previewLoading || disabled}
            data-admin-repair-part-preview
          >
            {previewLoading ? 'Calculando...' : activePreviewResult || previewNeedsRefresh ? 'Recalcular preview' : 'Calcular preview'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={applySuggestedPrice}
            disabled={previewSuggested == null || previewLoading || disabled}
            data-admin-repair-part-use-suggested
          >
            Usar sugerido
          </Button>
          <Button
            type="button"
            onClick={applySnapshotDraft}
            disabled={!activePreviewResult?.matched || !activePreviewResult.snapshotDraft || previewLoading || disabled}
            data-admin-repair-part-apply-snapshot
          >
            {mode === 'create' ? 'Aplicar snapshot al crear' : 'Aplicar snapshot al guardar'}
          </Button>
          {pendingSnapshotIsCurrent ? (
            <Button type="button" variant="outline" onClick={clearPendingSnapshot} disabled={previewLoading || disabled}>
              Limpiar snapshot
            </Button>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}


