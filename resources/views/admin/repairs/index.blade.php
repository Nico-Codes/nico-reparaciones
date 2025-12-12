@extends('layouts.app')

@section('content')
<div class="container">
    <h1>Reparaciones</h1>

    @if (session('success'))
        <div style="margin:12px 0; padding:10px; border:1px solid #7c7; border-radius:8px;">
            {{ session('success') }}
        </div>
    @endif

    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin:12px 0;">
        <a href="{{ route('admin.repairs.create') }}">+ Nueva reparación</a>

        <form method="GET" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <select name="status">
                <option value="">-- Todos --</option>
                @foreach($statuses as $k => $label)
                    <option value="{{ $k }}" @selected($status === $k)>{{ $label }}</option>
                @endforeach
            </select>

            <input name="q" value="{{ $q }}" placeholder="Buscar: código, nombre o teléfono">

            <button type="submit">Filtrar</button>
        </form>
    </div>

    <table style="width:100%; border-collapse:collapse;">
        <thead>
            <tr>
                <th style="text-align:left; border-bottom:1px solid #ddd; padding:8px;">Código</th>
                <th style="text-align:left; border-bottom:1px solid #ddd; padding:8px;">Cliente</th>
                <th style="text-align:left; border-bottom:1px solid #ddd; padding:8px;">Equipo</th>
                <th style="text-align:left; border-bottom:1px solid #ddd; padding:8px;">Estado</th>
                <th style="text-align:left; border-bottom:1px solid #ddd; padding:8px;">Ganancia</th>
                <th style="border-bottom:1px solid #ddd; padding:8px;"></th>
            </tr>
        </thead>
        <tbody>
            @forelse($repairs as $r)
                <tr>
                    <td style="padding:8px;">{{ $r->code }}</td>
                    <td style="padding:8px;">{{ $r->customer_name }}</td>
                    <td style="padding:8px;">{{ $r->device_brand }} {{ $r->device_model }}</td>
                    <td style="padding:8px;">{{ $statuses[$r->status] ?? $r->status }}</td>
                    <td style="padding:8px;">${{ number_format($r->profit, 2) }}</td>
                    <td style="padding:8px; text-align:right;">
                        <a href="{{ route('admin.repairs.show', $r) }}">Ver</a>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="padding:12px;">No hay reparaciones.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div style="margin-top:12px;">
        {{ $repairs->links() }}
    </div>
</div>
@endsection
