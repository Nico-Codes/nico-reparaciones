@extends('layouts.app')

@section('title', 'Admin - Nuevo producto')

@section('content')
<div class="store-shell mx-auto w-full max-w-4xl">
  <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between rounded-3xl border border-sky-100 bg-white/90 p-4 reveal-item">
    <div class="page-head mb-0 w-full sm:w-auto">
      <div class="page-title">Nuevo producto</div>
      <div class="page-subtitle">Crea un producto con identificacion rapida para venta.</div>
    </div>

    <a href="{{ route('admin.products.index') }}" class="btn-outline h-11 w-full justify-center sm:h-auto sm:w-auto">Volver</a>
  </div>

  <form id="productFormCreate" method="POST" action="{{ route('admin.products.store') }}" enctype="multipart/form-data" class="space-y-4" data-disable-on-submit>
    @csrf

    <div class="card reveal-item">
      <div class="card-head">
        <div class="font-black">Datos del producto</div>
        <span class="badge-zinc">Catalogo</span>
      </div>

      <div class="card-body">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2 space-y-1">
            <label>Nombre *</label>
            <input name="name" class="h-11" required value="{{ old('name') }}" placeholder="Ej: Funda iPhone 13">
          </div>

          <div class="space-y-1">
            <label>Slug (opcional)</label>
            <input name="slug" class="h-11" value="{{ old('slug') }}" placeholder="Se genera si lo dejas vacio">
            <div class="text-xs text-zinc-500">Si lo dejas vacio, se genera desde el nombre.</div>
          </div>

          <div class="space-y-1">
            <label>SKU interno *</label>
            <input name="sku" class="h-11" required value="{{ old('sku') }}" placeholder="Ej: CAB-USB-C-001">
            <div class="text-xs text-zinc-500">Codigo unico interno para venta rapida y etiquetas.</div>
          </div>

          <div class="sm:col-span-2 space-y-1">
            <label>Codigo de barras (opcional)</label>
            <input name="barcode" class="h-11" value="{{ old('barcode') }}" placeholder="Ej: 7791234567890">
            <div class="text-xs text-zinc-500">Si no tiene codigo fisico, puedes usar SKU y luego imprimir etiqueta interna.</div>
          </div>

          <div class="space-y-1">
            <label>Categoria *</label>
            <select name="category_id" class="h-11" required>
              <option value="">Seleccionar...</option>
              @foreach($categories as $c)
                <option value="{{ $c->id }}" @selected((string)old('category_id') === (string)$c->id)>{{ $c->name }}</option>
              @endforeach
            </select>
          </div>

          <div class="space-y-1">
            <label>Proveedor</label>
            <select name="supplier_id" class="h-11">
              <option value="">Sin proveedor</option>
              @foreach(($suppliers ?? collect()) as $s)
                <option value="{{ $s->id }}" @selected((string)old('supplier_id') === (string)$s->id)>{{ $s->name }}</option>
              @endforeach
            </select>
          </div>

          <div class="sm:col-span-2 space-y-1">
            <label>Referencia de compra (opcional)</label>
            <input name="purchase_reference" class="h-11" value="{{ old('purchase_reference') }}" placeholder="Ej: Factura 0081-000123, lote A12">
          </div>

          <div class="space-y-1">
            <label>Precio de costo *</label>
            <input id="productCostInput" name="cost_price" class="h-11" required value="{{ old('cost_price') }}" inputmode="decimal" placeholder="0">
          </div>

          <div class="space-y-1">
            <label>Precio de venta (recomendado)</label>
            <input id="productPriceInput" name="price" class="h-11" value="{{ old('price') }}" inputmode="decimal" placeholder="Ingresa precio o usa recomendado">
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <button id="applyRecommendedPriceBtn" type="button" class="btn-outline btn-sm h-9" disabled>Usar recomendado</button>
              <span id="productRecommendedPriceBadge" class="badge-zinc hidden"></span>
            </div>
            <div id="productPriceHint" class="text-xs text-zinc-500">Define categoria + costo para calcular recomendado.</div>
            <div id="productMarginAlert" class="hidden rounded-xl border px-3 py-2 text-xs font-semibold"></div>
          </div>

          <div class="space-y-1">
            <label>Stock *</label>
            <input name="stock" class="h-11" required value="{{ old('stock', 0) }}" inputmode="numeric" placeholder="0">
          </div>

          <div class="sm:col-span-2 space-y-1">
            <label>Descripcion (opcional)</label>
            <textarea name="description" rows="4" placeholder="Detalles, compatibilidad, color, etc.">{{ old('description') }}</textarea>
          </div>

          <div class="sm:col-span-2 space-y-2">
            <label>Imagen (opcional)</label>
            <input id="productImageInput" name="image" type="file" class="h-11" accept="image/*" capture="environment">
            <div class="flex flex-wrap gap-2">
              <button id="openProductCamera" type="button" class="btn-outline h-10">Usar camara</button>
              <button id="captureProductCamera" type="button" class="btn-primary h-10 hidden">Capturar</button>
              <button id="closeProductCamera" type="button" class="btn-outline h-10 hidden">Cerrar camara</button>
            </div>
            <div id="productCameraWrap" class="hidden rounded-2xl border border-zinc-200 bg-zinc-950 p-2">
              <video id="productCameraVideo" class="mx-auto max-h-72 w-full rounded-xl object-contain" autoplay playsinline muted></video>
            </div>
            <div class="text-xs text-zinc-500">En escritorio, usa el boton "Usar camara". En celular, puedes usar camara o archivo. La imagen se recorta automaticamente en formato cuadrado.</div>

            <div class="pt-2">
              <div class="text-sm font-black text-zinc-800">Vista previa</div>
              <div class="mt-2 h-28 w-28 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50">
                <img id="productImagePreview" src="" alt="Vista previa de imagen" class="hidden h-full w-full object-cover">
                <div id="productImagePreviewEmpty" class="flex h-full w-full items-center justify-center text-xs font-black text-zinc-400">Sin imagen</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
      <a href="{{ route('admin.products.index') }}" class="btn-outline h-11 w-full justify-center sm:w-auto">Cancelar</a>
      <button class="btn-primary h-11 w-full justify-center sm:w-auto" type="submit">Crear producto</button>
    </div>
  </form>
</div>

<div
  id="productFormEnhancementsCreate"
  data-react-product-form-enhancements
  data-root-id="productFormEnhancementsCreate"
  data-form-id="productFormCreate"
  data-prevent-negative-margin="{{ (bool) ($preventNegativeMargin ?? true) ? '1' : '0' }}"
  data-price-resolve-url="{{ $priceResolveUrl ?? '' }}"
  data-cost-input-id="productCostInput"
  data-price-input-id="productPriceInput"
  data-price-hint-id="productPriceHint"
  data-margin-alert-id="productMarginAlert"
  data-apply-recommended-btn-id="applyRecommendedPriceBtn"
  data-recommended-badge-id="productRecommendedPriceBadge"
  data-image-input-id="productImageInput"
  data-preview-id="productImagePreview"
  data-preview-empty-id="productImagePreviewEmpty"
  data-open-camera-btn-id="openProductCamera"
  data-capture-camera-btn-id="captureProductCamera"
  data-close-camera-btn-id="closeProductCamera"
  data-camera-wrap-id="productCameraWrap"
  data-camera-video-id="productCameraVideo"
></div>
@endsection
