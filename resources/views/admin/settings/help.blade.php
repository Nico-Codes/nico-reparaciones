@extends('layouts.app')

@section('title', 'Admin - Ayuda')

@section('content')
<div class="store-shell space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap rounded-3xl border border-sky-100 bg-white/90 p-4 reveal-item">
    <div class="page-head mb-0 w-full lg:w-auto">
      <div class="page-title">Ayuda y preguntas frecuentes</div>
      <div class="page-subtitle">Gestiona contenido de ayuda en formato problema -> respuesta para usuarios y admin.</div>
    </div>

    <div class="flex w-full gap-2 flex-wrap sm:w-auto">
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('help.index') }}" target="_blank" rel="noopener">Vista previa publica</a>
      @include('admin.settings.partials.top_actions')
    </div>
  </div>

  <div class="card reveal-item">
    <div class="card-head">
      <div class="font-black">Configuracion de contacto</div>
      <span class="badge-zinc">WhatsApp</span>
    </div>
    <div class="card-body">
      <form id="helpWhatsappConfigForm" method="POST" action="{{ route('admin.settings.help.config.update') }}" class="grid gap-3">
        @csrf
        <div>
          <label>Mensaje predefinido para el boton "Contactar por WhatsApp" *</label>
          <textarea id="helpWhatsappMessageInput" name="help_whatsapp_message" rows="3" maxlength="500" required placeholder="Ej: Hola, necesito ayuda con mi pedido/reparacion.">{{ old('help_whatsapp_message', $helpWhatsappMessage ?? '') }}</textarea>
          <div id="helpWhatsappMessageCounter" class="mt-1 text-xs text-zinc-500">0 / 500</div>
          <div id="helpWhatsappMessageMinAlert" class="mt-1 hidden text-xs font-semibold text-amber-700">El mensaje es muy corto (minimo recomendado: 10 caracteres).</div>
          <div class="mt-1 text-xs text-zinc-500">Este texto se envia automaticamente cuando el usuario abre el chat desde la pagina de ayuda.</div>
        </div>
        <div class="flex justify-end">
          <button id="helpWhatsappMessageSubmitBtn" class="btn-primary h-11 w-full justify-center sm:w-auto" type="submit">Guardar mensaje</button>
        </div>
      </form>
    </div>
  </div>

  <div class="card reveal-item">
    <div class="card-head">
      <div class="font-black">Nuevo item de ayuda</div>
      <span class="badge-sky">FAQ</span>
    </div>
    <div class="card-body">
      <form method="POST" action="{{ route('admin.settings.help.store') }}" class="grid gap-3 md:grid-cols-3">
        @csrf

        <div class="md:col-span-3">
          <label>Problema / pregunta *</label>
          <input class="h-11" name="question" value="{{ old('question') }}" required maxlength="200" placeholder="Ej: No me llega el correo de recuperacion">
        </div>

        <div class="md:col-span-3">
          <label>Respuesta *</label>
          <textarea name="answer" rows="4" required maxlength="5000" placeholder="Explica en pasos simples la solucion.">{{ old('answer') }}</textarea>
        </div>

        <div>
          <label>Visible para *</label>
          <select name="audience" class="h-11" required>
            @foreach($audiences as $audienceKey => $audienceLabel)
              <option value="{{ $audienceKey }}" @selected(old('audience', 'public') === $audienceKey)>{{ $audienceLabel }}</option>
            @endforeach
          </select>
        </div>

        <div>
          <label>Orden</label>
          <input class="h-11" name="sort_order" type="number" value="{{ old('sort_order', 0) }}">
          <div class="text-xs text-zinc-500">Mayor numero aparece primero.</div>
        </div>

        <div class="flex items-end">
          <label class="inline-flex items-center gap-2 text-sm font-black text-zinc-800">
            <input type="checkbox" name="active" value="1" class="h-4 w-4 rounded border-zinc-300" @checked(old('active', true))>
            Activo
          </label>
        </div>

        <div class="md:col-span-3 flex justify-end">
          <button class="btn-primary h-11 w-full justify-center sm:w-auto" type="submit">Crear item</button>
        </div>
      </form>
    </div>
  </div>

  <div class="card reveal-item">
    <div class="card-head">
      <div class="font-black">Items cargados</div>
      <span class="badge-zinc">{{ $entries->count() }} items</span>
    </div>
    <div class="card-body space-y-3">
      <div class="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <input id="helpAdminSearchInput" class="h-11" placeholder="Buscar por problema o respuesta...">
        <div class="text-xs text-zinc-500"><span id="helpAdminVisibleCount">{{ $entries->count() }}</span> visibles</div>
      </div>

      @forelse($entries as $entry)
        <div
          class="rounded-2xl border border-zinc-200 bg-zinc-50 p-3"
          data-help-admin-item
          data-help-admin-search="{{ \Illuminate\Support\Str::lower($entry->question . ' ' . $entry->answer) }}">
          <form method="POST" action="{{ route('admin.settings.help.update', $entry) }}" class="grid gap-2 md:grid-cols-8">
            @csrf
            @method('PUT')

            <div class="md:col-span-4">
              <label>Problema / pregunta</label>
              <input class="h-10" name="question" value="{{ $entry->question }}" required maxlength="200">
            </div>

            <div class="md:col-span-2">
              <label>Visible para</label>
              <select name="audience" class="h-10" required>
                @foreach($audiences as $audienceKey => $audienceLabel)
                  <option value="{{ $audienceKey }}" @selected($entry->audience === $audienceKey)>{{ $audienceLabel }}</option>
                @endforeach
              </select>
            </div>

            <div>
              <label>Orden</label>
              <input class="h-10" name="sort_order" type="number" value="{{ (int) $entry->sort_order }}">
            </div>

            <div class="flex items-end">
              <label class="inline-flex items-center gap-2 text-sm font-black text-zinc-800">
                <input type="checkbox" name="active" value="1" class="h-4 w-4 rounded border-zinc-300" @checked($entry->active)>
                Activo
              </label>
            </div>

            <div class="md:col-span-8">
              <label>Respuesta</label>
              <textarea name="answer" rows="3" required maxlength="5000">{{ $entry->answer }}</textarea>
            </div>

            <div class="md:col-span-8 flex flex-wrap items-center justify-end gap-2">
              <button class="btn-outline btn-sm" type="submit">Guardar</button>
              <button class="btn-outline btn-sm text-rose-700" type="submit" form="delete-help-{{ $entry->id }}">Eliminar</button>
            </div>
          </form>

          <form id="delete-help-{{ $entry->id }}" method="POST" action="{{ route('admin.settings.help.destroy', $entry) }}" class="hidden" onsubmit="return confirm('Eliminar item de ayuda?');">
            @csrf
            @method('DELETE')
          </form>
        </div>
      @empty
        <div class="text-sm text-zinc-500">No hay items de ayuda cargados.</div>
      @endforelse
      <div id="helpAdminEmptySearch" class="hidden text-sm text-zinc-500">No hay items que coincidan con la busqueda.</div>
    </div>
  </div>

  <div
    data-react-admin-settings-help
    data-message-input-id="helpWhatsappMessageInput"
    data-message-counter-id="helpWhatsappMessageCounter"
    data-message-min-alert-id="helpWhatsappMessageMinAlert"
    data-message-submit-id="helpWhatsappMessageSubmitBtn"
    data-search-input-id="helpAdminSearchInput"
    data-visible-count-id="helpAdminVisibleCount"
    data-empty-search-id="helpAdminEmptySearch"
    data-item-selector="[data-help-admin-item]"
  ></div>
</div>
@endsection
