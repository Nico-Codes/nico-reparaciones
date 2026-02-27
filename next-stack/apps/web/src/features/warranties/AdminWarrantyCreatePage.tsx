import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { repairsApi } from '@/features/repairs/api';
import type { RepairItem } from '@/features/repairs/types';
import { adminApi, type AdminProviderItem } from '@/features/admin/api';
import { catalogAdminApi, type AdminProduct } from '@/features/catalogAdmin/api';

function repairCode(id: string) {
  return `R-${id.slice(0, 13)}`;
}

export function AdminWarrantyCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const repairId = searchParams.get('repairId') ?? '';
  const [repair, setRepair] = useState<RepairItem | null>(null);
  const [loadingRepair, setLoadingRepair] = useState(false);
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
    let mounted = true;
    async function loadRepair() {
      if (!repairId) return;
      setLoadingRepair(true);
      try {
        const res = await repairsApi.adminDetail(repairId);
        if (!mounted) return;
        setRepair(res.item);
        setTitle((prev) => prev || 'Incidente de garantía');
        if (!incidentAt) {
          const now = new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const dd = String(now.getDate()).padStart(2, '0');
          const hh = String(now.getHours()).padStart(2, '0');
          const mi = String(now.getMinutes()).padStart(2, '0');
          setIncidentAt(`${yyyy}-${mm}-${dd}T${hh}:${mi}`);
        }
        if (!unitCost && res.item.finalPrice != null) {
          setUnitCost(String(res.item.finalPrice));
        }
      } finally {
        if (mounted) setLoadingRepair(false);
      }
    }
    void loadRepair();
    return () => {
      mounted = false;
    };
  }, [repairId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const selectedProduct = useMemo(() => products.find((p) => p.id === productId) ?? null, [products, productId]);

  const estimatedLoss = useMemo(() => {
    const q = Number(qty || 0);
    const cost = Number(unitCost || 0);
    const extra = Number(extraCost || 0);
    const recovered = Number(recoveredAmount || 0);
    return Math.max(0, q * cost + extra - recovered);
  }, [qty, unitCost, extraCost, recoveredAmount]);

  const repairOptionLabel = repair
    ? `${repairCode(repair.id)} - ${repair.customerName}`
    : repairId
      ? `${repairCode(repairId)}`
      : 'Sin asociar';

  async function saveIncident() {
    setError('');
    setSaving(true);
    try {
      await adminApi.createWarranty({
        sourceType: source === 'PRODUCT' ? 'product' : 'repair',
        title: title.trim(),
        reason: reason.trim() || null,
        repairId: source === 'REPAIR' ? repairId || null : null,
        productId: source === 'PRODUCT' ? productId || null : null,
        orderId: orderRef.trim() || null,
        supplierId: providerId || null,
        quantity: Math.max(1, Number(qty || 1)),
        unitCost: Math.max(0, Number(unitCost || 0)),
        costOrigin: source === 'REPAIR' ? 'repair' : 'product',
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
          <Link to={repairId ? `/admin/repairs/${encodeURIComponent(repairId)}` : '/admin/repairs'} className="btn-outline !h-10 !rounded-xl px-5 text-sm font-bold">
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
              <select value={source} onChange={(e) => setSource(e.target.value as 'REPAIR' | 'PRODUCT')} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
                <option value="REPAIR">Reparación</option>
                <option value="PRODUCT">Producto</option>
              </select>
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
              <select className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm" value={repairId || ''} disabled={source !== 'REPAIR'}>
                <option value={repairId || ''}>{loadingRepair ? 'Cargando...' : repairOptionLabel}</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Producto asociado</span>
              <select
                className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm"
                value={productId}
                disabled={source !== 'PRODUCT'}
                onChange={(e) => {
                  const nextProductId = e.target.value;
                  setProductId(nextProductId);
                  const selected = products.find((p) => p.id === nextProductId) ?? null;
                  if (selected?.costPrice != null) setUnitCost(String(selected.costPrice));
                  if (selected && !title.trim()) setTitle(`Garantía de producto: ${selected.name}`);
                }}
              >
                <option value="">Sin asociar</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}{product.sku ? ` (${product.sku})` : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-zinc-500">
                {loadingProducts ? 'Cargando productos...' : 'Selecciona un producto cuando el origen sea Producto.'}
              </p>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-zinc-700">Proveedor</span>
                <select value={providerId} onChange={(e) => setProviderId(e.target.value)} className="h-11 w-full rounded-2xl border border-zinc-200 px-3 text-sm">
                  <option value="">Sin definir</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>{provider.name}</option>
                  ))}
                </select>
              </label>
              <p className="mt-1 text-xs text-zinc-500">{loadingProviders ? 'Cargando proveedores...' : 'Puedes dejarlo manual o autocompletar desde el proveedor.'}</p>
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
              <p className="mt-1 text-xs text-zinc-500">Se autocompleta desde la reparación/producto cuando existe contexto.</p>
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
            <Link to={repairId ? `/admin/repairs/${encodeURIComponent(repairId)}` : '/admin/repairs'} className="btn-outline !h-11 !rounded-2xl px-6 text-sm font-bold">
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
