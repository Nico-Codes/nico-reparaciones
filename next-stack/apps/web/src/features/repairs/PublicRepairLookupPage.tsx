import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { repairsApi } from './api';
import type { PublicRepairLookupItem } from './types';

function money(v: number | null) {
  if (v == null) return 'No definido';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);
}

export function PublicRepairLookupPage() {
  const [repairId, setRepairId] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [item, setItem] = useState<PublicRepairLookupItem | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setItem(null);
    try {
      const res = await repairsApi.publicLookup({
        repairId: repairId.trim(),
        customerPhone: customerPhone.trim(),
      });
      if (!res.found || !res.item) {
        setMessage(res.message ?? 'No se encontró la reparación');
        return;
      }
      setItem(res.item);
      if (res.message) setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar la reparación');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="store-shell">
      <div className="mx-auto max-w-[640px] px-4 py-4 md:py-5">
        <section className="store-hero mb-3 md:!px-4 md:!py-3">
          <div className="grid gap-3 md:grid-cols-[220px_1fr] md:items-center">
            <h1 className="text-xl font-black leading-tight tracking-tight text-zinc-900 md:text-[1.65rem]">
              Consultar
              <br />
              reparación
            </h1>
            <p className="text-xs leading-relaxed text-zinc-700 md:max-w-[30ch] md:text-sm">
              Ingresá el código y el teléfono que dejaste en el local.
            </p>
          </div>
        </section>

        <section className="card">
          <div className="card-body !p-3 md:!p-3.5">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs leading-relaxed text-zinc-800 md:text-sm">
                <span className="font-black text-zinc-900">Tip:</span> el teléfono puede ir con espacios o guiones, lo
                normalizamos automáticamente.
              </div>

              <div>
                <label className="mb-1 block text-sm font-black text-zinc-900">Código</label>
                <input
                  value={repairId}
                  onChange={(e) => setRepairId(e.target.value)}
                  placeholder="Ej: NR-8F2K1"
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                  required
                />
                <p className="mt-1.5 text-xs text-zinc-500">Te lo damos en el comprobante / WhatsApp.</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-black text-zinc-900">Teléfono</label>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej: 341 555-0000"
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                  required
                />
                <p className="mt-1.5 text-xs text-zinc-500">Debe coincidir con el que registramos en el ingreso.</p>
              </div>

              <button
                type="submit"
                disabled={loading || !repairId.trim() || !customerPhone.trim()}
                className="btn-primary flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                {loading ? 'Buscando...' : 'Buscar'}
              </button>

              <div className="grid gap-2 sm:grid-cols-2">
                <Link to="/store" className="btn-outline flex h-10 items-center justify-center rounded-xl text-sm font-bold">
                  Ir a la tienda
                </Link>
                <Link to="/repairs" className="btn-ghost flex h-10 items-center justify-center rounded-xl text-sm font-bold">
                  Mis reparaciones
                </Link>
              </div>
            </form>
          </div>
        </section>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
        ) : null}
        {!error && message ? (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700">{message}</div>
        ) : null}

        {item ? (
          <section className="mt-4 card">
            <div className="card-head flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">Reparacion</div>
                <div className="mt-1 text-lg font-black text-zinc-900">{item.id}</div>
              </div>
              <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-bold text-sky-700">
                {item.status}
              </div>
            </div>
            <div className="card-body">
              <div className="grid gap-3 md:grid-cols-2">
                <Info label="Cliente" value={item.customerName} />
                <Info label="Teléfono" value={item.customerPhoneMasked ?? 'No informado'} />
                <Info label="Dispositivo" value={[item.deviceBrand, item.deviceModel].filter(Boolean).join(' ') || 'No informado'} />
                <Info label="Falla" value={item.issueLabel ?? 'No informada'} />
                <Info label="Presupuesto" value={money(item.quotedPrice)} />
                <Info label="Total final" value={money(item.finalPrice)} />
                <Info label="Creada" value={new Date(item.createdAt).toLocaleString('es-AR')} />
                <Info label="Actualizada" value={new Date(item.updatedAt).toLocaleString('es-AR')} />
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2">
      <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-zinc-800">{value}</div>
    </div>
  );
}
