import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from './api';
import type { QuickSaleHistoryItem } from './types';

function todayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

export function AdminQuickSalesHistoryPage() {
  const [items, setItems] = useState<QuickSaleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [from, setFrom] = useState(todayDateInput());
  const [to, setTo] = useState(todayDateInput());
  const [payment, setPayment] = useState('');
  const [adminId, setAdminId] = useState('');
  const [summary, setSummary] = useState({ salesCount: 0, salesTotal: 0 });
  const [paymentMethods, setPaymentMethods] = useState<Array<{ key: string; label: string }>>([]);
  const [admins, setAdmins] = useState<Array<{ id: string; name: string; email: string }>>([]);

  async function loadHistory() {
    setLoading(true);
    setError('');
    try {
      const res = await ordersApi.adminQuickSales({
        from,
        to,
        payment: payment || undefined,
        adminId: adminId || undefined,
      });
      setItems(res.items);
      setSummary(res.summary);
      setPaymentMethods(res.paymentMethods);
      setAdmins(res.admins);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando historial');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  const rows = useMemo(() => items.slice(0, 200), [items]);

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Historial de ventas rápidas</h1>
            <p className="mt-1 text-sm text-zinc-600">Control diario de ventas de mostrador con filtros.</p>
          </div>
          <Link to="/admin/ventas-rapidas" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Volver a venta rápida
          </Link>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

      <section className="card">
        <div className="card-head">
          <div className="font-black">Filtros</div>
        </div>
        <div className="card-body">
          <form
            className="grid gap-2 md:grid-cols-5"
            onSubmit={(e) => {
              e.preventDefault();
              void loadHistory();
            }}
          >
            <div className="grid gap-1">
              <label className="text-sm font-bold text-zinc-700">Desde</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-bold text-zinc-700">Hasta</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-bold text-zinc-700">Pago</label>
              <select value={payment} onChange={(e) => setPayment(e.target.value)} className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm font-bold">
                <option value="">Todos</option>
                {paymentMethods.map((pm) => <option key={pm.key} value={pm.key}>{pm.label}</option>)}
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-bold text-zinc-700">Admin</label>
              <select value={adminId} onChange={(e) => setAdminId(e.target.value)} className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm font-bold">
                <option value="">Todos</option>
                {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary !h-11 !w-full !rounded-xl px-5 text-sm font-bold">Aplicar</button>
            </div>
          </form>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="card">
          <div className="card-body">
            <div className="text-sm text-zinc-500">Ventas encontradas</div>
            <div className="text-2xl font-black tracking-tight text-zinc-900">{summary.salesCount}</div>
          </div>
        </section>
        <section className="card">
          <div className="card-body">
            <div className="text-sm text-zinc-500">Total vendido</div>
            <div className="text-2xl font-black tracking-tight text-zinc-900">$ {summary.salesTotal.toLocaleString('es-AR')}</div>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head flex items-center justify-between gap-2">
          <div className="font-black">Detalle</div>
          <span className="badge-zinc">{rows.length} registros</span>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-sm text-zinc-600">Cargando historial...</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-zinc-600">No hay ventas para los filtros seleccionados.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-zinc-500">
                    <th className="py-2 pr-3">Pedido</th>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Cliente</th>
                    <th className="py-2 pr-3">Pago</th>
                    <th className="py-2 pr-3">Items</th>
                    <th className="py-2 pr-3">Total</th>
                    <th className="py-2 pr-3">Admin</th>
                    <th className="py-2 pr-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((sale) => (
                    <tr key={sale.id} className="border-b border-zinc-100">
                      <td className="py-2 pr-3">
                        <Link to={`/admin/orders/${encodeURIComponent(sale.id)}`} className="font-black text-sky-700 hover:text-sky-800">
                          #{sale.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-2 pr-3">
                        {new Date(sale.createdAt).toLocaleDateString('es-AR')} {new Date(sale.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 pr-3">{sale.user?.name || 'Mostrador'}</td>
                      <td className="py-2 pr-3">{sale.paymentMethod || 'local'}</td>
                      <td className="py-2 pr-3">{sale.itemsCount}</td>
                      <td className="py-2 pr-3 font-black">$ {sale.total.toLocaleString('es-AR')}</td>
                      <td className="py-2 pr-3">{sale.admin?.name || '-'}</td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/admin/orders/${encodeURIComponent(sale.id)}/ticket`} target="_blank" rel="noreferrer" className="btn-outline !h-8 !rounded-xl px-3 text-xs font-bold">
                            Ticket
                          </Link>
                          <Link to={`/admin/orders/${encodeURIComponent(sale.id)}/print`} target="_blank" rel="noreferrer" className="btn-outline !h-8 !rounded-xl px-3 text-xs font-bold">
                            A4
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
