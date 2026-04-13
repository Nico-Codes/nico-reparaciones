import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/features/admin/api';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { repairsApi, type AdminRepairCreateInput, type RepairPricingResolveResult } from './api';
import {
  buildRepairCreateDevicePreview,
  buildRepairCreatePayload,
  parseOptionalMoney,
  validateRepairCreateForm,
  type AdminRepairCreateFormErrors,
} from './admin-repair-create.helpers';
import { buildRepairPricingInput, formatSuggestedPriceInput } from './repair-pricing';
import { useAdminRepairCreateCatalog } from './use-admin-repair-create-catalog';
import { useAdminRepairCreatePricing } from './use-admin-repair-create-pricing';

export function useAdminRepairCreate() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
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
  const resolvedQuotedPrice = useMemo(() => parseOptionalMoney(quotedPrice), [quotedPrice]);
  const {
    loadingTypes,
    loadingBrands,
    loadingModels,
    loadingIssues,
    catalogError,
    catalogBusy,
    deviceTypeOptions,
    brandOptions,
    modelOptions,
    issueOptions,
    selectedModel,
    resolvedBrand,
    resolvedModel,
    resolvedIssue,
    reloadCatalog,
  } = useAdminRepairCreateCatalog({
    deviceTypeId,
    deviceBrandId,
    deviceModelId,
    deviceIssueTypeId,
    deviceBrand,
    deviceModel,
    issueLabel,
    setDeviceBrandId,
    setDeviceModelId,
    setDeviceIssueTypeId,
    setDeviceBrand,
    setDeviceModel,
    setIssueLabel,
  });
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

  const {
    pricingLoading,
    activePricingError,
    activePricingResult,
    pricingNeedsRefresh,
    canUseSuggested,
    pricingBadge,
    recalculateSuggestedPrice,
    useSuggestedPrice,
  } = useAdminRepairCreatePricing({
    pricingInput,
    quotedPriceValue: resolvedQuotedPrice.value,
    submitting,
    setQuotedPrice,
    setFieldErrors,
  });

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
    reloadCatalog,
    onSubmit: (event: FormEvent<HTMLFormElement>) => void handleSubmit(event),
  };
}
