@extends('layouts.app')

@section('content')
<div class="container">
    <h1>Consultar reparación</h1>

    @if ($errors->any())
        <div style="margin:12px 0; padding:10px; border:1px solid #f2c; border-radius:8px;">
            <ul style="margin:0; padding-left:18px;">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <form method="POST" action="{{ route('repairs.lookup.post') }}" style="display:flex; flex-direction:column; gap:10px; max-width:420px;">
        @csrf

        <label>Código</label>
        <input name="code" value="{{ old('code') }}" required placeholder="Ej: R-20251212-00001">

        <label>Teléfono</label>
        <input name="phone" value="{{ old('phone') }}" required placeholder="Ej: 3411234567">

        <button type="submit">Consultar</button>
    </form>
</div>
@endsection
