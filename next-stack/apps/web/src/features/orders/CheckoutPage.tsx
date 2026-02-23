import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { quoteCart } from '@/features/cart/api';
import { cartStorage } from '@/features/cart/storage';
import type { CartQuoteResponse } from '@/features/cart/types';
import { ordersApi } from './api';

export function CheckoutPage() {
  const navigate = useNavigate();
  const [quote, setQuote] = useState<CartQuoteResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const localItems = cartStorage.getItems();

  useEffect(() => {
    let active = true;
    setLoading(true);
    quoteCart(localItems)
      .then((res) => {
        if (!active) return;
        setQuote(res);
      })
      .catch((err) => {
        if (!active) return;
        setMessage(err instanceof Error ? err.message : 'Error preparando checkout');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const validItems = useMemo(() => quote?.items.filter((i) => i.valid) ?? [], [quote]);

  async function confirmOrder() {
    setSubmitting(true);
    setMessage('');
    try {
      const order = await ordersApi.checkout({
        items: cartStorage.getItems(),
        paymentMethod,
      });
      cartStorage.clear();
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error creando pedido');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h1 className="text-2xl font-black tracking-tight">Checkout Next</h1>
          <Button variant="outline" asChild><Link to="/cart">← Volver al carrito</Link></Button>
        </div>

        {message ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{message}</div> : null}

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">Preparando checkout...</div>
        ) : !validItems.length ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="font-black">No hay items válidos para confirmar</div>
            <div className="mt-2 text-sm text-zinc-600">Volvé al carrito para revisar stock/productos.</div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Items</div>
              <div className="mt-3 space-y-3">
                {validItems.map((line) => (
                  <div key={line.productId} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3">
                    <div>
                      <div className="font-bold text-zinc-900">{line.name}</div>
                      <div className="text-xs text-zinc-500">{line.quantity} x ${line.unitPrice.toLocaleString('es-AR')}</div>
                    </div>
                    <div className="text-sm font-black text-zinc-900">${line.lineTotal.toLocaleString('es-AR')}</div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Pago</div>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-3 h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm">
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
              </select>
              <div className="mt-4 flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-black text-zinc-900">${(quote?.totals.subtotal ?? 0).toLocaleString('es-AR')}</span>
              </div>
              <Button className="mt-4 w-full" onClick={confirmOrder} disabled={submitting || !validItems.length}>
                {submitting ? 'Confirmando...' : 'Confirmar pedido'}
              </Button>
              <div className="mt-2 text-xs text-zinc-500">Crea pedido en NestJS y descuenta stock.</div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
