@extends('layouts.app')

@section('title', 'Admin - Configuracion')

@section('content')
<div class="space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0 w-full lg:w-auto">
      <div class="page-title">Configuracion</div>
      <div class="page-subtitle">Centro de control para ajustes del sistema.</div>
    </div>

    <div class="flex w-full gap-2 flex-wrap sm:w-auto">
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.dashboard') }}">Volver al panel</a>
    </div>
  </div>

  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    <a href="{{ route('admin.settings.business') }}" class="card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="font-black text-zinc-900">Datos del negocio</div>
      <div class="mt-1 text-sm text-zinc-600">Telefono, direccion y horarios usados por toda la web.</div>
      <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
    </a>

    <a href="{{ route('admin.settings.reports.index') }}" class="card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="font-black text-zinc-900">Reportes automaticos</div>
      <div class="mt-1 text-sm text-zinc-600">Destinatarios, dia/hora y envio manual de KPIs.</div>
      <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
    </a>

    <a href="{{ route('admin.settings.mail.index') }}" class="card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="font-black text-zinc-900">Correo SMTP</div>
      <div class="mt-1 text-sm text-zinc-600">Estado de mail y prueba de envio al instante.</div>
      <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
    </a>

    <a href="{{ route('admin.settings.mail_templates.index') }}" class="card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="font-black text-zinc-900">Plantillas de correo</div>
      <div class="mt-1 text-sm text-zinc-600">Textos de verificacion, recuperacion y confirmacion.</div>
      <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
    </a>

    <a href="{{ route('admin.settings.assets.index') }}" class="card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="font-black text-zinc-900">Identidad visual</div>
      <div class="mt-1 text-sm text-zinc-600">Logos, iconos y recursos visuales editables.</div>
      <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
    </a>

    <a href="{{ route('admin.two_factor.settings') }}" class="card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="font-black text-zinc-900">Seguridad 2FA</div>
      <div class="mt-1 text-sm text-zinc-600">Gestion de segundo factor para acceso admin.</div>
      <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
    </a>

    <a href="{{ route('admin.whatsapp_templates.index') }}" class="card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="font-black text-zinc-900">Plantillas WhatsApp</div>
      <div class="mt-1 text-sm text-zinc-600">Mensajes de seguimiento para reparaciones.</div>
      <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
    </a>

    <a href="{{ route('admin.orders_whatsapp_templates.index') }}" class="card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="font-black text-zinc-900">WhatsApp pedidos</div>
      <div class="mt-1 text-sm text-zinc-600">Mensajes por estado para comunicacion de pedidos.</div>
      <div class="mt-3 text-xs font-bold text-sky-700">Abrir modulo</div>
    </a>
  </div>
</div>
@endsection
