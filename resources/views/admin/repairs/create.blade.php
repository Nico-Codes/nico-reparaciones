@extends('layouts.app')

@section('title', 'Admin — Nueva reparación')

@php
  $oldStatus = old('status', 'received');
@endphp

@section('content')
<div class="mx-auto w-full max-w-4xl px-4 py-6">
  <div class="flex items-start justify-between gap-3">
    <div>
      <h1 class="text-xl font-black tracking-tight">Nueva reparación</h1>
      <p class="mt-1 text-sm text-zinc-600">Cargá los datos básicos. Después podés editar todo desde el detalle.</p>
    </div>

    <a href="{{ route('admin.repairs.index') }}"
       class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
      Volver
    </a>
  </div>

  @if ($errors->any())
    <div class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      <div class="font-bold">Revisá estos errores:</div>
      <ul class="mt-2 list-disc pl-5">
        @foreach($errors->all() as $e)
          <li>{{ $e }}</li>
        @endforeach
      </ul>
    </div>
  @endif

  <form method="POST" action="{{ route('admin.repairs.store') }}" class="mt-5 space-y-4">
    @csrf

    <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="text-xs font-semibold text-zinc-700">Email de usuario (opcional, para asociar)</label>
          <input name="user_email" value="{{ old('user_email') }}" placeholder="cliente@email.com"
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
          <p class="mt-1 text-xs text-zinc-500">Si lo dejás vacío, queda como reparación “sin cuenta”.</p>
        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Nombre del cliente *</label>
          <input name="customer_name" value="{{ old('customer_name') }}" required
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Teléfono (WhatsApp) *</label>
          <input name="customer_phone" value="{{ old('customer_phone') }}" required placeholder="Ej: 341xxxxxxx"
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Marca</label>
          <input name="device_brand" value="{{ old('device_brand') }}" placeholder="Samsung / iPhone / Xiaomi…"
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Modelo</label>
          <input name="device_model" value="{{ old('device_model') }}" placeholder="A13 / 12 Pro Max / Note…"
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
        </div>

        <div class="sm:col-span-2">
          <label class="text-xs font-semibold text-zinc-700">Falla reportada *</label>
          <textarea name="issue_reported" required rows="3"
                    class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">{{ old('issue_reported') }}</textarea>
        </div>

        <div class="sm:col-span-2">
          <label class="text-xs font-semibold text-zinc-700">Diagnóstico (opcional)</label>
          <textarea name="diagnosis" rows="3"
                    class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">{{ old('diagnosis') }}</textarea>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 class="text-sm font-black">Costos, cobro y garantía</h2>
      <div class="mt-3 grid gap-4 sm:grid-cols-3">
        <div>
          <label class="text-xs font-semibold text-zinc-700">Costo repuestos</label>
          <input name="parts_cost" value="{{ old('parts_cost') }}" inputmode="decimal" placeholder="0"
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Mano de obra</label>
          <input name="labor_cost" value="{{ old('labor_cost') }}" inputmode="decimal" placeholder="0"
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Precio final al cliente</label>
          <input name="final_price" value="{{ old('final_price') }}" inputmode="decimal" placeholder="0"
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Pagado</label>
          <input name="paid_amount" value="{{ old('paid_amount') }}" inputmode="decimal" placeholder="0"
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Método de pago</label>
          <select name="payment_method"
                  class="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
            <option value="">—</option>
            @foreach($paymentMethods as $k => $label)
              <option value="{{ $k }}" @selected(old('payment_method') === $k)>{{ $label }}</option>
            @endforeach
          </select>
        </div>

        <div>
          <label class="text-xs font-semibold text-zinc-700">Garantía (días)</label>
          <input name="warranty_days" value="{{ old('warranty_days', 0) }}" inputmode="numeric"
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
        </div>

        <div class="sm:col-span-3">
          <label class="text-xs font-semibold text-zinc-700">Notas de pago</label>
          <input name="payment_notes" value="{{ old('payment_notes') }}" placeholder="Ej: señal, transferencia, etc."
                 class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="text-xs font-semibold text-zinc-700">Estado *</label>
          <select name="status" required
                  class="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">
            @foreach($statuses as $k => $label)
              <option value="{{ $k }}" @selected($oldStatus === $k)>{{ $label }}</option>
            @endforeach
          </select>
        </div>

        <div class="sm:col-span-2">
          <label class="text-xs font-semibold text-zinc-700">Notas internas</label>
          <textarea name="notes" rows="3"
                    class="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100">{{ old('notes') }}</textarea>
        </div>
      </div>
    </div>

    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
      <a href="{{ route('admin.repairs.index') }}"
         class="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
        Cancelar
      </a>
      <button class="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
        Crear reparación
      </button>
    </div>
  </form>
</div>
@endsection
