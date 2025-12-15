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

  $statusLabel = \App\Models\Repair::STATUSES[$repair->status] ?? $repair->status;

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

  $warrantyDays = (int)($repair->warranty_days ?? 0);
  $deliveredAt  = $repair->delivered_at ? Carbon::parse($repair->delivered_at) : null;
  $warrantyUntil = ($deliveredAt && $warrantyDays > 0) ? $deliveredAt->copy()->addDays($warrantyDays) : null;
@endphp

@section('content')
  <div class="flex items-start justify-between gap-3 mb-5">
    <div>
      <div class="page-title">Reparación</div>
      <div class="page-subtitle">
        Código: <span class="font-black text-zinc-900">{{ $repair->code }}</span>
      </div>
    </div>

    <span class="{{ $badge($repair->status) }}">{{ $statusLabel }}</span>
  </div>

  <div class="grid gap-4 lg:grid-cols-3">
    <div class="lg:col-span-2 card">
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

        {{-- Bloque PRO (si existen columnas) --}}
        <div class="divider"></div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="card">
            <div class="card-body grid gap-2">
              <div class="font-black">Pagos</div>
              <div class="text-sm text-zinc-700">
                Total: <span class="font-black text-zinc-900">{{ $fmtMoney($repair->final_price ?? 0) }}</span>
              </div>
              <div class="text-sm text-zinc-700">
                Pagado: <span class="font-black text-zinc-900">{{ $fmtMoney($repair->paid_amount ?? 0) }}</span>
              </div>
              <div class="text-sm text-zinc-700">
                Debe: <span class="font-black {{ $due > 0 ? 'text-rose-700' : 'text-emerald-700' }}">{{ $fmtMoney($due) }}</span>
              </div>
              <div class="text-sm text-zinc-700">
                Método: <span class="font-black text-zinc-900">{{ $payLabel($repair->payment_method) }}</span>
              </div>
              @if(!empty($repair->payment_notes))
                <div class="text-sm text-zinc-700">
                  Nota: <span class="font-black text-zinc-900">{{ $repair->payment_notes }}</span>
                </div>
              @endif
            </div>
          </div>

          <div class="card">
            <div class="card-body grid gap-2">
              <div class="font-black">Garantía</div>
              <div class="text-sm text-zinc-700">
                Días: <span class="font-black text-zinc-900">{{ $repair->warranty_days ?? 0 }}</span>
              </div>

              <div class="text-sm text-zinc-700">
                Entregado: <span class="font-black text-zinc-900">{{ $repair->delivered_at ? \Illuminate\Support\Carbon::parse($repair->delivered_at)->format('d/m/Y') : '—' }}</span>
              </div>

              <div class="text-sm text-zinc-700">
                Vence: <span class="font-black text-zinc-900">{{ $warrantyUntil ? $warrantyUntil->format('d/m/Y') : '—' }}</span>
              </div>

              @if($warrantyUntil)
                @php $inWarranty = now()->lessThanOrEqualTo($warrantyUntil); @endphp
                <div>
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
    </div>

    <div class="card h-fit">
      <div class="card-head">
        <div class="font-black">Acciones</div>
        <span class="badge-sky">Consulta</span>
      </div>

      <div class="card-body grid gap-3">
        <div class="muted">
          Si no usás cuenta, también podés consultar con el código.
        </div>

        <a href="{{ route('repairs.lookup') }}" class="btn-primary w-full">Consultar por código</a>
        <a href="{{ route('repairs.my.index') }}" class="btn-outline w-full">Volver</a>
      </div>
    </div>
  </div>
@endsection
