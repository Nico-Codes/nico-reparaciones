import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { quoteCart } from './api';
import { useCartItems } from './useCart';
import type { CartQuoteResponse } from './types';

const money = (n: number) => `$ ${n.toLocaleString('es-AR')}`;

export function CartPage() {
  const cart = useCartItems();
  const [quote, setQuote] = useState<CartQuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage('');

    quoteCart(cart.items)
      .then((res) => {
        if (!active) return;
        setQuote(res);

        if (res.items.length) {
          cart.setItems(
            res.items
              .filter((i) => i.valid)
              .map((i) => ({ productId: i.productId, quantity: i.quantity })),
          );
        }
      })
      .catch((err) => {
        if (!active) return;
        setMessage(err instanceof Error ? err.message : 'Error cotizando carrito');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cart.items]);

  const lines = quote?.items ?? [];
  const validLines = useMemo(() => lines.filter((i) => i.valid), [lines]);
  const hasStockIssue = useMemo(
    () => lines.some((i) => !i.valid || i.quantity > Math.max(0, i.stockAvailable)),
    [lines],
  );

  return (
    <div className="store-shell">
      <div className="page-head store-hero">
        <div>
          <div className="page-title">Carrito</div>
          <div className="page-subtitle">Revisa tus productos antes de confirmar.</div>
        </div>
        <Link to="/store" className="btn-ghost h-11 w-full justify-center sm:w-auto">
          Seguir comprando
        </Link>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          {message}
        </div>
      ) : null}

      {!cart.items.length ? (
        <div className="card mt-4">
          <div className="card-body">
            <div className="font-black" data-testid="empty-cart-message">Tu carrito está vacío.</div>
            <div className="muted mt-1">Agrega productos desde la tienda.</div>
            <div className="mt-4">
              <Link to="/store" className="btn-primary">Ir a la tienda</Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-3 lg:items-start" data-cart-grid>
          <div className="order-2 grid gap-3 lg:order-1 lg:col-span-2">
            {loading && !quote ? (
              <div className="card">
                <div className="card-body">Cotizando carrito...</div>
              </div>
            ) : null}

            {lines.map((line) => {
              const isOut = line.stockAvailable <= 0;
              const maxQty = line.stockAvailable > 0 ? line.stockAvailable : 1;

              return (
                <div
                  key={line.productId}
                  className={`card ${line.valid ? '' : 'border-rose-200 bg-rose-50/40'}`}
                >
                  <div className="card-body p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50">
                        <svg className="h-7 w-7 text-zinc-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M5 8.5 12 4l7 4.5v7L12 20l-7-4.5v-7Z" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M5.5 8.5 12 12l6.5-3.5M12 12v7.5" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            {line.slug ? (
                              <Link
                                to={`/store/${line.slug}`}
                                className="block truncate text-[15px] font-black leading-tight text-zinc-900 hover:text-sky-700"
                              >
                                {line.name || 'Producto'}
                              </Link>
                            ) : (
                              <div className="block truncate text-[15px] font-black leading-tight text-zinc-900">
                                {line.name || 'Producto'}
                              </div>
                            )}

                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                              <span>
                                Precio: <span className="font-black text-zinc-900">{money(line.unitPrice)}</span>
                              </span>
                              <span className="text-zinc-300">|</span>
                              <span>
                                Stock: <span className="font-black text-zinc-900">{line.stockAvailable}</span>
                              </span>
                              {isOut ? <span className="badge-rose">Sin stock</span> : null}
                            </div>

                            {!line.valid && line.reason ? (
                              <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                                {line.reason}
                              </div>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            onClick={() => cart.remove(line.productId)}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 px-3 text-xs font-black text-zinc-700 hover:bg-zinc-50"
                            aria-label="Eliminar del carrito"
                          >
                            Quitar
                          </button>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="inline-flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/70 p-1 sm:w-auto sm:justify-start sm:gap-2">
                            <button
                              type="button"
                              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-base font-black text-zinc-800 hover:bg-zinc-100 disabled:opacity-40"
                              onClick={() => cart.update(line.productId, Math.max(1, line.quantity - 1))}
                              disabled={isOut || line.quantity <= 1}
                              aria-label="Restar"
                            >
                              -
                            </button>

                            <label className="sr-only" htmlFor={`qty_${line.productId}`}>Cantidad</label>
                            <input
                              id={`qty_${line.productId}`}
                              type="number"
                              min={1}
                              max={maxQty}
                              inputMode="numeric"
                              value={line.quantity}
                              onChange={(e) => cart.update(line.productId, Math.min(maxQty, Math.max(1, Number(e.target.value) || 1)))}
                              className="h-11 w-16 rounded-xl border border-zinc-200 bg-white text-center text-base font-black text-zinc-900"
                              disabled={isOut}
                            />

                            <button
                              type="button"
                              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-base font-black text-zinc-800 hover:bg-zinc-100 disabled:opacity-40"
                              onClick={() => cart.update(line.productId, Math.min(maxQty, line.quantity + 1))}
                              disabled={isOut || line.quantity >= maxQty}
                              aria-label="Sumar"
                            >
                              +
                            </button>
                          </div>

                          <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-3 py-2 sm:block sm:bg-transparent sm:px-0 sm:py-0 sm:text-right">
                            <div className="text-[11px] text-zinc-500">Subtotal</div>
                            <div className="text-lg font-black text-zinc-900 sm:text-base">
                              {money(line.lineTotal)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="order-1 lg:order-2 lg:col-span-1">
            <div className="card h-fit overflow-hidden">
              <div className="card-head">
                <div className="min-w-0">
                  <div className="font-black">Resumen</div>
                  <div className="text-xs text-zinc-500">{quote?.totals.itemsCount ?? 0} items</div>
                </div>
              </div>

              <div className="card-body grid gap-4">
                <div className="rounded-2xl bg-zinc-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-zinc-600">Total</div>
                    <div className="text-2xl font-black tracking-tight text-zinc-900">
                      {money(quote?.totals.subtotal ?? 0)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Link
                    to="/checkout"
                    className={`btn-primary h-11 w-full justify-center ${hasStockIssue || !validLines.length ? 'pointer-events-none opacity-50' : ''}`}
                    aria-disabled={hasStockIssue || !validLines.length}
                    tabIndex={hasStockIssue || !validLines.length ? -1 : 0}
                  >
                    Finalizar compra
                  </Link>

                  {hasStockIssue ? (
                    <div className="mt-1 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                      Hay productos sin stock o con cantidad mayor al stock. Ajusta el carrito para continuar.
                    </div>
                  ) : null}

                  <button className="btn-outline w-full justify-center" type="button" onClick={() => cart.clear()}>
                    Vaciar carrito
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
