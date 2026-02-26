import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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

export function AdminRepairTicketPage() {
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
        setError(e instanceof Error ? e.message : 'Error cargando ticket');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const createdAt = useMemo(() => {
    if (!item) return '';
    const d = new Date(item.createdAt);
    return `${d.toLocaleDateString('es-AR')} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
  }, [item]);

  const finalAmount = item?.finalPrice ?? item?.quotedPrice ?? 0;
  const paidAmount = item?.finalPrice ?? item?.quotedPrice ?? 0;
  const spareCost = Math.max(0, Math.round(finalAmount * 0.32));
  const lineValue = item?.issueLabel || 'Sin detalle';
  const diagnosis = item?.notes?.split('\n')[0] || 'Sin diagnóstico';

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-900 print:bg-white print:p-0">
      <div className="mx-auto max-w-[420px]">
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_8px_30px_-18px_#0f172a47]">Cargando...</div>
        ) : error || !item ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 shadow-[0_8px_30px_-18px_#0f172a47]">
            {error || 'No se encontró la reparación'}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center text-3xl font-black tracking-tight text-zinc-900">Laravel</div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_8px_30px_-18px_#0f172a47] print:shadow-none">
              <div className="space-y-2 text-sm">
                <TicketRow label="Reparación" value={repairCodeLabel(item.id)} strong />
                <TicketRow label="Recibido" value={createdAt} strong />
                <TicketRow label="Estado" value={statusLabel(item.status)} strong />
                <TicketRow label="Garantía" value="100 dias" strong />
              </div>

              <div className="my-3 border-t border-dashed border-zinc-300" />

              <div className="space-y-2 text-sm">
                <TicketRow label="Cliente" value={item.customerName} strong />
                <TicketRow label="Tel" value={item.customerPhone || '—'} strong />
                <TicketRow label="Equipo" value={[item.deviceBrand, item.deviceModel].filter(Boolean).join(' ') || '—'} strong />
              </div>

              <div className="my-3 border-t border-dashed border-zinc-300" />

              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-xs font-black text-zinc-600">Falla reportada</div>
                  <div className="text-lg font-black tracking-tight text-zinc-900">{lineValue}</div>
                </div>
                <div className="border-t border-dashed border-zinc-200 pt-2">
                  <div className="text-xs font-black text-zinc-600">Diagnóstico</div>
                  <div className="text-lg font-black tracking-tight text-zinc-900">{diagnosis}</div>
                </div>
              </div>

              <div className="my-3 border-t border-dashed border-zinc-300" />

              <div className="space-y-1.5 text-sm">
                <TicketMoney label="Repuestos" value={spareCost} />
                <TicketMoney label="Mano de obra" value={0} />
                <div className="border-t border-dashed border-zinc-200 pt-2" />
                <TicketMoney label="Final" value={finalAmount} />
                <TicketMoney label="Pagado" value={paidAmount} />
                <TicketMoney label="Debe" value={Math.max(0, finalAmount - paidAmount)} strong />
                <div className="border-t border-dashed border-zinc-200 pt-2" />
                <TicketRow label="Metodo" value="Transferencia" strong />
              </div>

              <div className="mt-4 border-t border-dashed border-zinc-300 pt-3 text-center text-xs font-bold text-zinc-600">
                <div>Con este comprobante retiras tu equipo.</div>
                <div>Conserva el codigo: {repairCodeLabel(item.id)}</div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 print:hidden">
                <button type="button" onClick={() => window.print()} className="btn-primary !h-10 !rounded-xl px-4 text-sm font-bold">
                  Imprimir
                </button>
                <Link to={`/admin/repairs/${encodeURIComponent(item.id)}`} className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
                  Volver
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TicketRow(props: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4">
      <div className="text-sm text-zinc-700">{props.label}</div>
      <div className={props.strong ? 'text-sm font-black text-zinc-900' : 'text-sm text-zinc-900'}>{props.value}</div>
    </div>
  );
}

function TicketMoney(props: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4">
      <div className={props.strong ? 'text-2xl font-black tracking-tight text-zinc-900' : 'text-sm text-zinc-900'}>{props.label}</div>
      <div className={props.strong ? 'text-3xl font-black tracking-tight text-zinc-900' : 'text-2xl font-black tracking-tight text-zinc-900'}>
        $ {props.value.toLocaleString('es-AR')}
      </div>
    </div>
  );
}

