@extends('layouts.app')

@section('title', 'Admin - Categorías')

@section('content')
<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
    <h1 style="margin:0;">Categorías</h1>

    <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <a href="{{ route('admin.dashboard') }}" style="text-decoration:none; padding:10px 12px; border:1px solid #eee; border-radius:12px;">← Dashboard</a>
        <a href="{{ route('admin.categories.create') }}" style="text-decoration:none; padding:10px 12px; border:1px solid #111; border-radius:12px;">+ Nueva categoría</a>
    </div>
</div>

@if(session('success'))
    <div style="margin-top:12px; padding:12px; border:1px solid #d1fae5; background:#ecfdf5; border-radius:12px;">
        {{ session('success') }}
    </div>
@endif

<div style="margin-top:14px; display:flex; flex-direction:column; gap:10px;">
    @forelse($categories as $c)
        <div style="padding:12px; border:1px solid #eee; border-radius:12px; display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap;">
            <div>
                <div style="font-weight:800;">
                    {{ $c->icon ?? '' }} {{ $c->name }}
                </div>
                <div style="opacity:.8; font-size:13px;">
                    slug: {{ $c->slug }} · productos: {{ $c->products_count }}
                </div>
                @if($c->description)
                    <div style="margin-top:6px;">{{ $c->description }}</div>
                @endif
            </div>

            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <a href="{{ route('admin.categories.edit', $c) }}" style="text-decoration:none; padding:10px 12px; border:1px solid #111; border-radius:12px;">
                    Editar
                </a>

                <form method="POST" action="{{ route('admin.categories.destroy', $c) }}" onsubmit="return confirm('Eliminar categoría: también se eliminan sus productos (por cascade). ¿Continuar?');">
                    @csrf
                    @method('DELETE')
                    <button type="submit" style="padding:10px 12px; border-radius:12px; border:1px solid #ef4444; background:#fff; color:#ef4444; cursor:pointer;">
                        Eliminar
                    </button>
                </form>
            </div>
        </div>
    @empty
        <div style="padding:12px; border:1px solid #eee; border-radius:12px;">
            No hay categorías cargadas.
        </div>
    @endforelse
</div>
@endsection
