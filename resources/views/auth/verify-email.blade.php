@extends('layouts.app')

@section('title', 'Verificar correo')
@section('suppress_global_alerts', '1')

@section('content')
<div class="mx-auto w-full max-w-md px-4 py-6 sm:py-8">
  <div class="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
    <div class="mb-4">
      <h1 class="text-xl font-black tracking-tight text-zinc-900">Verifica tu correo</h1>
      <p class="mt-1 text-sm text-zinc-600">
        Te enviamos un enlace de verificacion a <span class="font-semibold text-zinc-900">{{ auth()->user()->email }}</span>.
      </p>
    </div>

    @if (($verificationRequiredFor ?? '') === 'checkout')
      <div class="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Para finalizar tu compra necesitas verificar tu correo primero.
      </div>
    @endif

    @if (session('status') === 'verification-link-sent')
      <div class="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Te enviamos un nuevo correo de verificacion.
      </div>
    @endif

    @if (session('success'))
      <div class="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        {{ session('success') }}
      </div>
    @endif

    <form method="POST" action="{{ route('verification.send') }}" class="space-y-3">
      @csrf
      <button class="btn-primary h-11 w-full justify-center">Reenviar correo de verificacion</button>
    </form>

    @if (Route::has('account.edit'))
      <a href="{{ route('account.edit') }}" class="btn-outline mt-3 h-11 w-full justify-center">
        Cambiar email en mi cuenta
      </a>
    @endif

    @if (($verificationRequiredFor ?? '') === 'checkout' && !empty($postVerificationRedirect ?? ''))
      <div class="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
        Cuando verifiques tu correo te llevaremos automaticamente al checkout.
      </div>
    @endif

    <form method="POST" action="{{ route('logout') }}" class="mt-3">
      @csrf
      <button type="submit" class="btn-ghost h-11 w-full justify-center">Cerrar sesion</button>
    </form>
  </div>
</div>
@endsection
