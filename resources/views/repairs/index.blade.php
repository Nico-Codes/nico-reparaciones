@extends('layouts.app')

@section('content')
<div class="container">
    <h1>Mis reparaciones</h1>

    @if($repairs->count() === 0)
        <p>No tenés reparaciones vinculadas a tu cuenta todavía.</p>
        <p>Si querés consultar una reparación con código y teléfono: <a href="{{ route('repairs.lookup') }}">consultar reparación</a>.</p>
    @else
        <table style="width:100%; border-collapse:collapse;">
            <thead>
                <tr>
                    <th style="text-align:left; border-bottom:1px solid #ddd; padding:8px;">Código</th>
                    <th style="text-align:left; border-bottom:1px solid #ddd; padding:8px;">Equipo</th>
                    <th style="text-align:left; border-bottom:1px solid #ddd; padding:8px;">Estado</th>
                    <th style="border-bottom:1px solid #ddd; padding:8px;"></th>
                </tr>
            </thead>
            <tbody>
                @foreach($repairs as $r)
                    <tr>
                        <td style="padding:8px;">{{ $r->code }}</td>
                        <td style="padding:8px;">{{ $r->device_brand }} {{ $r->device_model }}</td>
                        <td style="padding:8px;">{{ $statuses[$r->status] ?? $r->status }}</td>
                        <td style="padding:8px; text-align:right;">
                            <a href="{{ route('repairs.my.show', $r) }}">Ver</a>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div style="margin-top:12px;">
            {{ $repairs->links() }}
        </div>
    @endif
</div>
@endsection
