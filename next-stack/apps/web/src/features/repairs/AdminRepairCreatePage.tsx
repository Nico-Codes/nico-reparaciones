import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Calculator } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { TextAreaField } from '@/components/ui/textarea-field';
import { adminApi } from '@/features/admin/api';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { repairsApi, type AdminRepairCreateInput } from './api';
import { money } from './repair-ui';
import { buildRepairPricingInput, formatSuggestedPriceInput, pricingRuleModeLabel } from './repair-pricing';
import { RepairProviderPartPricingSection } from './RepairProviderPartPricingSection';

type DeviceTypeItem = { id: string; name: string; slug: string; active: boolean };
type BrandItem = { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean };
type ModelItem = { id: string; brandId: string; deviceModelGroupId?: string | null; name: string; slug: string; active: boolean; brand: { id: string; name: string; slug: string } };
type IssueItem = { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean };

type FormErrors = Partial<Record<'customerName' | 'customerPhone' | 'quotedPrice', string>>;

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizePhone(value: string) {
  return value.replace(/\D+/g, '');
}

function validatePhone(value: string) {
  const digits = normalizePhone(value);
  if (!digits) return '';
  if (digits.length < 6) return 'Ingresá un teléfono válido con al menos 6 dígitos.';
  if (digits.length > 20) return 'El teléfono no puede superar los 20 dígitos.';
  return '';
}

function parseOptionalMoney(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return { value: null, error: '' };
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, error: 'Ingresá un importe válido mayor o igual a 0.' };
  }
  return { value: parsed, error: '' };
}

