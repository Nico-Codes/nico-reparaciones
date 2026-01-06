@extends('layouts.app')

@section('title', 'Ingresar')

@section('content')
<div class="mx-auto w-full max-w-md px-4 py-8">
  <div class="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
    <div class="flex items-center gap-3">
      <div class="h-11 w-11 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <img src="{{ asset('images/logo-nico.png') }}" alt="NicoReparaciones" class="h-full w-full object-contain">
      </div>
      <div>
        <h1 class="text-xl font-black tracking-tight">Ingresar</h1>
        <p class="mt-0.5 text-sm text-zinc-600">Accedé para ver pedidos y reparaciones.</p>
      </div>
    </div>

    @if ($errors->any())
      <div class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
        Revisá los campos marcados.
      </div>
    @endif


    @if (session('success'))
      <div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        {{ session('success') }}
      </div>
    @endif

    @if (config('services.google.client_id'))
      <a href="{{ route('auth.google.redirect') }}"
        class="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50">
        Continuar con Google
      </a>

      <div class="my-4 flex items-center gap-3">
        <div class="h-px flex-1 bg-zinc-200"></div>
        <div class="text-xs text-zinc-500">o</div>
        <div class="h-px flex-1 bg-zinc-200"></div>
      </div>
    @endif


    <form method="POST" action="{{ route('login.post') }}" class="mt-5 space-y-4">

      @csrf

      <div>
        <label class="text-xs font-semibold text-zinc-700">Email</label>
        <input type="email" name="email" value="{{ old('email') }}" required autofocus autocomplete="email"
              class="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2
                      border-zinc-200 focus:border-sky-300 focus:ring-sky-100
                      @error('email') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
              placeholder="tu@email.com">

        @error('email')
          <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
        @enderror
      </div>


      <div>
        <label class="text-xs font-semibold text-zinc-700">Contraseña</label>
        <input type="password" name="password" required autocomplete="current-password"
              class="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2
                      border-zinc-200 focus:border-sky-300 focus:ring-sky-100
                      @error('password') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
              placeholder="••••••••">

        @error('password')
          <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
        @enderror
      </div>


      <label class="flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" name="remember" class="h-4 w-4 rounded border-zinc-300">
        Recordarme
      </label>

      <button class="w-full rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 active:scale-[.99]">
        Ingresar
      </button>
    </form>

    <div class="mt-5 text-center text-sm text-zinc-600">
      ¿No tenés cuenta?
      <a href="{{ route('register') }}" class="font-semibold text-sky-700 hover:text-sky-800">
        Crear cuenta
      </a>
    </div>

    <div class="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600">
      Tip: si solo querés ver el estado de una reparación, usá “Consultar reparación” desde el menú.
    </div>
  </div>
</div>
@endsection
