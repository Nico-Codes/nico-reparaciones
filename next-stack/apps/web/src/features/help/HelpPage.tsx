import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/loading-block';
import { PageHeader } from '@/components/ui/page-header';
import { PageShell } from '@/components/ui/page-shell';
import { SectionCard } from '@/components/ui/section-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
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
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'No pudimos cargar la ayuda.');
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
    return items.filter((item) => `${item.question} ${item.answer} ${item.category}`.toLowerCase().includes(term));
  }, [items, q]);

  const resultLabel = `${filtered.length} ${filtered.length === 1 ? 'resultado' : 'resultados'}`;

  return (
    <PageShell context="store" className="px-4 py-4 md:py-5">
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          context="store"
          eyebrow="Ayuda"
          title="Centro de ayuda"
          subtitle="Preguntas frecuentes y soluciones rápidas para compras, pedidos y reparaciones."
          actions={(
            <>
              <StatusBadge tone="info" label={loading ? 'Cargando FAQ' : 'FAQ pública'} />
              <Button asChild variant="outline" size="sm">
                <Link to="/store">Volver a la tienda</Link>
              </Button>
            </>
          )}
        />

        <SectionCard
          title="Buscá una respuesta"
          description="Filtrá por pregunta, respuesta o categoría para encontrar la ayuda más rápido."
          tone="info"
        >
          <TextField
            label="Buscar en ayuda"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Ej: retiro, pago, reparación"
            leadingIcon={<Search className="h-4 w-4" />}
          />
        </SectionCard>

        {error ? (
          <div className="ui-alert ui-alert--danger">
            <div>
              <span className="ui-alert__title">No pudimos cargar la ayuda.</span>
              <div className="ui-alert__text">{error}</div>
            </div>
          </div>
        ) : null}

        {loading ? (
          <SectionCard title="Cargando ayuda" description="Estamos preparando las preguntas frecuentes publicadas.">
            <LoadingBlock label="Cargando ayuda" lines={4} />
          </SectionCard>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <SectionCard>
            <EmptyState
              title="No encontramos resultados"
              description={
                q.trim()
                  ? 'Probá con otra palabra clave o revisá las categorías disponibles.'
                  : 'Todavía no hay preguntas frecuentes publicadas.'
              }
              actions={
                q.trim() ? (
                  <Button type="button" variant="outline" onClick={() => setQ('')}>
                    Limpiar búsqueda
                  </Button>
                ) : undefined
              }
            />
          </SectionCard>
        ) : null}

        {!loading && !error && filtered.length > 0 ? (
          <SectionCard
            title="Preguntas frecuentes"
            description="Abrí cada respuesta para ver el detalle completo."
            actions={<StatusBadge tone="neutral" size="sm" label={resultLabel} />}
            bodyClassName="space-y-3"
          >
            {filtered.map((item) => {
              const open = openId === item.id;
              return (
                <div key={item.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setOpenId((prev) => (prev === item.id ? null : item.id))}
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-zinc-50"
                  >
                    <div className="min-w-0">
                      <div className="text-base font-black text-zinc-900">{item.question}</div>
                      <div className="mt-2">
                        <StatusBadge tone="neutral" size="sm" label={item.category || 'General'} />
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 ${
                        open ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-250 ease-out ${
                      open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="min-h-0">
                      <div className="px-4 pb-4 text-sm leading-6 text-zinc-700">{item.answer}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </SectionCard>
        ) : null}
      </div>
    </PageShell>
  );
}
