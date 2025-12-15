@extends('layouts.app')

@section('title', 'Consultar reparación')

@section('content')
  <div class="max-w-md mx-auto">
    <div class="page-head">
      <div class="page-title">Consultar reparación</div>
      <div class="page-subtitle">Ingresá el código que te dimos y tu teléfono.</div>
    </div>

    <div class="card">
      <div class="card-body">
        <form method="POST" action="{{ route('repairs.lookup') }}" class="grid gap-4">
          @csrf

          <div>
            <label for="code">Código</label>
            <input id="code" name="code" value="{{ old('code') }}" required>
          </div>

          <div>
            <label for="phone">Teléfono</label>
            <input id="phone" name="phone" value="{{ old('phone') }}" required>
          </div>

          <button class="btn-primary w-full">Buscar</button>

          <div class="muted text-center">
            Tip: escribí el teléfono igual al que dejaste al ingresar el equipo.
          </div>
        </form>
      </div>
    </div>
  </div>
@endsection
