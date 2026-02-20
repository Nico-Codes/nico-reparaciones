@extends('layouts.app')

@section('title', 'Admin - Alertas')

@section('content')
<div class="store-shell space-y-6">
  <div class="flex items-start justify-between gap-4 flex-wrap rounded-3xl border border-sky-100 bg-white/90 p-4 reveal-item">
    <div class="page-head mb-0 w-full lg:w-auto">
      <div class="page-title">Centro de alertas</div>
      <div class="page-subtitle">Seguimiento rapido de pendientes operativos.</div>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <a href="{{ route('admin.dashboard') }}" class="btn-outline h-10 w-full justify-center sm:w-auto">Volver al panel</a>
      @if(($totalAlerts ?? 0) > 0)
        <form method="POST" action="{{ route('admin.alerts.mark_all_seen') }}">
          @csrf
          <button type="submit" class="btn-ghost h-10 w-full justify-center sm:w-auto">Marcar todas vistas</button>
        </form>
      @endif
    </div>
  </div>

  <div class="grid gap-3 sm:grid-cols-3">
    <div class="card reveal-item">
      <div class="card-body">
        <div class="text-xs font-black uppercase text-zinc-500">Alertas activas</div>
        <div class="mt-1 text-3xl font-extrabold text-zinc-900">{{ (int)($totalAlerts ?? 0) }}</div>
      </div>
    </div>
    <div class="card reveal-item">
      <div class="card-body">
        <div class="text-xs font-black uppercase text-zinc-500">No vistas</div>
        <div class="mt-1 text-3xl font-extrabold {{ (int)($unseenAlerts ?? 0) > 0 ? 'text-rose-700' : 'text-zinc-900' }}">{{ (int)($unseenAlerts ?? 0) }}</div>
      </div>
    </div>
    <div class="card reveal-item">
      <div class="card-body">
        <div class="text-xs font-black uppercase text-zinc-500">Estado</div>
        <div class="mt-2 text-sm font-semibold text-zinc-700">
          @if((int)($totalAlerts ?? 0) === 0)
            Sin pendientes operativos.
          @else
            Revisa y marca como vistas las alertas atendidas.
          @endif
        </div>
      </div>
    </div>
  </div>

  <div class="card reveal-item">
    <div class="card-head">
      <div class="font-black">Alertas</div>
      <span class="badge-zinc">{{ (int)($totalAlerts ?? 0) }}</span>
    </div>

    <div class="card-body">
      @if(empty($alerts) || count($alerts) === 0)
        <div class="text-sm text-zinc-600">No hay alertas activas en este momento.</div>
      @else
        <div class="space-y-2">
          @foreach($alerts as $alert)
            <div class="rounded-2xl border border-zinc-200 bg-white p-3">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <div class="font-black text-zinc-900">{{ $alert['title'] ?? 'Alerta' }}</div>
                    <span class="badge-rose">{{ (int)($alert['count'] ?? 0) }}</span>
                    @if(empty($alert['seen']))
                      <span class="badge-amber">Nueva</span>
                    @endif
                  </div>
                  <div class="mt-1 text-sm text-zinc-600">{{ $alert['description'] ?? '' }}</div>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <a href="{{ $alert['href'] ?? route('admin.dashboard') }}" class="btn-outline btn-sm h-10 w-full justify-center sm:w-auto">Abrir</a>
                  @if(empty($alert['seen']) && !empty($alert['key']))
                    <form method="POST" action="{{ route('admin.alerts.mark_seen', ['alertKey' => $alert['key']]) }}">
                      @csrf
                      <button type="submit" class="btn-ghost btn-sm h-10 w-full justify-center sm:w-auto">Marcar vista</button>
                    </form>
                  @endif
                </div>
              </div>
            </div>
          @endforeach
        </div>
      @endif
    </div>
  </div>
</div>
@endsection

