@extends('layouts.app')

@section('content')
@php
    $orderLabels = [
        'pendiente' => 'Pendiente',
        'confirmado' => 'Confirmado',
        'preparando' => 'Preparando',
        'listo_retirar' => 'Listo para retirar',
        'entregado' => 'Entregado',
        'cancelado' => 'Cancelado',
    ];

    $repairLabels = \App\Models\Repair::STATUSES ?? [
        'recibido' => 'Recibido',
        'en_diagnostico' => 'En diagnóstico',
        'esperando_repuesto' => 'Esperando repuesto',
        'en_reparacion' => 'En reparación',
        'listo_para_retirar' => 'Listo para retirar',
        'entregado' => 'Entregado',
        'cancelado' => 'Cancelado',
    ];
@endphp

<div class="container" style="max-width:1100px;">

    <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;">
        <div>
            <h1 style="margin:0;">Panel Admin</h1>
            <div style="color:#666;margin-top:4px;">Atajos + actividad reciente</div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <a href="{{ route('admin.orders.index') }}">Pedidos</a>
            <a href="{{ route('admin.repairs.index') }}">Reparaciones</a>
            <a href="{{ route('admin.repairs.create') }}">+ Crear reparación</a>
        </div>
    </div>

    {{-- Atajos principales --}}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin-top:14px;">
        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <div style="font-size:12px;color:#666;">Pedidos pendientes</div>
            <div style="font-size:28px;font-weight:900;line-height:1.1;">{{ $pendingOrdersCount }}</div>
            <div style="margin-top:10px;">
                <a href="{{ route('admin.orders.index', ['status' => 'pendiente']) }}">Ver pendientes →</a>
            </div>
        </div>

        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <div style="font-size:12px;color:#666;">Pedidos listos para retirar</div>
            <div style="font-size:28px;font-weight:900;line-height:1.1;">{{ $readyOrdersCount }}</div>
            <div style="margin-top:10px;">
                <a href="{{ route('admin.orders.index', ['status' => 'listo_retirar']) }}">Ver listos →</a>
            </div>
        </div>

        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <div style="font-size:12px;color:#666;">Reparaciones activas</div>
            <div style="font-size:28px;font-weight:900;line-height:1.1;">{{ $activeRepairsCount }}</div>
            <div style="margin-top:10px;">
                <a href="{{ route('admin.repairs.index') }}">Ver reparaciones →</a>
            </div>
        </div>

        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <div style="font-size:12px;color:#666;">Reparaciones listas para retirar</div>
            <div style="font-size:28px;font-weight:900;line-height:1.1;">{{ $readyRepairsCount }}</div>
            <div style="margin-top:10px;">
                <a href="{{ route('admin.repairs.index', ['status' => 'listo_para_retirar']) }}">Ver listas →</a>
            </div>
        </div>
    </div>

    {{-- Resúmenes totales + stock --}}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:14px;">
        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <div style="font-size:12px;color:#666;">Pedidos (total)</div>
            <div style="font-size:26px;font-weight:900;line-height:1.1;">{{ $ordersTotal }}</div>

            <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:10px;">
                @foreach($ordersByStatus as $st => $tot)
                    <a href="{{ route('admin.orders.index', ['status' => $st]) }}"
                       style="display:inline-flex;gap:8px;align-items:center;padding:7px 10px;border:1px solid #eee;border-radius:999px;text-decoration:none;">
                        <span style="font-size:12px;color:#666;">{{ $orderLabels[$st] ?? \Illuminate\Support\Str::of($st)->replace('_',' ')->headline() }}</span>
                        <span style="font-weight:800;">{{ $tot }}</span>
                    </a>
                @endforeach
            </div>
        </div>

        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <div style="font-size:12px;color:#666;">Reparaciones (total)</div>
            <div style="font-size:26px;font-weight:900;line-height:1.1;">{{ $repairsTotal }}</div>

            <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:10px;">
                @foreach($repairsByStatus as $st => $tot)
                    <a href="{{ route('admin.repairs.index', ['status' => $st]) }}"
                       style="display:inline-flex;gap:8px;align-items:center;padding:7px 10px;border:1px solid #eee;border-radius:999px;text-decoration:none;">
                        <span style="font-size:12px;color:#666;">{{ $repairLabels[$st] ?? \Illuminate\Support\Str::of($st)->replace('_',' ')->headline() }}</span>
                        <span style="font-weight:800;">{{ $tot }}</span>
                    </a>
                @endforeach
            </div>
        </div>

        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <div style="font-size:12px;color:#666;">Stock bajo (≤ {{ $lowStockThreshold }})</div>
            <div style="font-size:26px;font-weight:900;line-height:1.1;">{{ $lowStockCount }}</div>

            <div style="margin-top:10px;color:#666;font-size:12px;">Muestra hasta 10 productos</div>

            <div style="margin-top:10px;overflow:auto;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Producto</th>
                            <th style="text-align:right;padding:8px;border-bottom:1px solid #eee;">Stock</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($lowStockProducts as $p)
                            <tr>
                                <td style="padding:8px;border-bottom:1px solid #f4f4f4;">
                                    {{ $p->name ?? $p->nombre ?? 'Producto' }}
                                </td>
                                <td style="padding:8px;border-bottom:1px solid #f4f4f4;text-align:right;">
                                    {{ $p->stock }}
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="2" style="padding:8px;color:#666;">Sin productos en bajo stock</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    {{-- Actividad reciente --}}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px;margin-top:14px;">
        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <h2 style="font-size:16px;margin:0 0 10px;">Últimos pedidos</h2>

            <div style="overflow:auto;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">#</th>
                            <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Estado</th>
                            <th style="text-align:right;padding:8px;border-bottom:1px solid #eee;">Ver</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($recentOrders as $o)
                            <tr>
                                <td style="padding:8px;border-bottom:1px solid #f4f4f4;">{{ $o->id }}</td>
                                <td style="padding:8px;border-bottom:1px solid #f4f4f4;">
                                    {{ $orderLabels[$o->status] ?? $o->status }}
                                </td>
                                <td style="padding:8px;border-bottom:1px solid #f4f4f4;text-align:right;">
                                    <a href="{{ route('admin.orders.show', $o) }}">Abrir</a>
                                </td>
                            </tr>
                        @empty
                            <tr><td colspan="3" style="padding:8px;color:#666;">Sin pedidos</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>

        <div style="border:1px solid #eee;border-radius:12px;padding:14px;background:#fff;">
            <h2 style="font-size:16px;margin:0 0 10px;">Últimas reparaciones</h2>

            <div style="overflow:auto;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Código</th>
                            <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Estado</th>
                            <th style="text-align:right;padding:8px;border-bottom:1px solid #eee;">Ver</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($recentRepairs as $r)
                            <tr>
                                <td style="padding:8px;border-bottom:1px solid #f4f4f4;">
                                    {{ $r->code ?? ('#'.$r->id) }}
                                </td>
                                <td style="padding:8px;border-bottom:1px solid #f4f4f4;">
                                    {{ $repairLabels[$r->status] ?? $r->status }}
                                </td>
                                <td style="padding:8px;border-bottom:1px solid #f4f4f4;text-align:right;">
                                    <a href="{{ route('admin.repairs.show', $r) }}">Abrir</a>
                                </td>
                            </tr>
                        @empty
                            <tr><td colspan="3" style="padding:8px;color:#666;">Sin reparaciones</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>

</div>
@endsection
