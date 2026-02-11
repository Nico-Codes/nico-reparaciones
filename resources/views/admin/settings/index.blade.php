@extends('layouts.app')

@section('title', 'Admin - Configuracion')

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
<div class="space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div class="page-head mb-0 w-full lg:w-auto">
      <div class="page-title">Configuracion</div>
      <div class="page-subtitle">Administra los datos del local usados en mensajes y comprobantes.</div>
    </div>

    <div class="flex w-full gap-2 flex-wrap sm:w-auto">
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.dashboard') }}">Volver</a>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.settings.assets.index') }}">Identidad visual</a>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.two_factor.settings') }}">Seguridad 2FA</a>
      <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.whatsapp_templates.index') }}">Plantillas WhatsApp</a>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <div class="font-black">Datos del local</div>
        <div class="text-xs text-zinc-500">Se usan en WhatsApp, tickets y mensajes del sistema.</div>
      </div>
      <span class="badge-zinc">Negocio</span>
    </div>

    <div class="card-body">
      <form method="POST" action="{{ route('admin.settings.update') }}" class="grid gap-4">
        @csrf

        <div class="grid gap-2">
          <label>WhatsApp del local (opcional)</label>
          <input
            class="h-11"
            name="shop_phone"
            value="{{ old('shop_phone', $shopPhone ?? '') }}"
            placeholder="Ej: +54 341 5550000">
          <div class="text-xs text-zinc-500">
            Se usa para el boton "Escribir por WhatsApp".
          </div>
        </div>

        <div class="grid gap-2">
          <label>Direccion del local (opcional)</label>
          <textarea name="shop_address" rows="3" placeholder="Ej: Av. San Martin 123">{{ old('shop_address', $shopAddress ?? '') }}</textarea>
          <div class="text-xs text-zinc-500">Placeholder: <code>{shop_address}</code></div>
        </div>

        <div class="grid gap-2">
          <label>Horarios (opcional)</label>
          <textarea name="shop_hours" rows="3" placeholder="Ej: Lun a Vie 9-13 / 16-20">{{ old('shop_hours', $shopHours ?? '') }}</textarea>
          <div class="text-xs text-zinc-500">Placeholder: <code>{shop_hours}</code></div>
        </div>

        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <a class="btn-outline h-11 w-full justify-center sm:w-auto" href="{{ route('admin.dashboard') }}">Cancelar</a>
          <button class="btn-primary h-11 w-full justify-center sm:w-auto" type="submit">Guardar</button>
        </div>
      </form>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <div class="font-black">Reportes automaticos del dashboard</div>
        <div class="text-xs text-zinc-500">Define destinatarios y cronograma del email semanal de KPIs.</div>
      </div>
      <span class="badge-sky">Reportes</span>
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

  <div class="card">
    <div class="card-head">
      <div>
        <div class="font-black">Prueba de correo SMTP</div>
        <div class="text-xs text-zinc-500">Envia un correo de prueba para validar la configuracion de mail.</div>
      </div>
      <span class="badge-sky">Mail</span>
    </div>
    <div class="card-body grid gap-3">
      <form method="POST" action="{{ route('admin.settings.smtp_test.send') }}" class="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        @csrf
        <div class="grid gap-2">
          <label>Email destino para prueba</label>
          <input
            type="email"
            name="test_email"
            class="h-11"
            value="{{ old('test_email', $smtpDefaultTo ?? '') }}"
            placeholder="tu-email@dominio.com"
            required>
        </div>
        <button class="btn-primary h-11 w-full justify-center sm:w-auto" type="submit">
          Enviar prueba SMTP
        </button>
      </form>

      <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
        Si falla, revisa variables <code>MAIL_*</code> del entorno y proveedor SMTP.
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <div class="font-black">Identidad visual</div>
        <div class="text-xs text-zinc-500">Gestiona logos, iconos y favicons en una vista separada.</div>
      </div>
      <span class="badge-sky">Identidad</span>
    </div>
    <div class="card-body">
      <a class="btn-primary h-11 w-full justify-center sm:w-auto" href="{{ route('admin.settings.assets.index') }}">
        Abrir identidad visual
      </a>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <div class="font-black">Links rapidos</div>
        <div class="text-xs text-zinc-500">Accesos directos para operar rapido.</div>
      </div>
    </div>
    <div class="card-body">
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <a class="btn-outline h-11 w-full justify-center" href="{{ route('admin.repairs.index') }}">Reparaciones</a>
        <a class="btn-outline h-11 w-full justify-center" href="{{ route('admin.orders.index') }}">Pedidos</a>
        <a class="btn-outline h-11 w-full justify-center" href="{{ route('admin.products.index') }}">Productos</a>
        <a class="btn-outline h-11 w-full justify-center" href="{{ route('admin.categories.index') }}">Categorias</a>
      </div>
    </div>
  </div>
</div>
@endsection
