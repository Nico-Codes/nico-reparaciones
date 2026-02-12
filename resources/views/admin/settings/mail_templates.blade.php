@extends('layouts.app')

@section('title', 'Admin - Plantillas de correo')

@php
  $placeholderExamples = [
    'name' => '{name}',
    'expire_minutes' => '{expire_minutes}',
    'order_id' => '{order_id}',
    'pickup_name' => '{pickup_name}',
  ];
@endphp

@section('content')
<div class="space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0 w-full lg:w-auto">
      <div class="page-title">Plantillas de correo</div>
      <div class="page-subtitle">Personaliza los textos enviados al cliente desde el panel admin.</div>
    </div>

    <div class="flex w-full gap-2 flex-wrap sm:w-auto">
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.settings.index') }}">Volver a configuracion</a>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.settings.assets.index') }}">Identidad visual</a>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <div class="font-black">Editor de plantillas</div>
        <div class="text-xs text-zinc-500">Si un campo queda vacio, se usara el texto por defecto del sistema.</div>
      </div>
      <span class="badge-sky">Mail</span>
    </div>

    <div class="card-body">
      <form method="POST" action="{{ route('admin.settings.mail_templates.update') }}" class="grid gap-5">
        @csrf

        @foreach($templates as $templateKey => $template)
          <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
            <div class="flex items-center justify-between gap-3">
              <div class="font-black text-zinc-900">{{ $template['label'] }}</div>
              <button
                type="submit"
                class="btn-outline btn-sm"
                formaction="{{ route('admin.settings.mail_templates.reset', ['templateKey' => $templateKey]) }}"
                formmethod="POST"
                formnovalidate
                data-confirm="Se restaurara esta plantilla a los valores por defecto. ¿Continuar?">
                Restaurar por defecto
              </button>
            </div>

            @foreach($template['fields'] as $fieldKey => $field)
              @php
                $inputName = 'tpl_' . $templateKey . '_' . $fieldKey;
                $value = old($inputName, $field['value']);
              @endphp

              <div class="grid gap-2">
                <label for="{{ $inputName }}">{{ $field['label'] }}</label>

                @if(strlen((string) $value) > 120 || in_array($fieldKey, ['intro_line', 'outro_line', 'footer_line'], true))
                  <textarea id="{{ $inputName }}" name="{{ $inputName }}" rows="3">{{ $value }}</textarea>
                @else
                  <input id="{{ $inputName }}" name="{{ $inputName }}" value="{{ $value }}" class="h-11">
                @endif

                <div class="text-xs text-zinc-500">
                  Default: <code>{{ $field['default'] }}</code>
                </div>
              </div>
            @endforeach
          </div>
        @endforeach

        <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
          Placeholders disponibles:
          <code>{{ $placeholderExamples['name'] }}</code>,
          <code>{{ $placeholderExamples['expire_minutes'] }}</code>,
          <code>{{ $placeholderExamples['order_id'] }}</code>,
          <code>{{ $placeholderExamples['pickup_name'] }}</code>.
        </div>

        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.settings.index') }}">Cancelar</a>
          <button class="btn-primary h-11 w-full justify-center sm:w-auto" type="submit">Guardar plantillas</button>
        </div>
      </form>
    </div>
  </div>
</div>
@endsection
