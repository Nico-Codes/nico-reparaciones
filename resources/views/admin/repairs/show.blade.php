@extends('layouts.app')

@section('title', 'Admin — Reparación ' . ($repair->code ?? ''))

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');

  $badge = function(string $st) {
    return match($st) {
      'received' => 'badge-sky',
      'diagnosing' => 'badge-indigo',
      'waiting_approval' => 'badge-amber',
      'repairing' => 'badge-indigo',
      'ready_pickup' => 'badge-emerald',
      'delivered' => 'badge-zinc',
      'cancelled' => 'badge-rose',
      default => 'badge-zinc',
    };
  };

  $statusLabel = $statuses[$repair->status] ?? $repair->status;
  $device = trim(($repair->device_brand ?? '').' '.($repair->device_model ?? ''));

  $totalCost = (float) ($repair->total_cost ?? ((float)($repair->parts_cost ?? 0) + (float)($repair->labor_cost ?? 0)));
  $profit    = (float) ($repair->profit ?? ((float)($repair->final_price ?? 0) - $totalCost));
  $balance   = (float) ($repair->balance_due ?? ((float)($repair->final_price ?? 0) - (float)($repair->paid_amount ?? 0)));
  if ($balance < 0) $balance = 0;

  $waAfter = session('wa_after'); // cuando se cambia estado, el controller lo setea
@endphp

