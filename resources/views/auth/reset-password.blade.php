@extends('layouts.app')

@section('title', 'Restablecer contrasena')
@section('suppress_global_alerts', '1')

@section('content')
<div class="store-shell mx-auto w-full max-w-md px-4">
  <div class="store-hero mb-4 reveal-item">
    <h1 class="text-xl font-black tracking-tight text-zinc-900">Restablecer contrasena</h1>
    <p class="mt-1 text-sm text-zinc-600">Define una nueva contrasena para volver a ingresar.</p>
  </div>

  <div class="card rounded-3xl p-5 sm:p-6 reveal-item">
    <div class="mb-5">
      <div class="text-xs font-black uppercase tracking-wide text-sky-700">Seguridad</div>
      <h2 class="text-lg font-black tracking-tight text-zinc-900">Nueva contrasena</h2>
      <p class="mt-1 text-sm text-zinc-600">Guarda una contrasena segura.</p>
    </div>

    @if ($errors->any())
      <div class="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
        Revisa los datos ingresados.
      </div>
    @endif

    <form method="POST" action="{{ route('password.update') }}" class="space-y-4" data-disable-on-submit>
      @csrf

      <input type="hidden" name="token" value="{{ $token }}">

      <div>
        <label class="text-xs font-black uppercase tracking-wide text-zinc-600">Email</label>
        <input
          type="email"
          name="email"
          value="{{ old('email', $email) }}"
          required
          autocomplete="email"
          class="mt-1 h-11 w-full rounded-2xl border bg-white px-3 text-sm outline-none focus:ring-2 border-zinc-200 focus:border-sky-300 focus:ring-sky-100 @error('email') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
          placeholder="tu@email.com"
        >
        @error('email')
          <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
        @enderror
      </div>

      <div>
        <label class="text-xs font-black uppercase tracking-wide text-zinc-600">Nueva contrasena</label>
        <input
          type="password"
          name="password"
          required
          autocomplete="new-password"
          class="mt-1 h-11 w-full rounded-2xl border bg-white px-3 text-sm outline-none focus:ring-2 border-zinc-200 focus:border-sky-300 focus:ring-sky-100 @error('password') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
          placeholder="********"
        >
        @error('password')
          <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
        @enderror
      </div>

      <div>
        <label class="text-xs font-black uppercase tracking-wide text-zinc-600">Repetir contrasena</label>
        <input
          type="password"
          name="password_confirmation"
          required
          autocomplete="new-password"
          class="mt-1 h-11 w-full rounded-2xl border bg-white px-3 text-sm outline-none focus:ring-2 border-zinc-200 focus:border-sky-300 focus:ring-sky-100"
          placeholder="********"
        >
      </div>

      <button class="btn-primary h-11 w-full justify-center">Guardar nueva contrasena</button>
    </form>
  </div>
</div>
@endsection
