<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token() }}">

  <title>@yield('title', config('app.name', 'NicoReparaciones'))</title>

  {{-- Evita 500 si no hay Vite corriendo ni build generado --}}
  @if (file_exists(public_path('hot')) || file_exists(public_path('build/manifest.json')))
    @vite(['resources/css/app.css', 'resources/js/app.js'])
  @else
    <style>
      body{font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial; background:#fafafa; margin:0}
      .fallback{max-width:1100px;margin:0 auto;padding:16px}
      .fallback a{color:#0284c7;text-decoration:none}
      .fallback .box{background:#fff;border:1px solid #eee;border-radius:14px;padding:14px}
    </style>
  @endif
</head>

@php
  $isAuth  = auth()->check();
  $isAdmin = $isAuth && (auth()->user()->role ?? 'user') === 'admin';

  $brandUrl = $isAdmin ? route('admin.dashboard') : route('home');

  $cart = session('cart', []);
  $cartCount = 0;
  foreach ($cart as $i) { $cartCount += (int)($i['quantity'] ?? 0); }
@endphp

<body class="min-h-screen flex flex-col">
  {{-- Topbar --}}
  <header class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-zinc-100">
    <div class="container-page">
      <div class="h-14 flex items-center justify-between gap-3">
        {{-- Brand --}}
        <a href="{{ $brandUrl }}" class="flex items-center gap-3 min-w-0">
          <div class="h-9 w-9 rounded-2xl bg-white border border-zinc-200 overflow-hidden flex items-center justify-center">
            <img src="{{ asset('brand/logo.png') }}" alt="NicoReparaciones" class="h-9 w-9 object-contain">
          </div>
          <div class="min-w-0">
            <div class="text-sm font-extrabold tracking-tight text-zinc-900 leading-tight truncate">
              {{ config('app.name', 'NicoReparaciones') }}
            </div>
            <div class="text-[11px] text-zinc-500 leading-tight">
              Tienda + Reparaciones
              @if($isAdmin) · <span class="font-semibold text-sky-700">Admin</span> @endif
            </div>
          </div>
        </a>

        {{-- Desktop nav --}}
        <nav class="hidden md:flex items-center gap-2">
          @if($isAdmin)
            <a class="btn-ghost" href="{{ route('admin.dashboard') }}">Dashboard</a>
            <a class="btn-ghost" href="{{ route('admin.orders.index') }}">Pedidos</a>
            <a class="btn-ghost" href="{{ route('admin.repairs.index') }}">Reparaciones</a>
            <a class="btn-primary" href="{{ route('admin.repairs.create') }}">+ Nueva</a>
          @else
            <a class="btn-ghost" href="{{ route('store.index') }}">Tienda</a>
            <a class="btn-ghost" href="{{ route('repairs.lookup') }}">Consultar reparación</a>

            <a class="btn-ghost relative" href="{{ route('cart.index') }}">
              Carrito
              @if($cartCount > 0)
                <span class="absolute -top-1 -right-1 badge badge-sky">{{ $cartCount }}</span>
              @endif
            </a>

            @if($isAuth)
              <a class="btn-ghost" href="{{ route('orders.index') }}">Mis pedidos</a>
              <a class="btn-ghost" href="{{ route('repairs.my.index') }}">Mis reparaciones</a>
            @endif
          @endif
        </nav>

        {{-- Right --}}
        <div class="flex items-center gap-2">
          {{-- Mobile menu --}}
          <button class="md:hidden btn-ghost" data-toggle="mobile-drawer" aria-label="Abrir menú">☰</button>

          {{-- Auth block --}}
          @if(!$isAuth)
            <div class="hidden sm:flex items-center gap-2">
              <a class="btn-outline" href="{{ route('login') }}">Login</a>
              <a class="btn-primary" href="{{ route('register') }}">Registro</a>
            </div>
          @else
            <details class="relative">
              <summary class="list-none cursor-pointer btn-ghost">
                <span class="inline-flex items-center gap-2">
                  <span class="h-8 w-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-extrabold text-zinc-800">
                    {{ strtoupper(substr(auth()->user()->name ?? 'U', 0, 1)) }}
                  </span>
                  <span class="hidden sm:inline text-sm font-semibold text-zinc-800">{{ auth()->user()->name }}</span>
                </span>
              </summary>

              <div class="absolute right-0 mt-2 w-60 card overflow-hidden">
                <div class="card-body py-3">
                  @if($isAdmin)
                    <a class="btn-ghost w-full justify-start" href="{{ route('admin.dashboard') }}">Panel Admin</a>
                    <a class="btn-ghost w-full justify-start" href="{{ route('admin.orders.index') }}">Pedidos</a>
                    <a class="btn-ghost w-full justify-start" href="{{ route('admin.repairs.index') }}">Reparaciones</a>
                  @else
                    <a class="btn-ghost w-full justify-start" href="{{ route('orders.index') }}">Mis pedidos</a>
                    <a class="btn-ghost w-full justify-start" href="{{ route('repairs.my.index') }}">Mis reparaciones</a>
                  @endif

                  <div class="my-2 border-t border-zinc-100"></div>

                  <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit" class="btn-primary w-full">Cerrar sesión</button>
                  </form>
                </div>
              </div>
            </details>
          @endif
        </div>
      </div>
    </div>
  </header>

  {{-- Mobile drawer --}}
  <div id="mobileOverlay" class="hidden fixed inset-0 bg-black/35 z-40"></div>

  <aside id="mobileDrawer"
         class="fixed right-0 top-0 h-full w-[86%] max-w-sm bg-white z-50 border-l border-zinc-200 shadow-2xl
                translate-x-full transition-transform">
    <div class="p-4 flex items-center justify-between border-b border-zinc-100">
      <div class="flex items-center gap-3">
        <div class="h-9 w-9 rounded-2xl bg-white border border-zinc-200 overflow-hidden flex items-center justify-center">
          <img src="{{ asset('brand/logo.png') }}" alt="NicoReparaciones" class="h-9 w-9 object-contain">
        </div>
        <div class="text-sm font-extrabold">Menú</div>
      </div>
      <button class="btn-ghost" data-close="mobile-drawer" aria-label="Cerrar">✕</button>
    </div>

    <div class="p-4 space-y-2">
      @if($isAdmin)
        <a class="btn-ghost w-full justify-start" href="{{ route('admin.dashboard') }}">Dashboard</a>
        <a class="btn-ghost w-full justify-start" href="{{ route('admin.orders.index') }}">Pedidos</a>
        <a class="btn-ghost w-full justify-start" href="{{ route('admin.repairs.index') }}">Reparaciones</a>
        <a class="btn-primary w-full" href="{{ route('admin.repairs.create') }}">+ Nueva reparación</a>
      @else
        <a class="btn-ghost w-full justify-start" href="{{ route('store.index') }}">Tienda</a>
        <a class="btn-ghost w-full justify-start" href="{{ route('repairs.lookup') }}">Consultar reparación</a>
        <a class="btn-ghost w-full justify-start" href="{{ route('cart.index') }}">
          Carrito @if($cartCount>0) <span class="badge badge-sky ml-2">{{ $cartCount }}</span> @endif
        </a>

        @if($isAuth)
          <a class="btn-ghost w-full justify-start" href="{{ route('orders.index') }}">Mis pedidos</a>
          <a class="btn-ghost w-full justify-start" href="{{ route('repairs.my.index') }}">Mis reparaciones</a>
        @else
          <a class="btn-outline w-full text-center" href="{{ route('login') }}">Login</a>
          <a class="btn-primary w-full text-center" href="{{ route('register') }}">Registro</a>
        @endif
      @endif

      @if($isAuth)
        <div class="pt-3 border-t border-zinc-100">
          <form method="POST" action="{{ route('logout') }}">
            @csrf
            <button type="submit" class="btn-outline w-full">Cerrar sesión</button>
          </form>
        </div>
      @endif
    </div>
  </aside>

  {{-- Toast (agregado al carrito) --}}
  @if(session('cart_added'))
    <div id="toast"
         class="fixed left-1/2 -translate-x-1/2 bottom-5 z-50 card px-4 py-3 w-[92%] max-w-md
                opacity-0 translate-y-2 transition">
      <div class="flex items-start gap-3">
        <div class="h-9 w-9 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center">🛒</div>
        <div class="min-w-0 flex-1">
          <div class="text-sm font-extrabold text-zinc-900">Agregado al carrito</div>
          <div class="text-xs text-zinc-600 mt-0.5 truncate">
            {{ session('cart_added.product_name') }} · x{{ session('cart_added.quantity') }}
          </div>
        </div>
        <a href="{{ route('cart.index') }}" class="btn-primary px-3 py-2 text-xs">Ver</a>
      </div>
    </div>
  @endif

  <main class="flex-1">
    <div class="container-page py-6">
      {{-- Fallback visual si no está Vite --}}
      @if(!(file_exists(public_path('hot')) || file_exists(public_path('build/manifest.json'))))
        <div class="fallback">
          <div class="box">
            <div style="font-weight:800;margin-bottom:6px;">Modo fallback (sin Vite)</div>
            <div style="color:#555;margin-bottom:10px;">
              Para ver el diseño completo, corré <b>npm run dev</b> o generá el build.
            </div>
          </div>
        </div>
      @endif

      @yield('content')
    </div>
  </main>

  <footer class="border-t border-zinc-100 bg-white">
    <div class="container-page py-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-2xl border border-zinc-200 bg-white overflow-hidden flex items-center justify-center">
              <img src="{{ asset('brand/logo.png') }}" alt="NicoReparaciones" class="h-10 w-10 object-contain">
            </div>
            <div>
              <div class="text-sm font-extrabold text-zinc-900">{{ config('app.name', 'NicoReparaciones') }}</div>
              <div class="text-xs text-zinc-500">Accesorios · Reparaciones · Servicio</div>
            </div>
          </div>
          <p class="mt-3 text-sm text-zinc-600">
            Plataforma propia para operar el local: tienda online + seguimiento de reparaciones.
          </p>
        </div>

        <div>
          <div class="text-sm font-extrabold text-zinc-900">Atajos</div>
          <div class="mt-2 grid gap-2">
            <a class="text-sm text-zinc-700 hover:text-sky-700" href="{{ route('store.index') }}">Tienda</a>
            <a class="text-sm text-zinc-700 hover:text-sky-700" href="{{ route('repairs.lookup') }}">Consultar reparación</a>
            <a class="text-sm text-zinc-700 hover:text-sky-700" href="{{ route('cart.index') }}">Carrito</a>
          </div>
        </div>

        <div>
          <div class="text-sm font-extrabold text-zinc-900">Contacto</div>
          <div class="mt-2 text-sm text-zinc-600 space-y-1">
            <div>📍 Carcarañá, Santa Fe</div>
            <div>🕒 Horarios: a definir</div>
            <div>💬 WhatsApp: a definir</div>
          </div>
        </div>
      </div>

      <div class="mt-6 text-xs text-zinc-500">
        © {{ date('Y') }} NicoReparaciones — Hecho a medida.
      </div>
    </div>
  </footer>
</body>
</html>
