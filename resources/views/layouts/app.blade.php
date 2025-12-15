<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token() }}">

  <title>@yield('title', config('app.name', 'NicoReparaciones'))</title>

  @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
    @vite(['resources/css/app.css', 'resources/js/app.js'])
  @else
    {{-- Fallback simple (dev sin Vite) --}}
    <link rel="stylesheet" href="{{ asset('css/estilos.css') }}">
  @endif
</head>

@php
  use App\Models\BusinessSetting;

  $isAuth = auth()->check();
  $isAdmin = $isAuth && (auth()->user()->role ?? 'user') === 'admin';

  $brandUrl = $isAdmin ? route('admin.dashboard') : route('home');

  $cart = session('cart', []);
  $cartCount = 0;
  foreach ($cart as $it) { $cartCount += (int)($it['quantity'] ?? 0); }

  // Footer data (optional)
  $bizName = BusinessSetting::getValue('business_name', 'NicoReparaciones');
  $bizPhone = BusinessSetting::getValue('business_phone', '');
  $bizAddress = BusinessSetting::getValue('business_address', '');
@endphp

<body class="min-h-screen flex flex-col">

  {{-- Topbar --}}
  <header class="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-zinc-100">
    <div class="container-page">
      <div class="h-14 flex items-center justify-between gap-3">

        {{-- Brand --}}
        <a href="{{ $brandUrl }}" class="flex items-center gap-3 no-underline">
          <img src="{{ asset('img/logo-nico.png') }}" alt="NicoReparaciones" class="h-9 w-9 rounded-2xl shadow-soft ring-1 ring-zinc-200">
          <div class="leading-tight">
            <div class="font-extrabold tracking-tight">{{ $bizName }}</div>
            <div class="text-xs text-zinc-500 -mt-0.5">Tienda + Reparaciones</div>
          </div>
        </a>

        {{-- Desktop nav --}}
        <nav class="hidden md:flex items-center gap-2">
          @if(!$isAdmin)
            <a class="btn-ghost" href="{{ route('store.index') }}">Tienda</a>
            <a class="btn-ghost" href="{{ route('repairs.lookup') }}">Consultar reparación</a>
            <a class="btn-ghost relative" href="{{ route('cart.index') }}">
              Carrito
              @if($cartCount > 0)
                <span class="badge-blue ml-1">{{ $cartCount }}</span>
              @endif
            </a>

            @if($isAuth)
              <a class="btn-ghost" href="{{ route('orders.index') }}">Mis pedidos</a>
              <a class="btn-ghost" href="{{ route('repairs.my.index') }}">Mis reparaciones</a>
            @endif
          @else
            <a class="btn-ghost" href="{{ route('admin.dashboard') }}">Dashboard</a>
            <a class="btn-ghost" href="{{ route('admin.repairs.index') }}">Reparaciones</a>
            <a class="btn-ghost" href="{{ route('admin.orders.index') }}">Pedidos</a>
            <a class="btn-ghost" href="{{ route('admin.products.index') }}">Productos</a>
            <a class="btn-ghost" href="{{ route('admin.categories.index') }}">Categorías</a>
            <a class="btn-ghost" href="{{ route('store.index') }}">Ver sitio</a>
          @endif

          {{-- Auth --}}
          @if(!$isAuth)
            <a class="btn-primary" href="{{ route('login') }}">Ingresar</a>
          @else
            <form action="{{ route('logout') }}" method="POST">
              @csrf
              <button class="btn-outline" type="submit">Salir</button>
            </form>
          @endif
        </nav>

        {{-- Mobile toggle --}}
        <button class="md:hidden btn-ghost px-3 py-2" data-toggle="menu" data-target="mobileMenu" aria-label="Menú">
          ☰
        </button>
      </div>

      {{-- Mobile menu --}}
      <div id="mobileMenu" class="hidden md:hidden pb-4">
        <div class="card">
          <div class="card-body flex flex-col gap-2">

            @if(!$isAdmin)
              <a class="btn-ghost justify-start" href="{{ route('store.index') }}">🛍️ Tienda</a>
              <a class="btn-ghost justify-start" href="{{ route('repairs.lookup') }}">🛠️ Consultar reparación</a>
              <a class="btn-ghost justify-start" href="{{ route('cart.index') }}">
                🧺 Carrito
                @if($cartCount > 0)
                  <span class="badge-blue ml-2">{{ $cartCount }}</span>
                @endif
              </a>

              @if($isAuth)
                <a class="btn-ghost justify-start" href="{{ route('orders.index') }}">📦 Mis pedidos</a>
                <a class="btn-ghost justify-start" href="{{ route('repairs.my.index') }}">🔧 Mis reparaciones</a>
              @endif
            @else
              <a class="btn-ghost justify-start" href="{{ route('admin.dashboard') }}">📊 Dashboard</a>
              <a class="btn-ghost justify-start" href="{{ route('admin.repairs.index') }}">🛠️ Reparaciones</a>
              <a class="btn-ghost justify-start" href="{{ route('admin.orders.index') }}">📦 Pedidos</a>
              <a class="btn-ghost justify-start" href="{{ route('admin.products.index') }}">🧩 Productos</a>
              <a class="btn-ghost justify-start" href="{{ route('admin.categories.index') }}">🏷️ Categorías</a>
              <a class="btn-ghost justify-start" href="{{ route('store.index') }}">🌐 Ver sitio</a>
            @endif

            <div class="h-px bg-zinc-100 my-1"></div>

            @if(!$isAuth)
              <a class="btn-primary w-full" href="{{ route('login') }}">Ingresar</a>
              <a class="btn-outline w-full" href="{{ route('register') }}">Crear cuenta</a>
            @else
              <form action="{{ route('logout') }}" method="POST">
                @csrf
                <button class="btn-outline w-full" type="submit">Salir</button>
              </form>
            @endif

          </div>
        </div>
      </div>

    </div>
  </header>

  {{-- Flash toasts --}}
  @if(session('success'))
    <div class="toast" data-toast data-timeout="4200">
      <div class="toast-card">
        <div class="mt-0.5">✅</div>
        <div class="flex-1">
          <div class="font-semibold">Listo</div>
          <div class="text-sm text-zinc-600">{{ session('success') }}</div>
        </div>
        <button class="btn-ghost px-2 py-1" type="button" data-toast-close>✕</button>
      </div>
    </div>
  @endif

  @if(session('error'))
    <div class="toast" data-toast data-timeout="5200">
      <div class="toast-card">
        <div class="mt-0.5">⚠️</div>
        <div class="flex-1">
          <div class="font-semibold">Atención</div>
          <div class="text-sm text-zinc-600">{{ session('error') }}</div>
        </div>
        <button class="btn-ghost px-2 py-1" type="button" data-toast-close>✕</button>
      </div>
    </div>
  @endif

  @if(session('cart_added'))
    <div class="toast" data-toast data-timeout="3200">
      <div class="toast-card">
        <div class="mt-0.5">🧺</div>
        <div class="flex-1">
          <div class="font-semibold">Agregado al carrito</div>
          <div class="text-sm text-zinc-600">
            {{ session('cart_added.product_name') }} · x{{ session('cart_added.quantity') }}
          </div>
        </div>
        <a class="btn-primary" href="{{ route('cart.index') }}">Ver</a>
      </div>
    </div>
  @endif

  {{-- Content --}}
  <main class="flex-1">
    @if($isAdmin)
      <div class="container-page py-6">
        <div class="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside class="hidden lg:block">
            <div class="card sticky top-20">
              <div class="card-header">
                <div class="font-extrabold tracking-tight">Panel</div>
                <div class="muted">Gestión del local</div>
              </div>
              <div class="card-body flex flex-col gap-2">
                <a class="btn-ghost justify-start" href="{{ route('admin.dashboard') }}">📊 Dashboard</a>
                <a class="btn-ghost justify-start" href="{{ route('admin.repairs.index') }}">🛠️ Reparaciones</a>
                <a class="btn-ghost justify-start" href="{{ route('admin.orders.index') }}">📦 Pedidos</a>
                <a class="btn-ghost justify-start" href="{{ route('admin.products.index') }}">🧩 Productos</a>
                <a class="btn-ghost justify-start" href="{{ route('admin.categories.index') }}">🏷️ Categorías</a>
                <div class="h-px bg-zinc-100 my-1"></div>
                <a class="btn-ghost justify-start" href="{{ route('store.index') }}">🌐 Ver sitio</a>
              </div>
            </div>
          </aside>

          <section>
            @yield('content')
          </section>
        </div>
      </div>
    @else
      <div class="container-page py-6">
        @yield('content')
      </div>
    @endif
  </main>

  {{-- Footer --}}
  <footer class="border-t border-zinc-100 bg-white">
    <div class="container-page py-8">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
        <div class="flex items-start gap-3">
          <img src="{{ asset('img/logo-nico.png') }}" class="h-10 w-10 rounded-2xl ring-1 ring-zinc-200" alt="Logo">
          <div>
            <div class="font-extrabold tracking-tight">{{ $bizName }}</div>
            <div class="text-sm text-zinc-600">Reparación de celulares y accesorios</div>
          </div>
        </div>

        <div class="text-sm text-zinc-600">
          <div class="font-semibold text-zinc-900 mb-2">Contacto</div>
          @if($bizPhone)
            <div>📞 {{ $bizPhone }}</div>
          @endif
          @if($bizAddress)
            <div>📍 {{ $bizAddress }}</div>
          @endif
          <div class="mt-2">
            <a class="link text-brand" href="{{ route('repairs.lookup') }}">Consultar reparación</a>
          </div>
        </div>

        <div class="text-sm text-zinc-600">
          <div class="font-semibold text-zinc-900 mb-2">Cuenta</div>
          @if($isAuth)
            <a class="link block" href="{{ route('orders.index') }}">Mis pedidos</a>
            <a class="link block" href="{{ route('repairs.my.index') }}">Mis reparaciones</a>
          @else
            <a class="link block" href="{{ route('login') }}">Ingresar</a>
            <a class="link block" href="{{ route('register') }}">Crear cuenta</a>
          @endif
        </div>
      </div>

      <div class="mt-8 text-xs text-zinc-500">
        © {{ date('Y') }} {{ $bizName }}. Hecho con Laravel.
      </div>
    </div>
  </footer>

</body>
</html>
