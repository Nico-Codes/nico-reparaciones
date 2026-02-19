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
    $requestHost = request()->getHost();
    $isLocalHost = in_array($requestHost, ['127.0.0.1', 'localhost'], true);

    // Si la web se abre por tunel (ngrok/cloudflare/etc), no usamos Vite hot
    // porque el cliente remoto no puede alcanzar localhost:5173.
    if ($useHot && !$isLocalHost && $useManifest) {
      $useHot = false;
    }

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

  $desktopLinks = [];
  if ($has('store.index')) {
    $desktopLinks[] = ['label' => 'Tienda', 'href' => route('store.index'), 'active' => request()->routeIs('store.index', 'store.category', 'store.product', 'home')];
  }
  if ($has('repairs.lookup')) {
    $desktopLinks[] = ['label' => 'Reparacion', 'href' => route('repairs.lookup'), 'active' => request()->routeIs('repairs.lookup', 'repairs.lookup.post')];
  }
  if ($isAdmin && $has('admin.dashboard')) {
    $desktopLinks[] = ['label' => 'Admin', 'href' => route('admin.dashboard'), 'active' => request()->is('admin*')];
  }

  $adminLinks = [];
  $pushAdmin = function (string $routeName, string $label, string $icon, bool $active = false) use (&$adminLinks, $has) {
    if (!$has($routeName)) return;
    $adminLinks[] = ['label' => $label, 'href' => route($routeName), 'icon' => $icon, 'active' => $active];
  };
  $pushAdmin('admin.dashboard', 'Panel', $iconDashboard, request()->routeIs('admin.dashboard'));
  $pushAdmin('admin.repairs.index', 'Reparaciones', $iconRepairs, request()->routeIs('admin.repairs.*'));
  $pushAdmin('admin.orders.index', 'Pedidos', $iconOrders, request()->routeIs('admin.orders.*'));
  $pushAdmin('admin.quick_sales.index', 'Venta rapida', $iconOrders, request()->routeIs('admin.quick_sales.*'));
  $pushAdmin('admin.ledger.index', 'Contabilidad', $iconSettings, request()->routeIs('admin.ledger.*'));
  $pushAdmin('admin.warranty_incidents.index', 'Garantias', $iconSettings, request()->routeIs('admin.warranty_incidents.*'));
  $pushAdmin('admin.products.index', 'Productos', $iconStore, request()->routeIs('admin.products.*'));
  $pushAdmin('admin.suppliers.index', 'Proveedores', $iconSettings, request()->routeIs('admin.suppliers.*'));
  $pushAdmin('admin.calculations.index', 'Calculos', $iconSettings, request()->routeIs('admin.calculations.*') || request()->routeIs('admin.product_pricing_rules.*'));
  $pushAdmin('admin.pricing.index', 'Precios', $iconSettings, request()->routeIs('admin.pricing.*') || request()->routeIs('admin.repairTypes.*') || request()->routeIs('admin.modelGroups.*'));
  $pushAdmin('admin.deviceTypes.index', 'Tipos de dispositivo', $iconSettings, request()->routeIs('admin.deviceTypes.*'));
  $pushAdmin('admin.deviceCatalog.index', 'Catalogo de dispositivos', $iconSettings, request()->routeIs('admin.deviceCatalog.*'));
  $pushAdmin('admin.settings.index', 'Configuracion', $iconSettings, request()->routeIs('admin.settings.*'));
  $pushAdmin('admin.settings.assets.index', 'Identidad visual', $iconSettings, request()->routeIs('admin.settings.assets.*'));
  $pushAdmin('admin.settings.mail_templates.index', 'Plantillas de correo', $iconSettings, request()->routeIs('admin.settings.mail_templates.*'));
  $pushAdmin('admin.two_factor.settings', 'Seguridad 2FA', $iconSettings, request()->routeIs('admin.two_factor.*'));
  $pushAdmin('admin.users.index', 'Usuarios', $iconSettings, request()->routeIs('admin.users.*'));

  $accountLinks = [];
  if ($has('account.edit')) $accountLinks[] = ['label' => 'Mi cuenta', 'href' => route('account.edit'), 'icon' => $iconSettings];
  if ($emailUnverified && $has('verification.notice')) $accountLinks[] = ['label' => 'Verificar correo', 'href' => route('verification.notice'), 'icon' => null, 'highlight' => 'warning'];
  if ($has('orders.index')) $accountLinks[] = ['label' => 'Mis pedidos', 'href' => route('orders.index'), 'icon' => $iconOrders];
  if ($has('repairs.my.index')) $accountLinks[] = ['label' => 'Mis reparaciones', 'href' => route('repairs.my.index'), 'icon' => $iconRepairs];
  if ($has('help.index')) $accountLinks[] = ['label' => 'Ayuda', 'href' => route('help.index'), 'icon' => null];

  $sidebarNavLinks = [];
  if ($has('store.index')) $sidebarNavLinks[] = ['label' => 'Tienda', 'href' => route('store.index'), 'icon' => $iconStore, 'active' => request()->routeIs('store.index', 'store.category', 'store.product', 'home')];
  if ($has('repairs.lookup')) $sidebarNavLinks[] = ['label' => 'Consultar reparacion', 'href' => route('repairs.lookup'), 'icon' => $iconRepairLookup, 'active' => request()->routeIs('repairs.lookup', 'repairs.lookup.post')];
  if ($has('cart.index')) $sidebarNavLinks[] = ['label' => 'Carrito', 'href' => route('cart.index'), 'icon' => $iconCart, 'active' => request()->routeIs('cart.index')];

  $sidebarAccountLinks = [];
  if ($isAuth) {
    if ($has('account.edit')) $sidebarAccountLinks[] = ['label' => 'Mi cuenta', 'href' => route('account.edit'), 'icon' => $iconSettings, 'active' => request()->routeIs('account.edit')];
    if ($emailUnverified && $has('verification.notice')) $sidebarAccountLinks[] = ['label' => 'Verificar correo', 'href' => route('verification.notice'), 'icon' => null, 'active' => request()->routeIs('verification.notice'), 'highlight' => 'warning'];
    if ($has('orders.index')) $sidebarAccountLinks[] = ['label' => 'Mis pedidos', 'href' => route('orders.index'), 'icon' => $iconOrders, 'active' => request()->routeIs('orders.*')];
    if ($has('repairs.my.index')) $sidebarAccountLinks[] = ['label' => 'Mis reparaciones', 'href' => route('repairs.my.index'), 'icon' => $iconRepairs, 'active' => request()->routeIs('repairs.my.*')];
    if ($has('help.index')) $sidebarAccountLinks[] = ['label' => 'Ayuda', 'href' => route('help.index'), 'icon' => null, 'active' => request()->routeIs('help.index')];
  } else {
    if ($has('help.index')) $sidebarAccountLinks[] = ['label' => 'Ayuda', 'href' => route('help.index'), 'icon' => null, 'active' => request()->routeIs('help.index')];
  }

  $shellHeaderData = [
    'brandHref' => $brandHref,
    'logoUrl' => $logoUrl,
    'isAuth' => $isAuth,
    'isAdmin' => $isAdmin,
    'emailUnverified' => $emailUnverified,
    'emailStatusText' => (string)($emailStatusText ?? ''),
    'userName' => (string)($authUser->name ?? ''),
    'userEmail' => (string)($authUser->email ?? ''),
    'userInitial' => (string)\Illuminate\Support\Str::upper(\Illuminate\Support\Str::substr((string)($authUser->name ?? 'U'), 0, 1)),
    'cartCount' => (int)$cartCount,
    'urls' => [
      'cart' => $has('cart.index') ? route('cart.index') : null,
      'login' => $has('login') ? route('login') : null,
      'register' => $has('register') ? route('register') : null,
      'logout' => $has('logout') ? route('logout') : null,
      'verificationNotice' => $has('verification.notice') ? route('verification.notice') : null,
    ],
    'desktopLinks' => $desktopLinks,
    'accountLinks' => $accountLinks,
    'adminLinks' => $adminLinks,
    'sidebarNavLinks' => $sidebarNavLinks,
    'sidebarAccountLinks' => $sidebarAccountLinks,
    'csrfToken' => csrf_token(),
  ];
