@extends('layouts.app')

@section('title', $product->name . ' - NicoReparaciones')

@section('content')
    <section class="product-card product-page">
        <div class="product-image-box">
            <img src="{{ asset('img/' . ($product->image ?? 'logo-nicoreparaciones.jpg')) }}"
                 alt="{{ $product->name }}">
        </div>

        <div>
            <h1 class="product-title">{{ $product->name }}</h1>
            <div class="product-brand">
                {{ $product->brand ?? 'Marca genérica' }} · Calidad: {{ ucfirst($product->quality) }}
            </div>

            <div class="product-price-row">
                <div class="product-price">
                    ${{ number_format($product->price, 0, ',', '.') }}
                </div>

                <div class="product-stock {{ $product->stock > 0 ? 'in-stock' : 'out-stock' }}">
                    @if($product->stock > 0)
                        En stock
                    @else
                        Sin stock
                    @endif
                </div>
            </div>

            <p class="product-desc">
                {{ $product->description ?? $product->short_description }}
            </p>

            <p class="product-category">
                Categoría: {{ $product->category?->name }}
            </p>

            {{-- Más adelante acá meteremos el selector de cantidad + botón "Agregar al carrito" real --}}
            <div class="extra-info">
                <strong>Retiro en local</strong><br>
                Pagás en el local, por Mercado Pago o transferencia (según cómo lo configuremos después).
            </div>

            <a href="{{ route('store.index') }}" class="btn btn-outline" style="margin-top: 1rem;">
                ← Volver a la tienda
            </a>

            {{-- ... precio + stock ... --}}

            {{-- FORMULARIO AGREGAR AL CARRITO --}}
            
            <form action="{{ route('cart.add', $product->id) }}" method="POST" class="product-add-cart-form">
                @csrf
                <label for="quantity">Cantidad</label>
                <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    min="1"
                    value="1"
                    style="max-width: 80px; margin: 0.3rem 0;"
                >
                <button type="submit" class="btn" style="display:block; margin-top:0.3rem;">
                    Agregar al carrito
                </button>
            </form>

        </div>
    </section>
@endsection
