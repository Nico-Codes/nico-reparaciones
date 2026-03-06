import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import { helpFaqAdminApi, type HelpFaqAdminItem, type HelpFaqUpdateInput } from './helpFaqApi';

export function AdminHelpFaqPage() {
  const [items, setItems] = useState<HelpFaqAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [form, setForm] = useState({ question: '', answer: '', category: 'general', sortOrder: '0', active: true });

  function sortItems(rows: HelpFaqAdminItem[]) {
    return [...rows].sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.createdAt.localeCompare(b.createdAt);
    });
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await helpFaqAdminApi.list({ q: q || undefined, active: activeFilter || undefined, category: categoryFilter || undefined });
      setItems(sortItems(res.items));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando FAQ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [q, activeFilter, categoryFilter]);

  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category).filter(Boolean))).sort(), [items]);
  const activeOptions = [
    { value: '', label: 'Activas e inactivas' },
    { value: '1', label: 'Solo activas' },
    { value: '0', label: 'Solo inactivas' },
  ];
  const categoryOptions = useMemo(
    () => [{ value: '', label: 'Todas las categorías' }, ...categories.map((category) => ({ value: category, label: category }))],
    [categories],
  );

  async function createItem(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const res = await helpFaqAdminApi.create({
        question: form.question.trim(),
        answer: form.answer.trim(),
        category: form.category || 'general',
        sortOrder: Number(form.sortOrder || 0),
        active: form.active,
      });
      setItems((prev) => sortItems([res.item, ...prev]));
      setForm({ question: '', answer: '', category: 'general', sortOrder: '0', active: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error creando FAQ');
    } finally {
      setCreating(false);
    }
  }

  async function patchItem(id: string, patch: HelpFaqUpdateInput) {
    setError('');
    try {
      const res = await helpFaqAdminApi.update(id, patch);
      setItems((prev) => sortItems(prev.map((entry) => (entry.id === id ? res.item : entry))));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error actualizando FAQ');
    }
  }

  return (
    <div className="store-shell">
      <div className="page-head store-hero">
        <div>
          <div className="page-title">Ayuda editable</div>
          <div className="page-subtitle">Gestioná preguntas y respuestas públicas de la sección Ayuda.</div>
        </div>
        <div className="flex gap-2">
          <Link to="/help" className="btn-outline h-11 justify-center px-4">Ver Ayuda pública</Link>
          <Link to="/admin/configuraciones" className="btn-outline h-11 justify-center px-4">Volver a configuración</Link>
        </div>
      </div>

      {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="card">
          <div className="card-body p-4">
            <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Nueva pregunta</div>
            <form className="mt-3 grid gap-2" onSubmit={(e) => void createItem(e)}>
              <input value={form.question} onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))} placeholder="¿Cómo sigo mi pedido?" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" required />
              <textarea value={form.answer} onChange={(e) => setForm((prev) => ({ ...prev, answer: e.target.value }))} rows={5} placeholder="Respuesta..." className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" required />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} placeholder="general" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
                <input value={form.sortOrder} onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))} type="number" placeholder="Orden" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />
                Activa
              </label>
              <button className="btn-primary h-11 w-full justify-center" type="submit" disabled={creating}>
                {creating ? 'Creando...' : 'Crear FAQ'}
              </button>
            </form>
          </div>
        </section>

        <section className="card">
          <div className="card-body p-4">
            <div className="mb-3 grid gap-2 md:grid-cols-[1fr_180px_180px_auto]">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
              <CustomSelect value={activeFilter} onChange={setActiveFilter} options={activeOptions} triggerClassName="min-h-10 rounded-xl" ariaLabel="Filtrar por estado de FAQ" />
              <CustomSelect value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions} triggerClassName="min-h-10 rounded-xl" ariaLabel="Filtrar por categoría FAQ" />
              <button className="btn-outline h-10 justify-center px-4" type="button" onClick={() => void load()}>Actualizar</button>
            </div>

            {loading ? (
              <div className="rounded-xl border border-zinc-200 p-3 text-sm">Cargando...</div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 p-3 text-sm">Sin preguntas.</div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-zinc-200 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <input
                          value={item.question}
                          onChange={(e) => setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, question: e.target.value } : entry)))}
                          onBlur={(e) => void patchItem(item.id, { question: e.target.value })}
                          className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-sm font-black text-zinc-900"
                        />
                        <div className="text-xs text-zinc-500">{item.category} · orden {item.sortOrder}</div>
                      </div>
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700">
                        <input type="checkbox" checked={item.active} onChange={(e) => void patchItem(item.id, { active: e.target.checked })} />
                        Activa
                      </label>
                    </div>
                    <textarea
                      rows={4}
                      value={item.answer}
                      onChange={(e) => setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, answer: e.target.value } : entry)))}
                      onBlur={(e) => void patchItem(item.id, { answer: e.target.value })}
                      className="mt-3 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                    />
                    <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                      <input
                        value={item.category}
                        onChange={(e) => setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, category: e.target.value } : entry)))}
                        onBlur={(e) => void patchItem(item.id, { category: e.target.value })}
                        className="h-9 rounded-xl border border-zinc-200 px-3 text-sm"
                      />
                      <input
                        value={String(item.sortOrder)}
                        type="number"
                        onChange={(e) => setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, sortOrder: Number(e.target.value || 0) } : entry)))}
                        onBlur={(e) => void patchItem(item.id, { sortOrder: Number(e.target.value || 0) })}
                        className="h-9 rounded-xl border border-zinc-200 px-3 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => void patchItem(item.id, { question: item.question, answer: item.answer, category: item.category, sortOrder: item.sortOrder, active: item.active })}
                        className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
