<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Codigos de recuperacion 2FA</title>
  <style>
    :root {
      color-scheme: light;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.4;
    }
    .page {
      max-width: 760px;
      margin: 28px auto;
      padding: 0 20px 24px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.02em;
    }
    .meta {
      color: #475569;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .warning {
      border: 1px solid #fbbf24;
      background: #fffbeb;
      color: #92400e;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .codes {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .code {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 12px;
      font-family: "Consolas", "Courier New", monospace;
      font-size: 16px;
      letter-spacing: 0.08em;
      font-weight: 700;
      text-align: center;
      background: #f8fafc;
    }
    .actions {
      margin-top: 20px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 14px;
      background: #ffffff;
      color: #0f172a;
      cursor: pointer;
      text-decoration: none;
    }
    .btn-primary {
      background: #0ea5e9;
      border-color: #0284c7;
      color: #ffffff;
      font-weight: 700;
    }
    @media (max-width: 640px) {
      .codes {
        grid-template-columns: 1fr;
      }
      .code {
        font-size: 15px;
      }
    }
    @media print {
      .actions {
        display: none !important;
      }
      .page {
        margin: 0;
        max-width: none;
        padding: 0;
      }
      body {
        background: #ffffff;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <h1>Codigos de recuperacion 2FA (Admin)</h1>
    <div class="meta">
      Cuenta: {{ $accountEmail }}<br>
      Generado: {{ $generatedAt->format('d/m/Y H:i:s') }}
    </div>

    <div class="warning">
      Cada codigo se usa una sola vez. Guardalos offline en un lugar seguro y no los compartas.
    </div>

    <div class="codes">
      @foreach($codes as $code)
        <div class="code">{{ $code }}</div>
      @endforeach
    </div>

    <div class="actions">
      <button type="button" class="btn btn-primary" onclick="window.print()">Imprimir / Guardar PDF</button>
      <a class="btn" href="{{ route('admin.two_factor.settings') }}">Volver a seguridad 2FA</a>
    </div>
  </div>
</body>
</html>
