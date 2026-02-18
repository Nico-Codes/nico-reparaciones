@extends('layouts.app')

@section('title', 'Admin - Editar producto')

@section('content')
@php
  $hasImage = !empty($product->image_url);
@endphp

<div class="store-shell mx-auto w-full max-w-4xl">
  <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between rounded-3xl border border-sky-100 bg-white/90 p-4 reveal-item">
    <div class="page-head mb-0 w-full sm:w-auto">
      <div class="page-title">Editar producto</div>
      <div class="page-subtitle">Actualiza identificacion, precio, stock, categoria e imagen.</div>
    </div>

    <div class="flex w-full gap-2 flex-wrap sm:w-auto">
      <a href="{{ route('admin.warranty_incidents.create', ['product_id' => $product->id]) }}" class="btn-outline h-11 w-full justify-center sm:w-auto">Garantia</a>
      <a href="{{ route('admin.products.label', $product) }}" class="btn-outline h-11 w-full justify-center sm:w-auto" target="_blank" rel="noopener">Etiqueta</a>
      <a href="{{ route('admin.products.index') }}" class="btn-outline h-11 w-full justify-center sm:w-auto">Volver</a>
    </div>
  </div>

  <form id="productForm" method="POST" action="{{ route('admin.products.update', $product) }}" enctype="multipart/form-data" class="space-y-4" data-disable-on-submit>
    @csrf
    @method('PUT')

    <div class="card reveal-item">
      <div class="card-head">
        <div class="font-black">Datos del producto</div>
        <span class="badge-zinc">ID #{{ $product->id }}</span>
      </div>

      <div class="card-body">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2 space-y-1">
            <label>Nombre *</label>
            <input name="name" class="h-11" required value="{{ old('name', $product->name) }}">
          </div>

          <div class="space-y-1">
            <label>Slug (opcional)</label>
            <input name="slug" class="h-11" value="{{ old('slug', $product->slug) }}">
            <div class="text-xs text-zinc-500">Si lo dejas vacio, se genera desde el nombre.</div>
          </div>

          <div class="space-y-1">
            <label>SKU interno *</label>
            <input name="sku" class="h-11" required value="{{ old('sku', $product->sku) }}">
          </div>

          <div class="sm:col-span-2 space-y-1">
            <label>Codigo de barras (opcional)</label>
            <input name="barcode" class="h-11" value="{{ old('barcode', $product->barcode) }}" placeholder="Ej: 7791234567890">
          </div>

          <div class="space-y-1">
            <label>Categoria *</label>
            <select name="category_id" class="h-11" required>
              @foreach($categories as $c)
                <option value="{{ $c->id }}" @selected((string)old('category_id', $product->category_id) === (string)$c->id)>{{ $c->name }}</option>
              @endforeach
            </select>
          </div>

          <div class="space-y-1">
            <label>Proveedor</label>
            <select name="supplier_id" class="h-11">
              <option value="">Sin proveedor</option>
              @foreach(($suppliers ?? collect()) as $s)
                <option value="{{ $s->id }}" @selected((string)old('supplier_id', $product->supplier_id) === (string)$s->id)>{{ $s->name }}@if(!$s->active) (inactivo)@endif</option>
              @endforeach
            </select>
          </div>

          <div class="sm:col-span-2 space-y-1">
            <label>Referencia de compra (opcional)</label>
            <input name="purchase_reference" class="h-11" value="{{ old('purchase_reference', $product->purchase_reference) }}" placeholder="Ej: Factura 0081-000123, lote A12">
          </div>

          <div class="space-y-1">
            <label>Precio de costo *</label>
            <input id="productCostInputEdit" name="cost_price" class="h-11" required value="{{ old('cost_price', $product->cost_price ?? $product->price) }}" inputmode="decimal" placeholder="0">
          </div>

          <div class="space-y-1">
            <label>Precio de venta (recomendado)</label>
            <input id="productPriceInputEdit" name="price" class="h-11" value="{{ old('price', $product->price) }}" inputmode="decimal" placeholder="Ingresa precio o usa recomendado">
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <button id="applyRecommendedPriceBtnEdit" type="button" class="btn-outline btn-sm h-9" disabled>Usar recomendado</button>
              <span id="productRecommendedPriceBadgeEdit" class="badge-zinc hidden"></span>
            </div>
            <div id="productPriceHintEdit" class="text-xs text-zinc-500">Ajusta costo/categoria para recalcular precio recomendado.</div>
            <div id="productMarginAlertEdit" class="hidden rounded-xl border px-3 py-2 text-xs font-semibold"></div>
          </div>

          <div class="space-y-1">
            <label>Stock *</label>
            <input name="stock" class="h-11" required value="{{ old('stock', $product->stock) }}" inputmode="numeric" placeholder="0">
          </div>

          <div class="sm:col-span-2 space-y-1">
            <label>Descripcion (opcional)</label>
            <textarea name="description" rows="4" placeholder="Detalles, compatibilidad, color, etc.">{{ old('description', $product->description) }}</textarea>
          </div>

          <div class="sm:col-span-2">
            <div class="grid gap-4 sm:grid-cols-[1fr_220px]">
              <div class="space-y-1">
                <label>Imagen (opcional)</label>
                <input id="productImageInputEdit" name="image" type="file" class="h-11" accept="image/*" capture="environment">
                <div class="flex flex-wrap gap-2">
                  <button id="openProductCameraEdit" type="button" class="btn-outline h-10">Usar camara</button>
                  <button id="captureProductCameraEdit" type="button" class="btn-primary h-10 hidden">Capturar</button>
                  <button id="closeProductCameraEdit" type="button" class="btn-outline h-10 hidden">Cerrar camara</button>
                </div>
                <div id="productCameraWrapEdit" class="hidden rounded-2xl border border-zinc-200 bg-zinc-950 p-2">
                  <video id="productCameraVideoEdit" class="mx-auto max-h-72 w-full rounded-xl object-contain" autoplay playsinline muted></video>
                </div>
                <div class="text-xs text-zinc-500">En escritorio, usa el boton "Usar camara". En celular, puedes usar camara o archivo. Si subes una nueva, reemplaza la actual y se recorta automaticamente en cuadrado.</div>

                @if($hasImage)
                  <label class="mt-3 inline-flex items-center gap-2 text-sm font-black text-zinc-800">
                    <input type="checkbox" name="remove_image" value="1" class="h-4 w-4 rounded border-zinc-300">
                    Quitar imagen actual
                  </label>
                @endif
              </div>

              <div>
                <div class="text-sm font-black text-zinc-800">Vista previa</div>
                <div class="mt-2 h-28 w-28 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50">
                  @if($hasImage)
                    <img id="productImagePreviewEdit" src="{{ $product->image_url }}" alt="{{ $product->name }}" class="h-full w-full object-cover">
                    <div id="productImagePreviewEmptyEdit" class="hidden flex h-full w-full items-center justify-center text-xs font-black text-zinc-400">Sin imagen</div>
                  @else
                    <img id="productImagePreviewEdit" src="" alt="Vista previa de imagen" class="hidden h-full w-full object-cover">
                    <div id="productImagePreviewEmptyEdit" class="flex h-full w-full items-center justify-center text-xs font-black text-zinc-400">Sin imagen</div>
                  @endif
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>

  <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
    <form method="POST" action="{{ route('admin.products.destroy', $product) }}" data-disable-on-submit onsubmit="return confirm('¿Eliminar producto?');">
      @csrf
      @method('DELETE')
      <button class="btn-danger h-11 w-full justify-center sm:w-auto" type="submit">Eliminar producto</button>
    </form>

    <button class="btn-primary h-11 w-full justify-center sm:w-auto" form="productForm" type="submit">Guardar cambios</button>
  </div>
