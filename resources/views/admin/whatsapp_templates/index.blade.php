@extends('layouts.app')

@section('content')
<div class="container">
    <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:center;">
        <h1 style="margin:0;">Plantillas WhatsApp</h1>
        <a href="{{ route('admin.dashboard') }}">← Volver al panel</a>
    </div>

    @if (session('success'))
        <div style="margin:12px 0; padding:10px; border:1px solid #cfe9cf; background:#eef9ee; border-radius:10px;">
            {{ session('success') }}
        </div>
    @endif

    <div style="margin:12px 0; padding:12px; border:1px solid #eee; border-radius:12px;">
        <h3 style="margin:0 0 8px;">Placeholders disponibles</h3>
        <ul style="margin:0; padding-left:18px;">
            @foreach($placeholders as $k => $desc)
                <li><code>{{ $k }}</code> — {{ $desc }}</li>
            @endforeach
        </ul>
        <p style="margin:10px 0 0; color:#666;">
            Tip: si dejás una plantilla vacía, se guarda automáticamente el “default” del sistema.
        </p>
    </div>

    <form method="POST" action="{{ route('admin.whatsappTemplates.update') }}">
        @csrf

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:12px;">
            @foreach($statuses as $key => $label)
                <div style="border:1px solid #eee; border-radius:12px; padding:12px;">
                    <h3 style="margin:0 0 8px;">{{ $label }} <small style="color:#888;">({{ $key }})</small></h3>

                    <textarea
                        name="templates[{{ $key }}]"
                        rows="8"
                        style="width:100%; padding:10px; border:1px solid #ddd; border-radius:10px;"
                    >{{ old("templates.$key", $templates[$key] ?? '') }}</textarea>
                </div>
            @endforeach
        </div>

        <div style="margin-top:14px;">
            <button type="submit" style="border:1px solid #ddd; padding:10px 14px; border-radius:12px; background:#fff; cursor:pointer;">
                Guardar plantillas
            </button>
        </div>
    </form>
</div>
@endsection
