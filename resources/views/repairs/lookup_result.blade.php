@extends('layouts.app')

@section('content')
<div class="container">
    <h1>Estado de reparación</h1>

    @if (session('success'))
        <div style="margin:12px 0; padding:10px; border:1px solid #7c7; border-radius:8px;">
            {{ session('success') }}
        </div>
    @endif

    @if (!$repair)
        <p>No se encontró ninguna reparación con esos datos.</p>
    @else
        <p><b>Código:</b> {{ $repair->code }}</p>
        <p><b>Cliente:</b> {{ $repair->customer_name }}</p>
        <p><b>Equipo:</b> {{ $repair->device_brand }} {{ $repair->device_model }}</p>
        <p><b>Estado:</b> {{ $statuses[$repair->status] ?? $repair->status }}</p>
    @endif

    <a href="{{ route('repairs.lookup') }}">Volver</a>
</div>
@endsection
