import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogAdminApi, type AdminCategory, type AdminProduct } from '@/features/catalogAdmin/api';
import { adminSettingsApi, type AdminSettingItem } from './settingsApi';

type ProductRule = {
  id: string;
  name: string;
  categoryId: string | null;
  productId: string | null;
  marginPercent: string;
  minCost: string;
  maxCost: string;
  priority: string;
  active: boolean;
};

function newRuleId() {
  return `pr_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

function parseRules(raw: string): ProductRule[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x === 'object')
      .map((x: any) => ({
        id: String(x.id ?? newRuleId()),
        name: String(x.name ?? '').trim(),
        categoryId: x.categoryId ? String(x.categoryId) : null,
        productId: x.productId ? String(x.productId) : null,
        marginPercent: String(x.marginPercent ?? '0'),
        minCost: String(x.minCost ?? ''),
        maxCost: String(x.maxCost ?? ''),
        priority: String(x.priority ?? '0'),
        active: Boolean(x.active),
      }))
      .filter((r) => r.name);
  } catch {
    return [];
  }
}

function getSetting(map: Map<string, AdminSettingItem>, key: string, fallback = '') {
  return map.get(key)?.value ?? fallback;
}

export function AdminProductPricingRulesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [defaultMargin, setDefaultMargin] = useState('35');
  const [blockNegative, setBlockNegative] = useState(true);
  const [simCategoryId, setSimCategoryId] = useState('');
  const [simProductId, setSimProductId] = useState('');
  const [simCost, setSimCost] = useState('5000');

  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    productId: '',
    marginPercent: '50',
    minCost: '',
    maxCost: '5000',
    priority: '0',
    active: true,
  });

  const [rules, setRules] = useState<ProductRule[]>([]);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [cats, prods, settings] = await Promise.all([
        catalogAdminApi.categories(),
        catalogAdminApi.products(),
        adminSettingsApi.list(),
      ]);
      setCategories(cats.items);
      setProducts(prods.items);

      const map = new Map<string, AdminSettingItem>(settings.items.map((i) => [i.key, i]));
      setDefaultMargin(getSetting(map, 'product_pricing.default_margin', '35'));
      setBlockNegative(getSetting(map, 'product_pricing.block_negative_margin', '1') !== '0');
      setRules(parseRules(getSetting(map, 'product_pricing.rules', '[]')));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando reglas de productos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const productOptions = useMemo(
    () => (form.categoryId ? products.filter((p) => p.categoryId === form.categoryId) : products),
    [products, form.categoryId],
  );
  const simProductOptions = useMemo(
    () => (simCategoryId ? products.filter((p) => p.categoryId === simCategoryId) : products),
    [products, simCategoryId],
  );

  const simulated = useMemo(() => {
    const cost = Number(simCost || 0);
    if (!cost) return null;

    const sorted = [...rules]
      .filter((r) => r.active)
      .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
    const matched = sorted.find((r) => {
      if (r.productId && simProductId && r.productId !== simProductId) return false;
      if (r.productId && !simProductId) return false;
      if (r.categoryId && simCategoryId && r.categoryId !== simCategoryId) return false;
      if (r.categoryId && !simCategoryId) return false;
      const min = r.minCost ? Number(r.minCost) : null;
      const max = r.maxCost ? Number(r.maxCost) : null;
      if (min != null && !Number.isNaN(min) && cost < min) return false;
      if (max != null && !Number.isNaN(max) && max > 0 && cost > max) return false;
      return true;
    });

    const margin = Number(matched?.marginPercent ?? defaultMargin ?? 0);
    const sale = Math.round(cost * (1 + margin / 100));
    const negativeBlocked = blockNegative && sale < cost;
    return { margin, sale, matchedName: matched?.name ?? null, negativeBlocked };
  }, [rules, simCost, simCategoryId, simProductId, defaultMargin, blockNegative]);

  async function savePreferences() {
    setSavingPrefs(true);
    setError('');
    setSuccess('');
    try {
      await adminSettingsApi.save([
        { key: 'product_pricing.default_margin', value: defaultMargin, group: 'product_pricing', label: 'Default product margin', type: 'number' },
        { key: 'product_pricing.block_negative_margin', value: blockNegative ? '1' : '0', group: 'product_pricing', label: 'Block negative margin', type: 'boolean' },
      ]);
      setSuccess('Preferencias guardadas.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar las preferencias');
    } finally {
      setSavingPrefs(false);
    }
  }

  async function saveRules(nextRules = rules) {
    setSavingRules(true);
    setError('');
    setSuccess('');
    try {
      await adminSettingsApi.save([
        {
          key: 'product_pricing.rules',
          value: JSON.stringify(nextRules),
          group: 'product_pricing',
          label: 'Product pricing rules',
          type: 'json',
        },
      ]);
      setSuccess('Reglas guardadas.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar las reglas');
    } finally {
      setSavingRules(false);
    }
  }

  function createRule() {
    if (!form.name.trim()) return;
    const nextRules: ProductRule[] = [
      ...rules,
      {
        id: newRuleId(),
        name: form.name.trim(),
        categoryId: form.categoryId || null,
        productId: form.productId || null,
        marginPercent: form.marginPercent || '0',
        minCost: form.minCost,
        maxCost: form.maxCost,
        priority: form.priority || '0',
        active: form.active,
      },
    ];
    setRules(nextRules);
    setForm({
      name: '',
      categoryId: '',
      productId: '',
      marginPercent: '50',
      minCost: '',
      maxCost: '5000',
      priority: '0',
      active: true,
    });
    void saveRules(nextRules);
  }

  function updateRule(id: string, patch: Partial<ProductRule>) {
    setRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  }

  function removeRule(id: string) {
    const next = rules.filter((rule) => rule.id !== id);
    setRules(next);
    void saveRules(next);
  }

  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? 'Todas';
  const productName = (id: string | null) => products.find((p) => p.id === id)?.name ?? 'Todos';

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Reglas de productos (costo -&gt; venta)</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Define margen por categoria o producto. El sistema aplica la mejor coincidencia.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/calculos" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">Reglas de calculo</Link>
            <Link to="/admin/productos" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">Productos</Link>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</div> : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <div className="card-head">
            <div className="text-xl font-black tracking-tight text-zinc-900">Preferencias de calculo</div>
          </div>
          <div className="card-body space-y-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-900">Margen por defecto (%)</label>
              <input value={defaultMargin} onChange={(e) => setDefaultMargin(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
              <p className="mt-2 text-sm text-zinc-500">Se usa cuando no hay una regla puntual para el producto o categoria.</p>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-900">
              <input type="checkbox" checked={blockNegative} onChange={(e) => setBlockNegative(e.target.checked)} className="h-4 w-4" />
              Bloquear ventas con margen negativo (precio menor al costo)
            </label>
            <div className="pt-1 text-right">
              <button type="button" onClick={() => void savePreferences()} disabled={loading || savingPrefs} className="btn-primary !h-10 !rounded-xl px-4 text-sm font-bold disabled:opacity-60">
                {savingPrefs ? 'Guardando...' : 'Guardar preferencias'}
              </button>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div className="text-xl font-black tracking-tight text-zinc-900">Simulador rapido</div>
          </div>
          <div className="card-body space-y-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-900">Categoria</label>
              <select value={simCategoryId} onChange={(e) => { setSimCategoryId(e.target.value); setSimProductId(''); }} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
                <option value="">Seleccionar categoria...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-900">Producto (opcional)</label>
              <select value={simProductId} onChange={(e) => setSimProductId(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
                <option value="">Todos</option>
                {simProductOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-900">Costo</label>
              <input value={simCost} onChange={(e) => setSimCost(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700">
              {!simulated
                ? 'Completa costo para ver el resultado.'
                : `${simulated.matchedName ? `Regla: ${simulated.matchedName} · ` : ''}Margen: +${simulated.margin}% · Precio recomendado: $ ${simulated.sale.toLocaleString('es-AR')}${simulated.negativeBlocked ? ' (bloqueado por margen negativo)' : ''}`}
            </div>
          </div>
        </section>
      </section>

      <section className="card">
        <div className="card-head">
          <div className="text-xl font-black tracking-tight text-zinc-900">Nueva regla</div>
        </div>
        <div className="card-body space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-zinc-900">Nombre *</label>
            <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Ej: Cables economicos (< 5000) +50%" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <SelectField
              label="Categoria (opcional)"
              value={form.categoryId}
              onChange={(v) => setForm((s) => ({ ...s, categoryId: v, productId: '' }))}
              options={[{ value: '', label: 'Todas' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            />
            <SelectField
              label="Producto (opcional)"
              value={form.productId}
              onChange={(v) => setForm((s) => ({ ...s, productId: v }))}
              options={[{ value: '', label: 'Todos' }, ...productOptions.map((p) => ({ value: p.id, label: p.name }))]}
            />
            <InputField label="Margen % *" value={form.marginPercent} onChange={(v) => setForm((s) => ({ ...s, marginPercent: v }))} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <InputField label="Costo minimo" value={form.minCost} onChange={(v) => setForm((s) => ({ ...s, minCost: v }))} placeholder="Ej: 0" />
            <InputField label="Costo maximo" value={form.maxCost} onChange={(v) => setForm((s) => ({ ...s, maxCost: v }))} placeholder="Ej: 5000" />
            <InputField label="Prioridad" value={form.priority} onChange={(v) => setForm((s) => ({ ...s, priority: v }))} />
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-zinc-900">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} className="h-4 w-4" />
            Regla activa
          </label>
          <div className="flex justify-end">
            <button type="button" onClick={createRule} disabled={loading || savingRules || !form.name.trim()} className="btn-primary !h-11 !rounded-xl px-5 text-sm font-bold disabled:opacity-60">
              Crear regla
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head flex items-center justify-between gap-3">
          <div className="text-xl font-black tracking-tight text-zinc-900">Reglas cargadas</div>
          <span className="inline-flex h-7 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold text-zinc-700">{rules.length} reglas</span>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {loading ? <div className="text-sm text-zinc-600">Cargando reglas...</div> : null}
            {!loading && rules.length === 0 ? <div className="text-sm text-zinc-600">Sin reglas cargadas.</div> : null}
            {rules.map((rule) => (
              <div key={rule.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                <div className="grid gap-3 md:grid-cols-[1.6fr_0.9fr_0.9fr_0.7fr_0.8fr_0.8fr_0.8fr]">
                  <EditableInput label="Nombre" value={rule.name} onChange={(v) => updateRule(rule.id, { name: v })} />
                  <EditableSelect
                    label="Categoria"
                    value={rule.categoryId ?? ''}
                    onChange={(v) => updateRule(rule.id, { categoryId: v || null, productId: null })}
                    options={[{ value: '', label: 'Todas' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                  />
                  <EditableSelect
                    label="Producto"
                    value={rule.productId ?? ''}
                    onChange={(v) => updateRule(rule.id, { productId: v || null })}
                    options={[
                      { value: '', label: 'Todos' },
                      ...products.filter((p) => !rule.categoryId || p.categoryId === rule.categoryId).map((p) => ({ value: p.id, label: p.name })),
                    ]}
                  />
                  <EditableInput label="%" value={rule.marginPercent} onChange={(v) => updateRule(rule.id, { marginPercent: v })} />
                  <EditableInput label="Min" value={rule.minCost} onChange={(v) => updateRule(rule.id, { minCost: v })} />
                  <EditableInput label="Max" value={rule.maxCost} onChange={(v) => updateRule(rule.id, { maxCost: v })} />
                  <EditableInput label="Prioridad" value={rule.priority} onChange={(v) => updateRule(rule.id, { priority: v })} />
                </div>
                <div className="mt-2 text-xs text-zinc-500">
                  Aplica a: {categoryName(rule.categoryId)} / {productName(rule.productId)}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                    <input type="checkbox" checked={rule.active} onChange={(e) => updateRule(rule.id, { active: e.target.checked })} className="h-4 w-4" />
                    Activa
                  </label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => void saveRules()} disabled={savingRules} className="btn-outline !h-8 !rounded-xl px-3 text-sm font-bold disabled:opacity-60">Guardar</button>
                    <button type="button" className="inline-flex h-8 items-center rounded-xl border border-rose-200 bg-white px-3 text-sm font-bold text-rose-600" onClick={() => removeRule(rule.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-zinc-900">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
        {options.map((option) => <option key={option.value || '__all'} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-zinc-900">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
    </div>
  );
}

function EditableInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="mb-2 text-sm font-black text-zinc-700">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
    </div>
  );
}

function EditableSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-black text-zinc-700">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
        {options.map((option) => <option key={option.value || '__all'} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}
