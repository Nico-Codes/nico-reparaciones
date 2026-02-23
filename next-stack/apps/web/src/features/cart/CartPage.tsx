import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { quoteCart } from './api';
import { useCartItems } from './useCart';
import type { CartQuoteResponse } from './types';

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
        // sincroniza cantidades si backend ajustó por stock
        if (res.items.length) {
          cart.setItems(res.items.filter((i) => i.valid).map((i) => ({ productId: i.productId, quantity: i.quantity })));
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

  const validLines = quote?.items.filter((i) => i.valid) ?? [];

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Carrito Next</h1>
              <div className="text-sm text-zinc-600">Carrito local + validación real contra API NestJS</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/store">Seguir comprando</Link></Button>
            <Button variant="outline" onClick={() => cart.clear()} disabled={!cart.items.length}>Vaciar</Button>
          </div>
        </div>

        {message ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{message}</div> : null}

        {!cart.items.length ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <div className="text-lg font-black text-zinc-900">Tu carrito está vacío</div>
            <div className="mt-2 text-sm text-zinc-600">Agregá productos desde la Tienda Next para probar el flujo.</div>
            <div className="mt-4"><Button asChild><Link to="/store">Ir a tienda</Link></Button></div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="space-y-3">
              {loading && !quote ? <div className="rounded-2xl border border-zinc-200 bg-white p-4">Cotizando carrito...</div> : null}
              {(quote?.items ?? []).map((line) => (
                <div key={line.productId} className={`rounded-2xl border p-4 shadow-sm ${line.valid ? 'border-zinc-200 bg-white' : 'border-rose-200 bg-rose-50/60'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-black text-zinc-900">{line.name}</div>
                      <div className="mt-1 text-xs text-zinc-500">{line.category?.name ?? 'Sin categoría'}</div>
                      {!line.valid && line.reason ? (
                        <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                          {line.reason}
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      onClick={() => cart.remove(line.productId)}
                      aria-label="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-700">Cantidad</span>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={line.quantity}
                        onChange={(e) => cart.update(line.productId, Number(e.target.value) || 1)}
                        className="h-10 w-24 rounded-xl border border-zinc-200 px-3 text-sm"
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-500">${line.unitPrice.toLocaleString('es-AR')} c/u</div>
                      <div className="text-lg font-black text-zinc-900">${line.lineTotal.toLocaleString('es-AR')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Resumen</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span>Items válidos</span><span className="font-bold">{quote?.totals.itemsCount ?? 0}</span></div>
                <div className="flex justify-between text-base"><span className="font-semibold">Subtotal</span><span className="font-black text-zinc-900">${(quote?.totals.subtotal ?? 0).toLocaleString('es-AR')}</span></div>
              </div>
              <Button className="mt-4 w-full" asChild disabled={!validLines.length}>
                <Link to="/checkout">Continuar a checkout</Link>
              </Button>
              <div className="mt-2 text-xs text-zinc-500">Checkout crea pedido real en NestJS y descuenta stock.</div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
