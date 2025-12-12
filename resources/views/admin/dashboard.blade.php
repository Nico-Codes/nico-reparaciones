@extends('layouts.app')

@section('content')
<div style="max-width:1100px;margin:0 auto;padding:16px;">
    <h1 style="font-size:22px;font-weight:800;margin:0 0 6px;">Panel Admin</h1>
    <p style="margin:0;color:#666;">Resumen rápido de pedidos, reparaciones y stock.</p>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:16px;">
        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <div style="font-size:12px;color:#666;">Pedidos (total)</div>
            <div style="font-size:28px;font-weight:900;line-height:1.1;">{{ $ordersTotal }}</div>
            <div style="margin-top:10px;">
                <a href="{{ url('/admin/pedidos') }}" style="text-decoration:none;">Ver pedidos →</a>
            </div>
        </div>

        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <div style="font-size:12px;color:#666;">Reparaciones (total)</div>
            <div style="font-size:28px;font-weight:900;line-height:1.1;">{{ $repairsTotal }}</div>
            <div style="margin-top:10px;">
                <a href="{{ url('/admin/reparaciones') }}" style="text-decoration:none;">Ver reparaciones →</a>
            </div>
        </div>

        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <div style="font-size:12px;color:#666;">Stock bajo (≤ {{ $lowStockThreshold }})</div>
            <div style="font-size:28px;font-weight:900;line-height:1.1;">{{ $lowStockCount }}</div>
            <div style="margin-top:10px;font-size:12px;color:#666;">
                (Muestra hasta 10 productos abajo)
            </div>
        </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr;gap:14px;margin-top:18px;">
        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <h2 style="font-size:16px;margin:0 0 10px;">Pedidos por estado</h2>

            @if (empty($ordersByStatus))
                <div style="color:#666;">No hay pedidos todavía.</div>
            @else
                <div style="display:flex;flex-wrap:wrap;gap:10px;">
                    @foreach ($ordersByStatus as $status => $total)
                        <a href="{{ url('/admin/pedidos?status=' . urlencode($status)) }}"
                           style="display:inline-flex;gap:8px;align-items:center;padding:8px 10px;border:1px solid #eee;border-radius:999px;text-decoration:none;">
                            <span style="font-size:12px;color:#666;">
                                {{ \Illuminate\Support\Str::of($status)->replace('_',' ')->headline() }}
                            </span>
                            <span style="font-weight:800;">{{ $total }}</span>
                        </a>
                    @endforeach
                </div>
            @endif
        </div>

        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <h2 style="font-size:16px;margin:0 0 10px;">Reparaciones por estado</h2>

            @if (empty($repairsByStatus))
                <div style="color:#666;">No hay reparaciones todavía.</div>
            @else
                <div style="display:flex;flex-wrap:wrap;gap:10px;">
                    @foreach ($repairsByStatus as $status => $total)
                        <a href="{{ url('/admin/reparaciones?status=' . urlencode($status)) }}"
                           style="display:inline-flex;gap:8px;align-items:center;padding:8px 10px;border:1px solid #eee;border-radius:999px;text-decoration:none;">
                            <span style="font-size:12px;color:#666;">
                                {{ \Illuminate\Support\Str::of($status)->replace('_',' ')->headline() }}
                            </span>
                            <span style="font-weight:800;">{{ $total }}</span>
                        </a>
                    @endforeach
                </div>
            @endif

            <div style="margin-top:12px;">
                <a href="{{ route('admin.repairs.create') }}"
                   style="display:inline-block;padding:10px 12px;border-radius:10px;background:#111;color:#fff;text-decoration:none;">
                    + Crear reparación
                </a>
            </div>
        </div>

        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <h2 style="font-size:16px;margin:0 0 10px;">Productos con stock bajo</h2>

            @if ($lowStockProducts->isEmpty())
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
                            @foreach ($lowStockProducts as $product)
                                <tr>
                                    <td style="padding:8px;border-bottom:1px solid #f3f3f3;">
                                        {{ $product->name ?? $product->nombre ?? 'Producto' }}
                                    </td>
                                    <td style="padding:8px;border-bottom:1px solid #f3f3f3;text-align:right;">
                                        {{ $product->stock ?? '-' }}
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
