@extends('layouts.app')

@section('content')
<div class="container">

    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <h1 style="margin:0;">Panel Admin</h1>

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <a href="{{ route('admin.orders.index') }}">Ver pedidos</a>
            <a href="{{ route('admin.repairs.index') }}">Ver reparaciones</a>
            <a href="{{ route('admin.repairs.create') }}">+ Nueva reparación</a>
            <a href="{{ route('admin.whatsappTemplates.index') }}">Plantillas WhatsApp</a>
        </div>
    </div>

    <div style="margin-top:14px; display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:12px;">

        <div style="border:1px solid #e5e5e5; border-radius:12px; padding:12px;">
            <h3 style="margin:0 0 8px;">Pedidos (por estado)</h3>

            @if(empty($ordersByStatus))
                <p style="margin:0; color:#666;">Todavía no hay pedidos.</p>
            @else
                <ul style="margin:0; padding-left:18px;">
                    @foreach($ordersByStatus as $st => $total)
                        <li><b>{{ $st }}</b>: {{ $total }}</li>
                    @endforeach
                </ul>
            @endif

            <div style="margin-top:10px;">
                <a href="{{ route('admin.orders.index') }}">Ir a pedidos →</a>
            </div>
        </div>

        <div style="border:1px solid #e5e5e5; border-radius:12px; padding:12px;">
            <h3 style="margin:0 0 8px;">Reparaciones</h3>
            <p style="margin:0 0 8px;"><b>Activas:</b> {{ $activeRepairsCount }}</p>

            @if(empty($repairsByStatus))
                <p style="margin:0; color:#666;">Todavía no hay reparaciones.</p>
            @else
                <ul style="margin:0; padding-left:18px;">
                    @foreach($repairsByStatus as $st => $total)
                        <li>
                            <b>{{ $repairStatuses[$st] ?? $st }}</b>: {{ $total }}
                        </li>
                    @endforeach
                </ul>
            @endif

            <div style="margin-top:10px;">
                <a href="{{ route('admin.repairs.index') }}">Ir a reparaciones →</a>
            </div>
        </div>

        <div style="border:1px solid #e5e5e5; border-radius:12px; padding:12px;">
            <h3 style="margin:0 0 8px;">Stock bajo (≤ {{ $lowStockThreshold }})</h3>

            @if($lowStockProducts->count() === 0)
                <p style="margin:0; color:#666;">Sin productos con stock bajo.</p>
            @else
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="text-align:left; border-bottom:1px solid #eee; padding:6px;">Producto</th>
                            <th style="text-align:right; border-bottom:1px solid #eee; padding:6px;">Stock</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($lowStockProducts as $p)
                            <tr>
                                <td style="padding:6px;">
                                    {{ $p->name ?? $p->nombre ?? 'Producto #' . $p->id }}
                                </td>
                                <td style="padding:6px; text-align:right;">
                                    {{ $p->stock }}
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>

    </div>

    <div style="margin-top:14px; display:grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap:12px;">

        <div style="border:1px solid #e5e5e5; border-radius:12px; padding:12px;">
            <h3 style="margin:0 0 8px;">Últimos pedidos</h3>

            @if($lastOrders->count() === 0)
                <p style="margin:0; color:#666;">Sin pedidos.</p>
            @else
                <ul style="margin:0; padding-left:18px;">
                    @foreach($lastOrders as $o)
                        <li>
                            #{{ $o->id }} — <b>{{ $o->status }}</b>
                            <a href="{{ route('admin.orders.show', $o) }}">ver</a>
                        </li>
                    @endforeach
                </ul>
            @endif
        </div>

        <div style="border:1px solid #e5e5e5; border-radius:12px; padding:12px;">
            <h3 style="margin:0 0 8px;">Últimas reparaciones</h3>

            @if($lastRepairs->count() === 0)
                <p style="margin:0; color:#666;">Sin reparaciones.</p>
            @else
                <ul style="margin:0; padding-left:18px;">
                    @foreach($lastRepairs as $r)
                        <li>
                            {{ $r->code ?? ('#'.$r->id) }} —
                            <b>{{ $repairStatuses[$r->status] ?? $r->status }}</b>
                            <a href="{{ route('admin.repairs.show', $r) }}">ver</a>
                        </li>
                    @endforeach
                </ul>
            @endif
        </div>

    </div>

</div>
@endsection
