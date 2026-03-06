import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import { repairsApi } from './api';
import type { RepairItem, RepairTimelineEvent } from './types';

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Recibido',
  DIAGNOSING: 'Diagnosticando',
  WAITING_APPROVAL: 'Esperando aprobación',
  REPAIRING: 'En reparación',
  READY_PICKUP: 'Listo para retirar',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  RECEIVED: 'badge-sky',
  DIAGNOSING: 'badge-indigo',
  WAITING_APPROVAL: 'badge-amber',
  REPAIRING: 'badge-indigo',
  READY_PICKUP: 'badge-emerald',
  DELIVERED: 'badge-zinc',
  CANCELLED: 'badge-rose',
};

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function statusBadgeClass(status: string) {
  return STATUS_BADGE_CLASS[status] ?? 'badge-zinc';
}

function repairCodeLabel(id: string) {
  return `R-${id.slice(0, 13)}`;
}

export function AdminRepairDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<RepairItem | null>(null);
  const [timeline, setTimeline] = useState<RepairTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('RECEIVED');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [issueLabel, setIssueLabel] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [detail, setDetail] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA');
  const [warrantyDays, setWarrantyDays] = useState('100');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [provider, setProvider] = useState('PUNTOCELL');
  const [sparePart, setSparePart] = useState('');
  const [purchaseRef, setPurchaseRef] = useState('');

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
        setDiagnosis(res.item.notes || '');
        setDetail(res.item.notes || '');
        setFinalPrice(res.item.finalPrice != null ? String(res.item.finalPrice) : res.item.quotedPrice != null ? String(res.item.quotedPrice) : '');
        setPaidAmount(res.item.finalPrice != null ? String(res.item.finalPrice) : '');
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Error cargando reparación');
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
    const final = Number(finalPrice || 0);
    const paid = Number(paidAmount || 0);
    return {
      final,
      paid,
      due: Math.max(0, final - paid),
    };
  }, [finalPrice, paidAmount]);

  const statusOptions = useMemo(
    () => Object.keys(STATUS_LABELS).map((statusKey) => ({ value: statusKey, label: statusLabel(statusKey) })),
    [],
  );
  const issueOptions = issueLabel ? [{ value: issueLabel, label: issueLabel }] : [{ value: '', label: 'Seleccionar falla' }];
  const providerOptions = [
    { value: 'PUNTOCELL', label: 'Puntocell' },
    { value: 'EVOPHONE', label: 'Evophone' },
  ];
  const paymentOptions = [
    { value: 'TRANSFERENCIA', label: 'Transferencia' },
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'DEBITO', label: 'Débito' },
  ];

  async function saveChanges() {
    if (!item) return;
    setSaving(true);
    setError('');
    try {
      const res = await repairsApi.adminUpdate(item.id, {
        customerName,
        customerPhone: customerPhone || null,
        deviceBrand: deviceBrand || null,
        deviceModel: deviceModel || null,
        issueLabel: issueLabel || null,
        status,
        quotedPrice: finalPrice ? Number(finalPrice) : null,
        finalPrice: finalPrice ? Number(finalPrice) : null,
        notes: [diagnosis, detail, internalNotes].filter(Boolean).join('\n\n') || null,
      });
      setItem(res.item);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando cambios');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="store-shell"><div className="card"><div className="card-body">Cargando reparación...</div></div></div>;
  if (error || !item) return <div className="store-shell"><div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error || 'No se encontró la reparación'}</div></div>;

  return (
    <div className="store-shell space-y-4">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-zinc-900">{repairCodeLabel(item.id)}</h1>
              <span className={statusBadgeClass(status)}>{statusLabel(status)}</span>
              <span className="inline-flex h-8 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-700">
                Garantía vigente (24/05/2026)
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-700">
              <span className="font-black">{customerName}</span> · {customerPhone || 'Sin teléfono'} · {[deviceBrand, deviceModel].filter(Boolean).join(' ') || 'Sin equipo'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => navigate('/admin/repairs')} className="btn-ghost !h-10 !rounded-xl px-4 text-sm font-bold">Volver</button>
            <Link to={`/admin/garantias/crear?repairId=${encodeURIComponent(item.id)}`} className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">Registrar garantía</Link>
            <a href={`/admin/repairs/${encodeURIComponent(item.id)}/print`} target="_blank" rel="noreferrer" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">Imprimir</a>
            <a href={`/admin/repairs/${encodeURIComponent(item.id)}/ticket`} target="_blank" rel="noreferrer" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">Ticket</a>
            <button type="button" className="btn-primary !h-10 !rounded-xl px-4 text-sm font-bold">WhatsApp</button>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <section className="card">
            <div className="card-head flex items-center justify-between gap-2">
              <div className="text-xl font-black tracking-tight text-zinc-900">Acciones rápidas</div>
              <span className="badge-zinc">{repairCodeLabel(item.id)}</span>
            </div>
            <div className="card-body space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <a href={`/admin/repairs/${encodeURIComponent(item.id)}/print`} target="_blank" rel="noreferrer" className="btn-outline !h-10 !rounded-xl justify-center">Imprimir</a>
                <a href={`/admin/repairs/${encodeURIComponent(item.id)}/ticket`} target="_blank" rel="noreferrer" className="btn-outline !h-10 !rounded-xl justify-center">Ticket</a>
              </div>
              <button type="button" className="btn-outline !h-10 !w-full !rounded-xl justify-center">Abrir WhatsApp</button>
              <div className="border-t border-zinc-100 pt-2">
                <button type="button" className="btn-ghost !h-10 !w-full !rounded-xl justify-center font-bold">Ver acciones de estado</button>
              </div>
              <div className="border-t border-zinc-100 pt-2">
                <button type="button" className="btn-ghost !h-10 !w-full !rounded-xl justify-center font-bold">Ver reembolso total</button>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head flex items-center justify-between gap-2">
              <div className="text-xl font-black tracking-tight text-zinc-900">Resumen</div>
              <span className="badge-zinc">Código: {repairCodeLabel(item.id)}</span>
            </div>
            <div className="card-body space-y-2 text-sm">
              <Row label="Recibido" value={`${new Date(item.createdAt).toLocaleDateString('es-AR')} ${new Date(item.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`} />
              <Row label="Entregado" value={status === 'DELIVERED' ? new Date(item.updatedAt).toLocaleDateString('es-AR') + ' ' + new Date(item.updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '-'} />
              <Row label="Precio final" value={`$ ${summary.final.toLocaleString('es-AR')}`} strong />
              <Row label="Pagado" value={`$ ${summary.paid.toLocaleString('es-AR')}`} strong />
              <Row label="Debe" value={`$ ${summary.due.toLocaleString('es-AR')}`} strong valueClass={summary.due > 0 ? 'text-rose-700' : 'text-emerald-700'} />
              <Row label="Reembolso total" value="No" strong />
              <div className="border-t border-zinc-100 pt-2" />
              <Row label="Usuario asociado" value="-" strong />
            </div>
          </section>

          <section className="card">
            <div className="card-head flex items-center justify-between gap-2">
              <div className="text-xl font-black tracking-tight text-zinc-900">Cambiar estado</div>
              <span className={statusBadgeClass(status)}>{statusLabel(status)}</span>
            </div>
            <div className="card-body space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-zinc-700">Nuevo estado</span>
                <CustomSelect value={status} onChange={setStatus} options={statusOptions} triggerClassName="min-h-10 rounded-xl" ariaLabel="Nuevo estado de reparación" />
              </label>
              <button type="button" onClick={() => void saveChanges()} disabled={saving} className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-300 px-4 text-sm font-bold text-white disabled:opacity-80">
                {saving ? 'Guardando...' : 'Guardar estado'}
              </button>
              <p className="text-sm text-zinc-500">Si marcas "Entregado", la garantía (si tiene días) se calcula desde la fecha de entrega.</p>
            </div>
          </section>

          <section className="card">
            <div className="card-head flex items-center justify-between gap-2">
              <div className="text-xl font-black tracking-tight text-zinc-900">Historial</div>
              <div className="flex items-center gap-2">
                <span className="badge-zinc">{timeline.length} cambios</span>
                <button type="button" className="btn-ghost !h-8 !rounded-xl px-2 text-sm font-bold">Ver historial</button>
              </div>
            </div>
            <div className="card-body">
              {timeline.length === 0 ? (
                <div className="text-sm text-zinc-600">Sin eventos registrados.</div>
              ) : (
                <div className="space-y-2">
                  {timeline.map((event) => (
                    <div key={event.id} className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-black text-zinc-800">{event.eventType}</div>
                        <div className="text-[11px] text-zinc-500">{new Date(event.createdAt).toLocaleString('es-AR')}</div>
                      </div>
                      {event.message ? <div className="mt-1 text-sm text-zinc-700">{event.message}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-head flex items-center justify-between gap-2">
              <div className="text-xl font-black tracking-tight text-zinc-900">Logs WhatsApp</div>
              <div className="flex items-center gap-2">
                <span className="badge-zinc">0</span>
                <button type="button" className="btn-ghost !h-8 !rounded-xl px-2 text-sm font-bold">Ver logs</button>
              </div>
            </div>
          </section>
        </div>

        <section className="card">
          <div className="card-head flex items-center justify-between gap-2">
            <div className="text-xl font-black tracking-tight text-zinc-900">Editar reparación</div>
            <span className="badge-zinc">Se guarda en el momento</span>
          </div>
          <div className="card-body space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
              <div className="space-y-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-bold text-zinc-700">Falla principal *</span>
                  <input value={issueLabel} onChange={(e) => setIssueLabel(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
                </label>
                <CustomSelect value={issueLabel} onChange={setIssueLabel} options={issueOptions} triggerClassName="min-h-10 rounded-xl" ariaLabel="Falla principal" />
                <button type="button" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">+ Agregar falla</button>
              </div>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-zinc-700">Diagnóstico</span>
                <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={4} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Detalle (opcional)</span>
              <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={3} placeholder="Ej: no carga, se apaga, se calentó, etc." className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
            </label>

            <div className="border-t border-zinc-200 pt-4" />

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block"><span className="mb-1 block text-sm font-bold text-zinc-700">Nombre cliente</span><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-sm font-bold text-zinc-700">Teléfono cliente</span><input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" /></label>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Proveedor asociado</span>
              <CustomSelect value={provider} onChange={setProvider} options={providerOptions} triggerClassName="min-h-10 rounded-xl" ariaLabel="Proveedor asociado" />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block"><span className="mb-1 block text-sm font-bold text-zinc-700">Repuesto elegido</span><input value={sparePart} onChange={(e) => setSparePart(e.target.value)} placeholder="Ej: módulo Samsung A30" className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-sm font-bold text-zinc-700">Referencia de compra</span><input value={purchaseRef} onChange={(e) => setPurchaseRef(e.target.value)} placeholder="URL o referencia" className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" /></label>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-zinc-700">Equipo</div>
                <div className="text-sm text-zinc-600">Celular · {[deviceBrand, deviceModel].filter(Boolean).join(' ') || 'Sin equipo'}</div>
              </div>
              <button type="button" className="btn-ghost !h-9 !rounded-xl px-3 text-sm font-bold">Ver equipo</button>
            </div>

            <div className="border-t border-zinc-200 pt-4" />

            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <label className="block"><span className="mb-1 block text-sm font-bold text-zinc-700">Costo repuesto</span><input value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-sm font-bold text-zinc-700">Precio final</span><input value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" /></label>
              <div className="flex items-end pb-2">
                <label className="inline-flex items-center gap-2 text-sm font-bold text-zinc-700"><input type="checkbox" className="h-4 w-4 rounded border-zinc-300" defaultChecked /> Auto</label>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-black text-zinc-900">Pagos y notas</div>
              <button type="button" className="btn-ghost !h-9 !rounded-xl px-3 text-sm font-bold">Ocultar pagos</button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="block"><span className="mb-1 block text-sm font-bold text-zinc-700">Pagado</span><input value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-sm font-bold text-zinc-700">Método</span><CustomSelect value={paymentMethod} onChange={setPaymentMethod} options={paymentOptions} triggerClassName="min-h-10 rounded-xl" ariaLabel="Método de pago" /></label>
              <label className="block"><span className="mb-1 block text-sm font-bold text-zinc-700">Garantía (días)</span><input value={warrantyDays} onChange={(e) => setWarrantyDays(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" /></label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block"><span className="mb-1 block text-sm font-bold text-zinc-700">Notas de pago</span><textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows={3} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" /></label>
              <label className="block"><span className="mb-1 block text-sm font-bold text-zinc-700">Notas internas</span><textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={3} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" /></label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void saveChanges()} disabled={saving} className="btn-primary !h-11 !rounded-2xl px-5 text-sm font-black">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={() => navigate('/admin/repairs')} className="btn-outline !h-11 !rounded-2xl px-5 text-sm font-black">
                Cancelar
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value, strong = false, valueClass = '' }: { label: string; value: string; strong?: boolean; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-zinc-500">{label}</span>
      <span className={`${strong ? 'font-black' : 'font-bold'} text-zinc-900 ${valueClass}`}>{value}</span>
    </div>
  );
}
