@extends('layouts.app')

@section('content')
<div class="container">
    <h1>Reparación {{ $repair->code }}</h1>

    <p><b>Equipo:</b> {{ $repair->device_brand }} {{ $repair->device_model }}</p>
    <p><b>Estado:</b> {{ $statuses[$repair->status] ?? $repair->status }}</p>

    <hr>

    <p><b>Problema reportado:</b> {{ $repair->issue_reported }}</p>

    <p><b>Diagnóstico:</b> {{ $repair->diagnosis ?? 'Aún no disponible' }}</p>

    <hr>

    <a href="{{ route('repairs.my.index') }}">Volver</a>
</div>
@endsection
