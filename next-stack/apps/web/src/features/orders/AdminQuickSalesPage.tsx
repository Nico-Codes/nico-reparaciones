import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import { catalogAdminApi, type AdminProduct } from '@/features/catalogAdmin/api';
import { ordersApi } from './api';

type CartLine = {
  product: AdminProduct;
  quantity: number;
};

const PAYMENT_METHODS = [
  { key: 'local', label: 'Pago en el local' },
  { key: 'mercado_pago', label: 'Mercado Pago' },
  { key: 'transferencia', label: 'Transferencia' },
] as const;

function clampQty(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(999, Math.trunc(value)));
}

function normalizePhone(value: string) {
  return value.replace(/\D+/g, '');
}

function validatePhone(value: string) {
  if (!value.trim()) return '';
  const digits = normalizePhone(value);
  if (digits.length < 6) return 'Ingresa un telefono valido con al menos 6 digitos.';
  if (digits.length > 20) return 'El telefono no puede superar los 20 digitos.';
  return '';
}

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
  const phoneError = validatePhone(customerPhone);
  const hasInvalidCartLine = cart.some(
    (line) => !line.product.active || line.product.stock <= 0 || line.quantity <= 0 || line.quantity > line.product.stock,
  );
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
      setProducts(response.items.filter((product) => product.active && product.stock > 0).slice(0, 50));
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

  function addToCart(product: AdminProduct, quantityRaw = 1) {
    const quantity = clampQty(quantityRaw);
    if (!product.active || product.stock <= 0) {
      return { ok: false as const, message: 'El producto esta inactivo o no tiene stock disponible.' };
    }
    const currentLine = cart.find((line) => line.product.id === product.id);
    if (currentLine && currentLine.quantity >= product.stock) {
      return { ok: false as const, message: 'Ya alcanzaste el stock disponible para este producto.' };
    }

    setError('');
    setCart((current) => {
      const found = current.find((line) => line.product.id === product.id);
      if (!found) return [...current, { product, quantity: Math.min(quantity, product.stock) }];
      return current.map((line) =>
        line.product.id === product.id
          ? { ...line, quantity: Math.min(product.stock, line.quantity + quantity) }
          : line,
      );
    });
    return { ok: true as const };
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
      const exact = response.items.find((product) => {
        const sku = (product.sku ?? '').trim().toLowerCase();
        const barcode = (product.barcode ?? '').trim().toLowerCase();
        const candidate = code.toLowerCase();
        return sku === candidate || barcode === candidate;
      });

      if (!exact) {
        setError('No encontramos un producto con ese SKU o codigo de barras.');
        return;
      }

      const result = addToCart(exact, scanQty);
      if (!result.ok) {
        setError(result.message);
        return;
      }

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

  function updateCartQty(productId: string, value: number) {
    const next = Math.max(0, Math.min(999, Math.trunc(value)));
    setCart((current) =>
      current
        .map((line) =>
          line.product.id === productId
            ? { ...line, quantity: Math.min(line.product.stock, next) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  function removeFromCart(productId: string) {
    setCart((current) => current.filter((line) => line.product.id !== productId));
  }

  const totals = useMemo(() => {
    const itemsCount = cart.reduce((acc, line) => acc + line.quantity, 0);
    const total = cart.reduce((acc, line) => acc + line.quantity * Number(line.product.price || 0), 0);
    return { itemsCount, total };
  }, [cart]);

  const paymentMethodOptions = useMemo(
    () => PAYMENT_METHODS.map((method) => ({ value: method.key, label: method.label })),
    [],
  );

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
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/ventas-rapidas/historial">Historial</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/orders">Ver pedidos</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/productos">Productos</Link>
            </Button>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{success}</div> : null}

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-4">
          <section className="card">
            <div className="card-head">
              <div>
                <div className="font-black">Escaner / carga rapida</div>
                <div className="text-xs text-zinc-500">Podes escanear o escribir SKU/codigo de barras y confirmar con Enter.</div>
              </div>
            </div>
            <div className="card-body">
              <form
                className="grid gap-2 sm:grid-cols-[1fr_140px_auto]"
                onSubmit={(event) => {
                  event.preventDefault();
                  void addByCode();
                }}
              >
                <TextField
                  value={scanCode}
                  onChange={(event) => setScanCode(event.target.value)}
                  placeholder="SKU o codigo de barras"
                  aria-label="Escanear SKU o codigo de barras"
                  data-qa="quick-sale-scan-code"
                  autoFocus={location.pathname === '/admin/ventas-rapidas'}
                  disabled={savingSale || addingByCode}
                  wrapperClassName="sm:col-span-1"
                />
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={scanQty}
                  onChange={(event) => setScanQty(clampQty(Number(event.target.value || '1')))}
                  disabled={savingSale || addingByCode}
                  className="h-11 rounded-2xl border border-zinc-200 px-3 text-right text-sm font-bold"
                />
                <Button type="submit" disabled={!canAddByCode}>
                  {addingByCode ? 'Agregando...' : 'Agregar'}
                </Button>
              </form>
            </div>
          </section>

          <section className="card">
            <div className="card-head flex items-center justify-between gap-2">
              <div className="font-black">Busqueda manual</div>
              <span className="badge-zinc">{products.length} resultados</span>
            </div>
            <div className="card-body space-y-3">
              <form
                className="grid gap-2 sm:grid-cols-[1fr_auto]"
                onSubmit={(event) => {
                  event.preventDefault();
                  void loadProducts(q);
                }}
              >
                <TextField
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder="Buscar por nombre, SKU o codigo de barras"
                  disabled={savingSale || addingByCode}
                  wrapperClassName="sm:col-span-1"
                />
                <Button type="submit" variant="outline" disabled={!canSearchProducts}>
                  {loadingProducts ? 'Buscando...' : 'Buscar'}
                </Button>
              </form>

              {loadingProducts ? (
                <LoadingBlock label="Cargando productos" lines={3} />
              ) : products.length === 0 ? (
                <EmptyState
                  title="No hay productos para mostrar"
                  description="Proba con otro termino de busqueda o verifica si siguen teniendo stock."
                />
              ) : (
                <div className="grid gap-2">
                  {products.map((product) => (
                    <div key={product.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-zinc-900">{product.name}</div>
                          <div className="text-xs text-zinc-500">
                            SKU: {product.sku || '-'} | Codigo: {product.barcode || '-'} | Stock: {product.stock}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-black text-zinc-900">$ {Number(product.price).toLocaleString('es-AR')}</div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSuccess('');
                              const result = addToCart(product, 1);
                              if (!result.ok) {
                                setError(result.message);
                              }
                            }}
                            disabled={savingSale || addingByCode}
                          >
                            Agregar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="card h-fit xl:sticky xl:top-20">
          <div className="card-head flex items-center justify-between gap-2">
            <div className="font-black">Ticket actual</div>
            <span className="badge-sky">{totals.itemsCount} items</span>
          </div>
          <div className="card-body space-y-3">
            {cart.length === 0 ? (
              <EmptyState
                title="Todavia no agregaste productos"
                description="Escanea un codigo o busca manualmente para armar el ticket."
              />
            ) : (
              <>
                {hasInvalidCartLine ? (
                  <div className="ui-alert ui-alert--warning">
                    <div>
                      <span className="ui-alert__title">Hay lineas para revisar</span>
                      <div className="ui-alert__text">Ajusta cantidades o quita los productos sin stock antes de confirmar la venta.</div>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-2">
                  {cart.map((line) => (
                    <div key={line.product.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2">
                      <div className="truncate text-sm font-black text-zinc-900">{line.product.name}</div>
                      <div className="mt-1 text-xs text-zinc-500">$ {Number(line.product.price).toLocaleString('es-AR')} c/u</div>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={Math.max(0, line.product.stock)}
                          value={line.quantity}
                          onChange={(event) => updateCartQty(line.product.id, Number(event.target.value || '0'))}
                          disabled={savingSale}
                          className="h-9 w-20 rounded-xl border border-zinc-200 px-2 text-right text-sm font-bold"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(line.product.id)}
                          disabled={savingSale}
                        >
                          Quitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-zinc-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-zinc-600">Total</span>
                    <span className="text-xl font-black text-zinc-900">$ {totals.total.toLocaleString('es-AR')}</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <TextField
                    label="Nombre del cliente (opcional)"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    disabled={savingSale}
                  />
                  <TextField
                    label="Telefono (opcional)"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    disabled={savingSale}
                    error={phoneError || undefined}
                    hint="Si lo completas, usamos entre 6 y 20 digitos para asociar la venta."
                  />
                  <div className="grid gap-1">
                    <label className="text-sm font-bold text-zinc-700">Metodo de pago</label>
                    <CustomSelect
                      value={paymentMethod}
                      onChange={setPaymentMethod}
                      options={paymentMethodOptions}
                      disabled={savingSale}
                      triggerClassName="min-h-11 rounded-2xl font-bold"
                      ariaLabel="Seleccionar metodo de pago"
                    />
                  </div>
                  <TextAreaField
                    label="Notas (opcional)"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    disabled={savingSale}
                  />
                </div>

                <div className="grid gap-2">
                  <Button type="button" onClick={() => void confirmSale('view')} disabled={!canConfirmSale}>
                    {savingSale ? 'Confirmando...' : 'Confirmar venta'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => void confirmSale('print_ticket')} disabled={!canConfirmSale}>
                    Confirmar e imprimir ticket
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setCart([])} disabled={savingSale || cart.length === 0}>
                    Limpiar ticket
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
