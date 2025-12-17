@extends('layouts.app')

@section('title', 'Admin — Reparación ' . ($repair->code ?? ''))

@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');
  $statusLabel = $statuses[$repair->status] ?? $repair->status;

  $device = trim(($repair->device_brand ?? '') . ' ' . ($repair->device_model ?? ''));
  $device = $device !== '' ? $device : null;

  $badge = function(string $st) {
    return match($st) {
      'received'         => 'badge-sky',
      'diagnosing'       => 'badge-indigo',
      'waiting_approval' => 'badge-amber',
      'repairing'        => 'badge-indigo',
      'ready_pickup'     => 'badge-emerald',
      'delivered'        => 'badge-zinc',
      'cancelled'        => 'badge-rose',
      default            => 'badge-zinc',
    };
  };

  $final = (float)($repair->final_price ?? 0);
  $paid  = (float)($repair->paid_amount ?? 0);
  $due   = max(0, $final - $paid);

  $wExp = null;
  if ($repair->delivered_at && (int)($repair->warranty_days ?? 0) > 0) {
    $wExp = $repair->delivered_at->copy()->addDays((int)$repair->warranty_days);
  }
  $wActive = $wExp ? now()->lte($wExp) : false;
@endphp

@section('content')
<div class="container-page py-6">
  <div class="page-head">
    <div>
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="page-title">{{ $repair->code }}</h1>
        <span class="{{ $badge($repair->status) }}">{{ $statusLabel }}</span>

        @if($repair->delivered_at && $wExp)
          <span class="{{ $wActive ? 'badge-emerald' : 'badge-rose' }}">
            Garantía {{ $wActive ? 'vigente' : 'vencida' }} ({{ $wExp->format('d/m/Y') }})
          </span>
        @endif
      </div>

      <p class="page-subtitle mt-1">
        <span class="font-extrabold">{{ $repair->customer_name }}</span>
        <span class="text-zinc-400">·</span>
        <span class="font-semibold">{{ $repair->customer_phone }}</span>
        <span class="text-zinc-400">·</span>
        <span>{{ $device ?: '—' }}</span>
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <a href="{{ route('admin.repairs.index') }}" class="btn-ghost btn-sm">Volver</a>
      <a href="{{ route('admin.repairs.print', $repair) }}" class="btn-outline btn-sm" target="_blank" rel="noopener">Imprimir</a>

      @if($waUrl)
        <a href="{{ $waUrl }}" class="btn-primary btn-sm" target="_blank" rel="noopener" data-wa-open
           data-wa-ajax="{{ route('admin.repairs.whatsappLogAjax', $repair) }}">
          WhatsApp
        </a>
      @endif
    </div>
  </div>

  @if (session('success'))
    <div class="alert-success mb-4">{{ session('success') }}</div>
  @endif

  @if ($errors->any())
    <div class="alert-error mb-4">
      <div class="font-black">Se encontraron errores:</div>
      <ul class="mt-2 list-disc pl-5 font-semibold">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  {{-- WA toast --}}
  <div id="waToast"
       class="fixed left-1/2 top-4 z-50 hidden -translate-x-1/2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-900 shadow-lg
              opacity-0 translate-y-[-6px] transition-all duration-200">
    Listo.
  </div>

  <div class="grid gap-4 lg:grid-cols-3">
    {{-- Columna izquierda: resumen + estado + whatsapp --}}
    <div class="space-y-4 lg:col-span-1">
      <div class="card">
        <div class="card-head">
          <div class="font-black">Resumen</div>
          <span class="badge-zinc">Código: {{ $repair->code }}</span>
        </div>
        <div class="card-body">
          <div class="text-sm text-zinc-700 space-y-2">
            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Recibido</span>
              <span class="font-extrabold text-right">{{ $repair->received_at?->format('d/m/Y H:i') ?? '—' }}</span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Entregado</span>
              <span class="font-extrabold text-right">{{ $repair->delivered_at?->format('d/m/Y H:i') ?? '—' }}</span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Precio final</span>
              <span class="font-black text-right">{{ $money($final) }}</span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Pagado</span>
              <span class="font-black text-right">{{ $money($paid) }}</span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Debe</span>
              <span class="{{ $due > 0 ? 'font-black text-rose-700' : 'font-black text-emerald-700' }} text-right">
                {{ $money($due) }}
              </span>
            </div>

            <div class="pt-2 border-t border-zinc-100">
              <div class="flex items-start justify-between gap-3">
                <span class="text-zinc-500">Usuario asociado</span>
                <span class="font-extrabold text-right">{{ $linkedUserEmail ?: '—' }}</span>
              </div>
            </div>
          </div>

          @if($repair->notes)
            <div class="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
              <div class="text-xs font-black uppercase text-zinc-500">Notas internas</div>
              <div class="mt-1 whitespace-pre-wrap font-semibold text-zinc-800">{{ $repair->notes }}</div>
            </div>
          @endif
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="font-black">Cambiar estado</div>
          <span class="{{ $badge($repair->status) }}">{{ $statusLabel }}</span>
        </div>
        <div class="card-body">
          <form method="POST" action="{{ route('admin.repairs.updateStatus', $repair) }}" class="space-y-3">
            @csrf

            <div>
              <label for="status" class="block mb-1">Nuevo estado</label>
              <select id="status" name="status">
                @foreach($statuses as $k => $label)
                  <option value="{{ $k }}" @selected(old('status', $repair->status) === $k)>{{ $label }}</option>
                @endforeach
              </select>
            </div>

            <button class="btn-primary w-full">Guardar estado</button>

            <p class="text-xs text-zinc-500">
              Si marcás “Entregado”, la garantía (si tiene días) se calcula desde la fecha de entrega.
            </p>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="font-black">WhatsApp</div>
          @if($waNotifiedAt)
            <span class="badge-zinc">Último: {{ $waNotifiedAt->format('d/m/Y H:i') }}</span>
          @else
            <span class="badge-zinc">Sin envíos</span>
          @endif
        </div>
        <div class="card-body">
          <div class="text-sm text-zinc-700 space-y-2">
            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Teléfono</span>
              <span class="font-extrabold text-right">{{ $repair->customer_phone ?: '—' }}</span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-zinc-500">Estado notificado</span>
              <span class="{{ $waNotifiedCurrent ? 'badge-emerald' : 'badge-amber' }}">
                {{ $waNotifiedCurrent ? 'Al día' : 'Pendiente' }}
              </span>
            </div>
          </div>

          @if($waMessage)
            <div class="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
              <div class="text-xs font-black uppercase text-zinc-500">Mensaje</div>
              <div class="mt-1 whitespace-pre-wrap font-semibold text-zinc-800">{{ $waMessage }}</div>
            </div>
          @endif

          @if($waUrl)
            <a href="{{ $waUrl }}" target="_blank" rel="noopener"
               class="btn-primary w-full mt-4"
               data-wa-open
               data-wa-ajax="{{ route('admin.repairs.whatsappLogAjax', $repair) }}">
              Abrir WhatsApp
            </a>
            <p class="mt-2 text-xs text-zinc-500">
              Nota: se registra el envío y se evita duplicar si ya se envió el mismo estado recientemente.
            </p>
          @else
            <div class="mt-4 text-sm text-rose-700 font-extrabold">
              Teléfono inválido o vacío: no se puede generar el link de WhatsApp.
            </div>
          @endif
        </div>
      </div>

      {{-- Historial de estados --}}
      <div class="card">
        <div class="card-head">
          <div class="font-black">Historial</div>
          <span class="badge-zinc">{{ $history->count() }} cambios</span>
        </div>
        <div class="card-body">
          @if($history->count())
            <ol class="space-y-3">
              @foreach($history as $h)
                <li class="flex items-start gap-3">
                  <div class="mt-1 h-2.5 w-2.5 rounded-full bg-zinc-300"></div>
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="{{ $badge($h->status) }}">{{ $statuses[$h->status] ?? $h->status }}</span>
                      <span class="text-xs text-zinc-500 font-semibold">
                        {{ $h->created_at?->format('d/m/Y H:i') ?? '—' }}
                      </span>
                    </div>
                    @if($h->note)
                      <div class="mt-1 text-sm font-semibold text-zinc-800 whitespace-pre-wrap">{{ $h->note }}</div>
                    @endif
                  </div>
                </li>
              @endforeach
            </ol>
          @else
            <div class="text-sm text-zinc-500">Sin historial aún.</div>
          @endif
        </div>
      </div>

      {{-- Logs de WhatsApp --}}
      <div class="card">
        <div class="card-head">
          <div class="font-black">Logs WhatsApp</div>
          <span class="badge-zinc">{{ $waLogs->count() }}</span>
        </div>
        <div class="card-body">
          @if($waLogs->count())
            <div class="space-y-2 text-sm">
              @foreach($waLogs as $l)
                <div class="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3">
                  <div class="min-w-0">
                    <div class="font-extrabold text-zinc-900">
                      {{ $statuses[$l->notified_status] ?? $l->notified_status }}
                    </div>
                    <div class="text-xs text-zinc-500 font-semibold">
                      {{ $l->sent_at?->format('d/m/Y H:i') ?? ($l->created_at?->format('d/m/Y H:i') ?? '—') }}
                    </div>
                  </div>
                  <span class="badge-zinc">OK</span>
                </div>
              @endforeach
            </div>
          @else
            <div class="text-sm text-zinc-500">Aún no se registraron envíos.</div>
          @endif
        </div>
      </div>
    </div>

    {{-- Columna derecha: edición completa --}}
    <div class="lg:col-span-2 space-y-4">
      <div class="card">
        <div class="card-head">
          <div class="font-black">Editar reparación</div>
          <span class="badge-zinc">Se guarda en el momento</span>
        </div>
        <div class="card-body">
          <form method="POST" action="{{ route('admin.repairs.update', $repair) }}" class="space-y-5">
            @csrf
            @method('PUT')

            {{-- Asociación de usuario --}}
            <div class="grid gap-3 md:grid-cols-2">
              <div>
                <label for="user_email" class="block mb-1">Vincular por email (opcional)</label>
                <input id="user_email" name="user_email" type="email" value="{{ old('user_email', $linkedUserEmail) }}" placeholder="cliente@correo.com">
                <p class="mt-1 text-xs text-zinc-500">
                  Si existe un usuario con ese email, se asocia la reparación a su cuenta.
                </p>
              </div>
              <div class="flex items-end">
                <label class="inline-flex items-center gap-2 text-sm font-extrabold">
                  <input type="checkbox" class="h-4 w-4 rounded border-zinc-300" name="unlink_user" value="1" @checked(old('unlink_user'))>
                  Desvincular usuario actual
                </label>
              </div>
            </div>

            <hr>

            {{-- Cliente / Equipo --}}
            <div class="grid gap-3 md:grid-cols-2">
              <div>
                <label for="customer_name" class="block mb-1">Nombre cliente</label>
                <input id="customer_name" name="customer_name" value="{{ old('customer_name', $repair->customer_name) }}">
              </div>
              <div>
                <label for="customer_phone" class="block mb-1">Teléfono cliente</label>
                <input id="customer_phone" name="customer_phone" value="{{ old('customer_phone', $repair->customer_phone) }}">
              </div>

              <div>
                <label for="device_brand" class="block mb-1">Marca</label>
                <input id="device_brand" name="device_brand" value="{{ old('device_brand', $repair->device_brand) }}">
              </div>
              <div>
                <label for="device_model" class="block mb-1">Modelo</label>
                <input id="device_model" name="device_model" value="{{ old('device_model', $repair->device_model) }}">
              </div>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <div>
                <label for="issue_reported" class="block mb-1">Problema reportado</label>
                <textarea id="issue_reported" name="issue_reported" rows="4">{{ old('issue_reported', $repair->issue_reported) }}</textarea>
              </div>
              <div>
                <label for="diagnosis" class="block mb-1">Diagnóstico</label>
                <textarea id="diagnosis" name="diagnosis" rows="4">{{ old('diagnosis', $repair->diagnosis) }}</textarea>
              </div>
            </div>

            <hr>

            {{-- Finanzas --}}
            <div class="grid gap-3 md:grid-cols-3">
              <div>
                <label for="parts_cost" class="block mb-1">Repuestos</label>
                <input id="parts_cost" name="parts_cost" inputmode="decimal" value="{{ old('parts_cost', $repair->parts_cost) }}">
              </div>
              <div>
                <label for="labor_cost" class="block mb-1">Mano de obra</label>
                <input id="labor_cost" name="labor_cost" inputmode="decimal" value="{{ old('labor_cost', $repair->labor_cost) }}">
              </div>
              <div>
                <label for="final_price" class="block mb-1">Precio final</label>
                <input id="final_price" name="final_price" inputmode="decimal" value="{{ old('final_price', $repair->final_price) }}">
              </div>
            </div>

            <div class="grid gap-3 md:grid-cols-3">
              <div>
                <label for="paid_amount" class="block mb-1">Pagado</label>
                <input id="paid_amount" name="paid_amount" inputmode="decimal" value="{{ old('paid_amount', $repair->paid_amount) }}">
              </div>

              <div>
                <label for="payment_method" class="block mb-1">Método</label>
                <select id="payment_method" name="payment_method">
                  <option value="">—</option>
                  @foreach($paymentMethods as $k => $label)
                    <option value="{{ $k }}" @selected(old('payment_method', $repair->payment_method) === $k)>{{ $label }}</option>
                  @endforeach
                </select>
              </div>

              <div>
                <label for="warranty_days" class="block mb-1">Garantía (días)</label>
                <input id="warranty_days" name="warranty_days" inputmode="numeric" value="{{ old('warranty_days', $repair->warranty_days) }}">
              </div>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <div>
                <label for="payment_notes" class="block mb-1">Notas de pago</label>
                <textarea id="payment_notes" name="payment_notes" rows="3">{{ old('payment_notes', $repair->payment_notes) }}</textarea>
              </div>
              <div>
                <label for="notes" class="block mb-1">Notas internas</label>
                <textarea id="notes" name="notes" rows="3">{{ old('notes', $repair->notes) }}</textarea>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-2">
              <button class="btn-primary">Guardar cambios</button>
              <a href="{{ route('admin.repairs.show', $repair) }}" class="btn-outline">Cancelar</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
