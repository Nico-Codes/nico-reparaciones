@extends('layouts.app')

@section('title', 'Admin - Nuevo producto')

@section('content')
<div class="mx-auto w-full max-w-4xl">
  <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div class="page-head mb-0 w-full sm:w-auto">
      <div class="page-title">Nuevo producto</div>
      <div class="page-subtitle">Crea un producto con identificacion rapida para venta.</div>
    </div>

    <a href="{{ route('admin.products.index') }}" class="btn-outline h-11 w-full justify-center sm:h-auto sm:w-auto">Volver</a>
  </div>

  <form id="productFormCreate" method="POST" action="{{ route('admin.products.store') }}" enctype="multipart/form-data" class="space-y-4" data-disable-on-submit>
    @csrf

    <div class="card">
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

<script>
  (() => {
    const preventNegativeMargin = @json((bool) ($preventNegativeMargin ?? true));
    const priceResolveUrl = @json($priceResolveUrl ?? '');
    const categoryInput = document.querySelector('select[name=\"category_id\"]');
    const costInput = document.getElementById('productCostInput');
    const priceInput = document.getElementById('productPriceInput');
    const priceHint = document.getElementById('productPriceHint');
    const marginAlert = document.getElementById('productMarginAlert');
    const form = document.getElementById('productFormCreate');

    const input = document.getElementById('productImageInput');
    const preview = document.getElementById('productImagePreview');
    const empty = document.getElementById('productImagePreviewEmpty');
    const openCameraBtn = document.getElementById('openProductCamera');
    const captureCameraBtn = document.getElementById('captureProductCamera');
    const closeCameraBtn = document.getElementById('closeProductCamera');
    const cameraWrap = document.getElementById('productCameraWrap');
    const cameraVideo = document.getElementById('productCameraVideo');
    const canUseCamera = !!(input && preview && empty && openCameraBtn && captureCameraBtn && closeCameraBtn && cameraWrap && cameraVideo);
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
      if (!canUseCamera) return;
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
        if (!canUseCamera) return;
        cameraVideo.srcObject = stream;
        cameraWrap.classList.remove('hidden');
        captureCameraBtn.classList.remove('hidden');
        closeCameraBtn.classList.remove('hidden');
      } catch (_) {
        alert('No se pudo acceder a la camara. Revisa permisos del navegador.');
      }
    };

    if (canUseCamera) {
      input.addEventListener('change', async () => {
        const file = input.files && input.files[0] ? input.files[0] : null;
        if (!file) {
          preview.src = '';
          preview.classList.add('hidden');
          empty.classList.remove('hidden');
          return;
        }

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
    }

    window.addEventListener('beforeunload', stopCamera);

    const applyRecommendedBtn = document.getElementById('applyRecommendedPriceBtn');
    const recommendedBadge = document.getElementById('productRecommendedPriceBadge');
    let suggestedPrice = null;

    const money = (n) => {
      const value = Number.isFinite(n) ? n : 0;
      return '$ ' + new Intl.NumberFormat('es-AR').format(value);
    };

    const updateMarginGuardUI = () => {
      if (!costInput || !priceInput || !marginAlert) return true;
      const cost = parseInt(String(costInput.value || '').trim(), 10);
      const price = parseInt(String(priceInput.value || '').trim(), 10);

      marginAlert.classList.add('hidden');
      marginAlert.textContent = '';
      marginAlert.classList.remove('border-rose-200', 'bg-rose-50', 'text-rose-700', 'border-amber-200', 'bg-amber-50', 'text-amber-700', 'border-emerald-200', 'bg-emerald-50', 'text-emerald-700');

      if (!Number.isFinite(cost) || !Number.isFinite(price) || cost < 0 || price < 0) {
        return true;
      }

      const diff = price - cost;
      const marginPercent = cost > 0 ? ((diff / cost) * 100) : 0;
      const marginLabel = `${marginPercent >= 0 ? '+' : ''}${marginPercent.toFixed(1)}%`;

      if (price < cost) {
        marginAlert.classList.remove('hidden');
        marginAlert.classList.add('border-rose-200', 'bg-rose-50', 'text-rose-700');
        marginAlert.textContent = preventNegativeMargin
          ? `Atencion: margen ${marginLabel} (${money(diff)}). Con el guard activo no se puede guardar.`
          : `Atencion: margen ${marginLabel} (${money(diff)}).`;
        return !preventNegativeMargin;
      }

      if (price === cost) {
        marginAlert.classList.remove('hidden');
        marginAlert.classList.add('border-amber-200', 'bg-amber-50', 'text-amber-700');
        marginAlert.textContent = 'Margen 0.0% (sin utilidad).';
        return true;
      }

      marginAlert.classList.remove('hidden');
      marginAlert.classList.add('border-emerald-200', 'bg-emerald-50', 'text-emerald-700');
      marginAlert.textContent = `Margen ${marginLabel}. Utilidad: ${money(diff)}.`;
      return true;
    };

    const applyRecommendedPrice = async () => {
      if (!priceResolveUrl || !categoryInput || !costInput || !priceInput || !priceHint || !applyRecommendedBtn || !recommendedBadge) return;
      const categoryId = String(categoryInput.value || '').trim();
      const costRaw = String(costInput.value || '').trim();
      const costValue = parseInt(costRaw, 10);

      if (!categoryId || !Number.isFinite(costValue) || costValue < 0) {
        priceHint.textContent = 'Define categoria + costo para calcular automaticamente.';
        recommendedBadge.classList.add('hidden');
        applyRecommendedBtn.disabled = true;
        suggestedPrice = null;
        return;
      }

      const query = new URLSearchParams({
        category_id: categoryId,
        cost_price: String(costValue),
      });

      try {
        const response = await fetch(`${priceResolveUrl}?${query.toString()}`, {
          headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
          credentials: 'same-origin',
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data || !data.ok) {
          priceHint.textContent = 'No se pudo calcular precio recomendado.';
          recommendedBadge.classList.add('hidden');
          applyRecommendedBtn.disabled = true;
          suggestedPrice = null;
          return;
        }

        suggestedPrice = parseInt(String(data.recommended_price ?? '0'), 10);
        if (!Number.isFinite(suggestedPrice) || suggestedPrice < 0) {
          suggestedPrice = null;
          recommendedBadge.classList.add('hidden');
          applyRecommendedBtn.disabled = true;
          return;
        }

        recommendedBadge.textContent = `Recomendado: ${money(suggestedPrice)}`;
        recommendedBadge.classList.remove('hidden');
        applyRecommendedBtn.disabled = false;
        if (data.rule && data.rule.name) {
          priceHint.textContent = `Regla: ${data.rule.name} (${data.margin_percent}% margen).`;
        } else {
          priceHint.textContent = `Sin regla especifica. Margen base: ${data.margin_percent}%.`;
        }
      } catch (_) {
        priceHint.textContent = 'No se pudo calcular precio recomendado.';
        recommendedBadge.classList.add('hidden');
        applyRecommendedBtn.disabled = true;
        suggestedPrice = null;
      }
    };

    applyRecommendedBtn?.addEventListener('click', () => {
      if (!Number.isFinite(suggestedPrice)) return;
      priceInput.value = String(suggestedPrice);
      priceHint.textContent = 'Precio recomendado aplicado. Puedes ajustarlo manualmente si queres.';
      updateMarginGuardUI();
    });

    categoryInput?.addEventListener('change', applyRecommendedPrice);
    costInput?.addEventListener('input', applyRecommendedPrice);
    costInput?.addEventListener('input', updateMarginGuardUI);
    priceInput?.addEventListener('input', updateMarginGuardUI);
    form?.addEventListener('submit', (event) => {
      const ok = updateMarginGuardUI();
      if (!ok) {
        event.preventDefault();
        priceInput.focus();
      }
    });
    applyRecommendedPrice();
    updateMarginGuardUI();
  })();
</script>
@endsection
