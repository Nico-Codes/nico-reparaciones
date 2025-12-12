@extends('layouts.app')

@section('content')
<div style="max-width:1100px; margin:0 auto; padding:16px; display:flex; flex-direction:column; gap:14px;">

    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <h1 style="margin:0;">Panel Admin</h1>

        <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <a href="{{ route('admin.orders.index') }}" style="padding:10px 12px; border:1px solid #eee; border-radius:12px; text-decoration:none;">
                📦 Pedidos
            </a>
            <a href="{{ route('admin.repairs.index') }}" style="padding:10px 12px; border:1px solid #eee; border-radius:12px; text-decoration:none;">
                🛠️ Reparaciones
            </a>
            <a href="{{ route('admin.products.index') }}" style="padding:10px 12px; border:1px solid #eee; border-radius:12px; text-decoration:none;">
                🧾 Productos
            </a>
            <a href="{{ route('admin.categories.index') }}" style="padding:10px 12px; border:1px solid #eee; border-radius:12px; text-decoration:none;">
                🗂️ Categorías
            </a>
        </div>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
        <a href="{{ route('admin.orders.index') }}" style="border:1px solid #eee; border-radius:14px; padding:14px; text-decoration:none; display:block;">
            <div style="font-size:13px; opacity:.75;">Pedidos abiertos</div>
            <div style="font-size:28px; font-weight:700;">{{ $ordersOpenCount }}</div>
            <div style="font-size:13px; opacity:.75;">Pendiente / Confirmado / Preparando / Listo</div>
        </a>

        <a href="{{ route('admin.repairs.index') }}" style="border:1px solid #eee; border-radius:14px; padding:14px; text-decoration:none; display:block;">
            <div style="font-size:13px; opacity:.75;">Reparaciones abiertas</div>
            <div style="font-size:28px; font-weight:700;">{{ $repairsOpenCount }}</div>
            <div style="font-size:13px; opacity:.75;">En progreso (no cerradas)</div>
        </a>

        <a href="{{ route('admin.products.index') }}" style="border:1px solid #eee; border-radius:14px; padding:14px; text-decoration:none; display:block;">
            <div style="font-size:13px; opacity:.75;">Stock bajo</div>
            <div style="font-size:28px; font-weight:700;">{{ $lowStockProducts->count() }}</div>
            <div style="font-size:13px; opacity:.75;">≤ {{ $lowStockThreshold }} unidades (top 10)</div>
        </a>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:12px;">
        <div style="border:1px solid #eee; border-radius:14px; padding:14px;">
            <h3 style="margin:0 0 10px;">Últimos pedidos</h3>

            @if($recentOrders->isEmpty())
                <div style="opacity:.7;">No hay pedidos todavía.</div>
            @else
                <div style="display:flex; flex-direction:column; gap:8px;">
                    @foreach($recentOrders as $o)
                        <a href="{{ route('admin.orders.show', $o) }}" style="text-decoration:none; border:1px solid #f2f2f2; border-radius:12px; padding:10px; display:block;">
                            <div style="display:flex; justify-content:space-between; gap:10px;">
                                <div>
                                    <b>#{{ $o->id }}</b>
                                    <span style="opacity:.7;">— {{ $o->status ?? 'sin estado' }}</span>
                                </div>
                                <div style="opacity:.7; font-size:12px;">
                                    {{ optional($o->created_at)->format('d/m H:i') }}
                                </div>
                            </div>
                        </a>
                    @endforeach
                </div>
            @endif
        </div>

        <div style="border:1px solid #eee; border-radius:14px; padding:14px;">
            <h3 style="margin:0 0 10px;">Últimas reparaciones</h3>

            @if($recentRepairs->isEmpty())
                <div style="opacity:.7;">No hay reparaciones todavía.</div>
            @else
                <div style="display:flex; flex-direction:column; gap:8px;">
                    @foreach($recentRepairs as $r)
                        <a href="{{ route('admin.repairs.show', $r) }}" style="text-decoration:none; border:1px solid #f2f2f2; border-radius:12px; padding:10px; display:block;">
                            <div style="display:flex; justify-content:space-between; gap:10px;">
                                <div>
                                    <b>#{{ $r->id }}</b>
                                    <span style="opacity:.7;">— {{ $r->status ?? 'sin estado' }}</span>
                                </div>
                                <div style="opacity:.7; font-size:12px;">
                                    {{ optional($r->created_at)->format('d/m H:i') }}
                                </div>
                            </div>
                        </a>
                    @endforeach
                </div>
            @endif
        </div>
    </div>

    <div style="border:1px solid #eee; border-radius:14px; padding:14px;">
        <h3 style="margin:0 0 10px;">Productos con stock bajo</h3>

        @if($lowStockProducts->isEmpty())
            <div style="opacity:.7;">Todo OK, no hay stock bajo.</div>
        @else
            <div style="display:flex; flex-direction:column; gap:8px;">
                @foreach($lowStockProducts as $p)
                    <div style="display:flex; justify-content:space-between; gap:10px; border:1px solid #f2f2f2; border-radius:12px; padding:10px;">
                        <div style="min-width:0;">
                            <div style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                {{ $p->name ?? $p->title ?? ('Producto #' . $p->id) }}
                            </div>
                            <div style="opacity:.7; font-size:12px;">
                                ID: {{ $p->id }}
                            </div>
                        </div>
                        <div style="font-weight:700;">
                            {{ $p->stock ?? 0 }}
                        </div>
                    </div>
                @endforeach
            </div>
        @endif
    </div>

</div>
@endsection
