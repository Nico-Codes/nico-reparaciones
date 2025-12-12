@extends('layouts.app')

@section('title', 'Admin - Productos')

@section('content')
<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
    <h1 style="margin:0;">Productos</h1>

    <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <a href="{{ route('admin.dashboard') }}" style="text-decoration:none; padding:10px 12px; border:1px solid #eee; border-radius:12px;">← Dashboard</a>
        <a href="{{ route('admin.products.create') }}" style="text-decoration:none; padding:10px 12px; border:1px solid #111; border-radius:12px;">+ Nuevo producto</a>
    </div>
</div>

@if(session('success'))
    <div style="margin-top:12px; padding:12px; border:1px solid #d1fae5; background:#ecfdf5; border-radius:12px;">
        {{ session('success') }}
    </div>
@endif

<form method="GET" action="{{ route('admin.products.index') }}" style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
    <input type="text" name="q" value="{{ $q ?? '' }}" placeholder="Buscar (nombre/slug/marca)" style="padding:10px; border-radius:12px; border:1px solid #eee; min-width:260px;">

    <select name="category_id" style="padding:10px; border-radius:12px; border:1px solid #eee;">
        <option value="">Todas las categorías</option>
        @foreach($categories as $c)
            <option value="{{ $c->id }}" {{ (string)($categoryId ?? '') === (string)$c->id ? 'selected' : '' }}>
                {{ $c->icon ?? '' }} {{ $c->name }}
            </option>
        @endforeach
    </select>

    <select name="stock" style="padding:10px; border-radius:12px; border:1px solid #eee;">
        <option value="">Stock (todos)</option>
        <option value="out" {{ ($stock ?? '') === 'out' ? 'selected' : '' }}>Sin stock</option>
        <option value="low" {{ ($stock ?? '') === 'low' ? 'selected' : '' }}>Stock bajo (<=2)</option>
    </select>

    <button type="submit" style="padding:10px 14px; border-radius:12px; border:1px solid #111; background:#111; color:#fff; cursor:pointer;">
        Filtrar
    </button>
</form>

<div style="margin-top:14px; display:flex; flex-direction:column; gap:10px;">
    @forelse($products as $p)
        <div style="padding:12px; border:1px solid #eee; border-radius:12px; display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap;">
            <div style="display:flex; gap:12px; align-items:center;">
                <div style="width:56px; height:56px; border-radius:12px; border:1px solid #f1f1f1; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                    @if($p->image)
                        <img src="{{ asset('storage/'.$p->image) }}" alt="" style="width:100%; height:100%; object-fit:cover;">
                    @else
                        <span style="opacity:.5;">IMG</span>
                    @endif
                </div>

                <div>
                    <div style="font-weight:800;">
                        {{ $p->name }}
                        @if($p->featured) <span title="Destacado">⭐</span> @endif
                    </div>
                    <div style="opacity:.8; font-size:13px;">
                        {{ $p->category->name ?? 'Sin categoría' }} · {{ $p->brand ?? 'Sin marca' }} · {{ $p->quality }}
                    </div>
                    <div style="margin-top:4px;">
                        <strong>${{ number_format($p->price, 0, ',', '.') }}</strong>
                        <span style="opacity:.8;">· Stock: {{ $p->stock }}</span>
                    </div>
                </div>
            </div>

            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <a href="{{ route('admin.products.edit', $p) }}" style="text-decoration:none; padding:10px 12px; border:1px solid #111; border-radius:12px;">
                    Editar
                </a>

                <form method="POST" action="{{ route('admin.products.destroy', $p) }}" onsubmit="return confirm('¿Eliminar este producto?');">
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
            No hay productos para mostrar.
        </div>
    @endforelse
</div>

<div style="margin-top:14px;">
    {{ $products->links() }}
</div>
@endsection
