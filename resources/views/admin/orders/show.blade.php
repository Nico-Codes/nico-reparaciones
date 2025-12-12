@extends('layouts.app')

@section('title', 'Admin - Pedido #'.$order->id)

@section('content')
@php
    $customerName = $order->pickup_name ?: trim(($order->user->name ?? '').' '.($order->user->last_name ?? ''));
    $customerPhone = $order->pickup_phone ?: ($order->user->phone ?? '');
    $itemsSummary = $order->items->map(fn($i) => $i->quantity.'x '.$i->product_name)->implode(', ');
    $notesPrefill = "Generado desde pedido #{$order->id} ({$order->created_at->format('d/m/Y H:i')}).";
    if ($itemsSummary) {
        $notesPrefill .= " Productos: {$itemsSummary}.";
    }

    $repairCreateUrl = route('admin.repairs.create', [
        'user_email' => $order->user->email ?? '',
        'customer_name' => $customerName,
        'customer_phone' => $customerPhone,
        'notes' => $notesPrefill,
    ]);
@endphp

<div style="display:flex; flex-direction:column; gap:14px;">
    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <h1 style="margin:0;">Pedido #{{ $order->id }}</h1>

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <a href="{{ route('admin.orders.index') }}" style="text-decoration:none; padding:10px 12px; border:1px solid #eee; border-radius:12px;">
                ← Volver a pedidos
            </a>

            <a href="{{ $repairCreateUrl }}" style="text-decoration:none; padding:10px 12px; border:1px solid #111; border-radius:12px;">
                🛠️ Crear reparación para este cliente
            </a>
        </div>
    </div>

    <div style="padding:12px; border:1px solid #eee; border-radius:12px;">
        <strong>Estado actual:</strong> {{ ucfirst(str_replace('_', ' ', $order->status)) }}
    </div>

    @if(session('success'))
        <div style="padding:12px; border:1px solid #d1fae5; background:#ecfdf5; border-radius:12px;">
            {{ session('success') }}
        </div>
    @endif

    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px;">
        <div style="padding:12px; border:1px solid #eee; border-radius:12px;">
            <h3 style="margin:0 0 8px;">Cliente</h3>

            <div><strong>Nombre:</strong> {{ $order->user->name }} {{ $order->user->last_name }}</div>
            <div><strong>Email:</strong> {{ $order->user->email }}</div>

            @if($order->user->phone)
                <div><strong>Teléfono:</strong> {{ $order->user->phone }}</div>
            @endif
        </div>

        <div style="padding:12px; border:1px solid #eee; border-radius:12px;">
            <h3 style="margin:0 0 8px;">Pedido</h3>

            <div><strong>Fecha:</strong> {{ $order->created_at->format('d/m/Y H:i') }}</div>
            <div><strong>Total:</strong> ${{ number_format($order->total, 0, ',', '.') }}</div>
            <div><strong>Forma de pago:</strong> {{ ucfirst(str_replace('_', ' ', $order->payment_method)) }}</div>

            @if($order->pickup_name)
                <div><strong>Retira:</strong> {{ $order->pickup_name }}</div>
            @endif

            @if($order->pickup_phone)
                <div><strong>Teléfono de retiro:</strong> {{ $order->pickup_phone }}</div>
            @endif

            @if($order->notes)
                <div style="margin-top:8px;"><strong>Notas cliente:</strong><br>{{ $order->notes }}</div>
            @endif
        </div>
    </div>

    <div style="padding:12px; border:1px solid #eee; border-radius:12px;">
        <h3 style="margin:0 0 10px;">Productos del pedido</h3>

        @foreach($order->items as $item)
            <div style="padding:10px; border:1px solid #f1f1f1; border-radius:12px; margin-bottom:10px;">
                <div style="font-weight:700;">{{ $item->product_name }}</div>
                <div style="opacity:.85;">x {{ $item->quantity }} · ${{ number_format($item->price, 0, ',', '.') }} c/u</div>
                <div style="margin-top:6px;"><strong>Subtotal:</strong> ${{ number_format($item->subtotal, 0, ',', '.') }}</div>
            </div>
        @endforeach
    </div>

    <div style="padding:12px; border:1px solid #eee; border-radius:12px;">
        <h3 style="margin:0 0 10px;">Actualizar estado</h3>

        <form method="POST" action="{{ route('admin.orders.updateStatus', $order) }}" style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
            @csrf

            <select name="status" style="padding:10px; border-radius:12px; border:1px solid #eee; min-width:220px;">
                <option value="pendiente" {{ $order->status === 'pendiente' ? 'selected' : '' }}>Pendiente</option>
                <option value="confirmado" {{ $order->status === 'confirmado' ? 'selected' : '' }}>Confirmado</option>
                <option value="preparando" {{ $order->status === 'preparando' ? 'selected' : '' }}>Preparando</option>
                <option value="listo_retirar" {{ $order->status === 'listo_retirar' ? 'selected' : '' }}>Listo para retirar</option>
                <option value="entregado" {{ $order->status === 'entregado' ? 'selected' : '' }}>Entregado</option>
                <option value="cancelado" {{ $order->status === 'cancelado' ? 'selected' : '' }}>Cancelado</option>
            </select>

            <button type="submit" style="padding:10px 14px; border-radius:12px; border:1px solid #111; background:#111; color:#fff; cursor:pointer;">
                Guardar estado
            </button>
        </form>
    </div>
</div>
@endsection
