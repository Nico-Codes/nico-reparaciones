import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '@/features/admin/api';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { repairsApi } from '@/features/repairs/api';

export function AdminRepairPricingRuleCreatePage() {
  const navigate = useNavigate();
  const [deviceTypes, setDeviceTypes] = useState<Array<{ id: string; name: string; slug: string; active: boolean }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean }>>([]);
  const [models, setModels] = useState<Array<{ id: string; brandId: string; deviceModelGroupId?: string | null; name: string; slug: string; active: boolean; brand: { id: string; name: string; slug: string } }>>([]);
  const [issues, setIssues] = useState<Array<{ id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean }>>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [deviceTypeId, setDeviceTypeId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [issueId, setIssueId] = useState('');
  const [brandText, setBrandText] = useState('');
  const [modelText, setModelText] = useState('');
  const [issueText, setIssueText] = useState('');
  const [basePrice, setBasePrice] = useState('0');
  const [profitPercent, setProfitPercent] = useState('25');
  const [calcMode, setCalcMode] = useState<'BASE_PLUS_MARGIN' | 'FIXED_TOTAL'>('BASE_PLUS_MARGIN');
  const [minProfit, setMinProfit] = useState('');
  const [minFinalPrice, setMinFinalPrice] = useState('');
  const [shippingFee, setShippingFee] = useState('');
  const [priority, setPriority] = useState('0');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);

  async function loadCatalog() {
    setLoadingCatalog(true);
    setError('');
    try {
      const [t, b, i, m] = await Promise.all([adminApi.deviceTypes(), deviceCatalogApi.brands(), deviceCatalogApi.issues(), deviceCatalogApi.models()]);
      setDeviceTypes(t.items.filter((x) => x.active));
      setBrands(b.items.filter((x) => x.active));
      setIssues(i.items.filter((x) => x.active));
      setModels(m.items.filter((x) => x.active));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando catálogo');
    } finally {
      setLoadingCatalog(false);
    }
  }

  useEffect(() => {
    void loadCatalog();
  }, []);

  useEffect(() => {
    if (brandId) return;
    setModelId('');
    if (issueId && !issues.some((i) => i.id === issueId && (!deviceTypeId || i.deviceTypeId === deviceTypeId))) {
      setIssueId('');
    }
  }, [deviceTypeId]);

  useEffect(() => {
    const selectedBrand = brands.find((b) => b.id === brandId);
    if (selectedBrand?.deviceTypeId && selectedBrand.deviceTypeId !== deviceTypeId) {
      setDeviceTypeId(selectedBrand.deviceTypeId);
    }
  }, [brandId, brands, deviceTypeId]);

  const filteredBrands = useMemo(
    () => (deviceTypeId ? brands.filter((b) => b.deviceTypeId === deviceTypeId) : brands),
    [brands, deviceTypeId],
  );
  const filteredModels = useMemo(
    () => (brandId ? models.filter((m) => m.brandId === brandId) : models),
    [models, brandId],
  );
  const filteredIssues = useMemo(
    () => (deviceTypeId ? issues.filter((i) => i.deviceTypeId === deviceTypeId) : issues),
    [issues, deviceTypeId],
  );

  async function save() {
    setSaving(true);
    setError('');
    try {
      await repairsApi.pricingRulesCreate({
        name: name.trim() || `Regla ${issueText || 'reparación'}`,
        active,
        priority: Number(priority || 0),
        deviceTypeId: deviceTypeId || (brands.find((b) => b.id === brandId)?.deviceTypeId ?? null),
        deviceBrandId: brandId || null,
        deviceModelGroupId: models.find((m) => m.id === modelId)?.deviceModelGroupId ?? null,
        deviceModelId: modelId || null,
        deviceIssueTypeId: issueId || null,
        deviceBrand: brandText.trim() || (brands.find((b) => b.id === brandId)?.name ?? null),
        deviceModel: modelText.trim() || (models.find((m) => m.id === modelId)?.name ?? null),
        issueLabel: issueText.trim() || (issues.find((i) => i.id === issueId)?.name ?? null),
        basePrice: Number(basePrice || 0),
        profitPercent: Number(profitPercent || 0),
        calcMode,
        minProfit: minProfit ? Number(minProfit) : null,
        minFinalPrice: minFinalPrice ? Number(minFinalPrice) : null,
        shippingFee: shippingFee ? Number(shippingFee) : null,
        notes: notes.trim() || null,
      });
      navigate('/admin/precios');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la regla');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Crear regla</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Configura cálculo automático por tipo, marca, grupo/modelo y falla con soporte completo de modo margen/fijo.
            </p>
          </div>
          <Link to="/admin/precios" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Volver
          </Link>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

      <section className="card mx-auto w-full max-w-[820px]">
        <div className="card-body space-y-4 md:space-y-5">
          <Field label="Nombre de la regla *">
            <input value={name} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" placeholder="Ej: Módulo Samsung A línea media" />
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Tipo de dispositivo (catálogo, opcional)">
              <select
                value={deviceTypeId}
                onChange={(e) => {
                  setDeviceTypeId(e.target.value);
                  setBrandId('');
                  setModelId('');
                }}
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
                disabled={loadingCatalog}
              >
                <option value="">-</option>
                {deviceTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Marca (catálogo, opcional)">
              <select
                value={brandId}
                onChange={(e) => {
                  setBrandId(e.target.value);
                  setModelId('');
                }}
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
                disabled={loadingCatalog}
              >
                <option value="">-</option>
                {filteredBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Modelo (catálogo, opcional)">
              <select value={modelId} onChange={(e) => setModelId(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" disabled={loadingCatalog}>
                <option value="">-</option>
                {filteredModels.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Tipo de reparación / falla (catálogo, opcional)">
            <select value={issueId} onChange={(e) => setIssueId(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" disabled={loadingCatalog}>
              <option value="">-</option>
              {filteredIssues.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Base (costo/base) *">
              <input value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </Field>
            <Field label="Margen (%) *">
              <input value={profitPercent} onChange={(e) => setProfitPercent(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" disabled={calcMode === 'FIXED_TOTAL'} />
            </Field>
            <Field label="Prioridad">
              <input value={priority} onChange={(e) => setPriority(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Modo de cálculo">
              <select value={calcMode} onChange={(e) => setCalcMode(e.target.value as 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL')} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
                <option value="BASE_PLUS_MARGIN">Base + % margen</option>
                <option value="FIXED_TOTAL">Total fijo</option>
              </select>
            </Field>
            <Field label="Mínimo de ganancia (opcional)">
              <input value={minProfit} onChange={(e) => setMinProfit(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" placeholder="0" disabled={calcMode === 'FIXED_TOTAL'} />
            </Field>
            <Field label="Mínimo final (opcional)">
              <input value={minFinalPrice} onChange={(e) => setMinFinalPrice(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" placeholder="0" />
            </Field>
            <Field label="Envío (opcional)">
              <input value={shippingFee} onChange={(e) => setShippingFee(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" placeholder="0" />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Marca (texto fallback)">
              <input value={brandText} onChange={(e) => setBrandText(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" placeholder="Samsung" />
            </Field>
            <Field label="Modelo (texto fallback)">
              <input value={modelText} onChange={(e) => setModelText(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" placeholder="A32" />
            </Field>
            <Field label="Reparación (texto fallback)">
              <input value={issueText} onChange={(e) => setIssueText(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" placeholder="Módulo" />
            </Field>
          </div>

          <Field label="Notas (opcional)">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm" />
          </Field>

          <label className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
            Activa
          </label>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <Link to="/admin/precios" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
              Cancelar
            </Link>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || loadingCatalog || (!name.trim() && !issueText.trim() && !issueId)}
              className="btn-primary !h-10 !rounded-xl px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-zinc-800">{label}</label>
      {children}
    </div>
  );
}
