@extends('layouts.app')

@section('title', 'Admin - Editar categoría')

@section('content')
<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
    <h1 style="margin:0;">Editar categoría</h1>
    <a href="{{ route('admin.categories.index') }}" style="text-decoration:none; padding:10px 12px; border:1px solid #eee; border-radius:12px;">← Volver</a>
</div>

@if(session('success'))
    <div style="margin-top:12px; padding:12px; border:1px solid #d1fae5; background:#ecfdf5; border-radius:12px;">
        {{ session('success') }}
    </div>
@endif

@if($errors->any())
    <div style="margin-top:12px; padding:12px; border:1px solid #fecaca; background:#fef2f2; border-radius:12px;">
        <strong>Revisá estos errores:</strong>
        <ul style="margin:8px 0 0; padding-left:18px;">
            @foreach($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

<form method="POST" action="{{ route('admin.categories.update', $category) }}" style="margin-top:14px; display:flex; flex-direction:column; gap:14px;">
    @csrf
    @method('PUT')

    <div style="padding:12px; border:1px solid #eee; border-radius:12px; display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">
        <div>
            <label>Nombre *</label><br>
            <input type="text" name="name" required value="{{ old('name', $category->name) }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">
        </div>

        <div>
            <label>Slug</label><br>
            <input type="text" name="slug" value="{{ old('slug', $category->slug) }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">
        </div>

        <div>
            <label>Icono</label><br>
            <input type="text" name="icon" value="{{ old('icon', $category->icon) }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">
        </div>
    </div>

    <div style="padding:12px; border:1px solid #eee; border-radius:12px;">
        <label>Descripción</label><br>
        <input type="text" name="description" value="{{ old('description', $category->description) }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;" maxlength="255">
    </div>

    <button type="submit" style="padding:12px 14px; border-radius:12px; border:1px solid #111; background:#111; color:#fff; cursor:pointer;">
        Guardar cambios
    </button>
</form>
@endsection
