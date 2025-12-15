@extends('layouts.app')

@section('title', 'Checkout')

@php
  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');
@endphp

@section('content')
  <div class="page-head">
    <div class="page-title">Checkout</div>
    <div class="page-subtitle">Confirmá tu pedido y elegí cómo querés pagarlo.</div>
  </div>

  @guest
    <div class="card">
      <div class="card-body">
        <div class="font-black">Necesitás iniciar sesión para confirmar el pedido.</div>
        <div class="muted mt-1">Esto permite que el pedido te quede asociado y puedas verlo en “Mis pedidos”.</div>

        <div class="mt-4 flex flex-col sm:flex-row gap-2">
          <a href="{{ route('login') }}" class="btn-primary w-full sm:w-auto">Ingresar</a>
          <a href="{{ route('register') }}" class="btn-outline w-full sm:w-auto">Crear cuenta</a>
          <a href="{{ route('cart.index') }}" class="btn-ghost w-full sm:w-auto">Volver al carrito</a>
        </div>
      </div>
    </div>
    @return
  @endguest

  <div class="grid gap-4 lg:grid-cols-3">
    <div class="lg:col-span-2 card">
      <div class="card-head">
        <div class="font-black">Datos del pedido</div>
        <span class="badge-sky">Retiro en el local</span>
      </div>

      <div class="card-body">
        <form method="POST" action="{{ route('checkout.confirm') }}" class="grid gap-4">
          @csrf

          <div>
            <label for="payment_method">Método de pago</label>
            <select id="payment_method" name="payment_method" required>
              <option value="">Elegí una opción…</option>
              <option value="local" {{ old('payment_method')==='local' ? 'selected' : '' }}>Pago en el local</option>
              <option value="mercado_pago" {{ old('payment_method')==='mercado_pago' ? 'selected' : '' }}>Mercado Pago</option>
              <option value="transferencia" {{ old('payment_method')==='transferencia' ? 'selected' : '' }}>Transferencia</option>
            </select>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label for="pickup_name">Nombre (opcional)</label>
              <input id="pickup_name" name="pickup_name" value="{{ old('pickup_name', auth()->user()->name ?? '') }}" placeholder="Nombre para retiro">
            </div>

            <div>
              <label for="pickup_phone">Teléfono (opcional)</label>
              <input id="pickup_phone" name="pickup_phone" value="{{ old('pickup_phone', auth()->user()->phone ?? '') }}" placeholder="Ej: 341 555-0000">
            </div>
          </div>

          <div>
            <label for="notes">Notas (opcional)</label>
            <textarea id="notes" name="notes" placeholder="Ej: paso a retirar a la tarde">{{ old('notes') }}</textarea>
          </div>

          <div class="flex flex-col sm:flex-row gap-2">
            <button class="btn-primary w-full sm:w-auto" type="submit">Confirmar pedido</button>
            <a href="{{ route('cart.index') }}" class="btn-outline w-full sm:w-auto">Volver al carrito</a>
          </div>

          <div class="muted text-xs">
            Al confirmar, el pedido queda “pendiente” y lo vas a ver en “Mis pedidos”.
          </div>
        </form>
      </div>
    </div>

    <div class="card h-fit">
      <div class="card-head">
        <div class="font-black">Resumen</div>
        <span class="badge-sky">Total</span>
      </div>

      <div class="card-body grid gap-3">
        <div class="grid gap-2">
          @foreach($cart as $item)
            <div class="flex items-start justify-between gap-3 text-sm">
              <div class="min-w-0">
                <div class="font-bold text-zinc-900">{{ $item['name'] }}</div>
                <div class="text-xs text-zinc-500">Cant: {{ (int)$item['quantity'] }}</div>
              </div>
              <div class="font-black text-zinc-900">
                {{ $fmt((float)$item['price'] * (int)$item['quantity') ) }}
              </div>
            </div>
          @endforeach
        </div>

        <div class="divider"></div>

        <div class="flex items-center justify-between">
          <div class="muted">Total</div>
          <div class="text-xl font-black">{{ $fmt($total) }}</div>
        </div>
      </div>
    </div>
  </div>
@endsection
