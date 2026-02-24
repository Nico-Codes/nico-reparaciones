import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Wrench } from 'lucide-react';
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
        setMessage(res.message ?? 'No se encontro la reparacion');
        return;
      }
      setItem(res.item);
      if (res.message) setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar la reparacion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
              <Wrench className="h-4 w-4" />
              Estado de reparacion
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-zinc-900 md:text-3xl">
              Consulta publica de reparacion
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Ingresa el ID de la reparacion y el telefono del cliente para validar la consulta.
            </p>
          </div>
          <Link to="/" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">
            Volver
          </Link>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:p-5">
          <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_auto] md:items-end">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-500">ID reparacion</label>
              <input
                value={repairId}
                onChange={(e) => setRepairId(e.target.value)}
                placeholder="Ej: cmabcd123..."
                className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none ring-0 transition focus:border-sky-400"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-500">Telefono del cliente *</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Requerido para validar"
                className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none ring-0 transition focus:border-sky-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !repairId.trim() || !customerPhone.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search className="h-4 w-4" />
              {loading ? 'Consultando...' : 'Consultar'}
            </button>
          </div>
        </form>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
        ) : null}
        {!error && message ? (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700">{message}</div>
        ) : null}

        {item ? (
          <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">Reparacion</div>
                <div className="mt-1 text-lg font-black text-zinc-900">{item.id}</div>
              </div>
              <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-bold text-sky-700">
                {item.status}
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Info label="Cliente" value={item.customerName} />
              <Info label="Telefono" value={item.customerPhoneMasked ?? 'No informado'} />
              <Info label="Dispositivo" value={[item.deviceBrand, item.deviceModel].filter(Boolean).join(' ') || 'No informado'} />
              <Info label="Falla" value={item.issueLabel ?? 'No informada'} />
              <Info label="Presupuesto" value={money(item.quotedPrice)} />
              <Info label="Total final" value={money(item.finalPrice)} />
              <Info label="Creada" value={new Date(item.createdAt).toLocaleString('es-AR')} />
              <Info label="Actualizada" value={new Date(item.updatedAt).toLocaleString('es-AR')} />
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

