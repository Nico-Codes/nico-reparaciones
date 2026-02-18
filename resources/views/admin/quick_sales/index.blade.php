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
        <div
          data-react-quick-sale-scan
          data-add-url="{{ route('admin.quick_sales.add') }}"
          data-ticket-url="{{ route('admin.quick_sales.ticket') }}"
          data-ticket-container-id="quickSaleTicketContainer"
          data-csrf="{{ csrf_token() }}">
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

@endsection
