@extends('layouts.app')

@section('title', 'Reparación '.$repair->code)

@php
  use Illuminate\Support\Carbon;

  $fmtMoney = fn($n) => '$ ' . number_format((float)$n, 0, ',', '.');

  $badge = function(string $s) {
    return match($s) {
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

  $label = fn(string $s) => \App\Models\Repair::STATUSES[$s] ?? ucfirst(str_replace('_',' ',$s));
  $status = (string)($repair->status ?? 'received');

  $statusHint = match($status) {
    'received' => 'Recibimos tu equipo. En breve empezamos el diagnóstico.',
    'diagnosing' => 'Estamos diagnosticando el problema.',
    'waiting_approval' => 'Estamos esperando tu aprobación para continuar.',
    'repairing' => 'Estamos realizando la reparación.',
    'ready_pickup' => '¡Listo! Podés pasar a retirarlo por el local.',
    'delivered' => 'Entregado. ¡Gracias!',
    'cancelled' => 'Esta reparación fue cancelada.',
    default => 'Estado actualizado.',
  };

  // Stepper (simple)
  $steps = ['received', 'diagnosing', 'waiting_approval', 'repairing', 'ready_pickup', 'delivered'];
  $isCancelled = $status === 'cancelled';
  $stepIndex = array_search($status, $steps, true);
  if ($stepIndex === false) $stepIndex = 0;

  $stepName = fn($s) => match($s) {
    'received' => 'Recibido',
    'diagnosing' => 'Diagnóstico',
    'waiting_approval' => 'Aprobación',
    'repairing' => 'Reparando',
    'ready_pickup' => 'Listo',
    'delivered' => 'Entregado',
    default => ucfirst(str_replace('_',' ',$s)),
  };

  // Pagos
  $final = (float)($repair->final_price ?? 0);
  $paid  = (float)($repair->paid_amount ?? 0);
  $due   = max(0, $final - $paid);

  $payLabel = function($m) {
    return match((string)$m) {
      'efectivo' => 'Efectivo',
      'transferencia' => 'Transferencia',
      'mercado_pago' => 'Mercado Pago',
      default => $m ?: '—',
    };
  };

  // Garantía
  $warrantyDays = (int)($repair->warranty_days ?? 0);
  $deliveredAt  = $repair->delivered_at ? Carbon::parse($repair->delivered_at) : null;
  $warrantyUntil = ($deliveredAt && $warrantyDays > 0) ? $deliveredAt->copy()->addDays($warrantyDays) : null;
  $inWarranty = $warrantyUntil ? now()->lessThanOrEqualTo($warrantyUntil) : null;

  $has = fn($name) => \Illuminate\Support\Facades\Route::has($name);
@endphp

@section('content')
  <div class="store-shell">
  <div class="flex items-start justify-between gap-3 mb-5 rounded-3xl border border-sky-100 bg-white/90 p-4 reveal-item">
    <div class="min-w-0">
      <div class="page-title">Reparación</div>
      <div class="page-subtitle">
        Código: <span class="font-black text-zinc-900">{{ $repair->code }}</span>
      </div>
    </div>

    <span class="{{ $badge($status) }}">{{ $label($status) }}</span>
  </div>

  {{-- Estado + pasos --}}
  <div class="rounded-2xl border border-zinc-200 bg-white p-4 mb-5 reveal-item">
    <div class="text-sm text-zinc-700">
      <span class="font-black text-zinc-900">Estado:</span> {{ $statusHint }}
    </div>

    @if($isCancelled)
      <div class="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
        Si necesitás ayuda, escribinos y lo resolvemos.
      </div>
    @else
      <div class="mt-4 grid gap-2 sm:grid-cols-6">
        @foreach($steps as $i => $s)
          @php $done = $i <= $stepIndex; @endphp
          <div class="flex items-center gap-2">
            <div class="h-7 w-7 rounded-full border flex items-center justify-center
                        {{ $done ? 'bg-sky-600 border-sky-600 text-white' : 'bg-white border-zinc-200 text-zinc-400' }}">
              <span class="text-xs font-black">{{ $i+1 }}</span>
            </div>
            <div class="text-xs {{ $done ? 'text-zinc-900 font-black' : 'text-zinc-500 font-bold' }}">
              {{ $stepName($s) }}
            </div>
          </div>
        @endforeach
      </div>
    @endif
  </div>

  <div class="grid gap-4 lg:grid-cols-3">
    {{-- Detalle --}}
    <div class="lg:col-span-2 card reveal-item">
      <div class="card-head">
        <div class="font-black">Detalle</div>
        <span class="badge-sky">{{ $repair->created_at?->format('d/m/Y') }}</span>
      </div>

      <div class="card-body grid gap-4">
        <div class="grid gap-2">
          <div class="muted">Equipo</div>
          <div class="font-black">{{ $repair->device_brand }} {{ $repair->device_model }}</div>
        </div>

        <div class="grid gap-2">
          <div class="muted">Falla reportada</div>
          <div class="text-sm text-zinc-800">{{ $repair->issue_reported }}</div>
        </div>

        @if($repair->diagnosis)
          <div class="grid gap-2">
            <div class="muted">Diagnóstico</div>
            <div class="text-sm text-zinc-800">{{ $repair->diagnosis }}</div>
          </div>
        @endif

        @if($repair->notes)
          <div class="grid gap-2">
            <div class="muted">Notas</div>
            <div class="text-sm text-zinc-800">{{ $repair->notes }}</div>
          </div>
        @endif

        <div class="divider"></div>

        {{-- Pagos + Garantía (simple y claro) --}}
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-2xl border border-zinc-100 bg-white p-4">
            <div class="font-black mb-2">Pagos</div>

            <div class="text-sm text-zinc-700 flex items-center justify-between">
              <span>Total</span>
              <span class="font-black text-zinc-900">{{ $fmtMoney($final) }}</span>
            </div>

            <div class="text-sm text-zinc-700 flex items-center justify-between mt-1">
              <span>Pagado</span>
              <span class="font-black text-zinc-900">{{ $fmtMoney($paid) }}</span>
            </div>

            <div class="text-sm text-zinc-700 flex items-center justify-between mt-1">
              <span>Debe</span>
              <span class="font-black {{ $due > 0 ? 'text-rose-700' : 'text-emerald-700' }}">{{ $fmtMoney($due) }}</span>
            </div>

            <div class="text-sm text-zinc-700 mt-2">
              Método: <span class="font-black text-zinc-900">{{ $payLabel($repair->payment_method) }}</span>
            </div>

            @if(!empty($repair->payment_notes))
              <div class="text-xs text-zinc-500 mt-2">
                Nota: <span class="text-zinc-800 font-bold">{{ $repair->payment_notes }}</span>
              </div>
            @endif
          </div>

          <div class="rounded-2xl border border-zinc-100 bg-white p-4">
            <div class="font-black mb-2">Garantía</div>

            <div class="text-sm text-zinc-700 flex items-center justify-between">
              <span>Días</span>
              <span class="font-black text-zinc-900">{{ $warrantyDays }}</span>
            </div>

            <div class="text-sm text-zinc-700 flex items-center justify-between mt-1">
              <span>Entregado</span>
              <span class="font-black text-zinc-900">{{ $deliveredAt ? $deliveredAt->format('d/m/Y') : '—' }}</span>
            </div>

            <div class="text-sm text-zinc-700 flex items-center justify-between mt-1">
              <span>Vence</span>
              <span class="font-black text-zinc-900">{{ $warrantyUntil ? $warrantyUntil->format('d/m/Y') : '—' }}</span>
            </div>

            @if(!is_null($inWarranty))
              <div class="mt-3">
                @if($inWarranty)
                  <span class="badge-emerald">En garantía</span>
                @else
                  <span class="badge-rose">Fuera de garantía</span>
                @endif
              </div>
            @endif
          </div>
        </div>
      </div>
    </div>

    {{-- Acciones --}}
    <div class="card h-fit reveal-item">
      <div class="card-head">
        <div class="font-black">Acciones</div>
        <span class="badge-sky">Consulta</span>
      </div>

      <div class="card-body grid gap-3">
        <div class="muted">
          Si no usás cuenta, también podés consultar con el código.
        </div>

        @if($has('repairs.lookup'))
          <a href="{{ route('repairs.lookup') }}" class="btn-primary w-full">Consultar por código</a>
        @endif

        @if($has('repairs.my.index'))
          <a href="{{ route('repairs.my.index') }}" class="btn-outline w-full">Volver</a>
        @endif

        @if($has('store.index'))
          <a href="{{ route('store.index') }}" class="btn-ghost w-full">Ir a la tienda</a>
        @endif
      </div>
    </div>
  </div>
  </div>
@endsection
