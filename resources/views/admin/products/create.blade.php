@extends('layouts.app')

@section('content')
<div style="max-width:900px; margin:0 auto; padding:18px;">
    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <h2 style="margin:0;">Crear producto</h2>
        <a href="{{ route('admin.products.index') }}" style="text-decoration:none; color:#111; border:1px solid #ddd; padding:10px 12px; border-radius:10px;">
            ← Volver
        </a>
    </div>

    @if($errors->any())
        <div style="margin-top:12px; padding:12px; background:#fef2f2; border:1px solid #fecaca; border-radius:12px;">
            <div style="font-weight:700; margin-bottom:6px;">Revisá estos errores:</div>
            <ul style="margin:0; padding-left:18px;">
                @foreach($errors->all() as $e)
                    <li>{{ $e }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <form method="POST" action="{{ route('admin.products.store') }}" enctype="multipart/form-data"
          style="margin-top:14px; display:flex; flex-direction:column; gap:12px;">
        @csrf

        <div style="border:1px solid #eee; border-radius:14px; padding:14px;">
            <label>Nombre</label><br>
            <input name="name" value="{{ old('name') }}" style="width:100%; padding:10px; border-radius:10px; border:1px solid #ddd;">
        </div>

        <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <div style="flex:1; min-width:260px; border:1px solid #eee; border-radius:14px; padding:14px;">
                <label>Categoría</label><br>
                <select name="category_id" style="width:100%; padding:10px; border-radius:10px; border:1px solid #ddd;">
                    <option value="">-- Seleccionar --</option>
                    @foreach($categories as $c)
                        <option value="{{ $c->id }}" @selected(old('category_id') == $c->id)>{{ $c->name }}</option>
                    @endforeach
                </select>
            </div>

            <div style="flex:1; min-width:200px; border:1px solid #eee; border-radius:14px; padding:14px;">
                <label>Precio</label><br>
                <input type="number" step="0.01" name="price" value="{{ old('price') }}"
                       style="width:100%; padding:10px; border-radius:10px; border:1px solid #ddd;">
            </div>

            <div style="flex:1; min-width:200px; border:1px solid #eee; border-radius:14px; padding:14px;">
                <label>Stock</label><br>
                <input type="number" name="stock" value="{{ old('stock', 0) }}"
                       style="width:100%; padding:10px; border-radius:10px; border:1px solid #ddd;">
            </div>
        </div>

        <div style="border:1px solid #eee; border-radius:14px; padding:14px;">
            <label>Descripción (opcional)</label><br>
            <textarea name="description" rows="5" style="width:100%; padding:10px; border-radius:10px; border:1px solid #ddd;">{{ old('description') }}</textarea>
        </div>

        <div style="border:1px solid #eee; border-radius:14px; padding:14px;">
            <label>Imagen (opcional)</label><br>
            <input type="file" name="image" accept="image/*">
            <div style="font-size:12px; color:#666; margin-top:6px;">Formatos: JPG/PNG/WEBP. Máx 4MB.</div>
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button type="submit" style="padding:10px 14px; border-radius:12px; background:#111; color:#fff; border:none; cursor:pointer;">
                Guardar
            </button>
            <a href="{{ route('admin.products.index') }}" style="padding:10px 14px; border-radius:12px; border:1px solid #ddd; color:#111; text-decoration:none;">
                Cancelar
            </a>
        </div>
    </form>
</div>
@endsection
