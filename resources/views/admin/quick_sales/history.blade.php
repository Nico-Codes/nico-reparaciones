@extends('layouts.app')

@section('title', 'Admin - Historial de ventas rapidas')

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');
@endphp

@section('content')
<div class="space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0">
      <div class="page-title">Historial de ventas rapidas</div>
      <div class="page-subtitle">Control diario de ventas de mostrador, con filtros y exportacion.</div>
    </div>

    <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.quick_sales.index') }}">Volver a venta rapida</a>
  </div>

  <div class="card">
    <div class="card-head">
      <div class="font-black">Filtros</div>
      <div class="inline-flex gap-2">
        <a class="btn-outline btn-sm h-9" href="{{ route('admin.quick_sales.export_csv', request()->query()) }}">CSV</a>
        <a class="btn-outline btn-sm h-9" href="{{ route('admin.quick_sales.export_xlsx', request()->query()) }}">XLSX</a>
      </div>
    </div>
    <div class="card-body">
      <form method="GET" class="grid gap-2 md:grid-cols-5">
        <div class="grid gap-1">
          <label>Desde</label>
          <input class="h-11" type="date" name="from" value="{{ $from }}">
        </div>
        <div class="grid gap-1">
          <label>Hasta</label>
          <input class="h-11" type="date" name="to" value="{{ $to }}">
        </div>
        <div class="grid gap-1">
          <label>Pago</label>
          <select class="h-11" name="payment">
            <option value="">Todos</option>
            @foreach($paymentMethods as $key => $label)
              <option value="{{ $key }}" @selected($payment === $key)>{{ $label }}</option>
            @endforeach
          </select>
        </div>
        <div class="grid gap-1">
          <label>Admin</label>
          <select class="h-11" name="admin_id">
            <option value="0">Todos</option>
            @foreach($admins as $admin)
              <option value="{{ $admin->id }}" @selected((int)$adminId === (int)$admin->id)>{{ trim(($admin->name ?? '').' '.($admin->last_name ?? '')) }}</option>
            @endforeach
          </select>
        </div>
        <div class="flex items-end gap-2">
          <button class="btn-primary h-11 w-full justify-center" type="submit">Aplicar</button>
        </div>
      </form>
    </div>
  </div>

  <div class="grid gap-3 sm:grid-cols-2">
    <div class="card">
      <div class="card-body">
        <div class="text-sm text-zinc-500">Ventas encontradas</div>
        <div class="text-2xl font-black">{{ (int)$salesCount }}</div>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <div class="text-sm text-zinc-500">Total vendido</div>
        <div class="text-2xl font-black">{{ $money($salesTotal) }}</div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div class="font-black">Detalle</div>
      <span class="badge-zinc">{{ $sales->total() }} registros</span>
    </div>
    <div class="card-body">
      @if($sales->isEmpty())
        <div class="text-sm text-zinc-500">No hay ventas para los filtros seleccionados.</div>
      @else
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b border-zinc-200 text-left text-zinc-500">
                <th class="py-2 pr-3">Pedido</th>
                <th class="py-2 pr-3">Fecha</th>
                <th class="py-2 pr-3">Cliente</th>
                <th class="py-2 pr-3">Pago</th>
                <th class="py-2 pr-3">Items</th>
                <th class="py-2 pr-3">Total</th>
                <th class="py-2 pr-3">Admin</th>
              </tr>
            </thead>
            <tbody>
              @foreach($sales as $sale)
                <tr class="border-b border-zinc-100">
                  <td class="py-2 pr-3">
                    <a class="font-black text-sky-700 hover:text-sky-800" href="{{ route('admin.orders.show', $sale) }}">#{{ $sale->id }}</a>
                  </td>
                  <td class="py-2 pr-3">{{ optional($sale->created_at)->format('d/m/Y H:i') }}</td>
                  <td class="py-2 pr-3">{{ $sale->pickup_name ?: 'Mostrador' }}</td>
                  <td class="py-2 pr-3">{{ $paymentMethods[$sale->payment_method] ?? $sale->payment_method }}</td>
                  <td class="py-2 pr-3">{{ (int) $sale->items->sum('quantity') }}</td>
                  <td class="py-2 pr-3 font-black">{{ $money($sale->total) }}</td>
                  <td class="py-2 pr-3">{{ $sale->quickSaleAdmin ? trim(($sale->quickSaleAdmin->name ?? '').' '.($sale->quickSaleAdmin->last_name ?? '')) : '-' }}</td>
                </tr>
              @endforeach
            </tbody>
          </table>
        </div>

        <div class="mt-4">
          {{ $sales->links() }}
        </div>
      @endif
    </div>
  </div>
</div>
@endsection
