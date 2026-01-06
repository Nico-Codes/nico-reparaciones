@extends('layouts.app')

@section('title', 'Crear cuenta')

@section('content')
<div class="mx-auto w-full max-w-md px-4 py-8">
  <div class="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
    <div class="flex items-center gap-3">
      <div class="h-11 w-11 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <img src="{{ asset('images/logo-nico.png') }}" alt="NicoReparaciones" class="h-full w-full object-contain">
      </div>
      <div>
        <h1 class="text-xl font-black tracking-tight">Crear cuenta</h1>
        <p class="mt-0.5 text-sm text-zinc-600">En 30 segundos para comprar y seguir reparaciones.</p>
      </div>
    </div>

    @if ($errors->any())
      <div class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
        Revisá los campos marcados.
      </div>
    @endif


    <form method="POST" action="{{ route('register.post') }}" class="mt-5 space-y-4">
      @csrf

      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="text-xs font-semibold text-zinc-700">Nombre</label>
          <input
            type="text"
            name="name"
            value="{{ old('name') }}"
            required
            autocomplete="given-name"
            class="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2
                  border-zinc-200 focus:border-sky-300 focus:ring-sky-100
                  @error('name') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
            placeholder="Juan"
          >
          @error('name')
            <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
          @enderror

        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Apellido</label>
          <input
            type="text"
            name="last_name"
            value="{{ old('last_name') }}"
            required
            autocomplete="family-name"
            class="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2
                  border-zinc-200 focus:border-sky-300 focus:ring-sky-100
                  @error('last_name') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
            placeholder="Fernandez"
          >
          @error('last_name')
            <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
          @enderror

        </div>
      </div>

      <div>
        <label class="text-xs font-semibold text-zinc-700">Teléfono / WhatsApp</label>
        <input
          type="text"
          name="phone"
          value="{{ old('phone') }}"
          required
          autocomplete="tel"
          class="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2
                border-zinc-200 focus:border-sky-300 focus:ring-sky-100
                @error('phone') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
          placeholder="Ej: 341 555-0000"
        >
        @error('phone')
          <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
        @enderror

      </div>

      <div>
        <label class="text-xs font-semibold text-zinc-700">Email</label>
        <input
          type="email"
          name="email"
          value="{{ old('email') }}"
          required
          autocomplete="email"
          class="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2
                border-zinc-200 focus:border-sky-300 focus:ring-sky-100
                @error('email') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
          placeholder="tu@email.com"
        >
        @error('email')
          <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
        @enderror

      </div>

      <div>
        <label class="text-xs font-semibold text-zinc-700">Contraseña</label>
        <input
          type="password"
          name="password"
          required
          autocomplete="new-password"
          class="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          placeholder="••••••••"
        >
      </div>

      <div>
        <label class="text-xs font-semibold text-zinc-700">Repetir contraseña</label>
        <input
          type="password"
          name="password_confirmation"
          required
          autocomplete="new-password"
          class="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          placeholder="••••••••"
        >
      </div>

      <button class="w-full rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 active:scale-[.99]">
        Crear cuenta
      </button>
    </form>

    <div class="mt-5 text-center text-sm text-zinc-600">
      ¿Ya tenés cuenta?
      <a href="{{ route('login') }}" class="font-semibold text-sky-700 hover:text-sky-800">
        Ingresar
      </a>
    </div>

    <div class="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600">
      Al registrarte vas a poder ver “Mis pedidos” y “Mis reparaciones”.
    </div>
  </div>
</div>
@endsection
