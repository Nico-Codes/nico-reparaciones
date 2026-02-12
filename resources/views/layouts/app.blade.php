<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>@yield('title', config('app.name', 'NicoReparaciones'))</title>
  <link rel="icon" href="{{ \App\Support\BrandAssets::url('favicon_ico') }}">
  <link rel="icon" type="image/png" sizes="16x16" href="{{ \App\Support\BrandAssets::url('favicon_16') }}">
  <link rel="icon" type="image/png" sizes="32x32" href="{{ \App\Support\BrandAssets::url('favicon_32') }}">
  <link rel="apple-touch-icon" sizes="180x180" href="{{ \App\Support\BrandAssets::url('apple_touch_icon') }}">
  <link rel="manifest" href="{{ route('site.manifest') }}">
  <meta name="theme-color" content="#0ea5e9">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">



  @php
    $hotPath = public_path('hot');
    $manifestPath = public_path('build/manifest.json');

    $useHot = file_exists($hotPath);
    $useManifest = file_exists($manifestPath);

    // En build: generamos tags con rutas relativas (/build/...)
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

        // css asociado a la entry (muy comun en app.js)
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
    {{-- DEV (solo PC / misma red). Para tunel remoto no sirve porque apunta a localhost:5173 --}}
    @vite(['resources/css/app.css', 'resources/js/app.js'])
  @elseif($useManifest)
    {{-- BUILD (tunel remoto): rutas relativas siempre funcionan --}}
    @foreach($manifestCss as $css)
      <link rel="stylesheet" href="/build/{{ $css }}">
    @endforeach
    @foreach($manifestJs as $js)
      <script type="module" src="/build/{{ $js }}"></script>
    @endforeach
  @else
    {{-- fallback minimo --}}
    <style>
      body{margin:0;font-family:Inter,system-ui,Segoe UI,Roboto,Arial;background:#fafafa;color:#09090b}
      a{text-decoration:none;color:inherit}
      .container-page{max-width:1100px;margin:0 auto;padding:0 16px}
    </style>
  @endif
</head>

@php
  $isAuth  = auth()->check();
  $authUser = $isAuth ? auth()->user() : null;
  $isAdmin = $isAuth && (($authUser->role ?? null) === 'admin' || ($authUser->is_admin ?? false));
  $emailUnverified = $isAuth && method_exists($authUser, 'hasVerifiedEmail') && ! $authUser->hasVerifiedEmail();
  $emailStatusText = $isAuth
    ? ($emailUnverified ? 'Email pendiente de verificacion' : 'Email verificado')
    : null;
  $emailStatusClasses = $isAuth
    ? ($emailUnverified
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800')
    : '';

  $cart = session('cart', []);
  $cartCount = 0;
  foreach ($cart as $i) { $cartCount += (int)($i['quantity'] ?? 0); }

  $assetUrl = fn(string $key) => \App\Support\BrandAssets::url($key);
  $logoUrl = $assetUrl('logo_main');
  $iconStore = $assetUrl('icon_store');
  $iconRepairLookup = $assetUrl('icon_repair_lookup');
  $iconCart = $assetUrl('icon_cart');
  $iconSettings = $assetUrl('icon_settings');
  $iconOrders = $assetUrl('icon_orders');
  $iconRepairs = $assetUrl('icon_repairs');
  $iconLogout = $assetUrl('icon_logout');
  $iconDashboard = $assetUrl('icon_dashboard');

  $has = fn($name) => \Illuminate\Support\Facades\Route::has($name);

  $brandHref = $isAdmin && $has('admin.dashboard')
    ? route('admin.dashboard')
    : ($has('store.index') ? route('store.index') : '/');

  $cartAdded = session('cart_added'); // ['name' => ...] o legacy ['product_name' => ...]
  $cartAddedName = '';
  if (is_array($cartAdded)) {
    $cartAddedName = trim((string)($cartAdded['name'] ?? $cartAdded['product_name'] ?? ''));
  }

  $adminSchemaHealth = null;
  $canRunMigrationsFromWeb = false;
  if ($isAdmin && request()->is('admin*')) {
    $adminSchemaHealth = \App\Support\AdminSchemaHealth::evaluate();
    $canRunMigrationsFromWeb = app()->environment(['local', 'development'])
      || filter_var((string) env('APP_ALLOW_WEB_MIGRATE', 'false'), FILTER_VALIDATE_BOOL);
  }
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
            <img src="{{ $logoUrl }}" class="h-9 w-9 object-contain" alt="NicoReparaciones">


            <div class="leading-tight min-w-0">
              {{-- Desktop (una linea) --}}
              <div class="hidden sm:block font-black tracking-tight text-zinc-900 truncate">
                Nico<span class="text-sky-600">Reparaciones</span>
              </div>

              {{-- Mobile (dos lineas) --}}
              <div class="sm:hidden font-black tracking-tight leading-none flex flex-col gap-0">
                <span class="text-[13px] text-zinc-900 leading-none block">Nico</span>
                <span class="text-[13px] text-sky-600 leading-none block">Reparaciones</span>
              </div>


              <div class="hidden sm:block text-[11px] text-zinc-500 -mt-0.5 truncate">
                Servicio Técnico Profesional y Tienda de Electrónica
              </div>
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
          @if($emailUnverified && $has('verification.notice'))
            <a
              href="{{ route('verification.notice') }}"
              class="hidden sm:inline-flex h-9 items-center rounded-full border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-800 transition hover:bg-amber-100"
              aria-label="Correo sin verificar">
              Correo sin verificar
            </a>

            <a
              href="{{ route('verification.notice') }}"
              class="icon-btn sm:hidden text-amber-700"
              aria-label="Correo sin verificar"
              title="Correo sin verificar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 9v4"></path>
                <path d="M12 17h.01"></path>
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              </svg>
            </a>
          @endif

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
          @else

            <div class="relative">
              <button class="btn-ghost px-3 py-2" data-menu="accountMenu" aria-expanded="false" aria-label="Abrir menú de cuenta" type="button">
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
                <span class="hidden sm:inline">&#9662;</span>
              </button>


              <div id="accountMenu" class="dropdown-menu hidden">
                <div class="px-3 py-2">
                  <div class="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Estado de correo</div>
                  <span class="mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold {{ $emailStatusClasses }}">
                    {{ $emailStatusText }}
                  </span>
                </div>

                <div class="my-2 border-t border-zinc-200"></div>
              
                @if($has('account.edit'))
                  <a class="dropdown-item" href="{{ route('account.edit') }}">
                    <span class="inline-flex items-center gap-2">
                      <img src="{{ $iconSettings }}" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                      <span>Mi cuenta</span>
                    </span>
                  </a>
                @endif

                @if($emailUnverified && $has('verification.notice'))
                  <a class="dropdown-item text-amber-700" href="{{ route('verification.notice') }}">
                    <span class="inline-flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 9v4"></path>
                        <path d="M12 17h.01"></path>
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      </svg>
                      <span>Verificar correo</span>
                    </span>
                  </a>
                @endif

                @if($has('orders.index'))
                  <a class="dropdown-item" href="{{ route('orders.index') }}">
                    <span class="inline-flex items-center gap-2">
                      <img src="{{ $iconOrders }}" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                      <span>Mis pedidos</span>
                    </span>
                  </a>
                @endif

                @if($has('repairs.my.index'))
                  <a class="dropdown-item" href="{{ route('repairs.my.index') }}">
                    <span class="inline-flex items-center gap-2">
                      <img src="{{ $iconRepairs }}" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                      <span>Mis reparaciones</span>
                    </span>
                  </a>
                @endif

                @if($has('help.index'))
                  <a class="dropdown-item" href="{{ route('help.index') }}">
                    <span class="inline-flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 text-sky-700" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="9"></circle>
                        <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.8-2.5 2.1-2.5 4"></path>
                        <circle cx="12" cy="17" r="1"></circle>
                      </svg>
                      <span>Ayuda</span>
                    </span>
                  </a>
                @endif

                @if(($has('account.edit') || ($emailUnverified && $has('verification.notice')) || $has('orders.index') || $has('repairs.my.index') || $has('help.index')) && $has('logout'))
                  <div class="my-2 border-t border-zinc-200"></div>
                @endif





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
      class="fixed left-0 top-0 z-50 h-full w-[86%] max-w-xs -translate-x-full transform bg-white shadow-xl transition-transform duration-200 ease-out md:hidden flex flex-col"
      aria-label="Menú">


      <div class="h-14 px-4 flex items-center justify-between border-b border-zinc-100">
        <div class="flex items-center gap-2">
          <img src="{{ $logoUrl }}" class="h-8 w-8 rounded-xl ring-1 ring-zinc-100 bg-white object-contain" alt="NicoReparaciones">
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

      <div class="p-4 space-y-4 flex-1 overflow-y-auto">
        @php
          $userName = auth()->user()->name ?? 'Usuario';
          $userEmail = auth()->user()->email ?? '';
          $userInitial = \Illuminate\Support\Str::upper(\Illuminate\Support\Str::substr($userName, 0, 1));
          $accountHref = $has('account.edit') ? route('account.edit') : null;
        @endphp

        @if($isAuth)
          @if($accountHref)
            <a href="{{ $accountHref }}" class="card group hover:shadow-md transition" aria-label="Ver mi cuenta">
              <div class="card-body flex items-center gap-3">
                <div class="h-11 w-11 rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100 flex items-center justify-center font-black">
                  {{ $userInitial }}
                </div>

                <div class="min-w-0 flex-1">
                  <div class="font-black text-zinc-900 truncate">{{ $userName }}</div>
                  <div class="sidebar-sub truncate">{{ $userEmail }}</div>
                  <span class="mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold {{ $emailStatusClasses }}">
                    {{ $emailStatusText }}
                  </span>

                  <div class="mt-1 text-xs font-extrabold text-sky-700/80 group-hover:text-sky-700 inline-flex items-center gap-1">
                    Ver mi cuenta
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="w-4 h-4" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L10.94 10 7.23 6.29a.75.75 0 1 1 1.06-1.06l4.24 4.24c.29.29.29.77 0 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0Z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          @else
            <div class="card">
              <div class="card-body">
                <div class="font-black text-zinc-900 truncate">{{ $userName }}</div>
                <div class="sidebar-sub truncate">{{ $userEmail }}</div>
              </div>
            </div>
          @endif
        @endif


        <div class="sidebar-section space-y-2">
          <div class="sidebar-title">Navegación</div>
          <div class="sidebar-links">

            @if($has('store.index'))
              <a class="sidebar-link {{ request()->routeIs('store.index','store.category','store.product','home') ? 'active' : '' }}"
                href="{{ route('store.index') }}">
                <span class="inline-flex items-center gap-2">
                  <img src="{{ $iconStore }}" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                  <span>Tienda</span>
                </span>
              </a>
            @endif

            @if($has('repairs.lookup'))
              <a class="sidebar-link {{ request()->routeIs('repairs.lookup','repairs.lookup.post') ? 'active' : '' }}"
                href="{{ route('repairs.lookup') }}">
                <span class="inline-flex items-center gap-2">
                  <img src="{{ $iconRepairLookup }}" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                  <span>Consultar reparación</span>
                </span>
              </a>
            @endif

            @if($has('cart.index'))
              <a class="sidebar-link {{ request()->routeIs('cart.index') ? 'active' : '' }}"
                href="{{ route('cart.index') }}">
                <span class="inline-flex items-center gap-2">
                  <img src="{{ $iconCart }}" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                  <span>Carrito</span>
                </span>

                @if($cartCount > 0)
                  <span class="badge badge-sky ml-auto">{{ $cartCount }}</span>
                @endif
              </a>
            @endif

          </div>
        </div>

        <div class="sidebar-section space-y-2">
          <div class="sidebar-title">Cuenta</div>
          <div class="sidebar-links">

            @if($isAuth)

              @if($has('account.edit'))
                <a class="sidebar-link {{ request()->routeIs('account.edit') ? 'active' : '' }}"
                   href="{{ route('account.edit') }}">
                  <span class="inline-flex items-center gap-2">
                    <img src="{{ $iconSettings }}" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                    <span>Mi cuenta</span>
                  </span>
                </a>
              @endif

              @if($emailUnverified && $has('verification.notice'))
                <a class="sidebar-link {{ request()->routeIs('verification.notice') ? 'active' : '' }}"
                   href="{{ route('verification.notice') }}">
                  <span class="inline-flex items-center gap-2 text-amber-700">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 9v4"></path>
                      <path d="M12 17h.01"></path>
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    </svg>
                    <span>Verificar correo</span>
                  </span>
                </a>
              @endif

              @if($has('orders.index'))
                <a class="sidebar-link {{ request()->routeIs('orders.*') ? 'active' : '' }}"
                   href="{{ route('orders.index') }}">
                  <span class="inline-flex items-center gap-2">
                    <img src="{{ $iconOrders }}" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                    <span>Mis pedidos</span>
                  </span>
                </a>
              @endif

              @if($has('repairs.my.index'))
                <a class="sidebar-link {{ request()->routeIs('repairs.my.*') ? 'active' : '' }}"
                   href="{{ route('repairs.my.index') }}">
                  <span class="inline-flex items-center gap-2">
                    <img src="{{ $iconRepairs }}" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                    <span>Mis reparaciones</span>
                  </span>
                </a>
              @endif

              @if($has('help.index'))
                <a class="sidebar-link {{ request()->routeIs('help.index') ? 'active' : '' }}"
                   href="{{ route('help.index') }}">
                  <span class="inline-flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 text-sky-700" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9"></circle>
                      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.8-2.5 2.1-2.5 4"></path>
                      <circle cx="12" cy="17" r="1"></circle>
                    </svg>
                    <span>Ayuda</span>
                  </span>
                </a>
              @endif

              {{-- Admin (solo si corresponde) --}}
              @include('layouts.partials.sidebar_admin_section')

              <div class="my-2 border-t border-zinc-200"></div>

              @if($has('logout'))
                <form method="POST" action="{{ route('logout') }}">
                  @csrf
                  <button type="submit" class="sidebar-link text-rose-700">
                    <span class="inline-flex items-center gap-2">
                      <img src="{{ $iconLogout }}" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                      <span>Cerrar sesión</span>
                    </span>
                  </button>
                </form>
              @endif

            @else

              @if($has('help.index'))
                <a class="sidebar-link {{ request()->routeIs('help.index') ? 'active' : '' }}"
                   href="{{ route('help.index') }}">
                  <span class="inline-flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 text-sky-700" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9"></circle>
                      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.8-2.5 2.1-2.5 4"></path>
                      <circle cx="12" cy="17" r="1"></circle>
                    </svg>
                    <span>Ayuda</span>
                  </span>
                </a>
              @endif

              @if($has('login'))
                <a class="sidebar-link" href="{{ route('login') }}">
                  <span class="inline-flex items-center gap-2">
                    <img src="{{ $iconDashboard }}" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                    <span>Iniciar sesión</span>
                  </span>
                </a>
              @endif

              @if($has('register'))
                <a class="sidebar-link" href="{{ route('register') }}">
                  <span class="inline-flex items-center gap-2">
                    <img src="{{ $iconSettings }}" alt="" class="w-5 h-5" loading="lazy" decoding="async">
                    <span>Crear cuenta</span>
                  </span>
                </a>
              @endif

            @endif

          </div>
        </div>

      </div>

    </aside>

  </header>

  <main class="flex-1">
    <div class="container-page py-6">
        @hasSection('suppress_global_alerts')
          {{-- En estas vistas mostramos los mensajes dentro del card --}}
        @else
          @php
            $maintenanceResolved = session('admin_maintenance_resolved', []);
            $maintenanceRemaining = session('admin_maintenance_remaining', []);
          @endphp

          @if(is_array($maintenanceResolved) && count($maintenanceResolved) > 0)
            <div class="alert-success mb-4">
              <div class="font-black">Migraciones aplicadas: cambios resueltos</div>
              <ul class="list-disc pl-5 mt-1 space-y-1">
                @foreach($maintenanceResolved as $resolvedIssue)
                  <li>{{ $resolvedIssue }}</li>
                @endforeach
              </ul>
              @if(is_array($maintenanceRemaining) && count($maintenanceRemaining) > 0)
                <div class="mt-2 font-black">Aun pendientes:</div>
                <ul class="list-disc pl-5 mt-1 space-y-1">
                  @foreach($maintenanceRemaining as $remainingIssue)
                    <li>{{ $remainingIssue }}</li>
                  @endforeach
                </ul>
              @endif
            </div>
          @endif

          @if(is_array($adminSchemaHealth) && !($adminSchemaHealth['ok'] ?? true))
            <div class="alert-warning mb-4">
              <div class="font-black">Atencion: faltan migraciones/columnas requeridas en Admin</div>
              <ul class="list-disc pl-5 mt-1 space-y-1">
                @foreach(($adminSchemaHealth['issues'] ?? []) as $issue)
                  <li>{{ $issue }}</li>
                @endforeach
              </ul>
              @if(is_array($maintenanceResolved) && count($maintenanceResolved) > 0)
                <div class="mt-2 font-black">Resueltas en la ultima ejecucion:</div>
                <ul class="list-disc pl-5 mt-1 space-y-1">
                  @foreach($maintenanceResolved as $resolvedIssue)
                    <li>{{ $resolvedIssue }}</li>
                  @endforeach
                </ul>
              @endif
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <div class="text-xs font-bold">Ejecuta: <code>{{ $adminSchemaHealth['command'] ?? 'php artisan migrate' }}</code></div>
                @if($canRunMigrationsFromWeb && $has('admin.maintenance.migrate'))
                  <form method="POST" action="{{ route('admin.maintenance.migrate') }}">
                    @csrf
                    <button
                      type="submit"
                      class="btn-outline btn-sm h-8"
                      data-confirm="Esto ejecutara php artisan migrate. ¿Continuar?">
                      Aplicar migraciones ahora
                    </button>
                  </form>
                @endif
              </div>
            </div>
          @endif

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
        @endif



      @yield('content')
    </div>
  </main>

  <footer class="border-t border-zinc-100 bg-white">
    <div class="container-page py-6">
      <div class="grid gap-6 md:grid-cols-3">
        <div>
          <div class="flex items-center gap-2">
            <img src="{{ $logoUrl }}" class="h-9 w-9 rounded-xl ring-1 ring-zinc-100 bg-white object-contain" alt="NicoReparaciones">
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
              @if($has('help.index')) <a href="{{ route('help.index') }}">Ayuda</a> @endif
              @if($has('logout'))
                <form method="POST" action="{{ route('logout') }}">
                  @csrf
                  <button class="text-left text-rose-700 hover:text-rose-800 font-bold">Cerrar sesión</button>
                </form>
              @endif
            @else
              @if($has('help.index')) <a href="{{ route('help.index') }}">Ayuda</a> @endif
              @if($has('login')) <a href="{{ route('login') }}">Ingresar</a> @endif
            @endif

          </div>
        </div>
      </div>

      <div class="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-zinc-500">
        <div>&copy; {{ date('Y') }} NicoReparaciones</div>
        <div class="text-zinc-400">Hecho con Laravel</div>
      </div>
    </div>
  </footer>

  {{-- Bottom-sheet "Agregado al carrito" --}}
  @if(is_array($cartAdded))
    <div id="cartAddedOverlay"
         class="fixed inset-0 z-[60] opacity-0 pointer-events-none transition-opacity duration-300 ease-out"
         data-cart-added="1"
         data-cart-added-name="{{ $cartAddedName }}"
         aria-hidden="true">

      <div class="absolute inset-0 bg-zinc-950/40" data-cart-added-close></div>

      <div id="cartAddedSheet"
           class="absolute bottom-0 left-0 right-0 mx-auto max-w-xl translate-y-full transition-transform duration-300 ease-out will-change-transform">
        <div class="rounded-t-3xl bg-white p-4 shadow-2xl">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-base font-black" id="cartAddedTitle">Agregado al carrito</div>
              <div class="mt-0.5 text-sm text-zinc-600" id="cartAddedName">{{ $cartAddedName !== '' ? $cartAddedName : 'Producto' }}</div>
            </div>

            <button type="button" class="icon-btn" data-cart-added-close aria-label="Cerrar">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="mt-4 flex gap-2">
            <a href="{{ route('cart.index') }}" class="btn-primary flex-1 justify-center">Ver carrito</a>
            <button type="button" class="btn-outline flex-1 justify-center" data-cart-added-close>Seguir</button>
          </div>
        </div>
      </div>
    </div>
  @endif
</body>
</html>

