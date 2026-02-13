@extends('layouts.app')

@section('title', 'Admin - Nuevo incidente de garantia')

@section('content')
<div class="mx-auto w-full max-w-4xl space-y-5">
  <div class="flex items-start justify-between gap-3 flex-wrap">
    <div class="page-head mb-0">
      <div class="page-title">Nuevo incidente de garantia</div>
      <div class="page-subtitle">Registra perdida real por garantia para no perder trazabilidad.</div>
    </div>

    <a href="{{ route('admin.warranty_incidents.index') }}" class="btn-outline h-11 w-full sm:w-auto justify-center">Volver</a>
  </div>

  <form method="POST" action="{{ route('admin.warranty_incidents.store') }}" class="space-y-4" data-disable-on-submit>
    @csrf

    <div class="card">
      <div class="card-head">
        <div class="font-black">Datos del incidente</div>
        <span class="badge-zinc">Garantia</span>
      </div>

      <div class="card-body grid gap-4 sm:grid-cols-2">
        <div class="space-y-1">
          <label>Origen *</label>
          <select id="wi_source_type" name="source_type" class="h-11" required>
            <option value="">Seleccionar...</option>
            @foreach($sourceTypes as $key => $label)
              <option value="{{ $key }}" @selected(old('source_type', $selectedRepair ? 'repair' : ($selectedProduct ? 'product' : '')) === $key)>{{ $label }}</option>
            @endforeach
          </select>
        </div>

        <div class="space-y-1">
          <label>Titulo *</label>
          <input name="title" class="h-11" required value="{{ old('title') }}" placeholder="Ej: Cambio de modulo en garantia">
        </div>

        <div class="space-y-1 sm:col-span-2">
          <label>Motivo (opcional)</label>
          <input name="reason" class="h-11" value="{{ old('reason') }}" placeholder="Ej: falla de fabrica / devolucion por defecto">
        </div>

        <div class="space-y-1">
          <label>Reparacion asociada</label>
          <select id="wi_repair_id" name="repair_id" class="h-11">
            <option value="">Sin asociar</option>
            @foreach($recentRepairs as $repair)
              <option
                value="{{ $repair->id }}"
                data-supplier-id="{{ (int)($repair->supplier_id ?? 0) }}"
                data-unit-cost="{{ (int) round((float)($repair->parts_cost ?? 0)) }}"
                @selected((int) old('repair_id', $selectedRepair?->id) === (int) $repair->id)>
                {{ $repair->code ?: ('#'.$repair->id) }} - {{ $repair->customer_name }}
              </option>
            @endforeach
          </select>
        </div>

        <div class="space-y-1">
          <label>Producto asociado</label>
          <select id="wi_product_id" name="product_id" class="h-11">
            <option value="">Sin asociar</option>
            @foreach($recentProducts as $product)
              <option
                value="{{ $product->id }}"
                data-supplier-id="{{ (int)($product->supplier_id ?? 0) }}"
                data-unit-cost="{{ (int)($product->cost_price ?? 0) }}"
                @selected((int) old('product_id', $selectedProduct?->id) === (int) $product->id)>
                {{ $product->name }}{{ $product->sku ? ' ('.$product->sku.')' : '' }}
              </option>
            @endforeach
          </select>
        </div>

        <div class="space-y-1">
          <label>Proveedor</label>
          <select id="wi_supplier_id" name="supplier_id" class="h-11">
            <option value="">Sin asociar</option>
            @foreach($suppliers as $supplier)
              <option value="{{ $supplier->id }}" @selected((int) old('supplier_id', $selectedSupplier?->id) === (int) $supplier->id)>{{ $supplier->name }}</option>
            @endforeach
          </select>
          <div class="text-xs text-zinc-500">Puedes dejarlo manual o se autocompleta al elegir producto.</div>
        </div>

        <div class="space-y-1">
          <label>Pedido asociado (opcional)</label>
          <input name="order_id" class="h-11" inputmode="numeric" value="{{ old('order_id', $selectedOrder?->id) }}" placeholder="ID de pedido">
        </div>

        <div class="space-y-1">
          <label>Fecha del incidente</label>
          <input type="datetime-local" name="happened_at" class="h-11" value="{{ old('happened_at') }}">
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="font-black">Costos y recupero</div>
        <span class="badge-zinc">Finanzas</span>
      </div>

      <div class="card-body grid gap-4 sm:grid-cols-2">
        <div class="space-y-1">
          <label>Cantidad *</label>
          <input id="wi_qty" name="quantity" class="h-11" inputmode="numeric" required value="{{ old('quantity', 1) }}">
        </div>
        <div class="space-y-1">
          <label>Costo unitario *</label>
          <input id="wi_unit_cost" name="unit_cost" class="h-11" inputmode="numeric" required value="{{ old('unit_cost', 0) }}">
          <input type="hidden" id="wi_cost_origin" name="cost_origin" value="{{ old('cost_origin', 'manual') }}">
          <div class="flex items-center gap-2 flex-wrap">
            <div class="text-xs text-zinc-500">Se autocompleta desde costo de reparación o costo del producto.</div>
            <span id="wi_cost_origin_badge" class="badge-zinc">Origen costo: Manual</span>
          </div>
        </div>
        <div class="space-y-1">
          <label>Costo extra</label>
          <input id="wi_extra_cost" name="extra_cost" class="h-11" inputmode="numeric" value="{{ old('extra_cost', 0) }}">
        </div>
        <div class="space-y-1">
          <label>Monto recuperado</label>
          <input id="wi_recovered" name="recovered_amount" class="h-11" inputmode="numeric" value="{{ old('recovered_amount', 0) }}">
        </div>
        <div class="sm:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <div class="text-xs font-black uppercase text-rose-700">Perdida neta estimada</div>
          <div id="wi_loss_preview" class="mt-1 text-2xl font-black text-rose-700">$ 0</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="space-y-1">
          <label>Notas internas (opcional)</label>
          <textarea name="notes" rows="4" placeholder="Detalle del caso, proveedor, decision tomada, etc.">{{ old('notes') }}</textarea>
        </div>
      </div>
    </div>

    <div class="flex gap-2 justify-end">
      <a href="{{ route('admin.warranty_incidents.index') }}" class="btn-outline h-11 justify-center w-full sm:w-auto">Cancelar</a>
      <button class="btn-primary h-11 justify-center w-full sm:w-auto" type="submit">Guardar incidente</button>
    </div>
  </form>
