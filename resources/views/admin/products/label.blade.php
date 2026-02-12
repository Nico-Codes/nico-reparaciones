<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Etiqueta producto #{{ $product->id }}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 20px; color: #111827; }
    .sheet { max-width: 420px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
    .name { font-weight: 700; font-size: 16px; line-height: 1.3; margin-bottom: 8px; }
    .meta { font-size: 12px; color: #4b5563; margin-bottom: 4px; }
    .code { font-size: 13px; font-weight: 700; margin-top: 10px; }
    .bar-wrap { margin: 12px 0 6px; text-align: center; }
    .actions { margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap; }
    .btn { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; background: #fff; cursor: pointer; font-size: 13px; }
    @media print {
      body { margin: 0; }
      .sheet { border: 0; border-radius: 0; padding: 0; max-width: none; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="name">{{ $product->name }}</div>
    <div class="meta">SKU: {{ $product->sku ?? '—' }}</div>
    <div class="meta">Barcode: {{ $product->barcode ?? '—' }}</div>
    <div class="meta">Precio: ${{ number_format((float) $product->price, 0, ',', '.') }}</div>
    <div class="bar-wrap">
      <svg id="product-barcode" aria-label="codigo de barras"></svg>
    </div>
    <div class="code">{{ $barcodeValue }}</div>
    <div class="actions">
      <button class="btn" onclick="window.print()">Imprimir</button>
      <button class="btn" onclick="window.close()">Cerrar</button>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
  <script>
    (function () {
      var value = @json($barcodeValue);
      var el = document.getElementById('product-barcode');
      if (!value || !el || typeof JsBarcode === 'undefined') return;

      try {
        JsBarcode(el, value, {
          format: 'CODE128',
          displayValue: false,
          height: 64,
          width: 1.7,
          margin: 0
        });
      } catch (e) {
        el.outerHTML = '<div style="font-size:12px;color:#6b7280;">No se pudo generar el codigo para este valor.</div>';
      }
    })();
  </script>
</body>
</html>
