<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'NicoReparaciones') }}</title>
</head>

<body style="margin:0;background:#fafafa;font-family:Arial,Helvetica,sans-serif;">
@php
    $isAuth = auth()->check();
    $isAdmin = $isAuth && (auth()->user()->role ?? 'user') === 'admin';

    // ✅ Logo en header: si es admin -> dashboard admin, si no -> home
    $brandUrl = $isAdmin ? route('admin.dashboard') : route('home');
@endphp

<header style="background:#fff;border-bottom:1px solid #eee;">
    <div style="max-width:1100px;margin:0 auto;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;">

        {{-- Brand / Icon --}}
        <a href="{{ $brandUrl }}" style="display:flex;align-items:center;gap:10px;text-decoration:none;color:#111;">
            <div style="width:34px;height:34px;border-radius:10px;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;">
                N
            </div>
            <div style="font-weight:900;line-height:1;">
                {{ config('app.name', 'NicoReparaciones') }}
                @if($isAdmin)
                    <span style="font-size:12px;font-weight:700;color:#666;margin-left:6px;">(Admin)</span>
                @endif
            </div>
        </a>

        {{-- Links --}}
        <nav style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;">
            @if($isAdmin)
                <a href="{{ route('admin.dashboard') }}">Panel</a>
                <a href="{{ route('admin.orders.index') }}">Pedidos</a>
                <a href="{{ route('admin.repairs.index') }}">Reparaciones</a>
                <a href="{{ route('admin.repairs.create') }}">+ Nueva reparación</a>
            @else
                <a href="{{ route('store.index') }}">Tienda</a>
                <a href="{{ route('cart.index') }}">Carrito</a>

                @if($isAuth)
                    <a href="{{ route('orders.index') }}">Mis pedidos</a>
                    <a href="{{ route('repairs.my.index') }}">Mis reparaciones</a>
                @endif
            @endif
        </nav>

        {{-- User --}}
        <div style="display:flex;gap:10px;align-items:center;">
            @if(!$isAuth)
                <a href="{{ route('login') }}">Login</a>
                <a href="{{ route('register') }}">Registro</a>
            @else
                <details style="position:relative;">
                    <summary style="list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px;">
                        <div style="width:34px;height:34px;border-radius:999px;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-weight:900;">
                            {{ strtoupper(substr(auth()->user()->name ?? 'U', 0, 1)) }}
                        </div>
                        <span style="font-weight:700;">{{ auth()->user()->name }}</span>
                    </summary>

                    <div style="position:absolute;right:0;top:44px;background:#fff;border:1px solid #eee;border-radius:12px;padding:10px;min-width:220px;box-shadow:0 10px 30px rgba(0,0,0,.06);">
                        @if($isAdmin)
                            <a href="{{ route('admin.dashboard') }}" style="display:block;padding:8px 10px;text-decoration:none;color:#111;">Panel Admin</a>
                            <a href="{{ route('admin.orders.index') }}" style="display:block;padding:8px 10px;text-decoration:none;color:#111;">Pedidos</a>
                            <a href="{{ route('admin.repairs.index') }}" style="display:block;padding:8px 10px;text-decoration:none;color:#111;">Reparaciones</a>
                        @else
                            <a href="{{ route('orders.index') }}" style="display:block;padding:8px 10px;text-decoration:none;color:#111;">Mis pedidos</a>
                            <a href="{{ route('repairs.my.index') }}" style="display:block;padding:8px 10px;text-decoration:none;color:#111;">Mis reparaciones</a>
                        @endif

                        <div style="border-top:1px solid #eee;margin:8px 0;"></div>

                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button type="submit" style="width:100%;padding:8px 10px;border-radius:10px;border:1px solid #111;background:#111;color:#fff;cursor:pointer;">
                                Cerrar sesión
                            </button>
                        </form>
                    </div>
                </details>
            @endif
        </div>
    </div>
</header>

<main style="max-width:1100px;margin:0 auto;padding:16px;">
    @yield('content')
</main>

</body>
</html>
