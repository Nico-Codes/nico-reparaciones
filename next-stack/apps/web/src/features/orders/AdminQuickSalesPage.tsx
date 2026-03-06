import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
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

export function AdminQuickSalesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [savingSale, setSavingSale] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [q, setQ] = useState('');
  const [scanCode, setScanCode] = useState('');
  const [scanQty, setScanQty] = useState(1);
  const [customerName, setCustomerName] = useState('Venta mostrador');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('local');
  const [notes, setNotes] = useState('');

  async function loadProducts(query: string) {
    setLoadingProducts(true);
    try {
      const res = await catalogAdminApi.products({
        q: query.trim() || undefined,
        active: '1',
      });
      setProducts(res.items.filter((product) => product.active && product.stock > 0).slice(0, 50));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando productos');
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    void loadProducts('');
  }, []);

  async function addByCode() {
    const code = scanCode.trim();
    if (!code) return;
    setError('');
    setSuccess('');
    try {
      const res = await catalogAdminApi.products({ q: code, active: '1' });
      const exact = res.items.find((product) => {
        const sku = (product.sku ?? '').trim().toLowerCase();
        const barcode = (product.barcode ?? '').trim().toLowerCase();
        const cmp = code.toLowerCase();
        return sku === cmp || barcode === cmp;
      });
      const candidate = exact ?? res.items[0];
      if (!candidate) {
        setError('Producto no encontrado por SKU o barcode');
        return;
      }
      addToCart(candidate, scanQty);
      setScanCode('');
      setScanQty(1);
      setSuccess('Producto agregado');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo agregar por código');
    }
  }

  function addToCart(product: AdminProduct, quantityRaw = 1) {
    const quantity = clampQty(quantityRaw);
    if (!product.active || product.stock <= 0) {
      setError('El producto está inactivo o sin stock');
      return;
    }
    setCart((prev) => {
      const found = prev.find((line) => line.product.id === product.id);
      if (!found) return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
      return prev.map((line) =>
        line.product.id === product.id
          ? { ...line, quantity: Math.min(product.stock, line.quantity + quantity) }
          : line,
      );
    });
  }

  function updateCartQty(productId: string, value: number) {
    const next = Math.max(0, Math.min(999, Math.trunc(value)));
    setCart((prev) =>
      prev
        .map((line) =>
          line.product.id === productId
            ? { ...line, quantity: Math.min(line.product.stock, next) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((line) => line.product.id !== productId));
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
    if (!cart.length) {
      setError('No hay productos en la venta rápida');
      return;
    }
    setSavingSale(true);
    setError('');
    setSuccess('');
    try {
      const res = await ordersApi.adminQuickSaleConfirm({
        items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        paymentMethod,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      const orderId = res.item.id;
      setCart([]);
      setCustomerPhone('');
      setNotes('');
      setSuccess(`Venta rápida confirmada. Pedido #${orderId.slice(0, 8)}`);
      if (afterAction === 'print_ticket') {
        window.open(`/admin/orders/${encodeURIComponent(orderId)}/ticket`, '_blank', 'noopener,noreferrer');
      } else if (afterAction === 'print_a4') {
        window.open(`/admin/orders/${encodeURIComponent(orderId)}/print`, '_blank', 'noopener,noreferrer');
      } else {
        navigate(`/admin/orders/${encodeURIComponent(orderId)}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo confirmar la venta rápida');
    } finally {
      setSavingSale(false);
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Venta rápida</h1>
            <p className="mt-1 text-sm text-zinc-600">Escanea SKU/barcode, arma ticket y confirma en segundos.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/ventas-rapidas/historial" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">Historial</Link>
            <Link to="/admin/orders" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">Ver pedidos</Link>
            <Link to="/admin/productos" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">Productos</Link>
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
                <div className="font-black">Escáner / carga rápida</div>
                <div className="text-xs text-zinc-500">Puedes escanear o escribir SKU/barcode y presionar Enter.</div>
              </div>
            </div>
            <div className="card-body">
              <form
                className="grid gap-2 sm:grid-cols-[1fr_140px_auto]"
                onSubmit={(e) => {
                  e.preventDefault();
                  void addByCode();
                }}
              >
                <input
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm"
                  placeholder="SKU o barcode"
                  autoFocus={location.pathname === '/admin/ventas-rapidas'}
                />
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={scanQty}
                  onChange={(e) => setScanQty(clampQty(Number(e.target.value || '1')))}
                  className="h-11 rounded-2xl border border-zinc-200 px-3 text-right text-sm font-bold"
                />
                <button type="submit" className="btn-primary !h-11 !rounded-xl px-5 text-sm font-bold">Agregar</button>
              </form>
            </div>
          </section>

          <section className="card">
            <div className="card-head flex items-center justify-between gap-2">
              <div className="font-black">Búsqueda manual</div>
              <span className="badge-zinc">{products.length} resultados</span>
            </div>
            <div className="card-body space-y-3">
              <form
                className="grid gap-2 sm:grid-cols-[1fr_auto]"
                onSubmit={(e) => {
                  e.preventDefault();
                  void loadProducts(q);
                }}
              >
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm"
                  placeholder="Buscar por nombre, SKU o barcode"
                />
                <button type="submit" className="btn-outline !h-11 !rounded-xl px-5 text-sm font-bold">Buscar</button>
              </form>

              {loadingProducts ? (
                <div className="text-sm text-zinc-600">Cargando productos...</div>
              ) : products.length === 0 ? (
                <div className="text-sm text-zinc-600">Sin resultados para mostrar.</div>
              ) : (
                <div className="grid gap-2">
                  {products.map((product) => (
                    <div key={product.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-zinc-900">{product.name}</div>
                          <div className="text-xs text-zinc-500">
                            SKU: {product.sku || '-'} | Barcode: {product.barcode || '-'} | Stock: {product.stock}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-black text-zinc-900">$ {Number(product.price).toLocaleString('es-AR')}</div>
                          <button type="button" onClick={() => addToCart(product, 1)} className="btn-outline !h-9 !rounded-xl px-4 text-sm font-bold">
                            Agregar
                          </button>
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
              <div className="text-sm text-zinc-600">No hay productos en la venta rápida.</div>
            ) : (
              <>
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
                          onChange={(e) => updateCartQty(line.product.id, Number(e.target.value || '0'))}
                          className="h-9 w-20 rounded-xl border border-zinc-200 px-2 text-right text-sm font-bold"
                        />
                        <button type="button" onClick={() => removeFromCart(line.product.id)} className="btn-ghost !h-9 !rounded-xl px-3 text-xs font-bold">
                          Quitar
                        </button>
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
                  <div className="grid gap-1">
                    <label className="text-sm font-bold text-zinc-700">Nombre cliente (opcional)</label>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm"
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-bold text-zinc-700">Teléfono (opcional)</label>
                    <input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="h-11 rounded-2xl border border-zinc-200 px-3 text-sm"
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-bold text-zinc-700">Método de pago</label>
                    <CustomSelect
                      value={paymentMethod}
                      onChange={setPaymentMethod}
                      options={paymentMethodOptions}
                      triggerClassName="min-h-11 rounded-2xl font-bold"
                      ariaLabel="Seleccionar método de pago"
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-sm font-bold text-zinc-700">Notas (opcional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => void confirmSale('view')}
                    disabled={savingSale}
                    className="btn-primary !h-11 !rounded-xl px-5 text-sm font-bold"
                  >
                    {savingSale ? 'Confirmando...' : 'Confirmar venta'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmSale('print_ticket')}
                    disabled={savingSale}
                    className="btn-outline !h-11 !rounded-xl px-5 text-sm font-bold"
                  >
                    Confirmar e imprimir ticket
                  </button>
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    disabled={savingSale}
                    className="btn-outline !h-11 !rounded-xl px-5 text-sm font-bold"
                  >
                    Limpiar ticket
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