export function AdminRepairCreatePage() {
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
  const [pricingResult, setPricingResult] = useState<Awaited<ReturnType<typeof repairsApi.pricingResolve>> | null>(null);
  const [pricingResolvedKey, setPricingResolvedKey] = useState('');
  const [pricingTouched, setPricingTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
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
        setCatalogError(error instanceof Error ? error.message : 'No pudimos cargar el catálogo.');
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
        setCatalogError(error instanceof Error ? error.message : 'No pudimos cargar el catálogo de marcas y fallas.');
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

  const deviceTypeOptions = useMemo(
    () => [{ value: '', label: 'No usar catálogo' }, ...deviceTypes.map((item) => ({ value: item.id, label: item.name }))],
    [deviceTypes],
  );
  const brandOptions = useMemo(
    () => [{ value: '', label: 'Marca manual' }, ...brands.map((item) => ({ value: item.id, label: item.name }))],
    [brands],
  );
  const modelOptions = useMemo(
    () => [{ value: '', label: 'Modelo manual' }, ...models.map((item) => ({ value: item.id, label: item.name }))],
    [models],
  );
  const issueOptions = useMemo(
    () => [{ value: '', label: 'Falla manual' }, ...issues.map((item) => ({ value: item.id, label: item.name }))],
    [issues],
  );

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
  const resolvedQuotedPrice = parseOptionalMoney(quotedPrice);
  const catalogBusy = loadingTypes || loadingBrands || loadingModels || loadingIssues;
  const devicePreview = [resolvedBrand, resolvedModel].filter(Boolean).join(' ') || 'Pendiente de definir';
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

  function validate() {
    const nextErrors: FormErrors = {};

    if (customerName.trim().length < 2) {
      nextErrors.customerName = 'Ingresá al menos 2 caracteres para identificar al cliente.';
    }

    const phoneError = validatePhone(customerPhone);
    if (phoneError) {
      nextErrors.customerPhone = phoneError;
    }

    if (resolvedQuotedPrice.error) {
      nextErrors.quotedPrice = resolvedQuotedPrice.error;
    }

    if (pendingPricingSnapshotDraft && resolvedQuotedPrice.value == null) {
      nextErrors.quotedPrice = 'Define un presupuesto antes de guardar un snapshot aplicado.';
    }

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
      setPricingError(error instanceof Error ? error.message : 'No pudimos calcular una sugerencia automática.');
    } finally {
      if (requestId === pricingRequestId.current) setPricingLoading(false);
    }
  }

  function useSuggestedPrice() {
    if (suggestedTotal == null) return;
    setQuotedPrice(formatSuggestedPriceInput(suggestedTotal));
    setFieldErrors((current) => ({ ...current, quotedPrice: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitError('');

    if (!validate()) return;

    const payload: AdminRepairCreateInput = {
      customerName: customerName.trim(),
      customerPhone: normalizeNullable(customerPhone),
      deviceTypeId: normalizeNullable(deviceTypeId),
      deviceBrandId: normalizeNullable(deviceBrandId),
      deviceModelId: normalizeNullable(deviceModelId),
      deviceIssueTypeId: normalizeNullable(deviceIssueTypeId),
      deviceBrand: resolvedBrand,
      deviceModel: resolvedModel,
      issueLabel: resolvedIssue,
      quotedPrice: resolvedQuotedPrice.value,
      notes: normalizeNullable(notes),
      pricingSnapshotDraft: pendingPricingSnapshotDraft,
    };

    setSubmitting(true);
    try {
      const created = await repairsApi.adminCreate(payload);
      navigate(`/admin/repairs/${encodeURIComponent(created.id)}`, {
        replace: true,
        state: { notice: 'Reparación creada correctamente.' },
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No pudimos crear la reparación.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell context="admin" className="space-y-5" data-admin-repair-create-page>
      <PageHeader
        context="admin"
        eyebrow="Servicio técnico"
        title="Nueva reparación"
        subtitle="Ingresá el caso con los datos mínimos y, si querés, vincularlo al catálogo técnico activo."
        actions={(
          <>
            <StatusBadge label="Alta manual" tone="info" />
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/repairs">
                <ArrowLeft className="h-4 w-4" />
                Volver al listado
              </Link>
            </Button>
          </>
        )}
      />

      {submitError ? (
        <div className="ui-alert ui-alert--danger" data-reveal>
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No se pudo crear la reparación</span>
            <div className="ui-alert__text">{submitError}</div>
          </div>
        </div>
      ) : null}

      {catalogError ? (
        <div className="ui-alert ui-alert--warning" data-reveal>
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Catálogo parcial</span>
            <div className="ui-alert__text">{catalogError} Podés continuar con carga manual de marca, modelo y falla.</div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto self-start"
            disabled={catalogBusy || submitting}
            onClick={() => setCatalogReloadToken((current) => current + 1)}
          >
            Reintentar
          </Button>
        </div>
      ) : null}

      <form className="repair-create-stack" onSubmit={(event) => void handleSubmit(event)}>
        <div className="account-stack">
          <SectionCard
            title="Datos básicos"
            description="Cargá lo mínimo para abrir rápido el caso: cliente, equipo y referencia visible."
            actions={<StatusBadge label="Paso 1" tone="neutral" size="sm" />}
            className="repair-create-card"
            bodyClassName="space-y-5"
            data-admin-repair-create-basic
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <TextField
                label="Nombre del cliente *"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Ej: Nicolas Perez"
                autoComplete="name"
                error={fieldErrors.customerName}
                maxLength={190}
                disabled={submitting}
              />
              <TextField
                label="Teléfono"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="Ej: 11 5555-1234"
                autoComplete="tel"
                inputMode="tel"
                error={fieldErrors.customerPhone}
                hint="Opcional. Si lo cargás, validamos un mínimo de 6 dígitos."
                maxLength={60}
                disabled={submitting}
              />
              <div className="ui-field">
                <span className="ui-field__label">Tipo de equipo</span>
                <CustomSelect
                  value={deviceTypeId}
                  onChange={setDeviceTypeId}
                  options={deviceTypeOptions}
                  disabled={loadingTypes || submitting}
                  className="w-full"
                  triggerClassName="min-h-11 rounded-[1rem]"
                  ariaLabel="Seleccionar tipo de equipo"
                />
                <span className="ui-field__hint">Podés omitirlo y cargar la marca y el modelo en forma manual.</span>
              </div>
              <div className="ui-field">
                <span className="ui-field__label">Marca exacta del catálogo</span>
                <CustomSelect
                  value={deviceBrandId}
                  onChange={setDeviceBrandId}
                  options={brandOptions}
                  disabled={loadingBrands || submitting}
                  className="w-full"
                  triggerClassName="min-h-11 rounded-[1rem]"
                  ariaLabel="Seleccionar marca exacta del catálogo"
                />
                <span className="ui-field__hint">Ayuda al cálculo y a la búsqueda de repuestos cuando el equipo existe en el catálogo.</span>
              </div>
              <div className="ui-field">
                <span className="ui-field__label">Modelo exacto del catálogo</span>
                <CustomSelect
                  value={deviceModelId}
                  onChange={setDeviceModelId}
                  options={modelOptions}
                  disabled={loadingModels || !deviceBrandId || submitting}
                  className="w-full"
                  triggerClassName="min-h-11 rounded-[1rem]"
                  ariaLabel="Seleccionar modelo exacto del catálogo"
                />
                <span className="ui-field__hint">Se habilita cuando elegís una marca exacta y mejora la precisión del cálculo.</span>
              </div>
              <TextField
                label="Marca visible"
                value={deviceBrand}
                onChange={(event) => setDeviceBrand(event.target.value)}
                placeholder="Ej: Samsung"
                hint="Si elegís una marca exacta del catálogo, la usamos como valor por defecto."
                maxLength={120}
                disabled={submitting}
              />
              <TextField
                label="Modelo visible"
                value={deviceModel}
                onChange={(event) => setDeviceModel(event.target.value)}
                placeholder="Ej: Galaxy A32"
                hint="Podés dejarlo manual aunque uses catálogo."
                maxLength={120}
                disabled={submitting}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Diagnóstico rápido"
            description="Definí la falla, cargá un presupuesto manual si ya lo conocés y usá la sugerencia automática solo si te sirve."
            actions={(
              <>
                <StatusBadge label="Paso 2" tone="neutral" size="sm" />
                <StatusBadge label={pricingBadge.label} tone={pricingBadge.tone} size="sm" />
              </>
            )}
            className="repair-create-card"
            bodyClassName="space-y-5"
            data-admin-repair-create-diagnosis
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="ui-field">
                <span className="ui-field__label">Falla del catálogo</span>
                <CustomSelect
                  value={deviceIssueTypeId}
                  onChange={setDeviceIssueTypeId}
                  options={issueOptions}
                  disabled={loadingIssues || submitting}
                  className="w-full"
                  triggerClassName="min-h-11 rounded-[1rem]"
                  ariaLabel="Seleccionar falla del catálogo"
                />
                <span className="ui-field__hint">Si no la encontrás, usá el texto libre de la derecha.</span>
              </div>
              <TextField
                label="Falla o texto libre"
                value={issueLabel}
                onChange={(event) => setIssueLabel(event.target.value)}
                placeholder="Ej: Módulo roto / no carga"
                maxLength={190}
                hint="Podés dejarlo manual aunque selecciones una falla del catálogo."
                disabled={submitting}
              />
              <TextField
                label="Presupuesto cargado"
                value={quotedPrice}
                onChange={(event) => setQuotedPrice(event.target.value)}
                placeholder="Ej: 25000"
                inputMode="decimal"
                error={fieldErrors.quotedPrice}
                hint="Editable. Solo se usa el sugerido si vos lo confirmás."
                disabled={submitting}
              />
              <div className="summary-box">
                <div className="summary-box__label">Presupuesto sugerido</div>
                <div className="summary-box__value">
                  {activePricingResult?.matched && activePricingResult.suggestion
                    ? money(activePricingResult.suggestion.suggestedTotal, 'Sin sugerencia')
                    : 'Sin sugerencia'}
                </div>
                <div className="summary-box__hint">
                  {activePricingResult?.matched && activePricingResult.rule
                    ? `${activePricingResult.rule.name} · ${pricingRuleModeLabel(activePricingResult)}`
                    : pricingInput.canResolve
                      ? 'Calcula una sugerencia con las reglas actuales.'
                      : pricingInput.reason}
                </div>
              </div>
            </div>

            {!pricingInput.canResolve ? (
              <div className="ui-alert ui-alert--info">
                <Calculator className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <span className="ui-alert__title">Datos insuficientes para calcular</span>
                  <div className="ui-alert__text">{pricingInput.reason}</div>
                </div>
              </div>
            ) : pricingLoading ? (
              <LoadingBlock label="Calculando presupuesto sugerido" lines={3} />
            ) : activePricingError ? (
              <div className="ui-alert ui-alert--danger">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <span className="ui-alert__title">No pudimos calcular la sugerencia</span>
                  <div className="ui-alert__text">{activePricingError}</div>
                </div>
              </div>
            ) : pricingNeedsRefresh ? (
              <div className="ui-alert ui-alert--warning">
                <Calculator className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <span className="ui-alert__title">La sugerencia quedó vieja</span>
                  <div className="ui-alert__text">Recalculá para que coincida con el equipo y la falla que estás cargando ahora.</div>
                </div>
              </div>
            ) : activePricingResult && !activePricingResult.matched ? (
              <div className="ui-alert ui-alert--warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <span className="ui-alert__title">No encontramos una regla aplicable</span>
                  <div className="ui-alert__text">Podés seguir con un presupuesto manual o ajustar marca, modelo y falla antes de recalcular.</div>
                </div>
              </div>
            ) : null}

            {activePricingResult?.matched && activePricingResult.suggestion ? (
              <details className="nr-disclosure">
                <summary className="nr-disclosure__summary">
                  <span className="nr-disclosure__title">Ver detalle de la regla aplicada</span>
                  <span className="nr-disclosure__meta">{pricingRuleModeLabel(activePricingResult)}</span>
                </summary>
                <div className="nr-disclosure__body">
                  <div className="fact-list">
                    <div className="fact-row">
                      <div className="fact-label">Base</div>
                      <div className="fact-value">{money(activePricingResult.suggestion.basePrice, 'Sin base')}</div>
                    </div>
                    <div className="fact-row">
                      <div className="fact-label">Margen / total</div>
                      <div className="fact-value fact-value--text">
                        {activePricingResult.suggestion.calcMode === 'FIXED_TOTAL'
                          ? 'Total fijo definido por regla'
                          : `${activePricingResult.suggestion.profitPercent}%${activePricingResult.suggestion.minProfit != null ? ` · mínimo $ ${activePricingResult.suggestion.minProfit.toLocaleString('es-AR')}` : ''}`}
                      </div>
                    </div>
                    <div className="fact-row">
                      <div className="fact-label">Piso / envío</div>
                      <div className="fact-value fact-value--text">
                        {activePricingResult.suggestion.minFinalPrice != null ? `Piso $ ${activePricingResult.suggestion.minFinalPrice.toLocaleString('es-AR')}` : 'Sin piso'}
                        {activePricingResult.suggestion.shippingFee != null ? ` · Envío $ ${activePricingResult.suggestion.shippingFee.toLocaleString('es-AR')}` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void recalculateSuggestedPrice()}
                disabled={!pricingInput.canResolve || pricingLoading || submitting}
                data-admin-repair-create-calc
              >
                {pricingLoading ? 'Calculando...' : activePricingResult || pricingNeedsRefresh ? 'Recalcular' : 'Calcular sugerido'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={useSuggestedPrice}
                disabled={!canUseSuggested || pricingLoading || submitting}
                data-admin-repair-create-use-suggested
              >
                Usar sugerido
              </Button>
            </div>
          </SectionCard>

          <div data-admin-repair-create-provider-part>
            <RepairProviderPartPricingSection
              mode="create"
              compactMode
              hydrateKey="repair-create"
              technicalContext={{
                deviceTypeId,
                deviceBrandId,
                deviceModelGroupId: selectedModel?.deviceModelGroupId ?? null,
                deviceModelId,
                deviceIssueTypeId,
                deviceBrand: resolvedBrand,
                deviceModel: resolvedModel,
                issueLabel: resolvedIssue,
              }}
              quotedPriceValue={resolvedQuotedPrice.value}
              disabled={submitting || pricingLoading}
              pendingSnapshotDraft={pendingPricingSnapshotDraft ?? null}
              onPendingSnapshotDraftChange={(draft) => {
                setPendingPricingSnapshotDraft(draft);
                setFieldErrors((current) => ({ ...current, quotedPrice: undefined }));
              }}
              onUseSuggestedPrice={(value) => {
                setQuotedPrice(formatSuggestedPriceInput(value));
                setFieldErrors((current) => ({ ...current, quotedPrice: undefined }));
              }}
            />
          </div>

          <details className="nr-disclosure nr-disclosure--full" data-admin-repair-create-optional>
            <summary className="nr-disclosure__summary">
              <span className="nr-disclosure__title">Notas internas</span>
              <span className="nr-disclosure__meta">Opcional</span>
            </summary>
            <div className="nr-disclosure__body">
              <TextAreaField
                label="Notas internas"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={5}
                placeholder="Ej: ingresa con funda, sin cargador, pantalla encendida, pero táctil intermitente."
                maxLength={2000}
                disabled={submitting}
              />
            </div>
          </details>
        </div>

        <SectionCard
          tone="muted"
          title="Listo para crear"
          description="La reparación se crea en estado Recibido. Podés seguir solo con texto libre o aplicar catálogo, sugerencia y snapshot si te sirven."
          className="repair-create-card"
        >
          <div className="repair-create-footer">
            <div className="repair-create-footer__summary">
              <span className="repair-create-footer__eyebrow">Resumen rápido</span>
              <div className="repair-create-footer__title">{devicePreview}</div>
              <div className="repair-create-footer__meta">
                {customerName.trim() || 'Cliente pendiente'} · {resolvedIssue || 'Falla pendiente'} ·{' '}
                {resolvedQuotedPrice.value != null ? `$ ${resolvedQuotedPrice.value.toLocaleString('es-AR')}` : 'Sin presupuesto cargado'}
              </div>
            </div>
            <div className="repair-create-footer__actions">
              <Button asChild variant="outline" disabled={submitting}>
                <Link to="/admin/repairs">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={submitting || pricingLoading} data-admin-repair-create-submit>
                {submitting ? 'Creando reparación...' : 'Crear reparación'}
              </Button>
            </div>
          </div>
        </SectionCard>
      </form>
    </PageShell>
  );
}
