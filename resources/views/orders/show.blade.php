@extends('layouts.app')

@section('title', 'Pedido #'.$order->id.' - NicoReparaciones')

@section('content')
    <section class="hero">
        <h1 class="hero-title">Pedido #{{ $order->id }}</h1>
        <p class="hero-text">
            Estado: <strong>{{ ucfirst(str_replace('_', ' ', $order->status)) }}</strong>
        </p>
    </section>

    @if(session('success'))
        <div class="alert-success" style="margin-bottom:1rem;">
            {{ session('success') }}
        </div>
    @endif

    <section class="order-details">
        <p><strong>Fecha:</strong> {{ $order->created_at->format('d/m/Y H:i') }}</p>
        <p><strong>Total:</strong> ${{ number_format($order->total, 0, ',', '.') }}</p>
        <p><strong>Forma de pago:</strong> {{ ucfirst(str_replace('_', ' ', $order->payment_method)) }}</p>

        @if($order->pickup_name)
            <p><strong>Retira:</strong> {{ $order->pickup_name }}</p>
        @endif

        @if($order->pickup_phone)
            <p><strong>Teléfono:</strong> {{ $order->pickup_phone }}</p>
        @endif

        @if($order->notes)
            <p><strong>Notas:</strong> {{ $order->notes }}</p>
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

    <a href="{{ route('orders.index') }}" class="btn btn-outline" style="margin-top:1rem;">
        Volver a mis pedidos
    </a>
@endsection
