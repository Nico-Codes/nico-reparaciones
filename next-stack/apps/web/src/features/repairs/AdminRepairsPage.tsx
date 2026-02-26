import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/features/admin/api';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { repairsApi } from './api';
import type { RepairItem, RepairTimelineEvent } from './types';

const STATUSES = ['RECEIVED', 'DIAGNOSING', 'WAITING_APPROVAL', 'REPAIRING', 'READY_PICKUP', 'DELIVERED', 'CANCELLED'] as const;
const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  RECEIVED: 'Recibida',
  DIAGNOSING: 'DiagnÃ³stico',
  WAITING_APPROVAL: 'Espera aprobaciÃ³n',
  REPAIRING: 'Reparando',
  READY_PICKUP: 'Lista',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
};
const STATUS_BADGE_CLASS: Record<(typeof STATUSES)[number], string> = {
  RECEIVED: 'badge-sky',
  DIAGNOSING: 'badge-indigo',
  WAITING_APPROVAL: 'badge-amber',
  REPAIRING: 'badge-indigo',
  READY_PICKUP: 'badge-emerald',
  DELIVERED: 'badge-zinc',
  CANCELLED: 'badge-rose',
};

function repairStatusLabel(status: string) {
  return STATUS_LABELS[status as (typeof STATUSES)[number]] ?? status;
}

function repairStatusBadgeClass(status: string) {
  return STATUS_BADGE_CLASS[status as (typeof STATUSES)[number]] ?? 'badge-zinc';
}

function repairCodeLabel(id: string) {
  return `R-${id.slice(0, 10)}`;
}

