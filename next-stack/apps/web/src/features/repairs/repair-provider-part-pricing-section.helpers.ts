import type {
  AdminProviderAggregatePartSearchItem,
  AdminProviderItem,
} from '@/features/admin/api';
import type {
  RepairPricingSnapshotDraft,
  RepairProviderPartPricingPreviewResult,
} from './api';
import type { RepairPricingSnapshotItem } from './types';

export type TechnicalContext = {
  deviceTypeId?: string | null;
  deviceBrandId?: string | null;
  deviceModelGroupId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  issueLabel?: string | null;
};

export type RepairProviderPartPricingSectionProps = {
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

export type ProviderFilterOption = {
  value: string;
  label: string;
};

export type SnapshotOriginInfo = {
  title: string;
  description: string;
  tone: 'success' | 'warning';
};

export type ProviderPricingStatusBadge = {
  label: string;
  tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
};

export type VisibleProviderSearchState = {
  visiblePartResults: AdminProviderAggregatePartSearchItem[];
};

export function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

export function parsePositiveInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { value: 1, error: '' };
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 999) {
    return { value: null, error: 'Ingresá una cantidad válida entre 1 y 999.' };
  }
  return { value: parsed, error: '' };
}

export function parseOptionalMoney(value: string, label: string) {
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) return { value: 0, error: '' };
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, error: `Ingresá un ${label.toLowerCase()} válido mayor o igual a 0.` };
  }
  return { value: parsed, error: '' };
}

export function partKey(
  part: Pick<AdminProviderAggregatePartSearchItem, 'externalPartId' | 'sku' | 'url' | 'name' | 'supplier'>,
) {
  return [part.supplier.id, part.externalPartId ?? '', part.sku ?? '', part.url ?? '', part.name.trim().toLowerCase()].join('::');
}

