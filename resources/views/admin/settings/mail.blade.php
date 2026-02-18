@extends('layouts.app')

@section('title', 'Admin - Correo SMTP')

@section('content')
@php
  $smtpStatus = (string) ($smtpHealth['status'] ?? 'warning');
  $smtpBadgeClasses = match ($smtpStatus) {
    'ok' => 'bg-emerald-100 text-emerald-800',
    'local' => 'bg-amber-100 text-amber-800',
    default => 'bg-rose-100 text-rose-800',
  };
@endphp

<div class="store-shell space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap rounded-3xl border border-sky-100 bg-white/90 p-4 reveal-item">
    <div class="page-head mb-0 w-full lg:w-auto">
      <div class="page-title">Correo SMTP</div>
      <div class="page-subtitle">Valida configuracion de correo y envia una prueba.</div>
    </div>
    @include('admin.settings.partials.top_actions')
  </div>

  <div class="card reveal-item">
    <div class="card-body grid gap-3">
      <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
        <div class="flex items-center justify-between gap-2">
          <div class="text-sm font-bold text-zinc-900">Estado SMTP</div>
          <span class="rounded-full px-2 py-0.5 text-xs font-bold {{ $smtpBadgeClasses }}">
            {{ $smtpHealth['label'] ?? 'Incompleto' }}
          </span>
        </div>
        <div class="mt-1 text-xs text-zinc-600">{{ $smtpHealth['summary'] ?? 'Configuracion incompleta para envio real.' }}</div>
        <div class="mt-2 text-xs text-zinc-600">
          Mailer: <span class="font-semibold text-zinc-800">{{ $smtpHealth['mailer'] ?? '-' }}</span>
          |
          From: <span class="font-semibold text-zinc-800">{{ $smtpHealth['from_address'] ?? '-' }}</span>
        </div>
        @if(!empty($smtpHealth['issues']))
          <ul class="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-600">
            @foreach($smtpHealth['issues'] as $issue)
              <li>{{ $issue }}</li>
            @endforeach
          </ul>
        @endif
      </div>

      <form method="POST" action="{{ route('admin.settings.smtp_test.send') }}" class="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        @csrf
        <div class="grid gap-2">
          <label>Email destino para prueba</label>
          <input
            type="email"
            name="test_email"
            class="h-11"
            value="{{ old('test_email', $smtpDefaultTo ?? '') }}"
            placeholder="tu-email@dominio.com"
            required>
        </div>
        <button class="btn-primary h-11 w-full justify-center sm:w-auto" type="submit">
          Enviar prueba SMTP
        </button>
      </form>

      <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
        Si falla, revisa variables <code>MAIL_*</code> del entorno y proveedor SMTP.
      </div>
    </div>
  </div>
</div>
@endsection
