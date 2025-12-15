@extends('layouts.app')

@section('title', 'Ingresar')

@section('content')
  <div class="max-w-md mx-auto">
    <div class="page-head">
      <div class="page-title">Ingresar</div>
      <div class="page-subtitle">Accedé para ver tus pedidos y reparaciones.</div>
    </div>

    <div class="card">
      <div class="card-body">
        <form method="POST" action="{{ route('login.post') }}" class="grid gap-4">
          @csrf

          <div>
            <label for="email">Email</label>
            <input id="email" name="email" type="email" value="{{ old('email') }}" required placeholder="tu@email.com">
          </div>

          <div>
            <label for="password">Contraseña</label>
            <input id="password" name="password" type="password" required placeholder="••••••••">
          </div>

          <label class="flex items-center gap-2 text-sm text-zinc-700 font-bold">
            <input type="checkbox" name="remember" value="1" style="width:auto">
            Recordarme
          </label>

          <button class="btn-primary w-full" type="submit">Entrar</button>

          <div class="muted text-center">
            ¿No tenés cuenta?
            <a class="font-black" href="{{ route('register') }}">Registrate</a>
          </div>
        </form>
      </div>
    </div>
  </div>
@endsection