export function buildHydratedPart(snapshot: RepairPricingSnapshotItem): AdminProviderAggregatePartSearchItem | null {
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

export function availabilityLabel(value: 'in_stock' | 'out_of_stock' | 'unknown' | null | undefined) {
  if (value === 'in_stock') return 'Disponible';
  if (value === 'out_of_stock') return 'Sin stock';
  return 'Disponibilidad no informada';
}

export function availabilityTone(value: 'in_stock' | 'out_of_stock' | 'unknown' | null | undefined) {
  if (value === 'in_stock') return 'success' as const;
  if (value === 'out_of_stock') return 'danger' as const;
  return 'neutral' as const;
}

export function isSelectableProviderPart(part: Pick<AdminProviderAggregatePartSearchItem, 'availability' | 'price'>) {
  return part.availability !== 'out_of_stock' && part.price != null;
}

export function isSmokeSupplierName(name: string | null | undefined) {
  return (name ?? '').trim().toLowerCase().startsWith('smoke supplier');
}

export function previewModeLabel(result: RepairProviderPartPricingPreviewResult | null) {
  return result?.calculation.calcMode === 'FIXED_TOTAL' ? 'Total fijo' : 'Base + margen';
}

export function snapshotStatusLabel(snapshot: RepairPricingSnapshotItem, activeSnapshotId?: string | null) {
  if (activeSnapshotId && snapshot.id === activeSnapshotId) return 'Activo';
  if (snapshot.status === 'SUPERSEDED') return 'Reemplazado';
  if (snapshot.status === 'DISCARDED') return 'Descartado';
  if (snapshot.status === 'DRAFT') return 'Borrador';
  return 'Aplicado';
}

export function snapshotStatusTone(snapshot: RepairPricingSnapshotItem, activeSnapshotId?: string | null) {
  if (activeSnapshotId && snapshot.id === activeSnapshotId) return 'success' as const;
  if (snapshot.status === 'SUPERSEDED') return 'warning' as const;
  if (snapshot.status === 'DISCARDED') return 'danger' as const;
  if (snapshot.status === 'DRAFT') return 'neutral' as const;
  return 'info' as const;
}

export function snapshotValueOrigin(
  snapshot: RepairPricingSnapshotItem,
  currentQuotedPrice: number | null,
): SnapshotOriginInfo {
  if (snapshot.manualOverridePrice != null) {
    return {
      title: 'Snapshot aplicado con override manual',
      description: 'El operador aplicó el cálculo, pero guardó un presupuesto distinto al sugerido dentro del mismo snapshot.',
      tone: 'warning',
    };
  }
  if (currentQuotedPrice != null && snapshot.appliedQuotedPrice != null && currentQuotedPrice !== snapshot.appliedQuotedPrice) {
    return {
      title: 'El presupuesto actual ya no coincide con el snapshot activo',
      description: 'El valor del caso fue modificado manualmente después de aplicar este cálculo.',
      tone: 'warning',
    };
  }
  return {
    title: 'Precio aplicado según cálculo',
    description: 'El presupuesto actual coincide con el snapshot activo y no registra override manual.',
    tone: 'success',
  };
}

export function buildProviderFilterOptions(
  providers: AdminProviderItem[],
  activeSnapshot?: RepairPricingSnapshotItem | null,
): ProviderFilterOption[] {
  const base = providers.map((item) => ({ value: item.id, label: item.name }));
  const historicalMissing =
    activeSnapshot?.supplierId &&
    !base.some((item) => item.value === activeSnapshot.supplierId) &&
    activeSnapshot.supplierNameSnapshot
      ? [{ value: activeSnapshot.supplierId, label: `${activeSnapshot.supplierNameSnapshot} (histórico)` }]
      : [];
  return [{ value: '', label: 'Todos los proveedores activos' }, ...historicalMissing, ...base];
}

export function resolveSelectedProviderFilter(
  providers: AdminProviderItem[],
  supplierFilterId: string,
  activeSnapshot?: RepairPricingSnapshotItem | null,
) {
  if (!supplierFilterId) return null;
  return (
    providers.find((item) => item.id === supplierFilterId) ?? {
      id: supplierFilterId,
      name: activeSnapshot?.supplierNameSnapshot || 'Proveedor historico',
      endpoint: activeSnapshot?.supplierEndpointSnapshot ?? '',
    }
  );
}

export function buildVisibleProviderSearchState(
  partResults: AdminProviderAggregatePartSearchItem[],
): VisibleProviderSearchState {
  return {
    visiblePartResults: partResults.filter((item) => !isSmokeSupplierName(item.supplier.name)),
  };
}

type BuildProviderPricingStatusBadgeInput = {
  pendingSnapshotIsCurrent: boolean;
  previewLoading: boolean;
  searchLoading: boolean;
  providersLoading: boolean;
  providersError: string;
  searchError: string;
  activePreviewError: string;
  previewNeedsRefresh: boolean;
  activePreviewResult: RepairProviderPartPricingPreviewResult | null;
  activeSnapshot?: RepairPricingSnapshotItem | null;
};

export function buildProviderPricingStatusBadge({
  pendingSnapshotIsCurrent,
  previewLoading,
  searchLoading,
  providersLoading,
  providersError,
  searchError,
  activePreviewError,
  previewNeedsRefresh,
  activePreviewResult,
  activeSnapshot,
}: BuildProviderPricingStatusBadgeInput): ProviderPricingStatusBadge {
  if (pendingSnapshotIsCurrent) return { label: 'Snapshot listo', tone: 'success' };
  if (previewLoading || searchLoading || providersLoading) return { label: 'Cargando', tone: 'info' };
  if (providersError || searchError || activePreviewError) return { label: 'Error', tone: 'danger' };
  if (previewNeedsRefresh) return { label: 'Recalcular', tone: 'warning' };
  if (activePreviewResult?.matched && activePreviewResult.snapshotDraft) return { label: 'Preview listo', tone: 'success' };
  if (activePreviewResult && !activePreviewResult.matched) return { label: 'Sin regla', tone: 'warning' };
  return { label: activeSnapshot ? 'Snapshot activo' : 'Opcional', tone: 'neutral' };
}
