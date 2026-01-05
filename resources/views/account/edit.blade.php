@extends('layouts.app')

@section('title', 'Mi cuenta')

@section('content')
  <div class="page-head">
    <div class="page-title">Mi cuenta</div>
    <div class="page-subtitle">Actualizá tus datos. Se usan para asociar tus pedidos y contactarte.</div>
  </div>

  <div class="card max-w-2xl">
    <div class="card-head">
      <div class="font-black">Datos del perfil</div>
      <span class="badge-sky">Obligatorio para comprar</span>
    </div>

    <div class="card-body">
      <form method="POST" action="{{ route('account.update') }}" class="grid gap-4">
        @csrf
        @method('PUT')

        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label for="name">Nombre</label>
            <input id="name" name="name" value="{{ old('name', $user->name) }}" required>
          </div>

          <div>
            <label for="last_name">Apellido</label>
            <input id="last_name" name="last_name" value="{{ old('last_name', $user->last_name) }}" required>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label for="phone">Teléfono / WhatsApp</label>
            <input id="phone" name="phone" value="{{ old('phone', $user->phone) }}" placeholder="Ej: 341 555-0000" required>
            <div class="muted text-xs mt-1">Lo usamos para WhatsApp y para asociar el pedido.</div>
          </div>

          <div>
            <label for="email">Email</label>
            <input id="email" name="email" type="email" value="{{ old('email', $user->email) }}" required>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-2">
          <button class="btn-primary w-full sm:w-auto" type="submit">Guardar cambios</button>
          <a class="btn-outline w-full sm:w-auto" href="{{ route('orders.index') }}">Mis pedidos</a>
        </div>
      </form>
    </div>
  </div>
    <div class="card max-w-2xl mt-4" id="security">

    <div class="card-head">
      <div class="font-black">Seguridad</div>
      <span class="badge-zinc">Contraseña</span>
    </div>

    <div class="card-body">

      @if($errors->hasAny(['current_password','password','password_confirmation']))
        <div class="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          <div class="font-bold">Revisá esto:</div>
          <ul class="mt-2 list-disc pl-5">
            @foreach (['current_password','password','password_confirmation'] as $f)
              @foreach ($errors->get($f) as $msg)
                <li>{{ $msg }}</li>
              @endforeach
            @endforeach
          </ul>
        </div>
      @endif

    
      <form method="POST" action="{{ route('account.password') }}" class="grid gap-4">
        @csrf
        @method('PUT')

        <div>
          <label for="current_password">Contraseña actual</label>
          <input id="current_password" name="current_password" type="password" required autocomplete="current-password">
          @error('current_password')
            <p class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</p>
          @enderror
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label for="password">Nueva contraseña</label>
            <input id="password" name="password" type="password" required autocomplete="new-password">
            @error('password')
              <p class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</p>
            @enderror
            <div class="muted text-xs mt-1">Mínimo 8 caracteres.</div>
          </div>

          <div>
            <label for="password_confirmation">Repetir nueva contraseña</label>
            <input id="password_confirmation" name="password_confirmation" type="password" required autocomplete="new-password">
            @error('password_confirmation')
              <p class="mt-1 text-xs font-semibold text-rose-700">{{ $message }}</p>
            @enderror
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-2">
          <button class="btn-primary w-full sm:w-auto" type="submit">Actualizar contraseña</button>
        </div>
      </form>
    </div>
  </div>

@endsection
