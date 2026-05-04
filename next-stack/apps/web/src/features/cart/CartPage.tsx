import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { quoteCart } from './api';
import {
  buildQuotedCartItems,
  buildValidCartLines,
  filterInventoryCartQuote,
  hasCartStockIssue,
  sameCartItems,
} from './cart.helpers';
import {
  CartEmptyState,
  CartFeedback,
  CartHeaderActions,
  CartLinesSection,
  CartSummarySection,
  CartStockLimitPopup,
} from './cart.sections';
import { useCartItems } from './useCart';
import type { CartQuoteResponse } from './types';

export function CartPage() {
  const navigate = useNavigate();
  const cart = useCartItems();
  const [quote, setQuote] = useState<CartQuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stockLimitNotice, setStockLimitNotice] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage('');

    quoteCart(cart.items)
      .then((response) => {
        if (!active) return;
        const { quote: inventoryQuote, removedSpecialOrderCount } = filterInventoryCartQuote(response);
        setQuote(inventoryQuote);

        if (response.errors?.length) {
          setMessage('No pudimos interpretar algunos productos del carrito. Quita esos items y vuelve a agregarlos desde la tienda.');
          return;
        }

        if (removedSpecialOrderCount > 0) {
          setMessage('Los productos por encargue se compran directamente desde su ficha.');
        }

        if (response.items.length) {
          const normalizedItems = buildQuotedCartItems(inventoryQuote.items);
          if (!sameCartItems(normalizedItems, cart.items)) {
            cart.setItems(normalizedItems);
          }
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

  useEffect(() => {
    if (!stockLimitNotice) return;
    const timeout = window.setTimeout(() => setStockLimitNotice(''), 3600);
    return () => window.clearTimeout(timeout);
  }, [stockLimitNotice]);

  const lines = quote?.items ?? [];
  const validLines = useMemo(() => buildValidCartLines(lines), [lines]);
  const hasStockIssue = useMemo(() => hasCartStockIssue(lines), [lines]);
  const canCheckout = !loading && !hasStockIssue && validLines.length > 0;

  if (!cart.items.length) {
    return <CartEmptyState hasItems={false} message={message} />;
  }

  return (
    <PageShell context="store" className="cart-page-shell">
      <PageHeader
        context="store"
        className="cart-page-header"
        eyebrow="Compra"
        title="Carrito"
        subtitle="Revisa cantidades, stock y total antes de pasar al checkout."
        actions={<CartHeaderActions itemsCount={quote?.totals.itemsCount ?? cart.items.length} />}
      />

      <CartFeedback message={message} />

      <div className="commerce-layout commerce-layout--cart">
        <CartLinesSection
          lines={lines}
          validCount={validLines.length}
          hasStockIssue={hasStockIssue}
          loading={loading}
          hasQuote={Boolean(quote)}
          onUpdate={cart.update}
          onRemove={cart.remove}
          onQuantityLimit={(productName, maxQuantity) => {
            const units = maxQuantity === 1 ? 'unidad disponible' : 'unidades disponibles';
            setStockLimitNotice(`No se pueden agregar mas unidades de ${productName}: solo hay ${maxQuantity} ${units} en stock.`);
          }}
        />

        <CartSummarySection
          total={quote?.totals.subtotal ?? 0}
          hasStockIssue={hasStockIssue}
          canCheckout={canCheckout}
          onCheckout={() => navigate('/checkout')}
          onClear={cart.clear}
        />
      </div>

      <CartStockLimitPopup message={stockLimitNotice} onClose={() => setStockLimitNotice('')} />
    </PageShell>
  );
}
