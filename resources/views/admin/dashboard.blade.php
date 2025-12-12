@extends('layouts.app')

@section('content')
<div style="max-width:1100px; margin:0 auto; padding:16px;">
    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <h1 style="margin:0;">Panel Admin</h1>

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
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

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:12px; margin-top:16px;">
        <div style="border:1px solid #eee; border-radius:16px; padding:14px;">
            <h3 style="margin:0 0 8px;">Pedidos</h3>
            <div style="font-size:28px; font-weight:700;">{{ $ordersTotal }}</div>
            <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
                @foreach(($ordersByStatus ?? []) as $st => $qty)
                    <span style="padding:6px 10px; border-radius:999px; border:1px solid #eee; font-size:12px;">
                        {{ $st }}: <b>{{ $qty }}</b>
                    </span>
                @endforeach
            </div>
        </div>

        <div style="border:1px solid #eee; border-radius:16px; padding:14px;">
            <h3 style="margin:0 0 8px;">Reparaciones</h3>
            <div style="font-size:28px; font-weight:700;">{{ $repairsTotal }}</div>
            <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
                @foreach(($repairsByStatus ?? []) as $st => $qty)
                    <span style="padding:6px 10px; border-radius:999px; border:1px solid #eee; font-size:12px;">
                        {{ $st }}: <b>{{ $qty }}</b>
                    </span>
                @endforeach
            </div>
        </div>

        <div style="border:1px solid #eee; border-radius:16px; padding:14px;">
            <h3 style="margin:0 0 8px;">Stock bajo (≤ 3)</h3>

            @if(($lowStockProducts ?? collect())->count() === 0)
                <p style="margin:0; color:#666;">Sin alertas por ahora.</p>
            @else
                <div style="display:flex; flex-direction:column; gap:8px;">
                    @foreach($lowStockProducts as $p)
                        <div style="display:flex; justify-content:space-between; gap:10px; border:1px solid #f3f3f3; border-radius:12px; padding:10px;">
                            <div style="min-width:0;">
                                <div style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    {{ $p->name ?? ('Producto #' . ($p->id ?? '')) }}
                                </div>
                                <div style="font-size:12px; color:#777;">
                                    ID: {{ $p->id ?? '-' }}
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-weight:700;">Stock: {{ $p->stock ?? '-' }}</div>
                            </div>
                        </div>
                    @endforeach
                </div>
            @endif
        </div>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap:12px; margin-top:16px;">
        <div style="border:1px solid #eee; border-radius:16px; padding:14px;">
            <h3 style="margin:0 0 10px;">Últimos pedidos</h3>
            @if(($latestOrders ?? collect())->count() === 0)
                <p style="margin:0; color:#666;">Todavía no hay pedidos.</p>
            @else
                <div style="display:flex; flex-direction:column; gap:8px;">
                    @foreach($latestOrders as $o)
                        <a href="{{ route('admin.orders.show', $o->id) }}"
                           style="text-decoration:none; color:inherit; border:1px solid #f3f3f3; border-radius:12px; padding:10px; display:block;">
                            <div style="display:flex; justify-content:space-between; gap:10px;">
                                <div><b>#{{ $o->id }}</b> — {{ $o->status ?? '-' }}</div>
                                <div style="color:#666; font-size:12px;">
                                    {{ $o->created_at ?? '' }}
                                </div>
                            </div>
                        </a>
                    @endforeach
                </div>
            @endif
        </div>

        <div style="border:1px solid #eee; border-radius:16px; padding:14px;">
            <h3 style="margin:0 0 10px;">Últimas reparaciones</h3>
            @if(($latestRepairs ?? collect())->count() === 0)
                <p style="margin:0; color:#666;">Todavía no hay reparaciones.</p>
            @else
                <div style="display:flex; flex-direction:column; gap:8px;">
                    @foreach($latestRepairs as $r)
                        <a href="{{ route('admin.repairs.show', $r->id) }}"
                           style="text-decoration:none; color:inherit; border:1px solid #f3f3f3; border-radius:12px; padding:10px; display:block;">
                            <div style="display:flex; justify-content:space-between; gap:10px;">
                                <div>
                                    <b>#{{ $r->id }}</b>
                                    — {{ $r->status ?? '-' }}
                                    @if(!empty($r->customer_name))
                                        <span style="color:#666;">({{ $r->customer_name }})</span>
                                    @endif
                                </div>
                                <div style="color:#666; font-size:12px;">
                                    {{ $r->created_at ?? '' }}
                                </div>
                            </div>
                            @if(!empty($r->tracking_code))
                                <div style="color:#777; font-size:12px; margin-top:6px;">
                                    Código: <b>{{ $r->tracking_code }}</b>
                                </div>
                            @endif
                        </a>
                    @endforeach
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
