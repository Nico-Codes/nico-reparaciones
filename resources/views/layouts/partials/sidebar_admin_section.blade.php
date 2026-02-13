@php
  $adminLinks = [
    [
      'route' => 'admin.dashboard',
      'label' => 'Panel',
      'icon' => \App\Support\BrandAssets::url('icon_dashboard'),
      'active' => request()->routeIs('admin.dashboard'),
    ],
    [
      'route' => 'admin.repairs.index',
      'label' => 'Reparaciones',
      'icon' => \App\Support\BrandAssets::url('icon_repairs'),
      'active' => request()->routeIs('admin.repairs.*'),
    ],
    [
      'route' => 'admin.orders.index',
      'label' => 'Pedidos',
      'icon' => \App\Support\BrandAssets::url('icon_orders'),
      'active' => request()->routeIs('admin.orders.*'),
    ],
    [
      'route' => 'admin.quick_sales.index',
      'label' => 'Venta rapida',
      'icon' => \App\Support\BrandAssets::url('icon_orders'),
      'active' => request()->routeIs('admin.quick_sales.*'),
    ],
    [
      'route' => 'admin.ledger.index',
      'label' => 'Contabilidad',
      'icon' => \App\Support\BrandAssets::url('icon_settings'),
      'active' => request()->routeIs('admin.ledger.*'),
    ],
    [
      'route' => 'admin.warranty_incidents.index',
      'label' => 'Garantias',
      'icon' => \App\Support\BrandAssets::url('icon_settings'),
      'active' => request()->routeIs('admin.warranty_incidents.*'),
    ],
    [
      'route' => 'admin.products.index',
      'label' => 'Productos',
      'icon' => \App\Support\BrandAssets::url('icon_store'),
      'active' => request()->routeIs('admin.products.*'),
    ],
    [
      'route' => 'admin.suppliers.index',
      'label' => 'Proveedores',
      'icon' => \App\Support\BrandAssets::url('icon_settings'),
      'active' => request()->routeIs('admin.suppliers.*'),
    ],
    [
      'route' => 'admin.calculations.index',
      'label' => 'Calculos',
      'icon' => \App\Support\BrandAssets::url('icon_settings'),
      'active' => request()->routeIs('admin.calculations.*')
        || request()->routeIs('admin.product_pricing_rules.*')
        || request()->routeIs('admin.pricing.*')
        || request()->routeIs('admin.repairTypes.*')
        || request()->routeIs('admin.modelGroups.*'),
    ],
    [
      'route' => 'admin.pricing.index',
      'label' => 'Precios',
      'icon' => \App\Support\BrandAssets::url('icon_settings'),
      'active' => request()->routeIs('admin.pricing.*')
        || request()->routeIs('admin.repairTypes.*')
        || request()->routeIs('admin.modelGroups.*')
        || request()->routeIs('admin.product_pricing_rules.*'),
    ],
    [
      'route' => 'admin.deviceTypes.index',
      'label' => 'Tipos de dispositivo',
      'icon' => \App\Support\BrandAssets::url('icon_settings'),
      'active' => request()->routeIs('admin.deviceTypes.*'),
    ],
    [
      'route' => 'admin.deviceCatalog.index',
      'label' => 'Catálogo de dispositivos',
      'icon' => \App\Support\BrandAssets::url('icon_settings'),
      'active' => request()->routeIs('admin.deviceCatalog.*'),
    ],
    [
      'route' => 'admin.settings.index',
      'label' => 'Configuración',
      'icon' => \App\Support\BrandAssets::url('icon_settings'),
      'active' => request()->routeIs('admin.settings.*'),
    ],
    [
      'route' => 'admin.settings.assets.index',
      'label' => 'Identidad visual',
      'icon' => \App\Support\BrandAssets::url('icon_settings'),
      'active' => request()->routeIs('admin.settings.assets.*'),
    ],
    [
      'route' => 'admin.settings.mail_templates.index',
      'label' => 'Plantillas de correo',
      'icon' => \App\Support\BrandAssets::url('icon_settings'),
      'active' => request()->routeIs('admin.settings.mail_templates.*'),
    ],
    [
      'route' => 'admin.two_factor.settings',
      'label' => 'Seguridad 2FA',
      'icon' => \App\Support\BrandAssets::url('icon_settings'),
      'active' => request()->routeIs('admin.two_factor.*'),
    ],
    [
      'route' => 'admin.users.index',
      'label' => 'Usuarios',
      'icon' => \App\Support\BrandAssets::url('icon_settings'),
      'active' => request()->routeIs('admin.users.*'),
    ],
  ];

  $hasAnyAdmin = false;
  foreach ($adminLinks as $l) {
    if ($has($l['route'])) { $hasAnyAdmin = true; break; }
  }

  $open = request()->is('admin*');
@endphp

@if($isAdmin && $hasAnyAdmin)
  <button
    type="button"
    class="sidebar-link flex items-center justify-between gap-2 {{ $open ? 'active' : '' }}"
    data-toggle-collapse="sidebar_admin_section"
    data-toggle-collapse-static
    data-toggle-collapse-no-store
    aria-expanded="{{ $open ? 'true' : 'false' }}"
  >
    <span class="inline-flex items-center gap-2">
      <img src="{{ \App\Support\BrandAssets::url('icon_dashboard') }}" alt="" class="w-5 h-5" loading="lazy" decoding="async">
      <span>Admin</span>
    </span>

    <svg data-collapse-chevron xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
      class="w-4 h-4 text-zinc-400 transition-transform {{ $open ? 'rotate-180' : '' }}">
      <path fill="currentColor" d="M5.7 7.5a1 1 0 0 1 1.4 0L10 10.4l2.9-2.9a1 1 0 1 1 1.4 1.4l-3.6 3.6a1 1 0 0 1-1.4 0L5.7 8.9a1 1 0 0 1 0-1.4Z"/>
    </svg>
  </button>

  <div class="{{ $open ? '' : 'hidden' }}" data-collapse="sidebar_admin_section">
    <div class="ml-2 pl-2 border-l border-zinc-200 grid gap-1">
      @foreach($adminLinks as $l)
        @if($has($l['route']))
          <a class="sidebar-link font-semibold text-zinc-700 {{ $l['active'] ? 'active' : '' }}"
             href="{{ route($l['route']) }}">
            <span class="inline-flex items-center gap-2">
              <img src="{{ $l['icon'] }}" alt="" class="w-5 h-5" loading="lazy" decoding="async">
              <span>{{ $l['label'] }}</span>
            </span>
          </a>
        @endif
      @endforeach
    </div>
  </div>
@endif
