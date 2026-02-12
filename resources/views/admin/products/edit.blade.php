@extends('layouts.app')

@section('title', 'Admin - Editar producto')

@section('content')
@php
  $hasImage = !empty($product->image_url);
@endphp

<div class="mx-auto w-full max-w-4xl">
  <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div class="page-head mb-0 w-full sm:w-auto">
      <div class="page-title">Editar producto</div>
      <div class="page-subtitle">Actualiza identificacion, precio, stock, categoria e imagen.</div>
    </div>

    <div class="flex w-full gap-2 flex-wrap sm:w-auto">
      <a href="{{ route('admin.products.label', $product) }}" class="btn-outline h-11 w-full justify-center sm:w-auto" target="_blank" rel="noopener">Etiqueta</a>
      <a href="{{ route('admin.products.index') }}" class="btn-outline h-11 w-full justify-center sm:w-auto">Volver</a>
    </div>
  </div>

  <form id="productForm" method="POST" action="{{ route('admin.products.update', $product) }}" enctype="multipart/form-data" class="space-y-4">
    @csrf
    @method('PUT')

    <div class="card">
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
            <label>Precio de costo *</label>
            <input id="productCostInputEdit" name="cost_price" class="h-11" required value="{{ old('cost_price', $product->cost_price ?? $product->price) }}" inputmode="decimal" placeholder="0">
          </div>

          <div class="space-y-1">
            <label>Precio de venta (recomendado)</label>
            <input id="productPriceInputEdit" name="price" class="h-11" value="{{ old('price', $product->price) }}" inputmode="decimal" placeholder="Se completa automatico">
            <div id="productPriceHintEdit" class="text-xs text-zinc-500">Ajusta costo/categoria para recalcular precio recomendado.</div>
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
    <form method="POST" action="{{ route('admin.products.destroy', $product) }}" onsubmit="return confirm('¿Eliminar producto?');">
      @csrf
      @method('DELETE')
      <button class="btn-danger h-11 w-full justify-center sm:w-auto" type="submit">Eliminar producto</button>
    </form>

    <button class="btn-primary h-11 w-full justify-center sm:w-auto" form="productForm" type="submit">Guardar cambios</button>
  </div>
</div>

