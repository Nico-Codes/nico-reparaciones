import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '@/features/admin/api';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { repairsApi } from '@/features/repairs/api';
import { buildRepairCalculationSearch, readRepairCalculationScope } from './admin-repair-calculation-context';
import {
  AdminRepairPricingRuleError,
  AdminRepairPricingRuleFormCard,
  AdminRepairPricingRuleHero,
} from './admin-repair-pricing-rule-form.sections';
import {
  applyRepairPricingRuleBrand,
  applyRepairPricingRuleDeviceType,
  applyRepairPricingRuleModelGroup,
  buildRepairPricingRuleOptions,
  buildRepairPricingRulePayload,
  canSaveRepairPricingRule,
  createRepairPricingRuleFormState,
  type RepairPricingRuleCatalog,
  type RepairPricingRuleFormState,
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

function applyScopeToCreateForm(
  form: RepairPricingRuleFormState,
  scope: ReturnType<typeof readRepairCalculationScope>,
  catalog: RepairPricingRuleCatalog,
) {
  let next = { ...form };

  if (scope.deviceTypeId) {
    next = applyRepairPricingRuleDeviceType(next, scope.deviceTypeId, catalog.issues);
  }
  if (scope.deviceBrandId) {
    next = applyRepairPricingRuleBrand(next, scope.deviceBrandId, catalog.brands, catalog.issues);
  }
  if (scope.deviceModelGroupId) {
    next = applyRepairPricingRuleModelGroup(next, scope.deviceModelGroupId);
  }
  if (scope.deviceModelId) {
    const model = catalog.models.find((item) => item.id === scope.deviceModelId);
    if (model) {
      next = {
        ...next,
        brandId: model.brandId,
        deviceTypeId: catalog.brands.find((brand) => brand.id === model.brandId)?.deviceTypeId ?? next.deviceTypeId,
        modelGroupId: model.deviceModelGroupId ?? next.modelGroupId,
        modelId: model.id,
      };
    }
  }
  if (scope.deviceIssueTypeId) {
    const issue = catalog.issues.find((item) => item.id === scope.deviceIssueTypeId);
    if (issue && (!next.deviceTypeId || issue.deviceTypeId === next.deviceTypeId)) {
      next = { ...next, issueId: issue.id };
    }
  }

  return next;
}

export function AdminRepairPricingRuleCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contextScope = useMemo(() => readRepairCalculationScope(searchParams), [searchParams]);
  const backTo = useMemo(() => `/admin/precios${buildRepairCalculationSearch(contextScope)}`, [contextScope]);
  const [catalog, setCatalog] = useState<RepairPricingRuleCatalog>(EMPTY_CATALOG);
  const [form, setForm] = useState<RepairPricingRuleFormState>(() => createRepairPricingRuleFormState());
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadCatalog() {
    setLoadingCatalog(true);
    setError('');
    try {
      const [deviceTypesRes, brandsRes, issuesRes, modelsRes] = await Promise.all([
        adminApi.deviceTypes(),
        deviceCatalogApi.brands(),
        deviceCatalogApi.issues(),
        deviceCatalogApi.models(),
      ]);
      const activeTypes = deviceTypesRes.items.filter((item) => item.active);
      const activeBrands = brandsRes.items.filter((item) => item.active);
      const activeIssues = issuesRes.items.filter((item) => item.active);
      const activeModels = modelsRes.items.filter((item) => item.active);
      const modelGroupsByBrand = await loadModelGroupsByBrand(activeBrands.map((brand) => brand.id));

      const nextCatalog = {
        deviceTypes: activeTypes,
        brands: activeBrands,
        modelGroupsByBrand,
        issues: activeIssues,
        models: activeModels,
      };

      setCatalog(nextCatalog);
      setForm((current) => applyScopeToCreateForm(current, contextScope, nextCatalog));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando catalogo');
    } finally {
      setLoadingCatalog(false);
    }
  }

  useEffect(() => {
    void loadCatalog();
  }, []);

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
    setSaving(true);
    setError('');
    try {
      await repairsApi.pricingRulesCreate(buildRepairPricingRulePayload(form, catalog));
      navigate(backTo);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la regla');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="store-shell space-y-5">
      <AdminRepairPricingRuleHero
        title="Crear regla"
        subtitle="Configura calculo automatico por tipo, marca, grupo, modelo y falla con soporte de margen o fijo."
        backTo={backTo}
      />

      <AdminRepairPricingRuleError error={error} />

      <AdminRepairPricingRuleFormCard
        form={form}
        deviceTypeOptions={options.deviceTypeOptions}
        brandOptions={options.brandOptions}
        groupOptions={options.groupOptions}
        modelOptions={options.modelOptions}
        issueOptions={options.issueOptions}
        calcModeOptions={options.calcModeOptions}
        loading={loadingCatalog}
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
    </div>
  );
}
