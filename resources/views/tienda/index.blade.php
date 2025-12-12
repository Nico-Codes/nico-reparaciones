@extends('layouts.app')

@section('title', isset($currentCategory) ? $currentCategory->name . ' - Tienda' : 'Tienda - NicoReparaciones')

@section('content')
    <section class="hero">
        <h1 class="hero-title">
            @if(isset($currentCategory))
                {{ $currentCategory->name }}
            @else
                Tienda
            @endif
        </h1>

        <p class="hero-text">
            Elegí accesorios, fundas, cables, cargadores, auriculares y más.
            Todo listo para retirar en el local.
        </p>
    </section>

    {{-- Listado de categorías --}}
    @if(!isset($currentCategory))
        <section class="category-grid">
            @foreach($categories as $category)
                <a href="{{ route('store.category', $category->slug) }}" class="category-card">
                    <div class="category-icon">
                        {{ $category->icon ?? '📦' }}
                    </div>
                    <div class="category-info">
                        <h2>{{ $category->name }}</h2>
                        <p>{{ $category->description }}</p>
                    </div>
                </a>
            @endforeach
        </section>
    @endif

    {{-- Si estamos en una categoría específica, mostramos solo sus productos --}}
    @foreach($categories as $category)
        {{-- Si hay solo una categoría (filtro), no repetimos título aparte --}}
        @if(!isset($currentCategory))
            <h2 class="section-title">{{ $category->name }}</h2>
        @endif

        @if($category->products->isEmpty())
            <p class="hero-text">No hay productos cargados en esta categoría todavía.</p>
        @else
            <section class="product-grid">
                @foreach($category->products as $product)
                    <article class="product-card">
                        <div class="product-image-box">
                            {{-- Más adelante podrás usar el path real de la imagen --}}
                            <img src="{{ asset('img/' . ($product->image ?? 'logo-nicoreparaciones.jpg')) }}"
                                 alt="{{ $product->name }}">
                        </div>
                        <div class="product-body">
                            <h3 class="product-title">
                                <a href="{{ route('store.product', $product->slug) }}">
                                    {{ $product->name }}
                                </a>
                            </h3>
                            <p class="product-short">
                                {{ $product->short_description }}
                            </p>
                            <div class="product-meta-row">
                                <span class="product-price">${{ number_format($product->price, 0, ',', '.') }}</span>
                                <span class="product-stock">
                                    @if($product->stock > 0)
                                        En stock
                                    @else
                                        Sin stock
                                    @endif
                                </span>
                            </div>
                        </div>
                    </article>
                @endforeach
            </section>
        @endif
    @endforeach

    {{-- Productos destacados globales (opcional) --}}
    @if(isset($featuredProducts) && $featuredProducts->count() && !isset($currentCategory))
        <h2 class="section-title">Destacados</h2>
        <section class="product-grid">
            @foreach($featuredProducts as $product)
                <article class="product-card">
                    <div class="product-image-box">
                        <img src="{{ asset('img/' . ($product->image ?? 'logo-nicoreparaciones.jpg')) }}"
                             alt="{{ $product->name }}">
                    </div>
                    <div class="product-body">
                        <h3 class="product-title">
                            <a href="{{ route('store.product', $product->slug) }}">
                                {{ $product->name }}
                            </a>
                        </h3>
                        <p class="product-short">
                            {{ $product->short_description }}
                        </p>
                        <div class="product-meta-row">
                            <span class="product-price">${{ number_format($product->price, 0, ',', '.') }}</span>
                            <span class="product-stock">
                                @if($product->stock > 0)
                                    En stock
                                @else
                                    Sin stock
                                @endif
                            </span>
                        </div>
                    </div>
                </article>
            @endforeach
        </section>
    @endif
@endsection
