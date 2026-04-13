import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { EmptyState } from '@/components/ui/empty-state';
import { TextAreaField } from '@/components/ui/textarea-field';
import { TextField } from '@/components/ui/text-field';
import type { CartLine } from './admin-quick-sales.helpers';
import { money } from './order-ui';

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
