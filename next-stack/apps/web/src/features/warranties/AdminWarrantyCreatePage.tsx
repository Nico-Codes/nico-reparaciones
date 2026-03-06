import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CustomSelect } from '@/components/ui/custom-select';
import { repairsApi } from '@/features/repairs/api';
import type { RepairItem } from '@/features/repairs/types';
import { adminApi, type AdminProviderItem } from '@/features/admin/api';
import { catalogAdminApi, type AdminProduct } from '@/features/catalogAdmin/api';

function repairCode(id: string) {
  return `R-${id.slice(0, 13)}`;
}

function toDateTimeLocal(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

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

  const [source, setSource] = useState<'REPAIR' | 'PRODUCT'>('REPAIR');
  const [title, setTitle] = useState('Cambio de módulo en garantía');
  const [reason, setReason] = useState('');
  const [providerId, setProviderId] = useState('');
  const [productId, setProductId] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [incidentAt, setIncidentAt] = useState('');
  const [qty, setQty] = useState('1');
  const [unitCost, setUnitCost] = useState('16000');
  const [extraCost, setExtraCost] = useState('0');
  const [recoveredAmount, setRecoveredAmount] = useState('0');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (incidentAt) return;
    setIncidentAt(toDateTimeLocal(new Date()));
  }, [incidentAt]);

  useEffect(() => {
    let mounted = true;
    async function loadRepairFromParam() {
      if (!repairIdParam) return;
      setLoadingRepair(true);
      try {
        const res = await repairsApi.adminDetail(repairIdParam);
        if (!mounted) return;
        setRepair(res.item);
        setSelectedRepairId(res.item.id);
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
        const res = await repairsApi.adminList();
        if (!mounted) return;
        const sorted = [...res.items].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setRepairs(sorted);
        setSelectedRepairId((prev) => prev || repairIdParam || sorted[0]?.id || '');
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
        const res = await adminApi.providers({ active: '1' });
        if (!mounted) return;
        setProviders(res.items);
        if (!providerId && res.items[0]) setProviderId(res.items[0].id);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let mounted = true;
    async function loadProducts() {
      setLoadingProducts(true);
      try {
        const res = await catalogAdminApi.products({ active: '1' });
        if (!mounted) return;
        setProducts(res.items);
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
    return repairs.find((r) => r.id === selectedRepairId) ?? null;
  }, [repair, repairs, selectedRepairId]);

  const selectedProduct = useMemo(() => products.find((p) => p.id === productId) ?? null, [products, productId]);

  const estimatedLoss = useMemo(() => {
    const q = Number(qty || 0);
    const cost = Number(unitCost || 0);
    const extra = Number(extraCost || 0);
    const recovered = Number(recoveredAmount || 0);
    return Math.max(0, q * cost + extra - recovered);
  }, [qty, unitCost, extraCost, recoveredAmount]);

  const repairOptionLabel = selectedRepair
    ? `${repairCode(selectedRepair.id)} - ${selectedRepair.customerName}`
    : 'Sin asociar';

  const backTo = repairIdParam ? `/admin/repairs/${encodeURIComponent(repairIdParam)}` : '/admin/garantias';

  const sourceOptions = useMemo(
    () => [
      { value: 'REPAIR', label: 'Reparación' },
      { value: 'PRODUCT', label: 'Producto' },
    ],
    [],
  );

  const repairOptions = useMemo(() => {
    const base = [{ value: '', label: 'Sin asociar' }];
    const extra = repair && !repairs.some((row) => row.id === repair.id) ? [repair] : [];
    return base.concat(
      [...extra, ...repairs].map((repairRow) => ({
        value: repairRow.id,
        label: `${repairCode(repairRow.id)} - ${repairRow.customerName}`,
      })),
    );
  }, [repair, repairs]);

  const productOptions = useMemo(
    () => [
      { value: '', label: 'Sin asociar' },
      ...products.map((product) => ({
        value: product.id,
        label: `${product.name}${product.sku ? ` (${product.sku})` : ''}`,
      })),
    ],
    [products],
  );

  const providerOptions = useMemo(
    () => [
      { value: '', label: 'Sin definir' },
      ...providers.map((provider) => ({ value: provider.id, label: provider.name })),
    ],
    [providers],
  );

  async function saveIncident() {
    setError('');
    const titleValue = title.trim();
    if (!titleValue) {
      setError('El título es obligatorio');
      return;
    }
    if (source === 'REPAIR' && !selectedRepairId) {
      setError('Seleccioná la reparación asociada');
      return;
    }
    if (source === 'PRODUCT' && !productId) {
      setError('Seleccioná el producto asociado');
      return;
    }

    const resolvedCostOrigin =
      source === 'REPAIR'
        ? selectedRepair?.finalPrice != null || selectedRepair?.quotedPrice != null
          ? 'repair'
          : 'manual'
        : selectedProduct?.costPrice != null
          ? 'product'
          : 'manual';

    setSaving(true);
    try {
      await adminApi.createWarranty({
        sourceType: source === 'PRODUCT' ? 'product' : 'repair',
        title: titleValue,
        reason: reason.trim() || null,
        repairId: source === 'REPAIR' ? selectedRepairId || null : null,
        productId: source === 'PRODUCT' ? productId || null : null,
        orderId: orderRef.trim() || null,
        supplierId: providerId || null,
        quantity: Math.max(1, Number(qty || 1)),
        unitCost: Math.max(0, Number(unitCost || 0)),
        costOrigin: resolvedCostOrigin,
        extraCost: Math.max(0, Number(extraCost || 0)),
        recoveredAmount: Math.max(0, Number(recoveredAmount || 0)),
        happenedAt: incidentAt || null,
        notes: notes.trim() || null,
      });
      navigate('/admin/garantias');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el incidente');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Nuevo incidente de garantía</h1>
            <p className="mt-1 text-sm text-zinc-600">Registra pérdida real por garantía para mantener trazabilidad.</p>
          </div>
          <Link to={backTo} className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
            Volver
          </Link>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      ) : null}

      <section className="card">
        <div className="card-head flex items-center justify-between gap-2">
          <div className="text-xl font-black tracking-tight text-zinc-900">Datos del incidente</div>
          <span className="badge-zinc">Garantía</span>
        </div>
        <div className="card-body space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Origen *</span>
              <CustomSelect
                value={source}
                onChange={(value) => setSource(value as 'REPAIR' | 'PRODUCT')}
                options={sourceOptions}
                triggerClassName="min-h-11 rounded-2xl font-bold"
                ariaLabel="Seleccionar origen"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Título *</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Cambio de módulo en garantía" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Motivo (opcional)</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: falla de fábrica / devolución por defecto" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Reparación asociada</span>
              <CustomSelect
                value={selectedRepairId}
                disabled={source !== 'REPAIR'}
                onChange={(nextRepairId) => {
                  setSelectedRepairId(nextRepairId);
                  const nextRepair =
                    nextRepairId === repair?.id
                      ? repair
                      : repairs.find((row) => row.id === nextRepairId) ?? null;
                  if (!nextRepair) return;
                  const resolvedCost = nextRepair.finalPrice ?? nextRepair.quotedPrice;
                  if (resolvedCost != null) setUnitCost(String(resolvedCost));
                  if (!title.trim()) setTitle(`Garantía reparación ${repairCode(nextRepair.id)}`);
                }}
                options={repairOptions}
                triggerClassName="min-h-11 rounded-2xl font-bold"
                ariaLabel="Seleccionar reparación asociada"
              />
              <p className="mt-1 text-xs text-zinc-500">
                {loadingRepairs || loadingRepair
                  ? 'Cargando reparaciones...'
                  : source === 'REPAIR'
                    ? `Seleccionada: ${repairOptionLabel}`
                    : 'Solo requerido cuando el origen es Reparación.'}
              </p>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Producto asociado</span>
              <CustomSelect
                value={productId}
                disabled={source !== 'PRODUCT'}
                onChange={(nextProductId) => {
                  setProductId(nextProductId);
                  const selected = products.find((product) => product.id === nextProductId) ?? null;
                  if (selected?.costPrice != null) setUnitCost(String(selected.costPrice));
                  if (selected?.supplierId) setProviderId(selected.supplierId);
                  if (selected && !title.trim()) setTitle(`Garantía de producto: ${selected.name}`);
                }}
                options={productOptions}
                triggerClassName="min-h-11 rounded-2xl font-bold"
                ariaLabel="Seleccionar producto asociado"
              />
              <p className="mt-1 text-xs text-zinc-500">
                {loadingProducts ? 'Cargando productos...' : 'Seleccioná un producto cuando el origen sea Producto.'}
              </p>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-zinc-700">Proveedor</span>
                <CustomSelect
                  value={providerId}
                  onChange={setProviderId}
                  options={providerOptions}
                  triggerClassName="min-h-11 rounded-2xl font-bold"
                  ariaLabel="Seleccionar proveedor"
                />
              </label>
              <p className="mt-1 text-xs text-zinc-500">{loadingProviders ? 'Cargando proveedores...' : 'Podés dejarlo manual o autocompletar desde el proveedor.'}</p>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Pedido asociado (opcional)</span>
              <input value={orderRef} onChange={(e) => setOrderRef(e.target.value)} placeholder="ID de pedido" className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </label>
          </div>

          <label className="block max-w-md">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Fecha del incidente</span>
            <input type="datetime-local" value={incidentAt} onChange={(e) => setIncidentAt(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
          </label>
        </div>
      </section>

      <section className="card">
        <div className="card-head flex items-center justify-between gap-2">
          <div className="text-xl font-black tracking-tight text-zinc-900">Costos y recupero</div>
          <span className="badge-zinc">Finanzas</span>
        </div>
        <div className="card-body space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Cantidad *</span>
              <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </label>
            <div>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-zinc-700">Costo unitario *</span>
                <input type="number" min="0" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
              </label>
              <p className="mt-1 text-xs text-zinc-500">Se autocompleta desde la reparación o el producto cuando existe contexto.</p>
              <div className="mt-2">
                <span className="inline-flex h-7 items-center rounded-full border border-sky-300 bg-sky-50 px-3 text-xs font-bold text-sky-700">
                  Origen costo: {source === 'REPAIR' ? 'Reparación' : selectedProduct ? 'Producto' : 'Manual'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Costo extra</span>
              <input type="number" min="0" value={extraCost} onChange={(e) => setExtraCost(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Monto recuperado</span>
              <input type="number" min="0" value={recoveredAmount} onChange={(e) => setRecoveredAmount(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" />
            </label>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <div className="text-xs font-black uppercase tracking-wide text-rose-700">PÉRDIDA ESTIMADA</div>
            <div className="mt-1 text-4xl font-black tracking-tight text-rose-700">$ {estimatedLoss.toLocaleString('es-AR')}</div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-body space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Notas internas (opcional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Detalle del caso, proveedor, decisión tomada, etc." className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm" />
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link to={backTo} className="btn-outline !h-11 !rounded-2xl px-6 text-sm font-bold">
              Cancelar
            </Link>
            <button type="button" onClick={() => void saveIncident()} disabled={saving} className="btn-primary !h-11 !rounded-2xl px-6 text-sm font-bold disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar incidente'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
