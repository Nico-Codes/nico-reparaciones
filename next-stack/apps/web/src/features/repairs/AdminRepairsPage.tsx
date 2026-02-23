import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { repairsApi } from './api';
import type { RepairItem } from './types';

const STATUSES = ['RECEIVED', 'DIAGNOSING', 'WAITING_APPROVAL', 'REPAIRING', 'READY_PICKUP', 'DELIVERED', 'CANCELLED'] as const;

export function AdminRepairsPage() {
  const [items, setItems] = useState<RepairItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [resolvingPrice, setResolvingPrice] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<null | {
    matched: boolean;
    ruleName?: string;
    basePrice?: number;
    profitPercent?: number;
    suggestedTotal?: number;
  }>(null);
  const [rules, setRules] = useState<Array<{
    id: string;
    name: string;
    active: boolean;
    priority: number;
    deviceBrand: string | null;
    deviceModel: string | null;
    issueLabel: string | null;
    basePrice: number;
    profitPercent: number;
    notes: string | null;
  }>>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    priority: '0',
    deviceBrand: '',
    deviceModel: '',
    issueLabel: '',
    basePrice: '',
    profitPercent: '0',
  });
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    deviceBrand: '',
    deviceModel: '',
    issueLabel: '',
    quotedPrice: '',
    notes: '',
  });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await repairsApi.adminList({ q, status: statusFilter || undefined });
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando reparaciones');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [q, statusFilter]);

  async function loadRules() {
    setLoadingRules(true);
    try {
      const res = await repairsApi.pricingRulesList();
      setRules(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando reglas');
    } finally {
      setLoadingRules(false);
    }
  }

  useEffect(() => {
    void loadRules();
  }, []);

  async function createRepair(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const quotedPrice = form.quotedPrice ? Number(form.quotedPrice) : null;
      await repairsApi.adminCreate({
        customerName: form.customerName,
        customerPhone: form.customerPhone || null,
        deviceBrand: form.deviceBrand || null,
        deviceModel: form.deviceModel || null,
        issueLabel: form.issueLabel || null,
        notes: form.notes || null,
        quotedPrice,
      });
      setForm({ customerName: '', customerPhone: '', deviceBrand: '', deviceModel: '', issueLabel: '', quotedPrice: '', notes: '' });
      setPriceSuggestion(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando reparación');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id: string, status: string) {
    try {
      const res = await repairsApi.adminUpdateStatus(id, { status });
      setItems((prev) => prev.map((r) => (r.id === id ? res.item : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando estado');
    }
  }

  async function suggestPrice() {
    setResolvingPrice(true);
    setError('');
    try {
      const res = await repairsApi.pricingResolve({
        deviceBrand: form.deviceBrand || undefined,
        deviceModel: form.deviceModel || undefined,
        issueLabel: form.issueLabel || undefined,
      });
      if (res.matched && res.suggestion) {
        setForm((prev) => ({ ...prev, quotedPrice: String(res.suggestion?.suggestedTotal ?? '') }));
        setPriceSuggestion({
          matched: true,
          ruleName: res.rule?.name,
          basePrice: res.suggestion.basePrice,
          profitPercent: res.suggestion.profitPercent,
          suggestedTotal: res.suggestion.suggestedTotal,
        });
      } else {
        setPriceSuggestion({ matched: false });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error resolviendo precio');
    } finally {
      setResolvingPrice(false);
    }
  }

  async function createRule(e: React.FormEvent) {
    e.preventDefault();
    try {
      await repairsApi.pricingRulesCreate({
        name: ruleForm.name,
        priority: Number(ruleForm.priority || 0),
        deviceBrand: ruleForm.deviceBrand || null,
        deviceModel: ruleForm.deviceModel || null,
        issueLabel: ruleForm.issueLabel || null,
        basePrice: Number(ruleForm.basePrice || 0),
        profitPercent: Number(ruleForm.profitPercent || 0),
      });
      setRuleForm({ name: '', priority: '0', deviceBrand: '', deviceModel: '', issueLabel: '', basePrice: '', profitPercent: '0' });
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando regla');
    }
  }

  async function deleteRule(id: string) {
    try {
      await repairsApi.pricingRulesDelete(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error borrando regla');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-black tracking-tight">Admin Reparaciones (Next)</h1>
        <p className="mt-1 text-sm text-zinc-600">Alta rápida + listado + cambio de estado (MVP).</p>

        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

        <div className="mt-4 grid gap-4 xl:grid-cols-[420px_1fr]">
          <div className="space-y-4">
          <form onSubmit={createRepair} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm space-y-3">
            <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Nueva reparación</div>
            <Field label="Cliente *" value={form.customerName} onChange={(v) => setForm({ ...form, customerName: v })} required />
            <Field label="Teléfono" value={form.customerPhone} onChange={(v) => setForm({ ...form, customerPhone: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Marca" value={form.deviceBrand} onChange={(v) => setForm({ ...form, deviceBrand: v })} />
              <Field label="Modelo" value={form.deviceModel} onChange={(v) => setForm({ ...form, deviceModel: v })} />
            </div>
            <Field label="Falla" value={form.issueLabel} onChange={(v) => setForm({ ...form, issueLabel: v })} />
            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <Field label="Presupuesto" type="number" value={form.quotedPrice} onChange={(v) => setForm({ ...form, quotedPrice: v })} />
              <Button type="button" variant="outline" className="h-10" onClick={() => void suggestPrice()} disabled={resolvingPrice}>
                {resolvingPrice ? 'Calculando...' : 'Sugerir'}
              </Button>
            </div>
            {priceSuggestion ? (
              <div className={`rounded-xl border px-3 py-2 text-sm ${priceSuggestion.matched ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                {priceSuggestion.matched
                  ? `Regla: ${priceSuggestion.ruleName || 'sin nombre'} · Base $${(priceSuggestion.basePrice ?? 0).toLocaleString('es-AR')} + ${(priceSuggestion.profitPercent ?? 0).toLocaleString('es-AR')}% = $${(priceSuggestion.suggestedTotal ?? 0).toLocaleString('es-AR')}`
                  : 'No se encontró regla coincidente. Podés cargar el presupuesto manualmente o crear una regla.'}
              </div>
            ) : null}
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Notas</span>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
            </label>
            <Button className="w-full" disabled={saving}>{saving ? 'Guardando...' : 'Crear reparación'}</Button>
          </form>

          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold uppercase tracking-wide text-zinc-500">Reglas de cálculo (MVP)</div>
            <form className="mt-3 grid gap-2" onSubmit={createRule}>
              <Field label="Nombre regla" value={ruleForm.name} onChange={(v) => setRuleForm({ ...ruleForm, name: v })} required />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Marca" value={ruleForm.deviceBrand} onChange={(v) => setRuleForm({ ...ruleForm, deviceBrand: v })} />
                <Field label="Modelo" value={ruleForm.deviceModel} onChange={(v) => setRuleForm({ ...ruleForm, deviceModel: v })} />
              </div>
              <Field label="Falla" value={ruleForm.issueLabel} onChange={(v) => setRuleForm({ ...ruleForm, issueLabel: v })} />
              <div className="grid grid-cols-3 gap-2">
                <Field label="Base" type="number" value={ruleForm.basePrice} onChange={(v) => setRuleForm({ ...ruleForm, basePrice: v })} required />
                <Field label="% gan." type="number" value={ruleForm.profitPercent} onChange={(v) => setRuleForm({ ...ruleForm, profitPercent: v })} />
                <Field label="Prioridad" type="number" value={ruleForm.priority} onChange={(v) => setRuleForm({ ...ruleForm, priority: v })} />
              </div>
              <Button className="w-full">Crear regla</Button>
            </form>
            <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
              {loadingRules ? (
                <div className="rounded-xl border border-zinc-200 p-2 text-sm">Cargando reglas...</div>
              ) : rules.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 p-2 text-sm">Sin reglas todavía.</div>
              ) : rules.map((rule) => (
                <div key={rule.id} className="rounded-xl border border-zinc-200 p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-black text-zinc-900">{rule.name}</div>
                      <div className="text-xs text-zinc-500">
                        {[rule.deviceBrand, rule.deviceModel, rule.issueLabel].filter(Boolean).join(' · ') || 'Regla global'}
                      </div>
                      <div className="mt-1 text-xs text-zinc-600">Base ${rule.basePrice.toLocaleString('es-AR')} + {rule.profitPercent}% · Prio {rule.priority}</div>
                    </div>
                    <button type="button" className="text-xs font-bold text-rose-700 hover:text-rose-800" onClick={() => void deleteRule(rule.id)}>
                      Borrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          </div>

          <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap gap-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente / modelo / falla..." className="h-10 flex-1 min-w-[220px] rounded-xl border border-zinc-200 px-3 text-sm" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 min-w-[200px] rounded-xl border border-zinc-200 px-3 text-sm">
                <option value="">Todos los estados</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {loading ? (
              <div className="rounded-xl border border-zinc-200 p-3 text-sm">Cargando...</div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 p-3 text-sm">No hay reparaciones.</div>
            ) : (
              <div className="space-y-3">
                {items.map((r) => (
                  <div key={r.id} className="rounded-xl border border-zinc-200 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-zinc-900">{r.customerName}</div>
                        <div className="text-xs text-zinc-500">{[r.deviceBrand, r.deviceModel].filter(Boolean).join(' ')} · {r.issueLabel || 'Sin falla'}</div>
                        <div className="mt-1 text-xs text-zinc-500">{r.id}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-zinc-900">{r.finalPrice != null ? `$${r.finalPrice.toLocaleString('es-AR')}` : r.quotedPrice != null ? `$${r.quotedPrice.toLocaleString('es-AR')}` : '—'}</div>
                        <div className="text-xs text-zinc-500">{new Date(r.createdAt).toLocaleDateString('es-AR')}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <select value={r.status} onChange={(e) => void changeStatus(r.id, e.target.value)} className="h-9 min-w-[220px] rounded-xl border border-zinc-200 px-3 text-sm">
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700">{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-zinc-700">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
    </label>
  );
}
