@extends('layouts.app')

@section('title', 'Nueva reparación — Admin')

@section('content')
@php
  $prefill = [
    'user_email'      => request('user_email'),
    'customer_name'   => request('customer_name'),
    'customer_phone'  => request('customer_phone'),
    'device_brand'    => request('device_brand'),
    'device_model'    => request('device_model'),
    'issue_reported'  => request('issue_reported'),
    'diagnosis'       => request('diagnosis'),
    'parts_cost'      => request('parts_cost'),
    'labor_cost'      => request('labor_cost'),
    'final_price'     => request('final_price'),
    'paid_amount'     => request('paid_amount'),
    'payment_method'  => request('payment_method'),
    'payment_notes'   => request('payment_notes'),
    'status'          => request('status', 'received'),
    'warranty_days'   => request('warranty_days'),
    'notes'           => request('notes'),
  ];

  $i = "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100";
  $t = "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100";
  $l = "text-sm font-medium text-zinc-800";
  $h = "text-xs text-zinc-500";
@endphp

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-xl sm:text-2xl font-semibold text-zinc-900">Nueva reparación</h1>
      <p class="mt-1 text-sm text-zinc-500">Creá una orden para operar el taller (cliente, equipo, estado, costos y pagos).</p>
    </div>
    <a href="{{ route('admin.repairs.index') }}"
       class="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
      Volver
    </a>
  </div>

  @if(session('success'))
    <div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {{ session('success') }}
    </div>
  @endif

  @if($errors->any())
    <div class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      <div class="font-semibold">Hay errores para corregir:</div>
      <ul class="mt-2 list-disc pl-5 space-y-1">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  <form method="POST" action="{{ route('admin.repairs.store') }}" class="mt-6">
    @csrf

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {{-- Columna principal --}}
      <div class="lg:col-span-2 space-y-6">

        {{-- Cliente / vínculo --}}
        <section class="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div class="border-b border-zinc-100 px-4 py-3">
            <h2 class="text-sm font-semibold text-zinc-900">Cliente</h2>
            <p class="{{ $h }}">Datos para contacto y trazabilidad.</p>
          </div>
          <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="{{ $l }}">Email de usuario (opcional)</label>
              <input class="{{ $i }}" type="email" name="user_email" value="{{ old('user_email', $prefill['user_email']) }}" placeholder="cliente@email.com">
              <p class="{{ $h }} mt-1">Si existe un usuario con ese email, se vincula la reparación a su cuenta.</p>
            </div>

            <div>
              <label class="{{ $l }}">Nombre *</label>
              <input class="{{ $i }}" type="text" name="customer_name" required value="{{ old('customer_name', $prefill['customer_name']) }}" placeholder="Nombre y apellido">
            </div>

            <div>
              <label class="{{ $l }}">Teléfono *</label>
              <input class="{{ $i }}" type="text" name="customer_phone" required value="{{ old('customer_phone', $prefill['customer_phone']) }}" placeholder="Ej: 341xxxxxxx">
              <p class="{{ $h }} mt-1">Se normaliza a solo números al guardar.</p>
            </div>
          </div>
        </section>

        {{-- Equipo --}}
        <section class="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div class="border-b border-zinc-100 px-4 py-3">
            <h2 class="text-sm font-semibold text-zinc-900">Equipo</h2>
            <p class="{{ $h }}">Marca y modelo para identificar el dispositivo.</p>
          </div>
          <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="{{ $l }}">Marca</label>
              <input class="{{ $i }}" type="text" name="device_brand" value="{{ old('device_brand', $prefill['device_brand']) }}" placeholder="Samsung, iPhone, Motorola...">
            </div>
            <div>
              <label class="{{ $l }}">Modelo</label>
              <input class="{{ $i }}" type="text" name="device_model" value="{{ old('device_model', $prefill['device_model']) }}" placeholder="A13, 12 Pro Max, G32...">
            </div>
          </div>
        </section>

        {{-- Trabajo --}}
        <section class="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div class="border-b border-zinc-100 px-4 py-3">
            <h2 class="text-sm font-semibold text-zinc-900">Trabajo</h2>
            <p class="{{ $h }}">Falla reportada + diagnóstico (si ya lo tenés).</p>
          </div>
          <div class="p-4 space-y-4">
            <div>
              <label class="{{ $l }}">Falla reportada *</label>
              <textarea class="{{ $t }}" name="issue_reported" rows="3" required placeholder="Ej: No carga / pantalla rota / no enciende...">{{ old('issue_reported', $prefill['issue_reported']) }}</textarea>
            </div>

            <div>
              <label class="{{ $l }}">Diagnóstico</label>
              <textarea class="{{ $t }}" name="diagnosis" rows="3" placeholder="Ej: módulo dañado / pin de carga...">{{ old('diagnosis', $prefill['diagnosis']) }}</textarea>
            </div>
          </div>
        </section>

        {{-- Notas --}}
        <section class="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div class="border-b border-zinc-100 px-4 py-3">
            <h2 class="text-sm font-semibold text-zinc-900">Notas internas</h2>
            <p class="{{ $h }}">Cualquier detalle útil para el taller (no necesariamente visible para el cliente).</p>
          </div>
          <div class="p-4">
            <textarea class="{{ $t }}" name="notes" rows="3" placeholder="Notas...">{{ old('notes', $prefill['notes']) }}</textarea>
          </div>
        </section>

      </div>

      {{-- Sidebar --}}
      <div class="space-y-6">

        {{-- Estado / garantía --}}
        <section class="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div class="border-b border-zinc-100 px-4 py-3">
            <h2 class="text-sm font-semibold text-zinc-900">Estado inicial</h2>
            <p class="{{ $h }}">Podés arrancar en “Recibido” o en el estado que ya corresponda.</p>
          </div>
          <div class="p-4 space-y-4">
            <div>
              <label class="{{ $l }}">Estado *</label>
              <select class="{{ $i }}" name="status" required>
                @foreach($statuses as $k => $label)
                  <option value="{{ $k }}" {{ old('status', $prefill['status']) === $k ? 'selected' : '' }}>
                    {{ $label }}
                  </option>
                @endforeach
              </select>
            </div>

            <div>
              <label class="{{ $l }}">Garantía (días)</label>
              <input class="{{ $i }}" type="number" min="0" name="warranty_days" value="{{ old('warranty_days', $prefill['warranty_days']) }}" placeholder="0">
              <p class="{{ $h }} mt-1">La garantía comienza cuando se marca “Entregado”.</p>
            </div>
          </div>
        </section>

        {{-- Costos / precio --}}
        <section class="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div class="border-b border-zinc-100 px-4 py-3">
            <h2 class="text-sm font-semibold text-zinc-900">Costos y precio</h2>
            <p class="{{ $h }}">Repuestos + mano de obra + precio final.</p>
          </div>
          <div class="p-4 grid grid-cols-1 gap-4">
            <div>
              <label class="{{ $l }}">Repuestos</label>
              <input class="{{ $i }}" type="number" step="0.01" min="0" name="parts_cost" value="{{ old('parts_cost', $prefill['parts_cost']) }}" placeholder="0.00">
            </div>

            <div>
              <label class="{{ $l }}">Mano de obra</label>
              <input class="{{ $i }}" type="number" step="0.01" min="0" name="labor_cost" value="{{ old('labor_cost', $prefill['labor_cost']) }}" placeholder="0.00">
            </div>

            <div>
              <label class="{{ $l }}">Precio final</label>
              <input class="{{ $i }}" type="number" step="0.01" min="0" name="final_price" value="{{ old('final_price', $prefill['final_price']) }}" placeholder="0.00">
            </div>
          </div>
        </section>

        {{-- Pagos --}}
        <section class="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div class="border-b border-zinc-100 px-4 py-3">
            <h2 class="text-sm font-semibold text-zinc-900">Pagos</h2>
            <p class="{{ $h }}">Señal, método y notas (si aplica).</p>
          </div>

          <div class="p-4 space-y-4">
            <div>
              <label class="{{ $l }}">Pagado</label>
              <input class="{{ $i }}" type="number" step="0.01" min="0" name="paid_amount" value="{{ old('paid_amount', $prefill['paid_amount']) }}" placeholder="0.00">
            </div>

            <div>
              <label class="{{ $l }}">Método</label>
              <select class="{{ $i }}" name="payment_method">
                <option value="">—</option>
                @foreach($paymentMethods as $k => $label)
                  <option value="{{ $k }}" {{ old('payment_method', $prefill['payment_method']) === $k ? 'selected' : '' }}>
                    {{ $label }}
                  </option>
                @endforeach
              </select>
            </div>

            <div>
              <label class="{{ $l }}">Notas de pago</label>
              <textarea class="{{ $t }}" name="payment_notes" rows="2" placeholder="Ej: seña por MP / transferencia...">{{ old('payment_notes', $prefill['payment_notes']) }}</textarea>
            </div>
          </div>
        </section>

        {{-- Acciones --}}
        <div class="flex flex-col sm:flex-row lg:flex-col gap-3">
          <button type="submit"
                  class="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
            Guardar reparación
          </button>
          <a href="{{ route('admin.repairs.index') }}"
             class="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
            Cancelar
          </a>
        </div>

      </div>
    </div>
  </form>
</div>
@endsection
