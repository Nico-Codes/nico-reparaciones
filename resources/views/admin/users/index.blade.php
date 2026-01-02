@extends('layouts.app')

@section('title', 'Admin — Usuarios')

@php
  $badge = fn($role) => $role === 'admin' ? 'badge-emerald' : 'badge-zinc';
@endphp

@section('content')
  <div class="card mb-4">
    <div class="card-body">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div class="text-lg font-semibold">Usuarios</div>
          <div class="text-sm text-zinc-500">
            Admins: {{ $roleCounts['admin'] ?? 0 }} · Users: {{ $roleCounts['user'] ?? 0 }}
          </div>
        </div>

        <form class="flex gap-2 flex-wrap items-center" method="GET" action="{{ route('admin.users.index') }}">
          <input
            type="text"
            name="q"
            value="{{ $q }}"
            placeholder="Buscar: nombre, email, teléfono…"
            class="w-full md:w-[320px]"
          >
          <select name="role" class="w-full md:w-[180px]">
            <option value="" @selected($role==='')>Todos</option>
            <option value="user" @selected($role==='user')>User</option>
            <option value="admin" @selected($role==='admin')>Admin</option>
          </select>

          <button class="btn-primary" type="submit">Filtrar</button>

          @if($q !== '' || $role !== '')
            <a class="btn-outline" href="{{ route('admin.users.index') }}">Limpiar</a>
          @endif
        </form>
      </div>
    </div>
  </div>

  <div class="grid gap-3">
    @forelse($users as $u)
      <div class="card">
        <div class="card-body">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-semibold">
                {{ $u->name }} {{ $u->last_name }}
              </div>
              <div class="text-sm text-zinc-500">
                {{ $u->email }}
                @if($u->phone) · {{ $u->phone }} @endif
              </div>
              <div class="text-xs text-zinc-500 mt-1">
                Alta: {{ optional($u->created_at)->format('d/m/Y H:i') }}
                · Pedidos: {{ $u->orders_count ?? 0 }}
                · Reparaciones: {{ $u->repairs_count ?? 0 }}
              </div>
            </div>

            <div class="text-right">
              <span class="badge {{ $badge($u->role) }}">{{ strtoupper($u->role) }}</span>
              <div class="mt-2">
                <a class="btn-outline btn-sm" href="{{ route('admin.users.show', $u) }}">Gestionar</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    @empty
      <div class="card">
        <div class="card-body text-zinc-500">
          No hay usuarios para mostrar.
        </div>
      </div>
    @endforelse
  </div>

  <div class="mt-4">
    {{ $users->links() }}
  </div>
@endsection
