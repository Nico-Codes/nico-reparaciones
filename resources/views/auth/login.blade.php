@extends('layouts.app')

@section('title', 'Ingresar')
@section('suppress_global_alerts', '1')

@section('content')
<div class="mx-auto w-full max-w-md px-4 py-6 sm:py-8">
  <div class="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
    <div class="mb-5">
      <h1 class="text-xl font-black tracking-tight text-zinc-900">Ingresar</h1>
      <p class="mt-1 text-sm text-zinc-600">Accede para ver tus pedidos y reparaciones.</p>
    </div>

    @if ($errors->any())
      <div class="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
        Revisa los datos ingresados.
      </div>
    @endif

    @if (session('success'))
      <div class="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        {{ session('success') }}
      </div>
    @endif

    @if (config('services.google.client_id'))
      <a href="{{ route('auth.google.redirect') }}"
        class="mb-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50">
        Continuar con Google
      </a>
    @endif

    <form method="POST" action="{{ route('login.post') }}" class="space-y-4">
      @csrf

      <div>
        <label class="text-xs font-black uppercase tracking-wide text-zinc-600">Email</label>
        <input
          type="email"
          name="email"
          value="{{ old('email') }}"
          required
          autofocus
          autocomplete="email"
          class="mt-1 h-11 w-full rounded-2xl border bg-white px-3 text-sm outline-none focus:ring-2 border-zinc-200 focus:border-sky-300 focus:ring-sky-100 @error('email') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
          placeholder="tu@email.com"
        >
        @error('email')
          <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
        @enderror
      </div>

      <div>
        <label class="text-xs font-black uppercase tracking-wide text-zinc-600">Contrasena</label>
        <input
          type="password"
          name="password"
          required
          autocomplete="current-password"
          class="mt-1 h-11 w-full rounded-2xl border bg-white px-3 text-sm outline-none focus:ring-2 border-zinc-200 focus:border-sky-300 focus:ring-sky-100 @error('password') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
          placeholder="********"
        >
        @error('password')
          <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
        @enderror
      </div>

      <label class="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
        <input type="checkbox" name="remember" class="h-4 w-4 rounded border-zinc-300">
        Recordarme
      </label>

      <div class="text-right text-sm">
        <a href="{{ route('password.request') }}" class="font-semibold text-sky-700 hover:text-sky-800">
          Olvide mi contrasena
        </a>
      </div>

      <button class="btn-primary h-11 w-full justify-center">Ingresar</button>
    </form>

    <div class="mt-5 text-center text-sm text-zinc-600">
      No tienes cuenta?
      <a href="{{ route('register') }}" class="font-semibold text-sky-700 hover:text-sky-800">Crear cuenta</a>
    </div>

    <div class="mt-4 grid gap-2 sm:grid-cols-2">
      <a href="{{ route('store.index') }}" class="btn-ghost h-10 w-full justify-center">Ir a la tienda</a>
      <a href="{{ route('repairs.lookup') }}" class="btn-ghost h-10 w-full justify-center">Consultar reparacion</a>
    </div>
  </div>
</div>
@endsection
