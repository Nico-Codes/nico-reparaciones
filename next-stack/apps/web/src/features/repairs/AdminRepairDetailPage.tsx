import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, AlertTriangle, Calculator, Clock3, ShieldCheck, Wrench } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { TextAreaField } from '@/components/ui/textarea-field';
import { repairsApi } from './api';
import { buildRepairPricingInput, formatSuggestedPriceInput, pricingRuleModeLabel } from './repair-pricing';
import { RepairProviderPartPricingSection } from './RepairProviderPartPricingSection';
import {
  formatDateTime,
  money,
  repairCode,
  repairProgressSteps,
  repairStatusLabel,
  repairStatusSummary,
  repairStatusTone,
} from './repair-ui';
import type { RepairItem, RepairPricingSnapshotItem, RepairTimelineEvent } from './types';

const STATUS_OPTIONS = ['RECEIVED', 'DIAGNOSING', 'WAITING_APPROVAL', 'REPAIRING', 'READY_PICKUP', 'DELIVERED', 'CANCELLED'].map((status) => ({
  value: status,
  label: repairStatusLabel(status),
}));

type FormErrors = Partial<Record<'customerName' | 'customerPhone' | 'quotedPrice' | 'finalPrice', string>>;

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

function parseOptionalMoney(value: string, fieldLabel: string) {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return { value: null, error: '' };
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, error: `Ingresa un ${fieldLabel.toLowerCase()} valido mayor o igual a 0.` };
  }
  return { value: parsed, error: '' };
}

function eventTypeLabel(eventType: string) {
  switch (eventType) {
    case 'CREATED':
      return 'Alta del caso';
    case 'UPDATED':
      return 'Edicion manual';
    case 'STATUS_CHANGED':
      return 'Cambio de estado';
    default:
      return eventType;
  }
}

function sameNullableString(left: string | null, right: string | null) {
  return (left ?? null) === (right ?? null);
}

