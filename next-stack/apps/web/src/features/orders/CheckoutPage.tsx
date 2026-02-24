import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { quoteCart } from '@/features/cart/api';
import { cartStorage } from '@/features/cart/storage';
import type { CartQuoteResponse } from '@/features/cart/types';
import { authStorage } from '@/features/auth/storage';
import { ordersApi } from './api';

const PAYMENT_OPTIONS = [
  { value: 'efectivo', title: 'Pago en el local', subtitle: 'Pagas al retirar.' },
  { value: 'transferencia', title: 'Transferencia', subtitle: 'Te enviamos los datos luego de confirmar.' },
  { value: 'debito', title: 'Débito', subtitle: 'Pagas al retirar con tarjeta.' },
  { value: 'credito', title: 'Crédito', subtitle: 'Pagas al retirar con tarjeta.' },
] as const;

const money = (n: number) => `$ ${n.toLocaleString('es-AR')}`;

export function CheckoutPage() {
  const navigate = useNavigate();
  const [quote, setQuote] = useState<CartQuoteResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const localItems = cartStorage.getItems();
  const user = authStorage.getUser();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage('');

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
  const selectedPayment = PAYMENT_OPTIONS.find((p) => p.value === paymentMethod) ?? PAYMENT_OPTIONS[0];

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
    <div className="store-shell">
      <div className="page-head store-hero">
        <div>
          <div className="page-title">Checkout</div>
          <div className="page-subtitle">Confirma tu pedido para retiro en local.</div>
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="card mt-4">
          <div className="card-body">Preparando checkout...</div>
        </div>
      ) : !validItems.length ? (
        <div className="card mt-4">
          <div className="card-body">
            <div className="font-black" data-testid="empty-cart-message">Tu carrito está vacío.</div>
            <div className="muted mt-1">Agrega productos desde la tienda para confirmar.</div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link to="/store" className="btn-primary w-full sm:w-auto">Ir a la tienda</Link>
              <Link to="/cart" className="btn-outline w-full sm:w-auto">Volver al carrito</Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-5 lg:items-start">
          <div className="order-2 lg:order-1 lg:col-span-3">
            <div className="card">
              <div className="card-head flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-black">Confirmación</div>
                  <div className="text-xs text-zinc-500">Revisa tu pedido y confirma una sola vez.</div>
                </div>
                <span className="badge-zinc shrink-0">{quote?.totals.itemsCount ?? 0} items</span>
              </div>

              <div className="card-body grid gap-6">
                <div className="grid gap-3">
                  <label className="text-sm font-black text-zinc-700">Método de pago</label>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-2">
                    {PAYMENT_OPTIONS.map((opt) => {
                      const active = paymentMethod === opt.value;
                      return (
                        <label key={opt.value} className="block cursor-pointer">
                          <input
                            className="sr-only peer"
                            type="radio"
                            name="payment_method"
                            value={opt.value}
                            checked={active}
                            onChange={() => setPaymentMethod(opt.value)}
                          />
                          <div
                            className={`rounded-2xl border bg-white p-4 transition ${
                              active
                                ? 'border-sky-300 bg-sky-50 ring-2 ring-sky-100'
                                : 'border-zinc-200 hover:bg-zinc-50'
                            }`}
                          >
                            <div className="font-black text-zinc-900">{opt.title}</div>
                            <div className="mt-1 text-xs text-zinc-600">{opt.subtitle}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="font-black text-zinc-900">Tus datos</div>
                      <div className="mt-2 grid gap-1 text-sm text-zinc-700">
                        <div><span className="font-black">Nombre:</span> {user?.name ?? '-'}</div>
                        <div className="truncate"><span className="font-black">Email:</span> {user?.email ?? '-'}</div>
                        <div>
                          <span className="font-black">Estado de correo:</span>{' '}
                          {user?.emailVerified ? 'Verificado' : 'Pendiente'}
                        </div>
                      </div>
                    </div>
                    <Link to="/auth/login" className="btn-ghost btn-sm w-full justify-center sm:w-auto">
                      Cambiar cuenta
                    </Link>
                  </div>
                </div>

                <div className="grid gap-2 sm:flex sm:flex-row">
                  <button
                    className="btn-primary h-11 w-full sm:w-auto"
                    type="button"
                    onClick={confirmOrder}
                    disabled={submitting || !validItems.length}
                  >
                    {submitting ? 'Procesando...' : 'Confirmar pedido'}
                  </button>
                  <Link to="/cart" className="btn-outline h-11 w-full justify-center sm:w-auto">
                    Volver al carrito
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-2 lg:sticky lg:top-20 lg:self-start">
            <div className="card overflow-hidden">
              <div className="card-head flex items-center justify-between">
                <div className="font-black">Resumen</div>
                <span className="badge-zinc">{money(quote?.totals.subtotal ?? 0)}</span>
              </div>

              <div className="card-body grid gap-4">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
                  <div className="text-xs font-black uppercase tracking-wide text-zinc-500">Pago seleccionado</div>
                  <div className="mt-1 font-black text-zinc-900">{selectedPayment.title}</div>
                </div>

                <div className="grid gap-2">
                  {validItems.map((line) => (
                    <div key={line.productId} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-zinc-900">{line.name}</div>
                        <div className="text-xs text-zinc-500">
                          x{line.quantity} · {money(line.unitPrice)}
                        </div>
                      </div>
                      <div className="whitespace-nowrap font-black text-zinc-900">{money(line.lineTotal)}</div>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-zinc-100" />

                <div className="rounded-2xl bg-zinc-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-zinc-600">Total</div>
                    <div className="text-2xl font-black tracking-tight text-zinc-900">
                      {money(quote?.totals.subtotal ?? 0)}
                    </div>
                  </div>
                </div>

                <div className="pt-1 lg:hidden">
                  <Link to="/cart" className="btn-outline h-11 w-full justify-center">
                    Editar carrito
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
