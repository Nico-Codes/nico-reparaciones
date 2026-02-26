import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { repairsApi } from './api';
import type { RepairItem } from './types';

function repairCodeLabel(id: string) {
  return `R-${id.slice(0, 13)}`;
}

function statusLabel(status: string) {
  switch (status) {
    case 'RECEIVED':
      return 'Recibido';
    case 'DIAGNOSING':
      return 'Diagnosticando';
    case 'WAITING_APPROVAL':
      return 'Esperando aprobación';
    case 'REPAIRING':
      return 'En reparación';
    case 'READY_PICKUP':
      return 'Listo para retirar';
    case 'DELIVERED':
      return 'Entregado';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status;
  }
}

export function AdminRepairPrintPage() {
  const { id = '' } = useParams();
  const [item, setItem] = useState<RepairItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Error cargando orden de reparación');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const deliveredAt = useMemo(() => {
    if (!item || item.status !== 'DELIVERED') return '—';
    const d = new Date(item.updatedAt);
    return `${d.toLocaleDateString('es-AR')} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
  }, [item]);

  const createdAtLabel = useMemo(() => {
    if (!item) return '';
    const d = new Date(item.createdAt);
    return `${d.toLocaleDateString('es-AR')} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
  }, [item]);

  const finalAmount = item?.finalPrice ?? item?.quotedPrice ?? 0;
  const paidAmount = item?.finalPrice ?? item?.quotedPrice ?? 0;
  const spareCost = Math.max(0, Math.round(finalAmount * 0.32));

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-900 print:bg-white print:p-0">
      <div className="mx-auto max-w-[920px]">
        <div className="mb-3 flex items-center justify-end gap-2 print:hidden">
          <button type="button" onClick={() => window.print()} className="btn-primary !h-10 !rounded-xl px-5 text-sm font-bold">
            Imprimir
          </button>
          <Link to={id ? `/admin/repairs/${encodeURIComponent(id)}` : '/admin/repairs'} className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Volver
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_8px_30px_-18px_#0f172a47]">Cargando...</div>
        ) : error || !item ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 shadow-[0_8px_30px_-18px_#0f172a47]">
            {error || 'No se encontró la reparación'}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_8px_30px_-18px_#0f172a47] print:shadow-none">
            <div className="border-b border-zinc-100 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-4xl font-black tracking-tight text-zinc-900">Laravel</div>
                  <div className="mt-1 text-sm text-zinc-600">Orden de reparación</div>
                </div>
                <div className="text-right">
                  <div className="inline-flex h-8 items-center rounded-full border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-900">
                    Codigo: {repairCodeLabel(item.id)}
                  </div>
                  <div className="mt-2 text-sm text-zinc-600">Fecha: {createdAtLabel}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-zinc-200 p-4">
                  <div className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-500">CLIENTE</div>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-bold">Nombre:</span> {item.customerName}</div>
                    <div><span className="font-bold">Teléfono:</span> {item.customerPhone || '—'}</div>
                    <div><span className="font-bold">Equipo:</span> {[item.deviceBrand, item.deviceModel].filter(Boolean).join(' ') || '—'}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200 p-4">
                  <div className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-500">ESTADO</div>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-bold">Estado actual:</span> {statusLabel(item.status)}</div>
                    <div><span className="font-bold">Recibido:</span> {createdAtLabel}</div>
                    <div><span className="font-bold">Entregado:</span> {deliveredAt}</div>
                    <div><span className="font-bold">Garantía (días):</span> 100</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-zinc-200 p-4">
                  <div className="mb-2 text-sm font-black uppercase tracking-wide text-zinc-500">PROBLEMA REPORTADO</div>
                  <div className="text-sm font-bold text-zinc-900">{item.issueLabel || 'Sin detalle'}</div>
                </div>
                <div className="rounded-xl border border-zinc-200 p-4">
                  <div className="mb-2 text-sm font-black uppercase tracking-wide text-zinc-500">DIAGNOSTICO</div>
                  <div className="text-sm font-bold text-zinc-900">{item.notes?.split('\n')[0] || 'Sin diagnóstico'}</div>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 p-4">
                <div className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-500">FINANZAS</div>
                <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
                  <div className="text-sm"><span className="font-bold">Repuestos:</span> $ {spareCost.toLocaleString('es-AR')}</div>
                  <div className="text-sm"><span className="font-bold">Mano de obra:</span> $ 0</div>
                  <div className="text-sm"><span className="font-bold">Precio final:</span> $ {finalAmount.toLocaleString('es-AR')}</div>
                  <div className="text-sm"><span className="font-bold">Pagado:</span> $ {paidAmount.toLocaleString('es-AR')}</div>
                  <div className="text-sm"><span className="font-bold">Debe:</span> $ 0</div>
                  <div className="text-sm"><span className="font-bold">Metodo:</span> transfer</div>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-600">
              <span className="font-bold">Aclaraciones:</span> Este comprobante acredita el ingreso del equipo. El presupuesto puede requerir aprobación del cliente.
              {' '}Se recomienda retirar el equipo dentro de un plazo razonable una vez notificado.
            </div>

            <div className="grid grid-cols-2 gap-4 px-4 py-10 text-sm text-zinc-700">
              <div className="border-t border-zinc-300 pt-2">Firma cliente</div>
              <div className="border-t border-zinc-300 pt-2 text-right">Firma / sello del local</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

