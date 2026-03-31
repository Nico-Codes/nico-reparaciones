import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi, type AdminProviderItem } from '@/features/admin/api';
import { catalogAdminApi, type AdminProduct } from '@/features/catalogAdmin/api';
import { repairsApi } from '@/features/repairs/api';
import type { RepairItem } from '@/features/repairs/types';
import {
  applyProductSelection,
  applyRepairSelection,
  buildProductOptions,
  buildProviderOptions,
  buildRepairOptions,
  buildSelectedRepairLabel,
  buildWarrantyBackTo,
  buildWarrantyCreatePayload,
  computeEstimatedLoss,
  createDefaultWarrantyForm,
  type WarrantyCreateForm,
  validateWarrantyCreateForm,
} from './admin-warranty-create.helpers';
import {
  WarrantyCreateCostsSection,
  WarrantyCreateDetailsSection,
  WarrantyCreateFeedback,
  WarrantyCreateHero,
  WarrantyCreateNotesSection,
} from './admin-warranty-create.sections';

export function AdminWarrantyCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const repairIdParam = searchParams.get('repairId') ?? '';
  const [repair, setRepair] = useState<RepairItem | null>(null);
  const [repairs, setRepairs] = useState<RepairItem[]>([]);
  const [selectedRepairId, setSelectedRepairId] = useState(repairIdParam);
  const [loadingRepair, setLoadingRepair] = useState(false);
  const [loadingRepairs, setLoadingRepairs] = useState(false);
  const [providers, setProviders] = useState<AdminProviderItem[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<WarrantyCreateForm>(() => createDefaultWarrantyForm());

  useEffect(() => {
    let mounted = true;
    async function loadRepairFromParam() {
      if (!repairIdParam) return;
      setLoadingRepair(true);
      try {
        const response = await repairsApi.adminDetail(repairIdParam);
        if (!mounted) return;
        setRepair(response.item);
        setSelectedRepairId(response.item.id);
      } finally {
        if (mounted) setLoadingRepair(false);
      }
    }
    void loadRepairFromParam();
    return () => {
      mounted = false;
    };
  }, [repairIdParam]);

  useEffect(() => {
    let mounted = true;
    async function loadRepairs() {
      setLoadingRepairs(true);
      try {
        const response = await repairsApi.adminList();
        if (!mounted) return;
        const sorted = [...response.items].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setRepairs(sorted);
        setSelectedRepairId((current) => current || repairIdParam || sorted[0]?.id || '');
      } catch {
        if (!mounted) return;
        setRepairs([]);
      } finally {
        if (mounted) setLoadingRepairs(false);
      }
    }
    void loadRepairs();
    return () => {
      mounted = false;
    };
  }, [repairIdParam]);

  useEffect(() => {
    let mounted = true;
    async function loadProviders() {
      setLoadingProviders(true);
      try {
        const response = await adminApi.providers({ active: '1' });
        if (!mounted) return;
        setProviders(response.items);
        setForm((current) =>
          !current.providerId && response.items[0]
            ? { ...current, providerId: response.items[0].id }
            : current,
        );
      } catch {
        if (!mounted) return;
        setProviders([]);
      } finally {
        if (mounted) setLoadingProviders(false);
      }
    }
    void loadProviders();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadProducts() {
      setLoadingProducts(true);
      try {
        const response = await catalogAdminApi.products({ active: '1' });
        if (!mounted) return;
        setProducts(response.items);
      } catch {
        if (!mounted) return;
        setProducts([]);
      } finally {
        if (mounted) setLoadingProducts(false);
      }
    }
    void loadProducts();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedRepair = useMemo(() => {
    if (!selectedRepairId) return null;
    if (repair?.id === selectedRepairId) return repair;
    return repairs.find((row) => row.id === selectedRepairId) ?? null;
  }, [repair, repairs, selectedRepairId]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === form.productId) ?? null,
    [products, form.productId],
  );
  const estimatedLoss = useMemo(() => computeEstimatedLoss(form), [form]);
  const backTo = useMemo(() => buildWarrantyBackTo(repairIdParam), [repairIdParam]);
  const selectedRepairLabel = useMemo(() => buildSelectedRepairLabel(selectedRepair), [selectedRepair]);
  const repairOptions = useMemo(() => buildRepairOptions(repairs, repair), [repair, repairs]);
  const productOptions = useMemo(() => buildProductOptions(products), [products]);
  const providerOptions = useMemo(() => buildProviderOptions(providers), [providers]);

  function patchForm<K extends keyof WarrantyCreateForm>(field: K, value: WarrantyCreateForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleRepairChange(nextRepairId: string) {
    setSelectedRepairId(nextRepairId);
    const nextRepair =
      nextRepairId === repair?.id ? repair : repairs.find((row) => row.id === nextRepairId) ?? null;
    if (!nextRepair) {
      return;
    }
    setForm((current) => applyRepairSelection(current, nextRepair));
  }

  function handleProductChange(nextProductId: string) {
    const nextProduct = products.find((product) => product.id === nextProductId) ?? null;
    setForm((current) => applyProductSelection(current, nextProductId, nextProduct));
  }

  async function saveIncident() {
    setError('');
    const validationError = validateWarrantyCreateForm(form, selectedRepairId);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      await adminApi.createWarranty(
        buildWarrantyCreatePayload(form, selectedRepairId, selectedRepair, selectedProduct),
      );
      navigate('/admin/garantias');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el incidente');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="store-shell space-y-5">
      <WarrantyCreateHero backTo={backTo} />
      <WarrantyCreateFeedback error={error} />
      <WarrantyCreateDetailsSection
        form={form}
        loadingRepair={loadingRepair}
        loadingRepairs={loadingRepairs}
        loadingProviders={loadingProviders}
        loadingProducts={loadingProducts}
        repairOptions={repairOptions}
        productOptions={productOptions}
        providerOptions={providerOptions}
        selectedRepairId={selectedRepairId}
        selectedRepairLabel={selectedRepairLabel}
        onChange={patchForm}
        onRepairChange={handleRepairChange}
        onProductChange={handleProductChange}
      />
      <WarrantyCreateCostsSection
        form={form}
        estimatedLoss={estimatedLoss}
        selectedProduct={selectedProduct}
        onChange={patchForm}
      />
      <WarrantyCreateNotesSection
        backTo={backTo}
        form={form}
        saving={saving}
        onChange={patchForm}
        onSave={() => void saveIncident()}
      />
    </div>
  );
}
