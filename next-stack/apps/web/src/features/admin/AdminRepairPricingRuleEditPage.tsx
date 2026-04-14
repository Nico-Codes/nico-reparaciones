import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { adminApi } from '@/features/admin/api';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { repairsApi } from '@/features/repairs/api';
import { buildRepairCalculationSearch, readRepairCalculationScope } from './admin-repair-calculation-context';
import {
  AdminRepairPricingRuleError,
  AdminRepairPricingRuleFormCard,
  AdminRepairPricingRuleHero,
  AdminRepairPricingRuleLoading,
} from './admin-repair-pricing-rule-form.sections';
import {
  applyRepairPricingRuleBrand,
  applyRepairPricingRuleDeviceType,
  applyRepairPricingRuleModelGroup,
  buildRepairPricingRuleFormState,
  buildRepairPricingRuleOptions,
  buildRepairPricingRulePayload,
  canSaveRepairPricingRule,
  createRepairPricingRuleFormState,
  type RepairPricingRuleCatalog,
  type RepairPricingRuleFormState,
  type RepairRuleApiItem,
  type RepairRuleCalcMode,
} from './admin-repair-pricing-rule-form.helpers';

const EMPTY_CATALOG: RepairPricingRuleCatalog = {
  deviceTypes: [],
  brands: [],
  modelGroupsByBrand: {},
  models: [],
  issues: [],
};

async function loadModelGroupsByBrand(brandIds: string[]) {
  const settled = await Promise.allSettled(brandIds.map((brandId) => adminApi.modelGroups(brandId)));
  return settled.reduce<Record<string, RepairPricingRuleCatalog['modelGroupsByBrand'][string]>>((acc, result, index) => {
    if (result.status !== 'fulfilled') return acc;
    acc[brandIds[index]] = result.value.groups.filter((group) => group.active);
    return acc;
  }, {});
}

export function AdminRepairPricingRuleEditPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contextScope = useMemo(() => readRepairCalculationScope(searchParams), [searchParams]);
  const backTo = useMemo(() => `/admin/precios${buildRepairCalculationSearch(contextScope)}`, [contextScope]);
  const [catalog, setCatalog] = useState<RepairPricingRuleCatalog>(EMPTY_CATALOG);
  const [form, setForm] = useState<RepairPricingRuleFormState>(() => createRepairPricingRuleFormState());
  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadPage() {
    if (!id) return;
    setLoadingPage(true);
    setError('');
    try {
      const [deviceTypesRes, brandsRes, issuesRes, modelsRes, rulesRes] = await Promise.all([
        adminApi.deviceTypes(),
        deviceCatalogApi.brands(),
        deviceCatalogApi.issues(),
        deviceCatalogApi.models(),
        repairsApi.pricingRulesList(),
      ]);

      const activeTypes = deviceTypesRes.items.filter((item) => item.active);
      const activeBrands = brandsRes.items.filter((item) => item.active);
      const activeIssues = issuesRes.items.filter((item) => item.active);
      const activeModels = modelsRes.items.filter((item) => item.active);
      const modelGroupsByBrand = await loadModelGroupsByBrand(activeBrands.map((brand) => brand.id));
      const rules = (rulesRes.items as RepairRuleApiItem[]) ?? [];
      const current = rules.find((rule) => rule.id === id);
      if (!current) throw new Error('Regla no encontrada');

      setCatalog({
        deviceTypes: activeTypes,
        brands: activeBrands,
        modelGroupsByBrand,
        issues: activeIssues,
        models: activeModels,
      });
      setForm(buildRepairPricingRuleFormState(current));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando regla');
    } finally {
      setLoadingPage(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [id]);

  const options = useMemo(() => buildRepairPricingRuleOptions(catalog, form), [catalog, form]);

  function patchForm(field: keyof RepairPricingRuleFormState, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleDeviceTypeChange(value: string) {
    setForm((current) => applyRepairPricingRuleDeviceType(current, value, catalog.issues));
  }

  function handleBrandChange(value: string) {
    setForm((current) => applyRepairPricingRuleBrand(current, value, catalog.brands, catalog.issues));
  }

  function handleModelGroupChange(value: string) {
    setForm((current) => applyRepairPricingRuleModelGroup(current, value));
  }

  async function save() {
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      await repairsApi.pricingRulesUpdate(id, buildRepairPricingRulePayload(form, catalog));
      navigate(backTo);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la regla');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="store-shell space-y-5">
      <AdminRepairPricingRuleHero
        title="Editar regla"
        subtitle="Ajusta el calculo automatico manteniendo alcance por tipo, marca, grupo, modelo y falla."
        backTo={backTo}
      />

      <AdminRepairPricingRuleError error={error} />

      {loadingPage ? (
        <AdminRepairPricingRuleLoading label="Cargando regla..." />
      ) : (
        <AdminRepairPricingRuleFormCard
          form={form}
          deviceTypeOptions={options.deviceTypeOptions}
          brandOptions={options.brandOptions}
          groupOptions={options.groupOptions}
          modelOptions={options.modelOptions}
          issueOptions={options.issueOptions}
          calcModeOptions={options.calcModeOptions}
          loading={loadingPage}
          saving={saving}
          canSave={canSaveRepairPricingRule(form)}
          onFieldChange={patchForm}
          onDeviceTypeChange={handleDeviceTypeChange}
          onBrandChange={handleBrandChange}
          onModelGroupChange={handleModelGroupChange}
          onModelChange={(value) => patchForm('modelId', value)}
          onIssueChange={(value) => patchForm('issueId', value)}
          onCalcModeChange={(value) => patchForm('calcMode', value as RepairRuleCalcMode)}
          onSave={() => void save()}
          backTo={backTo}
        />
      )}
    </div>
  );
}
