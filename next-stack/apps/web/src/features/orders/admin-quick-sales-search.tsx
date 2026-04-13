import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { TextField } from '@/components/ui/text-field';
import type { AdminProduct } from '@/features/catalogAdmin/api';
import { money } from './order-ui';

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
