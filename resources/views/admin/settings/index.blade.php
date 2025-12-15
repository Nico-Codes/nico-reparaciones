@extends('layouts.app')

@section('title', 'Admin — Configuración')

@section('content')
<div class="space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0">
      <h1 class="page-title">Configuración del negocio</h1>
      <p class="page-subtitle">Datos que se usan en WhatsApp y en mensajes al cliente.</p>
    </div>

    <div class="flex gap-2 flex-wrap">
      <a class="btn-outline" href="{{ route('admin.whatsapp_templates.index') }}">Plantillas WhatsApp</a>
      <a class="btn-outline" href="{{ route('admin.dashboard') }}">Volver</a>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <div class="font-extrabold text-zinc-900">Placeholders nuevos</div>
        <div class="text-xs text-zinc-500">Se reemplazan automáticamente en los mensajes.</div>
      </div>
    </div>
    <div class="card-body text-sm">
      <ul class="list-disc pl-5 space-y-1">
        <li><code>{shop_address}</code> — Dirección del local</li>
        <li><code>{shop_hours}</code> — Horarios</li>
      </ul>
      <p class="muted mt-3">
        Tip: en “Listo para retirar” conviene incluir Dirección/Horarios para que el cliente tenga todo en 1 mensaje.
      </p>
    </div>
  </div>

  <form method="POST" action="{{ route('admin.settings.update') }}" class="grid gap-4 lg:grid-cols-2">
    @csrf

    <div class="card">
      <div class="card-head">
        <div class="font-extrabold text-zinc-900">Dirección del local</div>
      </div>
      <div class="card-body">
        <textarea name="shop_address" rows="4" placeholder="Ej: San Martín 123, Carcarañá">{{ old('shop_address', $shopAddress) }}</textarea>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="font-extrabold text-zinc-900">Horarios</div>
      </div>
      <div class="card-body">
        <textarea name="shop_hours" rows="4" placeholder="Ej: Lun a Vie 9:00–12:30 / 16:00–20:00 | Sáb 9:00–13:00">{{ old('shop_hours', $shopHours) }}</textarea>
      </div>
    </div>

    <div class="lg:col-span-2 flex justify-end">
      <button type="submit" class="btn-primary">Guardar configuración</button>
    </div>
  </form>
</div>
@endsection