<script>
  (() => {
    const priceResolveUrl = @json($priceResolveUrl ?? '');
    const categoryInput = document.querySelector('select[name=\"category_id\"]');
    const costInput = document.getElementById('productCostInputEdit');
    const priceInput = document.getElementById('productPriceInputEdit');
    const priceHint = document.getElementById('productPriceHintEdit');
    const productId = @json((int) $product->id);

    const input = document.getElementById('productImageInputEdit');
    const preview = document.getElementById('productImagePreviewEdit');
    const empty = document.getElementById('productImagePreviewEmptyEdit');
    const openCameraBtn = document.getElementById('openProductCameraEdit');
    const captureCameraBtn = document.getElementById('captureProductCameraEdit');
    const closeCameraBtn = document.getElementById('closeProductCameraEdit');
    const cameraWrap = document.getElementById('productCameraWrapEdit');
    const cameraVideo = document.getElementById('productCameraVideoEdit');
    if (!input || !preview || !empty || !openCameraBtn || !captureCameraBtn || !closeCameraBtn || !cameraWrap || !cameraVideo) return;

    let stream = null;

    const toPreview = (file) => {
      const objectUrl = URL.createObjectURL(file);
      preview.src = objectUrl;
      preview.classList.remove('hidden');
      empty.classList.add('hidden');
    };

    const loadImage = (file) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

    const cropToSquare = async (file) => {
      const img = await loadImage(file);
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = Math.floor((img.naturalWidth - side) / 2);
      const sy = Math.floor((img.naturalHeight - side) / 2);
      const canvas = document.createElement('canvas');
      canvas.width = side;
      canvas.height = side;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, side, side);

      const type = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ? file.type : 'image/jpeg';
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.9));
      if (!blob) return null;

      const ext = type === 'image/png' ? 'png' : (type === 'image/webp' ? 'webp' : 'jpg');
      const name = (file.name || 'producto').replace(/\.[^.]+$/, '');
      return new File([blob], `${name}_square.${ext}`, { type });
    };

    const setInputFile = (file) => {
      if (typeof DataTransfer !== 'undefined') {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
      }
    };

    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      stream = null;
      cameraVideo.srcObject = null;
      cameraWrap.classList.add('hidden');
      captureCameraBtn.classList.add('hidden');
      closeCameraBtn.classList.add('hidden');
    };

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Tu navegador no soporta camara web.');
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        cameraVideo.srcObject = stream;
        cameraWrap.classList.remove('hidden');
        captureCameraBtn.classList.remove('hidden');
        closeCameraBtn.classList.remove('hidden');
      } catch (_) {
        alert('No se pudo acceder a la camara. Revisa permisos del navegador.');
      }
    };

    input.addEventListener('change', async () => {
      const file = input.files && input.files[0] ? input.files[0] : null;
      if (!file) return;

      let finalFile = file;
      try {
        if (file.type.startsWith('image/')) {
          const cropped = await cropToSquare(file);
          if (cropped) {
            finalFile = cropped;
            setInputFile(cropped);
          }
        }
      } catch (_) {
        finalFile = file;
      }

      toPreview(finalFile);
    });

    openCameraBtn.addEventListener('click', startCamera);
    closeCameraBtn.addEventListener('click', stopCamera);
    captureCameraBtn.addEventListener('click', async () => {
      if (!cameraVideo.videoWidth || !cameraVideo.videoHeight) return;

      const side = Math.min(cameraVideo.videoWidth, cameraVideo.videoHeight);
      const sx = Math.floor((cameraVideo.videoWidth - side) / 2);
      const sy = Math.floor((cameraVideo.videoHeight - side) / 2);
      const canvas = document.createElement('canvas');
      canvas.width = side;
      canvas.height = side;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(cameraVideo, sx, sy, side, side, 0, 0, side, side);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) return;

      const file = new File([blob], `producto_${Date.now()}_square.jpg`, { type: 'image/jpeg' });
      setInputFile(file);
      toPreview(file);
      stopCamera();
    });

    window.addEventListener('beforeunload', stopCamera);

    const applyRecommendedPrice = async () => {
      if (!priceResolveUrl || !categoryInput || !costInput || !priceInput || !priceHint) return;
      const categoryId = String(categoryInput.value || '').trim();
      const costRaw = String(costInput.value || '').trim();
      const costValue = parseInt(costRaw, 10);

      if (!categoryId || !Number.isFinite(costValue) || costValue < 0) {
        priceHint.textContent = 'Ajusta costo/categoria para recalcular precio recomendado.';
        return;
      }

      const query = new URLSearchParams({
        category_id: categoryId,
        cost_price: String(costValue),
        product_id: String(productId),
      });

      try {
        const response = await fetch(`${priceResolveUrl}?${query.toString()}`, {
          headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
          credentials: 'same-origin',
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data || !data.ok) {
          priceHint.textContent = 'No se pudo calcular precio recomendado.';
          return;
        }

        priceInput.value = String(data.recommended_price ?? '');
        if (data.rule && data.rule.name) {
          priceHint.textContent = `Regla: ${data.rule.name} (${data.margin_percent}% margen).`;
        } else {
          priceHint.textContent = `Sin regla especifica. Margen base: ${data.margin_percent}%.`;
        }
      } catch (_) {
        priceHint.textContent = 'No se pudo calcular precio recomendado.';
      }
    };

    categoryInput?.addEventListener('change', applyRecommendedPrice);
    costInput?.addEventListener('input', applyRecommendedPrice);
    applyRecommendedPrice();
  })();
</script>
@endsection
