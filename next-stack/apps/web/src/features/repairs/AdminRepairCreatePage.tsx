import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { TextAreaField } from '@/components/ui/textarea-field';
import { adminApi } from '@/features/admin/api';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { repairsApi, type AdminRepairCreateInput } from './api';

type DeviceTypeItem = { id: string; name: string; slug: string; active: boolean };
type BrandItem = { id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean };
type ModelItem = { id: string; brandId: string; name: string; slug: string; active: boolean; brand: { id: string; name: string; slug: string } };
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
  if (digits.length < 6) return 'Ingresa un telefono valido con al menos 6 digitos.';
  if (digits.length > 20) return 'El telefono no puede superar los 20 digitos.';
  return '';
}

function parseOptionalMoney(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return { value: null, error: '' };
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, error: 'Ingresa un importe valido mayor o igual a 0.' };
  }
  return { value: parsed, error: '' };
}

export function AdminRepairCreatePage() {
  const navigate = useNavigate();
  const catalogRequestId = useRef(0);
  const modelRequestId = useRef(0);
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
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

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

  const deviceTypeOptions = useMemo(
    () => [{ value: '', label: 'No usar catalogo' }, ...deviceTypes.map((item) => ({ value: item.id, label: item.name }))],
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

  function validate() {
    const nextErrors: FormErrors = {};

    if (customerName.trim().length < 2) {
      nextErrors.customerName = 'Ingresa al menos 2 caracteres para identificar al cliente.';
    }

    const phoneError = validatePhone(customerPhone);
    if (phoneError) {
      nextErrors.customerPhone = phoneError;
    }

    if (resolvedQuotedPrice.error) {
      nextErrors.quotedPrice = resolvedQuotedPrice.error;
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
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
    };

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

  return (
    <PageShell context="admin" className="space-y-5" data-admin-repair-create-page>
      <PageHeader
        context="admin"
        eyebrow="Servicio tecnico"
        title="Nueva reparacion"
        subtitle="Ingresa el caso con los datos minimos y, si queres, vinculado al catalogo tecnico activo."
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
            <span className="ui-alert__title">No se pudo crear la reparacion</span>
            <div className="ui-alert__text">{submitError}</div>
          </div>
        </div>
      ) : null}

      {catalogError ? (
        <div className="ui-alert ui-alert--warning" data-reveal>
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Catalogo parcial</span>
            <div className="ui-alert__text">{catalogError} Podes continuar con carga manual de marca, modelo y falla.</div>
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

      <form className="account-layout" onSubmit={(event) => void handleSubmit(event)}>
        <div className="account-stack">
          <SectionCard
            title="Cliente y equipo"
            description="Datos principales del caso. Solo el nombre del cliente es obligatorio."
            actions={<StatusBadge label="Paso 1" tone="neutral" size="sm" />}
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
                label="Telefono"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="Ej: 11 5555-1234"
                autoComplete="tel"
                inputMode="tel"
                error={fieldErrors.customerPhone}
                hint="Opcional. Si lo cargas, validamos un minimo de 6 digitos."
                maxLength={60}
                disabled={submitting}
              />
              <TextField
                label="Marca visible"
                value={deviceBrand}
                onChange={(event) => setDeviceBrand(event.target.value)}
                placeholder="Ej: Samsung"
                hint="Si eliges una marca del catalogo, la usamos como valor por defecto."
                maxLength={120}
                disabled={submitting}
              />
              <TextField
                label="Modelo visible"
                value={deviceModel}
                onChange={(event) => setDeviceModel(event.target.value)}
                placeholder="Ej: Galaxy A32"
                hint="Puedes dejarlo manual aunque uses catalogo."
                maxLength={120}
                disabled={submitting}
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
              <TextField
                label="Falla reportada"
                value={issueLabel}
                onChange={(event) => setIssueLabel(event.target.value)}
                placeholder="Ej: Modulo roto / no carga"
                maxLength={190}
                disabled={submitting}
              />
              <TextField
                label="Presupuesto inicial"
                value={quotedPrice}
                onChange={(event) => setQuotedPrice(event.target.value)}
                placeholder="Ej: 25000"
                inputMode="decimal"
                error={fieldErrors.quotedPrice}
                hint="Opcional. El detalle siempre puede ajustarse luego."
                disabled={submitting}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Catalogo tecnico opcional"
            description="Vincula tipo, marca, modelo y falla para dejar el caso mejor clasificado desde el ingreso."
            actions={<StatusBadge label="Paso 2" tone="neutral" size="sm" />}
          >
            <div className="grid gap-4 lg:grid-cols-2">
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
                <span className="ui-field__hint">Puedes omitirlo y cargar el caso solo con texto libre.</span>
              </div>
              <div className="ui-field">
                <span className="ui-field__label">Marca de catalogo</span>
                <CustomSelect
                  value={deviceBrandId}
                  onChange={setDeviceBrandId}
                  options={brandOptions}
                  disabled={loadingBrands || submitting}
                  className="w-full"
                  triggerClassName="min-h-11 rounded-[1rem]"
                  ariaLabel="Seleccionar marca de catalogo"
                />
              </div>
              <div className="ui-field">
                <span className="ui-field__label">Modelo de catalogo</span>
                <CustomSelect
                  value={deviceModelId}
                  onChange={setDeviceModelId}
                  options={modelOptions}
                  disabled={loadingModels || !deviceBrandId || submitting}
                  className="w-full"
                  triggerClassName="min-h-11 rounded-[1rem]"
                  ariaLabel="Seleccionar modelo de catalogo"
                />
              </div>
              <div className="ui-field">
                <span className="ui-field__label">Falla de catalogo</span>
                <CustomSelect
                  value={deviceIssueTypeId}
                  onChange={setDeviceIssueTypeId}
                  options={issueOptions}
                  disabled={loadingIssues || submitting}
                  className="w-full"
                  triggerClassName="min-h-11 rounded-[1rem]"
                  ariaLabel="Seleccionar falla de catalogo"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Observaciones"
            description="Anota sintomas, accesorios recibidos o cualquier contexto util para el seguimiento interno."
            actions={<StatusBadge label="Paso 3" tone="neutral" size="sm" />}
          >
            <TextAreaField
              label="Notas internas"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={6}
              placeholder="Ej: ingresa con funda, sin cargador, pantalla encendida pero tactil intermitente."
              maxLength={2000}
              disabled={submitting}
            />
          </SectionCard>
        </div>

        <div className="account-stack account-sticky">
          <SectionCard
            title="Resumen de alta"
            description="Antes de guardar, revisa como quedara identificado el caso."
            actions={<StatusBadge label="Vista previa" tone="neutral" size="sm" />}
          >
            <div className="summary-box">
              <div className="summary-box__label">Equipo informado</div>
              <div className="summary-box__value">{devicePreview}</div>
              <div className="summary-box__hint">{resolvedIssue || 'Falla pendiente de definicion'}</div>
            </div>

            <div className="fact-list mt-4">
              <div className="fact-row">
                <div className="fact-label">Cliente</div>
                <div className="fact-value fact-value--text">{customerName.trim() || 'Pendiente de cargar'}</div>
              </div>
              <div className="fact-row">
                <div className="fact-label">Telefono</div>
                <div className="fact-value fact-value--text">{normalizeNullable(customerPhone) ?? 'Sin telefono'}</div>
              </div>
              <div className="fact-row">
                <div className="fact-label">Presupuesto inicial</div>
                <div className="fact-value">{resolvedQuotedPrice.value != null ? `$ ${resolvedQuotedPrice.value.toLocaleString('es-AR')}` : 'Sin definir'}</div>
              </div>
              <div className="fact-row">
                <div className="fact-label">Ingreso</div>
                <div className="fact-value">Estado inicial: Recibido</div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            tone="muted"
            title="Accion"
            description="La reparacion se crea en estado Recibido y despues puedes completar seguimiento, precios o garantia."
          >
            <div className="ui-alert ui-alert--info">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
              <div>
                <span className="ui-alert__title">Alta inmediata</span>
                <div className="ui-alert__text">
                  Si el catalogo no esta disponible, puedes seguir con marca, modelo y falla manuales. Los IDs de catalogo solo se envian cuando se
                  seleccionan de forma explicita.
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <Button asChild variant="outline" disabled={submitting}>
                <Link to="/admin/repairs">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={submitting} data-admin-repair-create-submit>
                {submitting ? 'Creando reparacion...' : 'Crear reparacion'}
              </Button>
            </div>
          </SectionCard>
        </div>
      </form>
    </PageShell>
  );
}