</div>

<script>
  (() => {
    const qty = document.getElementById('wi_qty');
    const unit = document.getElementById('wi_unit_cost');
    const extra = document.getElementById('wi_extra_cost');
    const recovered = document.getElementById('wi_recovered');
    const preview = document.getElementById('wi_loss_preview');
    const costOriginInput = document.getElementById('wi_cost_origin');
    const costOriginBadge = document.getElementById('wi_cost_origin_badge');
    const sourceType = document.getElementById('wi_source_type');
    const repairSelect = document.getElementById('wi_repair_id');
    const productSelect = document.getElementById('wi_product_id');
    const supplierSelect = document.getElementById('wi_supplier_id');

    const toInt = (el) => {
      const n = parseInt(String(el?.value ?? '').trim(), 10);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    };

    const money = (value) => '$ ' + new Intl.NumberFormat('es-AR').format(value);
    const currentUnit = () => toInt(unit);
    const setCostOrigin = (origin) => {
      if (!costOriginBadge) return;
      const key = String(origin || 'manual').toLowerCase();
      if (costOriginInput) {
        costOriginInput.value = key;
      }
      const label = key === 'repair'
        ? 'Origen costo: Reparación'
        : (key === 'product' ? 'Origen costo: Producto' : 'Origen costo: Manual');
      costOriginBadge.textContent = label;
      costOriginBadge.className = key === 'repair'
        ? 'badge-sky'
        : (key === 'product' ? 'badge-emerald' : 'badge-zinc');
    };
    const setUnitIfResolved = (value) => {
      const resolved = parseInt(String(value || '').trim(), 10);
      if (!Number.isFinite(resolved) || resolved <= 0) return;
      unit.value = String(resolved);
    };

    const resolveAutoUnitCost = () => {
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

    const render = () => {
      const total = (toInt(qty) * toInt(unit)) + toInt(extra) - toInt(recovered);
      preview.textContent = money(total);
      preview.classList.toggle('text-emerald-700', total <= 0);
      preview.classList.toggle('text-rose-700', total > 0);
    };

    [qty, extra, recovered].forEach((el) => el?.addEventListener('input', render));
    unit?.addEventListener('input', () => {
      setCostOrigin('manual');
      render();
    });
    sourceType?.addEventListener('change', () => {
      resolveAutoUnitCost();
      render();
    });
    repairSelect?.addEventListener('change', () => {
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
    });

    productSelect?.addEventListener('change', () => {
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
    });
    setCostOrigin(costOriginInput?.value || 'manual');
    resolveAutoUnitCost();
    render();
  })();
</script>
@endsection
