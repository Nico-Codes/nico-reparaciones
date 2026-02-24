import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { fetchHelpFaq, type HelpFaqPublicItem } from './api';

export function HelpPage() {
  const [items, setItems] = useState<HelpFaqPublicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    void fetchHelpFaq()
      .then((res) => {
        if (!cancelled) setItems(res.items);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando ayuda');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((i) => `${i.question} ${i.answer} ${i.category}`.toLowerCase().includes(term));
  }, [items, q]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Ayuda</h1>
            <p className="mt-1 text-sm text-zinc-600">Preguntas frecuentes y soluciones rápidas.</p>
          </div>
          <Link to="/" className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
            Volver
          </Link>
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar problema o respuesta..."
            className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm"
          />
        </div>

        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm">Cargando ayuda...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm">No hay resultados.</div>
          ) : (
            filtered.map((item) => {
              const open = openId === item.id;
              return (
                <div key={item.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setOpenId((prev) => (prev === item.id ? null : item.id))}
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                  >
                    <div>
                      <div className="text-base font-black text-zinc-900">{item.question}</div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">{item.category}</div>
                    </div>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`grid transition-[grid-template-rows,opacity] duration-250 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="min-h-0">
                      <div className="px-4 pb-4 text-sm leading-6 text-zinc-700">{item.answer}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

