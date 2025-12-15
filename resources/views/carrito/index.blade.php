@extends('layouts.app')
@section('title', 'Carrito - NicoReparaciones')

@section('content')
  <div class="space-y-4">
    <div class="flex items-end justify-between gap-3">
      <div>
        <h1 class="page-title">Carrito</h1>
        <p class="text-sm text-zinc-600 mt-1">Revisá los productos antes de finalizar tu pedido.</p>
      </div>
      <a class="btn-secondary" href="{{ route('store.index') }}">Seguir comprando</a>
    </div>

    @if(empty($cart))
      <div class="card">
        <div class="card-body">
          <div class="text-sm text-zinc-600">Tu carrito está vacío.</div>
          <div class="mt-3">
            <a class="btn-primary" href="{{ route('store.index') }}">Ir a la tienda</a>
          </div>
        </div>
      </div>
    @else
      <div class="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div class="space-y-3">
          @foreach($cart as $item)
            <div class="card">
              <div class="card-body">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <a class="font-extrabold hover:underline"
                       href="{{ route('store.product', $item['slug']) }}">
                      {{ $item['name'] }}
                    </a>
                    <div class="text-sm text-zinc-600 mt-1">
                      Precio unitario: ${{ number_format($item['price'], 0, ',', '.') }}
                    </div>
                  </div>

                  <div class="text-right">
                    <div class="text-sm text-zinc-500">Subtotal</div>
                    <div class="text-lg font-extrabold">
                      ${{ number_format($item['price'] * $item['quantity'], 0, ',', '.') }}
                    </div>
                  </div>
                </div>

                <div class="mt-4 flex flex-col sm:flex-row gap-2 sm:items-end sm:justify-between">
                  <form class="flex gap-2 items-end" method="POST" action="{{ route('cart.update', $item['id']) }}">
                    @csrf
                    <div>
                      <label class="label" for="q{{ $item['id'] }}">Cant.</label>
                      <input id="q{{ $item['id'] }}" name="quantity" type="number" min="1"
                             value="{{ $item['quantity'] }}" class="input w-28">
                    </div>
                    <button class="btn-secondary" type="submit">Actualizar</button>
                  </form>

                  <form method="POST" action="{{ route('cart.remove', $item['id']) }}">
                    @csrf
                    <button class="btn-ghost px-3 py-2" type="submit">Quitar</button>
                  </form>
                </div>
              </div>
            </div>
          @endforeach
        </div>

        <div class="space-y-3">
          <div class="card">
            <div class="card-body space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-sm text-zinc-600">Total</div>
                <div class="text-2xl font-extrabold">${{ number_format($total, 0, ',', '.') }}</div>
              </div>

              <a class="btn-primary w-full" href="{{ route('checkout') }}">Finalizar pedido</a>

              <form method="POST" action="{{ route('cart.clear') }}">
                @csrf
                <button class="btn-secondary w-full" type="submit">Vaciar carrito</button>
              </form>

              <div class="text-xs text-zinc-500">
                Retiro en local. Coordinamos por WhatsApp cuando esté listo.
              </div>
            </div>
          </div>
        </div>
      </div>
    @endif
  </div>
@endsection
