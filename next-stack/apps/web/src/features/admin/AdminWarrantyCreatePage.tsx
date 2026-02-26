import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function parseNum(value: string, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function AdminWarrantyCreatePage() {
  const navigate = useNavigate();
  const qs = useQuery();

  const repairId = qs.get('repairId') ?? '';
  const customerName = qs.get('customerName') ?? '';
  const deviceLabel = qs.get('deviceLabel') ?? '';
  const repairCost = qs.get('repairCost') ?? '';

  const [origin, setOrigin] = useState('Reparacion');
  const [title, setTitle] = useState('Cambio de modulo en garantia');
  const [reason, setReason] = useState('');
  const [repairAssoc, setRepairAssoc] = useState(repairId ? `${repairId} - ${customerName}` : '');
  const [productAssoc, setProductAssoc] = useState('Sin asociar');
  const [provider, setProvider] = useState('Puntocell');
  const [orderId, setOrderId] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [qty, setQty] = useState('1');
  const [unitCost, setUnitCost] = useState(repairCost || '16000');
  const [extraCost, setExtraCost] = useState('0');
  const [recoveredAmount, setRecoveredAmount] = useState('0');
  const [notes, setNotes] = useState('');

  const estimatedLoss = Math.max(
    0,
    parseNum(qty, 1) * parseNum(unitCost) + parseNum(extraCost) - parseNum(recoveredAmount),
  );

  return (
    <div className="store-shell space-y-5">
      <section className="store-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">Nuevo incidente de garantia</h1>
            <p className="mt-1 text-sm text-zinc-600">Registra perdida real por garantia para mantener trazabilidad.</p>
          </div>
          <button type="button" onClick={() => navigate(-1)} className="btn-outline !h-10 !rounded-xl px-4 text-sm font-bold">
            Volver
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head flex items-center justify-between gap-2">
          <div className="text-xl font-black tracking-tight text-zinc-900">Datos del incidente</div>
          <span className="badge-zinc">Garantía</span>
        </div>
        <div className="card-body space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Origen *</span>
              <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm">
                <option>Reparacion</option>
                <option>Producto</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Titulo *</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Cambio de modulo en garantia" className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Motivo (opcional)</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: falla de fabrica / devolucion por defecto" className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Reparacion asociada</span>
              <select value={repairAssoc} onChange={(e) => setRepairAssoc(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm">
                <option value={repairAssoc || ''}>{repairAssoc || 'Sin asociar'}</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Producto asociado</span>
              <select value={productAssoc} onChange={(e) => setProductAssoc(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm">
                <option>Sin asociar</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-zinc-700">Proveedor</span>
                <select value={provider} onChange={(e) => setProvider(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm">
                  <option>Puntocell</option>
                  <option>Evophone</option>
                </select>
              </label>
              <p className="mt-1 text-xs text-zinc-500">Puedes dejarlo manual o autocompletar desde el producto.</p>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Pedido asociado (opcional)</span>
              <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="ID de pedido" className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
            </label>
          </div>

          <label className="block md:max-w-[420px]">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Fecha del incidente</span>
            <input value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} placeholder="dd/mm/aaaa --:--" className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
          </label>
        </div>
      </section>

      <section className="card">
        <div className="card-head flex items-center justify-between gap-2">
          <div className="text-xl font-black tracking-tight text-zinc-900">Costos y recupero</div>
          <span className="badge-zinc">Finanzas</span>
        </div>
        <div className="card-body space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Cantidad *</span>
              <input value={qty} onChange={(e) => setQty(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
            </label>
            <div>
              <label className="block">
                <span className="mb-1 block text-sm font-bold text-zinc-700">Costo unitario *</span>
                <input value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
              </label>
              <p className="mt-1 text-xs text-zinc-500">Se autocompleta desde costo de reparación o costo del producto.</p>
              <span className="mt-2 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">Origen costo: Reparación</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Costo extra</span>
              <input value={extraCost} onChange={(e) => setExtraCost(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-zinc-700">Monto recuperado</span>
              <input value={recoveredAmount} onChange={(e) => setRecoveredAmount(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
            </label>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <div className="text-xs font-black uppercase tracking-wide text-rose-700">Pérdida estimada</div>
            <div className="mt-1 text-4xl font-black tracking-tight text-rose-700">$ {estimatedLoss.toLocaleString('es-AR')}</div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-body">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-zinc-700">Notas internas (opcional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalle del caso, proveedor, decision tomada, etc." rows={4} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" />
          </label>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => navigate(-1)} className="btn-outline !h-11 !rounded-2xl px-5 text-sm font-black">Cancelar</button>
        <button type="button" className="btn-primary !h-11 !rounded-2xl px-5 text-sm font-black">Guardar incidente</button>
      </div>
    </div>
  );
}

