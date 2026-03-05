import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { catalogAdminApi, type AdminProduct } from './api';

declare global {
  interface Window {
    JsBarcode?: (
      element: SVGElement | string,
      value: string,
      options?: Record<string, unknown>,
    ) => void;
  }
}

const BARCODE_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';

function loadJsBarcodeScript() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Entorno no disponible'));
      return;
    }
    if (window.JsBarcode) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[data-jsbarcode="1"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar JsBarcode')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = BARCODE_SCRIPT_SRC;
    script.async = true;
    script.dataset.jsbarcode = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar JsBarcode'));
    document.head.appendChild(script);
  });
}

export function AdminProductLabelPage() {
  const { id = '' } = useParams();
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const [item, setItem] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const barcodeValue = useMemo(() => {
    if (!item) return '';
    const value = (item.barcode ?? item.sku ?? '').trim();
    return value || item.id.slice(0, 12).toUpperCase();
  }, [item]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const res = await catalogAdminApi.product(id);
        if (!active) return;
        setItem(res.item);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Error cargando etiqueta');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    async function renderBarcode() {
      if (!barcodeValue || !barcodeRef.current) return;
      try {
        await loadJsBarcodeScript();
        if (!active || !barcodeRef.current || !window.JsBarcode) return;
        window.JsBarcode(barcodeRef.current, barcodeValue, {
          format: 'CODE128',
          width: 2,
          height: 62,
          displayValue: false,
          margin: 0,
        });
      } catch {
        // Si falla la librería externa, mantenemos el valor textual.
      }
    }
    void renderBarcode();
    return () => {
      active = false;
    };
  }, [barcodeValue]);

  if (loading) {
    return <div className="mx-auto max-w-3xl px-6 py-8 text-sm text-zinc-600">Cargando etiqueta...</div>;
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error || 'Producto no encontrado'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-[460px]">
        <div className="mb-3 flex items-center justify-end gap-2 print:hidden">
          <button type="button" onClick={() => window.print()} className="btn-primary !h-10 !rounded-xl px-4 text-sm font-bold">
            Imprimir
          </button>
          <Link to={`/admin/productos/${encodeURIComponent(item.id)}/editar`} className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
            Volver
          </Link>
          <button type="button" onClick={() => window.close()} className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
            Cerrar
          </button>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_8px_30px_-18px_#0f172a47] print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <div className="text-base font-black tracking-tight text-zinc-900">{item.name}</div>
          <div className="mt-2 text-xs text-zinc-600">SKU: {item.sku || '-'}</div>
          <div className="mt-1 text-xs text-zinc-600">Barcode: {item.barcode || '-'}</div>
          <div className="mt-1 text-xs text-zinc-600">Precio: $ {Math.round(Number(item.price || 0)).toLocaleString('es-AR')}</div>

          <div className="my-3 flex justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-2.5">
            <svg ref={barcodeRef} aria-label="codigo de barras" />
          </div>

          <div className="text-center text-sm font-black tracking-tight text-zinc-900">{barcodeValue}</div>
        </section>
      </div>
    </div>
  );
}
