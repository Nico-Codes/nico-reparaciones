@extends('layouts.app')

@section('title', 'Admin - Identidad visual')

@section('content')
@php
  $groupLabels = [
    'logos' => 'Logos',
    'icons' => 'Íconos de navegación',
    'favicons' => 'Favicons e íconos de app',
  ];

  $groupLabels['store'] = 'Portada de tienda';
  $assetsByGroup = collect($brandAssets ?? [])->sortBy('label')->groupBy('group');
@endphp

<div class="store-shell space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap rounded-3xl border border-sky-100 bg-white/90 p-4 reveal-item">
    <div class="page-head mb-0 w-full lg:w-auto">
      <div class="page-title">Identidad visual</div>
      <div class="page-subtitle">Sube y administra logos, íconos y favicons del sitio.</div>
    </div>
    @include('admin.settings.partials.top_actions')
</div>

  <div class="card reveal-item">
    <div class="card-head">
      <div>
        <div class="font-black">Recursos visuales</div>
        <div class="text-xs text-zinc-500">Puedes subir con click o arrastrando desde el escritorio.</div>
      </div>
      <span class="badge-sky">Identidad</span>
    </div>

    <div class="card-body space-y-6">
      <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
        Nota: las imágenes de productos se gestionan desde <span class="font-black text-zinc-900">Admin &gt; Productos</span>.
      </div>

      @foreach($assetsByGroup as $group => $assets)
        <div class="space-y-3">
          <div class="text-sm font-black text-zinc-900">{{ $groupLabels[$group] ?? ucfirst($group) }}</div>

          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            @foreach($assets as $asset)
              <div class="rounded-2xl border border-zinc-200 bg-white p-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="truncate font-black text-zinc-900">{{ $asset['label'] }}</div>
                    <div class="text-xs text-zinc-500 truncate">{{ $asset['path'] }}</div>
                  </div>
                  <span class="{{ $asset['is_custom'] ? 'badge-emerald' : 'badge-zinc' }}">
                    {{ $asset['is_custom'] ? 'Personalizado' : 'Por defecto' }}
                  </span>
                </div>

                <div class="mt-3 h-24 rounded-2xl border border-zinc-200 bg-zinc-50 p-2 flex items-center justify-center overflow-hidden">
                  <img src="{{ $asset['url'] }}" alt="{{ $asset['label'] }}" class="max-h-full max-w-full object-contain">
                </div>

                <form
                  method="POST"
                  action="{{ route('admin.settings.assets.update', $asset['key']) }}"
                  enctype="multipart/form-data"
                  class="mt-3 space-y-2"
                  data-asset-upload-form
                >
                  @csrf

                  <input
                    type="file"
                    name="file"
                    accept="{{ $asset['accept'] }}"
                    class="hidden"
                    data-asset-file-input
                    required
                  >

                  <button
                    type="button"
                    class="h-11 w-full rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition"
                    data-asset-dropzone
                  >
                    Arrastra un archivo o haz click para elegir
                  </button>

                  <div class="hidden rounded-xl border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700" data-asset-file-name></div>

                  <div class="text-[11px] text-zinc-500">
                    Formatos: {{ $asset['extensions_label'] }} | Max: {{ $asset['max_kb'] }} KB
                  </div>

                  <button type="submit" class="btn-primary h-11 w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed" data-asset-submit disabled>
                    Subir archivo
                  </button>
                </form>

                @if($asset['is_custom'])
                  <form
                    method="POST"
                    action="{{ route('admin.settings.assets.reset', $asset['key']) }}"
                    class="mt-2"
                    onsubmit="return confirm('Restaurar recurso por defecto?')"
                  >
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="btn-outline h-11 w-full justify-center">Restaurar por defecto</button>
                  </form>
                @endif
              </div>
            @endforeach
          </div>
        </div>
      @endforeach
    </div>
  </div>
</div>
<div data-react-admin-asset-upload-enhancements></div>
@endsection

