<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token() }}">

  <title>@yield('title', 'NicoReparaciones')</title>

  @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

@php
  $isAuth = auth()->check();
  $isAdmin = $isAuth && ((auth()->user()->role ?? null) === 'admin' || (auth()->user()->is_admin ?? false));

  $cart = session('cart', []);
  $cartCount = 0;
  foreach ($cart as $item) {
    $cartCount += (int)($item['quantity'] ?? 0);
  }

  $logoPath = 'logo.png';
  $logoExists = \Illuminate\Support\Facades\Storage::disk('public')->exists($logoPath);
@endphp

<body class="min-h-screen bg-zinc-50 text-zinc-900">
  <header class="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur">
    <div class="container-page">
      <div class="flex items-center justify-between py-3 gap-3">

        {{-- Left --}}
        <div class="flex items-center gap-3">
          <a href="{{ route('store.index') }}" class="flex items-center gap-2 font-black tracking-tight">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-900 text-white">N</span>
            <span class="hidden sm:inline">NicoReparaciones</span>
          </a>

          <nav class="hidden md:flex items-center gap-1">
            <a class="nav-link {{ request()->routeIs('store.*') || request()->routeIs('home') ? 'nav-link-active' : '' }}"
               href="{{ route('store.index') }}">Tienda</a>

            <a class="nav-link {{ request()->routeIs('repairs.lookup*') ? 'nav-link-active' : '' }}"
               href="{{ route('repairs.lookup') }}">Consultar reparación</a>

            @if($isAuth)
              <a class="nav-link {{ request()->routeIs('orders.*') ? 'nav-link-active' : '' }}"
                 href="{{ route('orders.index') }}">Mis pedidos</a>

              <a class="nav-link {{ request()->routeIs('repairs.my.*') ? 'nav-link-active' : '' }}"
                 href="{{ route('repairs.my.index') }}">Mis reparaciones</a>
            @endif
          </nav>
        </div>

        {{-- Right --}}
        <div class="flex items-center gap-2">
          <a href="{{ route('cart.index') }}" class="btn-ghost px-3 py-2 relative">
            🛒 <span class="hidden sm:inline">Carrito</span>
            @if($cartCount > 0)
              <span class="absolute -top-1 -right-1 badge-sky">{{ $cartCount }}</span>
            @endif
          </a>

          <button class="btn-ghost px-3 py-2 md:hidden" onclick="document.getElementById('mobileMenu').classList.toggle('hidden')">
            ☰
          </button>

          @if(!$isAuth)
            <a href="{{ route('login') }}" class="btn-outline px-3 py-2">Ingresar</a>
            <a href="{{ route('register') }}" class="btn-primary px-3 py-2">Crear cuenta</a>
          @else
            <div class="relative">
              <button class="btn-ghost px-3 py-2" data-toggle="user-menu">
                {{ auth()->user()->name ?? 'Mi cuenta' }} ▾
              </button>

              <div class="dropdown-menu hidden" data-menu="user-menu">
                <a class="dropdown-item" href="{{ route('orders.index') }}">Mis pedidos</a>
                <a class="dropdown-item" href="{{ route('repairs.my.index') }}">Mis reparaciones</a>

                @if($isAdmin)
                  <a class="dropdown-item" href="{{ route('admin.dashboard') }}">Panel admin</a>
                  <a class="dropdown-item" href="{{ route('admin.settings.index') }}">Configuración</a>
                  <a class="dropdown-item" href="{{ route('admin.whatsapp_templates.index') }}">WhatsApp (Reparaciones)</a>
                  <a class="dropdown-item" href="{{ route('admin.orders_whatsapp_templates.index') }}">WhatsApp (Pedidos)</a>
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
            <a class="nav-link" href="{{ route('admin.settings.index') }}">Configuración</a>
            <a class="nav-link" href="{{ route('admin.whatsapp_templates.index') }}">WhatsApp (Reparaciones)</a>
            <a class="nav-link" href="{{ route('admin.orders_whatsapp_templates.index') }}">WhatsApp (Pedidos)</a>
          @endif
        </div>
      </div>
    </div>

    {{-- Admin quickbar (solo admin) --}}
    @if($isAdmin && request()->is('admin*'))
      <div class="bg-white border-t border-zinc-100">
        <div class="container-page py-2 flex items-center gap-2 overflow-x-auto">
          <a class="{{ request()->routeIs('admin.dashboard') ? 'btn-primary btn-sm' : 'btn-outline btn-sm' }}"
             href="{{ route('admin.dashboard') }}">Dashboard</a>

          <a class="{{ request()->routeIs('admin.orders.*') ? 'btn-primary btn-sm' : 'btn-outline btn-sm' }}"
             href="{{ route('admin.orders.index') }}">Pedidos</a>

          <a class="{{ request()->routeIs('admin.repairs.*') ? 'btn-primary btn-sm' : 'btn-outline btn-sm' }}"
             href="{{ route('admin.repairs.index') }}">Reparaciones</a>

          <a class="{{ request()->routeIs('admin.products.*') ? 'btn-primary btn-sm' : 'btn-outline btn-sm' }}"
             href="{{ route('admin.products.index') }}">Productos</a>

          <a class="{{ request()->routeIs('admin.categories.*') ? 'btn-primary btn-sm' : 'btn-outline btn-sm' }}"
             href="{{ route('admin.categories.index') }}">Categorías</a>

          <a class="{{ request()->routeIs('admin.settings.*') ? 'btn-primary btn-sm' : 'btn-outline btn-sm' }}"
             href="{{ route('admin.settings.index') }}">Configuración</a>

          <a class="{{ request()->routeIs('admin.whatsapp_templates.*') ? 'btn-primary btn-sm' : 'btn-outline btn-sm' }}"
             href="{{ route('admin.whatsapp_templates.index') }}">WA Reparaciones</a>

          <a class="{{ request()->routeIs('admin.orders_whatsapp_templates.*') ? 'btn-primary btn-sm' : 'btn-outline btn-sm' }}"
             href="{{ route('admin.orders_whatsapp_templates.index') }}">WA Pedidos</a>
        </div>
      </div>
    @endif
  </header>

  <main class="flex-1">
    <div class="container-page py-6">
      @if (session('success'))
        <div class="alert-success mb-4">{{ session('success') }}</div>
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
            @if($logoExists)
              <img src="{{ asset('storage/' . $logoPath) }}" class="h-10 w-10 rounded-2xl object-cover" alt="Logo">
            @else
              <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white font-black">N</span>
            @endif
            <div>
              <div class="font-black">NicoReparaciones</div>
              <div class="text-xs text-zinc-500">Reparación y accesorios</div>
            </div>
          </div>

          <div class="mt-3 text-sm text-zinc-600">
            Atención personalizada · Presupuestos rápidos · Garantía
          </div>
        </div>

        <div>
          <div class="font-black">Secciones</div>
          <div class="mt-2 flex flex-col gap-1 text-sm">
            <a class="hover:underline" href="{{ route('store.index') }}">Tienda</a>
            <a class="hover:underline" href="{{ route('repairs.lookup') }}">Consultar reparación</a>
            @if($isAuth)
              <a class="hover:underline" href="{{ route('orders.index') }}">Mis pedidos</a>
              <a class="hover:underline" href="{{ route('repairs.my.index') }}">Mis reparaciones</a>
            @endif
          </div>
        </div>

        <div>
          <div class="font-black">Contacto</div>
          <div class="mt-2 text-sm text-zinc-600">
            WhatsApp y consultas en el local.
          </div>
        </div>
      </div>

      <div class="mt-6 text-xs text-zinc-500">
        © {{ date('Y') }} NicoReparaciones. Todos los derechos reservados.
      </div>
    </div>
  </footer>

  <script>
    // dropdown simple
    document.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle');
        const menu = document.querySelector(`[data-menu="${id}"]`);
        if (menu) menu.classList.toggle('hidden');
      });
    });

    document.addEventListener('click', (e) => {
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        const toggle = document.querySelector(`[data-toggle="${menu.getAttribute('data-menu')}"]`);
        if (!menu.contains(e.target) && toggle && !toggle.contains(e.target)) {
          menu.classList.add('hidden');
        }
      });
    });
  </script>
</body>
</html>
