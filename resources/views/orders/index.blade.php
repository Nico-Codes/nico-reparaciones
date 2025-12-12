@extends('layouts.app')

@section('title', 'Mis pedidos - NicoReparaciones')

@section('content')
    <section class="hero">
        <h1 class="hero-title">Mis pedidos</h1>
        <p class="hero-text">
            Acá podés ver el historial y estado de tus pedidos.
        </p>
    </section>

    @if($orders->isEmpty())
        <p class="hero-text">Todavía no hiciste ningún pedido.</p>
        <a href="{{ route('store.index') }}" class="btn" style="margin-top:1rem;">
            Ir a la tienda
        </a>
    @else
        <section class="orders-list">
            @foreach($orders as $order)
                <article class="order-card">
                    <div class="order-card-main">
                        <div>
                            <h2 class="order-title">
                                Pedido #{{ $order->id }}
                            </h2>
                            <p class="order-sub">
                                {{ $order->created_at->format('d/m/Y H:i') }}
                            </p>
                            <p class="order-status">
                                Estado: <strong>{{ ucfirst(str_replace('_', ' ', $order->status)) }}</strong>
                            </p>
                        </div>

                        <div class="order-total">
                            ${{ number_format($order->total, 0, ',', '.') }}
                        </div>
                    </div>

                    <a href="{{ route('orders.show', $order->id) }}" class="btn btn-outline" style="margin-top:0.5rem;">
                        Ver detalle
                    </a>
                </article>
            @endforeach
        </section>
    @endif
@endsection
