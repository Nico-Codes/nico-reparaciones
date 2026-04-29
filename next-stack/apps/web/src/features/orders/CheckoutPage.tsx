import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { quoteCart } from '@/features/cart/api';
import { cartStorage } from '@/features/cart/storage';
import type { CartQuoteResponse } from '@/features/cart/types';
import { filterInventoryCartQuote } from '@/features/cart/cart.helpers';
import { authStorage } from '@/features/auth/storage';
import {
  buildCheckoutItems,
  buildSpecialOrderCheckoutItems,
  buildValidCheckoutLines,
  hasInvalidCheckoutItems,
  resolveCheckoutPaymentMethods,
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
import type { CheckoutConfig } from './types';

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [quote, setQuote] = useState<CartQuoteResponse | null>(null);
  const [checkoutConfig, setCheckoutConfig] = useState<CheckoutConfig | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const specialOrderCheckout = useMemo(() => buildSpecialOrderCheckoutItems(location.search), [location.search]);
  const isSpecialOrderMode = specialOrderCheckout.isSpecialOrderMode;
  const stableCheckoutSourceItems = useMemo(
    () => (isSpecialOrderMode ? specialOrderCheckout.items : cartStorage.getItems()),
    [isSpecialOrderMode, specialOrderCheckout.items],
  );
  const hasCartItems = stableCheckoutSourceItems.length > 0;
  const user = authStorage.getUser();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage('');

    Promise.allSettled([
      specialOrderCheckout.error
        ? Promise.resolve({ items: [], totals: { subtotal: 0, itemsCount: 0 } } as CartQuoteResponse)
        : quoteCart(stableCheckoutSourceItems),
      ordersApi.checkoutConfig(),
    ])
      .then(([quoteResult, configResult]) => {
        if (!active) return;
        if (quoteResult.status === 'fulfilled') {
          const inventoryFilter = isSpecialOrderMode ? null : filterInventoryCartQuote(quoteResult.value);
          const response = isSpecialOrderMode ? quoteResult.value : inventoryFilter?.quote ?? quoteResult.value;
          setQuote(response);

          if (!isSpecialOrderMode && quoteResult.value.items.length) {
            const normalized = buildCheckoutItems(response.items);
            const current = cartStorage.getItems();
            if (!sameCartItems(normalized, current)) {
              cartStorage.setItems(normalized);
            }
          }

          if (configResult.status === 'fulfilled') {
            setCheckoutConfig(configResult.value);
          } else {
            setCheckoutConfig(null);
          }
          if (specialOrderCheckout.error) {
            setMessage(specialOrderCheckout.error);
          } else if (inventoryFilter && inventoryFilter.removedSpecialOrderCount > 0) {
            setMessage('Los productos por encargue se compran directamente desde su ficha.');
          }
          return;
        }

        setMessage(
          quoteResult.reason instanceof Error
            ? quoteResult.reason.message
            : 'Error preparando el checkout',
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [stableCheckoutSourceItems, isSpecialOrderMode, specialOrderCheckout.error]);

  const validItems = useMemo(() => buildValidCheckoutLines(quote?.items ?? []), [quote]);
  const validCheckoutItems = useMemo(() => buildCheckoutItems(validItems), [validItems]);
  const hasInvalidItems = useMemo(() => hasInvalidCheckoutItems(quote?.items ?? []), [quote]);
  const paymentOptions = useMemo(() => resolveCheckoutPaymentMethods(checkoutConfig), [checkoutConfig]);
  const canConfirm = !loading && !submitting && validCheckoutItems.length > 0 && !hasInvalidItems;
  const selectedPayment = useMemo(
    () => resolveSelectedPayment(paymentMethod, paymentOptions),
    [paymentMethod, paymentOptions],
  );

  useEffect(() => {
    if (!paymentOptions.some((option) => option.value === paymentMethod) && paymentOptions.length) {
      setPaymentMethod(paymentOptions[0].value);
    }
  }, [paymentMethod, paymentOptions]);

  async function confirmOrder() {
    if (!canConfirm) return;
    setSubmitting(true);
    setMessage('');
    try {
      const order = await ordersApi.checkout({
        items: validCheckoutItems,
        paymentMethod,
      });
      if (!isSpecialOrderMode) {
        cartStorage.clear();
      }
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

  const quotedItems = quote?.items ?? [];

  if (!quotedItems.length) {
    return (
      <CheckoutEmptyState
        hasCartItems={hasCartItems}
        hasInvalidItems={hasInvalidItems}
        message={message}
        mode={isSpecialOrderMode ? 'special-order' : 'cart'}
      />
    );
  }

  return (
    <PageShell context="store" className="space-y-6">
      <PageHeader
        context="store"
        eyebrow={isSpecialOrderMode ? 'Encargo' : 'Compra'}
        title={isSpecialOrderMode ? 'Finalizar encargo' : 'Finalizar compra'}
        subtitle={
          isSpecialOrderMode
            ? 'Ultima revision antes de confirmar el producto por encargue.'
            : 'Ultima revision antes de confirmar tu pedido para retiro en local.'
        }
        actions={<StatusBadge label={`${quotedItems.length} ${quotedItems.length === 1 ? 'producto' : 'productos'}`} tone="info" />}
      />

      <CheckoutFeedback message={message} />

      <div className="commerce-layout commerce-layout--checkout">
        <div className="commerce-stack">
          <CheckoutPaymentSection
            paymentMethod={paymentMethod}
            paymentOptions={paymentOptions}
            submitting={submitting}
            onChange={setPaymentMethod}
          />
          <CheckoutAccountSection user={user} />
          <CheckoutActions
            canConfirm={canConfirm}
            submitting={submitting}
            onConfirm={() => void confirmOrder()}
            secondaryTo={isSpecialOrderMode ? '/store' : '/cart'}
            secondaryLabel={isSpecialOrderMode ? 'Volver a tienda' : 'Volver al carrito'}
          />
        </div>

        <CheckoutSummarySection
          quote={quote}
          items={quotedItems}
          paymentTitle={selectedPayment.title}
          paymentSubtitle={selectedPayment.subtitle}
        />
      </div>
    </PageShell>
  );
}
