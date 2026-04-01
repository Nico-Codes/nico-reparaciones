import { useEffect, useMemo, useRef, useState } from 'react';
import { repairsApi, type RepairPricingResolveResult, type RepairPricingSnapshotDraft } from './api';
import {
  buildRepairDetailPatch,
  buildRepairDetailSummary,
  hasRepairDetailChanges,
  normalizeNullable,
  parseOptionalMoney,
  validatePhone,
  type AdminRepairDetailFormErrors,
} from './admin-repair-detail.helpers';
import { buildRepairPricingInput, formatSuggestedPriceInput } from './repair-pricing';
import { repairCode, repairStatusLabel, repairStatusSummary, repairStatusTone } from './repair-ui';
import type { RepairItem, RepairPricingSnapshotItem, RepairTimelineEvent } from './types';

type UseAdminRepairDetailParams = {
  id: string;
  initialNotice: string;
};

export function useAdminRepairDetail({ id, initialNotice }: UseAdminRepairDetailParams) {
  const detailRequestIdRef = useRef(0);
  const pricingRequestIdRef = useRef(0);

  const [item, setItem] = useState<RepairItem | null>(null);
  const [timeline, setTimeline] = useState<RepairTimelineEvent[]>([]);
  const [pricingSnapshots, setPricingSnapshots] = useState<RepairPricingSnapshotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [pricingError, setPricingError] = useState('');
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingResult, setPricingResult] = useState<RepairPricingResolveResult | null>(null);
  const [pricingResolvedKey, setPricingResolvedKey] = useState('');
  const [pricingTouched, setPricingTouched] = useState(false);
  const [notice, setNotice] = useState(initialNotice);
  const [fieldErrors, setFieldErrors] = useState<AdminRepairDetailFormErrors>({});
  const [pendingPricingSnapshotDraft, setPendingPricingSnapshotDraft] = useState<RepairPricingSnapshotDraft | null>(null);
  const [status, setStatus] = useState('RECEIVED');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [issueLabel, setIssueLabel] = useState('');
  const [quotedPrice, setQuotedPrice] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [notes, setNotes] = useState('');

  function hydrateForm(nextItem: RepairItem) {
    pricingRequestIdRef.current += 1;
    setPricingError('');
    setPricingLoading(false);
    setPricingResult(null);
    setPricingResolvedKey('');
    setPricingTouched(false);
    setPendingPricingSnapshotDraft(null);
    setStatus(nextItem.status);
    setCustomerName(nextItem.customerName || '');
    setCustomerPhone(nextItem.customerPhone || '');
    setDeviceBrand(nextItem.deviceBrand || '');
    setDeviceModel(nextItem.deviceModel || '');
    setIssueLabel(nextItem.issueLabel || '');
    setQuotedPrice(nextItem.quotedPrice != null ? String(nextItem.quotedPrice) : '');
    setFinalPrice(nextItem.finalPrice != null ? String(nextItem.finalPrice) : '');
    setNotes(nextItem.notes || '');
  }

  async function loadDetail(repairId: string, options?: { showLoading?: boolean }) {
    const requestId = ++detailRequestIdRef.current;
    if (options?.showLoading !== false) setLoading(true);
    setLoadError('');
    try {
      const res = await repairsApi.adminDetail(repairId);
      if (requestId !== detailRequestIdRef.current) return;
      setItem(res.item);
      setTimeline(res.timeline ?? []);
      setPricingSnapshots(res.pricingSnapshots ?? []);
      hydrateForm(res.item);
    } catch (cause) {
      if (requestId !== detailRequestIdRef.current) return;
      setLoadError(cause instanceof Error ? cause.message : 'No se pudo cargar la reparacion.');
    } finally {
      if (requestId !== detailRequestIdRef.current) return;
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    void loadDetail(id);
  }, [id]);

  useEffect(() => {
    if (!initialNotice) return;
    setNotice(initialNotice);
  }, [initialNotice]);

  const parsedQuotedPrice = useMemo(() => parseOptionalMoney(quotedPrice, 'presupuesto'), [quotedPrice]);
  const parsedFinalPrice = useMemo(() => parseOptionalMoney(finalPrice, 'precio final'), [finalPrice]);

  const summary = useMemo(
    () => buildRepairDetailSummary(parsedQuotedPrice.value, parsedFinalPrice.value, timeline.length),
    [parsedFinalPrice.value, parsedQuotedPrice.value, timeline.length],
  );

  const normalizedDraft = useMemo(
    () => ({
      customerName: customerName.trim(),
      customerPhone: normalizeNullable(customerPhone),
      deviceBrand: normalizeNullable(deviceBrand),
      deviceModel: normalizeNullable(deviceModel),
      issueLabel: normalizeNullable(issueLabel),
      status,
      quotedPrice: parsedQuotedPrice.value,
      finalPrice: parsedFinalPrice.value,
      notes: normalizeNullable(notes),
    }),
    [customerName, customerPhone, deviceBrand, deviceModel, issueLabel, status, parsedQuotedPrice.value, parsedFinalPrice.value, notes],
  );

  const pricingInput = useMemo(
    () =>
      buildRepairPricingInput({
        deviceTypeId: item?.deviceTypeId ?? null,
        deviceBrandId: item?.deviceBrandId ?? null,
        deviceModelId: item?.deviceModelId ?? null,
        deviceIssueTypeId: item?.deviceIssueTypeId ?? null,
        deviceBrand: normalizedDraft.deviceBrand,
        deviceModel: normalizedDraft.deviceModel,
        issueLabel: normalizedDraft.issueLabel,
      }),
    [
      item?.deviceTypeId,
      item?.deviceBrandId,
      item?.deviceModelId,
      item?.deviceIssueTypeId,
      normalizedDraft.deviceBrand,
      normalizedDraft.deviceModel,
      normalizedDraft.issueLabel,
    ],
  );

  const pricingResultIsCurrent = pricingResolvedKey === pricingInput.key;
  const activePricingResult = pricingResultIsCurrent ? pricingResult : null;
  const activePricingError = pricingResultIsCurrent ? pricingError : '';
  const pricingNeedsRefresh = pricingTouched && !!pricingResolvedKey && pricingResolvedKey !== pricingInput.key;
  const suggestedTotal = activePricingResult?.matched ? activePricingResult.suggestion?.suggestedTotal ?? null : null;
  const canUseSuggested = suggestedTotal != null && suggestedTotal !== parsedQuotedPrice.value;

  const pricingBadge = useMemo(() => {
    if (!pricingInput.canResolve) return { label: 'Datos insuficientes', tone: 'neutral' as const };
    if (pricingLoading) return { label: 'Calculando', tone: 'info' as const };
    if (activePricingError) return { label: 'Error', tone: 'danger' as const };
    if (pricingNeedsRefresh) return { label: 'Recalcular', tone: 'warning' as const };
    if (activePricingResult?.matched && activePricingResult.suggestion) return { label: 'Sugerencia lista', tone: 'success' as const };
    if (activePricingResult && !activePricingResult.matched) return { label: 'Sin regla', tone: 'warning' as const };
    return { label: 'Pendiente', tone: 'neutral' as const };
  }, [activePricingError, activePricingResult, pricingInput.canResolve, pricingLoading, pricingNeedsRefresh]);

  const hasChanges = useMemo(
    () => hasRepairDetailChanges(item, normalizedDraft, pendingPricingSnapshotDraft),
    [item, normalizedDraft, pendingPricingSnapshotDraft],
  );

  function validate() {
    const nextErrors: AdminRepairDetailFormErrors = {};

    if (normalizedDraft.customerName.length < 2) {
      nextErrors.customerName = 'Ingresa al menos 2 caracteres para identificar al cliente.';
    }

    const phoneError = validatePhone(customerPhone);
    if (phoneError) {
      nextErrors.customerPhone = phoneError;
    }

    if (parsedQuotedPrice.error) {
      nextErrors.quotedPrice = parsedQuotedPrice.error;
    }

    if (parsedFinalPrice.error) {
      nextErrors.finalPrice = parsedFinalPrice.error;
    }

    if (pendingPricingSnapshotDraft && parsedQuotedPrice.value == null) {
      nextErrors.quotedPrice = 'Define un presupuesto antes de guardar un snapshot aplicado.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function recalculateSuggestedPrice() {
    if (!item || !pricingInput.canResolve || pricingLoading || saving) return;

    const requestId = pricingRequestIdRef.current + 1;
    pricingRequestIdRef.current = requestId;
    setPricingTouched(true);
    setPricingLoading(true);
    setPricingError('');

    try {
      const response = await repairsApi.pricingResolve(pricingInput.input);
      if (requestId !== pricingRequestIdRef.current) return;
      setPricingResult(response);
      setPricingResolvedKey(pricingInput.key);
    } catch (cause) {
      if (requestId !== pricingRequestIdRef.current) return;
      setPricingResult(null);
      setPricingResolvedKey(pricingInput.key);
      setPricingError(cause instanceof Error ? cause.message : 'No pudimos calcular una sugerencia automatica.');
    } finally {
      if (requestId === pricingRequestIdRef.current) setPricingLoading(false);
    }
  }

  function useSuggestedPrice() {
    if (suggestedTotal == null) return;
    setQuotedPrice(formatSuggestedPriceInput(suggestedTotal));
    setFieldErrors((current) => ({ ...current, quotedPrice: undefined }));
    setNotice('');
  }

  async function saveChanges() {
    if (!item || saving) return;
    setSaveError('');
    setNotice('');

    if (!validate()) return;

    if (!hasChanges) {
      setNotice('No hay cambios para guardar.');
      return;
    }

    const patch = buildRepairDetailPatch(item, normalizedDraft, pendingPricingSnapshotDraft);

    setSaving(true);
    try {
      await repairsApi.adminUpdate(item.id, patch);
      await loadDetail(item.id, { showLoading: false });
      setNotice('Reparacion actualizada correctamente.');
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  const statusLabel = item ? repairStatusLabel(item.status) : '';
  const statusTone = item ? repairStatusTone(item.status) : 'neutral';
  const statusSummary = item ? repairStatusSummary(item.status) : '';
  const code = item ? repairCode(item.id) : '';
  const deviceLabel = [deviceBrand, deviceModel].filter(Boolean).join(' ') || 'Equipo sin identificar';
  const formValues = {
    customerName,
    customerPhone,
    deviceBrand,
    deviceModel,
    issueLabel,
    status,
    quotedPrice,
    finalPrice,
    notes,
  };

  return {
    item,
    timeline,
    pricingSnapshots,
    loading,
    saving,
    loadError,
    saveError,
    pricingLoading,
    activePricingError,
    pricingNeedsRefresh,
    activePricingResult,
    notice,
    fieldErrors,
    hasChanges,
    summary,
    pricingInput,
    pricingBadge,
    canUseSuggested,
    parsedQuotedPriceValue: parsedQuotedPrice.value,
    statusLabel,
    statusTone,
    statusSummary,
    code,
    deviceLabel,
    formValues,
    normalizedDraft,
    pendingPricingSnapshotDraft,
    setCustomerName,
    setCustomerPhone,
    setDeviceBrand,
    setDeviceModel,
    setIssueLabel,
    setStatus,
    setQuotedPrice,
    setFinalPrice,
    setNotes,
    reload: (options?: { showLoading?: boolean }) => void loadDetail(id, options),
    save: () => void saveChanges(),
    recalculateSuggestedPrice: () => void recalculateSuggestedPrice(),
    useSuggestedPrice,
    providerPartProps: item
      ? {
          mode: 'detail' as const,
          hydrateKey: `${item.id}:${item.activePricingSnapshotId ?? 'none'}`,
          technicalContext: {
            deviceTypeId: item.deviceTypeId ?? null,
            deviceBrandId: item.deviceBrandId ?? null,
            deviceModelId: item.deviceModelId ?? null,
            deviceIssueTypeId: item.deviceIssueTypeId ?? null,
            deviceBrand: normalizedDraft.deviceBrand,
            deviceModel: normalizedDraft.deviceModel,
            issueLabel: normalizedDraft.issueLabel,
          },
          quotedPriceValue: parsedQuotedPrice.value,
          disabled: saving || pricingLoading,
          activeSnapshot: item.activePricingSnapshot ?? null,
          snapshotHistory: pricingSnapshots,
          pendingSnapshotDraft: pendingPricingSnapshotDraft ?? null,
          onPendingSnapshotDraftChange: (draft: RepairPricingSnapshotDraft | null) => {
            setPendingPricingSnapshotDraft(draft);
            setFieldErrors((current) => ({ ...current, quotedPrice: undefined }));
          },
          onUseSuggestedPrice: (value: number) => {
            setQuotedPrice(formatSuggestedPriceInput(value));
            setFieldErrors((current) => ({ ...current, quotedPrice: undefined }));
            setNotice('');
          },
          onStatusMessage: setNotice,
        }
      : null,
  };
}
