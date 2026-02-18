@extends('layouts.app')

@section('title', 'Admin - Configuracion')

@section('content')
@php
  $iconSettings = \App\Support\BrandAssets::url('icon_settings');
  $iconDashboard = \App\Support\BrandAssets::url('icon_dashboard');
  $iconStore = \App\Support\BrandAssets::url('icon_store');
  $iconOrders = \App\Support\BrandAssets::url('icon_orders');
  $smtpBadgeClasses = match (($statusSmtpTone ?? 'warning')) {
    'ok' => 'bg-emerald-100 text-emerald-800',
    'local' => 'bg-amber-100 text-amber-800',
    default => 'bg-rose-100 text-rose-800',
  };
@endphp
<div class="store-shell space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap rounded-3xl border border-sky-100 bg-white/90 p-4 reveal-item">
    <div class="page-head mb-0 w-full lg:w-auto">
      <div class="page-title">Configuracion</div>
      <div class="page-subtitle">Centro de control para ajustes del sistema.</div>
    </div>

    <div class="flex w-full gap-2 flex-wrap sm:w-auto">
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.dashboard') }}">Volver al panel</a>
    </div>
  </div>

  <div class="space-y-3">
    <div class="text-xs font-black uppercase tracking-wide text-zinc-500">Uso diario</div>
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <a href="{{ route('admin.settings.mail.index') }}" class="card reveal-item border-sky-200/70 bg-sky-50/30 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
        <div class="flex items-center justify-between gap-3">
          <div class="font-black text-zinc-900">Correo SMTP</div>
          <img src="{{ $iconSettings }}" alt="" class="h-5 w-5 opacity-80" loading="lazy" decoding="async">
        </div>
        <div class="mt-1 text-sm text-zinc-600">Estado de mail y prueba de envio al instante.</div>
        <div class="mt-2">
          <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-bold {{ $smtpBadgeClasses }}">{{ $statusSmtpLabel ?? 'Incompleto' }}</span>
        </div>
        <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
      </a>

      <a href="{{ route('admin.settings.reports.index') }}" class="card reveal-item border-sky-200/70 bg-sky-50/30 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
        <div class="flex items-center justify-between gap-3">
          <div class="font-black text-zinc-900">Reportes automaticos</div>
          <img src="{{ $iconDashboard }}" alt="" class="h-5 w-5 opacity-80" loading="lazy" decoding="async">
        </div>
        <div class="mt-1 text-sm text-zinc-600">Destinatarios, dia/hora y envio manual de KPIs.</div>
        <div class="mt-2">
          <span class="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700">{{ $statusReports ?? 'Sin destinatarios' }}</span>
        </div>
        <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
      </a>

      <a href="{{ route('admin.settings.business') }}" class="card reveal-item border-sky-200/70 bg-sky-50/30 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
        <div class="flex items-center justify-between gap-3">
          <div class="font-black text-zinc-900">Datos del negocio</div>
          <img src="{{ $iconSettings }}" alt="" class="h-5 w-5 opacity-80" loading="lazy" decoding="async">
        </div>
        <div class="mt-1 text-sm text-zinc-600">Telefono, direccion y horarios usados por toda la web.</div>
        <div class="mt-2">
          <span class="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700">{{ $statusBusiness ?? 'Basico' }}</span>
        </div>
        <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
      </a>

      <a href="{{ route('admin.calculations.index') }}" class="card reveal-item border-sky-200/70 bg-sky-50/30 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
        <div class="flex items-center justify-between gap-3">
          <div class="font-black text-zinc-900">Reglas de calculo</div>
          <img src="{{ $iconSettings }}" alt="" class="h-5 w-5 opacity-80" loading="lazy" decoding="async">
        </div>
        <div class="mt-1 text-sm text-zinc-600">Productos y reparaciones con calculo automatico editable.</div>
        <div class="mt-2">
          <span class="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700">Modulo</span>
        </div>
        <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
      </a>
    </div>
  </div>

  <div class="space-y-3">
    <div class="text-xs font-black uppercase tracking-wide text-zinc-500">Configuracion avanzada</div>
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <a href="{{ route('admin.settings.mail_templates.index') }}" class="card reveal-item p-4 transition hover:-translate-y-0.5 hover:shadow-md">
        <div class="flex items-center justify-between gap-3">
          <div class="font-black text-zinc-900">Plantillas de correo</div>
          <img src="{{ $iconSettings }}" alt="" class="h-5 w-5 opacity-80" loading="lazy" decoding="async">
        </div>
        <div class="mt-1 text-sm text-zinc-600">Textos de verificacion, recuperacion y confirmacion.</div>
        <div class="mt-2">
          <span class="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700">{{ $statusMailTemplates ?? 'Por defecto' }}</span>
        </div>
        <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
      </a>

      <a href="{{ route('admin.settings.help.index') }}" class="card reveal-item p-4 transition hover:-translate-y-0.5 hover:shadow-md">
        <div class="flex items-center justify-between gap-3">
          <div class="font-black text-zinc-900">Centro de ayuda</div>
          <img src="{{ $iconSettings }}" alt="" class="h-5 w-5 opacity-80" loading="lazy" decoding="async">
        </div>
        <div class="mt-1 text-sm text-zinc-600">Problemas y respuestas editables para usuarios y admin.</div>
        <div class="mt-2">
          <span class="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700">Modulo</span>
        </div>
        <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
      </a>

      <a href="{{ route('admin.settings.assets.index') }}" class="card reveal-item p-4 transition hover:-translate-y-0.5 hover:shadow-md">
        <div class="flex items-center justify-between gap-3">
          <div class="font-black text-zinc-900">Identidad visual</div>
          <img src="{{ $iconStore }}" alt="" class="h-5 w-5 opacity-80" loading="lazy" decoding="async">
        </div>
        <div class="mt-1 text-sm text-zinc-600">Logos, iconos y recursos visuales editables.</div>
        <div class="mt-2">
          <span class="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700">Modulo</span>
        </div>
        <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
      </a>

      <a href="{{ route('admin.two_factor.settings') }}" class="card reveal-item p-4 transition hover:-translate-y-0.5 hover:shadow-md">
        <div class="flex items-center justify-between gap-3">
          <div class="font-black text-zinc-900">Seguridad 2FA</div>
          <img src="{{ $iconSettings }}" alt="" class="h-5 w-5 opacity-80" loading="lazy" decoding="async">
        </div>
        <div class="mt-1 text-sm text-zinc-600">Gestion de segundo factor para acceso admin.</div>
        <div class="mt-2">
          <span class="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700">Modulo</span>
        </div>
        <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
      </a>

      <a href="{{ route('admin.whatsapp_templates.index') }}" class="card reveal-item p-4 transition hover:-translate-y-0.5 hover:shadow-md">
        <div class="flex items-center justify-between gap-3">
          <div class="font-black text-zinc-900">Plantillas WhatsApp</div>
          <img src="{{ $iconOrders }}" alt="" class="h-5 w-5 opacity-80" loading="lazy" decoding="async">
        </div>
        <div class="mt-1 text-sm text-zinc-600">Mensajes de seguimiento para reparaciones.</div>
        <div class="mt-2">
          <span class="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700">Modulo</span>
        </div>
        <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
      </a>

      <a href="{{ route('admin.orders_whatsapp_templates.index') }}" class="card reveal-item p-4 transition hover:-translate-y-0.5 hover:shadow-md">
        <div class="flex items-center justify-between gap-3">
          <div class="font-black text-zinc-900">WhatsApp pedidos</div>
          <img src="{{ $iconOrders }}" alt="" class="h-5 w-5 opacity-80" loading="lazy" decoding="async">
        </div>
        <div class="mt-1 text-sm text-zinc-600">Mensajes por estado para comunicacion de pedidos.</div>
        <div class="mt-2">
          <span class="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700">Modulo</span>
        </div>
        <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
      </a>
    </div>
  </div>
</div>
@endsection
