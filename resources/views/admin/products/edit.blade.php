@extends('layouts.app')

@section('content')
<div style="max-width:900px; margin:0 auto; padding:18px;">
    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <h2 style="margin:0;">Editar producto</h2>
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

    <form method="POST" action="{{ route('admin.products.update', $product) }}" enctype="multipart/form-data"
          style="margin-top:14px; display:flex; flex-direction:column; gap:12px;">
        @csrf
        @method('PUT')

        <div style="border:1px solid #eee; border-radius:14px; padding:14px;">
            <label>Nombre</label><br>
            <input name="name" value="{{ old('name', $product->name) }}" style="width:100%; padding:10px; border-radius:10px; border:1px solid #ddd;">
        </div>

        <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <div style="flex:1; min-width:260px; border:1px solid #eee; border-radius:14px; padding:14px;">
                <label>Categoría</label><br>
                <select name="category_id" style="width:100%; padding:10px; border-radius:10px; border:1px solid #ddd;">
                    @foreach($categories as $c)
                        <option value="{{ $c->id }}" @selected(old('category_id', $product->category_id) == $c->id)>{{ $c->name }}</option>
                    @endforeach
                </select>
            </div>

            <div style="flex:1; min-width:200px; border:1px solid #eee; border-radius:14px; padding:14px;">
                <label>Precio</label><br>
                <input type="number" step="0.01" name="price" value="{{ old('price', $product->price) }}"
                       style="width:100%; padding:10px; border-radius:10px; border:1px solid #ddd;">
            </div>

            <div style="flex:1; min-width:200px; border:1px solid #eee; border-radius:14px; padding:14px;">
                <label>Stock</label><br>
                <input type="number" name="stock" value="{{ old('stock', $product->stock) }}"
                       style="width:100%; padding:10px; border-radius:10px; border:1px solid #ddd;">
            </div>
        </div>

        <div style="border:1px solid #eee; border-radius:14px; padding:14px;">
            <label>Descripción (opcional)</label><br>
            <textarea name="description" rows="5" style="width:100%; padding:10px; border-radius:10px; border:1px solid #ddd;">{{ old('description', $product->description) }}</textarea>
        </div>

        <div style="border:1px solid #eee; border-radius:14px; padding:14px;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
                <div>
                    <div style="font-weight:700;">Imagen actual</div>
                    <div style="font-size:12px; color:#666;">Podés subir otra para reemplazarla.</div>
                </div>
                @if($product->image_url)
                    <img src="{{ $product->image_url }}" alt="{{ $product->name }}"
                         style="width:72px; height:72px; object-fit:cover; border-radius:12px; border:1px solid #eee;">
                @else
                    <div style="width:72px; height:72px; border-radius:12px; border:1px dashed #ddd; display:flex; align-items:center; justify-content:center; color:#999; font-size:12px;">
                        sin foto
                    </div>
                @endif
            </div>

            <div style="margin-top:10px;">
                <label>Nueva imagen (opcional)</label><br>
                <input type="file" name="image" accept="image/*">
            </div>

            <div style="margin-top:10px;">
                <label style="display:flex; gap:8px; align-items:center;">
                    <input type="checkbox" name="remove_image" value="1">
                    Quitar imagen
                </label>
            </div>
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button type="submit" style="padding:10px 14px; border-radius:12px; background:#111; color:#fff; border:none; cursor:pointer;">
                Guardar cambios
            </button>
            <a href="{{ route('admin.products.index') }}" style="padding:10px 14px; border-radius:12px; border:1px solid #ddd; color:#111; text-decoration:none;">
                Cancelar
            </a>
        </div>
    </form>
</div>
@endsection
