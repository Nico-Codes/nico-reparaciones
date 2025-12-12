@extends('layouts.app')

@section('content')
<div style="max-width:1100px; margin:0 auto; padding:16px;">

    <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
        <h1 style="margin:0;">Panel Admin</h1>

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <a href="{{ route('admin.orders.index') }}" class="btn"
               style="padding:10px 14px; border-radius:12px; border:1px solid #eee; text-decoration:none;">
               📦 Pedidos
            </a>
            <a href="{{ route('admin.repairs.index') }}" class="btn"
               style="padding:10px 14px; border-radius:12px; border:1px solid #eee; text-decoration:none;">
               🛠️ Reparaciones
            </a>
            <a href="{{ route('admin.products.index') }}" class="btn"
               style="padding:10px 14px; border-radius:12px; border:1px solid #eee; text-decoration:none;">
               🧩 Productos
            </a>
            <a href="{{ route('admin.categories.index') }}" class="btn"
               style="padding:10px 14px; border-radius:12px; border:1px solid #eee; text-decoration:none;">
               🗂️ Categorías
            </a>
        </div>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:14px; margin-top:16px;">
        <div style="border:1px solid #eee; border-radius:16px; padding:14px;">
            <div style="font-size:13px; opacity:.75;">Pedidos totales</div>
            <div style="font-size:28px; font-weight:700;">{{ $ordersTotal }}</div>
            <div style="margin-top:10px; font-size:13px;">
                Pendientes (pendiente/confirmado/preparando/listo): <b>{{ $ordersPending }}</b>
            </div>
            <div style="margin-top:10px;">
                <a href="{{ route('admin.orders.index') }}" style="text-decoration:none;">Ver pedidos →</a>
            </div>
        </div>

        <div style="border:1px solid #eee; border-radius:16px; padding:14px;">
            <div style="font-size:13px; opacity:.75;">Reparaciones</div>
            @if($repairsEnabled)
                <div style="font-size:28px; font-weight:700;">{{ $repairsTotal }}</div>
                <div style="margin-top:10px; font-size:13px;">
                    Activas (≠ entregado/cancelado): <b>{{ $repairsActive }}</b>
                </div>
                <div style="margin-top:10px;">
                    <a href="{{ route('admin.repairs.index') }}" style="text-decoration:none;">Ver reparaciones →</a>
                </div>
            @else
                <div style="margin-top:8px; font-size:14px;">
                    No detecté tabla/modelo de reparaciones en este entorno.
                </div>
            @endif
        </div>

        <div style="border:1px solid #eee; border-radius:16px; padding:14px;">
            <div style="font-size:13px; opacity:.75;">Stock bajo</div>
            <div style="font-size:28px; font-weight:700;">≤ {{ $lowStockThreshold }}</div>
            <div style="margin-top:10px; font-size:13px;">
                Productos en alerta: <b>{{ $lowStockProducts->count() }}</b>
            </div>
            <div style="margin-top:10px;">
                <a href="{{ route('admin.products.index') }}" style="text-decoration:none;">Administrar productos →</a>
            </div>
        </div>
    </div>

    {{-- Mini listados --}}
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap:14px; margin-top:14px;">

        <div style="border:1px solid #eee; border-radius:16px; padding:14px;">
            <h3 style="margin:0 0 10px;">Pedidos por estado</h3>

            @if(!empty($orderStatusCounts))
                <div style="display:flex; flex-direction:column; gap:8px;">
                    @foreach($orderStatusCounts as $status => $total)
                        <div style="display:flex; justify-content:space-between; gap:10px; border:1px solid #f2f2f2; padding:10px; border-radius:12px;">
                            <div><b>{{ $status }}</b></div>
                            <div>{{ $total }}</div>
                        </div>
                    @endforeach
                </div>
            @else
                <div style="opacity:.75;">Sin datos.</div>
            @endif
        </div>

        <div style="border:1px solid #eee; border-radius:16px; padding:14px;">
            <h3 style="margin:0 0 10px;">Stock bajo (≤ {{ $lowStockThreshold }})</h3>

            @if($lowStockProducts->count())
                <div style="display:flex; flex-direction:column; gap:8px;">
                    @foreach($lowStockProducts as $p)
                        <div style="display:flex; justify-content:space-between; gap:10px; border:1px solid #f2f2f2; padding:10px; border-radius:12px;">
                            <div>
                                <div style="font-weight:700;">{{ $p->name }}</div>
                                <div style="font-size:12px; opacity:.75;">{{ $p->category->name ?? 'Sin categoría' }}</div>
                            </div>
                            <div style="font-weight:700;">{{ $p->stock }}</div>
                        </div>
                    @endforeach
                </div>
            @else
                <div style="opacity:.75;">Todo ok, no hay productos en alerta.</div>
            @endif
        </div>

    </div>

</div>
@endsection
