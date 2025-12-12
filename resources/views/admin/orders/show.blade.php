@extends('layouts.app')

@section('title', 'Admin - Pedido #'.$order->id)

@section('content')
    <section class="hero">
        <h1 class="hero-title">Pedido #{{ $order->id }}</h1>
        <p class="hero-text">
            Estado actual:
            <strong>{{ ucfirst(str_replace('_', ' ', $order->status)) }}</strong>
        </p>
    </section>

    @if(session('success'))
        <div class="alert-success" style="margin-bottom:1rem;">
            {{ session('success') }}
        </div>
    @endif

    <section class="order-details">
        <h2 class="section-title">Cliente</h2>
        <p><strong>Nombre:</strong> {{ $order->user->name }} {{ $order->user->last_name }}</p>
        <p><strong>Email:</strong> {{ $order->user->email }}</p>
        @if($order->user->phone)
            <p><strong>Teléfono:</strong> {{ $order->user->phone }}</p>
        @endif

        <h2 class="section-title" style="margin-top:1rem;">Pedido</h2>
        <p><strong>Fecha:</strong> {{ $order->created_at->format('d/m/Y H:i') }}</p>
        <p><strong>Total:</strong> ${{ number_format($order->total, 0, ',', '.') }}</p>
        <p><strong>Forma de pago:</strong> {{ ucfirst(str_replace('_', ' ', $order->payment_method)) }}</p>

        @if($order->pickup_name)
            <p><strong>Retira:</strong> {{ $order->pickup_name }}</p>
        @endif

        @if($order->pickup_phone)
            <p><strong>Teléfono de retiro:</strong> {{ $order->pickup_phone }}</p>
        @endif

        @if($order->notes)
            <p><strong>Notas cliente:</strong> {{ $order->notes }}</p>
        @endif
    </section>

    <h2 class="section-title" style="margin-top:1rem;">Productos del pedido</h2>

    <section class="cart-list">
        @foreach($order->items as $item)
            <article class="cart-item">
                <div class="cart-item-main">
                    <div>
                        <h3 class="cart-item-title">{{ $item->product_name }}</h3>
                        <p class="cart-item-price">
                            x {{ $item->quantity }} · ${{ number_format($item->price, 0, ',', '.') }} c/u
                        </p>
                    </div>

                    <div class="cart-item-footer">
                        <span>Subtotal</span>
                        <strong>${{ number_format($item->subtotal, 0, ',', '.') }}</strong>
                    </div>
                </div>
            </article>
        @endforeach
    </section>

    <section class="order-status-change" style="margin-top:1.5rem;">
        <h2 class="section-title">Actualizar estado</h2>

        <form action="{{ route('admin.orders.updateStatus', $order->id) }}" method="POST">
            @csrf

            <label for="status">Nuevo estado</label>
            <select name="status" id="status" required>
                <option value="pendiente" {{ $order->status === 'pendiente' ? 'selected' : '' }}>Pendiente</option>
                <option value="confirmado" {{ $order->status === 'confirmado' ? 'selected' : '' }}>Confirmado</option>
                <option value="preparando" {{ $order->status === 'preparando' ? 'selected' : '' }}>Preparando</option>
                <option value="listo_retirar" {{ $order->status === 'listo_retirar' ? 'selected' : '' }}>Listo para retirar</option>
                <option value="entregado" {{ $order->status === 'entregado' ? 'selected' : '' }}>Entregado</option>
                <option value="cancelado" {{ $order->status === 'cancelado' ? 'selected' : '' }}>Cancelado</option>
            </select>

            <button type="submit" class="btn" style="margin-top:0.5rem;">
                Guardar estado
            </button>
        </form>

        <a href="{{ route('admin.orders.index') }}" class="btn btn-outline" style="margin-top:1rem; display:inline-block;">
            Volver a pedidos
        </a>
    </section>
@endsection
