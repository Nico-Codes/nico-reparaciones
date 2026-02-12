@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');
@endphp

<div class="card-head">
  <div class="font-black">Ticket actual</div>
  <span class="badge-sky" id="quickSaleTicketCount">{{ (int)($cartItemsCount ?? 0) }} items</span>
</div>
<div class="card-body space-y-3">
  @if(empty($cart))
    <div class="text-sm text-zinc-500">No hay productos en la venta rapida.</div>
  @else
    <div class="grid gap-2">
      @foreach($cart as $line)
        @php
          $p = $line['product'];
        @endphp
        <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-2">
          <div class="text-sm font-black truncate">{{ $p->name }}</div>
          <div class="text-xs text-zinc-500">{{ $money($p->price) }} c/u</div>
          <div class="mt-2 flex items-center gap-2">
            <form method="POST" action="{{ route('admin.quick_sales.update_item', $p) }}" class="inline-flex items-center gap-2">
              @csrf
              <input type="number" min="0" max="999" name="quantity" value="{{ (int)$line['quantity'] }}" class="!w-20 h-9 text-right">
              <button class="btn-outline btn-sm h-9" type="submit">OK</button>
            </form>
            <form method="POST" action="{{ route('admin.quick_sales.remove_item', $p) }}">
              @csrf
              @method('DELETE')
              <button class="btn-ghost btn-sm h-9" type="submit">Quitar</button>
            </form>
          </div>
        </div>
      @endforeach
    </div>

    <div class="rounded-2xl bg-zinc-50 p-3">
      <div class="flex items-center justify-between">
        <span class="text-sm font-bold text-zinc-600">Total</span>
        <span class="text-xl font-black" id="quickSaleTicketTotal">{{ $money($cartTotal ?? 0) }}</span>
      </div>
    </div>

    <form method="POST" action="{{ route('admin.quick_sales.confirm') }}" class="grid gap-2">
      @csrf
      <div class="grid gap-1">
        <label>Nombre cliente *</label>
        <input name="customer_name" class="h-11" value="{{ old('customer_name', 'Venta mostrador') }}" required>
      </div>
      <div class="grid gap-1">
        <label>Telefono (opcional)</label>
        <input name="customer_phone" class="h-11" value="{{ old('customer_phone') }}">
      </div>
      <div class="grid gap-1">
        <label>Metodo de pago *</label>
        <select name="payment_method" class="h-11" required>
          @foreach(($paymentMethods ?? []) as $pmKey => $pmLabel)
            <option value="{{ $pmKey }}" @selected(old('payment_method', 'local') === $pmKey)>{{ $pmLabel }}</option>
          @endforeach
        </select>
      </div>
      <div class="grid gap-1">
        <label>Notas (opcional)</label>
        <textarea name="notes" rows="3">{{ old('notes') }}</textarea>
      </div>
      <button class="btn-primary h-11 w-full justify-center" type="submit">Confirmar venta</button>
    </form>

    <form method="POST" action="{{ route('admin.quick_sales.clear') }}">
      @csrf
      <button class="btn-outline h-11 w-full justify-center" type="submit">Limpiar ticket</button>
    </form>
  @endif
</div>
