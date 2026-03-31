import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quoteCart } from '@/features/cart/api';
import { cartStorage } from '@/features/cart/storage';
import type { CartQuoteResponse } from '@/features/cart/types';
import { authStorage } from '@/features/auth/storage';
import {
  buildCheckoutItems,
  buildValidCheckoutLines,
  hasInvalidCheckoutItems,
  resolveSelectedPayment,
  sameCartItems,
} from './checkout.helpers';
import {
  CheckoutAccountSection,
  CheckoutActions,
  CheckoutEmptyState,
  CheckoutFeedback,
  CheckoutLoadingState,
  CheckoutPaymentSection,
  CheckoutSummarySection,
} from './checkout.sections';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { ordersApi } from './api';

export function CheckoutPage() {
  const navigate = useNavigate();
  const [quote, setQuote] = useState<CartQuoteResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const localItems = cartStorage.getItems();
  const hasCartItems = localItems.length > 0;
  const user = authStorage.getUser();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage('');

    quoteCart(localItems)
      .then((response) => {
        if (!active) return;
        setQuote(response);

        if (response.items.length) {
          const normalized = buildCheckoutItems(buildValidCheckoutLines(response.items));
          const current = cartStorage.getItems();
          if (!sameCartItems(normalized, current)) {
            cartStorage.setItems(normalized);
          }
        }
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

  const validItems = useMemo(() => buildValidCheckoutLines(quote?.items ?? []), [quote]);
  const validCheckoutItems = useMemo(() => buildCheckoutItems(validItems), [validItems]);
  const hasInvalidItems = useMemo(() => hasInvalidCheckoutItems(quote?.items ?? []), [quote]);
  const canConfirm = !loading && !submitting && validCheckoutItems.length > 0;
  const selectedPayment = useMemo(() => resolveSelectedPayment(paymentMethod), [paymentMethod]);

  async function confirmOrder() {
    if (!canConfirm) return;
    setSubmitting(true);
    setMessage('');
    try {
      const order = await ordersApi.checkout({
        items: validCheckoutItems,
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
    return <CheckoutLoadingState message="Preparando checkout" />;
  }

  if (!validItems.length) {
    return (
      <CheckoutEmptyState
        hasCartItems={hasCartItems}
        hasInvalidItems={hasInvalidItems}
        message={message}
      />
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

      <CheckoutFeedback message={message} />

      <div className="commerce-layout commerce-layout--checkout">
        <div className="commerce-stack">
          <CheckoutPaymentSection
            paymentMethod={paymentMethod}
            submitting={submitting}
            onChange={setPaymentMethod}
          />
          <CheckoutAccountSection user={user} />
          <CheckoutActions canConfirm={canConfirm} submitting={submitting} onConfirm={() => void confirmOrder()} />
        </div>

        <CheckoutSummarySection
          quote={quote}
          items={validItems}
          paymentTitle={selectedPayment.title}
        />
      </div>
    </PageShell>
  );
}
