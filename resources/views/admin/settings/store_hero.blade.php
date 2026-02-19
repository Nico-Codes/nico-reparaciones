@extends('layouts.app')

@section('title', 'Admin - Portada de tienda')

@section('content')
<div class="store-shell space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap rounded-3xl border border-sky-100 bg-white/90 p-4 reveal-item">
    <div class="page-head mb-0 w-full lg:w-auto">
      <div class="page-title">Portada de tienda</div>
      <div class="page-subtitle">Administra la imagen principal que se muestra al entrar a la tienda.</div>
    </div>
    @include('admin.settings.partials.top_actions')
  </div>

  <div class="grid gap-4 lg:grid-cols-2">
    @foreach([
      ['title' => 'Imagen desktop/tablet', 'asset' => $heroAssetDesktop ?? null],
      ['title' => 'Imagen movil', 'asset' => $heroAssetMobile ?? null],
    ] as $heroBlock)
      @php($asset = $heroBlock['asset'])
      <div class="card reveal-item">
        <div class="card-head">
          <div class="font-black">{{ $heroBlock['title'] }}</div>
          <span class="{{ ($asset['is_custom'] ?? false) ? 'badge-emerald' : 'badge-zinc' }}">
            {{ ($asset['is_custom'] ?? false) ? 'Personalizada' : 'Por defecto' }}
          </span>
        </div>
        <div class="card-body space-y-3">
          @if($asset)
            <div class="h-44 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
              <img src="{{ $asset['url'] }}" alt="{{ $heroBlock['title'] }}" class="h-full w-full object-cover">
            </div>

            <div class="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
              @if($asset['key'] === 'store_home_hero_desktop')
                Recomendado: <span class="font-black text-zinc-900">1920 x 900 px</span> (tambien sirve 2000 x 900).
              @elseif($asset['key'] === 'store_home_hero_mobile')
                Recomendado: <span class="font-black text-zinc-900">900 x 1200 px</span> (formato vertical).
              @endif
            </div>

            <form
              method="POST"
              action="{{ route('admin.settings.assets.update', $asset['key']) }}"
              enctype="multipart/form-data"
              class="space-y-2"
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
                Arrastra una imagen o haz click para elegir
              </button>

              <div class="hidden rounded-xl border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700" data-asset-file-name></div>

              <div class="text-[11px] text-zinc-500">
                Formatos: {{ $asset['extensions_label'] }} | Max: {{ $asset['max_kb'] }} KB
              </div>

              <button type="submit" class="btn-primary h-11 w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed" data-asset-submit disabled>
                Guardar imagen
              </button>
            </form>

            @if($asset['is_custom'] ?? false)
              <form
                method="POST"
                action="{{ route('admin.settings.assets.reset', $asset['key']) }}"
                onsubmit="return confirm('Restaurar imagen por defecto?')"
              >
                @csrf
                @method('DELETE')
                <button type="submit" class="btn-outline h-11 w-full justify-center">Restaurar por defecto</button>
              </form>
            @endif
          @endif
        </div>
      </div>
    @endforeach
  </div>

  <div class="card reveal-item">
    <div class="card-head">
      <div class="font-black">Textos y degradado</div>
    </div>
    <div class="card-body">
      <form method="POST" action="{{ route('admin.settings.update') }}" class="space-y-3">
        @csrf
        <div class="grid gap-2">
          <label>Titulo (opcional)</label>
          <input class="h-11" name="store_home_hero_title" value="{{ old('store_home_hero_title', $storeHomeHeroTitle ?? '') }}" placeholder="Ej: Novedades de la semana">
        </div>
        <div class="grid gap-2">
          <label>Texto (opcional)</label>
          <textarea name="store_home_hero_subtitle" rows="4" placeholder="Ej: Ingresaron nuevos modulos y accesorios.">{{ old('store_home_hero_subtitle', $storeHomeHeroSubtitle ?? '') }}</textarea>
        </div>
        <div class="grid gap-2 sm:grid-cols-2">
          <div class="grid gap-2">
            <label>Intensidad del degradado (0-100)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              class="h-11"
              name="store_home_hero_fade_intensity"
              value="{{ old('store_home_hero_fade_intensity', (int)($storeHomeHeroFadeIntensity ?? 42)) }}">
          </div>
          <div class="grid gap-2">
            <label>Extension del degradado (px)</label>
            <input
              type="number"
              min="24"
              max="260"
              step="1"
              class="h-11"
              name="store_home_hero_fade_size"
              value="{{ old('store_home_hero_fade_size', (int)($storeHomeHeroFadeSize ?? 96)) }}">
          </div>
        </div>
        <div class="grid gap-2">
          <label>Color manual del degradado (hex)</label>
          <div class="flex items-center gap-2">
            <input
              type="color"
              class="h-11 w-16 rounded-xl border border-zinc-300 bg-white p-1"
              value="{{ old('store_home_hero_fade_color_manual', ($storeHomeHeroFadeColorManual ?? '') !== '' ? $storeHomeHeroFadeColorManual : '#0EA5E9') }}"
              oninput="this.nextElementSibling.value=this.value">
            <input
              type="text"
              name="store_home_hero_fade_color_manual"
              class="h-11 uppercase"
              maxlength="7"
              pattern="^#([A-Fa-f0-9]{6})$"
              value="{{ old('store_home_hero_fade_color_manual', $storeHomeHeroFadeColorManual ?? '') }}"
              placeholder="#0EA5E9">
          </div>
          <div class="text-xs text-zinc-500">
            Opcional. Si lo completas, se usa este color para el degradado en todos los dispositivos.
            Si lo dejas vacio, el color se calcula automaticamente desde la imagen.
          </div>
        </div>
        <label class="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
          <input
            type="checkbox"
            name="store_home_hero_fade_high_contrast"
            value="1"
            @checked(old('store_home_hero_fade_high_contrast', ($storeHomeHeroFadeHighContrast ?? false) ? '1' : '0') === '1')
            class="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-300">
          Modo contraste alto del degradado
        </label>
        <div class="text-xs text-zinc-500">
          El degradado se superpone sobre el bloque siguiente al hero y no agrega altura extra al layout.
        </div>
        <button class="btn-primary h-11 w-full justify-center sm:w-auto" type="submit">Guardar textos</button>
      </form>
    </div>
  </div>
</div>
<div data-react-admin-asset-upload-enhancements></div>
@endsection
