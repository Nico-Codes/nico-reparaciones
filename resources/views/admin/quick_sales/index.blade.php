@extends('layouts.app')

@section('title', 'Admin - Venta rapida')

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');
@endphp

@section('content')
<div class="space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0">
      <div class="page-title">Venta rapida</div>
      <div class="page-subtitle">Escanea SKU o barcode para cargar productos y confirmar venta en segundos.</div>
    </div>

    <div class="flex w-full gap-2 flex-wrap sm:w-auto">
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ $quickSaleHistoryHref }}">Historial</a>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.orders.index') }}">Ver pedidos</a>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.products.index') }}">Productos</a>
    </div>
  </div>

  @if($errors->has('quick_sale'))
    <div class="alert-error">{{ $errors->first('quick_sale') }}</div>
  @endif

  @if (session('success'))
    <div class="alert-success">{{ session('success') }}</div>
  @endif

  <div class="grid gap-4 xl:grid-cols-3">
    <div class="xl:col-span-2 space-y-4">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="font-black">Escaner / carga rapida</div>
            <div class="text-xs text-zinc-500">Puedes escanear o escribir SKU/barcode y presionar Enter.</div>
          </div>
        </div>
        <div class="card-body">
          <form id="quickSaleScanForm" method="POST" action="{{ route('admin.quick_sales.add') }}" class="grid gap-2 sm:grid-cols-[1fr_140px_auto] sm:items-end">
            @csrf
            <div class="grid gap-1">
              <label>Codigo (SKU o barcode)</label>
              <input id="quickSaleCodeInput" name="code" class="h-11" placeholder="Ej: CAB-USB-C-001 o 7791234567890" autofocus>
            </div>
            <div class="grid gap-1">
              <label>Cantidad</label>
              <input id="quickSaleQtyInput" type="number" min="1" max="999" name="quantity" value="1" class="h-11">
            </div>
            <button id="quickSaleAddBtn" class="btn-primary h-11 w-full justify-center sm:w-auto" type="submit">Agregar</button>
          </form>
          <div id="quickSaleScanStatus" class="mt-2 hidden rounded-xl border px-3 py-2 text-sm"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="font-black">Busqueda manual</div>
          <span class="badge-zinc">{{ count($products ?? []) }} resultados</span>
        </div>
        <div class="card-body">
          <form method="GET" class="mb-3 flex flex-col gap-2 sm:flex-row">
            <input name="q" value="{{ $q ?? '' }}" class="h-11" placeholder="Buscar por nombre, SKU o barcode...">
            <button class="btn-outline h-11 w-full justify-center sm:w-auto" type="submit">Buscar</button>
          </form>

          <div class="grid gap-2">
            @forelse($products as $p)
              <form method="POST" action="{{ route('admin.quick_sales.add') }}" class="rounded-2xl border border-zinc-200 bg-white p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                @csrf
                <input type="hidden" name="product_id" value="{{ $p->id }}">
                <div class="min-w-0">
                  <div class="font-black text-zinc-900 truncate">{{ $p->name }}</div>
                  <div class="text-xs text-zinc-500">SKU: {{ $p->sku ?? '—' }} | Barcode: {{ $p->barcode ?? '—' }} | Stock: {{ (int)$p->stock }}</div>
                </div>
                <div class="flex items-center gap-2">
                  <input type="number" min="1" max="999" name="quantity" value="1" class="!w-20 h-10 text-right">
                  <button class="btn-outline btn-sm h-10" type="submit">Agregar</button>
                </div>
              </form>
            @empty
              <div class="text-sm text-zinc-500">Sin resultados para mostrar.</div>
            @endforelse
          </div>
        </div>
      </div>
    </div>

    <div class="xl:col-span-1">
      <div id="quickSaleTicketContainer" class="card sticky top-20">
        @include('admin.quick_sales.partials.ticket', [
          'cart' => $cart,
          'cartTotal' => $cartTotal,
          'cartItemsCount' => $cartItemsCount,
          'paymentMethods' => $paymentMethods,
        ])
      </div>
    </div>
  </div>
</div>

<script>
  (() => {
    const form = document.getElementById('quickSaleScanForm');
    const codeInput = document.getElementById('quickSaleCodeInput');
    const qtyInput = document.getElementById('quickSaleQtyInput');
    const addBtn = document.getElementById('quickSaleAddBtn');
    const status = document.getElementById('quickSaleScanStatus');
    const ticketContainer = document.getElementById('quickSaleTicketContainer');
    if (!form || !codeInput || !qtyInput || !addBtn || !status || !ticketContainer) return;

    const ticketUrl = @json(route('admin.quick_sales.ticket'));

    const beep = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.value = 0.04;
        osc.start();
        setTimeout(() => {
          osc.stop();
          ctx.close();
        }, 80);
      } catch (_) {}
    };

    const flash = (ok, message) => {
      status.className = ok
        ? 'mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800'
        : 'mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800';
      status.textContent = message;
      status.classList.remove('hidden');
    };

    const refreshTicket = async () => {
      const response = await fetch(ticketUrl, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
      });
      if (!response.ok) return;
      const html = await response.text();
      ticketContainer.innerHTML = html;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const code = String(codeInput.value || '').trim();
      if (code === '') {
        flash(false, 'Ingresa un codigo para escanear o agregar.');
        codeInput.focus();
        return;
      }

      addBtn.disabled = true;
      addBtn.setAttribute('aria-busy', 'true');

      try {
        const payload = new FormData(form);
        const response = await fetch(form.action, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: payload,
          credentials: 'same-origin',
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) {
          const err = data.message || 'No se pudo agregar el producto.';
          flash(false, err);
          codeInput.focus();
          codeInput.select();
          return;
        }

        await refreshTicket();
        flash(true, data.message || 'Producto agregado.');
        beep();
        codeInput.value = '';
        qtyInput.value = '1';
        codeInput.focus();
      } catch (_) {
        flash(false, 'Error de red al agregar el producto.');
      } finally {
        addBtn.disabled = false;
        addBtn.removeAttribute('aria-busy');
      }
    });
  })();
</script>
@endsection
