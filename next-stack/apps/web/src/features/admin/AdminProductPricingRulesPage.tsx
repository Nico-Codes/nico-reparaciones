import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type ProductRule = {
  id: number;
  name: string;
  category: string;
  product: string;
  marginPercent: string;
  minCost: string;
  maxCost: string;
  priority: string;
  active: boolean;
};

export function AdminProductPricingRulesPage() {
  const [defaultMargin, setDefaultMargin] = useState('35');
  const [blockNegative, setBlockNegative] = useState(true);
  const [simCategory, setSimCategory] = useState('');
  const [simProduct, setSimProduct] = useState('Todos');
  const [simCost, setSimCost] = useState('5000');

  const [form, setForm] = useState({
    name: '',
    category: 'Todas',
    product: 'Todos',
    marginPercent: '50',
    minCost: '',
    maxCost: '5000',
    priority: '0',
    active: true,
  });

  const [rules, setRules] = useState<ProductRule[]>([
    {
      id: 1,
      name: 'Margen general +35%',
      category: 'Todas',
      product: 'Todos',
      marginPercent: '35',
      minCost: '',
      maxCost: '',
      priority: '0',
      active: true,
    },
  ]);

  const simulated = useMemo(() => {
    const cost = Number(simCost || 0);
    if (!simCategory || !cost) return null;
    const margin = Number(defaultMargin || 0);
    const sale = Math.round(cost * (1 + margin / 100));
    return { margin, sale };
  }, [simCategory, simCost, defaultMargin]);

  function createRule() {
    if (!form.name.trim()) return;
    setRules((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: form.name.trim(),
        category: form.category,
        product: form.product,
        marginPercent: form.marginPercent || '0',
        minCost: form.minCost,
        maxCost: form.maxCost,
        priority: form.priority || '0',
        active: form.active,
      },
    ]);
    setForm({
      name: '',
      category: 'Todas',
      product: 'Todos',
      marginPercent: '50',
      minCost: '',
      maxCost: '5000',
      priority: '0',
      active: true,
    });
  }

  function updateRule(id: number, patch: Partial<ProductRule>) {
    setRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  }

  function removeRule(id: number) {
    setRules((prev) => prev.filter((rule) => rule.id !== id));
  }

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
            <Link to="/admin/calculos" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
              Reglas de calculo
            </Link>
            <Link to="/admin/productos" className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
              Productos
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <div className="card-head">
            <div className="text-xl font-black tracking-tight text-zinc-900">Preferencias de calculo</div>
          </div>
          <div className="card-body space-y-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-900">Margen por defecto (%)</label>
              <input
                value={defaultMargin}
                onChange={(e) => setDefaultMargin(e.target.value)}
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
              />
              <p className="mt-2 text-sm text-zinc-500">
                Se usa cuando no hay una regla puntual para el producto o categoria.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-900">
              <input
                type="checkbox"
                checked={blockNegative}
                onChange={(e) => setBlockNegative(e.target.checked)}
                className="h-4 w-4"
              />
              Bloquear ventas con margen negativo (precio menor al costo)
            </label>
            <div className="pt-1 text-right">
              <button type="button" className="btn-primary !h-10 !rounded-xl px-4 text-sm font-bold">
                Guardar preferencias
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
              <select value={simCategory} onChange={(e) => setSimCategory(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
                <option value="">Seleccionar categoria...</option>
                <option value="Cables">Cables</option>
                <option value="Cargadores">Cargadores</option>
                <option value="Parlantes">Parlantes</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-900">Producto (opcional)</label>
              <select value={simProduct} onChange={(e) => setSimProduct(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
                <option>Todos</option>
                <option>Cable tipo c</option>
                <option>Parlante Bluetooth portatil</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-900">Costo</label>
              <input value={simCost} onChange={(e) => setSimCost(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </div>
            <button type="button" className="btn-outline !h-11 !w-full !rounded-xl justify-center text-sm font-bold">
              Simular precio recomendado
            </button>
            <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700">
              {!simulated
                ? 'Completa categoria y costo para ver el resultado.'
                : `Margen: +${simulated.margin}% · Precio recomendado: $ ${simulated.sale.toLocaleString('es-AR')}`}
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
            <input
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="Ej: Cables economicos (< 5000) +50%"
              className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <SelectField label="Categoria (opcional)" value={form.category} onChange={(v) => setForm((s) => ({ ...s, category: v }))} options={['Todas', 'Cables', 'Cargadores', 'Parlantes']} />
            <SelectField label="Producto (opcional)" value={form.product} onChange={(v) => setForm((s) => ({ ...s, product: v }))} options={['Todos', 'Cable tipo c', 'Parlante Bluetooth portatil']} />
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
            <button type="button" onClick={createRule} className="btn-primary !h-11 !rounded-xl px-5 text-sm font-bold">
              Crear regla
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head flex items-center justify-between gap-3">
          <div className="text-xl font-black tracking-tight text-zinc-900">Reglas cargadas</div>
          <span className="inline-flex h-7 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold text-zinc-700">
            {rules.length} reglas
          </span>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                <div className="grid gap-3 md:grid-cols-[1.6fr_0.9fr_0.9fr_0.7fr_0.8fr_0.8fr_0.8fr]">
                  <EditableInput label="Nombre" value={rule.name} onChange={(v) => updateRule(rule.id, { name: v })} />
                  <EditableSelect label="Categoria" value={rule.category} onChange={(v) => updateRule(rule.id, { category: v })} options={['Todas', 'Cables', 'Cargadores', 'Parlantes']} />
                  <EditableSelect label="Producto" value={rule.product} onChange={(v) => updateRule(rule.id, { product: v })} options={['Todos', 'Cable tipo c', 'Parlante Bluetooth portatil']} />
                  <EditableInput label="%" value={rule.marginPercent} onChange={(v) => updateRule(rule.id, { marginPercent: v })} />
                  <EditableInput label="Min" value={rule.minCost} onChange={(v) => updateRule(rule.id, { minCost: v })} />
                  <EditableInput label="Max" value={rule.maxCost} onChange={(v) => updateRule(rule.id, { maxCost: v })} />
                  <EditableInput label="Prioridad" value={rule.priority} onChange={(v) => updateRule(rule.id, { priority: v })} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                    <input type="checkbox" checked={rule.active} onChange={(e) => updateRule(rule.id, { active: e.target.checked })} className="h-4 w-4" />
                    Activa
                  </label>
                  <div className="flex items-center gap-2">
                    <button type="button" className="btn-outline !h-8 !rounded-xl px-3 text-sm font-bold">Guardar</button>
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
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-zinc-900">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
        {options.map((option) => <option key={option}>{option}</option>)}
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

function EditableInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
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
  options: string[];
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-black text-zinc-700">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

