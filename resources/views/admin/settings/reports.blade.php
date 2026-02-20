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

  $lastStatus = (string) ($operationalAlertsLastStatus ?? '');
  $statusMap = [
    'sent' => ['label' => 'Enviado', 'class' => 'badge-emerald'],
    'dry_run' => ['label' => 'Dry-run', 'class' => 'badge-sky'],
    'deduped' => ['label' => 'Omitido (anti-spam)', 'class' => 'badge-amber'],
    'no_alerts' => ['label' => 'Sin alertas', 'class' => 'badge-zinc'],
    'failed' => ['label' => 'Error', 'class' => 'badge-rose'],
    '' => ['label' => 'Sin ejecuciones', 'class' => 'badge-zinc'],
  ];
  $statusMeta = $statusMap[$lastStatus] ?? $statusMap[''];
  $lastSummary = is_array($operationalAlertsLastSummary ?? null) ? $operationalAlertsLastSummary : [];
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
    <div class="card-head">
      <div>
        <div class="font-black">Reportes semanales</div>
        <div class="text-xs text-zinc-500">Define destinatarios y frecuencia para el envio automatico de resumenes.</div>
      </div>
      <span class="badge-sky">Email</span>
    </div>

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

        <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
          <div class="font-black text-zinc-900">Alertas operativas automáticas</div>
          <div class="mt-1 text-xs text-zinc-600">Correo diario con pedidos/reparaciones demoradas (anti-spam incluido).</div>

          <div class="mt-3 grid gap-3 md:grid-cols-2">
            <div class="grid gap-2">
              <label>Emails para alertas operativas (opcional)</label>
              <textarea
                name="operational_alerts_emails"
                rows="3"
                placeholder="ops@tudominio.com, soporte@tudominio.com"
              >{{ old('operational_alerts_emails', $operationalAlertsEmails ?? '') }}</textarea>
              <div class="text-xs text-zinc-500">Si queda vacío, usa emails de reporte semanal y luego admins.</div>
            </div>

            <div class="grid gap-2">
              <label>Ventana anti-spam (minutos)</label>
              <input
                type="number"
                min="5"
                max="10080"
                name="operational_alerts_dedupe_minutes"
                class="h-11"
                value="{{ (int) old('operational_alerts_dedupe_minutes', $operationalAlertsDedupeMinutes ?? 360) }}"
                required>
              <div class="text-xs text-zinc-500">No reenvía la misma alerta durante esta ventana (ej: 360 = 6 horas).</div>
            </div>
          </div>
        </div>

        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.settings.index') }}">Volver a configuracion</a>
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

      <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
        Alertas operativas automaticas: se ejecuta <code>ops:operational-alerts-email</code> diariamente.
        Si no configuras destinatarios especificos, se envian a admins o a los emails del reporte semanal.
      </div>

      <form method="POST" action="{{ route('admin.settings.reports.operational_alerts.send') }}" class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        @csrf
        <button class="btn-outline h-11 w-full justify-center sm:w-auto" type="submit">Enviar alerta operativa ahora</button>
      </form>

      <div class="rounded-2xl border border-zinc-200 bg-white p-3">
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="font-black text-zinc-900">Última ejecución de alertas operativas</div>
            <div class="mt-1 text-xs text-zinc-600">Historial rápido para verificar funcionamiento sin revisar logs.</div>
          </div>
          <div class="flex items-center gap-2">
            <span class="{{ $statusMeta['class'] }}">{{ $statusMeta['label'] }}</span>
            <form method="POST" action="{{ route('admin.settings.reports.operational_alerts.clear') }}" onsubmit="return confirm('¿Seguro que quieres limpiar el historial de alertas operativas?');">
              @csrf
              <button type="submit" class="btn-ghost btn-sm h-8 px-3" title="Limpiar historial">Limpiar</button>
            </form>
          </div>
        </div>

        <div class="mt-3 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
          <div><span class="font-black">Fecha:</span> {{ $operationalAlertsLastRunAt ?: '—' }}</div>
          <div><span class="font-black">Destinatarios:</span> {{ $operationalAlertsLastRecipients ?: '—' }}</div>
          <div><span class="font-black">Pedidos alertados:</span> {{ (int)($lastSummary['orders'] ?? 0) }}</div>
          <div><span class="font-black">Reparaciones alertadas:</span> {{ (int)($lastSummary['repairs'] ?? 0) }}</div>
        </div>

        @if(!empty($operationalAlertsLastError))
          <div class="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-900">
            Último error: {{ $operationalAlertsLastError }}
          </div>
        @endif
      </div>
    </div>
  </div>
</div>
@endsection
