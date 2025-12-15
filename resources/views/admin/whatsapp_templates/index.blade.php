@extends('layouts.app')

@section('title', 'Admin — Plantillas WhatsApp')

@section('content')
<div class="space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0">
      <h1 class="page-title">Plantillas WhatsApp</h1>
      <p class="page-subtitle">Editá mensajes por estado. Si dejás vacío, se usa el default del sistema.</p>
    </div>

    <div class="flex gap-2 flex-wrap">
      <a class="btn-outline" href="{{ route('admin.settings.index') }}">Configuración</a>
      <a class="btn-outline" href="{{ route('admin.dashboard') }}">Volver</a>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <div class="font-extrabold text-zinc-900">Placeholders disponibles</div>
        <div class="text-xs text-zinc-500">Podés combinarlos como quieras en cada plantilla.</div>
      </div>
    </div>
    <div class="card-body text-sm">
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        @foreach($placeholders as $k => $desc)
          <div class="rounded-2xl border border-zinc-200 bg-white p-3">
            <div class="font-black text-zinc-900"><code>{{ $k }}</code></div>
            <div class="text-xs text-zinc-600 mt-1">{{ $desc }}</div>
          </div>
        @endforeach
      </div>
    </div>
  </div>

  <form method="POST" action="{{ route('admin.whatsapp_templates.update') }}" class="space-y-4">
    @csrf

    <div class="grid gap-4 lg:grid-cols-2">
      @foreach($statuses as $key => $label)
        <div class="card">
          <div class="card-head">
            <div>
              <div class="font-extrabold text-zinc-900">{{ $label }}</div>
              <div class="text-xs text-zinc-500">{{ $key }}</div>
            </div>
          </div>
          <div class="card-body">
            <textarea
              name="templates[{{ $key }}]"
              rows="8"
            >{{ old("templates.$key", $templates[$key] ?? '') }}</textarea>
          </div>
        </div>
      @endforeach
    </div>

    <div class="flex justify-end">
      <button type="submit" class="btn-primary">Guardar plantillas</button>
    </div>
  </form>
</div>
@endsection
