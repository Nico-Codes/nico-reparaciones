@extends('layouts.app')

@section('title', 'Finalizar pedido - NicoReparaciones')

@section('content')
    <section class="hero">
        <h1 class="hero-title">Finalizar pedido</h1>
        <p class="hero-text">
            Revisá tu pedido y elegí la forma de pago.
        </p>
    </section>

    @if($errors->any())
        <div class="alert-error">
            <ul>
                @foreach($errors->all() as $error)
                    <li>- {{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    {{-- Resumen del carrito --}}
    <section class="cart-list">
        @foreach($cart as $item)
            <article class="cart-item">
                <div class="cart-item-main">
                    <div>
                        <h2 class="cart-item-title">
                            {{ $item['name'] }}
                        </h2>
                        <p class="cart-item-price">
                            x {{ $item['quantity'] }} · ${{ number_format($item['price'], 0, ',', '.') }} c/u
                        </p>
                    </div>

                    <div class="cart-item-footer">
                        <span>Subtotal</span>
                        <strong>${{ number_format($item['price'] * $item['quantity'], 0, ',', '.') }}</strong>
                    </div>
                </div>
            </article>
        @endforeach
    </section>

    {{-- Formulario de confirmación --}}
    <section class="cart-summary">
        <div class="cart-summary-row">
            <span>Total</span>
            <strong>${{ number_format($total, 0, ',', '.') }}</strong>
        </div>

        <form action="{{ route('checkout.confirm') }}" method="POST" style="margin-top: 1rem;">
            @csrf

            <label for="payment_method">Forma de pago</label>
            <select id="payment_method" name="payment_method" required>
                <option value="local">Pago en el local</option>
                <option value="mercado_pago">Mercado Pago</option>
                <option value="transferencia">Transferencia</option>
            </select>

            <label for="pickup_name" style="margin-top: 0.5rem;">Nombre de quien retira (opcional)</label>
            <input
                type="text"
                id="pickup_name"
                name="pickup_name"
                value="{{ old('pickup_name', auth()->user()->name) }}"
            >

            <label for="pickup_phone" style="margin-top: 0.5rem;">Teléfono de contacto (opcional)</label>
            <input
                type="text"
                id="pickup_phone"
                name="pickup_phone"
                value="{{ old('pickup_phone', auth()->user()->phone) }}"
            >

            <label for="notes" style="margin-top: 0.5rem;">Notas adicionales (opcional)</label>
            <textarea id="notes" name="notes" rows="3">{{ old('notes') }}</textarea>

            <button type="submit" class="btn" style="margin-top: 0.8rem; width: 100%;">
                Confirmar pedido
            </button>
        </form>

        <a href="{{ route('cart.index') }}" class="btn btn-outline" style="margin-top: 0.8rem; display:block;">
            Volver al carrito
        </a>
    </section>
@endsection
