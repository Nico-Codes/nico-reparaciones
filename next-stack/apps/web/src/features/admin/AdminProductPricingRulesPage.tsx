import { useEffect, useMemo, useState } from 'react';
import { catalogAdminApi, type AdminCategory, type AdminProduct } from '@/features/catalogAdmin/api';
import { productPricingApi } from '@/features/catalogAdmin/productPricingApi';
import {
  buildCategoryOptions,
  buildProductOptions,
  createEmptyProductRuleForm,
  filterProductsByCategory,
  fromApiRule,
  productPricingSimulationText,
  toCreateRuleInput,
  toUpdateRuleInput,
  type ProductPricingSimulationResult,
  type ProductRuleRow,
} from './admin-product-pricing-rules.helpers';
import {
  AdminProductPricingHeaderActions,
  ProductPricingCreateRuleSection,
  ProductPricingPreferencesSection,
  ProductPricingRulesListSection,
  ProductPricingSimulatorSection,
} from './admin-product-pricing-rules.sections';

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
  const [simResult, setSimResult] = useState<ProductPricingSimulationResult | null>(null);

  const [form, setForm] = useState(createEmptyProductRuleForm());

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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error cargando reglas de productos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const productOptions = useMemo(
    () => filterProductsByCategory(products, form.categoryId),
    [products, form.categoryId],
  );
  const simProductOptions = useMemo(
    () => filterProductsByCategory(products, simCategoryId),
    [products, simCategoryId],
  );

  const categorySelectOptions = useMemo(
    () => buildCategoryOptions(categories, 'Todas'),
    [categories],
  );
  const simCategoryOptions = useMemo(
    () => buildCategoryOptions(categories, 'Seleccionar categoría...'),
    [categories],
  );
  const simProductSelectOptions = useMemo(
    () => buildProductOptions(simProductOptions, 'Todos'),
    [simProductOptions],
  );
  const formProductOptions = useMemo(
    () => buildProductOptions(productOptions, 'Todos'),
    [productOptions],
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
          const response = await productPricingApi.resolveRecommendedPrice({
            categoryId: simCategoryId,
            productId: simProductId || null,
            costPrice: costNumber,
          });
          setSimResult({
            recommendedPrice: response.recommendedPrice,
            marginPercent: response.marginPercent,
            ruleName: response.rule?.name ?? null,
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron guardar las preferencias');
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
      const response = await productPricingApi.createRule(toCreateRuleInput(form));
      setRules((current) => [fromApiRule(response.item), ...current]);
      setForm(createEmptyProductRuleForm());
      setSuccess('Regla creada.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la regla');
    } finally {
      setCreatingRule(false);
    }
  }

  function patchRule(id: string, patch: Partial<ProductRuleRow>) {
    setRules((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function saveRule(row: ProductRuleRow) {
    setSavingRuleId(row.id);
    setError('');
    setSuccess('');
    try {
      const response = await productPricingApi.updateRule(row.id, toUpdateRuleInput(row));
      setRules((current) => current.map((item) => (item.id === row.id ? fromApiRule(response.item) : item)));
      setSuccess('Regla guardada.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la regla');
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
      setRules((current) => current.filter((rule) => rule.id !== id));
      setSuccess('Regla eliminada.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar la regla');
    } finally {
      setDeletingRuleId(null);
    }
  }

  const simulatorMessage = productPricingSimulationText(simCategoryId, simLoading, simResult);

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Reglas de productos (costo -&gt; venta)</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Definí margen por categoría o producto. El sistema aplica la mejor coincidencia.
            </p>
          </div>
          <AdminProductPricingHeaderActions />
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</div> : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <ProductPricingPreferencesSection
          defaultMargin={defaultMargin}
          blockNegative={blockNegative}
          loading={loading}
          savingPrefs={savingPrefs}
          onDefaultMarginChange={setDefaultMargin}
          onBlockNegativeChange={setBlockNegative}
          onSave={() => {
            void savePreferences();
          }}
        />

        <ProductPricingSimulatorSection
          simCategoryId={simCategoryId}
          simProductId={simProductId}
          simCost={simCost}
          simResult={simResult}
          simLoading={simLoading}
          categoryOptions={simCategoryOptions}
          productOptions={simProductSelectOptions}
          message={simulatorMessage}
          onCategoryChange={(value) => {
            setSimCategoryId(value);
            setSimProductId('');
          }}
          onProductChange={setSimProductId}
          onCostChange={setSimCost}
        />
      </section>

      <ProductPricingCreateRuleSection
        form={form}
        loading={loading}
        creatingRule={creatingRule}
        categoryOptions={categorySelectOptions}
        productOptions={formProductOptions}
        onPatch={(patch) => setForm((current) => ({ ...current, ...patch }))}
        onCreate={() => {
          void createRule();
        }}
      />

      <ProductPricingRulesListSection
        rules={rules}
        loading={loading}
        products={products}
        categories={categories}
        categoryOptions={categorySelectOptions}
        savingRuleId={savingRuleId}
        deletingRuleId={deletingRuleId}
        onPatchRule={patchRule}
        onSaveRule={(row) => {
          void saveRule(row);
        }}
        onRemoveRule={(id) => {
          void removeRule(id);
        }}
      />
    </div>
  );
}
