import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { catalogAdminApi, type AdminProduct } from '@/features/catalogAdmin/api';
import { ordersApi } from './api';
import {
  addQuickSaleLine,
  buildQuickSaleTotals,
  clampQuickSaleQty,
  filterQuickSaleProducts,
  findQuickSaleProductByCode,
  hasInvalidQuickSaleCart,
  quickSalePaymentOptions,
  removeQuickSaleLine,
  updateQuickSaleLineQty,
  validateQuickSalePhone,
  type CartLine,
} from './admin-quick-sales.helpers';
import {
  AdminQuickSalesHeaderActions,
  AdminQuickSalesProductSearchSection,
  AdminQuickSalesScannerSection,
  AdminQuickSalesTicketSection,
} from './admin-quick-sales.sections';

export function AdminQuickSalesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [savingSale, setSavingSale] = useState(false);
  const [addingByCode, setAddingByCode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [q, setQ] = useState('');
  const [scanCode, setScanCode] = useState('');
  const [scanQty, setScanQty] = useState(1);
  const [customerName, setCustomerName] = useState('Venta mostrador');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('local');
  const [notes, setNotes] = useState('');
  const productsRequestIdRef = useRef(0);
  const addByCodeRequestIdRef = useRef(0);

  const normalizedScanCode = scanCode.trim();
  const phoneError = validateQuickSalePhone(customerPhone);
  const hasInvalidCartLine = hasInvalidQuickSaleCart(cart);
  const canSearchProducts = !loadingProducts && !savingSale && !addingByCode;
  const canAddByCode = normalizedScanCode.length > 0 && !savingSale && !addingByCode;
  const canConfirmSale = cart.length > 0 && !savingSale && !addingByCode && !phoneError && !hasInvalidCartLine;

  async function loadProducts(query: string) {
    const requestId = ++productsRequestIdRef.current;
    setLoadingProducts(true);
    setError('');
    try {
      const response = await catalogAdminApi.products({
        q: query.trim() || undefined,
        active: '1',
      });
      if (requestId !== productsRequestIdRef.current) return;
      setProducts(filterQuickSaleProducts(response.items));
    } catch (cause) {
      if (requestId !== productsRequestIdRef.current) return;
      setError(cause instanceof Error ? cause.message : 'No pudimos cargar los productos.');
    } finally {
      if (requestId !== productsRequestIdRef.current) return;
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    void loadProducts('');
  }, []);

  function applyAddToCart(product: AdminProduct, quantityRaw = 1) {
    const result = addQuickSaleLine(cart, product, quantityRaw);
    if (!result.ok) {
      setError(result.message);
      return result;
    }

    setError('');
    setCart(result.cart);
    return result;
  }

  async function addByCode() {
    const code = normalizedScanCode;
    if (!code || savingSale || addingByCode) return;

    const requestId = ++addByCodeRequestIdRef.current;
    setAddingByCode(true);
    setError('');
    setSuccess('');
    try {
      const response = await catalogAdminApi.products({ q: code, active: '1' });
      if (requestId !== addByCodeRequestIdRef.current) return;

      const exact = findQuickSaleProductByCode(response.items, code);
      if (!exact) {
        setError('No encontramos un producto con ese SKU o codigo de barras.');
        return;
      }

      const result = applyAddToCart(exact, scanQty);
      if (!result.ok) return;

      setScanCode('');
      setScanQty(1);
      setSuccess(`Producto agregado: ${exact.name}.`);
    } catch (cause) {
      if (requestId !== addByCodeRequestIdRef.current) return;
      setError(cause instanceof Error ? cause.message : 'No se pudo agregar el producto por codigo.');
    } finally {
      if (requestId !== addByCodeRequestIdRef.current) return;
      setAddingByCode(false);
    }
  }

  const totals = useMemo(() => buildQuickSaleTotals(cart), [cart]);
  const paymentMethodOptions = useMemo(() => quickSalePaymentOptions(), []);

  async function confirmSale(afterAction: 'view' | 'print_ticket' | 'print_a4') {
    if (savingSale) return;
    if (!cart.length) {
      setError('No hay productos cargados en la venta rapida.');
      return;
    }
    if (phoneError) {
      setError(phoneError);
      return;
    }
    if (hasInvalidCartLine) {
      setError('Hay lineas invalidas en el ticket. Revisa stock y cantidades antes de confirmar.');
      return;
    }

    setSavingSale(true);
    setError('');
    setSuccess('');
    try {
      const response = await ordersApi.adminQuickSaleConfirm({
        items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        paymentMethod,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      const orderId = response.item.id;
      setCart([]);
      setCustomerPhone('');
      setNotes('');
      setSuccess(`Venta rapida confirmada. Pedido #${orderId.slice(0, 8)}.`);

      if (afterAction === 'print_ticket') {
        window.open(`/admin/orders/${encodeURIComponent(orderId)}/ticket`, '_blank', 'noopener,noreferrer');
      } else if (afterAction === 'print_a4') {
        window.open(`/admin/orders/${encodeURIComponent(orderId)}/print`, '_blank', 'noopener,noreferrer');
      } else {
        navigate(`/admin/orders/${encodeURIComponent(orderId)}`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo confirmar la venta rapida.');
    } finally {
      setSavingSale(false);
    }
  }

  return (
    <div className="store-shell space-y-5" data-admin-quick-sales-page>
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Venta rapida</h1>
            <p className="mt-1 text-sm text-zinc-600">Escanea un SKU o codigo de barras, arma el ticket y confirmalo en segundos.</p>
          </div>
          <AdminQuickSalesHeaderActions />
        </div>
      </section>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{success}</div> : null}

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-4">
          <AdminQuickSalesScannerSection
            scanCode={scanCode}
            scanQty={scanQty}
            canAddByCode={canAddByCode}
            addingByCode={addingByCode}
            savingSale={savingSale}
            autoFocus={location.pathname === '/admin/ventas-rapidas'}
            onScanCodeChange={setScanCode}
            onScanQtyChange={(value) => setScanQty(clampQuickSaleQty(value))}
            onSubmit={() => {
              void addByCode();
            }}
          />

          <AdminQuickSalesProductSearchSection
            q={q}
            products={products}
            loadingProducts={loadingProducts}
            canSearchProducts={canSearchProducts}
            savingSale={savingSale}
            addingByCode={addingByCode}
            onQueryChange={setQ}
            onSubmit={() => {
              void loadProducts(q);
            }}
            onAddProduct={(product) => {
              setSuccess('');
              applyAddToCart(product, 1);
            }}
          />
        </div>

        <AdminQuickSalesTicketSection
          cart={cart}
          totals={totals}
          hasInvalidCartLine={hasInvalidCartLine}
          savingSale={savingSale}
          canConfirmSale={canConfirmSale}
          customerName={customerName}
          customerPhone={customerPhone}
          phoneError={phoneError}
          paymentMethod={paymentMethod}
          paymentMethodOptions={paymentMethodOptions}
          notes={notes}
          onCustomerNameChange={setCustomerName}
          onCustomerPhoneChange={setCustomerPhone}
          onPaymentMethodChange={setPaymentMethod}
          onNotesChange={setNotes}
          onQuantityChange={(productId, value) => {
            setCart((current) => updateQuickSaleLineQty(current, productId, value));
          }}
          onRemoveLine={(productId) => {
            setCart((current) => removeQuickSaleLine(current, productId));
          }}
          onConfirmView={() => {
            void confirmSale('view');
          }}
          onConfirmTicket={() => {
            void confirmSale('print_ticket');
          }}
          onClearCart={() => setCart([])}
        />
      </div>
    </div>
  );
}
