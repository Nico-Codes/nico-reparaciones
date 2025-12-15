@extends('layouts.app')

@section('title', 'Crear cuenta')

@section('content')
  <div class="max-w-md mx-auto">
    <div class="page-head">
      <div class="page-title">Crear cuenta</div>
      <div class="page-subtitle">En 1 minuto y ya podés comprar y seguir reparaciones.</div>
    </div>

    <div class="card">
      <div class="card-body">
        <form method="POST" action="{{ route('register.post') }}" class="grid gap-4">
          @csrf

          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label for="name">Nombre</label>
              <input id="name" name="name" value="{{ old('name') }}" required placeholder="Nico">
            </div>

            <div>
              <label for="last_name">Apellido (opcional)</label>
              <input id="last_name" name="last_name" value="{{ old('last_name') }}" placeholder="Machado">
            </div>
          </div>

          <div>
            <label for="phone">Teléfono (opcional)</label>
            <input id="phone" name="phone" value="{{ old('phone') }}" placeholder="Ej: 341 555-0000">
          </div>

          <div>
            <label for="email">Email</label>
            <input id="email" name="email" type="email" value="{{ old('email') }}" required placeholder="tu@email.com">
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label for="password">Contraseña</label>
              <input id="password" name="password" type="password" required placeholder="mínimo 6">
            </div>

            <div>
              <label for="password_confirmation">Repetir contraseña</label>
              <input id="password_confirmation" name="password_confirmation" type="password" required placeholder="••••••••">
            </div>
          </div>

          <button class="btn-primary w-full" type="submit">Crear cuenta</button>

          <div class="muted text-center">
            ¿Ya tenés cuenta?
            <a class="font-black" href="{{ route('login') }}">Ingresar</a>
          </div>
        </form>
      </div>
    </div>
  </div>
@endsection
