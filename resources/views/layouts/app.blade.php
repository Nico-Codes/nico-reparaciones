<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>@yield('title', config('app.name', 'NicoReparaciones'))</title>
  @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

@php
  $isAuth  = auth()->check();
  $isAdmin = $isAuth && ((auth()->user()->role ?? null) === 'admin' || (auth()->user()->is_admin ?? false));

  $cart = session('cart', []);
  $cartCount = 0;
  foreach ($cart as $i) { $cartCount += (int)($i['quantity'] ?? 0); }

  // Logo: si existe PNG lo usa, si no usa el JPG del repo
  $logoPngPath = public_path('img/logo-nicoreparaciones.png');
  $logo = file_exists($logoPngPath)
      ? asset('img/logo-nicoreparaciones.png')
      : asset('img/logo-nicoreparaciones.jpg');
@endphp

<body class="min-h-screen flex flex-col">
  <header class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-zinc-100">
    <div class="container-page">
      <div class="h-14 flex items-center justify-between gap-3">
        {{-- Left --}}
        <div class="flex items-center gap-3">
          <button class="tap md:hidden btn-ghost px-3 py-2" data-toggle="mobile-menu" aria-label="Menú" aria-expanded="false">☰</button>

          <a href="{{ $isAdmin ? route('admin.dashboard') : route('store.index') }}" class="flex items-center gap-2">
            <img src="{{ $logo }}" class="h-9 w-9 rounded-xl ring-1 ring-zinc-100 bg-white object-contain" alt="NicoReparaciones">
            <div class="leading-tight">
              <div class="font-black tracking-tight text-zinc-900">
                Nico<span class="text-[rgb(var(--brand))]">Reparaciones</span>
              </div>
              <div class="text-[11px] text-zinc-500 -mt-0.5">Tienda + Reparaciones</div>
            </div>
          </a>
        </div>

        {{-- Desktop nav --}}
        <nav class="hidden md:flex items-center gap-1">
          <a class="nav-link {{ request()->routeIs('home','store.index','store.category','store.product') ? 'active' : '' }}"
             href="{{ route('store.index') }}">
            Tienda
          </a>

          <a class="nav-link {{ request()->routeIs('repairs.lookup','repairs.lookup.post') ? 'active' : '' }}"
             href="{{ route('repairs.lookup') }}">
            Consultar reparación
          </a>

          @if($isAuth)
            <a class="nav-link {{ request()->routeIs('orders.index','orders.show') ? 'active' : '' }}"
               href="{{ route('orders.index') }}">
              Mis pedidos
            </a>

            <a class="nav-link {{ request()->routeIs('repairs.my.index','repairs.my.show') ? 'active' : '' }}"
               href="{{ route('repairs.my.index') }}">
              Mis reparaciones
            </a>
          @endif

          @if($isAdmin)
            <a class="nav-link {{ request()->is('admin*') ? 'active' : '' }}"
               href="{{ route('admin.dashboard') }}">
              Admin
            </a>
          @endif
        </nav>

        {{-- Right --}}
        <div class="flex items-center gap-2">
          <a href="{{ route('cart.index') }}" class="btn-ghost px-3 py-2 relative">
            🛒 <span class="hidden sm:inline">Carrito</span>
            @if($cartCount > 0)
              <span class="absolute -top-1 -right-1 badge-sky">{{ $cartCount }}</span>
            @endif
          </a>

          @if(!$isAuth)
            <a href="{{ route('login') }}" class="btn-outline px-3 py-2">Ingresar</a>
            <a href="{{ route('register') }}" class="btn-primary px-3 py-2">Crear cuenta</a>
          @else
            <div class="relative">
              <button class="btn-ghost px-3 py-2" data-menu="userMenu" aria-expanded="false">
                {{ auth()->user()->name ?? 'Mi cuenta' }} ▾
              </button>

              <div id="userMenu" class="dropdown-menu hidden">
                <a class="dropdown-item" href="{{ route('orders.index') }}">Mis pedidos</a>
                <a class="dropdown-item" href="{{ route('repairs.my.index') }}">Mis reparaciones</a>

                @if($isAdmin)
                  <a class="dropdown-item" href="{{ route('admin.dashboard') }}">Panel admin</a>
                @endif

                <form method="POST" action="{{ route('logout') }}">
                  @csrf
                  <button type="submit" class="dropdown-item text-rose-700">Cerrar sesión</button>
                </form>
              </div>
            </div>
          @endif
        </div>
      </div>
    </div>

    {{-- Mobile menu --}}
    <div class="md:hidden hidden" id="mobileMenu">
      <div class="border-t border-zinc-100 bg-white">
        <div class="container-page py-3 flex flex-col gap-1">
          <a class="nav-link" href="{{ route('store.index') }}">Tienda</a>
          <a class="nav-link" href="{{ route('repairs.lookup') }}">Consultar reparación</a>

          @if($isAuth)
            <a class="nav-link" href="{{ route('orders.index') }}">Mis pedidos</a>
            <a class="nav-link" href="{{ route('repairs.my.index') }}">Mis reparaciones</a>
          @endif

          @if($isAdmin)
            <a class="nav-link" href="{{ route('admin.dashboard') }}">Panel admin</a>
          @endif
        </div>
      </div>
    </div>
  </header>

  <main class="flex-1">
    <div class="container-page py-6">
      @if (session('success'))
        <div class="alert-success mb-4">{{ session('success') }}</div>
      @endif

      @if (session('cart_added'))
        <div class="card mb-4">
          <div class="card-body flex items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="font-black">Agregado al carrito ✅</div>
              <div class="muted mt-1">
                {{ session('cart_added.product_name') }} · Cant: <span class="font-black text-zinc-900">{{ session('cart_added.quantity') }}</span>
              </div>
            </div>
            <a href="{{ route('cart.index') }}" class="btn-primary btn-sm">Ver</a>
          </div>
        </div>
      @endif

      @if ($errors->any())
        <div class="alert-error mb-4">
          <ul class="list-disc pl-5 space-y-1">
            @foreach ($errors->all() as $error)
              <li>{{ $error }}</li>
            @endforeach
          </ul>
        </div>
      @endif

      @yield('content')
    </div>
  </main>

  <footer class="border-t border-zinc-100 bg-white">
    <div class="container-page py-6">
      <div class="grid gap-6 md:grid-cols-3">
        <div>
          <div class="flex items-center gap-2">
            <img src="{{ $logo }}" class="h-9 w-9 rounded-xl ring-1 ring-zinc-100 bg-white object-contain" alt="NicoReparaciones">
            <div class="font-black tracking-tight">Nico<span class="text-[rgb(var(--brand))]">Reparaciones</span></div>
          </div>
          <p class="muted mt-2">Plataforma propia para tienda + gestión de reparaciones.</p>
        </div>

        <div class="text-sm">
          <div class="font-black text-zinc-900 mb-2">Accesos</div>
          <div class="grid gap-1">
            <a href="{{ route('store.index') }}">Tienda</a>
            <a href="{{ route('cart.index') }}">Carrito</a>
            <a href="{{ route('repairs.lookup') }}">Consultar reparación</a>
          </div>
        </div>

        <div class="text-sm">
          <div class="font-black text-zinc-900 mb-2">Cuenta</div>
          <div class="grid gap-1">
            @if($isAuth)
              <a href="{{ route('orders.index') }}">Mis pedidos</a>
              <a href="{{ route('repairs.my.index') }}">Mis reparaciones</a>
              <form method="POST" action="{{ route('logout') }}">
                @csrf
                <button class="text-left text-rose-700 hover:text-rose-800 font-black">Cerrar sesión</button>
              </form>
            @else
              <a href="{{ route('login') }}">Ingresar</a>
              <a href="{{ route('register') }}">Registrarme</a>
            @endif
          </div>
        </div>
      </div>

      <div class="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-zinc-500">
        <div>© {{ date('Y') }} NicoReparaciones</div>
        <div class="flex gap-3">
          <a class="hover:text-zinc-700" href="#">Términos</a>
          <a class="hover:text-zinc-700" href="#">Privacidad</a>
        </div>
      </div>
    </div>
  </footer>
</body>
</html>
