import { useEffect, useState } from 'react';
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

export function AdminOrderPrintPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        setError(e instanceof Error ? e.message : 'Error cargando impresión');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-6 py-8 text-sm text-zinc-600">Cargando impresión...</div>;
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
      <div className="mx-auto max-w-4xl px-6 py-8 print:max-w-none print:px-0 print:py-4">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="text-2xl font-black tracking-tight text-zinc-900">NicoReparaciones</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black tracking-tight text-zinc-900">Pedido #{item.id.slice(0, 2)}</div>
            <div className="text-sm text-zinc-600">Estado: {orderStatusLabel(item.status)}</div>
            <div className="text-sm text-zinc-600">
              Creado: {new Date(item.createdAt).toLocaleDateString('es-AR')} {new Date(item.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-sm text-zinc-600">Pago: {item.paymentMethod || 'local'}</div>
            <div className="mt-3 flex justify-end gap-2 print:hidden">
              <button type="button" onClick={() => window.print()} className="btn-primary !h-10 !rounded-xl px-4 text-sm font-bold">
                Imprimir
              </button>
              <button type="button" onClick={() => navigate(`/admin/orders/${item.id}`)} className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
                Volver
              </button>
            </div>
          </div>
        </div>

        <section className="card mt-6 print:shadow-none">
          <div className="card-body grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-zinc-500">Cliente</div>
              <div className="mt-1 text-xl font-black tracking-tight text-zinc-900">{item.user?.name || 'Venta local'}</div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-zinc-500">Teléfono</div>
              <div className="mt-1 text-xl font-black tracking-tight text-zinc-900">{item.user?.email || 'No informado'}</div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-zinc-500">Email</div>
              <div className="mt-1 text-xl font-black tracking-tight text-zinc-900">{item.user?.email || 'local'}</div>
            </div>
          </div>
        </section>

        <section className="card mt-4 print:shadow-none">
          <div className="card-head flex items-center justify-between gap-2">
            <div className="text-xs font-black uppercase tracking-wide text-zinc-500">Items</div>
            <div className="text-2xl font-black tracking-tight text-zinc-900">${item.total.toLocaleString('es-AR')}</div>
          </div>
          <div className="card-body">
            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <div className="grid grid-cols-[0.5fr_1.8fr_0.8fr_0.9fr] gap-2 bg-zinc-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-zinc-500">
                <div>Cant</div>
                <div>Producto</div>
                <div className="text-right">Unit</div>
                <div className="text-right">Subtotal</div>
              </div>
              {item.items.map((line) => (
                <div key={line.id} className="grid grid-cols-[0.5fr_1.8fr_0.8fr_0.9fr] gap-2 border-t border-zinc-100 px-4 py-3 text-sm">
                  <div className="font-bold text-zinc-900">{line.quantity}</div>
                  <div className="font-bold text-zinc-900">{line.name}</div>
                  <div className="text-right font-bold text-zinc-900">${line.unitPrice.toLocaleString('es-AR')}</div>
                  <div className="text-right font-black text-zinc-900">${line.lineTotal.toLocaleString('es-AR')}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-end gap-3 text-sm">
              <span className="font-black uppercase tracking-wide text-zinc-500">Total</span>
              <span className="text-3xl font-black tracking-tight text-zinc-900">${item.total.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </section>

        <div className="mt-4 text-sm text-zinc-500 print:mt-3">Generado desde Admin - NicoReparaciones</div>
      </div>
    </div>
  );
}
