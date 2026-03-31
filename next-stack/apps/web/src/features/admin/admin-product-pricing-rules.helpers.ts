import type { AdminCategory, AdminProduct } from '@/features/catalogAdmin/api';
import type { ProductPricingRuleItem } from '@/features/catalogAdmin/productPricingApi';

export type ProductRuleRow = {
  id: string;
  name: string;
  categoryId: string | null;
  productId: string | null;
  marginPercent: string;
  costMin: string;
  costMax: string;
  priority: string;
  active: boolean;
};

export type ProductPricingRuleForm = {
  name: string;
  categoryId: string;
  productId: string;
  marginPercent: string;
  costMin: string;
  costMax: string;
  priority: string;
  active: boolean;
};

export type ProductPricingSimulationResult = {
  recommendedPrice: number;
  marginPercent: number;
  ruleName: string | null;
};

const DEFAULT_PRODUCT_RULE_FORM: ProductPricingRuleForm = {
  name: '',
  categoryId: '',
  productId: '',
  marginPercent: '50',
  costMin: '',
  costMax: '5000',
  priority: '0',
  active: true,
};

export function createEmptyProductRuleForm(): ProductPricingRuleForm {
  return { ...DEFAULT_PRODUCT_RULE_FORM };
}

export function fromApiRule(item: ProductPricingRuleItem): ProductRuleRow {
  return {
    id: item.id,
    name: item.name,
    categoryId: item.categoryId,
    productId: item.productId,
    marginPercent: String(item.marginPercent ?? 0),
    costMin: item.costMin == null ? '' : String(item.costMin),
    costMax: item.costMax == null ? '' : String(item.costMax),
    priority: String(item.priority ?? 0),
    active: item.active,
  };
}

export function filterProductsByCategory(products: AdminProduct[], categoryId: string) {
  return categoryId ? products.filter((product) => product.categoryId === categoryId) : products;
}

export function buildCategoryOptions(categories: AdminCategory[], emptyLabel = 'Todas') {
  return [{ value: '', label: emptyLabel }, ...categories.map((category) => ({ value: category.id, label: category.name }))];
}

export function buildProductOptions(products: AdminProduct[], emptyLabel = 'Todos') {
  return [{ value: '', label: emptyLabel }, ...products.map((product) => ({ value: product.id, label: product.name }))];
}

export function toCreateRuleInput(form: ProductPricingRuleForm) {
  return {
    name: form.name.trim(),
    categoryId: form.categoryId || null,
    productId: form.productId || null,
    marginPercent: Number(form.marginPercent || 0),
    costMin: form.costMin ? Number(form.costMin) : null,
    costMax: form.costMax ? Number(form.costMax) : null,
    priority: Number(form.priority || 0),
    active: form.active,
  };
}

export function toUpdateRuleInput(row: ProductRuleRow) {
  return {
    name: row.name.trim(),
    categoryId: row.categoryId || null,
    productId: row.productId || null,
    marginPercent: Number(row.marginPercent || 0),
    costMin: row.costMin ? Number(row.costMin) : null,
    costMax: row.costMax ? Number(row.costMax) : null,
    priority: Number(row.priority || 0),
    active: row.active,
  };
}

export function productPricingSimulationText(
  categoryId: string,
  loading: boolean,
  result: ProductPricingSimulationResult | null,
) {
  if (!categoryId) return 'Seleccioná una categoría para simular.';
  if (loading) return 'Simulando...';
  if (!result) return 'No se pudo calcular en este momento.';
  const prefix = result.ruleName ? `Regla: ${result.ruleName} - ` : '';
  return `${prefix}Margen: +${result.marginPercent}% - Precio recomendado: $ ${result.recommendedPrice.toLocaleString('es-AR')}`;
}

export function categoryNameById(categories: AdminCategory[], id: string | null) {
  return categories.find((category) => category.id === id)?.name ?? 'Todas';
}

export function productNameById(products: AdminProduct[], id: string | null) {
  return products.find((product) => product.id === id)?.name ?? 'Todos';
}
