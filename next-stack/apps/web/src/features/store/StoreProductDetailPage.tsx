import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cartStorage } from '@/features/cart/storage';
import { storeApi } from './api';
import type { StoreProduct } from './types';

export function StoreProductDetailPage() {
  const { slug = '' } = useParams();
  const [item, setItem] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    storeApi.product(slug)
      .then((res) => {
        if (!active) return;
        setItem(res.item);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Producto no encontrado');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4">
          <Button variant="outline" asChild><Link to="/store">← Volver a tienda</Link></Button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">Cargando producto...</div>
        ) : error || !item ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm">{error || 'Producto no encontrado'}</div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">{item.category?.name ?? 'Sin categoría'}</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-900">{item.name}</h1>
            <div className="mt-3 text-4xl font-black text-zinc-900">${item.price.toLocaleString('es-AR')}</div>
            <div className="mt-2 text-sm text-zinc-600">
              Stock actual:{' '}
              <span className={`font-bold ${item.stock > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{item.stock}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => cartStorage.add(item.id, 1)} disabled={item.stock <= 0}>Agregar al carrito</Button>
              <Button variant="outline" asChild><Link to="/cart">Ver carrito</Link></Button>
            </div>
            {item.description ? (
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                {item.description}
              </div>
            ) : null}
            <div className="mt-4 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
              <div><span className="font-semibold text-zinc-800">SKU:</span> {item.sku || '—'}</div>
              <div><span className="font-semibold text-zinc-800">Código:</span> {item.barcode || '—'}</div>
              <div><span className="font-semibold text-zinc-800">Slug:</span> {item.slug}</div>
              <div><span className="font-semibold text-zinc-800">Destacado:</span> {item.featured ? 'Sí' : 'No'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
