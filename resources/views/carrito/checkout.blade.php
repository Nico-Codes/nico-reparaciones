@extends('layouts.app')

@section('title', 'Checkout')

@php
  $fmt = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');

  $cart  = $cart ?? [];
  $total = $total ?? 0;

  $itemsCount = 0;
  foreach ($cart as $i) { $itemsCount += (int)($i['quantity'] ?? 0); }

  // UX: por defecto “Pago en el local”
  $pm = old('payment_method', 'local');
@endphp

@section('content')
  <div class="page-head">
    <div>
      <div class="page-title">Checkout</div>
      <div class="page-subtitle">Último paso: confirmá tu pedido. (Retiro en el local)</div>
    </div>
  </div>

  {{-- Stepper simple --}}
  <div class="mb-5 flex items-center gap-2 text-xs">
    <span class="badge-sky">1</span>
    <span class="text-zinc-700 font-bold">Carrito</span>
    <span class="text-zinc-400">→</span>
    <span class="badge-sky">2</span>
    <span class="text-zinc-900 font-black">Checkout</span>
    <span class="text-zinc-400">→</span>
    <span class="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-black bg-zinc-100 text-zinc-700">3</span>
    <span class="text-zinc-600">Pedido</span>
  </div>

  @guest
    <div class="card">
      <div class="card-body">
        <div class="font-black">Necesitás iniciar sesión para confirmar el pedido.</div>
        <div class="muted mt-1">Así el pedido queda asociado a tu cuenta y lo ves en “Mis pedidos”.</div>

        <div class="mt-4 flex flex-col sm:flex-row gap-2">
          <a href="{{ route('login') }}" class="btn-primary w-full sm:w-auto">Ingresar</a>
          <a href="{{ route('register') }}" class="btn-outline w-full sm:w-auto">Crear cuenta</a>
          <a href="{{ route('cart.index') }}" class="btn-ghost w-full sm:w-auto">Volver al carrito</a>
        </div>
      </div>
    </div>
    @php return; @endphp
  @endguest

  @if(empty($cart))
    <div class="card">
      <div class="card-body">
        <div class="font-black">Tu carrito está vacío.</div>
        <div class="muted mt-1">Agregá productos desde la tienda para poder confirmar.</div>
        <div class="mt-4">
          <a href="{{ route('store.index') }}" class="btn-primary">Ir a la tienda</a>
        </div>
      </div>
    </div>
    @php return; @endphp
  @endif

  <div class="grid gap-4 lg:grid-cols-5">
    {{-- Left: form --}}
    <div class="lg:col-span-3">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="font-black">Confirmación</div>
            <div class="text-xs text-zinc-500">Retiro en el local · Sin envíos</div>
          </div>
          <span class="badge-sky">{{ $itemsCount }} ítems</span>
        </div>

        <div class="card-body">
          <form method="POST"
                action="{{ route('checkout.confirm') }}"
                class="grid gap-6"
                data-checkout-form>
            @csrf

            {{-- Método de pago --}}
            <div class="grid gap-2">
              <label class="text-sm font-black text-zinc-700">Método de pago</label>

              <div class="grid gap-2 lg:grid-cols-3">
                {{-- Local --}}
                <label class="block cursor-pointer">
                  <input class="sr-only peer" type="radio" name="payment_method" value="local" {{ $pm==='local' ? 'checked' : '' }} required>
                  <div class="rounded-2xl border border-zinc-200 bg-white p-3 transition
                              hover:bg-zinc-50
                              peer-checked:border-sky-300 peer-checked:bg-sky-50 peer-checked:ring-2 peer-checked:ring-sky-100">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <div class="font-black text-zinc-900">Pago en el local</div>
                        <div class="text-xs text-zinc-600 mt-0.5">Pagás cuando retirás.</div>
                      </div>
                      <div class="h-9 w-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-base">🏬</div>
                    </div>
                  </div>
                </label>

                {{-- Mercado Pago --}}
                <label class="block cursor-pointer">
                  <input class="sr-only peer" type="radio" name="payment_method" value="mercado_pago" {{ $pm==='mercado_pago' ? 'checked' : '' }} required>
                  <div class="rounded-2xl border border-zinc-200 bg-white p-3 transition
                              hover:bg-zinc-50
                              peer-checked:border-sky-300 peer-checked:bg-sky-50 peer-checked:ring-2 peer-checked:ring-sky-100">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <div class="font-black text-zinc-900">Mercado Pago</div>
                        <div class="text-xs text-zinc-600 mt-0.5">Coordinamos el pago.</div>
                      </div>
                      <div class="h-9 w-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-base">💳</div>
                    </div>
                  </div>
                </label>

                {{-- Transferencia --}}
                <label class="block cursor-pointer">
                  <input class="sr-only peer" type="radio" name="payment_method" value="transferencia" {{ $pm==='transferencia' ? 'checked' : '' }} required>
                  <div class="rounded-2xl border border-zinc-200 bg-white p-3 transition
                              hover:bg-zinc-50
                              peer-checked:border-sky-300 peer-checked:bg-sky-50 peer-checked:ring-2 peer-checked:ring-sky-100">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <div class="font-black text-zinc-900">Transferencia</div>
                        <div class="text-xs text-zinc-600 mt-0.5">Datos por WhatsApp.</div>
                      </div>
                      <div class="h-9 w-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-base">🏦</div>
                    </div>
                  </div>
                </label>
              </div>

              <div class="text-xs text-zinc-500">
                El pedido queda “pendiente” hasta que lo confirmemos.
              </div>
            </div>

            {{-- Datos de retiro --}}
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label for="pickup_name">Nombre (opcional)</label>
                <input
                  id="pickup_name"
                  name="pickup_name"
                  value="{{ old('pickup_name', auth()->user()->name ?? '') }}"
                  placeholder="Nombre para el retiro">
              </div>

              <div>
                <label for="pickup_phone">Teléfono (opcional)</label>
                <input
                  id="pickup_phone"
                  name="pickup_phone"
                  value="{{ old('pickup_phone', auth()->user()->phone ?? '') }}"
                  placeholder="Ej: 341 555-0000">
              </div>
            </div>

            <div>
              <label for="notes">Notas (opcional)</label>
              <textarea id="notes" name="notes" placeholder="Ej: paso a retirar a la tarde">{{ old('notes') }}</textarea>
            </div>

            <div class="flex flex-col sm:flex-row gap-2">
              <button class="btn-primary w-full sm:w-auto"
                      type="submit"
                      data-checkout-submit>
                <span data-checkout-label>Confirmar pedido</span>
                <span class="hidden items-center gap-2" data-checkout-loading>
                  <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                  </svg>
                  Procesando…
                </span>
              </button>

              <a href="{{ route('cart.index') }}" class="btn-outline w-full sm:w-auto">Volver al carrito</a>
            </div>

            <div class="muted text-xs">
              Al confirmar, el pedido queda registrado y vas a poder seguir su estado desde “Mis pedidos”.
            </div>
          </form>
        </div>
      </div>
    </div>

    {{-- Right: summary (mobile collapsible / desktop sticky) --}}
    <div class="lg:col-span-2 lg:sticky lg:top-20 lg:self-start">
      <div class="card overflow-hidden">

        {{-- Mobile header (toggle) --}}
        <button type="button"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-100 lg:hidden"
                data-summary-toggle
                aria-expanded="false">
          <div class="min-w-0 text-left">
            <div class="font-black">Resumen</div>
            <div class="text-xs text-zinc-500">{{ $itemsCount }} ítems · Total {{ $fmt($total) }}</div>
          </div>

          <div class="inline-flex items-center gap-2">
            <span class="badge-sky">{{ $fmt($total) }}</span>
            <span class="text-zinc-500 text-sm" data-summary-icon>▾</span>
          </div>
        </button>

        {{-- Desktop header (always visible) --}}
        <div class="card-head hidden lg:flex">
          <div class="min-w-0">
            <div class="font-black">Resumen</div>
            <div class="text-xs text-zinc-500">{{ $itemsCount }} ítems · Retiro en el local</div>
          </div>

          <div class="flex items-center gap-2">
            <span class="badge-sky">{{ $fmt($total) }}</span>
            <a href="{{ route('cart.index') }}" class="btn-ghost btn-sm">Editar</a>
          </div>
        </div>

        {{-- Body: colapsable en móvil / siempre abierto en desktop --}}
        <div class="card-body grid gap-3"
             data-summary-body
             style="display:none;">

          <div class="grid gap-2">
            @foreach($cart as $item)
              @php
                $qty   = (int)($item['quantity'] ?? 0);
                $price = (float)($item['price'] ?? 0);
                $line  = $price * $qty;
              @endphp

              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="font-bold text-zinc-900 truncate">{{ $item['name'] ?? 'Producto' }}</div>
                  <div class="text-xs text-zinc-500">x{{ $qty }} · {{ $fmt($price) }}</div>
                </div>

                <div class="font-black text-zinc-900 whitespace-nowrap">{{ $fmt($line) }}</div>
              </div>
            @endforeach
          </div>

          <div class="h-px bg-zinc-100"></div>

          <div class="flex items-center justify-between">
            <div class="muted">Total</div>
            <div class="text-xl font-black">{{ $fmt($total) }}</div>
          </div>

          <div class="text-xs text-zinc-500">
            Retiro en el local. Si hay algún detalle de stock, te avisamos antes de confirmar.
          </div>

          <div class="lg:hidden pt-1">
            <a href="{{ route('cart.index') }}" class="btn-outline w-full justify-center">Editar carrito</a>
          </div>
        </div>

      </div>
    </div>
  </div>
@endsection
