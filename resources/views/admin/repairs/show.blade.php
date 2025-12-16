@extends('layouts.app')

@section('title', 'Admin — Reparación ' . ($repair->code ?? ''))

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');
  $statusLabel = $statuses[$repair->status] ?? $repair->status;

  $badge = function(string $st) {
    return match($st) {
      'received' => 'bg-sky-100 text-sky-800 border-sky-200',
      'diagnosing' => 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'waiting_approval' => 'bg-amber-100 text-amber-900 border-amber-200',
      'repairing' => 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'ready_pickup' => 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'delivered' => 'bg-zinc-100 text-zinc-800 border-zinc-200',
      'cancelled' => 'bg-rose-100 text-rose-800 border-rose-200',
      default => 'bg-zinc-100 text-zinc-800 border-zinc-200',
    };
  };

  $device = trim(($repair->device_brand ?? '').' '.($repair->device_model ?? ''));
  $totalCost = (float) ($repair->total_cost ?? ((float)($repair->parts_cost ?? 0) + (float)($repair->labor_cost ?? 0)));
  $profit = (float) ($repair->profit ?? ((float)($repair->final_price ?? 0) - $totalCost));
  $balance = (float) ($repair->balance_due ?? ((float)($repair->final_price ?? 0) - (float)($repair->paid_amount ?? 0)));
  if ($balance < 0) $balance = 0;

  $waAfter = session('wa_after'); // cuando se cambia estado, el controller lo setea
@endphp

