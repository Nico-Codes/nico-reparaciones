@php
  $autoprint = (string)request('autoprint', '') === '1';
@endphp
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Etiqueta producto #{{ $product->id }}</title>
  @include('layouts.partials.standalone_vite_assets')
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 20px; color: #111827; }
    .sheet { max-width: 420px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
    .name { font-weight: 700; font-size: 16px; line-height: 1.3; margin-bottom: 8px; }
    .meta { font-size: 12px; color: #4b5563; margin-bottom: 4px; }
    .code { font-size: 13px; font-weight: 700; margin-top: 10px; }
    .bar-wrap { margin: 12px 0 6px; text-align: center; }
    .actions { margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap; }
    .btn { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; background: #fff; cursor: pointer; font-size: 13px; text-decoration:none; color:#111827; }
    .btn-primary { background:#0ea5e9; border-color:#0ea5e9; color:#fff; font-weight:700; }
    @media print {
      body { margin: 0; }
      .sheet { border: 0; border-radius: 0; padding: 0; max-width: none; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="sheet" data-react-product-label-barcode data-barcode-value="{{ $barcodeValue }}">
    <div class="name">{{ $product->name }}</div>
    <div class="meta">SKU: {{ $product->sku ?? '-' }}</div>
    <div class="meta">Barcode: {{ $product->barcode ?? '-' }}</div>
    <div class="meta">Precio: ${{ number_format((float) $product->price, 0, ',', '.') }}</div>
    <div class="bar-wrap">
      <svg id="product-barcode" aria-label="codigo de barras"></svg>
    </div>
    <div class="code">{{ $barcodeValue }}</div>
    <div class="actions">
      <button class="btn btn-primary" onclick="window.print()">Imprimir</button>
      <a class="btn" href="{{ route('admin.products.edit', $product) }}">Volver</a>
      <button class="btn" onclick="window.close()">Cerrar</button>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
  <div data-react-auto-print data-enabled="{{ $autoprint ? '1' : '0' }}" data-delay-ms="120"></div>
</body>
</html>
