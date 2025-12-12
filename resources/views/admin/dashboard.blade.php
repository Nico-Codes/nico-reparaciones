@extends('layouts.app')

@section('content')
<div style="max-width:1100px; margin:0 auto; padding:16px; display:flex; flex-direction:column; gap:16px;">

    <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
        <h1 style="margin:0;">Panel Admin</h1>

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <a href="{{ route('admin.orders.index') }}" style="padding:10px 12px; border:1px solid #eee; border-radius:12px; text-decoration:none;">
                Pedidos
            </a>
            <a href="{{ route('admin.repairs.index') }}" style="padding:10px 12px; border:1px solid #eee; border-radius:12px; text-decoration:none;">
                Reparaciones
            </a>
            <a href="{{ route('admin.products.index') }}" style="padding:10px 12px; border:1px solid #eee; border-radius:12px; text-decoration:none;">
                Productos
            </a>
            <a href="{{ route('admin.categories.index') }}" style="padding:10px 12px; border:1px solid #eee; border-radius:12px; text-decoration:none;">
                Categorías
            </a>
        </div>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:12px;">
        <div style="border:1px solid #eee; border-radius:14px; padding:14px;">
            <div style="font-size:13px; color:#666;">Pedidos activos</div>
            <div style="font-size:28px; font-weight:700;">{{ $ordersActiveCount }}</div>
            <div style="margin-top:8px;">
                <a href="{{ route('admin.orders.index') }}" style="text-decoration:none;">Ver pedidos →</a>
            </div>
        </div>

        <div style="border:1px solid #eee; border-radius:14px; padding:14px;">
            <div style="font-size:13px; color:#666;">Pedidos hoy</div>
            <div style="font-size:28px; font-weight:700;">{{ $ordersTodayCount }}</div>
            <div style="margin-top:8px;">
                <a href="{{ route('admin.orders.index') }}" style="text-decoration:none;">Ir a pedidos →</a>
            </div>
        </div>

        <div style="border:1px solid #eee; border-radius:14px; padding:14px;">
            <div style="font-size:13px; color:#666;">Reparaciones activas</div>
            <div style="font-size:28px; font-weight:700;">{{ $repairsActiveCount }}</div>
            <div style="margin-top:8px;">
                <a href="{{ route('admin.repairs.index') }}" style="text-decoration:none;">Ver reparaciones →</a>
            </div>
        </div>

        <div style="border:1px solid #eee; border-radius:14px; padding:14px;">
            <div style="font-size:13px; color:#666;">Stock bajo (≤ {{ $lowStockThreshold }})</div>
            <div style="font-size:28px; font-weight:700;">{{ $lowStockProducts->count() }}</div>
            <div style="margin-top:8px;">
                <a href="{{ route('admin.products.index') }}" style="text-decoration:none;">Gestionar productos →</a>
            </div>
        </div>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:12px;">
        <div style="border:1px solid #eee; border-radius:14px; padding:14px;">
            <h3 style="margin:0 0 10px;">Últimos pedidos</h3>

            @if($latestOrders->isEmpty())
                <div style="color:#666;">No hay pedidos aún.</div>
            @else
                <div style="display:flex; flex-direction:column; gap:8px;">
                    @foreach($latestOrders as $o)
                        <a href="{{ route('admin.orders.show', $o) }}" style="text-decoration:none; border:1px solid #f0f0f0; padding:10px; border-radius:12px;">
                            <div style="display:flex; justify-content:space-between; gap:10px;">
                                <div>
                                    <div style="font-weight:600;">Pedido #{{ $o->id }}</div>
                                    <div style="font-size:13px; color:#666;">Estado: {{ $o->status }}</div>
                                </div>
                                <div style="font-size:13px; color:#666;">
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

            @if($latestRepairs->isEmpty())
                <div style="color:#666;">No hay reparaciones aún.</div>
            @else
                <div style="display:flex; flex-direction:column; gap:8px;">
                    @foreach($latestRepairs as $r)
                        <a href="{{ route('admin.repairs.show', $r) }}" style="text-decoration:none; border:1px solid #f0f0f0; padding:10px; border-radius:12px;">
                            <div style="display:flex; justify-content:space-between; gap:10px;">
                                <div>
                                    <div style="font-weight:600;">Reparación #{{ $r->id }}</div>
                                    <div style="font-size:13px; color:#666;">Estado: {{ $r->status }}</div>
                                </div>
                                <div style="font-size:13px; color:#666;">
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
            <div style="color:#666;">Todo bien: no hay productos con stock ≤ {{ $lowStockThreshold }}.</div>
        @else
            <div style="display:flex; flex-direction:column; gap:8px;">
                @foreach($lowStockProducts as $p)
                    <div style="display:flex; justify-content:space-between; gap:12px; border:1px solid #f0f0f0; padding:10px; border-radius:12px;">
                        <div style="font-weight:600;">{{ $p->name ?? ('Producto #'.$p->id) }}</div>
                        <div style="color:#666;">Stock: <b>{{ $p->stock }}</b></div>
                    </div>
                @endforeach
            </div>
        @endif
    </div>

</div>
@endsection
