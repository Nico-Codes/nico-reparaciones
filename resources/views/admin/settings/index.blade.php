@extends('layouts.app')

@section('content')
<div class="container">

    <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:center;">
        <h1 style="margin:0;">Configuración del negocio</h1>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <a href="{{ route('admin.whatsappTemplates.index') }}">Plantillas WhatsApp</a>
            <a href="{{ route('admin.dashboard') }}">← Volver</a>
        </div>
    </div>

    @if (session('success'))
        <div style="margin:12px 0; padding:10px; border:1px solid #cfe9cf; background:#eef9ee; border-radius:10px;">
            {{ session('success') }}
        </div>
    @endif

    @if ($errors->any())
        <div style="margin:12px 0; padding:10px; border:1px solid #f0c2c2; background:#ffecec; border-radius:10px;">
            <ul style="margin:0; padding-left:18px;">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <div style="margin:12px 0; padding:12px; border:1px solid #eee; border-radius:12px;">
        <h3 style="margin:0 0 8px;">Se usa en WhatsApp con estos placeholders</h3>
        <ul style="margin:0; padding-left:18px;">
            <li><code>{shop_address}</code> — Dirección del local</li>
            <li><code>{shop_hours}</code> — Horarios</li>
        </ul>
        <p style="margin:10px 0 0; color:#666;">
            Tip: en la plantilla de “Listo para retirar” poné Dirección/Horarios para que salga automático.
        </p>
    </div>

    <form method="POST" action="{{ route('admin.settings.update') }}" style="display:flex; flex-direction:column; gap:12px;">
        @csrf

        <div style="border:1px solid #eee; border-radius:12px; padding:12px;">
            <h3 style="margin:0 0 8px;">Dirección del local</h3>
            <textarea name="shop_address" rows="3" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:10px;"
            placeholder="Ej: San Martín 123, Carcarañá">{{ old('shop_address', $shopAddress) }}</textarea>
        </div>

        <div style="border:1px solid #eee; border-radius:12px; padding:12px;">
            <h3 style="margin:0 0 8px;">Horarios</h3>
            <textarea name="shop_hours" rows="3" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:10px;"
            placeholder="Ej: Lun a Vie 9:00–12:30 / 16:00–20:00 | Sáb 9:00–13:00">{{ old('shop_hours', $shopHours) }}</textarea>
        </div>

        <div>
            <button type="submit" style="border:1px solid #ddd; padding:10px 14px; border-radius:12px; background:#fff; cursor:pointer;">
                Guardar configuración
            </button>
        </div>
    </form>

</div>
@endsection
