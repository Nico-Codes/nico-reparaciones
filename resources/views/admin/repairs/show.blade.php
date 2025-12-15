@extends('layouts.app')

@section('title', 'Reparación ' . $repair->code . ' — Admin')

@section('content')
@php
  $i = "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100";
  $t = "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100";
  $l = "text-sm font-medium text-zinc-800";
  $h = "text-xs text-zinc-500";

  $badge = match($repair->status) {
    'received' => 'bg-slate-100 text-slate-700 ring-slate-200',
    'diagnosing' => 'bg-amber-100 text-amber-800 ring-amber-200',
    'waiting_approval' => 'bg-purple-100 text-purple-800 ring-purple-200',
    'repairing' => 'bg-sky-100 text-sky-800 ring-sky-200',
    'ready_pickup' => 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    'delivered' => 'bg-zinc-900 text-white ring-zinc-900/10',
    'cancelled' => 'bg-rose-100 text-rose-800 ring-rose-200',
    default => 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  };

  $money = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');

  $parts = (float) ($repair->parts_cost ?? 0);
  $labor = (float) ($repair->labor_cost ?? 0);
  $totalCost = $parts + $labor;

  $final = $repair->final_price !== null ? (float)$repair->final_price : null;
  $paid = (float) ($repair->paid_amount ?? 0);

  $balance = ($final ?? 0) - $paid;
  $profit = ($final ?? 0) - $totalCost;
