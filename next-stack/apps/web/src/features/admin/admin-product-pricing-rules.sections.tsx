import type { AdminCategory, AdminProduct } from '@/features/catalogAdmin/api';
import type {
  ProductPricingRuleForm,
  ProductPricingSimulationResult,
  ProductRuleRow,
} from './admin-product-pricing-rules.helpers';
import {
  AdminProductPricingHeaderActions,
  ProductPricingCreateRulePanel,
  ProductPricingPreferencesPanel,
  ProductPricingRulesListPanel,
  ProductPricingSimulatorPanel,
} from './admin-product-pricing-rules-panels';

export { AdminProductPricingHeaderActions };

export function ProductPricingPreferencesSection(props: {
  defaultMargin: string;
  blockNegative: boolean;
  loading: boolean;
  savingPrefs: boolean;
  onDefaultMarginChange: (value: string) => void;
  onBlockNegativeChange: (value: boolean) => void;
  onSave: () => void;
}) {
  return <ProductPricingPreferencesPanel {...props} />;
}

export function ProductPricingSimulatorSection(props: {
  simCategoryId: string;
  simProductId: string;
  simCost: string;
  simResult: ProductPricingSimulationResult | null;
  simLoading: boolean;
  categoryOptions: Array<{ value: string; label: string }>;
  productOptions: Array<{ value: string; label: string }>;
  message: string;
  onCategoryChange: (value: string) => void;
  onProductChange: (value: string) => void;
  onCostChange: (value: string) => void;
}) {
  return <ProductPricingSimulatorPanel {...props} />;
}

export function ProductPricingCreateRuleSection(props: {
  form: ProductPricingRuleForm;
  loading: boolean;
  creatingRule: boolean;
  categoryOptions: Array<{ value: string; label: string }>;
  productOptions: Array<{ value: string; label: string }>;
  onPatch: (patch: Partial<ProductPricingRuleForm>) => void;
  onCreate: () => void;
}) {
  return <ProductPricingCreateRulePanel {...props} />;
}

export function ProductPricingRulesListSection(props: {
  rules: ProductRuleRow[];
  loading: boolean;
  products: AdminProduct[];
  categories: AdminCategory[];
  categoryOptions: Array<{ value: string; label: string }>;
  savingRuleId: string | null;
  deletingRuleId: string | null;
  onPatchRule: (id: string, patch: Partial<ProductRuleRow>) => void;
  onSaveRule: (rule: ProductRuleRow) => void;
  onRemoveRule: (id: string) => void;
}) {
  return <ProductPricingRulesListPanel {...props} />;
}