@section('content')
<div class="mx-auto w-full max-w-6xl px-4 py-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div class="min-w-0">
      <div class="flex flex-wrap items-center gap-2">
        <div class="page-title mb-0">{{ $repair->code }}</div>
        <span class="{{ $badge($repair->status) }}">{{ $statusLabel }}</span>
      </div>

      <div class="page-subtitle mt-1">
        <span class="font-black text-zinc-900">{{ $repair->customer_name }}</span>
        <span class="text-zinc-300">·</span>
        <span class="font-bold">{{ $repair->customer_phone }}</span>
        <span class="text-zinc-300">·</span>
        <span>{{ $device ?: '—' }}</span>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <a href="{{ route('admin.repairs.index') }}" class="btn-outline">Volver</a>

      <a href="{{ route('admin.repairs.print', $repair) }}" target="_blank" rel="noopener" class="btn-outline">
        Imprimir
      </a>

      @if($waUrl)
        <a href="{{ $waUrl }}" target="_blank" rel="noopener"
           class="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold transition active:scale-[0.99] bg-emerald-600 text-white hover:bg-emerald-700">
          WhatsApp
        </a>
      @else
        <span class="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-extrabold bg-zinc-100 text-zinc-500">
          WhatsApp no disponible
        </span>
      @endif
    </div>
  </div>

  @if(session('success'))
    <div class="alert-success mt-4">{{ session('success') }}</div>
  @endif

  @if($errors->any())
    <div class="alert-error mt-4">
      <div class="font-black">Se encontraron errores:</div>
      <ul class="mt-2 list-disc pl-5">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  {{-- Sugerencia WhatsApp post-cambio de estado --}}
  @if(is_array($waAfter) && !empty($waAfter['url']))
    <div class="card mt-4">
      <div class="card-head">
        <div class="font-black">Sugerencia: avisar por WhatsApp</div>
        <span class="badge-sky">Recomendado</span>
      </div>

      <div class="card-body">
        <div class="muted">
          Se actualizó el estado. Podés enviar el mensaje al toque.
        </div>

        <div class="mt-4 flex flex-col sm:flex-row gap-2">
          <button type="button"
                  onclick="navigator.clipboard.writeText(@js($waAfter['message'] ?? ''))"
                  class="btn-outline w-full sm:w-auto">
            Copiar mensaje
          </button>

          <a href="{{ $waAfter['url'] }}" target="_blank" rel="noopener"
             class="btn-primary w-full sm:w-auto">
            Abrir WhatsApp
          </a>
        </div>
      </div>
    </div>
  @endif

  <div class="mt-5 grid gap-4 lg:grid-cols-3">
    {{-- Columna izquierda: resumen + estado --}}
    <div class="lg:col-span-1 grid gap-4">
      <div class="card">
        <div class="card-head">
          <div class="font-black">Resumen</div>
          <span class="{{ $badge($repair->status) }}">{{ $statusLabel }}</span>
        </div>

        <div class="card-body">
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
              <div class="text-xs text-zinc-500">Costo total</div>
              <div class="font-black text-zinc-900">{{ $money($totalCost) }}</div>
            </div>

            <div class="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
              <div class="text-xs text-zinc-500">Ganancia</div>
              <div class="font-black text-zinc-900">{{ $money($profit) }}</div>
            </div>

            <div class="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
              <div class="text-xs text-zinc-500">Final</div>
              <div class="font-black text-zinc-900">{{ $money($repair->final_price) }}</div>
            </div>

            <div class="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
              <div class="text-xs text-zinc-500">Debe</div>
              <div class="font-black text-zinc-900">{{ $money($balance) }}</div>
            </div>
          </div>

          <div class="mt-4 text-sm text-zinc-700 grid gap-1">
            <div class="flex justify-between">
              <span class="text-zinc-500">Recibido</span>
              <span class="font-bold">{{ $repair->received_at?->format('d/m/Y H:i') ?? '—' }}</span>
            </div>

            <div class="flex justify-between">
              <span class="text-zinc-500">Entregado</span>
              <span class="font-bold">{{ $repair->delivered_at?->format('d/m/Y H:i') ?? '—' }}</span>
            </div>

            <div class="flex justify-between">
              <span class="text-zinc-500">Garantía (días)</span>
              <span class="font-bold">{{ (int)($repair->warranty_days ?? 0) }}</span>
            </div>

            @if(method_exists($repair, 'getWarrantyExpiresAtAttribute') && $repair->warranty_expires_at)
              <div class="flex justify-between">
                <span class="text-zinc-500">Vence</span>
                <span class="font-bold">{{ $repair->warranty_expires_at->format('d/m/Y') }}</span>
              </div>
            @endif
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="font-black">Cambio de estado</div>
          <span class="badge-zinc">Rápido</span>
        </div>

        <div class="card-body">
          <form method="POST" action="{{ route('admin.repairs.updateStatus', $repair) }}" class="grid gap-3">
            @csrf

            <div>
              <label>Estado</label>
              <select name="status" required>
                @foreach($statuses as $k => $label)
                  <option value="{{ $k }}" @selected($repair->status === $k)>{{ $label }}</option>
                @endforeach
              </select>
            </div>

            <div>
              <label>Comentario</label>
              <input name="comment" value="{{ old('comment') }}" placeholder="Opcional">
            </div>

            <button class="btn-primary w-full" type="submit">Guardar estado</button>
            <div class="text-xs text-zinc-500">
              Tip: si lo pasás a <span class="font-black text-zinc-900">Listo para retirar</span>, conviene avisar por WhatsApp.
            </div>
          </form>
        </div>
      </div>
    </div>

    {{-- Columna derecha: edición + whatsapp + historial --}}
    <div class="lg:col-span-2 grid gap-4">
      <div class="card">
        <div class="card-head">
          <div class="font-black">Editar reparación</div>
          <div class="text-xs text-zinc-500">Datos cliente / equipo / diagnóstico / finanzas.</div>
        </div>

        <div class="card-body">
          <form method="POST" action="{{ route('admin.repairs.update', $repair) }}" class="grid gap-4">
            @csrf
            @method('PUT')

            <div class="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
              <div class="font-black text-zinc-900">Vincular usuario (opcional)</div>
              <div class="muted mt-1">Si el email existe, queda asociado y el cliente lo ve en “Mis reparaciones”.</div>

              <div class="mt-3 grid gap-2 sm:grid-cols-3">
                <div class="sm:col-span-2">
                  <label>Email</label>
                  <input name="user_email" value="{{ old('user_email', $linkedUserEmail) }}" placeholder="cliente@email.com">
                </div>

                <div class="sm:col-span-1 flex items-end">
                  <label class="inline-flex items-center gap-2 text-sm text-zinc-800 font-bold">
                    <input type="checkbox" name="unlink_user" value="1" class="h-4 w-4 rounded border-zinc-300">
                    Desvincular
                  </label>
                </div>
              </div>

              <div class="text-xs text-zinc-500 mt-2">
                Si marcás “Desvincular”, se borra la relación (no elimina al usuario).
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label>Nombre *</label>
                <input name="customer_name" required value="{{ old('customer_name', $repair->customer_name) }}">
              </div>

              <div>
                <label>Teléfono *</label>
                <input name="customer_phone" required value="{{ old('customer_phone', $repair->customer_phone) }}">
              </div>

              <div>
                <label>Marca</label>
                <input name="device_brand" value="{{ old('device_brand', $repair->device_brand) }}">
              </div>

              <div>
                <label>Modelo</label>
                <input name="device_model" value="{{ old('device_model', $repair->device_model) }}">
              </div>

              <div class="sm:col-span-2">
                <label>Falla reportada *</label>
                <textarea name="issue_reported" required rows="3">{{ old('issue_reported', $repair->issue_reported) }}</textarea>
              </div>

              <div class="sm:col-span-2">
                <label>Diagnóstico</label>
                <textarea name="diagnosis" rows="3">{{ old('diagnosis', $repair->diagnosis) }}</textarea>
              </div>
            </div>

            <div class="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
              <div class="font-black text-zinc-900">Finanzas y pagos</div>

              <div class="mt-3 grid gap-4 sm:grid-cols-3">
                <div>
                  <label>Repuestos</label>
                  <input name="parts_cost" value="{{ old('parts_cost', $repair->parts_cost) }}">
                </div>

                <div>
                  <label>Mano de obra</label>
                  <input name="labor_cost" value="{{ old('labor_cost', $repair->labor_cost) }}">
                </div>

                <div>
                  <label>Precio final</label>
                  <input name="final_price" value="{{ old('final_price', $repair->final_price) }}">
                </div>

                <div>
                  <label>Pagado</label>
                  <input name="paid_amount" value="{{ old('paid_amount', $repair->paid_amount) }}">
                </div>

                <div>
                  <label>Método</label>
                  <select name="payment_method">
                    <option value="">—</option>
                    @foreach($paymentMethods as $k => $label)
                      <option value="{{ $k }}" @selected((string)old('payment_method', $repair->payment_method) === (string)$k)>{{ $label }}</option>
                    @endforeach
                  </select>
                </div>

                <div>
                  <label>Garantía (días)</label>
                  <input name="warranty_days" value="{{ old('warranty_days', $repair->warranty_days) }}">
                </div>

                <div class="sm:col-span-3">
                  <label>Notas de pago</label>
                  <input name="payment_notes" value="{{ old('payment_notes', $repair->payment_notes) }}">
                </div>
              </div>
            </div>

            <div>
              <label>Notas internas</label>
              <textarea name="notes" rows="3">{{ old('notes', $repair->notes) }}</textarea>
            </div>

            <div class="flex justify-end">
              <button class="btn-primary" type="submit">Guardar cambios</button>
            </div>
          </form>
        </div>
      </div>

      <div class="card" id="whatsapp">
        <div class="card-head">
          <div class="font-black">WhatsApp</div>
          <div class="text-xs text-zinc-500">
            Estado: <span class="font-black text-zinc-900">{{ $statusLabel }}</span>
            @if($waNotifiedAt)
              <span class="text-zinc-300">·</span> Último registro: <span class="font-black text-zinc-900">{{ \Illuminate\Support\Carbon::parse($waNotifiedAt)->format('d/m/Y H:i') }}</span>
            @endif
          </div>
        </div>

        <div class="card-body">
          <div class="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <button type="button"
                    onclick="navigator.clipboard.writeText(@js($waMessage ?? ''))"
                    class="btn-outline w-full sm:w-auto">
              Copiar mensaje
            </button>

            @if($waUrl)
              <a id="waOpenBtn" href="{{ $waUrl }}" target="_blank" rel="noopener"
                 class="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold transition active:scale-[0.99] bg-emerald-600 text-white hover:bg-emerald-700 w-full sm:w-auto"
                 data-log-url="{{ route('admin.repairs.whatsappLogAjax', $repair) }}">
                Abrir WhatsApp
              </a>
            @endif
          </div>

          <div class="mt-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-800 whitespace-pre-wrap">
            {{ $waMessage }}
          </div>

          <div id="waToast" class="mt-3 hidden alert-success">
            Registro de WhatsApp guardado ✅
          </div>

          @if($waLogs && $waLogs->count())
            <div class="mt-4">
              <div class="text-xs font-black uppercase text-zinc-500">Historial WhatsApp</div>
              <div class="mt-2 grid gap-2">
                @foreach($waLogs as $log)
                  <div class="rounded-2xl border border-zinc-100 bg-white p-3 text-sm">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <div class="font-bold text-zinc-900">
                        {{ $statuses[$log->notified_status] ?? $log->notified_status }}
                        <span class="text-zinc-300">·</span>
                        {{ $log->sent_at?->format('d/m/Y H:i') ?? '—' }}
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
      </div>

      <div class="card">
        <div class="card-head">
          <div class="font-black">Historial de estados</div>
          <span class="badge-zinc">{{ $history?->count() ?? 0 }}</span>
        </div>

        <div class="card-body">
          @if($history && $history->count())
            <div class="relative pl-6">
              <div class="absolute left-2 top-1 bottom-1 w-px bg-zinc-200"></div>

              <div class="grid gap-3">
                @foreach($history as $h)
                  @php
                    $to = $statuses[$h->to_status] ?? $h->to_status;
                    $from = $h->from_status ? ($statuses[$h->from_status] ?? $h->from_status) : null;
                    $when = $h->changed_at ? \Illuminate\Support\Carbon::parse($h->changed_at)->format('d/m/Y H:i') : '—';
                  @endphp

                  <div class="relative">
                    <div class="absolute -left-[3px] top-2 h-3 w-3 rounded-full bg-sky-600"></div>

                    <div class="rounded-2xl border border-zinc-100 bg-white p-3">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="font-black text-zinc-900">
                          {{ $to }}
                          @if($from)
                            <span class="text-zinc-300">·</span>
                            <span class="text-sm font-bold text-zinc-600">desde {{ $from }}</span>
                          @endif
                        </div>

                        <div class="text-xs text-zinc-500">{{ $when }}</div>
                      </div>

                      @if($h->comment)
                        <div class="mt-1 text-sm text-zinc-700">{{ $h->comment }}</div>
                      @endif
                    </div>
                  </div>
                @endforeach
              </div>
            </div>
          @else
            <div class="muted">Sin movimientos todavía.</div>
          @endif
        </div>
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
