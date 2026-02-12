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
        <button type="button" class="card-body flex w-full items-center justify-between gap-3 text-left" data-help-toggle aria-expanded="false">
          <h2 class="text-base font-black text-zinc-900">{{ $entry->question }}</h2>
          <svg class="h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-300 ease-out" data-help-chevron viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6"></path>
          </svg>
        </button>
        <div class="overflow-hidden max-h-0 opacity-0 transition-[max-height,opacity] duration-300 ease-out" data-help-answer>
          <div class="px-4 pt-1 pb-12 sm:px-5 sm:pb-12">
            <p class="mb-3 text-sm text-zinc-700 whitespace-pre-line leading-relaxed">{{ $entry->answer }}</p>
          </div>
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

(() => {
  const items = Array.from(document.querySelectorAll('[data-help-item]'));
  if (items.length === 0) return;

  items.forEach((item) => {
    const toggle = item.querySelector('[data-help-toggle]');
    const chevron = item.querySelector('[data-help-chevron]');
    const answer = item.querySelector('[data-help-answer]');
    if (!toggle || !chevron || !answer) return;

    const open = () => {
      answer.style.maxHeight = `${answer.scrollHeight}px`;
      answer.classList.remove('opacity-0');
      toggle.setAttribute('aria-expanded', 'true');
      chevron.classList.add('rotate-180');
    };

    const close = () => {
      answer.style.maxHeight = '0px';
      answer.classList.add('opacity-0');
      toggle.setAttribute('aria-expanded', 'false');
      chevron.classList.remove('rotate-180');
    };

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        close();
      } else {
        open();
      }
    });

    close();
  });
})();
</script>
@endsection