</div>

<div
  id="productFormEnhancementsEdit"
  data-react-product-form-enhancements
  data-root-id="productFormEnhancementsEdit"
  data-form-id="productForm"
  data-prevent-negative-margin="{{ (bool) ($preventNegativeMargin ?? true) ? '1' : '0' }}"
  data-price-resolve-url="{{ $priceResolveUrl ?? '' }}"
  data-product-id="{{ (int) $product->id }}"
  data-cost-input-id="productCostInputEdit"
  data-price-input-id="productPriceInputEdit"
  data-price-hint-id="productPriceHintEdit"
  data-margin-alert-id="productMarginAlertEdit"
  data-apply-recommended-btn-id="applyRecommendedPriceBtnEdit"
  data-recommended-badge-id="productRecommendedPriceBadgeEdit"
  data-image-input-id="productImageInputEdit"
  data-preview-id="productImagePreviewEdit"
  data-preview-empty-id="productImagePreviewEmptyEdit"
  data-open-camera-btn-id="openProductCameraEdit"
  data-capture-camera-btn-id="captureProductCameraEdit"
  data-close-camera-btn-id="closeProductCameraEdit"
  data-camera-wrap-id="productCameraWrapEdit"
  data-camera-video-id="productCameraVideoEdit"
></div>
@endsection

