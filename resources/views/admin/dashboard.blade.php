@extends('layouts.app')

@section('content')
<div style="max-width:1100px; margin:0 auto; padding:16px;">
    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <h2 style="margin:0;">Panel Admin</h2>

        <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <a href="{{ route('admin.orders.index') }}"
               style="padding:10px 12px; border-radius:12px; border:1px solid #e5e5e5; background:#fff; text-decoration:none;">
               📦 Pedidos
            </a>

            <a href="{{ route('admin.repairs.index') }}"
               style="padding:10px 12px; border-radius:12px; border:1px solid #e5e5e5; background:#fff; text-decoration:none;">
               🛠️ Reparaciones
            </a>

            <a href="{{ route('store.index') }}"
               style="padding:10px 12px; border-radius:12px; border:1px solid #e5e5e5; background:#fff; text-decoration:none;">
               🛒 Ver tienda
            </a>

            <form method="POST" action="{{ route('logout') }}" style="margin:0;">
                @csrf
                <button type="submit"
                        style="padding:10px 12px; border-radius:12px; border:1px solid #ffdddd; background:#fff; cursor:pointer;">
                    🚪 Salir
                </button>
            </form>
        </div>
    </div>

    <div style="margin-top:14px; display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
        <div style="border:1px solid #eee; border-radius:16px; padding:14px; background:#fff;">
            <div style="font-size:13px; opacity:.7;">Pedidos (total)</div>
            <div style="font-size:28px; font-weight:700;">{{ $stats['orders_total'] ?? 0 }}</div>
            <div style="margin-top:8px; font-size:13px;">
                Pendientes: <b>{{ $stats['orders_pending'] ?? 0 }}</b>
            </div>
        </div>

        <div style="border:1px solid #eee; border-radius:16px; padding:14px; background:#fff;">
            <div style="font-size:13px; opacity:.7;">Reparaciones (total)</div>
            <div style="font-size:28px; font-weight:700;">{{ $stats['repairs_total'] ?? 0 }}</div>
            <div style="margin-top:8px; font-size:13px; opacity:.8;">
                Por estado abajo 👇
            </div>
        </div>

        <div style="border:1px solid #eee; border-radius:16px; padding:14px; background:#fff;">
            <div style="font-size:13px; opacity:.7;">Productos (total)</div>
            <div style="font-size:28px; font-weight:700;">{{ $stats['products_total'] ?? 0 }}</div>
            <div style="margin-top:8px; font-size:13px; opacity:.8;">
                (cuando sumemos admin productos, va a servir mucho)
            </div>
        </div>
    </div>

    <div style="margin-top:16px; display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:12px;">
        <div style="border:1px solid #eee; border-radius:16px; padding:14px; background:#fff;">
            <h3 style="margin:0 0 10px;">Pedidos por estado</h3>

            @if(empty($orderCounts))
                <div style="opacity:.7;">No hay datos todavía.</div>
            @else
                <div style="display:flex; flex-direction:column; gap:6px;">
                    @foreach($orderCounts as $st => $cnt)
                        <div style="display:flex; justify-content:space-between; border:1px solid #f1f1f1; padding:8px 10px; border-radius:12px;">
                            <span>{{ $st }}</span>
                            <b>{{ $cnt }}</b>
                        </div>
                    @endforeach
                </div>
            @endif
        </div>

        <div style="border:1px solid #eee; border-radius:16px; padding:14px; background:#fff;">
            <h3 style="margin:0 0 10px;">Reparaciones por estado</h3>

            @if(empty($repairCounts))
                <div style="opacity:.7;">No hay datos todavía.</div>
            @else
                <div style="display:flex; flex-direction:column; gap:6px;">
                    @foreach($repairCounts as $st => $cnt)
                        <div style="display:flex; justify-content:space-between; border:1px solid #f1f1f1; padding:8px 10px; border-radius:12px;">
                            <span>{{ $st }}</span>
                            <b>{{ $cnt }}</b>
                        </div>
                    @endforeach
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
