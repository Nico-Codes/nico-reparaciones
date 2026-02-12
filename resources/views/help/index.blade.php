@extends('layouts.app')

@section('title', 'Ayuda')

@section('content')
<div class="mx-auto w-full max-w-4xl space-y-6">
  <div class="page-head mb-0">
    <div class="page-title">Centro de ayuda</div>
    <div class="page-subtitle">Respuestas rapidas para problemas comunes de cuenta, compras y reparaciones.</div>
  </div>

  <div class="card">
    <div class="card-body">
      <div class="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <input id="helpSearchInput" class="h-11" placeholder="Buscar problema o palabra clave...">
        <div class="text-xs text-zinc-500"><span id="helpVisibleCount">{{ $entries->count() }}</span> resultados</div>
      </div>
    </div>
  </div>

  <div id="helpList" class="space-y-3">
    @forelse($entries as $entry)
      <article
        class="card"
        data-help-item
        data-help-search="{{ \Illuminate\Support\Str::lower($entry->question . ' ' . $entry->answer) }}">
        <div class="card-body space-y-2">
          <h2 class="text-base font-black text-zinc-900">{{ $entry->question }}</h2>
          <p class="text-sm text-zinc-700 whitespace-pre-line">{{ $entry->answer }}</p>
        </div>
      </article>
    @empty
      <div class="card">
        <div class="card-body text-sm text-zinc-600">No hay contenido de ayuda disponible en este momento.</div>
      </div>
    @endforelse
  </div>

  <div id="helpEmptySearch" class="hidden card">
    <div class="card-body text-sm text-zinc-600">No encontramos resultados para tu busqueda.</div>
  </div>

  @if(!empty($helpWhatsappUrl))
    <div class="card">
      <div class="card-body flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="font-black text-zinc-900">No encontraste solucion?</div>
          <div class="text-sm text-zinc-600">Escribinos y te ayudamos por WhatsApp.</div>
        </div>
        <a href="{{ $helpWhatsappUrl }}" target="_blank" rel="noopener" class="btn-primary h-11 w-full justify-center sm:w-auto">
          Contactar por WhatsApp
        </a>
      </div>
    </div>
  @endif
</div>

<script>
(() => {
  const input = document.getElementById('helpSearchInput');
  const items = Array.from(document.querySelectorAll('[data-help-item]'));
  const count = document.getElementById('helpVisibleCount');
  const empty = document.getElementById('helpEmptySearch');
  if (!input || !count || !empty || items.length === 0) return;

  const normalize = (value) => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const update = () => {
    const query = normalize(input.value);
    let visible = 0;

    items.forEach((item) => {
      const source = normalize(item.getAttribute('data-help-search'));
      const match = query === '' || source.includes(query);
      item.classList.toggle('hidden', !match);
      if (match) visible++;
    });

    count.textContent = String(visible);
    empty.classList.toggle('hidden', visible > 0);
  };

  input.addEventListener('input', update);
})();
</script>
@endsection
