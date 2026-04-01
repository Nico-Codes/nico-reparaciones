import { Link } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import type { HelpFaqAdminItem } from './helpFaqApi';
import type { HelpFaqFormState } from './admin-help-faq.helpers';

type AdminHelpFaqLayoutProps = {
  items: HelpFaqAdminItem[];
  loading: boolean;
  creating: boolean;
  error: string;
  q: string;
  activeFilter: string;
  categoryFilter: string;
  categoryOptions: { value: string; label: string }[];
  form: HelpFaqFormState;
  onSearchChange: (value: string) => void;
  onActiveFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onFormChange: (patch: Partial<HelpFaqFormState>) => void;
  onCreate: (event: React.FormEvent) => void;
  onRefresh: () => void;
  onItemChange: (id: string, patch: Partial<HelpFaqAdminItem>) => void;
  onItemSave: (item: HelpFaqAdminItem) => void;
};

const ACTIVE_OPTIONS = [
  { value: '', label: 'Activas e inactivas' },
  { value: '1', label: 'Solo activas' },
  { value: '0', label: 'Solo inactivas' },
];

export function AdminHelpFaqLayout({
  items,
  loading,
  creating,
  error,
  q,
  activeFilter,
  categoryFilter,
  categoryOptions,
  form,
  onSearchChange,
  onActiveFilterChange,
  onCategoryFilterChange,
  onFormChange,
  onCreate,
  onRefresh,
  onItemChange,
  onItemSave,
}: AdminHelpFaqLayoutProps) {
  return (
    <div className="store-shell">
      <div className="page-head store-hero">
        <div>
          <div className="page-title">Ayuda editable</div>
          <div className="page-subtitle">Gestiona preguntas y respuestas publicas de la seccion Ayuda.</div>
        </div>
        <div className="flex gap-2">
          <Link to="/help" className="btn-outline h-11 justify-center px-4">Ver Ayuda publica</Link>
          <Link to="/admin/configuraciones" className="btn-outline h-11 justify-center px-4">Volver a configuracion</Link>
        </div>
      </div>

      {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="card">
          <div className="card-body p-4">
            <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Nueva pregunta</div>
            <form className="mt-3 grid gap-2" onSubmit={onCreate}>
              <input value={form.question} onChange={(event) => onFormChange({ question: event.target.value })} placeholder="¿Como sigo mi pedido?" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" required />
              <textarea value={form.answer} onChange={(event) => onFormChange({ answer: event.target.value })} rows={5} placeholder="Respuesta..." className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" required />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.category} onChange={(event) => onFormChange({ category: event.target.value })} placeholder="general" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
                <input value={form.sortOrder} onChange={(event) => onFormChange({ sortOrder: event.target.value })} type="number" placeholder="Orden" className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
                <input type="checkbox" checked={form.active} onChange={(event) => onFormChange({ active: event.target.checked })} />
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
              <input value={q} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar..." className="h-10 rounded-xl border border-zinc-200 px-3 text-sm" />
              <CustomSelect value={activeFilter} onChange={onActiveFilterChange} options={ACTIVE_OPTIONS} triggerClassName="min-h-10 rounded-xl" ariaLabel="Filtrar por estado de FAQ" />
              <CustomSelect value={categoryFilter} onChange={onCategoryFilterChange} options={categoryOptions} triggerClassName="min-h-10 rounded-xl" ariaLabel="Filtrar por categoria FAQ" />
              <button className="btn-outline h-10 justify-center px-4" type="button" onClick={onRefresh}>Actualizar</button>
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
                          onChange={(event) => onItemChange(item.id, { question: event.target.value })}
                          onBlur={() => onItemSave(item)}
                          className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-sm font-black text-zinc-900"
                        />
                        <div className="text-xs text-zinc-500">{item.category} · orden {item.sortOrder}</div>
                      </div>
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700">
                        <input type="checkbox" checked={item.active} onChange={(event) => onItemSave({ ...item, active: event.target.checked })} />
                        Activa
                      </label>
                    </div>
                    <textarea
                      rows={4}
                      value={item.answer}
                      onChange={(event) => onItemChange(item.id, { answer: event.target.value })}
                      onBlur={() => onItemSave(item)}
                      className="mt-3 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                    />
                    <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                      <input value={item.category} onChange={(event) => onItemChange(item.id, { category: event.target.value })} onBlur={() => onItemSave(item)} className="h-9 rounded-xl border border-zinc-200 px-3 text-sm" />
                      <input value={String(item.sortOrder)} type="number" onChange={(event) => onItemChange(item.id, { sortOrder: Number(event.target.value || 0) })} onBlur={() => onItemSave(item)} className="h-9 rounded-xl border border-zinc-200 px-3 text-sm" />
                      <button type="button" onClick={() => onItemSave(item)} className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50">
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
