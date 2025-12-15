@extends('layouts.app')

@section('title', 'Checkout')

@php
  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
@endphp

@section('content')
  <div class="page-head">
    <div class="page-title">Checkout</div>
    <div class="page-subtitle">Confirmá tu pedido. Simple y rápido.</div>
  </div>

  <div class="grid gap-4 lg:grid-cols-3">
    <div class="lg:col-span-2 card">
      <div class="card-head">
        <div class="font-black">Tus datos</div>
        <span class="badge-sky">Pago / Retiro</span>
      </div>

      <div class="card-body">
        <form method="POST" action="{{ route('checkout.confirm') }}" class="grid gap-4">
          @csrf

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="pickup_name">Nombre para retiro</label>
              <input id="pickup_name" name="pickup_name" value="{{ old('pickup_name') }}">
            </div>

            <div>
              <label for="pickup_phone">Teléfono</label>
              <input id="pickup_phone" name="pickup_phone" value="{{ old('pickup_phone') }}">
            </div>
          </div>

          <div>
            <label for="payment_method">Método de pago</label>
            <select id="payment_method" name="payment_method" required>
              <option value="" disabled {{ old('payment_method') ? '' : 'selected' }}>Elegí una opción</option>
              <option value="efectivo" {{ old('payment_method')==='efectivo' ? 'selected' : '' }}>Efectivo</option>
              <option value="transferencia" {{ old('payment_method')==='transferencia' ? 'selected' : '' }}>Transferencia</option>
              <option value="tarjeta" {{ old('payment_method')==='tarjeta' ? 'selected' : '' }}>Tarjeta</option>
            </select>
          </div>

          <div>
            <label for="notes">Notas</label>
            <textarea id="notes" name="notes" placeholder="Ej: paso a retirar a la tarde...">{{ old('notes') }}</textarea>
          </div>

          <button class="btn-primary w-full">Confirmar pedido</button>

          <div class="muted text-center">
            Al confirmar se guarda el pedido con sus ítems (snapshot).
          </div>
        </form>
      </div>
    </div>

    <div class="card h-fit">
      <div class="card-head">
        <div class="font-black">Resumen</div>
        <span class="badge-sky">{{ count($cart) }} ítems</span>
      </div>

      <div class="card-body grid gap-3">
        @foreach($cart as $item)
          <div class="flex items-start justify-between gap-3">
            <div class="text-sm">
              <div class="font-black">{{ $item['name'] }}</div>
              <div class="muted">x{{ $item['quantity'] }}</div>
            </div>
            <div class="text-sm font-black">
              {{ $fmt($item['price'] * $item['quantity']) }}
            </div>
          </div>
        @endforeach

        <hr>

        <div class="flex items-center justify-between">
          <div class="muted">Total</div>
          <div class="text-xl font-black">{{ $fmt($total) }}</div>
        </div>

        <a href="{{ route('cart.index') }}" class="btn-outline w-full">Volver al carrito</a>
      </div>
    </div>
  </div>
@endsection
