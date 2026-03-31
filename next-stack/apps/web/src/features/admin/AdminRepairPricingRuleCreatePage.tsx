import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/features/admin/api';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { repairsApi } from '@/features/repairs/api';
import {
  AdminRepairPricingRuleError,
  AdminRepairPricingRuleFormCard,
  AdminRepairPricingRuleHero,
} from './admin-repair-pricing-rule-form.sections';
import {
  applyRepairPricingRuleBrand,
  applyRepairPricingRuleDeviceType,
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
  models: [],
  issues: [],
};

export function AdminRepairPricingRuleCreatePage() {
  const navigate = useNavigate();
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
      setCatalog({
        deviceTypes: deviceTypesRes.items.filter((item) => item.active),
        brands: brandsRes.items.filter((item) => item.active),
        issues: issuesRes.items.filter((item) => item.active),
        models: modelsRes.items.filter((item) => item.active),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando catálogo');
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

  async function save() {
    setSaving(true);
    setError('');
    try {
      await repairsApi.pricingRulesCreate(buildRepairPricingRulePayload(form, catalog));
      navigate('/admin/precios');
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
        subtitle="Configurá cálculo automático por tipo, marca, grupo/modelo y falla con soporte completo de modo margen o fijo."
      />

      <AdminRepairPricingRuleError error={error} />

      <AdminRepairPricingRuleFormCard
        form={form}
        deviceTypeOptions={options.deviceTypeOptions}
        brandOptions={options.brandOptions}
        modelOptions={options.modelOptions}
        issueOptions={options.issueOptions}
        calcModeOptions={options.calcModeOptions}
        loading={loadingCatalog}
        saving={saving}
        canSave={canSaveRepairPricingRule(form)}
        onFieldChange={patchForm}
        onDeviceTypeChange={handleDeviceTypeChange}
        onBrandChange={handleBrandChange}
        onModelChange={(value) => patchForm('modelId', value)}
        onIssueChange={(value) => patchForm('issueId', value)}
        onCalcModeChange={(value) => patchForm('calcMode', value as RepairRuleCalcMode)}
        onSave={() => void save()}
      />
    </div>
  );
}
