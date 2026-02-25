import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ordersApi } from './api';
import type { OrderItem } from './types';

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  PREPARANDO: 'Preparando',
  LISTO_RETIRO: 'Listo para retirar',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

function orderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status] ?? status;
}

type TicketWidth = '80mm' | '58mm' | 'A4';

export function AdminOrderTicketPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ticketWidth, setTicketWidth] = useState<TicketWidth>('80mm');

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const res = await ordersApi.adminOrder(id);
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

  const ticketWidthClass = useMemo(() => {
    if (ticketWidth === '58mm') return 'max-w-[360px]';
    if (ticketWidth === 'A4') return 'max-w-3xl';
    return 'max-w-[430px]';
  }, [ticketWidth]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-6 py-8 text-sm text-zinc-600">Cargando ticket...</div>;
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error || 'Pedido no encontrado'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 print:bg-white">
      <div className={`mx-auto px-6 py-6 ${ticketWidthClass} print:max-w-[80mm] print:px-0 print:py-3`}>
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-[0_8px_30px_-18px_#0f172a47] print:rounded-none print:border-0 print:shadow-none">
          <div className="border-b border-dashed border-zinc-300 pb-3 text-center">
            <div className="text-2xl font-black tracking-tight text-zinc-900">NicoReparaciones</div>
          </div>

          <div className="space-y-1 border-b border-dashed border-zinc-300 py-3 text-sm">
            <div className="flex items-center justify-between gap-3"><span className="text-zinc-600">Pedido</span><span className="font-bold text-zinc-900">#{item.id.slice(0, 2)}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-zinc-600">Fecha</span><span className="font-bold text-zinc-900">{new Date(item.createdAt).toLocaleDateString('es-AR')} {new Date(item.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-zinc-600">Estado</span><span className="font-bold text-zinc-900">{orderStatusLabel(item.status)}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-zinc-600">Pago</span><span className="font-bold text-zinc-900">{item.paymentMethod || 'local'}</span></div>
          </div>

          <div className="space-y-1 border-b border-dashed border-zinc-300 py-3 text-sm">
            <div className="flex items-center justify-between gap-3"><span className="text-zinc-600">Cliente</span><span className="font-bold text-zinc-900">{item.user?.name || 'Venta local'}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-zinc-600">Tel</span><span className="font-bold text-zinc-900">{item.user?.email || 'No informado'}</span></div>
          </div>

          <div className="border-b border-dashed border-zinc-300 py-3">
            <div className="mb-2 text-xs font-black uppercase tracking-wide text-zinc-500">Items</div>
            <div className="space-y-2">
              {item.items.map((line) => (
                <div key={line.id} className="text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-bold text-zinc-900">{line.quantity} x {line.name}</div>
                    <div className="font-black text-zinc-900">${line.lineTotal.toLocaleString('es-AR')}</div>
                  </div>
                  <div className="text-xs text-zinc-500">Unit: ${line.unitPrice.toLocaleString('es-AR')}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 py-3">
            <span className="text-xl font-black tracking-tight text-zinc-900">Total</span>
            <span className="text-2xl font-black tracking-tight text-zinc-900">${item.total.toLocaleString('es-AR')}</span>
          </div>

          <div className="border-t border-dashed border-zinc-300 pt-3 text-center">
            <div className="text-sm font-bold text-zinc-700">Gracias por tu compra</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 print:hidden">
          <button type="button" onClick={() => window.print()} className="btn-primary !h-11 !rounded-xl px-4 text-sm font-bold">Imprimir</button>
          <button type="button" onClick={() => setTicketWidth('80mm')} className={`btn-outline !h-11 !rounded-xl px-3 text-sm font-bold ${ticketWidth === '80mm' ? '!border-sky-200 !bg-sky-50 !text-sky-700' : ''}`}>Ticket 80mm</button>
          <button type="button" onClick={() => setTicketWidth('58mm')} className={`btn-outline !h-11 !rounded-xl px-3 text-sm font-bold ${ticketWidth === '58mm' ? '!border-sky-200 !bg-sky-50 !text-sky-700' : ''}`}>Ticket 58mm</button>
          <button type="button" onClick={() => setTicketWidth('A4')} className={`btn-outline !h-11 !rounded-xl px-3 text-sm font-bold ${ticketWidth === 'A4' ? '!border-sky-200 !bg-sky-50 !text-sky-700' : ''}`}>A4</button>
          <button type="button" onClick={() => navigate(`/admin/orders/${item.id}`)} className="btn-outline !h-11 !rounded-xl px-4 text-sm font-bold">Volver</button>
        </div>
      </div>
    </div>
  );
}
