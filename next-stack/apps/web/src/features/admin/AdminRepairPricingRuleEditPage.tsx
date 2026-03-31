import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '@/features/admin/api';
import { deviceCatalogApi } from '@/features/deviceCatalog/api';
import { repairsApi } from '@/features/repairs/api';
import {
  AdminRepairPricingRuleError,
  AdminRepairPricingRuleFormCard,
  AdminRepairPricingRuleHero,
  AdminRepairPricingRuleLoading,
} from './admin-repair-pricing-rule-form.sections';
import {
  applyRepairPricingRuleBrand,
  applyRepairPricingRuleDeviceType,
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
  models: [],
  issues: [],
};

export function AdminRepairPricingRuleEditPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
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

      const rules = (rulesRes.items as RepairRuleApiItem[]) ?? [];
      const current = rules.find((rule) => rule.id === id);
      if (!current) throw new Error('Regla no encontrada');

      setCatalog({
        deviceTypes: deviceTypesRes.items.filter((item) => item.active),
        brands: brandsRes.items.filter((item) => item.active),
        issues: issuesRes.items.filter((item) => item.active),
        models: modelsRes.items.filter((item) => item.active),
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

  async function save() {
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      await repairsApi.pricingRulesUpdate(id, buildRepairPricingRulePayload(form, catalog));
      navigate('/admin/precios');
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
        subtitle="Ajustá el cálculo automático manteniendo alcance por tipo, marca, modelo/grupo y falla."
      />

      <AdminRepairPricingRuleError error={error} />

      {loadingPage ? (
        <AdminRepairPricingRuleLoading label="Cargando regla..." />
      ) : (
        <AdminRepairPricingRuleFormCard
          form={form}
          deviceTypeOptions={options.deviceTypeOptions}
          brandOptions={options.brandOptions}
          modelOptions={options.modelOptions}
          issueOptions={options.issueOptions}
          calcModeOptions={options.calcModeOptions}
          loading={loadingPage}
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
      )}
    </div>
  );
}