@section('content')
<div class="mx-auto w-full max-w-6xl px-4 py-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="text-xl font-black tracking-tight">{{ $repair->code }}</h1>
        <span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold {{ $badge($repair->status) }}">
          {{ $statusLabel }}
        </span>
      </div>
      <p class="mt-1 text-sm text-zinc-600">
        <span class="font-semibold">{{ $repair->customer_name }}</span>
        <span class="text-zinc-400">·</span>
        <span>{{ $repair->customer_phone }}</span>
        <span class="text-zinc-400">·</span>
        <span>{{ $device ?: '—' }}</span>
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <a href="{{ route('admin.repairs.index') }}"
         class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
        Volver
      </a>

      <a href="{{ route('admin.repairs.print', $repair) }}" target="_blank" rel="noopener"
         class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
        Imprimir
      </a>

      @if($waUrl)
        <a href="{{ $waUrl }}" target="_blank" rel="noopener"
           class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          WhatsApp
        </a>
      @else
        <span class="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-500">
          WhatsApp no disponible
        </span>
      @endif
    </div>
  </div>

  @if (session('success'))
    <div class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {{ session('success') }}
    </div>
  @endif

  @if ($errors->any())
    <div class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      <div class="font-bold">Se encontraron errores:</div>
      <ul class="mt-2 list-disc pl-5">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  {{-- Sugerencia WhatsApp post-cambio de estado --}}
  @if(is_array($waAfter) && !empty($waAfter['url']))
    <div class="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="text-sm font-black">Sugerencia: avisar por WhatsApp</div>
          <div class="text-sm text-zinc-700">Se actualizó el estado. Podés enviar el mensaje al toque.</div>
        </div>
        <div class="flex gap-2">
          <button type="button" onclick="navigator.clipboard.writeText(@js($waAfter['message'] ?? ''))"
                  class="rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-sky-50">
            Copiar mensaje
          </button>
          <a href="{{ $waAfter['url'] }}" target="_blank" rel="noopener"
             class="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
            Abrir WhatsApp
          </a>
        </div>
      </div>
    </div>
  @endif

  <div class="mt-5 grid gap-4 lg:grid-cols-3">
    {{-- Col izquierda: resumen --}}
    <div class="space-y-4 lg:col-span-1">
      <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div class="text-sm font-black">Resumen</div>

        <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-xl bg-zinc-50 p-3">
            <div class="text-xs text-zinc-500">Costo total</div>
            <div class="font-black">{{ $money($totalCost) }}</div>
          </div>
          <div class="rounded-xl bg-zinc-50 p-3">
            <div class="text-xs text-zinc-500">Ganancia</div>
            <div class="font-black">{{ $money($profit) }}</div>
          </div>
          <div class="rounded-xl bg-zinc-50 p-3">
            <div class="text-xs text-zinc-500">Final</div>
            <div class="font-black">{{ $money($repair->final_price) }}</div>
          </div>
          <div class="rounded-xl bg-zinc-50 p-3">
            <div class="text-xs text-zinc-500">Debe</div>
            <div class="font-black">{{ $money($balance) }}</div>
          </div>
        </div>

        <div class="mt-4 text-sm text-zinc-700">
          <div class="flex justify-between">
            <span class="text-zinc-500">Recibido</span>
            <span class="font-semibold">{{ $repair->received_at?->format('d/m/Y H:i') ?? '—' }}</span>
          </div>
          <div class="mt-1 flex justify-between">
            <span class="text-zinc-500">Entregado</span>
            <span class="font-semibold">{{ $repair->delivered_at?->format('d/m/Y H:i') ?? '—' }}</span>
          </div>
          <div class="mt-1 flex justify-between">
            <span class="text-zinc-500">Garantía (días)</span>
            <span class="font-semibold">{{ (int)($repair->warranty_days ?? 0) }}</span>
          </div>
          @if(method_exists($repair, 'getWarrantyExpiresAtAttribute') && $repair->warranty_expires_at)
            <div class="mt-1 flex justify-between">
              <span class="text-zinc-500">Vence</span>
              <span class="font-semibold">{{ $repair->warranty_expires_at->format('d/m/Y') }}</span>
            </div>
          @endif
        </div>
      </div>

      <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div class="text-sm font-black">Cambio de estado</div>

        <form method="POST" action="{{ route('admin.repairs.updateStatus', $repair) }}" class="mt-3 space-y-3">
          @csrf

          <select name="status" required
                  class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
            @foreach($statuses as $k => $label)
              <option value="{{ $k }}" @selected($repair->status === $k)>{{ $label }}</option>
            @endforeach
          </select>

          <input name="comment" value="{{ old('comment') }}" placeholder="Comentario (opcional)"
                 class="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">

          <button class="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
            Guardar estado
          </button>
        </form>
      </div>
    </div>

    {{-- Col derecha: edición --}}
    <div class="space-y-4 lg:col-span-2">
      <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-2">
          <div class="text-sm font-black">Editar reparación</div>
          <div class="text-xs text-zinc-500">Campos clave del negocio (costos / pagos / garantía incluidos)</div>
        </div>

        <form method="POST" action="{{ route('admin.repairs.update', $repair) }}" class="mt-4 space-y-4">
          @csrf
          @method('PUT')

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="text-xs font-semibold text-zinc-700">Usuario asociado (email)</label>
              <div class="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input name="user_email" value="{{ old('user_email', $linkedUserEmail) }}" placeholder="cliente@email.com"
                       class="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
                <label class="inline-flex items-center gap-2 text-sm text-zinc-700">
                  <input type="checkbox" name="unlink_user" value="1" class="h-4 w-4 rounded border-zinc-300">
                  Desvincular
                </label>
              </div>
              <p class="mt-1 text-xs text-zinc-500">Si no existe ese usuario, te va a avisar. Si marcás “Desvincular”, se borra la relación.</p>
            </div>

            <div>
              <label class="text-xs font-semibold text-zinc-700">Nombre *</label>
              <input name="customer_name" required value="{{ old('customer_name', $repair->customer_name) }}"
                     class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
            </div>

            <div>
              <label class="text-xs font-semibold text-zinc-700">Teléfono *</label>
              <input name="customer_phone" required value="{{ old('customer_phone', $repair->customer_phone) }}"
                     class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
            </div>

            <div>
              <label class="text-xs font-semibold text-zinc-700">Marca</label>
              <input name="device_brand" value="{{ old('device_brand', $repair->device_brand) }}"
                     class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
            </div>

            <div>
              <label class="text-xs font-semibold text-zinc-700">Modelo</label>
              <input name="device_model" value="{{ old('device_model', $repair->device_model) }}"
                     class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
            </div>

            <div class="sm:col-span-2">
              <label class="text-xs font-semibold text-zinc-700">Falla reportada *</label>
              <textarea name="issue_reported" required rows="3"
                        class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">{{ old('issue_reported', $repair->issue_reported) }}</textarea>
            </div>

            <div class="sm:col-span-2">
              <label class="text-xs font-semibold text-zinc-700">Diagnóstico</label>
              <textarea name="diagnosis" rows="3"
                        class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">{{ old('diagnosis', $repair->diagnosis) }}</textarea>
            </div>
          </div>

          <div class="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <div class="text-sm font-black">Finanzas y pagos</div>
            <div class="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <label class="text-xs font-semibold text-zinc-700">Repuestos</label>
                <input name="parts_cost" value="{{ old('parts_cost', $repair->parts_cost) }}"
                       class="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
              </div>

              <div>
                <label class="text-xs font-semibold text-zinc-700">Mano de obra</label>
                <input name="labor_cost" value="{{ old('labor_cost', $repair->labor_cost) }}"
                       class="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
              </div>

              <div>
                <label class="text-xs font-semibold text-zinc-700">Precio final</label>
                <input name="final_price" value="{{ old('final_price', $repair->final_price) }}"
                       class="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
              </div>

              <div>
                <label class="text-xs font-semibold text-zinc-700">Pagado</label>
                <input name="paid_amount" value="{{ old('paid_amount', $repair->paid_amount) }}"
                       class="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
              </div>

              <div>
                <label class="text-xs font-semibold text-zinc-700">Método</label>
                <select name="payment_method"
                        class="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
                  <option value="">—</option>
                  @foreach($paymentMethods as $k => $label)
                    <option value="{{ $k }}" @selected((string)old('payment_method', $repair->payment_method) === (string)$k)>{{ $label }}</option>
                  @endforeach
                </select>
              </div>

              <div>
                <label class="text-xs font-semibold text-zinc-700">Garantía (días)</label>
                <input name="warranty_days" value="{{ old('warranty_days', $repair->warranty_days) }}"
                       class="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
              </div>

              <div class="sm:col-span-3">
                <label class="text-xs font-semibold text-zinc-700">Notas de pago</label>
                <input name="payment_notes" value="{{ old('payment_notes', $repair->payment_notes) }}"
                       class="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
              </div>
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold text-zinc-700">Notas internas</label>
            <textarea name="notes" rows="3"
                      class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">{{ old('notes', $repair->notes) }}</textarea>
          </div>

          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button class="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
              Guardar cambios
            </button>
          </div>
        </form>
      </div>

      {{-- WhatsApp --}}
      <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="text-sm font-black">WhatsApp</div>
            <div class="text-sm text-zinc-600">
              Estado actual: <span class="font-semibold">{{ $statusLabel }}</span>
              @if($waNotifiedAt)
                <span class="text-zinc-400">·</span> Último registro: <span class="font-semibold">{{ \Illuminate\Support\Carbon::parse($waNotifiedAt)->format('d/m/Y H:i') }}</span>
              @endif
            </div>
          </div>

          <div class="flex gap-2">
            <button type="button" onclick="navigator.clipboard.writeText(@js($waMessage ?? ''))"
                    class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
              Copiar mensaje
            </button>

            @if($waUrl)
              <a id="waOpenBtn" href="{{ $waUrl }}" target="_blank" rel="noopener"
                 class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                 data-log-url="{{ route('admin.repairs.whatsappLogAjax', $repair) }}">
                Abrir WhatsApp
              </a>
            @endif
          </div>
        </div>

        <div class="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800 whitespace-pre-wrap">
          {{ $waMessage }}
        </div>

        <div id="waToast" class="mt-3 hidden rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Registro de WhatsApp guardado ✅
        </div>

        @if($waLogs && $waLogs->count())
          <div class="mt-4">
            <div class="text-xs font-bold text-zinc-500 uppercase">Historial</div>
            <div class="mt-2 space-y-2">
              @foreach($waLogs as $log)
                <div class="rounded-xl border border-zinc-200 bg-white p-3 text-sm">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="font-semibold">
                      {{ $statuses[$log->notified_status] ?? $log->notified_status }}
                      <span class="text-zinc-400">·</span> {{ $log->sent_at?->format('d/m/Y H:i') ?? '—' }}
                    </div>
                    <div class="text-xs text-zinc-500">
                      {{ $log->sentBy?->name ?? 'Sistema' }}
                    </div>
                  </div>
                  <div class="mt-2 whitespace-pre-wrap text-xs text-zinc-700">{{ $log->message }}</div>
                </div>
              @endforeach
            </div>
          </div>
        @endif
      </div>

      {{-- Historial de estados --}}
      <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div class="text-sm font-black">Historial de estados</div>

        @if($history && $history->count())
          <div class="mt-3 space-y-2">
            @foreach($history as $h)
              <div class="rounded-xl border border-zinc-200 bg-white p-3 text-sm">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="font-semibold">
                    {{ $statuses[$h->to_status] ?? $h->to_status }}
                    @if($h->from_status)
                      <span class="text-zinc-400">·</span>
                      <span class="text-zinc-500">desde {{ $statuses[$h->from_status] ?? $h->from_status }}</span>
                    @endif
                  </div>
                  <div class="text-xs text-zinc-500">
                    {{ \Illuminate\Support\Carbon::parse($h->changed_at)->format('d/m/Y H:i') }}
                  </div>
                </div>
                @if($h->comment)
                  <div class="mt-1 text-xs text-zinc-700">{{ $h->comment }}</div>
                @endif
              </div>
            @endforeach
          </div>
        @else
          <div class="mt-3 text-sm text-zinc-600">Sin movimientos todavía.</div>
        @endif
      </div>
    </div>
  </div>
</div>

<script>
  // Log automático por AJAX al abrir WhatsApp (sin recargar)
  (function () {
    const btn = document.getElementById('waOpenBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-log-url');
      if (!url) return;

      fetch(url, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': @js(csrf_token()),
          'Accept': 'application/json'
        },
        body: new URLSearchParams()
      })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(() => {
        const toast = document.getElementById('waToast');
        if (!toast) return;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2500);
      })
      .catch(() => {});
    });
  })();
</script>
@endsection
