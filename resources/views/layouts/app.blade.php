<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title>@yield('title', 'NicoReparaciones')</title>

    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    {{-- Favicon --}}
    <link rel="icon" type="image/png" href="{{ asset('img/favicon.png') }}" />

    {{-- CSS principal --}}
    <link rel="stylesheet" href="{{ asset('css/estilos.css') }}">

    @stack('head')
</head>
<body>
<div class="app">

    {{-- HEADER GLOBAL --}}
    <header class="main-header">
        <div class="left">
            {{-- Logo que lleva al inicio --}}
            <a href="{{ route('home') }}" class="brand-link">
                <img src="{{ asset('img/logo-nicoreparaciones.jpg') }}"
                     class="logo"
                     alt="NicoReparaciones" />
                <span class="brand-name">NicoReparaciones</span>
            </a>
        </div>

        <div class="icons">
            {{-- Usuario logueado --}}
            @auth
                {{-- Mis pedidos --}}
                <a href="{{ route('orders.index') }}" class="icon-link" aria-label="Mis pedidos">📦</a>

                {{-- Carrito --}}
                <a href="{{ route('cart.index') }}" class="icon-link" aria-label="Carrito">🛒</a>

                {{-- Nombre del usuario --}}
                <span class="user-name">
                    {{ auth()->user()->name }}
                </span>

                {{-- Logout --}}
                <form action="{{ route('logout') }}" method="POST" style="display:inline;">
                    @csrf
                    <button type="submit"
                            class="icon-link"
                            style="border:none;background:none;cursor:pointer;"
                            aria-label="Cerrar sesión">
                        🚪
                    </button>
                </form>
            @endauth

            {{-- Invitado --}}
            @guest
                <a href="{{ route('login') }}" class="icon-link" aria-label="Iniciar sesión">👤</a>
            @endguest
        </div>
    </header>

    {{-- CONTENIDO ESPECÍFICO DE CADA PANTALLA --}}
    <main>
        @yield('content')
    </main>

</div> {{-- /.app --}}

{{-- POPUP "AGREGASTE AL CARRITO" --}}
@if(session('cart_added'))
    @php
        $cartData = session('cart_added');
    @endphp

    <div id="cart-popup-backdrop" class="cart-popup-backdrop">
        <div class="cart-popup">
            <button class="cart-popup-close" type="button" data-cart-close>×</button>

            <h2 class="cart-popup-title">Agregaste al carrito</h2>

            <p class="cart-popup-product">
                {{ $cartData['product_name'] ?? 'Producto' }}<br>
                <small>{{ $cartData['quantity'] ?? 1 }} unidad(es)</small>
            </p>

            <div class="cart-popup-actions">
                <button type="button" class="btn btn-outline" data-cart-close>
                    Seguir comprando
                </button>

                <a href="{{ route('cart.index') }}" class="btn">
                    Ir al carrito
                </a>
            </div>
        </div>
    </div>

    @push('scripts')
        <script>
            document.addEventListener('DOMContentLoaded', function () {
                const backdrop = document.getElementById('cart-popup-backdrop');
                if (!backdrop) return;

                const closeElements = backdrop.querySelectorAll('[data-cart-close]');

                function closePopup() {
                    backdrop.classList.add('cart-popup-hidden');
                }

                // Cerrar al tocar "Seguir comprando" o la X
                closeElements.forEach(function (el) {
                    el.addEventListener('click', closePopup);
                });

                // Cerrar tocando fuera del panel (backdrop)
                backdrop.addEventListener('click', function (e) {
                    if (e.target === backdrop) {
                        closePopup();
                    }
                });

                // Cierre automático luego de unos segundos (opcional)
                setTimeout(closePopup, 6000);
            });
        </script>
    @endpush
@endif

@stack('scripts')
</body>
</html>
