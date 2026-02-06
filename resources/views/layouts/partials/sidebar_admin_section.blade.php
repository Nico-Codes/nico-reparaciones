@php
  $adminLinks = [
    [
      'route' => 'admin.dashboard',
      'label' => 'Dashboard',
      'icon'  => '/icons/dashboard.svg',
      'active'=> request()->routeIs('admin.dashboard'),
    ],
    [
      'route' => 'admin.repairs.index',
      'label' => 'Reparaciones',
      'icon'  => '/icons/mis-reparaciones.svg',
      'active'=> request()->routeIs('admin.repairs.*'),
    ],
    [
      'route' => 'admin.orders.index',
      'label' => 'Pedidos',
      'icon'  => '/icons/mis-pedidos.svg',
      'active'=> request()->routeIs('admin.orders.*'),
    ],
    [
      'route' => 'admin.products.index',
      'label' => 'Productos',
      'icon'  => '/icons/tienda.svg',
      'active'=> request()->routeIs('admin.products.*'),
    ],
    [
      'route' => 'admin.pricing.index',
      'label' => 'Precios',
      'icon'  => '/icons/settings.svg',
      'active'=> request()->routeIs('admin.pricing.*')
                  || request()->routeIs('admin.repairTypes.*')
                  || request()->routeIs('admin.modelGroups.*'),
    ],
    [
      'route' => 'admin.deviceTypes.index',
      'label' => 'Tipos de dispositivo',
      'icon'  => '/icons/settings.svg',
      'active'=> request()->routeIs('admin.deviceTypes.*'),
    ],
    [
      'route' => 'admin.deviceCatalog.index',
      'label' => 'Catálogo dispositivos',
      'icon'  => '/icons/settings.svg',
      'active'=> request()->routeIs('admin.deviceCatalog.*'),
    ],
    [
      'route' => 'admin.settings.index',
      'label' => 'Ajustes',
      'icon'  => '/icons/settings.svg',
      'active'=> request()->routeIs('admin.settings.*'),
    ],
    [
      'route' => 'admin.users.index',
      'label' => 'Usuarios',
      'icon'  => '/icons/settings.svg',
      'active'=> request()->routeIs('admin.users.*'),
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
      <img src="/icons/dashboard.svg" alt="" class="w-5 h-5" loading="lazy" decoding="async">
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
