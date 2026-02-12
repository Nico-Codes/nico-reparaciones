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

  <form method="POST" action="{{ route('admin.products.store') }}" enctype="multipart/form-data" class="space-y-4">
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
            <label>Precio *</label>
            <input name="price" class="h-11" required value="{{ old('price') }}" inputmode="decimal" placeholder="0">
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
    const input = document.getElementById('productImageInput');
    const preview = document.getElementById('productImagePreview');
    const empty = document.getElementById('productImagePreviewEmpty');
    const openCameraBtn = document.getElementById('openProductCamera');
    const captureCameraBtn = document.getElementById('captureProductCamera');
    const closeCameraBtn = document.getElementById('closeProductCamera');
    const cameraWrap = document.getElementById('productCameraWrap');
    const cameraVideo = document.getElementById('productCameraVideo');
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

    window.addEventListener('beforeunload', stopCamera);
  })();
</script>
@endsection
