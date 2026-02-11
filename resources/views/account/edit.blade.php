@extends('layouts.app')

@section('title', 'Mi cuenta')
@section('suppress_global_alerts', '1')

@section('content')
  <div class="page-head">
    <div class="page-title">Mi cuenta</div>
    <div class="page-subtitle">Actualiza tus datos. Se usan para asociar pedidos y contactarte.</div>
  </div>

  @php
    $emailIsVerified = !is_null($user->email_verified_at);
  @endphp

  <div class="card mb-4 max-w-2xl">
    <div class="card-head items-start">
      <div class="font-black">Estado del correo</div>
      @if($emailIsVerified)
        <span class="badge-sky shrink-0">Verificado</span>
      @else
        <span class="badge-zinc shrink-0">Pendiente</span>
      @endif
    </div>

    <div class="card-body p-4 sm:p-5">
      @if (session('status') === 'verification-link-sent')
        <div class="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Te enviamos un nuevo correo de verificacion.
        </div>
      @endif

      @if($emailIsVerified)
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Tu correo <span class="font-bold">{{ $user->email }}</span> ya esta verificado.
        </div>
      @else
        <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Tu correo <span class="font-bold">{{ $user->email }}</span> aun no esta verificado. Necesitas verificarlo para comprar y ver tus pedidos.
        </div>

        <form method="POST" action="{{ route('verification.send') }}" class="mt-3">
          @csrf
          <button type="submit" class="btn-primary h-11 w-full sm:w-auto">Reenviar correo de verificacion</button>
        </form>
      @endif
    </div>
  </div>

  <div class="mb-4 grid max-w-2xl grid-cols-2 gap-2">
    <a href="#profile" class="btn-ghost h-11 w-full justify-center">Perfil</a>
    <a href="#security" class="btn-ghost h-11 w-full justify-center">Seguridad</a>
  </div>

  <div class="card max-w-2xl" id="profile">
    <div class="card-head items-start">
      <div class="font-black">Datos del perfil</div>
      <span class="badge-sky shrink-0">Obligatorio para comprar</span>
    </div>

    <div class="card-body p-4 sm:p-5">
      @if (session('success'))
        <div class="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {{ session('success') }}
        </div>
      @endif

      @php
        $missingLast  = !$user->last_name || trim($user->last_name) === '';
        $missingPhone = !$user->phone || trim($user->phone) === '';
      @endphp

      @if($missingLast || $missingPhone)
        <div class="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div class="font-bold">Completa tus datos</div>
          <div class="mt-1">
            Te falta:
            <span class="font-extrabold">
              {{ $missingLast ? 'apellido' : '' }}{{ ($missingLast && $missingPhone) ? ' y ' : '' }}{{ $missingPhone ? 'teléfono' : '' }}
            </span>.
          </div>
          <div class="mt-1">Es necesario para asociar compras y recibir avisos por WhatsApp.</div>
        </div>
      @endif

      @if($errors->has('profile'))
        <div class="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {{ $errors->first('profile') }}
        </div>
      @endif

      @if($errors->hasAny(['name','last_name','phone','email']))
        <div class="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          Revisa los campos marcados.
        </div>
      @endif

      <form method="POST" action="{{ route('account.update') }}" class="grid gap-4">
        @csrf
        @method('PUT')

        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label for="name">Nombre</label>
            <input
              id="name"
              name="name"
              value="{{ old('name', $user->name) }}"
              required
              autocomplete="given-name"
              class="h-11 text-base sm:text-sm @error('name') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
            >
            @error('name')
              <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
            @enderror
          </div>

          <div>
            <label for="last_name">Apellido</label>
            <input
              id="last_name"
              name="last_name"
              value="{{ old('last_name', $user->last_name) }}"
              required
              autocomplete="family-name"
              class="h-11 text-base sm:text-sm @error('last_name') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
            >
            @error('last_name')
              <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
            @enderror
          </div>

          <div>
            <label for="phone">Teléfono / WhatsApp</label>
            <input
              id="phone"
              name="phone"
              value="{{ old('phone', $user->phone) }}"
              placeholder="Ej: 341 555-0000"
              required
              autocomplete="tel"
              class="h-11 text-base sm:text-sm @error('phone') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
            >
            @error('phone')
              <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
            @enderror

            <div class="muted mt-1 text-xs">Lo usamos para WhatsApp y para asociar el pedido.</div>
          </div>

          <div>
            <label for="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value="{{ old('email', $user->email) }}"
              required
              autocomplete="email"
              class="h-11 text-base sm:text-sm @error('email') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
            >
            @error('email')
              <div class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</div>
            @enderror
          </div>
        </div>

        <div class="grid gap-2 sm:flex sm:flex-row">
          <button class="btn-primary h-11 w-full sm:w-auto" type="submit">Guardar cambios</button>
          <a class="btn-outline h-11 w-full sm:w-auto" href="{{ route('orders.index') }}">Mis pedidos</a>
        </div>
      </form>
    </div>
  </div>

  <div class="card mt-4 max-w-2xl" id="security">
    <div class="card-head items-start">
      <div class="font-black">Seguridad</div>
      <span class="badge-zinc shrink-0">Contraseña</span>
    </div>

    <div class="card-body p-4 sm:p-5">
      @if (session('password_success'))
        <div class="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {{ session('password_success') }}
        </div>
      @endif

      @if($errors->hasAny(['current_password','password','password_confirmation']))
        <div class="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          Revisa los campos marcados.
        </div>
      @endif

      <form method="POST" action="{{ route('account.password') }}" class="grid gap-4">
        @csrf
        @method('PUT')

        @php
          $isGoogle = (bool) (auth()->user()->google_id ?? false);
        @endphp

        @if(!$isGoogle)
          <div>
            <label for="current_password">Contraseña actual</label>
            <input
              id="current_password"
              name="current_password"
              type="password"
              required
              autocomplete="current-password"
              class="mt-1 h-11 w-full rounded-2xl border bg-white px-3 py-2 text-base sm:text-sm outline-none focus:ring-2 border-zinc-200 focus:border-sky-300 focus:ring-sky-100 @error('current_password') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
              placeholder="********"
            >
            @error('current_password')
              <p class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</p>
            @enderror
          </div>
        @else
          <div class="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            Estás ingresando con Google. Puedes establecer una contraseña nueva sin ingresar la actual.
          </div>
        @endif

        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label for="password">Nueva contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autocomplete="new-password"
              class="mt-1 h-11 w-full rounded-2xl border bg-white px-3 py-2 text-base sm:text-sm outline-none focus:ring-2 border-zinc-200 focus:border-sky-300 focus:ring-sky-100 @error('password') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
              placeholder="********"
            >
            @error('password')
              <p class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</p>
            @enderror

            <div class="muted mt-1 text-xs">Minimo 8 caracteres.</div>
          </div>

          <div>
            <label for="password_confirmation">Repetir nueva contraseña</label>
            <input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              required
              autocomplete="new-password"
              class="mt-1 h-11 w-full rounded-2xl border bg-white px-3 py-2 text-base sm:text-sm outline-none focus:ring-2 border-zinc-200 focus:border-sky-300 focus:ring-sky-100 @error('password_confirmation') border-rose-300 focus:border-rose-300 focus:ring-rose-100 @enderror"
              placeholder="********"
            >
            @error('password_confirmation')
              <p class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</p>
            @enderror
          </div>
        </div>

        <div class="grid gap-2 sm:flex sm:flex-row">
          <button class="btn-primary h-11 w-full sm:w-auto" type="submit" data-testid="account-password-submit">Actualizar contraseña</button>
        </div>
      </form>
    </div>
  </div>
@endsection
