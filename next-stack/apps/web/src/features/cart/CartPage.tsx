import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { quoteCart } from './api';
import { useCartItems } from './useCart';
import type { CartQuoteResponse } from './types';

const money = (value: number) => `$ ${value.toLocaleString('es-AR')}`;

type BadgeTone = 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'danger';

function stockTone(valid: boolean, stockAvailable: number): BadgeTone {
  if (!valid || stockAvailable <= 0) return 'danger';
  if (stockAvailable <= 3) return 'warning';
  return 'success';
}

export function CartPage() {
  const navigate = useNavigate();
  const cart = useCartItems();
  const [quote, setQuote] = useState<CartQuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage('');

    quoteCart(cart.items)
      .then((response) => {
        if (!active) return;
        setQuote(response);

        if (response.items.length) {
          const normalized = response.items
            .filter((item) => item.valid)
            .map((item) => ({ productId: item.productId, quantity: item.quantity }));
          const same =
            normalized.length === cart.items.length &&
            normalized.every((item, index) => {
              const current = cart.items[index];
              return current && current.productId === item.productId && current.quantity === item.quantity;
            });
          if (!same) cart.setItems(normalized);
        }
      })
      .catch((cause) => {
        if (!active) return;
        setMessage(cause instanceof Error ? cause.message : 'Error cotizando el carrito');
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
  const validLines = useMemo(() => lines.filter((item) => item.valid), [lines]);
  const hasStockIssue = useMemo(
    () => lines.some((item) => !item.valid || item.quantity > Math.max(0, item.stockAvailable)),
    [lines],
  );
  const canCheckout = !loading && !hasStockIssue && validLines.length > 0;

  if (!cart.items.length) {
    return (
      <PageShell context="store" className="space-y-6">
        <PageHeader
          context="store"
          eyebrow="Compra"
          title="Carrito"
          subtitle="Tu selección queda lista para continuar cuando sumes productos."
          actions={(
            <Button asChild variant="outline" size="sm">
              <Link to="/store">Ir a la tienda</Link>
            </Button>
          )}
        />
        <SectionCard>
          <EmptyState
            title="Tu carrito está vacío"
            description="Agregá productos desde la tienda para ver el resumen y continuar con la compra."
            actions={(
              <Button asChild>
                <Link to="/store">Explorar productos</Link>
              </Button>
            )}
          />
        </SectionCard>
      </PageShell>
    );
  }

  return (
    <PageShell context="store" className="space-y-6">
      <PageHeader
        context="store"
        eyebrow="Compra"
        title="Carrito"
        subtitle="Revisá cantidades, stock y total antes de pasar al checkout."
        actions={(
          <>
            <StatusBadge label={`${quote?.totals.itemsCount ?? cart.items.length} productos`} tone="info" />
            <Button asChild variant="outline" size="sm">
              <Link to="/store">Seguir comprando</Link>
            </Button>
          </>
        )}
      />

      {message ? (
        <div className="ui-alert ui-alert--danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No pudimos cotizar el carrito.</span>
            <div className="ui-alert__text">{message}</div>
          </div>
        </div>
      ) : null}

      <div className="commerce-layout commerce-layout--cart">
        <SectionCard
          title="Productos seleccionados"
          description="El carrito se actualiza con stock y precios reales del catálogo."
          actions={<StatusBadge label={`${validLines.length} válidos`} tone={hasStockIssue ? 'warning' : 'success'} />}
        >
          {loading && !quote ? (
            <LoadingBlock label="Cotizando carrito" lines={4} />
          ) : (
            <div className="line-list">
              {lines.map((line) => {
                const isOut = line.stockAvailable <= 0;
                const maxQty = line.stockAvailable > 0 ? line.stockAvailable : 1;
                return (
                  <article key={line.productId} className="line-item">
                    <div className="line-item__main flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="line-item__title">{line.name || 'Producto'}</div>
                        <StatusBadge
                          label={isOut ? 'Sin stock' : `Stock ${line.stockAvailable}`}
                          tone={stockTone(line.valid, line.stockAvailable)}
                          size="sm"
                        />
                        {!line.valid && line.reason ? <StatusBadge label="Requiere ajuste" tone="danger" size="sm" /> : null}
                      </div>
                      <div className="line-item__meta">
                        {line.slug ? (
                          <Link to={`/store/${line.slug}`} className="font-semibold text-sky-700 hover:text-sky-800">
                            Ver producto
                          </Link>
                        ) : null}
                        {line.slug ? ' · ' : ''}
                        Precio unitario {money(line.unitPrice)}
                      </div>
                      {!line.valid && line.reason ? (
                        <div className="ui-alert ui-alert--warning mt-3">
                          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                          <div>
                            <span className="ui-alert__title">Ajuste requerido</span>
                            <div className="ui-alert__text">{line.reason}</div>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="quantity-stepper">
                          <button
                            type="button"
                            className="quantity-stepper__button"
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
                            onChange={(event) => cart.update(line.productId, Math.min(maxQty, Math.max(1, Number(event.target.value) || 1)))}
                            className="quantity-stepper__input"
                            disabled={isOut}
                          />
                          <button
                            type="button"
                            className="quantity-stepper__button"
                            onClick={() => cart.update(line.productId, Math.min(maxQty, line.quantity + 1))}
                            disabled={isOut || line.quantity >= maxQty}
                            aria-label="Sumar"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-right">
                            <div className="summary-box__label">Subtotal</div>
                            <div className="text-lg font-black text-zinc-950">{money(line.lineTotal)}</div>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => cart.remove(line.productId)}>
                            <Trash2 className="h-4 w-4" />
                            Quitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          className="commerce-sticky"
          title="Resumen"
          description="Cuando el stock es válido podés confirmar el pedido en el checkout."
        >
          <div className="summary-box">
            <div className="summary-box__label">Total estimado</div>
            <div className="summary-box__value">{money(quote?.totals.subtotal ?? 0)}</div>
          </div>

          {hasStockIssue ? (
            <div className="ui-alert ui-alert--warning mt-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
              <div>
                <span className="ui-alert__title">Hay productos para revisar</span>
                <div className="ui-alert__text">Ajustá las cantidades o quitá los ítems sin stock antes de continuar.</div>
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid gap-2">
            <Button
              type="button"
              className="w-full justify-center"
              disabled={!canCheckout}
              onClick={() => navigate('/checkout')}
            >
              Finalizar compra
            </Button>
            <Button type="button" variant="outline" className="w-full justify-center" onClick={() => cart.clear()}>
              Vaciar carrito
            </Button>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
