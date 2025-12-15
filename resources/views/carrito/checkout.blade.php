@extends('layouts.app')

@section('title', 'Finalizar pedido - NicoReparaciones')

@section('content')
  <div class="flex items-center justify-between gap-3">
    <div>
      <h1 class="page-title">Finalizar pedido</h1>
      <p class="muted mt-1">Elegí la forma de pago y confirmá.</p>
    </div>
    <a href="{{ route('cart.index') }}" class="btn-outline">Volver al carrito</a>
  </div>

  @if($errors->any())
    <div class="mt-4 card">
      <div class="card-body">
        <div class="font-bold text-rose-700">Revisá estos datos:</div>
        <ul class="mt-2 list-disc pl-5 text-sm text-zinc-700 space-y-1">
          @foreach($errors->all() as $error)
            <li>{{ $error }}</li>
          @endforeach
        </ul>
      </div>
    </div>
  @endif

  <div class="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
    {{-- Form --}}
    <div class="card">
      <div class="card-header">
        <div class="section-title">Datos del pedido</div>
        <div class="muted">Pago y retiro</div>
      </div>

      <div class="card-body">
        @guest
          <div class="rounded-2xl bg-brand-soft ring-1 ring-blue-200 p-4">
            <div class="font-bold">Necesitás ingresar para confirmar el pedido</div>
            <div class="muted mt-1">Ingresá o creá tu cuenta y luego confirmás en 1 click.</div>

            <div class="mt-3 flex flex-col sm:flex-row gap-2">
              <a class="btn-primary w-full sm:w-auto" href="{{ route('login') }}">Ingresar</a>
              <a class="btn-outline w-full sm:w-auto" href="{{ route('register') }}">Crear cuenta</a>
            </div>
          </div>
        @endguest

        @auth
          <form action="{{ route('checkout.confirm') }}" method="POST" class="mt-2 space-y-4">
            @csrf

            <div>
              <label class="label" for="payment_method">Método de pago</label>
              <select id="payment_method" name="payment_method" class="select">
                <option value="local" {{ old('payment_method') === 'local' ? 'selected' : '' }}>Pago en el local</option>
                <option value="mercado_pago" {{ old('payment_method') === 'mercado_pago' ? 'selected' : '' }}>Mercado Pago</option>
                <option value="transferencia" {{ old('payment_method') === 'transferencia' ? 'selected' : '' }}>Transferencia</option>
              </select>
              <div class="muted mt-1">Si elegís transferencia/MP, coordinamos el pago por mensaje.</div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="label" for="pickup_name">Nombre (opcional)</label>
                <input id="pickup_name" name="pickup_name" class="input" value="{{ old('pickup_name') }}" placeholder="Quién retira" />
              </div>
              <div>
                <label class="label" for="pickup_phone">Teléfono (opcional)</label>
                <input id="pickup_phone" name="pickup_phone" class="input" value="{{ old('pickup_phone') }}" placeholder="WhatsApp/teléfono" />
              </div>
            </div>

            <div>
              <label class="label" for="notes">Notas (opcional)</label>
              <textarea id="notes" name="notes" class="textarea" placeholder="Aclaraciones del pedido...">{{ old('notes') }}</textarea>
            </div>

            <button type="submit" class="btn-primary w-full">Confirmar pedido</button>
          </form>
        @endauth
      </div>
    </div>

    {{-- Resumen --}}
    <div class="card h-fit lg:sticky lg:top-20">
      <div class="card-header">
        <div class="section-title">Resumen</div>
        <div class="muted">Productos y total</div>
      </div>

      <div class="card-body">
        <div class="space-y-2">
          @foreach($cart as $item)
            @php $sub = ($item['price'] ?? 0) * ($item['quantity'] ?? 0); @endphp
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="font-semibold leading-snug truncate">{{ $item['name'] }}</div>
                <div class="muted">x{{ $item['quantity'] }} · ${{ number_format($sub, 0, ',', '.') }}</div>
              </div>
              <a class="btn-ghost px-2 py-1" href="{{ route('store.product', $item['slug']) }}">Ver</a>
            </div>
          @endforeach
        </div>

        <div class="h-px bg-zinc-100 my-4"></div>

        <div class="flex items-center justify-between">
          <div class="muted">Total</div>
          <div class="text-2xl font-extrabold">${{ number_format($total, 0, ',', '.') }}</div>
        </div>

        <div class="mt-4">
          <a href="{{ route('cart.index') }}" class="btn-outline w-full">Editar carrito</a>
        </div>
      </div>
    </div>
  </div>
@endsection
