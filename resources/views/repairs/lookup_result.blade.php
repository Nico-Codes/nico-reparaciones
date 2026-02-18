@extends('layouts.app')

@section('title', 'Resultado reparacion')

@php
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

  $statusHint = fn(string $s) => match($s) {
    'received' => 'Recibido en el taller.',
    'diagnosing' => 'Estamos diagnosticando.',
    'waiting_approval' => 'Esperando tu aprobacion.',
    'repairing' => 'Reparacion en curso.',
    'ready_pickup' => 'Listo para retirar.',
    'delivered' => 'Entregado.',
    'cancelled' => 'Cancelado.',
    default => 'Estado actualizado.',
  };

  $steps = ['received', 'diagnosing', 'waiting_approval', 'repairing', 'ready_pickup', 'delivered'];

  $has = fn($name) => \Illuminate\Support\Facades\Route::has($name);
@endphp

@section('content')
  <div class="store-shell max-w-2xl mx-auto">
    <div class="page-head store-hero reveal-item">
      <div class="page-title">Resultado</div>
      <div class="page-subtitle">Estado actual de tu reparacion.</div>
    </div>

    @if(!$repair)
      <div class="card reveal-item">
        <div class="card-body">
          <div class="font-black text-zinc-900 text-lg">No encontramos una reparacion con esos datos.</div>
          <div class="muted mt-1">
            Revisa que el <span class="font-black text-zinc-900">codigo</span> y el <span class="font-black text-zinc-900">telefono</span> esten bien escritos.
          </div>

          <div class="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-700">
            Si el problema sigue, escribinos y lo vemos rapido desde el sistema.
          </div>

          <div class="mt-5 flex flex-col sm:flex-row gap-2">
            <a href="{{ route('repairs.lookup') }}" class="btn-primary h-11 w-full justify-center sm:w-auto">Nueva consulta</a>
            @if($has('store.index'))
              <a href="{{ route('store.index') }}" class="btn-outline h-11 w-full justify-center sm:w-auto">Ir a la tienda</a>
            @endif
          </div>
        </div>
      </div>
    @else

    @php
      $status = (string)($repair->status ?? 'received');
      $isCancelled = $status === 'cancelled';
      $stepIndex = array_search($status, $steps, true);
      if ($stepIndex === false) $stepIndex = 0;

      $stepName = fn($s) => match($s) {
        'received' => 'Recibido',
        'diagnosing' => 'Diagnostico',
        'waiting_approval' => 'Aprobacion',
        'repairing' => 'Reparando',
        'ready_pickup' => 'Listo',
        'delivered' => 'Entregado',
        default => ucfirst(str_replace('_',' ',$s)),
      };
    @endphp

    <div class="card reveal-item">
      <div class="card-body">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="font-black text-lg truncate">
              {{ $repair->device_brand }} {{ $repair->device_model }}
            </div>
            <div class="muted mt-1">
              Codigo: <span class="font-black text-zinc-900">{{ $repair->code }}</span>
              <span class="text-zinc-300">|</span>
              Actualizado: <span class="font-black text-zinc-900">{{ $repair->updated_at?->format('d/m/Y H:i') }}</span>
            </div>
          </div>

          <span class="{{ $badge($status) }}">
            {{ $label($status) }}
          </span>
        </div>

        <div class="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-700">
          <span class="font-black text-zinc-900">Estado:</span> {{ $statusHint($status) }}
        </div>

        @if(!$isCancelled)
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

        <hr class="my-4">

        <div class="grid gap-3">
          <div>
            <div class="muted">Falla reportada</div>
            <div class="text-sm text-zinc-800">{{ $repair->issue_reported }}</div>
          </div>

          @if($repair->diagnosis)
            <div>
              <div class="muted">Diagnostico</div>
              <div class="text-sm text-zinc-800">{{ $repair->diagnosis }}</div>
            </div>
          @endif
        </div>

        <div class="mt-5 flex flex-col sm:flex-row gap-2">
          <a href="{{ route('repairs.lookup') }}" class="btn-outline h-11 w-full justify-center sm:w-auto">Nueva consulta</a>

          @auth
            @if($has('repairs.my.index'))
              <a href="{{ route('repairs.my.index') }}" class="btn-ghost h-11 w-full justify-center sm:w-auto">Mis reparaciones</a>
            @endif
          @endauth

          @if($has('store.index'))
            <a href="{{ route('store.index') }}" class="btn-primary h-11 w-full justify-center sm:w-auto">Ir a la tienda</a>
          @endif
        </div>
      </div>
    </div>
    @endif
  </div>
@endsection
