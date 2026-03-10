import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, AlertTriangle, Clock3, ShieldCheck, Wrench } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
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

export function AdminRepairDetailPage() {
  const { id = '' } = useParams();
  const [item, setItem] = useState<RepairItem | null>(null);
  const [timeline, setTimeline] = useState<RepairTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState('RECEIVED');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [issueLabel, setIssueLabel] = useState('');
  const [quotedPrice, setQuotedPrice] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const res = await repairsApi.adminDetail(id);
        if (!mounted) return;
        setItem(res.item);
        setTimeline(res.timeline ?? []);
        setStatus(res.item.status);
        setCustomerName(res.item.customerName || '');
        setCustomerPhone(res.item.customerPhone || '');
        setDeviceBrand(res.item.deviceBrand || '');
        setDeviceModel(res.item.deviceModel || '');
        setIssueLabel(res.item.issueLabel || '');
        setQuotedPrice(res.item.quotedPrice != null ? String(res.item.quotedPrice) : '');
        setFinalPrice(res.item.finalPrice != null ? String(res.item.finalPrice) : '');
        setNotes(res.item.notes || '');
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'No se pudo cargar la reparación.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const summary = useMemo(() => {
    const quoted = quotedPrice ? Number(quotedPrice) : null;
    const final = finalPrice ? Number(finalPrice) : null;
    return {
      quoted,
      final,
      timelineCount: timeline.length,
    };
  }, [finalPrice, quotedPrice, timeline.length]);

  async function saveChanges() {
    if (!item) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await repairsApi.adminUpdate(item.id, {
        customerName,
        customerPhone: customerPhone || null,
        deviceBrand: deviceBrand || null,
        deviceModel: deviceModel || null,
        issueLabel: issueLabel || null,
        status,
        quotedPrice: quotedPrice ? Number(quotedPrice) : null,
        finalPrice: finalPrice ? Number(finalPrice) : null,
        notes: notes.trim() || null,
      });
      setItem(res.item);
      setStatus(res.item.status);
      setNotice('Reparación actualizada correctamente.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar los cambios.');
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
          subtitle="Estamos preparando la información completa del caso."
          actions={<StatusBadge label="Cargando" tone="info" />}
        />
        <SectionCard>
          <LoadingBlock label="Cargando reparación" lines={6} />
        </SectionCard>
      </PageShell>
    );
  }

  if (error && !item) {
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
            title={error}
            description="Volvé al listado para revisar otro caso o reintentá la carga desde el panel."
            actions={
              <Button asChild>
                <Link to="/admin/repairs">Ir al listado</Link>
              </Button>
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
          subtitle="El registro solicitado no está disponible en este momento."
          actions={
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/repairs">Volver a reparaciones</Link>
            </Button>
          }
        />
        <SectionCard>
          <EmptyState
            icon={<AlertTriangle className="h-5 w-5" />}
            title="No encontramos la reparación"
            description="Revisá el listado completo y abrí otro caso desde la tabla principal."
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
    <PageShell context="admin" className="space-y-5">
      <PageHeader
        context="admin"
        eyebrow="Reparaciones"
        title={`Caso ${code}`}
        subtitle={`${customerName || 'Cliente sin nombre'} · ${formatDateTime(item.createdAt)}`}
        actions={
          <>
            <StatusBadge label={statusLabel} tone={statusTone} />
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/repairs">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={`/admin/garantias/crear?repairId=${encodeURIComponent(item.id)}`}>Registrar garantía</Link>
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

      {error ? (
        <div className="ui-alert ui-alert--danger" data-reveal>
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No se pudo completar la acción</span>
            <div className="ui-alert__text">{error}</div>
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
            description="Visualizá el avance del caso y el próximo hito esperado para el cliente."
            actions={<StatusBadge label={statusLabel} tone={statusTone} size="sm" />}
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
              <ProgressSteps items={repairProgressSteps(item.status)} />

              <div className="account-stack">
                <div className="summary-box">
                  <div className="summary-box__label">Equipo</div>
                  <div className="mt-2 text-[1.35rem] font-black tracking-tight text-zinc-950">{deviceLabel}</div>
                  <div className="summary-box__hint">{issueLabel || 'Falla pendiente de definición'}</div>
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
            title="Editar reparación"
            description="Actualizá los datos reales del caso: cliente, equipo, diagnóstico y precios."
            actions={<StatusBadge label="Guardado manual" tone="neutral" size="sm" />}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <TextField
                label="Nombre del cliente"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Ej: Nicolás Pérez"
              />
              <TextField
                label="Teléfono"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="Ej: 11 5555-1234"
              />
              <TextField
                label="Marca del equipo"
                value={deviceBrand}
                onChange={(event) => setDeviceBrand(event.target.value)}
                placeholder="Ej: Samsung"
              />
              <TextField
                label="Modelo del equipo"
                value={deviceModel}
                onChange={(event) => setDeviceModel(event.target.value)}
                placeholder="Ej: A34"
              />
              <TextField
                label="Falla principal"
                value={issueLabel}
                onChange={(event) => setIssueLabel(event.target.value)}
                placeholder="Ej: Cambio de módulo"
              />
              <div>
                <label className="mb-1 block text-sm font-bold text-zinc-700">Estado del caso</label>
                <CustomSelect
                  value={status}
                  onChange={setStatus}
                  options={STATUS_OPTIONS}
                  triggerClassName="min-h-10 rounded-xl"
                  ariaLabel="Estado de la reparación"
                />
              </div>
              <TextField
                label="Presupuesto"
                type="number"
                value={quotedPrice}
                onChange={(event) => setQuotedPrice(event.target.value)}
                placeholder="0"
              />
              <TextField
                label="Precio final"
                type="number"
                value={finalPrice}
                onChange={(event) => setFinalPrice(event.target.value)}
                placeholder="0"
              />
            </div>

            <TextAreaField
              label="Notas y diagnóstico"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Detalle del diagnóstico, repuestos usados, observaciones y próximos pasos."
              rows={6}
              wrapperClassName="mt-4"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" onClick={() => void saveChanges()} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              <Button asChild variant="outline">
                <Link to="/admin/repairs">Cancelar</Link>
              </Button>
            </div>
          </SectionCard>
        </div>

        <aside className="account-stack account-sticky">
          <SectionCard title="Resumen del caso" description="Datos administrativos y comerciales relevantes para seguimiento.">
            <div className="fact-list">
              <FactRow label="Código" value={code} />
              <FactRow label="Cliente" value={customerName || 'Sin nombre'} />
              <FactRow label="Teléfono" value={customerPhone || 'No informado'} />
              <FactRow label="Ingreso" value={formatDateTime(item.createdAt)} />
              <FactRow label="Última actualización" value={formatDateTime(item.updatedAt)} />
              <FactRow label="Estado" value={statusLabel} />
            </div>
          </SectionCard>

          <SectionCard title="Historial" description="Eventos registrados para revisar la trazabilidad del caso.">
            {timeline.length === 0 ? (
              <EmptyState
                icon={<Clock3 className="h-5 w-5" />}
                title="Todavía no hay eventos"
                description="El historial se completa automáticamente a medida que se registran cambios en la reparación."
              />
            ) : (
              <div className="space-y-3">
                {timeline.map((event) => (
                  <div key={event.id} className="detail-panel">
                    <div className="detail-panel__label">{event.eventType}</div>
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
