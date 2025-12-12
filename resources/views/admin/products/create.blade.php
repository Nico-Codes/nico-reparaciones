@extends('layouts.app')

@section('title', 'Admin - Nuevo producto')

@section('content')
<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
    <h1 style="margin:0;">Nuevo producto</h1>
    <a href="{{ route('admin.products.index') }}" style="text-decoration:none; padding:10px 12px; border:1px solid #eee; border-radius:12px;">← Volver</a>
</div>

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

<form method="POST" action="{{ route('admin.products.store') }}" enctype="multipart/form-data" style="margin-top:14px; display:flex; flex-direction:column; gap:14px;">
    @csrf

    <div style="padding:12px; border:1px solid #eee; border-radius:12px; display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">
        <div>
            <label>Categoría *</label><br>
            <select name="category_id" required style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">
                @foreach($categories as $c)
                    <option value="{{ $c->id }}" {{ old('category_id') == $c->id ? 'selected' : '' }}>
                        {{ $c->icon ?? '' }} {{ $c->name }}
                    </option>
                @endforeach
            </select>
        </div>

        <div>
            <label>Nombre *</label><br>
            <input type="text" name="name" required value="{{ old('name') }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">
        </div>

        <div>
            <label>Slug (opcional)</label><br>
            <input type="text" name="slug" value="{{ old('slug') }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;" placeholder="se genera solo si lo dejás vacío">
        </div>

        <div>
            <label>Marca</label><br>
            <input type="text" name="brand" value="{{ old('brand') }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">
        </div>

        <div>
            <label>Calidad *</label><br>
            <select name="quality" required style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">
                @php $q = old('quality', 'generico'); @endphp
                <option value="original" {{ $q==='original'?'selected':'' }}>Original</option>
                <option value="premium" {{ $q==='premium'?'selected':'' }}>Premium</option>
                <option value="generico" {{ $q==='generico'?'selected':'' }}>Genérico</option>
            </select>
        </div>

        <div>
            <label>Precio (ARS) *</label><br>
            <input type="number" min="0" name="price" required value="{{ old('price', 0) }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">
        </div>

        <div>
            <label>Stock *</label><br>
            <input type="number" min="0" name="stock" required value="{{ old('stock', 0) }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">
        </div>
    </div>

    <div style="padding:12px; border:1px solid #eee; border-radius:12px;">
        <label>Descripción corta</label><br>
        <input type="text" name="short_description" value="{{ old('short_description') }}" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;" maxlength="255">
    </div>

    <div style="padding:12px; border:1px solid #eee; border-radius:12px;">
        <label>Descripción</label><br>
        <textarea name="description" rows="5" style="width:100%; padding:10px; border:1px solid #eee; border-radius:12px;">{{ old('description') }}</textarea>
    </div>

    <div style="padding:12px; border:1px solid #eee; border-radius:12px; display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">
        <div>
            <label>Imagen (opcional)</label><br>
            <input type="file" name="image" accept="image/*">
            <div style="opacity:.75; margin-top:6px; font-size:13px;">Recomendado: cuadrada, liviana.</div>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
            <input type="checkbox" id="featured" name="featured" value="1" {{ old('featured') ? 'checked' : '' }}>
            <label for="featured" style="margin:0;">Destacado (aparece en “Destacados”)</label>
        </div>
    </div>

    <button type="submit" style="padding:12px 14px; border-radius:12px; border:1px solid #111; background:#111; color:#fff; cursor:pointer;">
        Crear producto
    </button>
</form>
@endsection
