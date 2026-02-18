@extends('layouts.app')

@section('title', 'Admin - Plantillas WhatsApp')

@section('content')
<div class="store-shell space-y-6">
  <div class="reveal-item rounded-3xl border border-zinc-200/80 bg-gradient-to-r from-white via-sky-50/60 to-white p-4 sm:p-6">
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div class="page-head mb-0 w-full lg:w-auto">
        <h1 class="page-title">Plantillas WhatsApp</h1>
        <p class="page-subtitle">Edita mensajes por estado. Si dejas vacio, se usa el texto predeterminado.</p>
      </div>
      @include('admin.settings.partials.top_actions')
    </div>
  </div>

  <div class="reveal-item card">
    <div class="card-head">
      <div>
        <div class="font-extrabold text-zinc-900">Variables disponibles</div>
        <div class="text-xs text-zinc-500">Puedes combinarlas como quieras en cada plantilla.</div>
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

    <div class="reveal-item grid gap-4 lg:grid-cols-2">
      @foreach($statuses as $key => $label)
        <div class="card">
          <div class="card-head">
            <div>
              <div class="font-extrabold text-zinc-900">{{ $label }}</div>
              <div class="text-xs text-zinc-500">{{ $key }}</div>
            </div>
          </div>
          <div class="card-body">
            <textarea name="templates[{{ $key }}]" class="min-h-36 text-sm" rows="8">{{ old("templates.$key", $templates[$key] ?? '') }}</textarea>
          </div>
        </div>
      @endforeach
    </div>

    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.settings.index') }}">Cancelar</a>
      <button type="submit" class="btn-primary h-11 w-full justify-center sm:w-auto">Guardar plantillas</button>
    </div>
  </form>
</div>
@endsection