function timeAgoLabel(dateIso: string) {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return 'hace segundos';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} dÃ­a${days === 1 ? '' : 's'}`;
  const weeks = Math.floor(days / 7);
  return `hace ${weeks} semana${weeks === 1 ? '' : 's'}`;
}

export function AdminRepairsPage() {
  const hydratingEditRef = useRef(false);
  const [deviceTypes, setDeviceTypes] = useState<Array<{ id: string; name: string; slug: string; active: boolean }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean }>>([]);
  const [models, setModels] = useState<Array<{ id: string; brandId: string; deviceModelGroupId?: string | null; name: string; slug: string; active: boolean; brand: { id: string; name: string; slug: string } }>>([]);
  const [issues, setIssues] = useState<Array<{ id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean }>>([]);
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedIssueId, setSelectedIssueId] = useState('');
  const [items, setItems] = useState<RepairItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [stats, setStats] = useState<{ total: number; readyPickup: number; deliveredToday: number; byStatus: Record<string, number> } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);
  const [selectedRepair, setSelectedRepair] = useState<RepairItem | null>(null);
  const [selectedRepairTimeline, setSelectedRepairTimeline] = useState<RepairTimelineEvent[]>([]);
  const [loadingSelectedRepair, setLoadingSelectedRepair] = useState(false);
  const [savingSelectedRepair, setSavingSelectedRepair] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resolvingPrice, setResolvingPrice] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<null | {
    matched: boolean;
    ruleName?: string;
    basePrice?: number;
    profitPercent?: number;
    calcMode?: 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL';
    minFinalPrice?: number | null;
    shippingFee?: number | null;
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
  const [editBrandId, setEditBrandId] = useState('');
  const [editModelId, setEditModelId] = useState('');
  const [editIssueId, setEditIssueId] = useState('');
  const [editDeviceTypeId, setEditDeviceTypeId] = useState('');
  const [editModels, setEditModels] = useState<Array<{ id: string; brandId: string; name: string; slug: string; active: boolean; brand: { id: string; name: string; slug: string } }>>([]);
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
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerPhone: '',
    deviceBrand: '',
    deviceModel: '',
    issueLabel: '',
    status: 'RECEIVED',
    quotedPrice: '',
    finalPrice: '',
    notes: '',
  });

  const statusTabs = [
    { value: '', label: 'Todos', count: stats?.total ?? 0 },
    ...STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s], count: stats?.byStatus?.[s] ?? 0 })),
  ];

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await repairsApi.adminList({
        q: debouncedQ,
        status: statusFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setItems(res.items);
      if (selectedRepairId && !res.items.some((r) => r.id === selectedRepairId)) {
        setSelectedRepairId(null);
        setSelectedRepair(null);
        setSelectedRepairTimeline([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando reparaciones');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    void load();
  }, [debouncedQ, statusFilter, fromDate, toDate]);

  async function loadStats() {
    setLoadingStats(true);
    try {
      const res = await repairsApi.adminStats();
      setStats(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando estadÃ­sticas');
    } finally {
      setLoadingStats(false);
    }
  }

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

  useEffect(() => {
    void loadStats();
  }, []);

  async function loadCatalog() {
    try {
      const [typesRes, brandsRes, issuesRes] = await Promise.all([adminApi.deviceTypes(), deviceCatalogApi.brands(), deviceCatalogApi.issues()]);
      setDeviceTypes(typesRes.items.filter((t) => t.active));
      setBrands(brandsRes.items.filter((b) => b.active));
      setIssues(issuesRes.items.filter((i) => i.active));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando catÃ¡logo');
    }
  }

  async function loadModelsByBrand(brandId?: string) {
    try {
      const res = await deviceCatalogApi.models(brandId || undefined);
      setModels(res.items.filter((m) => m.active));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando modelos');
    }
  }

  useEffect(() => {
    void loadCatalog();
    void loadModelsByBrand();
  }, []);

  useEffect(() => {
    setSelectedBrandId('');
    setSelectedModelId('');
    if (selectedIssueId && !issues.some((i) => i.id === selectedIssueId && (!selectedDeviceTypeId || i.deviceTypeId === selectedDeviceTypeId))) {
      setSelectedIssueId('');
    }
  }, [selectedDeviceTypeId]);

  async function loadEditModelsByBrand(brandId?: string) {
    try {
      const res = await deviceCatalogApi.models(brandId || undefined);
      setEditModels(res.items.filter((m) => m.active));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando modelos');
    }
  }

  useEffect(() => {
    setSelectedModelId('');
    const selectedBrand = brands.find((b) => b.id === selectedBrandId);
    if (selectedBrand?.deviceTypeId && selectedBrand.deviceTypeId !== selectedDeviceTypeId) {
      setSelectedDeviceTypeId(selectedBrand.deviceTypeId);
    }
    setForm((prev) => ({ ...prev, deviceBrand: selectedBrand?.name ?? '' }));
    void loadModelsByBrand(selectedBrandId || undefined);
  }, [selectedBrandId]);

  useEffect(() => {
    const selectedModel = models.find((m) => m.id === selectedModelId);
    setForm((prev) => ({ ...prev, deviceModel: selectedModel?.name ?? '' }));
  }, [selectedModelId, models]);

  useEffect(() => {
    const selectedIssue = issues.find((i) => i.id === selectedIssueId);
    setForm((prev) => ({ ...prev, issueLabel: selectedIssue?.name ?? '' }));
  }, [selectedIssueId, issues]);

  useEffect(() => {
    if (!selectedRepairId) {
      setSelectedRepair(null);
      setSelectedRepairTimeline([]);
      return;
    }
    setLoadingSelectedRepair(true);
    void repairsApi.adminDetail(selectedRepairId)
      .then((res) => {
        const item = res.item;
        hydratingEditRef.current = true;
        setSelectedRepair(item);
        setSelectedRepairTimeline(res.timeline ?? []);
        setEditDeviceTypeId(item.deviceTypeId || '');
        setEditBrandId(item.deviceBrandId || '');
        setEditModelId(item.deviceModelId || '');
        setEditIssueId(item.deviceIssueTypeId || '');
        setEditForm({
          customerName: item.customerName || '',
          customerPhone: item.customerPhone || '',
          deviceBrand: item.deviceBrand || '',
          deviceModel: item.deviceModel || '',
          issueLabel: item.issueLabel || '',
          status: item.status,
          quotedPrice: item.quotedPrice != null ? String(item.quotedPrice) : '',
          finalPrice: item.finalPrice != null ? String(item.finalPrice) : '',
          notes: item.notes || '',
        });
        void loadEditModelsByBrand(item.deviceBrandId || undefined);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error cargando detalle'))
      .finally(() => setLoadingSelectedRepair(false));
  }, [selectedRepairId]);

  useEffect(() => {
    if (!selectedRepair) return;
    const selectedBrand = brands.find((b) => b.id === editBrandId);
    if (selectedBrand?.deviceTypeId && selectedBrand.deviceTypeId !== editDeviceTypeId) {
      setEditDeviceTypeId(selectedBrand.deviceTypeId);
    }
    setEditForm((prev) => ({ ...prev, deviceBrand: selectedBrand?.name ?? prev.deviceBrand }));
    if (hydratingEditRef.current) {
      hydratingEditRef.current = false;
    } else {
      setEditModelId('');
    }
    void loadEditModelsByBrand(editBrandId || undefined);
  }, [editBrandId]);

  useEffect(() => {
    if (!selectedRepair) return;
    if (!hydratingEditRef.current) {
      setEditBrandId('');
      setEditModelId('');
    }
    if (editIssueId && !issues.some((i) => i.id === editIssueId && (!editDeviceTypeId || i.deviceTypeId === editDeviceTypeId))) {
      setEditIssueId('');
    }
  }, [editDeviceTypeId]);

  useEffect(() => {
    const selectedModel = editModels.find((m) => m.id === editModelId);
    if (!selectedModel) return;
    setEditForm((prev) => ({ ...prev, deviceModel: selectedModel.name }));
  }, [editModelId, editModels]);

  useEffect(() => {
    const selectedIssue = issues.find((i) => i.id === editIssueId);
    if (!selectedIssue) return;
    setEditForm((prev) => ({ ...prev, issueLabel: selectedIssue.name }));
  }, [editIssueId, issues]);

  async function createRepair(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const quotedPrice = form.quotedPrice ? Number(form.quotedPrice) : null;
      await repairsApi.adminCreate({
        customerName: form.customerName,
        customerPhone: form.customerPhone || null,
        deviceTypeId: selectedDeviceTypeId || null,
        deviceBrandId: selectedBrandId || null,
        deviceModelId: selectedModelId || null,
        deviceIssueTypeId: selectedIssueId || null,
        deviceBrand: form.deviceBrand || null,
        deviceModel: form.deviceModel || null,
        issueLabel: form.issueLabel || null,
        notes: form.notes || null,
        quotedPrice,
      });
      setForm({ customerName: '', customerPhone: '', deviceBrand: '', deviceModel: '', issueLabel: '', quotedPrice: '', notes: '' });
      setSelectedDeviceTypeId('');
      setSelectedBrandId('');
      setSelectedModelId('');
      setSelectedIssueId('');
      setPriceSuggestion(null);
      await load();
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando reparaciÃ³n');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id: string, status: string) {
    try {
      const res = await repairsApi.adminUpdateStatus(id, { status });
      setItems((prev) => prev.map((r) => (r.id === id ? res.item : r)));
      setSelectedRepair((prev) => (prev?.id === id ? res.item : prev));
      void loadStats();
      if (selectedRepairId === id) {
        void repairsApi.adminDetail(id).then((detail) => setSelectedRepairTimeline(detail.timeline ?? [])).catch(() => {});
      }
      if (selectedRepairId === id) {
        setEditForm((prev) => ({ ...prev, status: res.item.status }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando estado');
    }
  }

  async function saveSelectedRepair(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRepairId) return;
    setSavingSelectedRepair(true);
    setError('');
    try {
      const res = await repairsApi.adminUpdate(selectedRepairId, {
        customerName: editForm.customerName,
        customerPhone: editForm.customerPhone || null,
        deviceTypeId: editDeviceTypeId || null,
        deviceBrandId: editBrandId || null,
        deviceModelId: editModelId || null,
        deviceIssueTypeId: editIssueId || null,
        deviceBrand: editForm.deviceBrand || null,
        deviceModel: editForm.deviceModel || null,
        issueLabel: editForm.issueLabel || null,
        status: editForm.status,
        quotedPrice: editForm.quotedPrice ? Number(editForm.quotedPrice) : null,
        finalPrice: editForm.finalPrice ? Number(editForm.finalPrice) : null,
        notes: editForm.notes || null,
      });
      setSelectedRepair(res.item);
      setItems((prev) => prev.map((r) => (r.id === res.item.id ? res.item : r)));
      void loadStats();
      void repairsApi.adminDetail(selectedRepairId).then((detail) => setSelectedRepairTimeline(detail.timeline ?? [])).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando reparaciÃ³n');
    } finally {
      setSavingSelectedRepair(false);
    }
  }

  async function suggestPrice() {
    setResolvingPrice(true);
    setError('');
    try {
      const res = await repairsApi.pricingResolve({
        deviceTypeId: selectedDeviceTypeId || (brands.find((b) => b.id === selectedBrandId)?.deviceTypeId ?? undefined),
        deviceBrandId: selectedBrandId || undefined,
        deviceModelGroupId: models.find((m) => m.id === selectedModelId)?.deviceModelGroupId ?? undefined,
        deviceModelId: selectedModelId || undefined,
        deviceIssueTypeId: selectedIssueId || undefined,
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
          calcMode: res.suggestion.calcMode,
          minFinalPrice: res.suggestion.minFinalPrice ?? null,
          shippingFee: res.suggestion.shippingFee ?? null,
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
        deviceBrandId: selectedBrandId || null,
        deviceModelId: selectedModelId || null,
        deviceIssueTypeId: selectedIssueId || null,
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
    <div className="store-shell">
      <section className="page-head store-hero">
        <div>
          <div className="page-title">Reparaciones</div>
          <p className="page-subtitle">Listado y control rÃ¡pido de reparaciones.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin" className="btn-outline">
            Volver a admin
          </Link>
        </div>
      </section>

      {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}

      <div className="mt-3 flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center">
        <div className="text-xs font-black uppercase text-zinc-500">Estados</div>
        <div className="text-xs text-zinc-500">{loading ? 'Cargando...' : `${items.length} reparaciones listadas`}</div>
      </div>

      <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.value || 'all'}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`nav-pill whitespace-nowrap ${statusFilter === tab.value ? 'nav-pill-active' : ''}`}
          >
            <span>{tab.label}</span>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-black ring-1 ring-zinc-200 bg-white/70 text-zinc-700">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={loadingStats ? '...' : String(stats?.total ?? 0)} />
        <StatCard label="Listas para retiro" value={loadingStats ? '...' : String(stats?.readyPickup ?? 0)} tone="emerald" />
        <StatCard label="Entregadas hoy" value={loadingStats ? '...' : String(stats?.deliveredToday ?? 0)} tone="sky" />
        <StatCard
          label="En curso"
          value={loadingStats ? '...' : String(Math.max(0, (stats?.total ?? 0) - ((stats?.byStatus?.DELIVERED ?? 0) + (stats?.byStatus?.CANCELLED ?? 0))))}
          tone="amber"
        />
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <form onSubmit={createRepair} className="card">
            <div className="card-head flex items-center justify-between gap-2">
              <div className="font-black">Nueva reparaciÃ³n</div>
              <div className="text-xs text-zinc-500">Alta rÃ¡pida</div>
            </div>
            <div className="card-body space-y-3">
            <Field label="Cliente *" value={form.customerName} onChange={(v) => setForm({ ...form, customerName: v })} required />
            <Field label="TelÃ©fono" value={form.customerPhone} onChange={(v) => setForm({ ...form, customerPhone: v })} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              <SelectField
                label="Tipo disp."
                value={selectedDeviceTypeId}
                onChange={setSelectedDeviceTypeId}
                options={deviceTypes.map((t) => ({ value: t.id, label: t.name }))}
                placeholder="Seleccionar"
              />
              <SelectField
                label="Marca (catÃ¡logo)"
                value={selectedBrandId}
                onChange={setSelectedBrandId}
                options={brands.filter((b) => !selectedDeviceTypeId || b.deviceTypeId === selectedDeviceTypeId).map((b) => ({ value: b.id, label: b.name }))}
                placeholder={selectedDeviceTypeId ? 'Seleccionar' : 'Primero tipo'}
                disabled={!selectedDeviceTypeId}
              />
              <SelectField
                label="Modelo (catÃ¡logo)"
                value={selectedModelId}
                onChange={setSelectedModelId}
                options={models.filter((m) => !selectedBrandId || m.brandId === selectedBrandId).map((m) => ({ value: m.id, label: m.name }))}
                placeholder={selectedBrandId ? 'Seleccionar' : 'Primero marca'}
                disabled={!selectedBrandId}
              />
              <SelectField
                label="Falla (catÃ¡logo)"
                value={selectedIssueId}
                onChange={setSelectedIssueId}
                options={issues.filter((i) => !selectedDeviceTypeId || i.deviceTypeId === selectedDeviceTypeId).map((i) => ({ value: i.id, label: i.name }))}
                placeholder={selectedDeviceTypeId ? 'Seleccionar' : 'Primero tipo'}
                disabled={!selectedDeviceTypeId}
              />
            </div>
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
                  ? `Regla: ${priceSuggestion.ruleName || 'sin nombre'} Â· ${
                      priceSuggestion.calcMode === 'FIXED_TOTAL'
                        ? `Total fijo $${(priceSuggestion.basePrice ?? 0).toLocaleString('es-AR')}`
                        : `Base $${(priceSuggestion.basePrice ?? 0).toLocaleString('es-AR')} + ${(priceSuggestion.profitPercent ?? 0).toLocaleString('es-AR')}%`
                    }${
                      (priceSuggestion.shippingFee ?? 0) > 0
                        ? ` + envÃ­o $${(priceSuggestion.shippingFee ?? 0).toLocaleString('es-AR')}`
                        : ''
                    }${
                      (priceSuggestion.minFinalPrice ?? 0) > 0
                        ? ` Â· mÃ­n. $${(priceSuggestion.minFinalPrice ?? 0).toLocaleString('es-AR')}`
                        : ''
                    } = $${(priceSuggestion.suggestedTotal ?? 0).toLocaleString('es-AR')}`
                  : 'No se encontrÃ³ regla coincidente. PodÃ©s cargar el presupuesto manualmente o crear una regla.'}
              </div>
            ) : null}
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Notas</span>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
            </label>
              <Button className="w-full" disabled={saving}>{saving ? 'Guardando...' : 'Crear reparaciÃ³n'}</Button>
            </div>
          </form>

          <section className="card">
            <div className="card-head flex items-center justify-between gap-2">
              <div className="font-black">Reglas de cÃ¡lculo</div>
              <div className="text-xs text-zinc-500">{loadingRules ? 'Cargando...' : `${rules.length} reglas`}</div>
            </div>
            <div className="card-body">
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
                  <div className="rounded-xl border border-zinc-200 p-2 text-sm">Sin reglas todavÃ­a.</div>
                ) : rules.map((rule) => (
                  <div key={rule.id} className="rounded-xl border border-zinc-200 p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-black text-zinc-900">{rule.name}</div>
                        <div className="text-xs text-zinc-500">
                          {[rule.deviceBrand, rule.deviceModel, rule.issueLabel].filter(Boolean).join(' Â· ') || 'Regla global'}
                        </div>
                        <div className="mt-1 text-xs text-zinc-600">Base ${rule.basePrice.toLocaleString('es-AR')} + {rule.profitPercent}% Â· Prio {rule.priority}</div>
                      </div>
                      <button type="button" className="text-xs font-bold text-rose-700 hover:text-rose-800" onClick={() => void deleteRule(rule.id)}>
                        Borrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="card">
          <div className="card-head flex items-center justify-between gap-2">
            <div className="font-black">Listado y detalle</div>
            <div className="text-xs text-zinc-500">
              {loading ? 'Cargando...' : `${items.length} reparaciones`} Â· {selectedRepairId ? 'detalle activo' : 'sin selecciÃ³n'}
            </div>
          </div>
          <div className="card-body">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Filtros</div>
            <div className="mb-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
              <div className="flex flex-wrap gap-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar ID / cliente / telÃ©fono / modelo / falla..." className="h-10 flex-1 min-w-[220px] rounded-xl border border-zinc-200 px-3 text-sm" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 min-w-[200px] rounded-xl border border-zinc-200 px-3 text-sm">
                <option value="">Todos los estados</option>
                {STATUSES.map((s) => <option key={s} value={s}>{repairStatusLabel(s)}</option>)}
              </select>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
                aria-label="Desde"
                title="Desde"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-10 rounded-xl border border-zinc-200 px-3 text-sm"
                aria-label="Hasta"
                title="Hasta"
              />
              {(fromDate || toDate) ? (
                <button
                  type="button"
                  onClick={() => { setFromDate(''); setToDate(''); }}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Limpiar fechas
                </button>
              ) : null}
              </div>
            </div>
            {loading ? (
              <div className="rounded-xl border border-zinc-200 p-3 text-sm">Cargando...</div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 p-3 text-sm">No hay reparaciones.</div>
            ) : (
              <div className="space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">Listado</div>
                <div className="hidden grid-cols-[1.45fr_1fr_1fr_0.8fr_0.7fr_1.5fr] gap-4 px-3 text-xs font-black uppercase tracking-wide text-zinc-500 lg:grid">
                  <div>Codigo</div>
                  <div>Cliente</div>
                  <div>Equipo</div>
                  <div>Estado</div>
                  <div>Final</div>
                  <div className="text-right">Acciones</div>
                </div>
                {items.map((r) => (
                  <div
                    key={r.id}
                    className={`rounded-2xl border bg-white p-3 transition ${selectedRepairId === r.id ? 'border-sky-300 ring-2 ring-sky-100' : 'border-zinc-200'}`}
                  >
                    <div className="grid gap-3 lg:grid-cols-[1.45fr_1fr_1fr_0.8fr_0.7fr_1.5fr] lg:items-center">
                      <div className="min-w-0">
                        <div className="text-lg font-black tracking-tight text-zinc-900">{repairCodeLabel(r.id)}</div>
                        <div className="mt-0.5 text-xs text-zinc-600">
                          Recibido: {new Date(r.createdAt).toLocaleDateString('es-AR')} {new Date(r.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} Â· <span className="font-bold">{timeAgoLabel(r.createdAt)}</span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-base font-black tracking-tight text-zinc-900">{r.customerName}</div>
                        <div className="truncate text-xs text-zinc-600">{r.customerPhone || 'Sin telÃ©fono'}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-base text-zinc-900">{[r.deviceBrand, r.deviceModel].filter(Boolean).join(' ') || 'Sin equipo'}</div>
                      </div>
                      <div>
                        <span className={repairStatusBadgeClass(r.status)}>{repairStatusLabel(r.status)}</span>
                      </div>
                      <div className="text-base font-black tracking-tight text-zinc-900">
                        {r.finalPrice != null ? `$ ${r.finalPrice.toLocaleString('es-AR')}` : r.quotedPrice != null ? `$ ${r.quotedPrice.toLocaleString('es-AR')}` : 'â€”'}
                      </div>
                      <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
                        <button type="button" onClick={() => setSelectedRepairId(r.id)} className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
                          Ver
                        </button>
                        <button type="button" className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700">
                          WhatsApp
                        </button>
                        <button type="button" className="btn-ghost !h-10 !rounded-xl px-3 text-sm font-bold">
                          Mas
                        </button>
                        <span className="badge-amber">WA pendiente</span>
                      </div>
                    </div>

                    {selectedRepairId === r.id ? (
                      <div className="mt-3 border-t border-zinc-100 pt-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">Estado</label>
                          <select value={r.status} onChange={(e) => void changeStatus(r.id, e.target.value)} className="h-9 min-w-[220px] rounded-xl border border-zinc-200 px-3 text-sm">
                            {STATUSES.map((s) => <option key={s} value={s}>{repairStatusLabel(s)}</option>)}
                          </select>
                          <span className={repairStatusBadgeClass(r.status)}>{repairStatusLabel(r.status)}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 border-t border-zinc-200 pt-4">
              {!selectedRepairId ? (
                <div className="rounded-xl border border-dashed border-zinc-300 p-3 text-sm text-zinc-600">
                  Selecciona una reparaciÃ³n para ver y editar el detalle.
                </div>
              ) : loadingSelectedRepair ? (
                <div className="rounded-xl border border-zinc-200 p-3 text-sm">Cargando detalle...</div>
              ) : !selectedRepair ? (
                <div className="rounded-xl border border-zinc-200 p-3 text-sm">No se pudo cargar el detalle.</div>
              ) : (
                <form onSubmit={saveSelectedRepair} className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">Detalle</div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">Detalle de reparaciÃ³n</div>
                      <div className="mt-1 text-sm font-black break-all text-zinc-900">{selectedRepair.id}</div>
                      <div className="text-xs text-zinc-500">{new Date(selectedRepair.createdAt).toLocaleString('es-AR')}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 font-bold text-zinc-700">
                        Estado: {repairStatusLabel(editForm.status)}
                      </span>
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 font-bold text-zinc-700">
                        Actualizado: {new Date(selectedRepair.updatedAt).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label="Cliente *" value={editForm.customerName} onChange={(v) => setEditForm((p) => ({ ...p, customerName: v }))} required />
                    <Field label="TelÃ©fono" value={editForm.customerPhone} onChange={(v) => setEditForm((p) => ({ ...p, customerPhone: v }))} />
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                    <SelectField
                      label="Tipo disp."
                      value={editDeviceTypeId}
                      onChange={setEditDeviceTypeId}
                      options={deviceTypes.map((t) => ({ value: t.id, label: t.name }))}
                      placeholder="Seleccionar"
                    />
                    <SelectField
                      label="Marca (catÃ¡logo)"
                      value={editBrandId}
                      onChange={setEditBrandId}
                      options={brands.filter((b) => !editDeviceTypeId || b.deviceTypeId === editDeviceTypeId).map((b) => ({ value: b.id, label: b.name }))}
                      placeholder={editDeviceTypeId ? 'Seleccionar' : 'Primero tipo'}
                      disabled={!editDeviceTypeId}
                    />
                    <SelectField
                      label="Modelo (catÃ¡logo)"
                      value={editModelId}
                      onChange={setEditModelId}
                      options={editModels.filter((m) => !editBrandId || m.brandId === editBrandId).map((m) => ({ value: m.id, label: m.name }))}
                      placeholder={editBrandId ? 'Seleccionar' : 'Primero marca'}
                      disabled={!editBrandId}
                    />
                    <SelectField
                      label="Falla (catÃ¡logo)"
                      value={editIssueId}
                      onChange={setEditIssueId}
                      options={issues.filter((i) => !editDeviceTypeId || i.deviceTypeId === editDeviceTypeId).map((i) => ({ value: i.id, label: i.name }))}
                      placeholder={editDeviceTypeId ? 'Seleccionar' : 'Primero tipo'}
                      disabled={!editDeviceTypeId}
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <Field label="Marca" value={editForm.deviceBrand} onChange={(v) => setEditForm((p) => ({ ...p, deviceBrand: v }))} />
                    <Field label="Modelo" value={editForm.deviceModel} onChange={(v) => setEditForm((p) => ({ ...p, deviceModel: v }))} />
                    <Field label="Falla" value={editForm.issueLabel} onChange={(v) => setEditForm((p) => ({ ...p, issueLabel: v }))} />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="block">
                      <span className="mb-1 block text-sm font-bold text-zinc-700">Estado</span>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                        className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{repairStatusLabel(s)}</option>)}
                      </select>
                    </label>
                    <Field label="Presupuesto" type="number" value={editForm.quotedPrice} onChange={(v) => setEditForm((p) => ({ ...p, quotedPrice: v }))} />
                    <Field label="Precio final" type="number" value={editForm.finalPrice} onChange={(v) => setEditForm((p) => ({ ...p, finalPrice: v }))} />
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-sm font-bold text-zinc-700">Notas</span>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                      rows={4}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </label>

                  <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setSelectedRepairId(null)}>
                      Cerrar detalle
                    </Button>
                    <Button disabled={savingSelectedRepair}>
                      {savingSelectedRepair ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Historial</div>
                    {selectedRepairTimeline.length === 0 ? (
                      <div className="text-sm text-zinc-600">Sin eventos registrados.</div>
                    ) : (
                      <div className="space-y-2">
                        {selectedRepairTimeline.map((ev) => (
                          <div key={ev.id} className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="text-xs font-black text-zinc-800">{ev.eventType}</div>
                              <div className="text-[11px] text-zinc-500">{new Date(ev.createdAt).toLocaleString('es-AR')}</div>
                            </div>
                            {ev.message ? <div className="mt-1 text-sm text-zinc-700">{ev.message}</div> : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
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

function StatCard({ label, value, tone = 'zinc' }: { label: string; value: string; tone?: 'zinc' | 'emerald' | 'sky' | 'amber' }) {
  const styles = {
    zinc: 'border-zinc-200 bg-white text-zinc-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    sky: 'border-sky-200 bg-sky-50 text-sky-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
  } as const;

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${styles[tone]}`}>
      <div className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight">{value}</div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-zinc-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm disabled:bg-zinc-100 disabled:text-zinc-400"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}


