import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
export { AdminQuickSalesProductSearchSection } from './admin-quick-sales-search';
export { AdminQuickSalesTicketSection } from './admin-quick-sales-ticket';

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