@endphp

<body class="min-h-screen flex flex-col">  <div
    data-react-shell-header
    data-shell='@json($shellHeaderData, JSON_HEX_TAG|JSON_HEX_APOS|JSON_HEX_AMP|JSON_HEX_QUOT)'>
    <header class="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-sm">
      <div class="container-page h-14 flex items-center justify-between gap-3">
        <a href="{{ $brandHref }}" class="flex items-center gap-2 min-w-0">
          <img src="{{ $logoUrl }}" class="h-9 w-9 object-contain" alt="NicoReparaciones" />
          <div class="font-black tracking-tight text-zinc-900 truncate">Nico<span class="text-sky-600">Reparaciones</span></div>
        </a>
        @if($has('cart.index'))
          <a href="{{ route('cart.index') }}" class="btn-ghost h-9 px-3">Carrito</a>
        @endif
      </div>
    </header>
    @if($emailUnverified)
      <span class="hidden">Correo sin verificar</span>
      <span class="hidden">{{ $emailStatusText }}</span>
      @if($has('verification.notice'))
        <a class="hidden" href="{{ route('verification.notice') }}">Verificar correo</a>
      @endif
    @endif
  </div>

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
            @if($has('repairs.lookup')) <a href="{{ route('repairs.lookup') }}">Consultar reparacion</a> @endif
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
                  <button class="text-left text-rose-700 hover:text-rose-800 font-bold">Cerrar sesion</button>
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
  <div data-react-global-form-enhancements></div>
  <div data-react-product-qty-enhancements></div>
  <div data-react-add-to-cart-enhancements></div>
  <div data-react-copy-actions-enhancements></div>
  <div data-react-admin-orders-status-enhancements></div>
  <div data-react-store-visual-enhancements></div>
  <div data-react-global-ui-enhancements></div>
  <div data-react-cart-checkout-enhancements></div>
</body>
</html>


