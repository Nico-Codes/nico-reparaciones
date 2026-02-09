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

  $u = auth()->user();
  $fullName = $u ? trim(($u->name ?? '') . ' ' . ($u->last_name ?? '')) : '';
  $needsProfile = !$u || empty($u->last_name) || empty($u->phone);

@endphp

@section('content')
  <div class="page-head">
    <div>
      <div class="page-title">Checkout</div>
      <div class="page-subtitle">Ultimo paso: confirma tu pedido para retiro en local.</div>
    </div>
  </div>

  <div class="mb-5 rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4">
    <ol class="grid grid-cols-3 gap-2 text-xs">
      <li class="rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-2 text-center">
        <div class="text-[11px] font-black uppercase tracking-wide text-zinc-500">Paso 1</div>
        <div class="font-black text-zinc-700">Carrito</div>
      </li>
      <li class="rounded-xl border border-sky-200 bg-sky-50 px-2 py-2 text-center ring-1 ring-sky-100">
        <div class="text-[11px] font-black uppercase tracking-wide text-sky-700">Paso 2</div>
        <div class="font-black text-sky-900">Checkout</div>
      </li>
      <li class="rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-2 text-center">
        <div class="text-[11px] font-black uppercase tracking-wide text-zinc-500">Paso 3</div>
        <div class="font-black text-zinc-700">Pedido</div>
      </li>
    </ol>
  </div>
    @if ($errors->any())
      <div class="alert-error mb-4">
        <div class="font-black">Revisá estos datos:</div>
        <ul class="mt-2 list-disc pl-5">
          @foreach($errors->all() as $e)
            <li>{{ $e }}</li>
          @endforeach
        </ul>
      </div>
    @endif


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

  <div class="grid gap-4 lg:grid-cols-5 lg:items-start">
    {{-- Left: form --}}
    <div class="order-2 lg:order-1 lg:col-span-3">
      <div class="card">
        <div class="card-head items-start">
          <div class="min-w-0">
            <div class="font-black">Confirmacion</div>
            <div class="text-xs text-zinc-500">Revisa tus datos y confirma una sola vez.</div>
          </div>
          <span class="badge-sky shrink-0">{{ $itemsCount }} items</span>
        </div>

        <div class="card-body">
          <form method="POST"
                action="{{ route('checkout.confirm') }}"
                class="grid gap-6"
                data-checkout-form>
            @csrf
            <input type="hidden" name="checkout_token" value="{{ old('checkout_token', $checkoutToken ?? '') }}">

            {{-- Metodo de pago --}}
            <div class="grid gap-3">
              <label class="text-sm font-black text-zinc-700">Metodo de pago</label>

              <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <label class="block cursor-pointer">
                  <input class="sr-only peer" type="radio" name="payment_method" value="local" {{ $pm==='local' ? 'checked' : '' }} required>
                  <div class="flex min-h-24 items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:bg-zinc-50 peer-checked:border-sky-300 peer-checked:bg-sky-50 peer-checked:ring-2 peer-checked:ring-sky-100">
                    <div class="min-w-0">
                      <div class="font-black text-zinc-900">Pago en el local</div>
                      <div class="mt-1 text-xs text-zinc-600">Pagas al retirar.</div>
                    </div>
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white">
                      <svg class="h-5 w-5 text-zinc-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M4 10h16M6 10V7.5L12 4l6 3.5V10M6 10v8h12v-8M10 18v-4h4v4" stroke="currentColor" stroke-width="1.5" />
                      </svg>
                    </div>
                  </div>
                </label>

                <label class="block cursor-pointer">
                  <input class="sr-only peer" type="radio" name="payment_method" value="mercado_pago" {{ $pm==='mercado_pago' ? 'checked' : '' }} required>
                  <div class="flex min-h-24 items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:bg-zinc-50 peer-checked:border-sky-300 peer-checked:bg-sky-50 peer-checked:ring-2 peer-checked:ring-sky-100">
                    <div class="min-w-0">
                      <div class="font-black text-zinc-900">Mercado Pago</div>
                      <div class="mt-1 text-xs text-zinc-600">Coordinamos el link de pago.</div>
                    </div>
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white">
                      <svg class="h-5 w-5 text-zinc-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect x="3.5" y="6.5" width="17" height="11" rx="2" stroke="currentColor" stroke-width="1.5" />
                        <path d="M3.5 10h17M7 14.5h3.5" stroke="currentColor" stroke-width="1.5" />
                      </svg>
                    </div>
                  </div>
                </label>

                <label class="block cursor-pointer sm:col-span-2 lg:col-span-1">
                  <input class="sr-only peer" type="radio" name="payment_method" value="transferencia" {{ $pm==='transferencia' ? 'checked' : '' }} required>
                  <div class="flex min-h-24 items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:bg-zinc-50 peer-checked:border-sky-300 peer-checked:bg-sky-50 peer-checked:ring-2 peer-checked:ring-sky-100">
                    <div class="min-w-0">
                      <div class="font-black text-zinc-900">Transferencia</div>
                      <div class="mt-1 text-xs text-zinc-600">Te enviamos los datos por WhatsApp.</div>
                    </div>
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white">
                      <svg class="h-5 w-5 text-zinc-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M4 9.5h16M6 6.5h12A1.5 1.5 0 0 1 19.5 8v8A1.5 1.5 0 0 1 18 17.5H6A1.5 1.5 0 0 1 4.5 16V8A1.5 1.5 0 0 1 6 6.5Z" stroke="currentColor" stroke-width="1.5" />
                        <path d="M8 13h3m2 0h3" stroke="currentColor" stroke-width="1.5" />
                      </svg>
                    </div>
                  </div>
                </label>
              </div>

              <div class="text-xs text-zinc-500">
                El pedido queda pendiente hasta que lo confirmemos.
              </div>
              @error('payment_method')
                <div class="text-xs font-bold text-rose-600">{{ $message }}</div>
              @enderror

            </div>

            {{-- Tus datos (desde perfil) --}}
            <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <div class="font-black text-zinc-900">Tus datos</div>

                  <div class="mt-2 grid gap-1 text-sm text-zinc-700">
                    <div><span class="font-black">Nombre:</span> {{ $fullName ?: '—' }}</div>
                    <div><span class="font-black">Teléfono:</span> {{ $u->phone ?? '—' }}</div>
                    <div class="truncate"><span class="font-black">Email:</span> {{ $u->email ?? '—' }}</div>
                  </div>

                  <div class="muted text-xs mt-2">Se usan para asociar el pedido y contactarte.</div>
                </div>

                <a href="{{ route('account.edit') }}" class="btn-ghost btn-sm w-full justify-center sm:w-auto">Editar datos</a>
              </div>

              @if($needsProfile)
                <div class="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  <div class="font-black">Falta completar tu perfil.</div>
                  <div class="mt-1">Agregá tu apellido y teléfono para poder confirmar pedidos.</div>
                </div>
              @endif
            </div>

            {{-- Retira otra persona (opcional) --}}
            <details class="rounded-2xl border border-zinc-200 bg-white p-4">
              <summary class="cursor-pointer select-none font-black">
                ¿Retira otra persona?
                <span class="muted font-normal"> (opcional)</span>
              </summary>

              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label for="pickup_delegate_name">Nombre de quien retira</label>
                  <input id="pickup_delegate_name"
                        name="pickup_delegate_name"
                        value="{{ old('pickup_delegate_name') }}"
                        placeholder="Ej: Juan Pérez">
                </div>

                <div>
                  <label for="pickup_delegate_phone">Teléfono de quien retira</label>
                  <input id="pickup_delegate_phone"
                        name="pickup_delegate_phone"
                        value="{{ old('pickup_delegate_phone') }}"
                        placeholder="Ej: 341 555-0000">
                </div>
              </div>

              <div class="muted mt-3 text-xs">
                El pedido sigue asociado a tu cuenta (tu teléfono). Esto solo es para identificar quién retira.
              </div>
            </details>


            <div>
              <label for="notes">Notas (opcional)</label>
              <textarea id="notes" name="notes" class="min-h-28" placeholder="Ej: paso a retirar a la tarde">{{ old('notes') }}</textarea>
            </div>

            <div class="grid gap-2 sm:flex sm:flex-row">
              <button class="btn-primary h-11 w-full sm:w-auto {{ $needsProfile ? 'opacity-50 cursor-not-allowed' : '' }}"
                      type="submit"
                      data-checkout-submit
                      {{ $needsProfile ? 'disabled' : '' }}>

                <span data-checkout-label>Confirmar pedido</span>
                <span class="hidden items-center gap-2" data-checkout-loading>
                  <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                  </svg>
                  Procesando…
                </span>
              </button>

              <a href="{{ route('cart.index') }}" class="btn-outline h-11 w-full sm:w-auto">Volver al carrito</a>
            </div>

            <div class="muted text-xs">
              Al confirmar, el pedido queda registrado y vas a poder seguir su estado desde “Mis pedidos”.
            </div>
          </form>
        </div>
      </div>
    </div>

    {{-- Right: summary (mobile collapsible / desktop sticky) --}}
    <div class="order-1 lg:order-2 lg:col-span-2 lg:sticky lg:top-20 lg:self-start">
      <div class="card overflow-hidden">

        {{-- Mobile header (toggle) --}}
        <button type="button"
                class="w-full flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/70 px-4 py-3.5 lg:hidden"
                data-summary-toggle
                aria-expanded="false">
          <div class="min-w-0 text-left">
            <div class="font-black">Resumen</div>
            <div class="text-xs text-zinc-500">{{ $itemsCount }} items | Total {{ $fmt($total) }}</div>
          </div>

          <div class="inline-flex items-center gap-2">
            <span class="badge-sky">{{ $fmt($total) }}</span>
            <span class="text-zinc-500 text-sm" data-summary-icon>v</span>
          </div>
        </button>

        {{-- Desktop header (always visible) --}}
        <div class="card-head hidden lg:flex">
          <div class="min-w-0">
            <div class="font-black">Resumen</div>
            <div class="text-xs text-zinc-500">{{ $itemsCount }} items | Retiro en el local</div>
          </div>

          <div class="flex items-center gap-2">
            <span class="badge-sky">{{ $fmt($total) }}</span>
            <a href="{{ route('cart.index') }}" class="btn-ghost btn-sm">Editar</a>
          </div>
        </div>

        {{-- Body: colapsable en móvil / siempre abierto en desktop --}}
        <div class="card-body grid gap-4"
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

          <div class="rounded-2xl bg-zinc-50 px-3 py-2">
            <div class="flex items-center justify-between">
              <div class="text-sm font-bold text-zinc-600">Total</div>
              <div class="text-2xl font-black tracking-tight">{{ $fmt($total) }}</div>
            </div>
          </div>

          <div class="text-xs text-zinc-500">
            Retiro en el local. Si hay algun detalle de stock, te avisamos antes de confirmar.
          </div>

          <div class="lg:hidden pt-1">
            <a href="{{ route('cart.index') }}" class="btn-outline h-11 w-full justify-center">Editar carrito</a>
          </div>
        </div>

      </div>
    </div>
  </div>
@endsection
