@extends('layouts.app')

@section('title', 'Crear cuenta')

@section('content')
  <div class="max-w-md mx-auto">
    <div class="page-head">
      <div class="page-title">Crear cuenta</div>
      <div class="page-subtitle">Te permite seguir tus pedidos y reparaciones.</div>
    </div>

    <div class="card">
      <div class="card-body">
        <form method="POST" action="{{ route('register') }}" class="grid gap-4">
          @csrf

          <div>
            <label for="name">Nombre</label>
            <input id="name" type="text" name="name" value="{{ old('name') }}" required>
          </div>

          <div>
            <label for="email">Email</label>
            <input id="email" type="email" name="email" value="{{ old('email') }}" required>
          </div>

          <div>
            <label for="password">Contraseña</label>
            <input id="password" type="password" name="password" required>
          </div>

          <div>
            <label for="password_confirmation">Repetir contraseña</label>
            <input id="password_confirmation" type="password" name="password_confirmation" required>
          </div>

          <button class="btn-primary w-full">Crear cuenta</button>

          <div class="muted text-center">
            ¿Ya tenés cuenta?
            <a href="{{ route('login') }}" class="font-bold">Ingresar</a>
          </div>
        </form>
      </div>
    </div>
  </div>
@endsection
