@extends('layouts.app')

@section('content')
<div style="max-width:1100px; margin:0 auto; padding:18px;">
    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <h2 style="margin:0;">Productos</h2>
        <a href="{{ route('admin.products.create') }}" style="padding:10px 14px; border-radius:10px; background:#111; color:#fff; text-decoration:none;">
            + Crear producto
        </a>
    </div>

    @if(session('success'))
        <div style="margin-top:12px; padding:10px 12px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:12px;">
            {{ session('success') }}
        </div>
    @endif

    <div style="margin-top:14px; overflow:auto; border:1px solid #eee; border-radius:14px;">
        <table style="width:100%; border-collapse:collapse; min-width:900px;">
            <thead>
                <tr style="background:#fafafa; text-align:left;">
                    <th style="padding:10px; border-bottom:1px solid #eee;">Imagen</th>
                    <th style="padding:10px; border-bottom:1px solid #eee;">Nombre</th>
                    <th style="padding:10px; border-bottom:1px solid #eee;">Categoría</th>
                    <th style="padding:10px; border-bottom:1px solid #eee;">Precio</th>
                    <th style="padding:10px; border-bottom:1px solid #eee;">Stock</th>
                    <th style="padding:10px; border-bottom:1px solid #eee; width:240px;">Acciones</th>
                </tr>
            </thead>
            <tbody>
            @forelse($products as $p)
                <tr>
                    <td style="padding:10px; border-bottom:1px solid #f2f2f2;">
                        @if($p->image_url)
                            <img src="{{ $p->image_url }}" alt="{{ $p->name }}" style="width:52px; height:52px; object-fit:cover; border-radius:10px; border:1px solid #eee;">
                        @else
                            <div style="width:52px; height:52px; border-radius:10px; border:1px dashed #ddd; display:flex; align-items:center; justify-content:center; color:#999; font-size:12px;">
                                sin foto
                            </div>
                        @endif
                    </td>
                    <td style="padding:10px; border-bottom:1px solid #f2f2f2;">
                        <div style="font-weight:700;">{{ $p->name }}</div>
                        <div style="color:#666; font-size:12px;">/{{ $p->slug }}</div>
                    </td>
                    <td style="padding:10px; border-bottom:1px solid #f2f2f2;">
                        {{ $p->category?->name ?? '-' }}
                    </td>
                    <td style="padding:10px; border-bottom:1px solid #f2f2f2;">
                        ${{ number_format((float)$p->price, 2, ',', '.') }}
                    </td>
                    <td style="padding:10px; border-bottom:1px solid #f2f2f2;">
                        {{ (int)$p->stock }}
                    </td>
                    <td style="padding:10px; border-bottom:1px solid #f2f2f2;">
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <a href="{{ route('admin.products.edit', $p) }}" style="padding:8px 12px; border-radius:10px; border:1px solid #ddd; text-decoration:none; color:#111;">
                                Editar
                            </a>

                            <a href="{{ route('store.product', $p->slug) }}" target="_blank" style="padding:8px 12px; border-radius:10px; border:1px solid #ddd; text-decoration:none; color:#111;">
                                Ver en tienda
                            </a>

                            <form method="POST" action="{{ route('admin.products.destroy', $p) }}" onsubmit="return confirm('¿Eliminar producto?');">
                                @csrf
                                @method('DELETE')
                                <button type="submit" style="padding:8px 12px; border-radius:10px; border:1px solid #ef4444; background:#fff; color:#ef4444; cursor:pointer;">
                                    Eliminar
                                </button>
                            </form>
                        </div>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="padding:14px; color:#666;">No hay productos todavía.</td>
                </tr>
            @endforelse
            </tbody>
        </table>
    </div>

    <div style="margin-top:14px;">
        {{ $products->links() }}
    </div>
</div>
@endsection
