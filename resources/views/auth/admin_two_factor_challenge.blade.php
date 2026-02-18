@extends('layouts.app')

@section('title', 'Verificacion 2FA Admin')
@section('suppress_global_alerts', true)

@section('content')
<div class="store-shell space-y-6">
  <div class="reveal-item mx-auto w-full max-w-md">
  <div class="card">
    <div class="card-head">
      <div>
        <div class="font-black">Verificacion 2FA requerida</div>
        <div class="text-xs text-zinc-500">Ingresa tu codigo de autenticador o un codigo de recuperacion para acceder al panel admin.</div>
      </div>
      <span class="badge-sky">Admin</span>
    </div>

    <div class="card-body space-y-4">
      @if ($errors->any())
        <div class="alert-error">
          <ul class="list-disc pl-5 space-y-1">
            @foreach ($errors->all() as $error)
              <li>{{ $error }}</li>
            @endforeach
          </ul>
        </div>
      @endif

      <form method="POST" action="{{ route('admin.two_factor.challenge.verify') }}" class="grid gap-3" data-disable-on-submit>
        @csrf
        <div class="grid gap-2">
          <label for="code">Codigo 2FA o codigo de recuperacion</label>
          <input
            id="code"
            name="code"
            type="text"
            value="{{ old('code') }}"
            class="h-11 uppercase tracking-[0.18em]"
            maxlength="64"
            autocomplete="one-time-code"
            required>
        </div>
        <button class="btn-primary h-11 w-full justify-center" type="submit">Validar y continuar</button>
      </form>

      <form method="POST" action="{{ route('logout') }}">
        @csrf
        <button type="submit" class="btn-outline h-11 w-full justify-center">Cerrar sesion</button>
      </form>
    </div>
  </div>
  </div>
</div>
@endsection
