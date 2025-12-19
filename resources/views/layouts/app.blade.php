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
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"
                class="w-5 h-5" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>


          <a href="{{ $brandHref }}" class="flex items-center gap-2 min-w-0">
            @if($logoExists)
              <img src="/{{ $logoRel }}" class="h-9 w-9 object-contain" alt="NicoReparaciones">
            @else
              <div class="h-9 w-9 flex items-center justify-center font-black text-sky-700">NR</div>
            @endif


            <div class="leading-tight min-w-0">
              <div class="font-black tracking-tight text-zinc-900 truncate">
                Nico<span class="text-sky-600">Reparaciones</span>
              </div>
              <div class="hidden sm:block text-[11px] text-zinc-500 -mt-0.5 truncate">Servicio Tecnico Profesional y Tienda de Electronica</div>
            </div>
          </a>
        </div>

        <nav class="hidden md:flex items-center gap-1   rounded-full bg-zinc-100/80 p-1 ring-1 ring-zinc-200">
          @if($has('store.index'))
            <a href="{{ route('store.index') }}"
              class="inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold transition
                      {{ request()->routeIs('store.index','store.category','store.product','home')
                          ? 'bg-white text-sky-700 shadow-sm ring-1 ring-sky-200'
                          : 'text-zinc-700 hover:text-zinc-900 hover:bg-white/70' }}">
              Tienda
            </a>
          @endif

          @if($has('repairs.lookup'))
            <a href="{{ route('repairs.lookup') }}"
              class="inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold transition
                      {{ request()->routeIs('repairs.lookup','repairs.lookup.post')
                          ? 'bg-white text-sky-700 shadow-sm ring-1 ring-sky-200'
                          : 'text-zinc-700 hover:text-zinc-900 hover:bg-white/70' }}">
              Reparación
            </a>
          @endif

          @if($isAdmin && $has('admin.dashboard'))
            <a href="{{ route('admin.dashboard') }}"
              class="inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold transition
                      {{ request()->is('admin*')
                          ? 'bg-white text-sky-700 shadow-sm ring-1 ring-sky-200'
                          : 'text-zinc-700 hover:text-zinc-900 hover:bg-white/70' }}">
              Admin
            </a>
          @endif
        </nav>


        <div class="flex items-center gap-2">
          @if($has('cart.index'))
          <a href="{{ route('cart.index') }}"
            class="relative inline-flex items-center justify-center bg-transparent border-0 p-0 rounded-none hover:bg-transparent text-zinc-800 hover:text-sky-700 transition-colors mr-2"
            aria-label="Carrito">

            <svg xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="w-7 h-7"
                aria-hidden="true">
              <path d="M4.00488 16V4H2.00488V2H5.00488C5.55717 2 6.00488 2.44772 6.00488 3V15H18.4433L20.4433 7H8.00488V5H21.7241C22.2764 5 22.7241 5.44772 22.7241 6C22.7241 6.08176 22.7141 6.16322 22.6942 6.24254L20.1942 16.2425C20.083 16.6877 19.683 17 19.2241 17H5.00488C4.4526 17 4.00488 16.5523 4.00488 16ZM6.00488 23C4.90031 23 4.00488 22.1046 4.00488 21C4.00488 19.8954 4.90031 19 6.00488 19C7.10945 19 8.00488 19.8954 8.00488 21C8.00488 22.1046 7.10945 23 6.00488 23ZM18.0049 23C16.9003 23 16.0049 22.1046 16.0049 21C16.0049 19.8954 16.9003 19 18.0049 19C19.1095 19 20.0049 19.8954 20.0049 21C20.0049 22.1046 19.1095 23 18.0049 23Z"></path>
            </svg>

            @if($cartCount > 0)
              <span data-cart-count
                class="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-sky-600 text-white text-[10px] leading-4 font-black flex items-center justify-center ring-2 ring-white">
               {{ $cartCount }}
              </span>

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
                <span class="sm:hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round"
                      class="w-5 h-5" aria-hidden="true">
                    <path d="M20 21a8 8 0 0 0-16 0"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
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

        <button class="icon-btn" data-close="sidebar" aria-label="Cerrar menú" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
              class="w-5 h-5" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12"></path>
          </svg>
        </button>

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
                href="{{ route('store.index') }}">
                <span class="inline-flex items-center gap-2">
                  <img src="/icons/tienda.svg" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                  <span>Tienda</span>
                </span>
              </a>
            @endif

            @if($has('repairs.lookup'))
              <a class="sidebar-link {{ request()->routeIs('repairs.lookup','repairs.lookup.post') ? 'active' : '' }}"
                href="{{ route('repairs.lookup') }}">
                <span class="inline-flex items-center gap-2">
                  <img src="/icons/consultar-reparacion.svg" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                  <span>Consultar reparación</span>
                </span>
              </a>
            @endif

            @if($has('cart.index'))
              <a class="sidebar-link {{ request()->routeIs('cart.index') ? 'active' : '' }}"
                href="{{ route('cart.index') }}">
                <span class="inline-flex items-center gap-2">
                  <img src="/icons/carrito.svg" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                  <span>Carrito</span>
                </span>
              </a>
            @endif
          </div>
        </div>

        <div class="space-y-2">
          <div class="sidebar-title">Cuenta</div>
          <div class="grid gap-1">
            @if($isAuth)
              @if($has('orders.index'))
                <a class="sidebar-link {{ request()->routeIs('orders.index') ? 'active' : '' }}"
                  href="{{ route('orders.index') }}">
                  <span class="inline-flex items-center gap-2">
                    <img src="/icons/mis-pedidos.svg" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                    <span>Mis pedidos</span>
                  </span>
                </a>
              @endif

              @if($has('repairs.my.index'))
                <a class="sidebar-link {{ request()->routeIs('repairs.my.index') ? 'active' : '' }}"
                  href="{{ route('repairs.my.index') }}">
                  <span class="inline-flex items-center gap-2">
                    <img src="/icons/mis-reparaciones.svg" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                    <span>Mis reparaciones</span>
                  </span>
                </a>
              @endif

              @if($has('logout'))
                <form method="POST" action="{{ route('logout') }}">
                  @csrf
                  <button type="submit" class="sidebar-link text-rose-700 hover:text-rose-800">
                    <span class="inline-flex items-center gap-2">
                      <img src="/icons/logout.svg" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                      <span>Cerrar sesión</span>
                    </span>
                  </button>
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
              @if($has('admin.dashboard'))
                <a class="sidebar-link {{ request()->routeIs('admin.dashboard') ? 'active' : '' }}"
                  href="{{ route('admin.dashboard') }}">
                  <span class="inline-flex items-center gap-2">
                    <img src="/icons/dashboard.svg" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                    <span>Dashboard</span>
                  </span>
                </a>
              @endif

              @if($has('admin.orders.index'))
                <a class="sidebar-link {{ request()->routeIs('admin.orders.*') ? 'active' : '' }}"
                  href="{{ route('admin.orders.index') }}">
                  <span class="inline-flex items-center gap-2">
                    <img src="/icons/consultar-reparacion.svg" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                    <span>Pedidos</span>
                  </span>
                </a>
              @endif

              @if($has('admin.repairs.index'))
                <a class="sidebar-link {{ request()->routeIs('admin.repairs.*') ? 'active' : '' }}"
                  href="{{ route('admin.repairs.index') }}">
                  <span class="inline-flex items-center gap-2">
                    <img src="/icons/mis-reparaciones.svg" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                    <span>Reparaciones</span>
                  </span>
                </a>
              @endif

              @if($has('admin.products.index'))
                <a class="sidebar-link {{ request()->routeIs('admin.products.*') ? 'active' : '' }}"
                  href="{{ route('admin.products.index') }}">
                  <span class="inline-flex items-center gap-2">
                    <img src="/icons/mis-pedidos.svg" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                    <span>Productos</span>
                  </span>
                </a>
              @endif

              @if($has('admin.settings.index'))
                <a class="sidebar-link {{ request()->routeIs('admin.settings.*') ? 'active' : '' }}"
                  href="{{ route('admin.settings.index') }}">
                  <span class="inline-flex items-center gap-2">
                    <img src="/icons/settings.svg" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                    <span>Configuración</span>
                  </span>
                </a>
              @endif
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
    <div id="cartAddedOverlay"
         class="fixed inset-0 z-[60] opacity-0 pointer-events-none transition-opacity duration-300 ease-out"
         data-cart-added="1"
         aria-hidden="true">

      <div class="absolute inset-0 bg-zinc-950/40" data-cart-added-close></div>

      <div id="cartAddedSheet"
           class="absolute bottom-0 left-0 right-0 mx-auto max-w-xl translate-y-full transition-transform duration-300 ease-out will-change-transform">
        <div class="rounded-t-3xl bg-white p-4 shadow-2xl">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-base font-black">Agregado al carrito</div>
              @if(!empty($cartAdded['product_name']))
                <div class="mt-0.5 text-sm text-zinc-600">{{ $cartAdded['product_name'] }}</div>
              @endif
            </div>

            <button type="button" class="icon-btn" data-cart-added-close aria-label="Cerrar">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="mt-4 flex gap-2">
            <a href="{{ route('cart.index') }}" class="btn btn-primary flex-1 justify-center">Ver carrito</a>
            <button type="button" class="btn btn-outline flex-1 justify-center" data-cart-added-close>Seguir</button>
          </div>
        </div>
      </div>
    </div>
  @endif
</body>
</html>
