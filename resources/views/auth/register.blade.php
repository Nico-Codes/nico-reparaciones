@extends('layouts.app')

@section('title', 'Crear cuenta')
@section('suppress_global_alerts', '1')

@section('content')
<div class="mx-auto w-full max-w-md px-4 py-6 sm:py-8">
  <div class="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
    <div class="mb-5">
      <h1 class="text-xl font-black tracking-tight text-zinc-900">Crear cuenta</h1>
      <p class="mt-1 text-sm text-zinc-600">Registrate para comprar y seguir tus pedidos.</p>
    </div>

    @if ($errors->any())
      <div class="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
        Revisa los datos ingresados.
      </div>
    @endif

    <form method="POST" action="{{ route('register.post') }}" class="space-y-4" data-disable-on-submit>
      @csrf

      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="text-xs font-black uppercase tracking-wide text-zinc-600">Nombre</label>
          <input
            type="text"
            name="name"
            value="{{ old('name') }}"
            required
            autocomplete="given-name"
            class="mt-1 h-11 w-full rounded-2xl border bg-white px-3 text-sm outline-none focus:ring-2 border-zinc-200 focus:border-sky-300 focus:ring-sky-100 @error('name') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
            placeholder="Juan"
          >
          @error('name')
            <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
          @enderror
        </div>

        <div>
          <label class="text-xs font-black uppercase tracking-wide text-zinc-600">Apellido</label>
          <input
            type="text"
            name="last_name"
            value="{{ old('last_name') }}"
            required
            autocomplete="family-name"
            class="mt-1 h-11 w-full rounded-2xl border bg-white px-3 text-sm outline-none focus:ring-2 border-zinc-200 focus:border-sky-300 focus:ring-sky-100 @error('last_name') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
            placeholder="Fernandez"
          >
          @error('last_name')
            <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
          @enderror
        </div>
      </div>

      <div>
        <label class="text-xs font-black uppercase tracking-wide text-zinc-600">Telefono / WhatsApp</label>
        <input
          type="text"
          name="phone"
          value="{{ old('phone') }}"
          required
          autocomplete="tel"
          class="mt-1 h-11 w-full rounded-2xl border bg-white px-3 text-sm outline-none focus:ring-2 border-zinc-200 focus:border-sky-300 focus:ring-sky-100 @error('phone') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
          placeholder="Ej: 341 555-0000"
        >
        @error('phone')
          <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
        @enderror
      </div>

      <div>
        <label class="text-xs font-black uppercase tracking-wide text-zinc-600">Email</label>
        <input
          type="email"
          name="email"
          value="{{ old('email') }}"
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
        <label class="text-xs font-black uppercase tracking-wide text-zinc-600">Contrasena</label>
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
        <div class="mt-1 text-xs text-zinc-500">Minimo 8 caracteres.</div>
      </div>

      <div>
        <label class="text-xs font-black uppercase tracking-wide text-zinc-600">Repetir contrasena</label>
        <input
          type="password"
          name="password_confirmation"
          required
          autocomplete="new-password"
          class="mt-1 h-11 w-full rounded-2xl border bg-white px-3 text-sm outline-none focus:ring-2 border-zinc-200 focus:border-sky-300 focus:ring-sky-100 @error('password_confirmation') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
          placeholder="********"
        >
        @error('password_confirmation')
          <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
        @enderror
      </div>

      <button class="btn-primary h-11 w-full justify-center">Crear cuenta</button>
    </form>

    <div class="mt-5 text-center text-sm text-zinc-600">
      Ya tienes cuenta?
      <a href="{{ route('login') }}" class="font-semibold text-sky-700 hover:text-sky-800">Ingresar</a>
    </div>
  </div>
</div>
@endsection
