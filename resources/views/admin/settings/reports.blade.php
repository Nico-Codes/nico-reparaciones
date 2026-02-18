@extends('layouts.app')

@section('title', 'Admin - Reportes automaticos')

@section('content')
@php
  $dayOptions = [
    'monday' => 'Lunes',
    'tuesday' => 'Martes',
    'wednesday' => 'Miercoles',
    'thursday' => 'Jueves',
    'friday' => 'Viernes',
    'saturday' => 'Sabado',
    'sunday' => 'Domingo',
  ];

  $rangeOptions = [
    7 => 'Ultimos 7 dias',
    30 => 'Ultimos 30 dias',
    90 => 'Ultimos 90 dias',
  ];
@endphp

<div class="store-shell space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap rounded-3xl border border-sky-100 bg-white/90 p-4 reveal-item">
    <div class="page-head mb-0 w-full lg:w-auto">
      <div class="page-title">Reportes automaticos</div>
      <div class="page-subtitle">Configura envio semanal de KPIs del dashboard.</div>
    </div>
    @include('admin.settings.partials.top_actions')
  </div>

  <div class="card reveal-item">
    <div class="card-body grid gap-4">
      <form method="POST" action="{{ route('admin.settings.reports.update') }}" class="grid gap-4">
        @csrf

        <div class="grid gap-2">
          <label>Emails destinatarios (separados por coma)</label>
          <textarea
            name="weekly_report_emails"
            rows="3"
            placeholder="ops@tudominio.com, owner@tudominio.com"
          >{{ old('weekly_report_emails', $weeklyReportEmails ?? '') }}</textarea>
          <div class="text-xs text-zinc-500">Si queda vacio, no se enviara ningun reporte automatico.</div>
        </div>

        <div class="grid gap-3 md:grid-cols-3">
          <div class="grid gap-2">
            <label>Dia de envio</label>
            <select name="weekly_report_day" class="h-11">
              @foreach($dayOptions as $dayKey => $dayLabel)
                <option value="{{ $dayKey }}" @selected(old('weekly_report_day', $weeklyReportDay ?? 'monday') === $dayKey)>
                  {{ $dayLabel }}
                </option>
              @endforeach
            </select>
          </div>

          <div class="grid gap-2">
            <label>Hora de envio</label>
            <input
              type="time"
              name="weekly_report_time"
              class="h-11"
              value="{{ old('weekly_report_time', $weeklyReportTime ?? '08:00') }}"
              required>
          </div>

          <div class="grid gap-2">
            <label>Rango del reporte</label>
            <select name="weekly_report_range_days" class="h-11">
              @foreach($rangeOptions as $rangeValue => $rangeLabel)
                <option value="{{ $rangeValue }}" @selected((int) old('weekly_report_range_days', $weeklyReportRangeDays ?? 30) === (int) $rangeValue)>
                  {{ $rangeLabel }}
                </option>
              @endforeach
            </select>
          </div>
        </div>

        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button class="btn-primary h-11 w-full justify-center sm:w-auto" type="submit">
            Guardar reporte semanal
          </button>
        </div>
      </form>

      <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
        El scheduler del servidor toma esta configuracion y ejecuta <code>ops:dashboard-report-email</code> cada semana.
      </div>

      <form method="POST" action="{{ route('admin.settings.reports.send') }}" class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        @csrf
        <input type="hidden" name="weekly_report_range_days" value="{{ old('weekly_report_range_days', $weeklyReportRangeDays ?? 30) }}">
        <button class="btn-outline h-11 w-full justify-center sm:w-auto" type="submit">Enviar reporte ahora</button>
      </form>
    </div>
  </div>
</div>
@endsection
