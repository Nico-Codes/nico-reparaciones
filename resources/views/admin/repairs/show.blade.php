@extends('layouts.app')

@section('content')
<div class="container">
    <h1>Reparación {{ $repair->code }}</h1>

    @if (session('success'))
        <div style="margin:12px 0; padding:10px; border:1px solid #7c7; border-radius:8px;">
            {{ session('success') }}
        </div>
    @endif

    <p><b>Cliente:</b> {{ $repair->customer_name }} ({{ $repair->customer_phone }})</p>
    <p><b>Equipo:</b> {{ $repair->device_brand }} {{ $repair->device_model }}</p>
    <p><b>Estado:</b> {{ $statuses[$repair->status] ?? $repair->status }}</p>

    <hr>

    <h3>Detalle</h3>
    <p><b>Problema reportado:</b> {{ $repair->issue_reported }}</p>
    <p><b>Diagnóstico:</b> {{ $repair->diagnosis ?? '—' }}</p>

    <hr>

    <h3>Costos y ganancia</h3>
    <p><b>Repuestos:</b> ${{ number_format((float)$repair->parts_cost, 2) }}</p>
    <p><b>Mano de obra:</b> ${{ number_format((float)$repair->labor_cost, 2) }}</p>
    <p><b>Precio final:</b> ${{ number_format((float)($repair->final_price ?? 0), 2) }}</p>
    <p><b>Ganancia:</b> ${{ number_format((float)$repair->profit, 2) }}</p>

    <hr>

    <h3>Cambiar estado</h3>
    <form method="POST" action="{{ route('admin.repairs.updateStatus', $repair) }}" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        @csrf
        <select name="status">
            @foreach($statuses as $k => $label)
                <option value="{{ $k }}" @selected($repair->status === $k)>{{ $label }}</option>
            @endforeach
        </select>
        <input name="comment" placeholder="Comentario (opcional)" style="min-width:240px;">
        <button type="submit">Actualizar</button>
    </form>

    <hr>

    <h3>Historial</h3>
    <ul>
        @forelse($history as $h)
            <li>
                {{ $h->changed_at?->format('Y-m-d H:i') ?? $h->changed_at }}:
                {{ $statuses[$h->from_status] ?? ($h->from_status ?? '—') }}
                →
                {{ $statuses[$h->to_status] ?? $h->to_status }}
                @if($h->comment) ({{ $h->comment }}) @endif
            </li>
        @empty
            <li>Sin historial.</li>
        @endforelse
    </ul>
</div>
@endsection