(function () {
  const toast = document.getElementById('waToast');
  function showToast(text, isError) {
    if (!toast) return;
    toast.textContent = text || 'Listo.';
    toast.classList.toggle('border-emerald-200', !isError);
    toast.classList.toggle('bg-emerald-50', !isError);
    toast.classList.toggle('text-emerald-900', !isError);

    toast.classList.toggle('border-rose-200', !!isError);
    toast.classList.toggle('bg-rose-50', !!isError);
    toast.classList.toggle('text-rose-900', !!isError);

    toast.classList.remove('hidden');
    requestAnimationFrame(() => {
      toast.classList.remove('opacity-0', 'translate-y-[-6px]');
      toast.classList.add('opacity-100', 'translate-y-0');
    });

    clearTimeout(window.__waToastT);
    window.__waToastT = setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-[-6px]');
      toast.classList.remove('opacity-100', 'translate-y-0');
      setTimeout(() => toast.classList.add('hidden'), 200);
    }, 2600);
  }

  document.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-wa-open]');
    if (!a) return;
    e.preventDefault();

    // Abrimos WhatsApp primero para evitar bloqueos.
    const url = a.getAttribute('href');
    window.open(url, '_blank', 'noopener');

    const ajaxUrl = a.dataset.waAjax;
    if (!ajaxUrl) return;

    try {
      const res = await fetch(ajaxUrl, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': '{{ csrf_token() }}',
          'Accept': 'application/json'
        }
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok !== true) {
        showToast('No se pudo registrar el envío.', true);
        return;
      }

      showToast(data.created ? 'Envío registrado.' : 'Ya estaba registrado recientemente.');
    } catch (err) {
      showToast('No se pudo registrar el envío.', true);
    }
  });
})();
</script>
@endsection
