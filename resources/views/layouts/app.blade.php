<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>@yield('title', config('app.name', 'NicoReparaciones'))</title>

  @php
    $hotPath = public_path('hot');
    $manifestPath = public_path('build/manifest.json');

    $useHot = file_exists($hotPath);
    $useManifest = file_exists($manifestPath);

    // ✅ En build: generamos tags con rutas RELATIVAS (/build/...)
    $manifestCss = [];
    $manifestJs  = [];

    if ($useManifest) {
      $manifest = json_decode(@file_get_contents($manifestPath), true) ?: [];

      $entries = [
        'resources/js/app.js',
        'resources/css/app.css',
      ];

      foreach ($entries as $entry) {
        if (!isset($manifest[$entry])) continue;

        $data = $manifest[$entry];

        // file puede ser .js o .css
        if (!empty($data['file']) && is_string($data['file'])) {
          if (str_ends_with($data['file'], '.js')) $manifestJs[] = $data['file'];
          if (str_ends_with($data['file'], '.css')) $manifestCss[] = $data['file'];
        }

        // css asociado a la entry (muy común en app.js)
        if (!empty($data['css']) && is_array($data['css'])) {
          foreach ($data['css'] as $cssFile) {
            if (is_string($cssFile)) $manifestCss[] = $cssFile;
          }
        }
      }

      $manifestCss = array_values(array_unique($manifestCss));
      $manifestJs  = array_values(array_unique($manifestJs));
    }
  @endphp

  @if($useHot)
    {{-- DEV (solo PC / misma red). Para túnel remoto NO sirve porque apunta a localhost:5173 --}}
    @vite(['resources/css/app.css', 'resources/js/app.js'])
  @elseif($useManifest)
    {{-- ✅ BUILD (túnel remoto): rutas relativas SIEMPRE funcionan --}}
    @foreach($manifestCss as $css)
      <link rel="stylesheet" href="/build/{{ $css }}">
    @endforeach
    @foreach($manifestJs as $js)
      <script type="module" src="/build/{{ $js }}"></script>
    @endforeach
  @else
    {{-- fallback mínimo --}}
    <style>
      body{margin:0;font-family:system-ui,Segoe UI,Roboto,Arial;background:#fafafa;color:#09090b}
      a{text-decoration:none;color:inherit}
      .container-page{max-width:1100px;margin:0 auto;padding:0 16px}
    </style>
  @endif
</head>

@php
  $isAuth  = auth()->check();
  $isAdmin = $isAuth && ((auth()->user()->role ?? null) === 'admin' || (auth()->user()->is_admin ?? false));

  $cart = session('cart', []);
  $cartCount = 0;
  foreach ($cart as $i) { $cartCount += (int)($i['quantity'] ?? 0); }

  $logoRel = 'brand/logo.png';
  $logoExists = file_exists(public_path($logoRel));

  $has = fn($name) => \Illuminate\Support\Facades\Route::has($name);

  $brandHref = $isAdmin && $has('admin.dashboard')
    ? route('admin.dashboard')
    : ($has('store.index') ? route('store.index') : '/');

  $cartAdded = session('cart_added'); // ['product_name' => ..., 'quantity' => ...]
@endphp

<body class="min-h-screen flex flex-col">
  <header class="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-sm md:bg-white/90 md:backdrop-blur">
    <div class="container-page">
      <div class="h-14 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <button
            class="icon-btn md:hidden"
            data-toggle="sidebar"
            aria-label="Abrir menú"
            aria-expanded="false"
            type="button"
          >☰</button>

          <a href="{{ $brandHref }}" class="flex items-center gap-2 min-w-0">
            @if($logoExists)
              <img src="/{{ $logoRel }}" class="h-9 w-9 rounded-xl ring-1 ring-zinc-100 bg-white object-contain" alt="NicoReparaciones">
            @else
              <div class="h-9 w-9 rounded-xl ring-1 ring-zinc-100 bg-white flex items-center justify-center font-black text-sky-700">NR</div>
            @endif

            <div class="leading-tight min-w-0">
              <div class="font-black tracking-tight text-zinc-900 truncate">
                Nico<span class="text-sky-600">Reparaciones</span>
              </div>
              <div class="hidden sm:block text-[11px] text-zinc-500 -mt-0.5 truncate">Tienda + Reparaciones</div>
            </div>
          </a>
        </div>

        <nav class="hidden md:flex items-center gap-1">
          @if($has('store.index'))
            <a class="nav-link {{ request()->routeIs('store.index','store.category','store.product','home') ? 'active' : '' }}"
               href="{{ route('store.index') }}">Tienda</a>
          @endif

          @if($has('repairs.lookup'))
            <a class="nav-link {{ request()->routeIs('repairs.lookup','repairs.lookup.post') ? 'active' : '' }}"
               href="{{ route('repairs.lookup') }}">Reparación</a>
          @endif

          @if($isAdmin && $has('admin.dashboard'))
            <a class="nav-link {{ request()->is('admin*') ? 'active' : '' }}"
               href="{{ route('admin.dashboard') }}">Admin</a>
          @endif
        </nav>

        <div class="flex items-center gap-2">
          @if($has('cart.index'))
            <a href="{{ route('cart.index') }}" class="icon-btn relative" aria-label="Carrito">
              🛒
              @if($cartCount > 0)
                <span class="absolute -top-1 -right-1 badge-sky">{{ $cartCount }}</span>
              @endif
            </a>
          @endif

          @if(!$isAuth)
            @if($has('login'))
              <a href="{{ route('login') }}" class="btn-outline hidden sm:inline-flex">Ingresar</a>
              <a href="{{ route('login') }}" class="btn-primary sm:hidden">Ingresar</a>
            @endif
            @if($has('register'))
              <a href="{{ route('register') }}" class="btn-primary hidden sm:inline-flex">Crear cuenta</a>
            @endif
          @else
            <div class="relative">
              <button class="btn-ghost px-3 py-2" data-menu="accountMenu" aria-expanded="false" type="button">
                <span class="sm:hidden">👤</span>
                <span class="hidden sm:inline max-w-[12rem] truncate">{{ auth()->user()->name ?? 'Cuenta' }}</span>
                <span class="hidden sm:inline">▾</span>
              </button>

              <div id="accountMenu" class="dropdown-menu hidden">
                @if($has('orders.index')) <a class="dropdown-item" href="{{ route('orders.index') }}">Mis pedidos</a> @endif
                @if($has('repairs.my.index')) <a class="dropdown-item" href="{{ route('repairs.my.index') }}">Mis reparaciones</a> @endif
                @if($isAdmin && $has('admin.dashboard')) <a class="dropdown-item" href="{{ route('admin.dashboard') }}">Panel admin</a> @endif

                @if($has('logout'))
                  <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit" class="dropdown-item text-rose-700">Cerrar sesión</button>
                  </form>
                @endif
              </div>
            </div>
          @endif
        </div>
      </div>
    </div>

    <div id="appSidebarOverlay" class="fixed inset-0 z-50 hidden bg-zinc-950/40 md:hidden" data-close="sidebar" aria-hidden="true"></div>

    <aside
      id="appSidebar"
      class="fixed left-0 top-0 z-50 h-full w-[86%] max-w-xs -translate-x-full transform bg-white shadow-xl transition-transform duration-200 ease-out md:hidden"
      aria-label="Menú">

      <div class="h-14 px-4 flex items-center justify-between border-b border-zinc-100">
        <div class="flex items-center gap-2">
          @if($logoExists)
            <img src="/{{ $logoRel }}" class="h-8 w-8 rounded-xl ring-1 ring-zinc-100 bg-white object-contain" alt="NicoReparaciones">
          @else
            <div class="h-8 w-8 rounded-xl ring-1 ring-zinc-100 bg-white flex items-center justify-center font-black text-sky-700">NR</div>
          @endif
          <div class="font-black text-zinc-900">Menú</div>
        </div>

        <button class="icon-btn" data-close="sidebar" aria-label="Cerrar menú" type="button">✕</button>
      </div>

      <div class="p-4 space-y-6">
        @if($isAuth)
          <div class="card">
            <div class="card-body">
              <div class="font-black text-zinc-900 truncate">{{ auth()->user()->name ?? 'Usuario' }}</div>
              <div class="sidebar-sub truncate">{{ auth()->user()->email ?? '' }}</div>
            </div>
          </div>
        @endif

        <div class="space-y-2">
          <div class="sidebar-title">Navegación</div>
          <div class="grid gap-1">
            @if($has('store.index'))
              <a class="sidebar-link {{ request()->routeIs('store.index','store.category','store.product','home') ? 'active' : '' }}"
                 href="{{ route('store.index') }}">🛍️ Tienda</a>
            @endif

            @if($has('repairs.lookup'))
              <a class="sidebar-link {{ request()->routeIs('repairs.lookup','repairs.lookup.post') ? 'active' : '' }}"
                 href="{{ route('repairs.lookup') }}">🧾 Consultar reparación</a>
            @endif

            @if($has('cart.index'))
              <a class="sidebar-link {{ request()->routeIs('cart.index') ? 'active' : '' }}"
                 href="{{ route('cart.index') }}">🛒 Carrito</a>
            @endif
          </div>
        </div>

        <div class="space-y-2">
          <div class="sidebar-title">Cuenta</div>
          <div class="grid gap-1">
            @if($isAuth)
              @if($has('orders.index')) <a class="sidebar-link {{ request()->routeIs('orders.index') ? 'active' : '' }}" href="{{ route('orders.index') }}">📦 Mis pedidos</a> @endif
              @if($has('repairs.my.index')) <a class="sidebar-link {{ request()->routeIs('repairs.my.index') ? 'active' : '' }}" href="{{ route('repairs.my.index') }}">🛠️ Mis reparaciones</a> @endif

              @if($has('logout'))
                <form method="POST" action="{{ route('logout') }}">
                  @csrf
                  <button type="submit" class="sidebar-link text-rose-700 hover:text-rose-800">🚪 Cerrar sesión</button>
                </form>
              @endif
            @else
              @if($has('login')) <a class="sidebar-link" href="{{ route('login') }}">Ingresar</a> @endif
              @if($has('register')) <a class="sidebar-link" href="{{ route('register') }}">Crear cuenta</a> @endif
            @endif
          </div>
        </div>

        @if($isAdmin)
          <div class="space-y-2">
            <div class="sidebar-title">Admin</div>
            <div class="grid gap-1">
              @if($has('admin.dashboard')) <a class="sidebar-link {{ request()->routeIs('admin.dashboard') ? 'active' : '' }}" href="{{ route('admin.dashboard') }}">📊 Dashboard</a> @endif
              @if($has('admin.orders.index')) <a class="sidebar-link {{ request()->routeIs('admin.orders.*') ? 'active' : '' }}" href="{{ route('admin.orders.index') }}">🧾 Pedidos</a> @endif
              @if($has('admin.repairs.index')) <a class="sidebar-link {{ request()->routeIs('admin.repairs.*') ? 'active' : '' }}" href="{{ route('admin.repairs.index') }}">🛠️ Reparaciones</a> @endif
              @if($has('admin.products.index')) <a class="sidebar-link {{ request()->routeIs('admin.products.*') ? 'active' : '' }}" href="{{ route('admin.products.index') }}">📦 Productos</a> @endif
              @if($has('admin.settings.index')) <a class="sidebar-link {{ request()->routeIs('admin.settings.*') ? 'active' : '' }}" href="{{ route('admin.settings.index') }}">⚙️ Configuración</a> @endif
            </div>
          </div>
        @endif
      </div>
    </aside>
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
              <img src="/{{ $logoRel }}" class="h-9 w-9 rounded-xl ring-1 ring-zinc-100 bg-white object-contain" alt="NicoReparaciones">
            @else
              <div class="h-9 w-9 rounded-xl ring-1 ring-zinc-100 bg-white flex items-center justify-center font-black text-sky-700">NR</div>
            @endif
            <div class="font-black tracking-tight">Nico<span class="text-sky-600">Reparaciones</span></div>
          </div>
          <p class="muted mt-2">Tienda simple + consulta de reparaciones.</p>
        </div>

        <div class="text-sm">
          <div class="font-black text-zinc-900 mb-2">Accesos</div>
          <div class="grid gap-1">
            @if($has('store.index')) <a href="{{ route('store.index') }}">Tienda</a> @endif
            @if($has('cart.index')) <a href="{{ route('cart.index') }}">Carrito</a> @endif
            @if($has('repairs.lookup')) <a href="{{ route('repairs.lookup') }}">Consultar reparación</a> @endif
          </div>
        </div>

        <div class="text-sm">
          <div class="font-black text-zinc-900 mb-2">Cuenta</div>
          <div class="grid gap-1">
            @if($isAuth)
              @if($has('orders.index')) <a href="{{ route('orders.index') }}">Mis pedidos</a> @endif
              @if($has('repairs.my.index')) <a href="{{ route('repairs.my.index') }}">Mis reparaciones</a> @endif
              @if($has('logout'))
                <form method="POST" action="{{ route('logout') }}">
                  @csrf
                  <button class="text-left text-rose-700 hover:text-rose-800 font-bold">Cerrar sesión</button>
                </form>
              @endif
            @else
              @if($has('login')) <a href="{{ route('login') }}">Ingresar</a> @endif
              @if($has('register')) <a href="{{ route('register') }}">Registrarme</a> @endif
            @endif
          </div>
        </div>
      </div>

      <div class="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-zinc-500">
        <div>© {{ date('Y') }} NicoReparaciones</div>
        <div class="text-zinc-400">Hecho con Laravel</div>
      </div>
    </div>
  </footer>

  {{-- Bottom-sheet “Agregado al carrito” --}}
  @if(is_array($cartAdded))
    <div id="cartAddedOverlay" class="fixed inset-0 z-[60] hidden" aria-hidden="true" data-cart-added="1">
      <div id="cartAddedBackdrop"
           class="absolute inset-0 bg-zinc-950/40 opacity-0 transition-opacity duration-300 ease-out"
           data-cart-added-close></div>

      <div id="cartAddedSheet"
           class="absolute bottom-0 left-0 right-0 mx-auto max-w-xl translate-y-full opacity-0 transition duration-300 ease-out will-change-transform">
        <div class="bg-white rounded-t-3xl border border-zinc-200 shadow-2xl ring-1 ring-zinc-900/5 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <div class="px-4 pt-3 pb-2 flex items-center justify-between">
            <div class="h-1.5 w-12 rounded-full bg-zinc-200 mx-auto"></div>
          </div>

          <div class="px-4 pb-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 min-w-0">
                <div class="mt-0.5 h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <span class="text-emerald-700 font-black">✓</span>
                </div>

                <div class="min-w-0">
                  <div class="font-black text-zinc-900">Agregaste a tu carrito</div>
                  <div class="text-sm text-zinc-600 truncate">
                    {{ $cartAdded['product_name'] ?? 'Producto' }}
                  </div>
                  <div class="text-xs text-zinc-500 mt-0.5">
                    {{ (int)($cartAdded['quantity'] ?? 1) }} unidad{{ ((int)($cartAdded['quantity'] ?? 1) === 1) ? '' : 'es' }}
                  </div>
                </div>
              </div>

              <button type="button" class="icon-btn" data-cart-added-close aria-label="Cerrar">✕</button>
            </div>

            <div class="mt-4 grid gap-2">
              <a href="{{ route('cart.index') }}" class="btn-primary w-full">Ir al carrito</a>
              <button type="button" class="btn-outline w-full" data-cart-added-close>Seguir comprando</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  @endif
</body>
</html>
