import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, AlertTriangle, Clock3, ShieldCheck, Wrench } from 'lucide-react';
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
import {
  formatDateTime,
  money,
  repairCode,
  repairProgressSteps,
  repairStatusLabel,
  repairStatusSummary,
  repairStatusTone,
} from './repair-ui';
import type { RepairItem, RepairTimelineEvent } from './types';

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
  const [item, setItem] = useState<RepairItem | null>(null);
  const [timeline, setTimeline] = useState<RepairTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState(locationNotice);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
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
      sameNullableString(item.notes, normalizedDraft.notes)
    );
  }, [item, normalizedDraft]);

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

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
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
              <Button type="button" onClick={() => void saveChanges()} disabled={saving || !hasChanges} data-admin-repair-detail-save>
                {saving ? 'Guardando...' : hasChanges ? 'Guardar cambios' : 'Sin cambios'}
              </Button>
              <Button asChild variant="outline" disabled={saving}>
                <Link to="/admin/repairs">Cancelar</Link>
              </Button>
            </div>
          </SectionCard>
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
