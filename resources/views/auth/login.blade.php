@extends('layouts.app')

@section('title', 'Ingresar')

@section('content')
  <div class="max-w-md mx-auto">
    <div class="page-head">
      <div class="page-title">Ingresar</div>
      <div class="page-subtitle">Accedé para ver pedidos y reparaciones.</div>
    </div>

    <div class="card">
      <div class="card-body">
        <form method="POST" action="{{ route('login') }}" class="grid gap-4">
          @csrf

          <div>
            <label for="email">Email</label>
            <input id="email" type="email" name="email" value="{{ old('email') }}" required autofocus>
          </div>

          <div>
            <label for="password">Contraseña</label>
            <input id="password" type="password" name="password" required>
          </div>

          <button class="btn-primary w-full">Ingresar</button>

          <div class="muted text-center">
            ¿No tenés cuenta?
            <a href="{{ route('register') }}" class="font-bold">Registrate</a>
          </div>
        </form>
      </div>
    </div>
  </div>
@endsection
