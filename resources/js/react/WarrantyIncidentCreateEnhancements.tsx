import { useEffect } from 'react';

type WarrantyIncidentCreateEnhancementsProps = {
  rootSelector: string;
};

export default function WarrantyIncidentCreateEnhancements({
  rootSelector,
}: WarrantyIncidentCreateEnhancementsProps) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(rootSelector);
    if (!root) return;

    const qty = document.getElementById('wi_qty') as HTMLInputElement | null;
    const unit = document.getElementById('wi_unit_cost') as HTMLInputElement | null;
    const extra = document.getElementById('wi_extra_cost') as HTMLInputElement | null;
    const recovered = document.getElementById('wi_recovered') as HTMLInputElement | null;
    const preview = document.getElementById('wi_loss_preview');
    const summary = document.getElementById('wi_loss_summary');
    const costOriginInput = document.getElementById('wi_cost_origin') as HTMLInputElement | null;
    const costOriginBadge = document.getElementById('wi_cost_origin_badge');
    const sourceType = document.getElementById('wi_source_type') as HTMLSelectElement | null;
    const repairSelect = document.getElementById('wi_repair_id') as HTMLSelectElement | null;
    const productSelect = document.getElementById('wi_product_id') as HTMLSelectElement | null;
    const supplierSelect = document.getElementById('wi_supplier_id') as HTMLSelectElement | null;

    const toInt = (el: HTMLInputElement | null): number => {
      const n = parseInt(String(el?.value ?? '').trim(), 10);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    };

    const money = (value: number): string =>
      '$ ' + new Intl.NumberFormat('es-AR').format(value);

    const currentUnit = (): number => toInt(unit);

    const setCostOrigin = (origin: string): void => {
      if (!costOriginBadge) return;
      const key = String(origin || 'manual').toLowerCase();
      if (costOriginInput) costOriginInput.value = key;

      const label = key === 'repair'
        ? 'Origen costo: Reparación'
        : (key === 'product' ? 'Origen costo: Producto' : 'Origen costo: Manual');

      costOriginBadge.textContent = label;
      costOriginBadge.className = key === 'repair'
        ? 'badge-sky'
        : (key === 'product' ? 'badge-emerald' : 'badge-zinc');
    };

    const setUnitIfResolved = (value: string | undefined): void => {
      const resolved = parseInt(String(value || '').trim(), 10);
      if (!Number.isFinite(resolved) || resolved <= 0 || !unit) return;
      unit.value = String(resolved);
    };

    const resolveAutoUnitCost = (): void => {
      const source = String(sourceType?.value || '');
      if (source === 'repair') {
        const option = repairSelect?.options?.[repairSelect.selectedIndex];
        setUnitIfResolved(option?.dataset?.unitCost);
        setCostOrigin('repair');
        return;
      }

      if (source === 'product') {
        const option = productSelect?.options?.[productSelect.selectedIndex];
        setUnitIfResolved(option?.dataset?.unitCost);
        setCostOrigin('product');
        return;
      }

      if (currentUnit() <= 0) {
        const productOption = productSelect?.options?.[productSelect.selectedIndex];
        const repairOption = repairSelect?.options?.[repairSelect.selectedIndex];
        setUnitIfResolved(productOption?.dataset?.unitCost || repairOption?.dataset?.unitCost);
      }
      setCostOrigin('manual');
    };

    const render = (): void => {
      if (!preview) return;
      const total = (toInt(qty) * toInt(unit)) + toInt(extra) - toInt(recovered);
      preview.textContent = money(total);
      preview.classList.toggle('text-emerald-700', total <= 0);
      preview.classList.toggle('text-rose-700', total > 0);
      if (summary) {
        summary.textContent = total > 0 ? 'Pérdida estimada' : 'Sin pérdida (recuperado)';
      }
    };

    const onSourceChange = (): void => {
      resolveAutoUnitCost();
      render();
    };

    const onRepairChange = (): void => {
      if (!repairSelect) return;
      const option = repairSelect.options[repairSelect.selectedIndex];
      const supplierId = String(option?.dataset?.supplierId || '').trim();
      if (supplierSelect && supplierId !== '' && supplierId !== '0' && supplierSelect.value === '') {
        supplierSelect.value = supplierId;
      }
      if (String(sourceType?.value || '') === 'repair') {
        setUnitIfResolved(option?.dataset?.unitCost);
        setCostOrigin('repair');
        render();
      }
    };

    const onProductChange = (): void => {
      if (!productSelect) return;
      const option = productSelect.options[productSelect.selectedIndex];
      const supplierId = String(option?.dataset?.supplierId || '').trim();
      if (supplierSelect && supplierId !== '' && supplierId !== '0' && supplierSelect.value === '') {
        supplierSelect.value = supplierId;
      }
      if (String(sourceType?.value || '') === 'product') {
        setUnitIfResolved(option?.dataset?.unitCost);
        setCostOrigin('product');
        render();
      }
    };

    const onUnitInput = (): void => {
      setCostOrigin('manual');
      render();
    };

    [qty, extra, recovered].forEach((el) => el?.addEventListener('input', render));
    unit?.addEventListener('input', onUnitInput);
    sourceType?.addEventListener('change', onSourceChange);
    repairSelect?.addEventListener('change', onRepairChange);
    productSelect?.addEventListener('change', onProductChange);

    setCostOrigin(costOriginInput?.value || 'manual');
    resolveAutoUnitCost();
    render();

    return () => {
      [qty, extra, recovered].forEach((el) => el?.removeEventListener('input', render));
      unit?.removeEventListener('input', onUnitInput);
      sourceType?.removeEventListener('change', onSourceChange);
      repairSelect?.removeEventListener('change', onRepairChange);
      productSelect?.removeEventListener('change', onProductChange);
    };
  }, [rootSelector]);

  return null;
}

