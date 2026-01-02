@extends('layouts.app')

@section('title', 'Admin — Usuario #' . $user->id)

@php
  $badge = fn($role) => $role === 'admin' ? 'badge-emerald' : 'badge-zinc';
@endphp

@section('content')
  <div class="flex items-center justify-between mb-4">
    <div>
      <div class="text-lg font-semibold">Usuario #{{ $user->id }}</div>
      <div class="text-sm text-zinc-500">Gestión de rol y datos de registro</div>
    </div>
    <a class="btn-outline" href="{{ route('admin.users.index') }}">Volver</a>
  </div>

  <div class="grid md:grid-cols-2 gap-4">
    <div class="card">
      <div class="card-body">
        <div class="flex items-start justify-between">
          <div>
            <div class="font-semibold text-lg">{{ $user->name }} {{ $user->last_name }}</div>
            <div class="text-sm text-zinc-500">
              {{ $user->email }} @if($user->phone) · {{ $user->phone }} @endif
            </div>
            <div class="text-xs text-zinc-500 mt-2">
              Alta: {{ optional($user->created_at)->format('d/m/Y H:i') }}<br>
              Pedidos: {{ $user->orders_count ?? 0 }} · Reparaciones: {{ $user->repairs_count ?? 0 }}
            </div>
          </div>
          <span class="badge {{ $badge($user->role) }}">{{ strtoupper($user->role) }}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="font-semibold mb-2">Rol del usuario</div>

        <form method="POST" action="{{ route('admin.users.updateRole', $user) }}" class="space-y-3">
          @csrf

          <label class="text-sm text-zinc-600">Asignar rol</label>
          <select name="role" class="w-full">
            <option value="user" @selected($user->role === 'user')>User</option>
            <option value="admin" @selected($user->role === 'admin')>Admin</option>
          </select>

          <button class="btn-primary w-full" type="submit">Guardar cambios</button>

          <p class="text-xs text-zinc-500">
            Tip: no podés quitar el rol al último admin, ni quitarte admin a vos mismo.
          </p>
        </form>
      </div>
    </div>
  </div>
@endsection
