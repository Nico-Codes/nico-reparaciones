@extends('layouts.app')

@section('content')
<div class="container" style="max-width:1100px;">

    <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;">
        <div>
            <h1 style="margin:0;">Panel Admin</h1>
            <div style="color:#666;margin-top:4px;">Resumen rápido del negocio</div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <a href="{{ route('admin.orders.index') }}">Ver pedidos</a>
            <a href="{{ route('admin.repairs.index') }}">Ver reparaciones</a>
            <a href="{{ route('admin.repairs.create') }}">+ Crear reparación</a>
        </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:14px;">
        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <div style="font-size:12px;color:#666;">Pedidos (total)</div>
            <div style="font-size:28px;font-weight:900;line-height:1.1;">{{ $ordersTotal }}</div>
            <div style="margin-top:10px;">
                <a href="{{ route('admin.orders.index') }}">Ir a pedidos →</a>
            </div>
        </div>

        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <div style="font-size:12px;color:#666;">Reparaciones (total)</div>
            <div style="font-size:28px;font-weight:900;line-height:1.1;">{{ $repairsTotal }}</div>
            <div style="margin-top:10px;">
                <a href="{{ route('admin.repairs.index') }}">Ir a reparaciones →</a>
            </div>
        </div>

        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <div style="font-size:12px;color:#666;">Stock bajo (≤ {{ $lowStockThreshold }})</div>
            <div style="font-size:28px;font-weight:900;line-height:1.1;">{{ $lowStockCount }}</div>
            <div style="margin-top:10px;color:#666;font-size:12px;">Muestra hasta 10 productos abajo</div>
        </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr;gap:12px;margin-top:14px;">
        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <h2 style="font-size:16px;margin:0 0 10px;">Pedidos por estado</h2>

            @if(empty($ordersByStatus))
                <div style="color:#666;">No hay pedidos todavía.</div>
            @else
                <div style="display:flex;flex-wrap:wrap;gap:10px;">
                    @foreach($ordersByStatus as $status => $total)
                        <a href="{{ route('admin.orders.index', ['status' => $status]) }}"
                           style="display:inline-flex;gap:8px;align-items:center;padding:8px 10px;border:1px solid #eee;border-radius:999px;text-decoration:none;">
                            <span style="font-size:12px;color:#666;">{{ \Illuminate\Support\Str::of($status)->replace('_',' ')->headline() }}</span>
                            <span style="font-weight:800;">{{ $total }}</span>
                        </a>
                    @endforeach
                </div>
            @endif
        </div>

        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <h2 style="font-size:16px;margin:0 0 10px;">Reparaciones por estado</h2>

            @if(empty($repairsByStatus))
                <div style="color:#666;">No hay reparaciones todavía.</div>
            @else
                <div style="display:flex;flex-wrap:wrap;gap:10px;">
                    @foreach($repairsByStatus as $status => $total)
                        <a href="{{ route('admin.repairs.index', ['status' => $status]) }}"
                           style="display:inline-flex;gap:8px;align-items:center;padding:8px 10px;border:1px solid #eee;border-radius:999px;text-decoration:none;">
                            <span style="font-size:12px;color:#666;">{{ \Illuminate\Support\Str::of($status)->replace('_',' ')->headline() }}</span>
                            <span style="font-weight:800;">{{ $total }}</span>
                        </a>
                    @endforeach
                </div>
            @endif
        </div>

        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <h2 style="font-size:16px;margin:0 0 10px;">Productos con stock bajo</h2>

            @if($lowStockProducts->isEmpty())
                <div style="color:#666;">No hay productos con stock bajo.</div>
            @else
                <div style="overflow:auto;">
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr>
                                <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Producto</th>
                                <th style="text-align:right;padding:8px;border-bottom:1px solid #eee;">Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($lowStockProducts as $p)
                                <tr>
                                    <td style="padding:8px;border-bottom:1px solid #f4f4f4;">
                                        {{ $p->name ?? $p->nombre ?? 'Producto' }}
                                    </td>
                                    <td style="padding:8px;border-bottom:1px solid #f4f4f4;text-align:right;">
                                        {{ $p->stock }}
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            @endif
        </div>
    </div>

</div>
@endsection
