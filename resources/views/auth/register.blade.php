@extends('layouts.app')

@section('title', 'Crear cuenta - NicoReparaciones')

@section('content')
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
    {{-- Info --}}
    <div class="card">
      <div class="card-body">
        <h1 class="page-title">Crear cuenta</h1>
        <p class="muted mt-2">
          Con tu cuenta vas a poder ver tus pedidos y tus reparaciones en un solo lugar.
        </p>

        <div class="mt-5 rounded-2xl bg-brand-soft ring-1 ring-blue-200 p-4">
          <div class="font-bold">💡 Tip</div>
          <div class="muted mt-1">
            Si no querés crear cuenta, podés usar la consulta por código desde
            <a class="link text-brand" href="{{ route('repairs.lookup') }}">Consultar reparación</a>.
          </div>
        </div>

        <div class="mt-5 text-sm text-zinc-600">
          ¿Ya tenés cuenta?
          <a class="link text-brand" href="{{ route('login') }}">Ingresá acá</a>.
        </div>
      </div>
    </div>

    {{-- Form --}}
    <div class="card">
      <div class="card-header">
        <div class="section-title">Registro</div>
        <div class="muted">Completa tus datos</div>
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

        <form action="{{ route('register.post') }}" method="POST" class="space-y-4">
          @csrf

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label" for="name">Nombre</label>
              <input id="name" name="name" class="input" value="{{ old('name') }}" required placeholder="Nico" />
            </div>
            <div>
              <label class="label" for="last_name">Apellido (opcional)</label>
              <input id="last_name" name="last_name" class="input" value="{{ old('last_name') }}" placeholder="Machado" />
            </div>
          </div>

          <div>
            <label class="label" for="phone">Teléfono (opcional)</label>
            <input id="phone" name="phone" class="input" value="{{ old('phone') }}" placeholder="341..." />
          </div>

          <div>
            <label class="label" for="email">Correo</label>
            <input id="email" name="email" type="email" class="input" value="{{ old('email') }}" required placeholder="tu@email.com" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label" for="password">Contraseña</label>
              <input id="password" name="password" type="password" class="input" required placeholder="mínimo 6 caracteres" />
            </div>
            <div>
              <label class="label" for="password_confirmation">Confirmar</label>
              <input id="password_confirmation" name="password_confirmation" type="password" class="input" required placeholder="repetí la contraseña" />
            </div>
          </div>

          <button type="submit" class="btn-primary w-full">Crear cuenta</button>

          <div class="text-sm text-zinc-600">
            ¿Ya tenés cuenta?
            <a class="link text-brand" href="{{ route('login') }}">Ingresá</a>.
          </div>
        </form>
      </div>
    </div>
  </div>
@endsection
