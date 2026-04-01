import { useEffect, useMemo, useState } from 'react';
import { helpFaqAdminApi, type HelpFaqAdminItem } from './helpFaqApi';
import {
  buildHelpFaqCategoryOptions,
  buildHelpFaqCreateInput,
  buildHelpFaqUpdateInput,
  resolveHelpFaqError,
  sortHelpFaqItems,
  updateHelpFaqItems,
  type HelpFaqFormState,
} from './admin-help-faq.helpers';
import { AdminHelpFaqLayout } from './admin-help-faq.sections';

export function AdminHelpFaqPage() {
  const [items, setItems] = useState<HelpFaqAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [form, setForm] = useState<HelpFaqFormState>({
    question: '',
    answer: '',
    category: 'general',
    sortOrder: '0',
    active: true,
  });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await helpFaqAdminApi.list({
        q: q || undefined,
        active: activeFilter || undefined,
        category: categoryFilter || undefined,
      });
      setItems(sortHelpFaqItems(res.items));
    } catch (cause) {
      setError(resolveHelpFaqError(cause, 'Error cargando FAQ'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [q, activeFilter, categoryFilter]);

  const categoryOptions = useMemo(() => buildHelpFaqCategoryOptions(items), [items]);

  async function createItem(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError('');
    try {
      const res = await helpFaqAdminApi.create(buildHelpFaqCreateInput(form));
      setItems((prev) => sortHelpFaqItems([res.item, ...prev]));
      setForm({ question: '', answer: '', category: 'general', sortOrder: '0', active: true });
    } catch (cause) {
      setError(resolveHelpFaqError(cause, 'Error creando FAQ'));
    } finally {
      setCreating(false);
    }
  }

  async function saveItem(item: HelpFaqAdminItem) {
    setError('');
    try {
      const res = await helpFaqAdminApi.update(item.id, buildHelpFaqUpdateInput(item));
      setItems((prev) => sortHelpFaqItems(prev.map((entry) => (entry.id === item.id ? res.item : entry))));
    } catch (cause) {
      setError(resolveHelpFaqError(cause, 'Error actualizando FAQ'));
    }
  }

  return (
    <AdminHelpFaqLayout
      items={items}
      loading={loading}
      creating={creating}
      error={error}
      q={q}
      activeFilter={activeFilter}
      categoryFilter={categoryFilter}
      categoryOptions={categoryOptions}
      form={form}
      onSearchChange={setQ}
      onActiveFilterChange={setActiveFilter}
      onCategoryFilterChange={setCategoryFilter}
      onFormChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
      onCreate={(event) => void createItem(event)}
      onRefresh={() => void load()}
      onItemChange={(id, patch) => setItems((current) => updateHelpFaqItems(current, id, patch))}
      onItemSave={(item) => void saveItem(item)}
    />
  );
}
