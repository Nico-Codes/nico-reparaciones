@extends('layouts.app')

@section('title', 'Recuperar contrasena')
@section('suppress_global_alerts', '1')

@section('content')
<div class="mx-auto w-full max-w-md px-4 py-6 sm:py-8">
  <div class="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
    <div class="mb-5">
      <h1 class="text-xl font-black tracking-tight text-zinc-900">Recuperar contrasena</h1>
      <p class="mt-1 text-sm text-zinc-600">Ingresa tu email y te enviaremos un enlace para restablecerla.</p>
    </div>

    @if (session('status'))
      <div class="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        {{ session('status') }}
      </div>
    @endif

    @if ($errors->any())
      <div class="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
        Revisa los datos ingresados.
      </div>
    @endif

    <form method="POST" action="{{ route('password.email') }}" class="space-y-4">
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

      <button class="btn-primary h-11 w-full justify-center">Enviar enlace</button>
    </form>

    <div class="mt-5 text-center text-sm text-zinc-600">
      <a href="{{ route('login') }}" class="font-semibold text-sky-700 hover:text-sky-800">Volver a ingresar</a>
    </div>
  </div>
</div>
@endsection

