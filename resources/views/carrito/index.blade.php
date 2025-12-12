@extends('layouts.app')

@section('title', 'Carrito - NicoReparaciones')

@section('content')

    <section class="hero">
        <h1 class="hero-title">Carrito</h1>
        <p class="hero-text">
            Revisá los productos antes de finalizar tu pedido.
        </p>
    </section>

    {{-- Mensajes de éxito --}}
    @if (session('success'))
        <div class="alert-success" style="margin-bottom: 1rem;">
            {{ session('success') }}
        </div>
    @endif

    {{-- Si el carrito está vacío --}}
    @if(empty($cart))
        <p class="hero-text">Tu carrito está vacío.</p>

        <a href="{{ route('store.index') }}" class="btn" style="margin-top: 1rem;">
            Ir a la tienda
        </a>
    @else

        {{-- LISTA DE PRODUCTOS EN EL CARRITO --}}
        <section class="cart-list">
            @foreach($cart as $item)
                <article class="cart-item">

                    {{-- Parte principal del ítem --}}
                    <div class="cart-item-main">

                        <div>
                            <h2 class="cart-item-title">
                                <a href="{{ route('store.product', $item['slug']) }}">
                                    {{ $item['name'] }}
                                </a>
                            </h2>

                            <p class="cart-item-price">
                                Precio unitario: ${{ number_format($item['price'], 0, ',', '.') }}
                            </p>
                        </div>

                        {{-- Actualizar cantidad --}}
                        <form action="{{ route('cart.update', $item['id']) }}" method="POST" class="cart-item-qty-form">
                            @csrf

                            <label for="qty-{{ $item['id'] }}">Cant.</label>

                            <input type="number"
                                   id="qty-{{ $item['id'] }}"
                                   name="quantity"
                                   min="1"
                                   value="{{ $item['quantity'] }}"
                                   style="width: 60px; padding: 3px; margin-left: .5rem;">

                            <button type="submit" class="btn btn-small" style="margin-left: .5rem;">
                                Actualizar
                            </button>
                        </form>

                    </div>

                    {{-- Footer del ítem --}}
                    <div class="cart-item-footer">
                        <span>Subtotal</span>
                        <strong>
                            ${{ number_format($item['price'] * $item['quantity'], 0, ',', '.') }}
                        </strong>

                        {{-- Botón eliminar producto --}}
                        <form action="{{ route('cart.remove', $item['id']) }}"
                              method="POST"
                              style="margin-left: auto;">
                            @csrf
                            <button type="submit"
                                    class="btn btn-outline btn-small"
                                    style="padding: .3rem .6rem;">
                                Quitar
                            </button>
                        </form>
                    </div>

                </article>
            @endforeach
        </section>

        {{-- RESUMEN TOTAL DEL CARRITO --}}
        <section class="cart-summary">

            <div class="cart-summary-row">
                <span>Total</span>
                <strong>${{ number_format($total, 0, ',', '.') }}</strong>
            </div>

            {{-- Botón de FINALIZAR PEDIDO --}}
            <a href="{{ route('checkout') }}" class="btn"
               style="margin-top: 0.5rem; display: block;">
                Finalizar pedido
            </a>

            {{-- Vaciar carrito --}}
            <form action="{{ route('cart.clear') }}" method="POST" style="margin-top: 0.5rem;">
                @csrf
                <button type="submit" class="btn btn-outline" style="width: 100%;">
                    Vaciar carrito
                </button>
            </form>

            {{-- Seguir comprando --}}
            <a href="{{ route('store.index') }}"
               class="btn btn-outline"
               style="margin-top: 0.5rem; display: block;">
                Seguir comprando
            </a>

        </section>

    @endif

@endsection
