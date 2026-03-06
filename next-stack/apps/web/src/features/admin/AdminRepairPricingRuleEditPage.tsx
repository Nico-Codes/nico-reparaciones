import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import { adminApi } from '@/features/admin/api';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { repairsApi } from '@/features/repairs/api';

type RepairRuleApiItem = {
  id: string;
  name: string;
  active: boolean;
  priority: number;
  deviceTypeId?: string | null;
  deviceBrandId?: string | null;
  deviceModelGroupId?: string | null;
  deviceModelId?: string | null;
  deviceIssueTypeId?: string | null;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  issueLabel?: string | null;
  basePrice: number;
  profitPercent: number;
  calcMode?: 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL';
  minProfit?: number | null;
  minFinalPrice?: number | null;
  shippingFee?: number | null;
  notes?: string | null;
};

export function AdminRepairPricingRuleEditPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [deviceTypes, setDeviceTypes] = useState<Array<{ id: string; name: string; slug: string; active: boolean }>>([]);
  const [brands, setBrands] = useState<Array<{ id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean }>>([]);
  const [models, setModels] = useState<Array<{ id: string; brandId: string; deviceModelGroupId?: string | null; name: string; slug: string; active: boolean; brand: { id: string; name: string; slug: string } }>>([]);
  const [issues, setIssues] = useState<Array<{ id: string; deviceTypeId?: string | null; name: string; slug: string; active: boolean }>>([]);
  const [loadingPage, setLoadingPage] = useState(true);
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

  async function loadPage() {
    if (!id) return;
    setLoadingPage(true);
    setError('');
    try {
      const [typesRes, brandsRes, issuesRes, modelsRes, rulesRes] = await Promise.all([
        adminApi.deviceTypes(),
        deviceCatalogApi.brands(),
        deviceCatalogApi.issues(),
        deviceCatalogApi.models(),
        repairsApi.pricingRulesList(),
      ]);

      const rules = (rulesRes.items as RepairRuleApiItem[]) ?? [];
      const current = rules.find((rule) => rule.id === id);
      if (!current) {
        throw new Error('Regla no encontrada');
      }

      setDeviceTypes(typesRes.items.filter((item) => item.active));
      setBrands(brandsRes.items.filter((item) => item.active));
      setIssues(issuesRes.items.filter((item) => item.active));
      setModels(modelsRes.items.filter((item) => item.active));

      setName(current.name ?? '');
      setDeviceTypeId(current.deviceTypeId ?? '');
      setBrandId(current.deviceBrandId ?? '');
      setModelId(current.deviceModelId ?? '');
      setIssueId(current.deviceIssueTypeId ?? '');
      setBrandText(current.deviceBrand ?? '');
      setModelText(current.deviceModel ?? '');
      setIssueText(current.issueLabel ?? '');
      setBasePrice(String(current.basePrice ?? 0));
      setProfitPercent(String(current.profitPercent ?? 0));
      setCalcMode(current.calcMode === 'FIXED_TOTAL' ? 'FIXED_TOTAL' : 'BASE_PLUS_MARGIN');
      setMinProfit(current.minProfit != null ? String(current.minProfit) : '');
      setMinFinalPrice(current.minFinalPrice != null ? String(current.minFinalPrice) : '');
      setShippingFee(current.shippingFee != null ? String(current.shippingFee) : '');
      setPriority(String(current.priority ?? 0));
      setNotes(current.notes ?? '');
      setActive(Boolean(current.active));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando regla');
    } finally {
      setLoadingPage(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [id]);

  useEffect(() => {
    if (brandId) return;
    setModelId('');
    if (issueId && !issues.some((issue) => issue.id === issueId && (!deviceTypeId || issue.deviceTypeId === deviceTypeId))) {
      setIssueId('');
    }
  }, [deviceTypeId, brandId, issueId, issues]);

  useEffect(() => {
    const selectedBrand = brands.find((brand) => brand.id === brandId);
    if (selectedBrand?.deviceTypeId && selectedBrand.deviceTypeId !== deviceTypeId) {
      setDeviceTypeId(selectedBrand.deviceTypeId);
    }
  }, [brandId, brands, deviceTypeId]);

  const filteredBrands = useMemo(
    () => (deviceTypeId ? brands.filter((brand) => brand.deviceTypeId === deviceTypeId) : brands),
    [brands, deviceTypeId],
  );
  const filteredModels = useMemo(
    () => (brandId ? models.filter((model) => model.brandId === brandId) : models),
    [models, brandId],
  );
  const filteredIssues = useMemo(
    () => (deviceTypeId ? issues.filter((issue) => issue.deviceTypeId === deviceTypeId) : issues),
    [issues, deviceTypeId],
  );

  const deviceTypeOptions = useMemo(
    () => [{ value: '', label: '-' }, ...deviceTypes.map((type) => ({ value: type.id, label: type.name }))],
    [deviceTypes],
  );
  const brandOptions = useMemo(
    () => [{ value: '', label: '-' }, ...filteredBrands.map((brand) => ({ value: brand.id, label: brand.name }))],
    [filteredBrands],
  );
  const modelOptions = useMemo(
    () => [{ value: '', label: '-' }, ...filteredModels.map((model) => ({ value: model.id, label: model.name }))],
    [filteredModels],
  );
  const issueOptions = useMemo(
    () => [{ value: '', label: '-' }, ...filteredIssues.map((issue) => ({ value: issue.id, label: issue.name }))],
    [filteredIssues],
  );
  const calcModeOptions = useMemo(
    () => [
      { value: 'BASE_PLUS_MARGIN', label: 'Base + % margen' },
      { value: 'FIXED_TOTAL', label: 'Total fijo' },
    ],
    [],
  );

  async function save() {
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      await repairsApi.pricingRulesUpdate(id, {
        name: name.trim() || `Regla ${issueText || 'reparación'}`,
        active,
        priority: Number(priority || 0),
        deviceTypeId: deviceTypeId || (brands.find((brand) => brand.id === brandId)?.deviceTypeId ?? null),
        deviceBrandId: brandId || null,
        deviceModelGroupId: models.find((model) => model.id === modelId)?.deviceModelGroupId ?? null,
        deviceModelId: modelId || null,
        deviceIssueTypeId: issueId || null,
        deviceBrand: brandText.trim() || (brands.find((brand) => brand.id === brandId)?.name ?? null),
        deviceModel: modelText.trim() || (models.find((model) => model.id === modelId)?.name ?? null),
        issueLabel: issueText.trim() || (issues.find((issue) => issue.id === issueId)?.name ?? null),
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
      setError(e instanceof Error ? e.message : 'No se pudo guardar la regla');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Editar regla</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Ajustá el cálculo automático manteniendo alcance por tipo, marca, modelo/grupo y falla.
            </p>
          </div>
          <Link to="/admin/precios" className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Volver
          </Link>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}

      {loadingPage ? (
        <section className="card mx-auto w-full max-w-[820px]">
          <div className="card-body">Cargando regla...</div>
        </section>
      ) : (
        <section className="card mx-auto w-full max-w-[820px]">
          <div className="card-body space-y-4 md:space-y-5">
            <Field label="Nombre de la regla *">
              <input value={name} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" placeholder="Ej: Módulo Samsung A línea media" />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Tipo de dispositivo (catálogo, opcional)">
                <CustomSelect
                  value={deviceTypeId}
                  onChange={(value) => {
                    setDeviceTypeId(value);
                    setBrandId('');
                    setModelId('');
                  }}
                  options={deviceTypeOptions}
                  disabled={loadingPage}
                  triggerClassName="min-h-11 rounded-2xl font-bold"
                  ariaLabel="Seleccionar tipo de dispositivo"
                />
              </Field>
              <Field label="Marca (catálogo, opcional)">
                <CustomSelect
                  value={brandId}
                  onChange={(value) => {
                    setBrandId(value);
                    setModelId('');
                  }}
                  options={brandOptions}
                  disabled={loadingPage}
                  triggerClassName="min-h-11 rounded-2xl font-bold"
                  ariaLabel="Seleccionar marca"
                />
              </Field>
              <Field label="Modelo (catálogo, opcional)">
                <CustomSelect
                  value={modelId}
                  onChange={setModelId}
                  options={modelOptions}
                  disabled={loadingPage}
                  triggerClassName="min-h-11 rounded-2xl font-bold"
                  ariaLabel="Seleccionar modelo"
                />
              </Field>
            </div>

            <Field label="Tipo de reparación / falla (catálogo, opcional)">
              <CustomSelect
                value={issueId}
                onChange={setIssueId}
                options={issueOptions}
                disabled={loadingPage}
                triggerClassName="min-h-11 rounded-2xl font-bold"
                ariaLabel="Seleccionar tipo de reparación"
              />
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
                <CustomSelect
                  value={calcMode}
                  onChange={(value) => setCalcMode(value as 'BASE_PLUS_MARGIN' | 'FIXED_TOTAL')}
                  options={calcModeOptions}
                  triggerClassName="min-h-11 rounded-2xl font-bold"
                  ariaLabel="Seleccionar modo de cálculo"
                />
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
                disabled={saving || loadingPage || (!name.trim() && !issueText.trim() && !issueId)}
                className="btn-primary !h-10 !rounded-xl px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-zinc-800">{label}</label>
      {children}
    </div>
  );
}
