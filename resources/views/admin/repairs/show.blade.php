@extends('layouts.app')

@section('title', 'Admin — Reparación ' . ($repair->code ?? ('#'.$repair->id)))

@section('content')
@php
  $money = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');

  $statusBadge = fn($s) => match($s) {
    'received' => 'badge badge-sky',
    'diagnosing' => 'badge badge-amber',
    'waiting_approval' => 'badge badge-purple',
    'repairing' => 'badge badge-amber',
    'ready_pickup' => 'badge badge-emerald',
    'delivered' => 'badge bg-zinc-900 text-white ring-zinc-900/10',
    'cancelled' => 'badge badge-rose',
    default => 'badge badge-zinc',
  };

  $code = $repair->code ?? ('#'.$repair->id);
  $device = trim(($repair->device_brand ?? '').' '.($repair->device_model ?? ''));
  $pm = $repair->payment_method;
  $pmLabel = $pm && isset($paymentMethods[$pm]) ? $paymentMethods[$pm] : ($pm ?: '—');

  $waAt = !empty($waNotifiedAt) ? \Illuminate\Support\Carbon::parse($waNotifiedAt)->format('d/m/Y H:i') : null;
@endphp

<div class="container-page py-6">
  {{-- Alerts --}}
  @if(session('success'))
    <div class="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {{ session('success') }}
    </div>
  @endif

  @if($errors->any())
    <div class="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      <div class="font-semibold">Hay errores:</div>
      <ul class="list-disc pl-5 mt-2 space-y-1">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  {{-- Header --}}
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div>
      <div class="flex items-center gap-2 flex-wrap">
        <h1 class="page-title">Reparación {{ $code }}</h1>
        <span class="{{ $statusBadge($repair->status) }}">{{ $statuses[$repair->status] ?? $repair->status }}</span>

        @if($repair->in_warranty)
          <span class="badge badge-emerald">En garantía</span>
        @elseif($repair->warranty_expires_at)
          <span class="badge badge-rose">Garantía vencida</span>
        @endif
      </div>
      <p class="page-subtitle">Gestión completa: estado, WhatsApp, finanzas, pagos y timeline.</p>
    </div>

    <div class="flex gap-2 flex-wrap">
      <a href="{{ route('admin.repairs.index') }}" class="btn-outline">← Volver</a>
      <a href="{{ route('admin.repairs.print', $repair) }}" class="btn-outline" target="_blank" rel="noopener">🖨️ Imprimir</a>
      @if(!empty($waUrl))
        <a href="{{ $waUrl }}" class="btn-primary" target="_blank" rel="noopener" onclick="waLogManual('{{ route('admin.repairs.whatsappLogAjax', $repair) }}')">
          💬 WhatsApp
        </a>
      @else
        <span class="btn-outline opacity-60 select-none" title="Revisá el teléfono del cliente">WhatsApp —</span>
      @endif
    </div>
  </div>

  @if(session('wa_after') && !empty(session('wa_after.url')))
    <div class="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      <div class="font-semibold">Acción rápida</div>
      <div class="mt-1 text-sky-800/90">Abrí WhatsApp con el mensaje del nuevo estado.</div>
      <a class="btn-primary mt-3" href="{{ session('wa_after.url') }}" target="_blank" rel="noopener">Abrir WhatsApp</a>
    </div>
  @endif

  <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
    {{-- Resumen --}}
    <div class="lg:col-span-2 space-y-6">
      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Resumen</div>
          <div class="text-xs text-zinc-500">Cliente, equipo, falla y diagnóstico.</div>
        </div>
        <div class="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="rounded-2xl border border-zinc-200 bg-white p-4">
            <div class="text-xs text-zinc-500">Cliente</div>
            <div class="mt-1 text-sm font-extrabold text-zinc-900">{{ $repair->customer_name }}</div>
            <div class="mt-1 text-sm text-zinc-700">{{ $repair->customer_phone }}</div>
            <div class="mt-2 text-xs text-zinc-500">Usuario vinculado</div>
            <div class="text-sm font-semibold text-zinc-900">{{ $linkedUserEmail ?? '—' }}</div>
          </div>

          <div class="rounded-2xl border border-zinc-200 bg-white p-4">
            <div class="text-xs text-zinc-500">Equipo</div>
            <div class="mt-1 text-sm font-extrabold text-zinc-900">{{ $device ?: '—' }}</div>
            <div class="mt-2 text-xs text-zinc-500">Falla</div>
            <div class="text-sm text-zinc-800 whitespace-pre-line">{{ $repair->issue_reported }}</div>
          </div>

          <div class="md:col-span-2 rounded-2xl border border-zinc-200 bg-white p-4">
            <div class="text-xs text-zinc-500">Diagnóstico</div>
            <div class="mt-1 text-sm text-zinc-800 whitespace-pre-line">{{ $repair->diagnosis ?: '—' }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Estado</div>
          <div class="text-xs text-zinc-500">Cambiar estado + comentario.</div>
        </div>
        <div class="card-body">
          <form method="POST" action="{{ route('admin.repairs.updateStatus', $repair) }}" class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            @csrf
            <div class="md:col-span-4">
              <label class="label">Estado</label>
              <select name="status" class="select" required>
                @foreach($statuses as $k => $label)
                  <option value="{{ $k }}" {{ $repair->status === $k ? 'selected' : '' }}>{{ $label }}</option>
                @endforeach
              </select>
            </div>

            <div class="md:col-span-6">
              <label class="label">Comentario</label>
              <input class="input" type="text" name="comment" maxlength="500" placeholder="Opcional (ej: se cambió módulo / esperando repuesto)">
            </div>

            <div class="md:col-span-2">
              <button class="btn-primary w-full" type="submit">Guardar</button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Timeline</div>
          <div class="text-xs text-zinc-500">Historial de cambios de estado.</div>
        </div>
        <div class="card-body">
          @if($history->isEmpty())
            <div class="text-sm text-zinc-600">Sin movimientos aún.</div>
          @else
            <div class="space-y-3">
              @foreach($history as $h)
                <div class="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div class="text-xs text-zinc-500">
                    {{ $h->changed_at ? \Illuminate\Support\Carbon::parse($h->changed_at)->format('d/m/Y H:i') : '—' }}
                  </div>
                  <div class="mt-1 text-sm font-extrabold text-zinc-900">
                    {{ $h->from_status ? ($statuses[$h->from_status] ?? $h->from_status) : '—' }}
                    →
                    {{ $statuses[$h->to_status] ?? $h->to_status }}
                  </div>
                  <div class="mt-1 text-sm text-zinc-700">
                    {{ $h->comment ?? '—' }}
                  </div>
                </div>
              @endforeach
            </div>
          @endif
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Editar datos</div>
          <div class="text-xs text-zinc-500">Cliente, equipo, finanzas, pago y notas.</div>
        </div>

        <div class="card-body">
          <details class="rounded-2xl border border-zinc-200 bg-white p-4">
            <summary class="cursor-pointer font-semibold text-zinc-900">Abrir editor</summary>

            <form method="POST" action="{{ route('admin.repairs.update', $repair) }}" class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              @csrf
              @method('PUT')

              <div class="md:col-span-2">
                <div class="text-xs text-zinc-500">Vincular usuario (opcional)</div>
              </div>

              <div>
                <label class="label">Email del usuario</label>
                <input class="input" type="email" name="user_email" value="{{ old('user_email', $linkedUserEmail) }}">
              </div>

              <div class="flex items-end">
                <label class="inline-flex items-center gap-2 text-sm text-zinc-700">
                  <input type="checkbox" name="unlink_user" value="1" {{ old('unlink_user') ? 'checked' : '' }}>
                  Desvincular usuario
                </label>
              </div>

              <div class="md:col-span-2 h-px bg-zinc-100 my-1"></div>

              <div>
                <label class="label">Nombre *</label>
                <input class="input" type="text" name="customer_name" required value="{{ old('customer_name', $repair->customer_name) }}">
              </div>

              <div>
                <label class="label">Teléfono *</label>
                <input class="input" type="text" name="customer_phone" required value="{{ old('customer_phone', $repair->customer_phone) }}">
              </div>

              <div>
                <label class="label">Marca</label>
                <input class="input" type="text" name="device_brand" value="{{ old('device_brand', $repair->device_brand) }}">
              </div>

              <div>
                <label class="label">Modelo</label>
                <input class="input" type="text" name="device_model" value="{{ old('device_model', $repair->device_model) }}">
              </div>

              <div class="md:col-span-2">
                <label class="label">Falla reportada *</label>
                <textarea class="textarea" rows="3" name="issue_reported" required>{{ old('issue_reported', $repair->issue_reported) }}</textarea>
              </div>

              <div class="md:col-span-2">
                <label class="label">Diagnóstico</label>
                <textarea class="textarea" rows="3" name="diagnosis">{{ old('diagnosis', $repair->diagnosis) }}</textarea>
              </div>

              <div class="md:col-span-2 h-px bg-zinc-100 my-1"></div>

              <div>
                <label class="label">Repuestos</label>
                <input class="input" type="number" step="0.01" min="0" name="parts_cost" value="{{ old('parts_cost', $repair->parts_cost) }}">
              </div>

              <div>
                <label class="label">Mano de obra</label>
                <input class="input" type="number" step="0.01" min="0" name="labor_cost" value="{{ old('labor_cost', $repair->labor_cost) }}">
              </div>

              <div>
                <label class="label">Precio final</label>
                <input class="input" type="number" step="0.01" min="0" name="final_price" value="{{ old('final_price', $repair->final_price) }}">
              </div>

              <div>
                <label class="label">Garantía (días)</label>
                <input class="input" type="number" min="0" name="warranty_days" value="{{ old('warranty_days', $repair->warranty_days) }}">
              </div>

              <div>
                <label class="label">Pagado</label>
                <input class="input" type="number" step="0.01" min="0" name="paid_amount" value="{{ old('paid_amount', $repair->paid_amount) }}">
              </div>

              <div>
                <label class="label">Método</label>
                <select class="select" name="payment_method">
                  <option value="">—</option>
                  @foreach(($paymentMethods ?? []) as $k => $label)
                    <option value="{{ $k }}" {{ old('payment_method', $repair->payment_method) === $k ? 'selected' : '' }}>{{ $label }}</option>
                  @endforeach
                </select>
              </div>

              <div class="md:col-span-2">
                <label class="label">Notas de pago</label>
                <textarea class="textarea" rows="2" name="payment_notes">{{ old('payment_notes', $repair->payment_notes) }}</textarea>
              </div>

              <div class="md:col-span-2">
                <label class="label">Notas</label>
                <textarea class="textarea" rows="3" name="notes">{{ old('notes', $repair->notes) }}</textarea>
              </div>

              <div class="md:col-span-2 flex gap-2">
                <button class="btn-primary" type="submit">Guardar cambios</button>
                <button class="btn-outline" type="button" onclick="this.closest('details').removeAttribute('open')">Cerrar</button>
              </div>
            </form>
          </details>
        </div>
      </div>
    </div>

    {{-- Sidebar --}}
    <div class="space-y-6">
      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Finanzas</div>
          <div class="text-xs text-zinc-500">Costos, ganancia, pago y saldo.</div>
        </div>
        <div class="card-body text-sm space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Repuestos</span>
            <span class="font-semibold text-zinc-900">{{ $money($repair->parts_cost ?? 0) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Mano de obra</span>
            <span class="font-semibold text-zinc-900">{{ $money($repair->labor_cost ?? 0) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Costo total</span>
            <span class="font-extrabold text-zinc-900">{{ $money($repair->total_cost ?? 0) }}</span>
          </div>

          <div class="h-px bg-zinc-100 my-2"></div>

          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Precio final</span>
            <span class="font-extrabold text-zinc-900">{{ $repair->final_price !== null ? $money($repair->final_price) : '—' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Ganancia</span>
            <span class="font-extrabold text-zinc-900">{{ $money($repair->profit ?? 0) }}</span>
          </div>

          <div class="h-px bg-zinc-100 my-2"></div>

          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Pagado</span>
            <span class="font-semibold text-zinc-900">{{ $money($repair->paid_amount ?? 0) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Saldo</span>
            <span class="font-extrabold text-zinc-900">{{ $money($repair->balance_due ?? 0) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Método</span>
            <span class="font-semibold text-zinc-900">{{ $pmLabel }}</span>
          </div>
          <div>
            <div class="text-xs text-zinc-500">Notas pago</div>
            <div class="text-sm text-zinc-800 whitespace-pre-line">{{ $repair->payment_notes ?: '—' }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">Garantía</div>
        </div>
        <div class="card-body text-sm space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Días</span>
            <span class="font-semibold text-zinc-900">{{ ($repair->warranty_days ?? 0) ? ($repair->warranty_days.' días') : '—' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Entregado</span>
            <span class="font-semibold text-zinc-900">{{ $repair->delivered_at ? $repair->delivered_at->format('d/m/Y H:i') : '—' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-600">Vence</span>
            <span class="font-semibold text-zinc-900">{{ $repair->warranty_expires_at ? $repair->warranty_expires_at->format('d/m/Y') : '—' }}</span>
          </div>
          @if($repair->warranty_expires_at)
            <div class="mt-2">
              <span class="{{ $repair->in_warranty ? 'badge badge-emerald' : 'badge badge-rose' }}">
                {{ $repair->in_warranty ? 'EN GARANTÍA' : 'VENCIDA' }}
              </span>
            </div>
          @endif
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="text-sm font-semibold text-zinc-900">WhatsApp</div>
          <div class="text-xs text-zinc-500">Mensaje y registro.</div>
        </div>
        <div class="card-body space-y-3">
          <div class="text-sm">
            <div class="text-xs text-zinc-500">Notificación del estado actual</div>
            <div class="mt-1">
              @if(!empty($waNotifiedCurrent))
                <span class="badge badge-emerald">✅ Avisado {{ $waAt ? '· '.$waAt : '' }}</span>
              @else
                <span class="badge badge-amber">🟡 Pendiente</span>
              @endif
            </div>
          </div>

          @if(!empty($waUrl))
            <div class="grid grid-cols-1 gap-2">
              <button class="btn-outline" type="button" onclick="copyWa()">
                Copiar mensaje
              </button>

              <a class="btn-primary text-center" href="{{ $waUrl }}" target="_blank" rel="noopener"
                 onclick="waLogManual('{{ route('admin.repairs.whatsappLogAjax', $repair) }}')">
                Abrir WhatsApp
              </a>

              <form method="POST" action="{{ route('admin.repairs.whatsappLog', $repair) }}">
                @csrf
                <button class="btn-outline w-full" type="submit">Registrar envío (manual)</button>
              </form>
            </div>

            <div>
              <div class="text-xs text-zinc-500">Mensaje armado</div>
              <pre id="waMessage" class="mt-2 whitespace-pre-wrap rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900">{{ $waMessage ?? '' }}</pre>
            </div>
          @else
            <div class="text-sm text-zinc-600">
              No se puede armar WhatsApp (revisá el teléfono).
            </div>
          @endif

          <details class="rounded-2xl border border-zinc-200 bg-white p-4">
            <summary class="cursor-pointer font-semibold text-zinc-900">Ver historial de WhatsApp</summary>

            <div class="mt-3">
              @if($waLogs->isEmpty())
                <div class="text-sm text-zinc-600">No hay envíos registrados.</div>
              @else
                <div class="space-y-2 text-sm">
                  @foreach($waLogs as $log)
                    <div class="rounded-2xl border border-zinc-200 bg-white p-3">
                      <div class="text-xs text-zinc-500">
                        {{ $log->sent_at ? $log->sent_at->format('d/m/Y H:i') : '—' }}
                      </div>
                      <div class="mt-1 font-semibold text-zinc-900">
                        {{ $statuses[$log->notified_status] ?? $log->notified_status }}
                        · {{ $log->sentBy->name ?? '—' }}
                      </div>
                      <div class="text-xs text-zinc-500">{{ $log->phone ?? '—' }}</div>
                    </div>
                  @endforeach
                </div>
              @endif
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  function copyWa() {
    const el = document.getElementById('waMessage');
    if (!el) return;
    const text = el.innerText || el.textContent || '';
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  function waLogManual(logUrl) {
    const token = @json(csrf_token());
    fetch(logUrl, {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': token,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ source: 'show_open' }),
      keepalive: true
    }).catch(() => {});
  }
</script>
@endsection
