import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogAdminApi, type AdminCategory, type AdminProduct } from '@/features/catalogAdmin/api';
import { productPricingApi, type ProductPricingRuleItem } from '@/features/catalogAdmin/productPricingApi';

type ProductRuleRow = {
  id: string;
  name: string;
  categoryId: string | null;
  productId: string | null;
  marginPercent: string;
  costMin: string;
  costMax: string;
  priority: string;
  active: boolean;
};

function fromApiRule(item: ProductPricingRuleItem): ProductRuleRow {
  return {
    id: item.id,
    name: item.name,
    categoryId: item.categoryId,
    productId: item.productId,
    marginPercent: String(item.marginPercent ?? 0),
    costMin: item.costMin == null ? '' : String(item.costMin),
    costMax: item.costMax == null ? '' : String(item.costMax),
    priority: String(item.priority ?? 0),
    active: item.active,
  };
}

export function AdminProductPricingRulesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [rules, setRules] = useState<ProductRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [creatingRule, setCreatingRule] = useState(false);
  const [savingRuleId, setSavingRuleId] = useState<string | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [defaultMargin, setDefaultMargin] = useState('35');
  const [blockNegative, setBlockNegative] = useState(true);
  const [simCategoryId, setSimCategoryId] = useState('');
  const [simProductId, setSimProductId] = useState('');
  const [simCost, setSimCost] = useState('5000');
  const [simResult, setSimResult] = useState<{
    recommendedPrice: number;
    marginPercent: number;
    ruleName: string | null;
  } | null>(null);

  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    productId: '',
    marginPercent: '50',
    costMin: '',
    costMax: '5000',
    priority: '0',
    active: true,
  });

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [cats, prods, settings, rulesRes] = await Promise.all([
        catalogAdminApi.categories(),
        catalogAdminApi.products(),
        productPricingApi.settings(),
        productPricingApi.rules(),
      ]);
      setCategories(cats.items);
      setProducts(prods.items);
      setDefaultMargin(String(settings.defaultMarginPercent));
      setBlockNegative(settings.preventNegativeMargin);
      setRules(rulesRes.items.map(fromApiRule));
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

  useEffect(() => {
    const costNumber = Number(simCost || 0);
    if (!simCategoryId || !Number.isFinite(costNumber) || costNumber < 0) {
      setSimResult(null);
      return;
    }
    const timeout = setTimeout(() => {
      void (async () => {
        setSimLoading(true);
        try {
          const res = await productPricingApi.resolveRecommendedPrice({
            categoryId: simCategoryId,
            productId: simProductId || null,
            costPrice: costNumber,
          });
          setSimResult({
            recommendedPrice: res.recommendedPrice,
            marginPercent: res.marginPercent,
            ruleName: res.rule?.name ?? null,
          });
        } catch {
          setSimResult(null);
        } finally {
          setSimLoading(false);
        }
      })();
    }, 280);
    return () => clearTimeout(timeout);
  }, [simCategoryId, simProductId, simCost]);

  async function savePreferences() {
    setSavingPrefs(true);
    setError('');
    setSuccess('');
    try {
      const settings = await productPricingApi.updateSettings({
        defaultMarginPercent: Number(defaultMargin || 0),
        preventNegativeMargin: blockNegative,
      });
      setDefaultMargin(String(settings.defaultMarginPercent));
      setBlockNegative(settings.preventNegativeMargin);
      setSuccess('Preferencias guardadas.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar las preferencias');
    } finally {
      setSavingPrefs(false);
    }
  }

  async function createRule() {
    if (!form.name.trim()) return;
    setCreatingRule(true);
    setError('');
    setSuccess('');
    try {
      const res = await productPricingApi.createRule({
        name: form.name.trim(),
        categoryId: form.categoryId || null,
        productId: form.productId || null,
        marginPercent: Number(form.marginPercent || 0),
        costMin: form.costMin ? Number(form.costMin) : null,
        costMax: form.costMax ? Number(form.costMax) : null,
        priority: Number(form.priority || 0),
        active: form.active,
      });
      setRules((prev) => [fromApiRule(res.item), ...prev]);
      setForm({
        name: '',
        categoryId: '',
        productId: '',
        marginPercent: '50',
        costMin: '',
        costMax: '5000',
        priority: '0',
        active: true,
      });
      setSuccess('Regla creada.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la regla');
    } finally {
      setCreatingRule(false);
    }
  }

  function patchRule(id: string, patch: Partial<ProductRuleRow>) {
    setRules((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function saveRule(row: ProductRuleRow) {
    setSavingRuleId(row.id);
    setError('');
    setSuccess('');
    try {
      const res = await productPricingApi.updateRule(row.id, {
        name: row.name.trim(),
        categoryId: row.categoryId || null,
        productId: row.productId || null,
        marginPercent: Number(row.marginPercent || 0),
        costMin: row.costMin ? Number(row.costMin) : null,
        costMax: row.costMax ? Number(row.costMax) : null,
        priority: Number(row.priority || 0),
        active: row.active,
      });
      setRules((prev) => prev.map((x) => (x.id === row.id ? fromApiRule(res.item) : x)));
      setSuccess('Regla guardada.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la regla');
    } finally {
      setSavingRuleId(null);
    }
  }

  async function removeRule(id: string) {
    setDeletingRuleId(id);
    setError('');
    setSuccess('');
    try {
      await productPricingApi.deleteRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      setSuccess('Regla eliminada.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la regla');
    } finally {
      setDeletingRuleId(null);
    }
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
              {!simCategoryId
                ? 'Selecciona categoria para simular.'
                : simLoading
                  ? 'Simulando...'
                  : simResult
                    ? `${simResult.ruleName ? `Regla: ${simResult.ruleName} - ` : ''}Margen: +${simResult.marginPercent}% - Precio recomendado: $ ${simResult.recommendedPrice.toLocaleString('es-AR')}`
                    : 'No se pudo calcular en este momento.'}
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
            <InputField label="Costo minimo" value={form.costMin} onChange={(v) => setForm((s) => ({ ...s, costMin: v }))} placeholder="Ej: 0" />
            <InputField label="Costo maximo" value={form.costMax} onChange={(v) => setForm((s) => ({ ...s, costMax: v }))} placeholder="Ej: 5000" />
            <InputField label="Prioridad" value={form.priority} onChange={(v) => setForm((s) => ({ ...s, priority: v }))} />
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-zinc-900">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} className="h-4 w-4" />
            Regla activa
          </label>
          <div className="flex justify-end">
            <button type="button" onClick={() => void createRule()} disabled={loading || creatingRule || !form.name.trim()} className="btn-primary !h-11 !rounded-xl px-5 text-sm font-bold disabled:opacity-60">
              {creatingRule ? 'Creando...' : 'Crear regla'}
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
                  <EditableInput label="Nombre" value={rule.name} onChange={(v) => patchRule(rule.id, { name: v })} />
                  <EditableSelect
                    label="Categoria"
                    value={rule.categoryId ?? ''}
                    onChange={(v) => patchRule(rule.id, { categoryId: v || null, productId: null })}
                    options={[{ value: '', label: 'Todas' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                  />
                  <EditableSelect
                    label="Producto"
                    value={rule.productId ?? ''}
                    onChange={(v) => patchRule(rule.id, { productId: v || null })}
                    options={[
                      { value: '', label: 'Todos' },
                      ...products.filter((p) => !rule.categoryId || p.categoryId === rule.categoryId).map((p) => ({ value: p.id, label: p.name })),
                    ]}
                  />
                  <EditableInput label="%" value={rule.marginPercent} onChange={(v) => patchRule(rule.id, { marginPercent: v })} />
                  <EditableInput label="Min" value={rule.costMin} onChange={(v) => patchRule(rule.id, { costMin: v })} />
                  <EditableInput label="Max" value={rule.costMax} onChange={(v) => patchRule(rule.id, { costMax: v })} />
                  <EditableInput label="Prioridad" value={rule.priority} onChange={(v) => patchRule(rule.id, { priority: v })} />
                </div>
                <div className="mt-2 text-xs text-zinc-500">
                  Aplica a: {categoryName(rule.categoryId)} / {productName(rule.productId)}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                    <input type="checkbox" checked={rule.active} onChange={(e) => patchRule(rule.id, { active: e.target.checked })} className="h-4 w-4" />
                    Activa
                  </label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => void saveRule(rule)} disabled={savingRuleId === rule.id || deletingRuleId === rule.id} className="btn-outline !h-8 !rounded-xl px-3 text-sm font-bold disabled:opacity-60">
                      {savingRuleId === rule.id ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button type="button" className="inline-flex h-8 items-center rounded-xl border border-rose-200 bg-white px-3 text-sm font-bold text-rose-600 disabled:opacity-60" onClick={() => void removeRule(rule.id)} disabled={savingRuleId === rule.id || deletingRuleId === rule.id}>
                      {deletingRuleId === rule.id ? 'Eliminando...' : 'Eliminar'}
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
