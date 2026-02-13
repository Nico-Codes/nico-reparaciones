@php
  $money = fn($n) => '$ ' . number_format((float)($n ?? 0), 0, ',', '.');
  $marginSummary = $cartMarginSummary ?? [
    'total_cost' => 0,
    'total_revenue' => 0,
    'total_profit' => 0,
    'margin_percent' => null,
    'negative_lines' => 0,
    'low_lines' => 0,
  ];
  $preventNegativeMargin = (bool) ($preventNegativeMargin ?? true);
  $hasNegativeMargin = (int) ($marginSummary['negative_lines'] ?? 0) > 0;
  $hasLowMargin = (int) ($marginSummary['low_lines'] ?? 0) > 0;
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
          $cost = (int) ($p->cost_price ?? 0);
          $sale = (int) ($p->price ?? 0);
          $lineMarginPercent = null;
          if ($cost > 0) {
            $lineMarginPercent = round((($sale - $cost) / $cost) * 100, 1);
          }
          $lineMarginClass = 'badge-zinc';
          if ($lineMarginPercent !== null) {
            if ($lineMarginPercent < 0) {
              $lineMarginClass = 'badge-rose';
            } elseif ($lineMarginPercent <= 10) {
              $lineMarginClass = 'badge-amber';
            } else {
              $lineMarginClass = 'badge-emerald';
            }
          }
        @endphp
        <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-2">
          <div class="text-sm font-black truncate">{{ $p->name }}</div>
          <div class="mt-1 flex items-center justify-between gap-2">
            <div class="text-xs text-zinc-500">{{ $money($p->price) }} c/u</div>
            <span class="{{ $lineMarginClass }}">
              @if($lineMarginPercent === null)
                Margen N/A
              @elseif($lineMarginPercent > 0)
                +{{ number_format((float) $lineMarginPercent, 1, ',', '.') }}%
              @else
                {{ number_format((float) $lineMarginPercent, 1, ',', '.') }}%
              @endif
            </span>
          </div>
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
      <div class="mt-2 flex items-center justify-between text-xs">
        <span class="font-semibold text-zinc-500">Costo estimado</span>
        <span class="font-black text-zinc-700">{{ $money($marginSummary['total_cost'] ?? 0) }}</span>
      </div>
      <div class="mt-1 flex items-center justify-between text-xs">
        <span class="font-semibold text-zinc-500">Margen estimado</span>
        <span class="font-black {{ (int)($marginSummary['total_profit'] ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700' }}">
          {{ $money($marginSummary['total_profit'] ?? 0) }}
          @if(($marginSummary['margin_percent'] ?? null) !== null)
            ({{ number_format((float)($marginSummary['margin_percent'] ?? 0), 1, ',', '.') }}%)
          @endif
        </span>
      </div>
    </div>

    @if($hasNegativeMargin || $hasLowMargin)
      <div class="{{ $hasNegativeMargin ? 'rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800' : 'rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800' }}">
        @if($hasNegativeMargin)
          <div class="font-black">Atencion: hay productos con margen negativo.</div>
          @if($preventNegativeMargin)
            <div class="mt-1">Con el guard activo, no se podra confirmar la venta hasta corregir precio/costo.</div>
          @endif
        @else
          <div class="font-black">Aviso: hay productos con margen bajo (<= 10%).</div>
        @endif
      </div>
    @endif

    <form method="POST" action="{{ route('admin.quick_sales.confirm') }}" class="grid gap-2" data-disable-on-submit>
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
      <div class="grid gap-2 sm:grid-cols-2">
        <button class="btn-primary h-11 w-full justify-center" type="submit" name="after_action" value="view" @disabled($preventNegativeMargin && $hasNegativeMargin) data-confirm-margin="{{ $preventNegativeMargin && $hasNegativeMargin ? 'blocked' : 'ok' }}">Confirmar venta</button>
        <button class="btn-outline h-11 w-full justify-center" type="submit" name="after_action" value="print_ticket" @disabled($preventNegativeMargin && $hasNegativeMargin) data-confirm-margin="{{ $preventNegativeMargin && $hasNegativeMargin ? 'blocked' : 'ok' }}">Confirmar e imprimir</button>
      </div>
    </form>

    <form method="POST" action="{{ route('admin.quick_sales.clear') }}">
      @csrf
      <button class="btn-outline h-11 w-full justify-center" type="submit">Limpiar ticket</button>
    </form>
  @endif
</div>
