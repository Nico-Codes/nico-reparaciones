<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>@yield('title', config('app.name', 'NicoReparaciones'))</title>

  @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body class="min-h-screen flex flex-col">
@php
  $isAuth  = auth()->check();
  $isAdmin = $isAuth && (auth()->user()->role ?? 'user') === 'admin';
  $brandUrl = $isAdmin ? route('admin.dashboard') : route('store.index');
@endphp

<header class="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-zinc-100">
  <div class="container-page">
    <div class="h-14 flex items-center justify-between gap-3">
      {{-- Brand --}}
      <a href="{{ $brandUrl }}" class="flex items-center gap-3 no-underline">
        <img src="{{ asset('brand/logo.png') }}"
             onerror="this.style.display='none'"
             alt="NicoReparaciones"
             class="h-9 w-9 rounded-xl object-contain bg-white border border-zinc-200">
        <div class="leading-tight">
          <div class="text-sm font-extrabold text-zinc-900">
            {{ config('app.name', 'NicoReparaciones') }}
            @if($isAdmin)
              <span class="ml-1 text-xs font-semibold text-zinc-500">(Admin)</span>
            @endif
          </div>
          <div class="text-[11px] text-zinc-500">Tienda + Reparaciones</div>
        </div>
      </a>

      {{-- Mobile button --}}
      <button class="md:hidden btn-ghost" data-toggle="mobile-menu" aria-label="Menú">
        ☰
      </button>

      {{-- Desktop nav --}}
      <nav class="hidden md:flex items-center gap-2">
        @if($isAdmin)
          <a class="btn-ghost" href="{{ route('admin.dashboard') }}">Panel</a>
          <a class="btn-ghost" href="{{ route('admin.orders.index') }}">Pedidos</a>
          <a class="btn-ghost" href="{{ route('admin.repairs.index') }}">Reparaciones</a>
          <a class="btn-primary" href="{{ route('admin.repairs.create') }}">+ Nueva reparación</a>
        @else
          <a class="btn-ghost" href="{{ route('store.index') }}">Tienda</a>
          <a class="btn-ghost" href="{{ route('cart.index') }}">Carrito</a>

          @if($isAuth)
            <a class="btn-ghost" href="{{ route('orders.index') }}">Mis pedidos</a>
            <a class="btn-ghost" href="{{ route('repairs.my.index') }}">Mis reparaciones</a>
          @endif
        @endif
      </nav>

      {{-- User --}}
      <div class="hidden md:flex items-center gap-2">
        @if(!$isAuth)
          <a class="btn-outline" href="{{ route('login') }}">Login</a>
          <a class="btn-primary" href="{{ route('register') }}">Registro</a>
        @else
          <details class="relative">
            <summary class="list-none cursor-pointer">
              <div class="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 hover:bg-zinc-50">
                <div class="h-7 w-7 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-700">
                  {{ strtoupper(substr(auth()->user()->name ?? 'U', 0, 1)) }}
                </div>
                <span class="text-sm font-semibold text-zinc-800">{{ auth()->user()->name }}</span>
              </div>
            </summary>

            <div class="absolute right-0 mt-2 w-64 rounded-2xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
              <div class="px-4 py-3 border-b border-zinc-100">
                <div class="text-sm font-semibold text-zinc-900">Mi cuenta</div>
                <div class="text-xs text-zinc-500">{{ auth()->user()->email }}</div>
              </div>

              <div class="p-2">
                @if($isAdmin)
                  <a class="block rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50" href="{{ route('admin.dashboard') }}">Panel Admin</a>
                  <a class="block rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50" href="{{ route('admin.orders.index') }}">Pedidos</a>
                  <a class="block rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50" href="{{ route('admin.repairs.index') }}">Reparaciones</a>
                @else
                  <a class="block rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50" href="{{ route('orders.index') }}">Mis pedidos</a>
                  <a class="block rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50" href="{{ route('repairs.my.index') }}">Mis reparaciones</a>
                @endif

                <form method="POST" action="{{ route('logout') }}" class="mt-2">
                  @csrf
                  <button type="submit" class="w-full btn-outline">Cerrar sesión</button>
                </form>
              </div>
            </div>
          </details>
        @endif
      </div>
    </div>

    {{-- Mobile menu --}}
    <div id="mobileMenu" class="md:hidden hidden pb-4">
      <div class="card">
        <div class="card-body space-y-2">
          @if($isAdmin)
            <a class="btn-outline w-full" href="{{ route('admin.dashboard') }}">Panel</a>
            <a class="btn-outline w-full" href="{{ route('admin.orders.index') }}">Pedidos</a>
            <a class="btn-outline w-full" href="{{ route('admin.repairs.index') }}">Reparaciones</a>
            <a class="btn-primary w-full" href="{{ route('admin.repairs.create') }}">+ Nueva reparación</a>
          @else
            <a class="btn-outline w-full" href="{{ route('store.index') }}">Tienda</a>
            <a class="btn-outline w-full" href="{{ route('cart.index') }}">Carrito</a>

            @if(!$isAuth)
              <a class="btn-outline w-full" href="{{ route('login') }}">Login</a>
              <a class="btn-primary w-full" href="{{ route('register') }}">Registro</a>
            @else
              <a class="btn-outline w-full" href="{{ route('orders.index') }}">Mis pedidos</a>
              <a class="btn-outline w-full" href="{{ route('repairs.my.index') }}">Mis reparaciones</a>
              <form method="POST" action="{{ route('logout') }}">
                @csrf
                <button type="submit" class="btn-outline w-full">Cerrar sesión</button>
              </form>
            @endif
          @endif
        </div>
      </div>
    </div>

  </div>
</header>

<main class="flex-1">
  @yield('content')
</main>

<footer class="mt-10 border-t border-zinc-100 bg-white">
  <div class="container-page py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
    <div>
      <div class="text-sm font-extrabold text-zinc-900">NicoReparaciones</div>
      <div class="mt-1 text-sm text-zinc-500">Tienda online + seguimiento de reparaciones.</div>
    </div>
    <div>
      <div class="text-sm font-semibold text-zinc-900">Accesos</div>
      <div class="mt-2 space-y-2 text-sm">
        <a class="block" href="{{ route('store.index') }}">Tienda</a>
        <a class="block" href="{{ route('cart.index') }}">Carrito</a>
        <a class="block" href="{{ route('repairs.lookup') }}">Consultar reparación</a>
      </div>
    </div>
    <div>
      <div class="text-sm font-semibold text-zinc-900">Soporte</div>
      <div class="mt-2 text-sm text-zinc-500">
        Retiro en local · WhatsApp · Garantía según reparación.
      </div>
    </div>
  </div>
</footer>

<script>
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-toggle="mobile-menu"]');
  if (!btn) return;
  const menu = document.getElementById('mobileMenu');
  if (!menu) return;
  menu.classList.toggle('hidden');
});
</script>
</body>
</html>
