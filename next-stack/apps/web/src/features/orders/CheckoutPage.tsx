import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CreditCard, ShieldCheck, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { quoteCart } from '@/features/cart/api';
import { cartStorage } from '@/features/cart/storage';
import type { CartQuoteResponse } from '@/features/cart/types';
import { authStorage } from '@/features/auth/storage';
import { ordersApi } from './api';

const PAYMENT_OPTIONS = [
  { value: 'efectivo', title: 'Pago en el local', subtitle: 'Pagás al retirar.' },
  { value: 'transferencia', title: 'Transferencia', subtitle: 'Te enviamos los datos luego de confirmar.' },
  { value: 'debito', title: 'Débito', subtitle: 'Pagás al retirar con tarjeta.' },
  { value: 'credito', title: 'Crédito', subtitle: 'Pagás al retirar con tarjeta.' },
] as const;

const money = (value: number) => `$ ${value.toLocaleString('es-AR')}`;

type BadgeTone = 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'danger';

function emailVerificationTone(verified: boolean | undefined): BadgeTone {
  return verified ? 'success' : 'warning';
}

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
      .then((response) => {
        if (!active) return;
        setQuote(response);
      })
      .catch((cause) => {
        if (!active) return;
        setMessage(cause instanceof Error ? cause.message : 'Error preparando el checkout');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const validItems = useMemo(() => quote?.items.filter((item) => item.valid) ?? [], [quote]);
  const selectedPayment = PAYMENT_OPTIONS.find((option) => option.value === paymentMethod) ?? PAYMENT_OPTIONS[0];

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
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Error creando el pedido');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PageShell context="store" className="space-y-6">
        <PageHeader
          context="store"
          eyebrow="Compra"
          title="Preparando checkout"
          subtitle="Estamos validando stock y resumen antes de mostrar la confirmación."
          actions={<StatusBadge label="Preparando" tone="info" />}
        />
        <SectionCard>
          <LoadingBlock label="Preparando checkout" lines={4} />
        </SectionCard>
      </PageShell>
    );
  }

  if (!validItems.length) {
    return (
      <PageShell context="store" className="space-y-6">
        <PageHeader
          context="store"
          eyebrow="Compra"
          title="Checkout"
          subtitle="Necesitás productos válidos en el carrito para confirmar la compra."
        />

        {message ? (
          <div className="ui-alert ui-alert--danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <span className="ui-alert__title">No pudimos preparar el checkout.</span>
              <div className="ui-alert__text">{message}</div>
            </div>
          </div>
        ) : null}

        <SectionCard>
          <EmptyState
            title="Tu carrito está vacío"
            description="Volvé a la tienda para agregar productos o revisá el carrito antes de continuar."
            actions={(
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/store">Ir a la tienda</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/cart">Volver al carrito</Link>
                </Button>
              </div>
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
        title="Finalizar compra"
        subtitle="Última revisión antes de confirmar tu pedido para retiro en local."
        actions={<StatusBadge label={`${validItems.length} productos`} tone="info" />}
      />

      {message ? (
        <div className="ui-alert ui-alert--danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <span className="ui-alert__title">No pudimos confirmar el pedido.</span>
            <div className="ui-alert__text">{message}</div>
          </div>
        </div>
      ) : null}

      <div className="commerce-layout commerce-layout--checkout">
        <div className="commerce-stack">
          <SectionCard
            title="Pago"
            description="Elegí cómo querés completar la compra. El retiro siempre es en el local."
          >
            <div className="checkout-option-grid">
              {PAYMENT_OPTIONS.map((option) => {
                const active = paymentMethod === option.value;
                return (
                  <label key={option.value} className="block cursor-pointer">
                    <input
                      className="sr-only peer"
                      type="radio"
                      name="payment_method"
                      value={option.value}
                      checked={active}
                      onChange={() => setPaymentMethod(option.value)}
                    />
                    <div className={`checkout-option ${active ? 'is-active' : ''}`}>
                      <div className="checkout-option__title">{option.title}</div>
                      <div className="checkout-option__subtitle">{option.subtitle}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            tone="muted"
            title="Cuenta"
            description="Estos datos se usan para asociar el pedido y enviarte actualizaciones."
            actions={<StatusBadge label={user?.emailVerified ? 'Email verificado' : 'Email pendiente'} tone={emailVerificationTone(user?.emailVerified)} />}
          >
            <div className="meta-grid">
              <div className="meta-tile">
                <div className="meta-tile__label">Nombre</div>
                <div className="meta-tile__value">{user?.name ?? 'Sin cuenta cargada'}</div>
              </div>
              <div className="meta-tile">
                <div className="meta-tile__label">Email</div>
                <div className="meta-tile__value">{user?.email ?? 'Sin email'}</div>
              </div>
            </div>
            <div className="mt-4">
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth/login">Cambiar cuenta</Link>
              </Button>
            </div>
          </SectionCard>

          <div className="grid gap-2 sm:flex sm:flex-row">
            <Button type="button" className="w-full sm:w-auto" onClick={confirmOrder} disabled={submitting || !validItems.length}>
              <CreditCard className="h-4 w-4" />
              {submitting ? 'Procesando...' : 'Confirmar pedido'}
            </Button>
            <Button asChild variant="outline" className="w-full justify-center sm:w-auto">
              <Link to="/cart">Volver al carrito</Link>
            </Button>
          </div>
        </div>

        <SectionCard
          className="commerce-sticky"
          title="Resumen del pedido"
          description="Control final de productos, método de pago y total estimado."
        >
          <div className="summary-box">
            <div className="summary-box__label">Pago seleccionado</div>
            <div className="summary-box__value">{selectedPayment.title}</div>
          </div>

          <div className="mt-4 line-list">
            {validItems.map((line) => (
              <div key={line.productId} className="line-item">
                <div className="line-item__main">
                  <div className="line-item__title">{line.name}</div>
                  <div className="line-item__meta">
                    {line.quantity} × {money(line.unitPrice)}
                  </div>
                </div>
                <div className="line-item__total">{money(line.lineTotal)}</div>
              </div>
            ))}
          </div>

          <div className="summary-box mt-4">
            <div className="summary-box__label">Total</div>
            <div className="summary-box__value">{money(quote?.totals.subtotal ?? 0)}</div>
          </div>

          <div className="ui-alert ui-alert--info mt-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <span className="ui-alert__title">Compra con retiro en local</span>
              <div className="ui-alert__text">Una vez confirmado, el pedido aparecerá en tu cuenta y el equipo del local podrá continuar con la gestión.</div>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
