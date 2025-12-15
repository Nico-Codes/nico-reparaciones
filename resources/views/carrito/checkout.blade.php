@extends('layouts.app')

@section('title', 'Finalizar pedido — NicoReparaciones')

@section('content')
@php
  $money = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
@endphp

<div class="container-page py-6">
  <h1 class="page-title">Finalizar pedido</h1>
  <p class="page-subtitle">Confirmá los datos y elegí la forma de pago.</p>

  @if($errors->any())
    <div class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      <div class="font-semibold">Hay errores para corregir:</div>
      <ul class="mt-2 list-disc pl-5 space-y-1">
        @foreach($errors->all() as $error)
          <li>{{ $error }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
    {{-- Resumen --}}
    <div class="lg:col-span-2 space-y-3">
      @foreach($cart as $item)
        <div class="card">
          <div class="card-body">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="text-sm font-semibold text-zinc-900">{{ $item['name'] }}</div>
                <div class="mt-1 text-sm text-zinc-500">
                  x {{ $item['quantity'] }} · {{ $money($item['price']) }} c/u
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs text-zinc-500">Subtotal</div>
                <div class="text-sm font-extrabold text-zinc-900">
                  {{ $money($item['price'] * $item['quantity']) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      @endforeach
    </div>

    {{-- Form --}}
    <div class="space-y-3">
      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Confirmación</div>
        </div>
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm text-zinc-600">Total</span>
            <span class="text-lg font-extrabold text-zinc-900">{{ $money($total) }}</span>
          </div>

          <form action="{{ route('checkout.confirm') }}" method="POST" class="space-y-3">
            @csrf

            <div>
              <label class="text-sm font-medium text-zinc-800">Forma de pago</label>
              <select class="select" name="payment_method" required>
                <option value="local">Pago en el local</option>
                <option value="mercado_pago">Mercado Pago</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium text-zinc-800">Nombre de quien retira (opcional)</label>
              <input class="input" type="text" name="pickup_name" value="{{ old('pickup_name', auth()->user()->name) }}">
            </div>

            <div>
              <label class="text-sm font-medium text-zinc-800">Teléfono de contacto (opcional)</label>
              <input class="input" type="text" name="pickup_phone" value="{{ old('pickup_phone', auth()->user()->phone) }}">
            </div>

            <div>
              <label class="text-sm font-medium text-zinc-800">Notas (opcional)</label>
              <textarea class="textarea" name="notes" rows="3">{{ old('notes') }}</textarea>
            </div>

            <button type="submit" class="btn-primary w-full">Confirmar pedido</button>
          </form>

          <a href="{{ route('cart.index') }}" class="btn-outline w-full mt-3">Volver al carrito</a>
        </div>
      </div>

      <div class="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
        <div class="font-semibold text-zinc-900">Retiro en local</div>
        <div class="mt-1">Vas a poder coordinar por WhatsApp una vez confirmado el pedido.</div>
      </div>
    </div>
  </div>
</div>
@endsection
