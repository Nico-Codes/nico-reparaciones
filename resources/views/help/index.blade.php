@extends('layouts.app')

@section('title', 'Ayuda')

@section('content')
@php
  $helpPrimaryHref = \Illuminate\Support\Facades\Route::has('store.index') ? route('store.index') : '/';
  $helpSecondaryHref = auth()->check()
    ? (\Illuminate\Support\Facades\Route::has('orders.index') ? route('orders.index') : $helpPrimaryHref)
    : (\Illuminate\Support\Facades\Route::has('login') ? route('login') : '/login');
  $helpSecondaryLabel = auth()->check() ? 'Mis pedidos' : 'Ingresar';
  $helpEntriesPayload = $entries->map(fn ($entry) => [
    'question' => (string) $entry->question,
    'answer' => (string) $entry->answer,
  ])->values();
@endphp
<div class="store-shell mx-auto w-full max-w-4xl space-y-6">
  <div class="page-head mb-0 store-hero reveal-item">
    <div class="page-title">Centro de ayuda</div>
    <div class="page-subtitle">Respuestas rapidas para problemas comunes de cuenta, compras y reparaciones.</div>
  </div>

  <div class="reveal-item"
    data-react-help-island
    data-title="Accesos rapidos"
    data-subtitle="Atajos utiles para resolver acciones frecuentes desde la ayuda."
    data-primary-label="Ir a tienda"
    data-primary-href="{{ $helpPrimaryHref }}"
    data-secondary-label="{{ $helpSecondaryLabel }}"
    data-secondary-href="{{ $helpSecondaryHref }}">
  </div>

  <script id="helpFaqData" type="application/json">@json($helpEntriesPayload)</script>
  <div class="reveal-item"
    data-react-help-faq-island
    data-source-id="helpFaqData"
    data-empty-data-text="No hay contenido de ayuda disponible en este momento."
    data-empty-search-text="No encontramos resultados para tu busqueda."
    data-search-placeholder="Buscar problema o palabra clave...">
  </div>

  @if(!empty($helpWhatsappUrl))
    <div class="card reveal-item">
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

@endsection