export function AdminRepairDetailPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const locationNotice =
    typeof location.state === 'object' && location.state && 'notice' in location.state && typeof location.state.notice === 'string'
      ? location.state.notice
      : '';

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
  const [pricingResult, setPricingResult] = useState<Awaited<ReturnType<typeof repairsApi.pricingResolve>> | null>(null);
  const [pricingResolvedKey, setPricingResolvedKey] = useState('');
  const [pricingTouched, setPricingTouched] = useState(false);
  const [notice, setNotice] = useState(locationNotice);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [pendingPricingSnapshotDraft, setPendingPricingSnapshotDraft] = useState<Parameters<typeof repairsApi.adminUpdate>[1]['pricingSnapshotDraft']>(
    null,
  );
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

  const parsedQuotedPrice = useMemo(() => parseOptionalMoney(quotedPrice, 'presupuesto'), [quotedPrice]);
  const parsedFinalPrice = useMemo(() => parseOptionalMoney(finalPrice, 'precio final'), [finalPrice]);

  const summary = useMemo(() => ({
    quoted: parsedQuotedPrice.value,
    final: parsedFinalPrice.value,
    timelineCount: timeline.length,
  }), [parsedFinalPrice.value, parsedQuotedPrice.value, timeline.length]);

  const normalizedDraft = useMemo(() => ({
    customerName: customerName.trim(),
    customerPhone: normalizeNullable(customerPhone),
    deviceBrand: normalizeNullable(deviceBrand),
    deviceModel: normalizeNullable(deviceModel),
    issueLabel: normalizeNullable(issueLabel),
    status,
    quotedPrice: parsedQuotedPrice.value,
    finalPrice: parsedFinalPrice.value,
    notes: normalizeNullable(notes),
  }), [customerName, customerPhone, deviceBrand, deviceModel, issueLabel, status, parsedQuotedPrice.value, parsedFinalPrice.value, notes]);
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
    [item?.deviceTypeId, item?.deviceBrandId, item?.deviceModelId, item?.deviceIssueTypeId, normalizedDraft.deviceBrand, normalizedDraft.deviceModel, normalizedDraft.issueLabel],
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

  const hasChanges = useMemo(() => {
    if (!item) return false;
    return !(
      item.customerName === normalizedDraft.customerName &&
      sameNullableString(item.customerPhone, normalizedDraft.customerPhone) &&
      sameNullableString(item.deviceBrand, normalizedDraft.deviceBrand) &&
      sameNullableString(item.deviceModel, normalizedDraft.deviceModel) &&
      sameNullableString(item.issueLabel, normalizedDraft.issueLabel) &&
      item.status === normalizedDraft.status &&
      item.quotedPrice === normalizedDraft.quotedPrice &&
      item.finalPrice === normalizedDraft.finalPrice &&
      sameNullableString(item.notes, normalizedDraft.notes) &&
      !pendingPricingSnapshotDraft
    );
  }, [item, normalizedDraft, pendingPricingSnapshotDraft]);

  function validate() {
    const nextErrors: FormErrors = {};

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
      setPricingError(cause instanceof Error ? cause.message : 'No pudimos calcular una sugerencia automática.');
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

    const patch: Parameters<typeof repairsApi.adminUpdate>[1] = {};

    if (item.customerName !== normalizedDraft.customerName) patch.customerName = normalizedDraft.customerName;
    if (!sameNullableString(item.customerPhone, normalizedDraft.customerPhone)) patch.customerPhone = normalizedDraft.customerPhone;
    if (!sameNullableString(item.deviceBrand, normalizedDraft.deviceBrand)) patch.deviceBrand = normalizedDraft.deviceBrand;
    if (!sameNullableString(item.deviceModel, normalizedDraft.deviceModel)) patch.deviceModel = normalizedDraft.deviceModel;
    if (!sameNullableString(item.issueLabel, normalizedDraft.issueLabel)) patch.issueLabel = normalizedDraft.issueLabel;
    if (item.status !== normalizedDraft.status) patch.status = normalizedDraft.status;
    if (item.quotedPrice !== normalizedDraft.quotedPrice) patch.quotedPrice = normalizedDraft.quotedPrice;
    if (item.finalPrice !== normalizedDraft.finalPrice) patch.finalPrice = normalizedDraft.finalPrice;
    if (!sameNullableString(item.notes, normalizedDraft.notes)) patch.notes = normalizedDraft.notes;
    if (pendingPricingSnapshotDraft) patch.pricingSnapshotDraft = pendingPricingSnapshotDraft;

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

  if (loading) {
    return (
      <PageShell context="admin">
        <PageHeader
          context="admin"
          eyebrow="Reparaciones"
          title="Cargando detalle"
          subtitle="Estamos preparando la informacion completa del caso."
          actions={<StatusBadge label="Cargando" tone="info" />}
        />
        <SectionCard>
          <LoadingBlock label="Cargando reparacion" lines={6} />
        </SectionCard>
      </PageShell>
    );
  }

  if (loadError && !item) {
    return (
      <PageShell context="admin">
        <PageHeader
          context="admin"
          eyebrow="Reparaciones"
          title="Caso no disponible"
          subtitle="No pudimos recuperar el detalle solicitado."
          actions={
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/repairs">
                <ArrowLeft className="h-4 w-4" />
                Volver a reparaciones
              </Link>
            </Button>
          }
        />
        <SectionCard>
          <EmptyState
            icon={<Wrench className="h-5 w-5" />}
            title={loadError}
            description="Vuelve al listado para revisar otro caso o reintenta la carga desde el panel."
            actions={
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void loadDetail(id)}>
                  Reintentar
                </Button>
                <Button asChild>
                  <Link to="/admin/repairs">Ir al listado</Link>
                </Button>
              </div>
            }
          />
        </SectionCard>
      </PageShell>
    );
  }

  if (!item) {
    return (
      <PageShell context="admin">
        <PageHeader
          context="admin"
          eyebrow="Reparaciones"
          title="Caso no encontrado"
          subtitle="El registro solicitado no esta disponible en este momento."
          actions={
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/repairs">Volver a reparaciones</Link>
            </Button>
          }
        />
        <SectionCard>
          <EmptyState
            icon={<AlertTriangle className="h-5 w-5" />}
            title="No encontramos la reparacion"
            description="Revisa el listado completo y abre otro caso desde la tabla principal."
          />
        </SectionCard>
      </PageShell>
    );
  }

  const statusLabel = repairStatusLabel(item.status);
  const statusTone = repairStatusTone(item.status);
  const statusSummary = repairStatusSummary(item.status);
  const code = repairCode(item.id);
  const deviceLabel = [deviceBrand, deviceModel].filter(Boolean).join(' ') || 'Equipo sin identificar';

  return (
    <PageShell context="admin" className="space-y-5" data-admin-repair-detail-page>
      <PageHeader
        context="admin"
        eyebrow="Reparaciones"
        title={`Caso ${code}`}
        subtitle={`${item.customerName || 'Cliente sin nombre'} · ${formatDateTime(item.createdAt)}`}
        actions={
          <>
            <StatusBadge label={statusLabel} tone={statusTone} />
            {hasChanges ? <StatusBadge label="Cambios pendientes" tone="warning" /> : null}
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/repairs">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={`/admin/garantias/crear?repairId=${encodeURIComponent(item.id)}`}>Registrar garantia</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/admin/repairs/${encodeURIComponent(item.id)}/print`} target="_blank" rel="noreferrer">Imprimir</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/admin/repairs/${encodeURIComponent(item.id)}/ticket`} target="_blank" rel="noreferrer">Ticket</a>
            </Button>
          </>
        }
      />

      <div className="nr-stat-grid">
        <div className="nr-stat-card">
          <div className="nr-stat-card__label">Presupuesto</div>
          <div className="nr-stat-card__value">{money(summary.quoted)}</div>
          <div className="nr-stat-card__meta">Valor estimado informado al cliente.</div>
        </div>
        <div className="nr-stat-card">
          <div className="nr-stat-card__label">Precio final</div>
          <div className="nr-stat-card__value">{money(summary.final)}</div>
          <div className="nr-stat-card__meta">Monto confirmado para el cierre.</div>
        </div>
        <div className="nr-stat-card">
          <div className="nr-stat-card__label">Seguimiento</div>
          <div className="nr-stat-card__value">{summary.timelineCount}</div>
          <div className="nr-stat-card__meta">Eventos registrados en el historial.</div>
        </div>
      </div>

      {loadError ? (
        <div className="ui-alert ui-alert--warning" data-reveal>
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No pudimos refrescar el caso</span>
            <div className="ui-alert__text">{loadError}</div>
          </div>
          <Button type="button" size="sm" variant="ghost" className="ml-auto self-start" onClick={() => void loadDetail(item.id, { showLoading: false })}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {saveError ? (
        <div className="ui-alert ui-alert--danger" data-reveal>
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No se pudo completar la accion</span>
            <div className="ui-alert__text">{saveError}</div>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div className="ui-alert ui-alert--success" data-reveal>
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">Cambios guardados</span>
            <div className="ui-alert__text">{notice}</div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.85fr)]">
        <div className="space-y-5">
          <SectionCard
            title="Estado y seguimiento"
            description="Visualiza el avance del caso y el proximo hito esperado para el cliente."
            actions={<StatusBadge label={statusLabel} tone={statusTone} size="sm" />}
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
              <ProgressSteps items={repairProgressSteps(item.status)} />

              <div className="account-stack">
                <div className="summary-box">
                  <div className="summary-box__label">Equipo</div>
                  <div className="mt-2 text-[1.35rem] font-black tracking-tight text-zinc-950">{deviceLabel}</div>
                  <div className="summary-box__hint">{issueLabel || 'Falla pendiente de definicion'}</div>
                </div>

                <div className={`ui-alert ${item.status === 'CANCELLED' ? 'ui-alert--danger' : item.status === 'READY_PICKUP' || item.status === 'DELIVERED' ? 'ui-alert--success' : item.status === 'WAITING_APPROVAL' ? 'ui-alert--warning' : 'ui-alert--info'}`}>
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
                  <div>
                    <span className="ui-alert__title">{statusLabel}</span>
                    <div className="ui-alert__text">{statusSummary}</div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Editar reparacion"
            description="Actualiza solo datos que realmente persisten en el caso: cliente, equipo, diagnostico, estado y precios."
            actions={<StatusBadge label={hasChanges ? 'Cambios pendientes' : 'Sin cambios'} tone={hasChanges ? 'warning' : 'neutral'} size="sm" />}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <TextField
                label="Nombre del cliente"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Ej: Nicolas Perez"
                maxLength={190}
                error={fieldErrors.customerName}
                disabled={saving}
              />
              <TextField
                label="Telefono"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="Ej: 11 5555-1234"
                maxLength={60}
                inputMode="tel"
                error={fieldErrors.customerPhone}
                disabled={saving}
              />
              <TextField
                label="Marca del equipo"
                value={deviceBrand}
                onChange={(event) => setDeviceBrand(event.target.value)}
                placeholder="Ej: Samsung"
                maxLength={120}
                disabled={saving}
              />
              <TextField
                label="Modelo del equipo"
                value={deviceModel}
                onChange={(event) => setDeviceModel(event.target.value)}
                placeholder="Ej: A34"
                maxLength={120}
                disabled={saving}
              />
              <TextField
                label="Falla principal"
                value={issueLabel}
                onChange={(event) => setIssueLabel(event.target.value)}
                placeholder="Ej: Cambio de modulo"
                maxLength={190}
                disabled={saving}
              />
              <div>
                <label className="mb-1 block text-sm font-bold text-zinc-700">Estado del caso</label>
                <CustomSelect
                  value={status}
                  onChange={setStatus}
                  options={STATUS_OPTIONS}
                  disabled={saving}
                  triggerClassName="min-h-10 rounded-xl"
                  ariaLabel="Estado de la reparacion"
                />
              </div>
              <TextField
                label="Presupuesto"
                inputMode="decimal"
                value={quotedPrice}
                onChange={(event) => setQuotedPrice(event.target.value)}
                placeholder="0"
                error={fieldErrors.quotedPrice}
                disabled={saving}
              />
              <TextField
                label="Precio final"
                inputMode="decimal"
                value={finalPrice}
                onChange={(event) => setFinalPrice(event.target.value)}
                placeholder="0"
                error={fieldErrors.finalPrice}
                disabled={saving}
              />
            </div>

            <TextAreaField
              label="Notas y diagnostico"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Detalle del diagnostico, repuestos usados, observaciones y proximos pasos."
              rows={6}
              maxLength={2000}
              wrapperClassName="mt-4"
              disabled={saving}
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" onClick={() => void saveChanges()} disabled={saving || pricingLoading || !hasChanges} data-admin-repair-detail-save>
                {saving ? 'Guardando...' : hasChanges ? 'Guardar cambios' : 'Sin cambios'}
              </Button>
              <Button asChild variant="outline" disabled={saving}>
                <Link to="/admin/repairs">Cancelar</Link>
              </Button>
            </div>
          </SectionCard>

          <SectionCard
            title="Presupuesto sugerido"
            description="Consulta las reglas activas para comparar el presupuesto cargado con una sugerencia calculada."
            actions={<StatusBadge label={pricingBadge.label} tone={pricingBadge.tone} size="sm" />}
          >
            {!pricingInput.canResolve ? (
              <div className="ui-alert ui-alert--info">
                <Calculator className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <span className="ui-alert__title">Datos insuficientes para calcular</span>
                  <div className="ui-alert__text">{pricingInput.reason}</div>
                </div>
              </div>
            ) : pricingLoading ? (
              <LoadingBlock label="Calculando presupuesto sugerido" lines={4} />
            ) : activePricingError ? (
              <div className="ui-alert ui-alert--danger">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <span className="ui-alert__title">No pudimos resolver una sugerencia</span>
                  <div className="ui-alert__text">{activePricingError}</div>
                </div>
              </div>
            ) : pricingNeedsRefresh ? (
              <div className="ui-alert ui-alert--warning">
                <Calculator className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <span className="ui-alert__title">Los datos cambiaron</span>
                  <div className="ui-alert__text">Recalcula la sugerencia para comparar el presupuesto con las reglas activas actuales.</div>
                </div>
              </div>
            ) : activePricingResult?.matched && activePricingResult.suggestion ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="summary-box">
                    <div className="summary-box__label">Presupuesto cargado</div>
                    <div className="summary-box__value">{money(parsedQuotedPrice.value, 'Sin definir')}</div>
                    <div className="summary-box__hint">Es el valor editable del caso antes de guardar cambios.</div>
                  </div>
                  <div className="summary-box">
                    <div className="summary-box__label">Sugerido por reglas</div>
                    <div className="summary-box__value">{money(activePricingResult.suggestion.suggestedTotal, 'Sin sugerencia')}</div>
                    <div className="summary-box__hint">
                      {activePricingResult.rule?.name ?? 'Regla activa'} · {pricingRuleModeLabel(activePricingResult)}
                    </div>
                  </div>
                </div>

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
            ) : activePricingResult ? (
              <div className="ui-alert ui-alert--warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <span className="ui-alert__title">No hay una regla aplicable</span>
                  <div className="ui-alert__text">Puedes seguir con presupuesto manual o ajustar la información del caso y volver a calcular.</div>
                </div>
              </div>
            ) : (
              <div className="ui-alert ui-alert--info">
                <Calculator className="mt-0.5 h-4 w-4 flex-none" />
                <div>
                  <span className="ui-alert__title">Listo para calcular</span>
                  <div className="ui-alert__text">Usa la información actual del caso para comparar tu presupuesto con las reglas activas.</div>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void recalculateSuggestedPrice()}
                disabled={!pricingInput.canResolve || pricingLoading || saving}
                data-admin-repair-detail-calc
              >
                {pricingLoading ? 'Calculando...' : activePricingResult || pricingNeedsRefresh ? 'Recalcular' : 'Calcular sugerido'}
              </Button>
              <Button type="button" variant="secondary" onClick={useSuggestedPrice} disabled={!canUseSuggested || pricingLoading || saving} data-admin-repair-detail-use-suggested>
                Usar sugerido
              </Button>
            </div>
          </SectionCard>

          <RepairProviderPartPricingSection
            mode="detail"
            hydrateKey={`${item.id}:${item.activePricingSnapshotId ?? 'none'}`}
            technicalContext={{
              deviceTypeId: item.deviceTypeId ?? null,
              deviceBrandId: item.deviceBrandId ?? null,
              deviceModelId: item.deviceModelId ?? null,
              deviceIssueTypeId: item.deviceIssueTypeId ?? null,
              deviceBrand: normalizedDraft.deviceBrand,
              deviceModel: normalizedDraft.deviceModel,
              issueLabel: normalizedDraft.issueLabel,
            }}
            quotedPriceValue={parsedQuotedPrice.value}
            disabled={saving || pricingLoading}
            activeSnapshot={item.activePricingSnapshot ?? null}
            snapshotHistory={pricingSnapshots}
            pendingSnapshotDraft={pendingPricingSnapshotDraft ?? null}
            onPendingSnapshotDraftChange={(draft) => {
              setPendingPricingSnapshotDraft(draft);
              setFieldErrors((current) => ({ ...current, quotedPrice: undefined }));
            }}
            onUseSuggestedPrice={(value) => {
              setQuotedPrice(formatSuggestedPriceInput(value));
              setFieldErrors((current) => ({ ...current, quotedPrice: undefined }));
              setNotice('');
            }}
            onStatusMessage={setNotice}
          />
        </div>

        <aside className="account-stack account-sticky">
          <SectionCard title="Resumen del caso" description="Datos administrativos y comerciales relevantes para seguimiento.">
            <div className="fact-list">
              <FactRow label="Codigo" value={code} />
              <FactRow label="Cliente" value={item.customerName || 'Sin nombre'} />
              <FactRow label="Telefono" value={item.customerPhone || 'No informado'} />
              <FactRow label="Ingreso" value={formatDateTime(item.createdAt)} />
              <FactRow label="Ultima actualizacion" value={formatDateTime(item.updatedAt)} />
              <FactRow label="Estado" value={statusLabel} />
            </div>
          </SectionCard>

          <SectionCard title="Historial" description="Eventos registrados para revisar la trazabilidad del caso.">
            {timeline.length === 0 ? (
              <EmptyState
                icon={<Clock3 className="h-5 w-5" />}
                title="Todavia no hay eventos"
                description="El historial se completa automaticamente a medida que se registran cambios en la reparacion."
              />
            ) : (
              <div className="space-y-3">
                {timeline.map((event) => (
                  <div key={event.id} className="detail-panel">
                    <div className="detail-panel__label">{eventTypeLabel(event.eventType)}</div>
                    <div className="detail-panel__value">{event.message || 'Sin detalle adicional.'}</div>
                    <div className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                      {formatDateTime(event.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </aside>
      </div>
    </PageShell>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact-row">
      <div className="fact-label">{label}</div>
      <div className="fact-value fact-value--text">{value}</div>
    </div>
  );
}
