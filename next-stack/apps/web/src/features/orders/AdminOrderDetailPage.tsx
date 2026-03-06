import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ActionDropdown } from '@/components/ui/action-dropdown';
import { CustomSelect } from '@/components/ui/custom-select';
import { ordersApi } from './api';
import type { OrderItem } from './types';

const ORDER_STATUSES = ['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'LISTO_RETIRO', 'ENTREGADO', 'CANCELADO'] as const;
const ORDER_STATUS_LABELS: Record<(typeof ORDER_STATUSES)[number], string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  PREPARANDO: 'Preparando',
  LISTO_RETIRO: 'Listo para retirar',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

function orderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status as (typeof ORDER_STATUSES)[number]] ?? status;
}

function orderStatusBadgeClass(status: string) {
  switch (status) {
    case 'PENDIENTE':
      return 'badge-amber';
    case 'CONFIRMADO':
      return 'badge-sky';
    case 'PREPARANDO':
      return 'badge-indigo';
    case 'LISTO_RETIRO':
      return 'badge-emerald';
    case 'CANCELADO':
      return 'badge-rose';
    default:
      return 'badge-zinc';
  }
}

const ORDER_STATUS_OPTIONS = ORDER_STATUSES.map((status) => ({
  value: status,
  label: orderStatusLabel(status),
}));

