@extends('layouts.app')

@section('title', 'Consultar reparación - NicoReparaciones')

@section('content')
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
    {{-- Info --}}
    <div class="card">
      <div class="card-body">
        <h1 class="page-title">Consultar reparación</h1>
        <p class="muted mt-2">
          Ingresá el <span class="font-semibold text-zinc-900">código</span> y tu <span class="font-semibold text-zinc-900">teléfono</span>
          para ver el estado actual.
        </p>

        <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="rounded-2xl bg-brand-soft ring-1 ring-blue-200 p-4">
            <div class="font-bold">🔎 Rápido</div>
            <div class="muted mt-1">Pensado para usar desde el celular.</div>
          </div>
          <div class="rounded-2xl bg-brand-soft ring-1 ring-blue-200 p-4">
            <div class="font-bold">✅ Seguro</div>
            <div class="muted mt-1">Pedimos teléfono para validar.</div>
          </div>
          <div class="rounded-2xl bg-brand-soft ring-1 ring-blue-200 p-4">
            <div class="font-bold">🧾 Orden</div>
            <div class="muted mt-1">El código está en tu comprobante.</div>
          </div>
          <div class="rounded-2xl bg-brand-soft ring-1 ring-blue-200 p-4">
            <div class="font-bold">💬 WhatsApp</div>
            <div class="muted mt-1">Si hay dudas, te contactamos.</div>
          </div>
        </div>
      </div>
    </div>

    {{-- Form --}}
    <div class="card">
      <div class="card-header">
        <div class="section-title">Buscar</div>
        <div class="muted">Código + teléfono</div>
      </div>

      <div class="card-body">
        @if($errors->any())
          <div class="rounded-2xl bg-rose-50 ring-1 ring-rose-200 p-4 mb-4">
            <div class="font-bold text-rose-800">Revisá estos datos:</div>
            <ul class="mt-2 list-disc pl-5 text-sm text-rose-800 space-y-1">
              @foreach($errors->all() as $error)
                <li>{{ $error }}</li>
              @endforeach
            </ul>
          </div>
        @endif

        <form action="{{ route('repairs.lookup.post') }}" method="POST" class="space-y-4">
          @csrf

          <div>
            <label class="label" for="code">Código</label>
            <input id="code" name="code" class="input" value="{{ old('code') }}" required placeholder="Ej: NR-1234" />
          </div>

          <div>
            <label class="label" for="phone">Teléfono</label>
            <input id="phone" name="phone" class="input" value="{{ old('phone') }}" required placeholder="Ej: 341xxxxxxx" />
          </div>

          <button type="submit" class="btn-primary w-full">Consultar</button>

          @auth
            <div class="text-sm text-zinc-600">
              Si tenés cuenta, también podés verlo desde
              <a class="link text-brand" href="{{ route('repairs.my.index') }}">Mis reparaciones</a>.
            </div>
          @endauth
        </form>
      </div>
    </div>
  </div>
@endsection
