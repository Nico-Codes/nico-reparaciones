import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, AlertTriangle, ShieldCheck, Wrench } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
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
import {
  AdminRepairDetailEditSection,
  AdminRepairDetailSidebar,
  AdminRepairDetailStatsGrid,
  AdminRepairDetailStatusSection,
  AdminRepairDetailSuggestedPricingSection,
} from './admin-repair-detail.sections';
import { buildRepairPricingInput, formatSuggestedPriceInput } from './repair-pricing';
import { RepairProviderPartPricingSection } from './RepairProviderPartPricingSection';
import { formatDateTime, repairCode, repairStatusLabel, repairStatusSummary, repairStatusTone } from './repair-ui';
import type { RepairItem, RepairPricingSnapshotItem, RepairTimelineEvent } from './types';

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
  const [pricingResult, setPricingResult] = useState<RepairPricingResolveResult | null>(null);
  const [pricingResolvedKey, setPricingResolvedKey] = useState('');
  const [pricingTouched, setPricingTouched] = useState(false);
  const [notice, setNotice] = useState(locationNotice);
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
              <a href={`/admin/repairs/${encodeURIComponent(item.id)}/print`} target="_blank" rel="noreferrer">
                Imprimir
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/admin/repairs/${encodeURIComponent(item.id)}/ticket`} target="_blank" rel="noreferrer">
                Ticket
              </a>
            </Button>
          </>
        }
      />

      <AdminRepairDetailStatsGrid summary={summary} />

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
          <AdminRepairDetailStatusSection
            status={item.status}
            statusLabel={statusLabel}
            statusSummary={statusSummary}
            deviceLabel={deviceLabel}
            issueLabel={issueLabel}
          />

          <AdminRepairDetailEditSection
            values={formValues}
            fieldErrors={fieldErrors}
            saving={saving}
            pricingLoading={pricingLoading}
            hasChanges={hasChanges}
            onCustomerNameChange={setCustomerName}
            onCustomerPhoneChange={setCustomerPhone}
            onDeviceBrandChange={setDeviceBrand}
            onDeviceModelChange={setDeviceModel}
            onIssueLabelChange={setIssueLabel}
            onStatusChange={setStatus}
            onQuotedPriceChange={setQuotedPrice}
            onFinalPriceChange={setFinalPrice}
            onNotesChange={setNotes}
            onSave={() => void saveChanges()}
          />

          <AdminRepairDetailSuggestedPricingSection
            pricingInputState={pricingInput}
            pricingBadge={pricingBadge}
            pricingLoading={pricingLoading}
            activePricingError={activePricingError}
            pricingNeedsRefresh={pricingNeedsRefresh}
            activePricingResult={activePricingResult}
            quotedPriceValue={parsedQuotedPrice.value}
            canUseSuggested={canUseSuggested}
            saving={saving}
            onRecalculate={() => void recalculateSuggestedPrice()}
            onUseSuggested={useSuggestedPrice}
          />

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

        <AdminRepairDetailSidebar item={item} code={code} statusLabel={statusLabel} timeline={timeline} />
      </div>
    </PageShell>
  );
}