export function AdminOrderDetailPage() {
  const { id = '' } = useParams();
  const [item, setItem] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [waSent, setWaSent] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await ordersApi.adminOrder(id);
      setItem(res.item);
      setStatus(res.item.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando pedido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function saveStatus(nextStatus?: string) {
    if (!item) return;
    const targetStatus = nextStatus ?? status;
    setSaving(true);
    setError('');
    try {
      const res = await ordersApi.adminUpdateStatus(item.id, targetStatus);
      setItem(res.item);
      setStatus(res.item.status);
      setComment('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando estado');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="store-shell">
        <div className="card"><div className="card-body">Cargando pedido...</div></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="store-shell space-y-4">
        <Link to="/admin/orders" className="btn-outline">← Volver</Link>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="store-shell space-y-4">
        <Link to="/admin/orders" className="btn-outline">← Volver</Link>
        <div className="card"><div className="card-body">No se encontró el pedido.</div></div>
      </div>
    );
  }

  const contactValue = item.user?.email || 'Sin contacto';
  const whatsappMessage = `Hola ${item.user?.name || 'cliente'}, tu pedido #${item.id.slice(0, 6)} está en estado: ${orderStatusLabel(status || item.status)}.`;
  const waHistoryDate = new Date().toLocaleDateString('es-AR');
  const waHistoryTime = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="store-shell space-y-4">
      <section className="store-hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/admin/orders" className="btn-ghost !h-9 !rounded-xl px-2 text-sm font-black">
                ← Volver
              </Link>
              <h1 className="text-2xl font-black tracking-tight text-zinc-900">Pedido #{item.id.slice(0, 6)}</h1>
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              Creado {new Date(item.createdAt).toLocaleDateString('es-AR')} {new Date(item.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · Usuario: {item.user?.email || 'local'}
            </p>
          </div>
          <div className="text-right">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link to={`/admin/orders/${item.id}/print`} target="_blank" rel="noreferrer" className="btn-outline !h-9 !rounded-xl px-4 text-sm font-bold">
                Imprimir
              </Link>
              <Link to={`/admin/orders/${item.id}/ticket`} target="_blank" rel="noreferrer" className="btn-outline !h-9 !rounded-xl px-4 text-sm font-bold">
                Ticket
              </Link>
              <span className={orderStatusBadgeClass(item.status)}>{orderStatusLabel(item.status)}</span>
              <ActionDropdown
                renderTrigger={({ open, toggle, triggerRef, menuId }) => (
                  <button
                    ref={triggerRef}
                    type="button"
                    aria-haspopup="menu"
                    aria-controls={menuId}
                    aria-expanded={open ? 'true' : 'false'}
                    onClick={toggle}
                    className="btn-primary !h-9 !rounded-xl px-4 text-sm font-bold"
                  >
                    Estado
                  </button>
                )}
                menuClassName="min-w-[13rem]"
              >
                {(close) => (
                  <>
                    {ORDER_STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`dropdown-item ${item.status === option.value ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-100' : ''}`}
                        onClick={() => {
                          void saveStatus(option.value);
                          close();
                        }}
                        disabled={item.status === option.value}
                        aria-disabled={item.status === option.value ? 'true' : 'false'}
                      >
                        {option.label}
                      </button>
                    ))}
                  </>
                )}
              </ActionDropdown>
            </div>
            <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">Total</div>
            <div className="text-2xl font-black tracking-tight text-zinc-900">${item.total.toLocaleString('es-AR')}</div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.78fr_1.52fr]">
        <div className="space-y-4">
          <section className="card">
            <div className="card-head flex items-center justify-between gap-2">
              <div className="text-xl font-black tracking-tight text-zinc-900">Acciones rápidas</div>
              <span className="badge-zinc">Pedido #{item.id.slice(0, 6)}</span>
            </div>
            <div className="card-body space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Link to={`/admin/orders/${item.id}/print`} target="_blank" rel="noreferrer" className="btn-outline !h-10 !rounded-xl justify-center">
                  Imprimir
                </Link>
                <Link to={`/admin/orders/${item.id}/ticket`} target="_blank" rel="noreferrer" className="btn-outline !h-10 !rounded-xl justify-center">
                  Ticket
                </Link>
              </div>
              <button type="button" className="btn-outline !h-10 !w-full !rounded-xl justify-center">Abrir WhatsApp</button>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-sm font-bold text-zinc-500" disabled>
                  Marcar entregado
                </button>
                <button type="button" className="btn-outline !h-10 !rounded-xl justify-center">Cancelar pedido</button>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head flex items-center justify-between gap-2">
              <div className="text-xl font-black tracking-tight text-zinc-900">Cliente</div>
              <span className="badge-zinc">{item.user ? 'web' : 'local'}</span>
            </div>
            <div className="card-body space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">Nombre</span>
                <span className="font-bold text-zinc-900">{item.user?.name || 'Venta rápida'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">Contacto</span>
                <span className="font-bold text-zinc-900">{item.user?.email || 'No informado'}</span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head flex items-center justify-between gap-2">
              <div className="text-xl font-black tracking-tight text-zinc-900">Actualizar estado</div>
              <span className={orderStatusBadgeClass(item.status)}>{orderStatusLabel(item.status)}</span>
            </div>
            <div className="card-body space-y-3">
              <div>
                <label className="mb-1 block text-sm font-bold text-zinc-700">Estado</label>
                <CustomSelect
                  value={status}
                  onChange={setStatus}
                  options={ORDER_STATUS_OPTIONS}
                  className="w-full"
                  triggerClassName="min-h-10 rounded-xl"
                  ariaLabel="Estado del pedido"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-zinc-700">Comentario (opcional)</label>
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ej: listo para retirar"
                  className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm"
                />
              </div>
              <button type="button" onClick={() => void saveStatus()} disabled={saving} className="btn-primary !h-10 !w-full !rounded-xl justify-center">
                {saving ? 'Guardando...' : 'Guardar estado'}
              </button>
            </div>
          </section>

          <section className="card">
            <div className="card-head flex items-center justify-between gap-2">
              <div className="text-xl font-black tracking-tight text-zinc-900">WhatsApp</div>
              <span className="badge-zinc">{contactValue}</span>
            </div>
            <div className="card-body space-y-3">
              <div>
                <div className="mb-1 text-sm font-bold text-zinc-500">Mensaje</div>
                <p className="text-sm leading-relaxed text-zinc-800">{whatsappMessage}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="btn-outline !h-10 !rounded-xl justify-center">
                  Abrir WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setWaSent(true)}
                  className="btn-primary !h-10 !rounded-xl justify-center"
                >
                  Marcar como enviado
                </button>
              </div>

              <div>
                <div className="mb-1 text-sm font-bold text-zinc-500">Historial de envíos</div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="flex items-start justify-between gap-2 text-xs">
                    <div>
                      <div className="font-black text-zinc-900">{waSent ? 'Enviado' : 'Pendiente'}</div>
                      <div className="mt-0.5 text-zinc-600">Contacto: {contactValue} · Por: —</div>
                    </div>
                    <div className="text-zinc-500">{waHistoryDate} {waHistoryTime}</div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-800">{whatsappMessage}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="card">
          <div className="card-head flex items-center justify-between gap-2">
            <div className="text-xl font-black tracking-tight text-zinc-900">Items del pedido</div>
            <div className="text-2xl font-black tracking-tight text-zinc-900">${item.total.toLocaleString('es-AR')}</div>
          </div>
          <div className="card-body">
            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <div className="grid grid-cols-[1.4fr_0.8fr_0.5fr_0.8fr] gap-2 bg-zinc-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-500">
                <div>Producto</div>
                <div className="text-right">Precio</div>
                <div className="text-right">Cant.</div>
                <div className="text-right">Subtotal</div>
              </div>
              {item.items.map((line) => (
                <div key={line.id} className="grid grid-cols-[1.4fr_0.8fr_0.5fr_0.8fr] gap-2 border-t border-zinc-100 px-3 py-3 text-sm">
                  <div className="font-bold text-zinc-900">{line.name}</div>
                  <div className="text-right font-bold text-zinc-900">${line.unitPrice.toLocaleString('es-AR')}</div>
                  <div className="text-right font-bold text-zinc-900">{line.quantity}</div>
                  <div className="text-right font-black text-zinc-900">${line.lineTotal.toLocaleString('es-AR')}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-xl border border-zinc-200 px-3 py-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-zinc-700">Total</span>
                <span className="text-xl font-black tracking-tight text-zinc-900">${item.total.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
