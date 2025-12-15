@extends('layouts.app')

@section('title', 'Ingresar - NicoReparaciones')

@section('content')
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
    {{-- Info --}}
    <div class="card">
      <div class="card-body">
        <h1 class="page-title">Ingresar</h1>
        <p class="muted mt-2">
          Entrá para ver tus pedidos, tu carrito y el seguimiento de tus reparaciones.
        </p>

        <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="rounded-2xl bg-brand-soft ring-1 ring-blue-200 p-4">
            <div class="font-bold">🧺 Carrito</div>
            <div class="muted mt-1">Guardá productos y finalizá en 1 click.</div>
          </div>
          <div class="rounded-2xl bg-brand-soft ring-1 ring-blue-200 p-4">
            <div class="font-bold">📦 Pedidos</div>
            <div class="muted mt-1">Historial y estado de tus compras.</div>
          </div>
          <div class="rounded-2xl bg-brand-soft ring-1 ring-blue-200 p-4">
            <div class="font-bold">🛠️ Reparaciones</div>
            <div class="muted mt-1">Seguimiento desde el celu.</div>
          </div>
          <div class="rounded-2xl bg-brand-soft ring-1 ring-blue-200 p-4">
            <div class="font-bold">🔎 Consulta rápida</div>
            <div class="muted mt-1">También podés consultar por código.</div>
          </div>
        </div>

        <div class="mt-5 text-sm text-zinc-600">
          ¿No querés iniciar sesión? Podés ir directo a
          <a class="link text-brand" href="{{ route('repairs.lookup') }}">Consultar reparación</a>.
        </div>
      </div>
    </div>

    {{-- Form --}}
    <div class="card">
      <div class="card-header">
        <div class="section-title">Acceso</div>
        <div class="muted">Usá tu correo y contraseña</div>
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

        <form action="{{ route('login.post') }}" method="POST" class="space-y-4">
          @csrf

          <div>
            <label class="label" for="email">Correo</label>
            <input
              id="email"
              name="email"
              type="email"
              class="input"
              value="{{ old('email') }}"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label class="label" for="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              class="input"
              placeholder="••••••••"
              required
            />
          </div>

          <label class="inline-flex items-center gap-2 text-sm text-zinc-700 tap">
            <input type="checkbox" name="remember" class="accent-[rgb(var(--brand))]">
            Recordarme
          </label>

          <button type="submit" class="btn-primary w-full">Ingresar</button>

          <div class="text-sm text-zinc-600">
            ¿No tenés cuenta?
            <a class="link text-brand" href="{{ route('register') }}">Creala acá</a>.
          </div>
        </form>
      </div>
    </div>
  </div>
@endsection
