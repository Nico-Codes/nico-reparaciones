@php
  $adminLinks = [
    ['route' => 'admin.dashboard',        'label' => 'Dashboard'],
    ['route' => 'admin.repairs.index',    'label' => 'Reparaciones'],
    ['route' => 'admin.orders.index',     'label' => 'Pedidos'],
    ['route' => 'admin.products.index',   'label' => 'Productos'],
    ['route' => 'admin.pricing.index',    'label' => 'Precios'],
    ['route' => 'admin.deviceTypes.index','label' => 'Tipos de dispositivo'],
    ['route' => 'admin.deviceCatalog.index','label' => 'Catálogo dispositivos'],
    ['route' => 'admin.settings.index',   'label' => 'Ajustes'],
    ['route' => 'admin.users.index',      'label' => 'Usuarios'],
  ];

  $hasAnyAdmin = false;
  foreach ($adminLinks as $l) {
    if ($has($l['route'])) { $hasAnyAdmin = true; break; }
  }
@endphp

@if($isAdmin && $hasAnyAdmin)
  <div class="my-2 border-t border-zinc-200"></div>

  <button
    type="button"
    class="dropdown-item w-full text-left flex items-center justify-between gap-2"
    data-toggle-collapse="account_admin_section"
    data-toggle-collapse-static
    data-toggle-collapse-no-store
    aria-expanded="false"
  >
    <span class="inline-flex items-center gap-2">
      <img src="/icons/dashboard.svg" alt="" class="w-5 h-5" loading="lazy" decoding="async">
      <span>Admin</span>
    </span>

    <svg data-collapse-chevron xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
      class="w-4 h-4 text-zinc-400 transition-transform">
      <path fill="currentColor" d="M5.7 7.5a1 1 0 0 1 1.4 0L10 10.4l2.9-2.9a1 1 0 1 1 1.4 1.4l-3.6 3.6a1 1 0 0 1-1.4 0L5.7 8.9a1 1 0 0 1 0-1.4Z"/>
    </svg>
  </button>

  <div class="mt-1 hidden" data-collapse="account_admin_section">
    <div class="ml-3 pl-3 border-l border-zinc-200 space-y-1">
      @foreach($adminLinks as $l)
        @if($has($l['route']))
          <a class="dropdown-item" href="{{ route($l['route']) }}">{{ $l['label'] }}</a>
        @endif
      @endforeach
    </div>
  </div>
@endif
