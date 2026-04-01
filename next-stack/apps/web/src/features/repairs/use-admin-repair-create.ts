import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/features/admin/api';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { repairsApi, type AdminRepairCreateInput, type RepairPricingResolveResult } from './api';
import {
  buildBrandOptions,
  buildDeviceTypeOptions,
  buildIssueOptions,
  buildModelOptions,
  buildRepairCreateDevicePreview,
  buildRepairCreatePayload,
  normalizeNullable,
  parseOptionalMoney,
  validateRepairCreateForm,
  type AdminRepairCreateFormErrors,
  type BrandItem,
  type DeviceTypeItem,
  type IssueItem,
  type ModelItem,
} from './admin-repair-create.helpers';
import { buildRepairPricingInput, formatSuggestedPriceInput } from './repair-pricing';

export function useAdminRepairCreate() {
  const navigate = useNavigate();
  const catalogRequestId = useRef(0);
  const modelRequestId = useRef(0);
  const pricingRequestId = useRef(0);

  const [catalogReloadToken, setCatalogReloadToken] = useState(0);
  const [deviceTypes, setDeviceTypes] = useState<DeviceTypeItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [pricingError, setPricingError] = useState('');
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingResult, setPricingResult] = useState<RepairPricingResolveResult | null>(null);
  const [pricingResolvedKey, setPricingResolvedKey] = useState('');
  const [pricingTouched, setPricingTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AdminRepairCreateFormErrors>({});
  const [pendingPricingSnapshotDraft, setPendingPricingSnapshotDraft] = useState<AdminRepairCreateInput['pricingSnapshotDraft']>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceTypeId, setDeviceTypeId] = useState('');
  const [deviceBrandId, setDeviceBrandId] = useState('');
  const [deviceModelId, setDeviceModelId] = useState('');
  const [deviceIssueTypeId, setDeviceIssueTypeId] = useState('');
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [issueLabel, setIssueLabel] = useState('');
  const [quotedPrice, setQuotedPrice] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadTypes() {
      setLoadingTypes(true);
      setCatalogError('');
      try {
        const response = await adminApi.deviceTypes();
        if (!mounted) return;
        setDeviceTypes(response.items.filter((item) => item.active));
      } catch (error) {
        if (!mounted) return;
        setCatalogError(error instanceof Error ? error.message : 'No pudimos cargar el catalogo.');
      } finally {
        if (mounted) setLoadingTypes(false);
      }
    }

    void loadTypes();
    return () => {
      mounted = false;
    };
  }, [catalogReloadToken]);

  useEffect(() => {
    const requestId = catalogRequestId.current + 1;
    catalogRequestId.current = requestId;
    let mounted = true;

    async function loadCatalogSlices() {
      setLoadingBrands(true);
      setLoadingIssues(true);
      setCatalogError('');
      try {
        const [brandResponse, issueResponse] = await Promise.all([
          deviceCatalogApi.brands(deviceTypeId || undefined),
          deviceCatalogApi.issues(deviceTypeId || undefined),
        ]);
        if (!mounted || requestId !== catalogRequestId.current) return;
        setBrands(brandResponse.items.filter((item) => item.active));
        setIssues(issueResponse.items.filter((item) => item.active));
      } catch (error) {
        if (!mounted || requestId !== catalogRequestId.current) return;
        setCatalogError(error instanceof Error ? error.message : 'No pudimos cargar el catalogo de marcas y fallas.');
      } finally {
        if (mounted && requestId === catalogRequestId.current) {
          setLoadingBrands(false);
          setLoadingIssues(false);
        }
      }
    }

    void loadCatalogSlices();
    return () => {
      mounted = false;
    };
  }, [deviceTypeId, catalogReloadToken]);

  useEffect(() => {
    const requestId = modelRequestId.current + 1;
    modelRequestId.current = requestId;
    let mounted = true;

    if (!deviceBrandId) {
      setModels([]);
      setLoadingModels(false);
      return () => {
        mounted = false;
      };
    }

    async function loadModels() {
      setLoadingModels(true);
      setCatalogError('');
      try {
        const response = await deviceCatalogApi.models(deviceBrandId);
        if (!mounted || requestId !== modelRequestId.current) return;
        setModels(response.items.filter((item) => item.active));
      } catch (error) {
        if (!mounted || requestId !== modelRequestId.current) return;
        setCatalogError(error instanceof Error ? error.message : 'No pudimos cargar los modelos.');
      } finally {
        if (mounted && requestId === modelRequestId.current) setLoadingModels(false);
      }
    }

    void loadModels();
    return () => {
      mounted = false;
    };
  }, [deviceBrandId, catalogReloadToken]);

  useEffect(() => {
    if (deviceBrandId && !brands.some((item) => item.id === deviceBrandId)) {
      setDeviceBrandId('');
    }
  }, [brands, deviceBrandId]);

  useEffect(() => {
    if (deviceIssueTypeId && !issues.some((item) => item.id === deviceIssueTypeId)) {
      setDeviceIssueTypeId('');
    }
  }, [deviceIssueTypeId, issues]);

  useEffect(() => {
    if (deviceModelId && !models.some((item) => item.id === deviceModelId)) {
      setDeviceModelId('');
    }
  }, [deviceModelId, models]);

  useEffect(() => {
    setDeviceModelId('');
  }, [deviceBrandId]);

  const deviceTypeOptions = useMemo(() => buildDeviceTypeOptions(deviceTypes), [deviceTypes]);
  const brandOptions = useMemo(() => buildBrandOptions(brands), [brands]);
  const modelOptions = useMemo(() => buildModelOptions(models), [models]);
  const issueOptions = useMemo(() => buildIssueOptions(issues), [issues]);

  const selectedBrand = useMemo(() => brands.find((item) => item.id === deviceBrandId) ?? null, [brands, deviceBrandId]);
  const selectedModel = useMemo(() => models.find((item) => item.id === deviceModelId) ?? null, [models, deviceModelId]);
  const selectedIssue = useMemo(() => issues.find((item) => item.id === deviceIssueTypeId) ?? null, [issues, deviceIssueTypeId]);

  useEffect(() => {
    if (selectedBrand && !deviceBrand.trim()) setDeviceBrand(selectedBrand.name);
  }, [deviceBrand, selectedBrand]);

  useEffect(() => {
    if (selectedModel && !deviceModel.trim()) setDeviceModel(selectedModel.name);
  }, [deviceModel, selectedModel]);

  useEffect(() => {
    if (selectedIssue && !issueLabel.trim()) setIssueLabel(selectedIssue.name);
  }, [issueLabel, selectedIssue]);

  const resolvedBrand = normalizeNullable(deviceBrand) ?? selectedBrand?.name ?? null;
  const resolvedModel = normalizeNullable(deviceModel) ?? selectedModel?.name ?? null;
  const resolvedIssue = normalizeNullable(issueLabel) ?? selectedIssue?.name ?? null;
  const resolvedQuotedPrice = useMemo(() => parseOptionalMoney(quotedPrice), [quotedPrice]);
  const catalogBusy = loadingTypes || loadingBrands || loadingModels || loadingIssues;
  const devicePreview = buildRepairCreateDevicePreview(resolvedBrand, resolvedModel);

  const pricingInput = useMemo(
    () =>
      buildRepairPricingInput({
        deviceTypeId,
        deviceBrandId,
        deviceModelId,
        deviceModelGroupId: selectedModel?.deviceModelGroupId ?? null,
        deviceIssueTypeId,
        deviceBrand: resolvedBrand,
        deviceModel: resolvedModel,
        issueLabel: resolvedIssue,
      }),
    [deviceTypeId, deviceBrandId, deviceModelId, deviceIssueTypeId, selectedModel?.deviceModelGroupId, resolvedBrand, resolvedModel, resolvedIssue],
  );

  const pricingResultIsCurrent = pricingResolvedKey === pricingInput.key;
  const activePricingResult = pricingResultIsCurrent ? pricingResult : null;
  const activePricingError = pricingResultIsCurrent ? pricingError : '';
  const pricingNeedsRefresh = pricingTouched && !!pricingResolvedKey && pricingResolvedKey !== pricingInput.key;
  const suggestedTotal = activePricingResult?.matched ? activePricingResult.suggestion?.suggestedTotal ?? null : null;
  const canUseSuggested = suggestedTotal != null && suggestedTotal !== resolvedQuotedPrice.value;

  const pricingBadge = useMemo(() => {
    if (!pricingInput.canResolve) return { label: 'Datos insuficientes', tone: 'neutral' as const };
    if (pricingLoading) return { label: 'Calculando', tone: 'info' as const };
    if (activePricingError) return { label: 'Error', tone: 'danger' as const };
    if (pricingNeedsRefresh) return { label: 'Recalcular', tone: 'warning' as const };
    if (activePricingResult?.matched && activePricingResult.suggestion) return { label: 'Sugerencia lista', tone: 'success' as const };
    if (activePricingResult && !activePricingResult.matched) return { label: 'Sin regla', tone: 'warning' as const };
    return { label: 'Pendiente', tone: 'neutral' as const };
  }, [activePricingError, activePricingResult, pricingInput.canResolve, pricingLoading, pricingNeedsRefresh]);

  const formValues = {
    customerName,
    customerPhone,
    deviceTypeId,
    deviceBrandId,
    deviceModelId,
    deviceIssueTypeId,
    deviceBrand,
    deviceModel,
    issueLabel,
    quotedPrice,
    notes,
  };

  function validate() {
    const nextErrors = validateRepairCreateForm({
      customerName,
      customerPhone,
      quotedPriceError: resolvedQuotedPrice.error,
      quotedPriceValue: resolvedQuotedPrice.value,
      pendingPricingSnapshotDraft,
    });

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitError('');

    if (!validate()) return;

    const payload = buildRepairCreatePayload({
      form: formValues,
      resolved: {
        brand: resolvedBrand,
        model: resolvedModel,
        issue: resolvedIssue,
        quotedPrice: resolvedQuotedPrice.value,
      },
      pendingPricingSnapshotDraft,
    });

    setSubmitting(true);
    try {
      const created = await repairsApi.adminCreate(payload);
      navigate(`/admin/repairs/${encodeURIComponent(created.id)}`, {
        replace: true,
        state: { notice: 'Reparacion creada correctamente.' },
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No pudimos crear la reparacion.');
    } finally {
      setSubmitting(false);
    }
  }

  return {
    submitError,
    catalogError,
    catalogBusy,
    pricingLoading,
    submitting,
    formValues,
    fieldErrors,
    devicePreview,
    resolvedIssue,
    resolvedQuotedPriceValue: resolvedQuotedPrice.value,
    basicSectionProps: {
      loadingTypes,
      loadingBrands,
      loadingModels,
      submitting,
      deviceTypeOptions,
      brandOptions,
      modelOptions,
      values: formValues,
      fieldErrors,
      onCustomerNameChange: setCustomerName,
      onCustomerPhoneChange: setCustomerPhone,
      onDeviceTypeIdChange: setDeviceTypeId,
      onDeviceBrandIdChange: setDeviceBrandId,
      onDeviceModelIdChange: setDeviceModelId,
      onDeviceBrandChange: setDeviceBrand,
      onDeviceModelChange: setDeviceModel,
    },
    diagnosisSectionProps: {
      loadingIssues,
      submitting,
      issueOptions,
      values: formValues,
      fieldErrors,
      pricingBadge,
      pricingInputState: pricingInput,
      pricingLoading,
      activePricingError,
      pricingNeedsRefresh,
      activePricingResult,
      canUseSuggested,
      onDeviceIssueTypeIdChange: setDeviceIssueTypeId,
      onIssueLabelChange: setIssueLabel,
      onQuotedPriceChange: setQuotedPrice,
      onRecalculate: () => void recalculateSuggestedPrice(),
      onUseSuggested: useSuggestedPrice,
    },
    providerPartProps: {
      mode: 'create' as const,
      compactMode: true,
      hydrateKey: 'repair-create',
      technicalContext: {
        deviceTypeId,
        deviceBrandId,
        deviceModelGroupId: selectedModel?.deviceModelGroupId ?? null,
        deviceModelId,
        deviceIssueTypeId,
        deviceBrand: resolvedBrand,
        deviceModel: resolvedModel,
        issueLabel: resolvedIssue,
      },
      quotedPriceValue: resolvedQuotedPrice.value,
      disabled: submitting || pricingLoading,
      pendingSnapshotDraft: pendingPricingSnapshotDraft ?? null,
      onPendingSnapshotDraftChange: (draft: AdminRepairCreateInput['pricingSnapshotDraft']) => {
        setPendingPricingSnapshotDraft(draft);
        setFieldErrors((current) => ({ ...current, quotedPrice: undefined }));
      },
      onUseSuggestedPrice: (value: number) => {
        setQuotedPrice(formatSuggestedPriceInput(value));
        setFieldErrors((current) => ({ ...current, quotedPrice: undefined }));
      },
    },
    notesProps: {
      value: notes,
      onChange: (value: string) => setNotes(value),
    },
    submitSectionProps: {
      devicePreview,
      customerName,
      resolvedIssue,
      quotedPriceValue: resolvedQuotedPrice.value,
      submitting: submitting || pricingLoading,
    },
    reloadCatalog: () => setCatalogReloadToken((current) => current + 1),
    onSubmit: (event: FormEvent<HTMLFormElement>) => void handleSubmit(event),
  };
}
