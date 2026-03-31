import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import { money } from './order-ui';
import type { CartLine } from './admin-quick-sales.helpers';
import type { AdminProduct } from '@/features/catalogAdmin/api';

export function AdminQuickSalesHeaderActions() {
  return (
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
  );
}

export function AdminQuickSalesScannerSection({
  scanCode,
  scanQty,
  canAddByCode,
  addingByCode,
  savingSale,
  autoFocus,
  onScanCodeChange,
  onScanQtyChange,
  onSubmit,
}: {
  scanCode: string;
  scanQty: number;
  canAddByCode: boolean;
  addingByCode: boolean;
  savingSale: boolean;
  autoFocus: boolean;
  onScanCodeChange: (value: string) => void;
  onScanQtyChange: (value: number) => void;
  onSubmit: () => void;
}) {
  return (
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
            onSubmit();
          }}
        >
          <TextField
            value={scanCode}
            onChange={(event) => onScanCodeChange(event.target.value)}
            placeholder="SKU o codigo de barras"
            aria-label="Escanear SKU o codigo de barras"
            data-qa="quick-sale-scan-code"
            autoFocus={autoFocus}
            disabled={savingSale || addingByCode}
            wrapperClassName="sm:col-span-1"
          />
          <input
            type="number"
            min={1}
            max={999}
            value={scanQty}
            onChange={(event) => onScanQtyChange(Number(event.target.value || '1'))}
            disabled={savingSale || addingByCode}
            className="h-11 rounded-2xl border border-zinc-200 px-3 text-right text-sm font-bold"
          />
          <Button type="submit" disabled={!canAddByCode}>
            {addingByCode ? 'Agregando...' : 'Agregar'}
          </Button>
        </form>
      </div>
    </section>
  );
}

function ProductRow({
  product,
  disabled,
  onAdd,
}: {
  product: AdminProduct;
  disabled: boolean;
  onAdd: (product: AdminProduct) => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-black text-zinc-900">{product.name}</div>
          <div className="text-xs text-zinc-500">
            SKU: {product.sku || '-'} | Codigo: {product.barcode || '-'} | Stock: {product.stock}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm font-black text-zinc-900">{money(Number(product.price))}</div>
          <Button type="button" variant="outline" size="sm" onClick={() => onAdd(product)} disabled={disabled}>
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminQuickSalesProductSearchSection({
  q,
  products,
  loadingProducts,
  canSearchProducts,
  savingSale,
  addingByCode,
  onQueryChange,
  onSubmit,
  onAddProduct,
}: {
  q: string;
  products: AdminProduct[];
  loadingProducts: boolean;
  canSearchProducts: boolean;
  savingSale: boolean;
  addingByCode: boolean;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  onAddProduct: (product: AdminProduct) => void;
}) {
  return (
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
            onSubmit();
          }}
        >
          <TextField
            value={q}
            onChange={(event) => onQueryChange(event.target.value)}
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
              <ProductRow key={product.id} product={product} disabled={savingSale || addingByCode} onAdd={onAddProduct} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CartLineRow({
  line,
  savingSale,
  onQuantityChange,
  onRemove,
}: {
  line: CartLine;
  savingSale: boolean;
  onQuantityChange: (productId: string, value: number) => void;
  onRemove: (productId: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2">
      <div className="truncate text-sm font-black text-zinc-900">{line.product.name}</div>
      <div className="mt-1 text-xs text-zinc-500">{money(Number(line.product.price))} c/u</div>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={Math.max(0, line.product.stock)}
          value={line.quantity}
          onChange={(event) => onQuantityChange(line.product.id, Number(event.target.value || '0'))}
          disabled={savingSale}
          className="h-9 w-20 rounded-xl border border-zinc-200 px-2 text-right text-sm font-bold"
        />
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(line.product.id)} disabled={savingSale}>
          Quitar
        </Button>
      </div>
    </div>
  );
}

export function AdminQuickSalesTicketSection({
  cart,
  totals,
  hasInvalidCartLine,
  savingSale,
  canConfirmSale,
  customerName,
  customerPhone,
  phoneError,
  paymentMethod,
  paymentMethodOptions,
  notes,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onPaymentMethodChange,
  onNotesChange,
  onQuantityChange,
  onRemoveLine,
  onConfirmView,
  onConfirmTicket,
  onClearCart,
}: {
  cart: CartLine[];
  totals: { itemsCount: number; total: number };
  hasInvalidCartLine: boolean;
  savingSale: boolean;
  canConfirmSale: boolean;
  customerName: string;
  customerPhone: string;
  phoneError: string;
  paymentMethod: string;
  paymentMethodOptions: Array<{ value: string; label: string }>;
  notes: string;
  onCustomerNameChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onQuantityChange: (productId: string, value: number) => void;
  onRemoveLine: (productId: string) => void;
  onConfirmView: () => void;
  onConfirmTicket: () => void;
  onClearCart: () => void;
}) {
  return (
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
                <CartLineRow
                  key={line.product.id}
                  line={line}
                  savingSale={savingSale}
                  onQuantityChange={onQuantityChange}
                  onRemove={onRemoveLine}
                />
              ))}
            </div>

            <div className="rounded-2xl bg-zinc-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-zinc-600">Total</span>
                <span className="text-xl font-black text-zinc-900">{money(totals.total)}</span>
              </div>
            </div>

            <div className="grid gap-2">
              <TextField
                label="Nombre del cliente (opcional)"
                value={customerName}
                onChange={(event) => onCustomerNameChange(event.target.value)}
                disabled={savingSale}
              />
              <TextField
                label="Telefono (opcional)"
                value={customerPhone}
                onChange={(event) => onCustomerPhoneChange(event.target.value)}
                disabled={savingSale}
                error={phoneError || undefined}
                hint="Si lo completas, usamos entre 6 y 20 digitos para asociar la venta."
              />
              <div className="grid gap-1">
                <label className="text-sm font-bold text-zinc-700">Metodo de pago</label>
                <CustomSelect
                  value={paymentMethod}
                  onChange={onPaymentMethodChange}
                  options={paymentMethodOptions}
                  disabled={savingSale}
                  triggerClassName="min-h-11 rounded-2xl font-bold"
                  ariaLabel="Seleccionar metodo de pago"
                />
              </div>
              <TextAreaField
                label="Notas (opcional)"
                value={notes}
                onChange={(event) => onNotesChange(event.target.value)}
                rows={3}
                disabled={savingSale}
              />
            </div>

            <div className="grid gap-2">
              <Button type="button" onClick={onConfirmView} disabled={!canConfirmSale}>
                {savingSale ? 'Confirmando...' : 'Confirmar venta'}
              </Button>
              <Button type="button" variant="outline" onClick={onConfirmTicket} disabled={!canConfirmSale}>
                Confirmar e imprimir ticket
              </Button>
              <Button type="button" variant="outline" onClick={onClearCart} disabled={savingSale || cart.length === 0}>
                Limpiar ticket
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
