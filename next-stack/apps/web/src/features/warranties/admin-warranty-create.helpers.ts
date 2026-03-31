import type { AdminProviderItem } from '@/features/admin/api';
import type { AdminProduct } from '@/features/catalogAdmin/api';
import type { RepairItem } from '@/features/repairs/types';

export type WarrantySource = 'REPAIR' | 'PRODUCT';

export type WarrantyCreateForm = {
  source: WarrantySource;
  title: string;
  reason: string;
  providerId: string;
  productId: string;
  orderRef: string;
  incidentAt: string;
  qty: string;
  unitCost: string;
  extraCost: string;
  recoveredAmount: string;
  notes: string;
};

export function repairCode(id: string) {
  return `R-${id.slice(0, 13)}`;
}

export function toDateTimeLocal(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function createDefaultWarrantyForm(): WarrantyCreateForm {
  return {
    source: 'REPAIR',
    title: 'Cambio de modulo en garantia',
    reason: '',
    providerId: '',
    productId: '',
    orderRef: '',
    incidentAt: toDateTimeLocal(new Date()),
    qty: '1',
    unitCost: '16000',
    extraCost: '0',
    recoveredAmount: '0',
    notes: '',
  };
}

export function formatMoney(value: number) {
  return `$ ${value.toLocaleString('es-AR')}`;
}

export function buildWarrantyBackTo(repairIdParam: string) {
  return repairIdParam ? `/admin/repairs/${encodeURIComponent(repairIdParam)}` : '/admin/garantias';
}

export function buildRepairOptions(repairs: RepairItem[], repair: RepairItem | null) {
  const base = [{ value: '', label: 'Sin asociar' }];
  const extra = repair && !repairs.some((row) => row.id === repair.id) ? [repair] : [];
  return base.concat(
    [...extra, ...repairs].map((repairRow) => ({
      value: repairRow.id,
      label: `${repairCode(repairRow.id)} - ${repairRow.customerName}`,
    })),
  );
}

export function buildSelectedRepairLabel(selectedRepair: RepairItem | null) {
  return selectedRepair ? `${repairCode(selectedRepair.id)} - ${selectedRepair.customerName}` : 'Sin asociar';
}

export function buildProductOptions(products: AdminProduct[]) {
  return [
    { value: '', label: 'Sin asociar' },
    ...products.map((product) => ({
      value: product.id,
      label: `${product.name}${product.sku ? ` (${product.sku})` : ''}`,
    })),
  ];
}

export function buildProviderOptions(providers: AdminProviderItem[]) {
  return [
    { value: '', label: 'Sin definir' },
    ...providers.map((provider) => ({ value: provider.id, label: provider.name })),
  ];
}

export function computeEstimatedLoss(form: Pick<WarrantyCreateForm, 'qty' | 'unitCost' | 'extraCost' | 'recoveredAmount'>) {
  const quantity = Number(form.qty || 0);
  const unitCost = Number(form.unitCost || 0);
  const extraCost = Number(form.extraCost || 0);
  const recoveredAmount = Number(form.recoveredAmount || 0);
  return Math.max(0, quantity * unitCost + extraCost - recoveredAmount);
}

export function resolveWarrantyCostOrigin(
  source: WarrantySource,
  selectedRepair: RepairItem | null,
  selectedProduct: AdminProduct | null,
): 'repair' | 'product' | 'manual' {
  if (source === 'REPAIR') {
    return selectedRepair?.finalPrice != null || selectedRepair?.quotedPrice != null ? 'repair' : 'manual';
  }
  return selectedProduct?.costPrice != null ? 'product' : 'manual';
}

export function validateWarrantyCreateForm(form: WarrantyCreateForm, selectedRepairId: string) {
  if (!form.title.trim()) {
    return 'El titulo es obligatorio';
  }
  if (form.source === 'REPAIR' && !selectedRepairId) {
    return 'Selecciona la reparacion asociada';
  }
  if (form.source === 'PRODUCT' && !form.productId) {
    return 'Selecciona el producto asociado';
  }
  return '';
}

export function applyRepairSelection(
  current: WarrantyCreateForm,
  repair: RepairItem | null,
): WarrantyCreateForm {
  if (!repair) {
    return current;
  }

  const resolvedCost = repair.finalPrice ?? repair.quotedPrice;
  return {
    ...current,
    unitCost: resolvedCost != null ? String(resolvedCost) : current.unitCost,
    title: current.title.trim() ? current.title : `Garantia reparacion ${repairCode(repair.id)}`,
  };
}

export function applyProductSelection(
  current: WarrantyCreateForm,
  productId: string,
  product: AdminProduct | null,
): WarrantyCreateForm {
  if (!product) {
    return { ...current, productId };
  }

  return {
    ...current,
    productId,
    unitCost: product.costPrice != null ? String(product.costPrice) : current.unitCost,
    providerId: product.supplierId || current.providerId,
    title: current.title.trim() ? current.title : `Garantia de producto: ${product.name}`,
  };
}

export function buildWarrantyCreatePayload(
  form: WarrantyCreateForm,
  selectedRepairId: string,
  selectedRepair: RepairItem | null,
  selectedProduct: AdminProduct | null,
) {
  return {
    sourceType: form.source === 'PRODUCT' ? ('product' as const) : ('repair' as const),
    title: form.title.trim(),
    reason: form.reason.trim() || null,
    repairId: form.source === 'REPAIR' ? selectedRepairId || null : null,
    productId: form.source === 'PRODUCT' ? form.productId || null : null,
    orderId: form.orderRef.trim() || null,
    supplierId: form.providerId || null,
    quantity: Math.max(1, Number(form.qty || 1)),
    unitCost: Math.max(0, Number(form.unitCost || 0)),
    costOrigin: resolveWarrantyCostOrigin(form.source, selectedRepair, selectedProduct),
    extraCost: Math.max(0, Number(form.extraCost || 0)),
    recoveredAmount: Math.max(0, Number(form.recoveredAmount || 0)),
    happenedAt: form.incidentAt || null,
    notes: form.notes.trim() || null,
  };
}