@endphp

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

  {{-- Header --}}
  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <div class="flex items-center gap-2 flex-wrap">
        <h1 class="text-xl sm:text-2xl font-semibold text-zinc-900">
          Reparación <span class="font-mono">#{{ $repair->code }}</span>
        </h1>
        <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset {{ $badge }}">
          {{ $statuses[$repair->status] ?? $repair->status }}
        </span>
      </div>

      <p class="mt-1 text-sm text-zinc-500">
        {{ $repair->customer_name }} · {{ $repair->customer_phone }}
        @if(!empty($repair->device_brand) || !empty($repair->device_model))
          · {{ trim(($repair->device_brand ?? '').' '.($repair->device_model ?? '')) }}
        @endif
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <a href="{{ route('admin.repairs.index') }}"
         class="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
        Volver
      </a>

      <a href="{{ route('admin.repairs.print', $repair) }}" target="_blank"
         class="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
        Imprimir
      </a>

      @if($waUrl)
        <a href="{{ $waUrl }}" target="_blank"
           class="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
          Abrir WhatsApp
        </a>
      @endif
    </div>
  </div>

  {{-- Flash --}}
  @if(session('success'))
    <div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {{ session('success') }}
    </div>
  @endif

  @if($errors->any())
    <div class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      <div class="font-semibold">Hay errores para corregir:</div>
      <ul class="mt-2 list-disc pl-5 space-y-1">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  {{-- Acción rápida después de cambiar estado --}}
  @if(session('wa_after') && !empty(session('wa_after.url')))
    <div class="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      <div class="font-semibold">Acción rápida</div>
      <div class="mt-1">
        <a class="underline font-medium" href="{{ session('wa_after.url') }}" target="_blank">
          Abrir WhatsApp con el mensaje del nuevo estado
        </a>
      </div>
    </div>
  @endif

  <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

    {{-- Columna principal --}}
    <div class="lg:col-span-2 space-y-6">

      {{-- Cambiar estado --}}
      <section class="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div class="border-b border-zinc-100 px-4 py-3">
          <h2 class="text-sm font-semibold text-zinc-900">Cambiar estado</h2>
          <p class="{{ $h }}">Actualiza el progreso de la reparación (y opcionalmente deja un comentario).</p>
        </div>
        <div class="p-4">
          <form method="POST" action="{{ route('admin.repairs.updateStatus', $repair) }}" class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            @csrf
            <div class="sm:col-span-1">
              <label class="{{ $l }}">Estado</label>
              <select class="{{ $i }}" name="status" required>
                @foreach($statuses as $k => $label)
                  <option value="{{ $k }}" {{ $repair->status === $k ? 'selected' : '' }}>{{ $label }}</option>
                @endforeach
              </select>
            </div>

            <div class="sm:col-span-2">
              <label class="{{ $l }}">Comentario (opcional)</label>
              <input class="{{ $i }}" type="text" name="comment" maxlength="500" placeholder="Ej: esperando repuesto / aprobado por el cliente...">
            </div>

            <div class="sm:col-span-3">
              <button type="submit"
                      class="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
                Guardar estado
              </button>
            </div>
          </form>
        </div>
      </section>

      {{-- Historial de estados --}}
      <section class="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div class="border-b border-zinc-100 px-4 py-3">
          <h2 class="text-sm font-semibold text-zinc-900">Historial</h2>
          <p class="{{ $h }}">Registro de cambios de estado.</p>
        </div>

        <div class="p-4">
          @if($history->isEmpty())
            <div class="text-sm text-zinc-500">Todavía no hay historial.</div>
          @else
            <div class="space-y-3">
              @foreach($history as $hrow)
                <div class="rounded-xl border border-zinc-200 p-3">
                  <div class="flex items-center justify-between gap-2">
                    <div class="text-sm font-semibold text-zinc-900">
                      {{ $hrow->changed_at?->format('d/m/Y H:i') ?? '—' }}
                    </div>
                    <div class="text-xs text-zinc-600">
                      {{ $statuses[$hrow->from_status] ?? $hrow->from_status }}
                      <span class="mx-1">→</span>
                      {{ $statuses[$hrow->to_status] ?? $hrow->to_status }}
                    </div>
                  </div>
                  <div class="mt-1 text-sm text-zinc-700">
                    {{ $hrow->comment ?: '—' }}
                  </div>
                </div>
              @endforeach
            </div>
          @endif
        </div>
      </section>

      {{-- Editar datos --}}
      <section class="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div class="border-b border-zinc-100 px-4 py-3">
          <h2 class="text-sm font-semibold text-zinc-900">Editar datos</h2>
          <p class="{{ $h }}">Cliente, equipo, trabajo, costos, pagos y notas.</p>
        </div>

        <div class="p-4">
          <form method="POST" action="{{ route('admin.repairs.update', $repair) }}" class="space-y-6">
            @csrf
            @method('PUT')

            {{-- Vínculo usuario --}}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <div class="text-sm font-semibold text-zinc-900">Vincular usuario</div>
                <div class="mt-1 text-sm text-zinc-600">
                  Actual: <span class="font-medium">{{ $linkedUserEmail ?: '—' }}</span>
                </div>
              </div>

              <div class="sm:col-span-2">
                <label class="{{ $l }}">Email</label>
                <input class="{{ $i }}" type="email" name="user_email" value="{{ old('user_email') }}" placeholder="cliente@email.com">
                <p class="{{ $h }} mt-1">Si existe, se vincula. Si no existe, queda sin vínculo.</p>
              </div>

              <div class="sm:col-span-2">
                <label class="inline-flex items-center gap-2 text-sm text-zinc-700">
                  <input type="checkbox" name="unlink_user" value="1" class="rounded border-zinc-300">
                  Desvincular usuario
                </label>
                <p class="{{ $h }} mt-1">Si marcás “Desvincular”, se borra el vínculo aunque pongas un email.</p>
              </div>
            </div>

            <hr class="border-zinc-100">

            {{-- Cliente --}}
            <div>
              <div class="text-sm font-semibold text-zinc-900">Cliente</div>
              <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="{{ $l }}">Nombre *</label>
                  <input class="{{ $i }}" type="text" name="customer_name" required value="{{ old('customer_name', $repair->customer_name) }}">
                </div>
                <div>
                  <label class="{{ $l }}">Teléfono *</label>
                  <input class="{{ $i }}" type="text" name="customer_phone" required value="{{ old('customer_phone', $repair->customer_phone) }}">
                </div>
              </div>
            </div>

            {{-- Equipo --}}
            <div>
              <div class="text-sm font-semibold text-zinc-900">Equipo</div>
              <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="{{ $l }}">Marca</label>
                  <input class="{{ $i }}" type="text" name="device_brand" value="{{ old('device_brand', $repair->device_brand) }}">
                </div>
                <div>
                  <label class="{{ $l }}">Modelo</label>
                  <input class="{{ $i }}" type="text" name="device_model" value="{{ old('device_model', $repair->device_model) }}">
                </div>
              </div>
            </div>

            {{-- Trabajo --}}
            <div>
              <div class="text-sm font-semibold text-zinc-900">Trabajo</div>
              <div class="mt-3 space-y-4">
                <div>
                  <label class="{{ $l }}">Falla reportada *</label>
                  <textarea class="{{ $t }}" name="issue_reported" rows="3" required>{{ old('issue_reported', $repair->issue_reported) }}</textarea>
                </div>
                <div>
                  <label class="{{ $l }}">Diagnóstico</label>
                  <textarea class="{{ $t }}" name="diagnosis" rows="3">{{ old('diagnosis', $repair->diagnosis) }}</textarea>
                </div>
              </div>
            </div>

            {{-- Costos / precio / garantía --}}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="{{ $l }}">Repuestos</label>
                <input class="{{ $i }}" type="number" step="0.01" min="0" name="parts_cost" value="{{ old('parts_cost', $repair->parts_cost) }}">
              </div>
              <div>
                <label class="{{ $l }}">Mano de obra</label>
                <input class="{{ $i }}" type="number" step="0.01" min="0" name="labor_cost" value="{{ old('labor_cost', $repair->labor_cost) }}">
              </div>
              <div>
                <label class="{{ $l }}">Precio final</label>
                <input class="{{ $i }}" type="number" step="0.01" min="0" name="final_price" value="{{ old('final_price', $repair->final_price) }}">
              </div>
              <div>
                <label class="{{ $l }}">Garantía (días)</label>
                <input class="{{ $i }}" type="number" min="0" name="warranty_days" value="{{ old('warranty_days', $repair->warranty_days) }}">
              </div>
            </div>

            {{-- Pagos --}}
            <div>
              <div class="text-sm font-semibold text-zinc-900">Pagos</div>
              <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="{{ $l }}">Pagado</label>
                  <input class="{{ $i }}" type="number" step="0.01" min="0" name="paid_amount" value="{{ old('paid_amount', $repair->paid_amount) }}">
                </div>
                <div>
                  <label class="{{ $l }}">Método</label>
                  <select class="{{ $i }}" name="payment_method">
                    <option value="">—</option>
                    @foreach($paymentMethods as $k => $label)
                      <option value="{{ $k }}" {{ old('payment_method', $repair->payment_method) === $k ? 'selected' : '' }}>
                        {{ $label }}
                      </option>
                    @endforeach
                  </select>
                </div>

                <div class="sm:col-span-2">
                  <label class="{{ $l }}">Notas de pago</label>
                  <textarea class="{{ $t }}" name="payment_notes" rows="2">{{ old('payment_notes', $repair->payment_notes) }}</textarea>
                </div>
              </div>
            </div>

            {{-- Notas --}}
            <div>
              <label class="{{ $l }}">Notas</label>
              <textarea class="{{ $t }}" name="notes" rows="3">{{ old('notes', $repair->notes) }}</textarea>
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
              <button type="submit"
                      class="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </section>

    </div>

    {{-- Sidebar --}}
    <div class="space-y-6">

      {{-- Resumen --}}
      <section class="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div class="border-b border-zinc-100 px-4 py-3">
          <h2 class="text-sm font-semibold text-zinc-900">Resumen</h2>
          <p class="{{ $h }}">Costos, pagos, saldo y garantía.</p>
        </div>
        <div class="p-4 space-y-3 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Repuestos</span>
            <span class="font-semibold text-zinc-900">{{ $money($parts) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Mano de obra</span>
            <span class="font-semibold text-zinc-900">{{ $money($labor) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Costo total</span>
            <span class="font-semibold text-zinc-900">{{ $money($totalCost) }}</span>
          </div>

          <hr class="border-zinc-100">

          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Precio final</span>
            <span class="font-semibold text-zinc-900">{{ $final !== null ? $money($final) : '—' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Pagado</span>
            <span class="font-semibold text-zinc-900">{{ $money($paid) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Saldo</span>
            <span class="font-semibold {{ $balance <= 0 ? 'text-emerald-700' : 'text-rose-700' }}">
              {{ $final !== null ? $money($balance) : '—' }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Ganancia estimada</span>
            <span class="font-semibold {{ $profit >= 0 ? 'text-emerald-700' : 'text-rose-700' }}">
              {{ $final !== null ? $money($profit) : '—' }}
            </span>
          </div>

          <hr class="border-zinc-100">

          <div class="space-y-1">
            <div class="text-zinc-600">Fechas</div>
            <div class="text-zinc-900">
              Recibido: <span class="font-medium">{{ $repair->received_at?->format('d/m/Y H:i') ?? '—' }}</span>
            </div>
            <div class="text-zinc-900">
              Entregado: <span class="font-medium">{{ $repair->delivered_at?->format('d/m/Y H:i') ?? '—' }}</span>
            </div>

            @if(($repair->warranty_days ?? 0) > 0)
              <div class="text-zinc-900">
                Garantía: <span class="font-medium">{{ (int)$repair->warranty_days }} días</span>
              </div>
              <div class="text-zinc-900">
                Vence: <span class="font-medium">{{ $repair->warranty_expires_at?->format('d/m/Y') ?? '—' }}</span>
                @if($repair->in_warranty)
                  <span class="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">En garantía</span>
                @endif
              </div>
            @endif
          </div>
        </div>
      </section>

      {{-- WhatsApp --}}
      <section class="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div class="border-b border-zinc-100 px-4 py-3">
          <h2 class="text-sm font-semibold text-zinc-900">WhatsApp</h2>
          <p class="{{ $h }}">Mensaje sugerido por estado + registro de envíos.</p>
        </div>

        <div class="p-4 space-y-4">
          <div class="text-sm">
            <div class="text-zinc-600">Estado actual</div>
            <div class="font-semibold text-zinc-900">{{ $statuses[$repair->status] ?? $repair->status }}</div>
          </div>

          <div class="text-sm">
            <div class="text-zinc-600">Notificación</div>
            @if(!empty($waNotifiedCurrent))
              <div class="font-semibold text-emerald-700">
                ✅ Avisado
                @if(!empty($waNotifiedAt))
                  <span class="font-normal text-zinc-600">({{ $waNotifiedAt->format('d/m/Y H:i') }})</span>
                @endif
              </div>
            @else
              <div class="font-semibold text-rose-700">⛔ No registrado</div>
            @endif
          </div>

          <div>
            <label class="{{ $l }}">Mensaje</label>
            <textarea id="waMessage" class="{{ $t }}" rows="6" readonly>{{ $waMessage }}</textarea>
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button"
                    data-copy="waMessage"
                    data-label="Copiar"
                    class="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              Copiar
            </button>

            @if($waUrl)
              <a href="{{ $waUrl }}" target="_blank"
                 class="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                Abrir WhatsApp
              </a>
            @endif

            <form method="POST" action="{{ route('admin.repairs.whatsappLog', $repair) }}">
              @csrf
              <button type="submit"
                      class="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
                Registrar envío
              </button>
            </form>
          </div>

          <hr class="border-zinc-100">

          <div>
            <div class="text-sm font-semibold text-zinc-900">Historial de WhatsApp</div>
            @if($waLogs->isEmpty())
              <div class="mt-2 text-sm text-zinc-500">Todavía no hay registros.</div>
            @else
              <div class="mt-3 space-y-2">
                @foreach($waLogs as $log)
                  <div class="rounded-xl border border-zinc-200 p-3">
                    <div class="flex items-center justify-between gap-2">
                      <div class="text-xs text-zinc-500">
                        {{ $log->sent_at?->format('d/m/Y H:i') ?? '—' }}
                      </div>
                      <div class="text-xs font-semibold text-zinc-700">
                        {{ $statuses[$log->notified_status] ?? $log->notified_status }}
                      </div>
                    </div>
                    <div class="mt-1 text-xs text-zinc-600">
                      {{ $log->sentBy?->name ? 'Por: '.$log->sentBy->name : '' }}
                      {{ $log->phone ? ' · '.$log->phone : '' }}
                    </div>
                    <div class="mt-2 text-sm text-zinc-800 whitespace-pre-line">{{ $log->message }}</div>
                  </div>
                @endforeach
              </div>
            @endif
          </div>

        </div>
      </section>

    </div>
  </div>
</div>

<script>
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;

  const id = btn.getAttribute('data-copy');
  const el = document.getElementById(id);
  if (!el) return;

  const text = (el.value ?? el.textContent ?? '').toString();
  try {
    await navigator.clipboard.writeText(text);
    const original = btn.getAttribute('data-label') || btn.textContent;
    btn.textContent = 'Copiado ✅';
    setTimeout(() => (btn.textContent = original), 1200);
  } catch (_) {
    alert('No se pudo copiar. Copiá manualmente el texto.');
  }
});
</script>
@endsection
