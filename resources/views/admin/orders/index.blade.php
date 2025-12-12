@extends('layouts.app')

@section('title', 'Admin - Pedidos')

@section('content')
    <section class="hero">
        <h1 class="hero-title">Panel admin - Pedidos</h1>
        <p class="hero-text">
            Acá ves todos los pedidos de los clientes y su estado.
        </p>
    </section>

    @if(session('success'))
        <div class="alert-success" style="margin-bottom:1rem;">
            {{ session('success') }}
        </div>
    @endif

    {{-- Filtro por estado --}}
    <section class="filters" style="margin-bottom: 1rem;">
        <form method="GET" action="{{ route('admin.orders.index') }}" class="status-filters">
            <label for="status" style="display:block;margin-bottom:.25rem;">Filtrar por estado</label>
            <select id="status" name="status" onchange="this.form.submit()">
                <option value="">Todos</option>
                <option value="pendiente" {{ $currentStatus === 'pendiente' ? 'selected' : '' }}>Pendientes</option>
                <option value="confirmado" {{ $currentStatus === 'confirmado' ? 'selected' : '' }}>Confirmados</option>
                <option value="preparando" {{ $currentStatus === 'preparando' ? 'selected' : '' }}>Preparando</option>
                <option value="listo_retirar" {{ $currentStatus === 'listo_retirar' ? 'selected' : '' }}>Listos para retirar</option>
                <option value="entregado" {{ $currentStatus === 'entregado' ? 'selected' : '' }}>Entregados</option>
                <option value="cancelado" {{ $currentStatus === 'cancelado' ? 'selected' : '' }}>Cancelados</option>
            </select>
        </form>
    </section>

    @if($orders->isEmpty())
        <p class="hero-text">No hay pedidos para mostrar.</p>
        <a href="{{ route('admin.dashboard') }}" class="btn btn-outline" style="margin-top: 1rem;">
            Volver
        </a>
    @else
        <section class="orders-list">
            @foreach($orders as $order)
                <article class="order-card">
                    <div class="order-card-main">
                        <div>
                            <h2 class="order-title">Pedido #{{ $order->id }}</h2>

                            <p class="order-sub">
                                {{ $order->created_at->format('d/m/Y H:i') }}
                                · Cliente: {{ $order->user->name }} ({{ $order->user->email }})
                            </p>

                            <p class="order-status">
                                Estado:
                                <strong>{{ ucfirst(str_replace('_', ' ', $order->status)) }}</strong>
                            </p>
                        </div>

                        <div class="order-total">
                            ${{ number_format($order->total, 0, ',', '.') }}
                        </div>
                    </div>

                    <a href="{{ route('admin.orders.show', $order->id) }}"
                       class="btn btn-outline"
                       style="margin-top: 0.5rem;">
                        Ver detalle
                    </a>
                </article>
            @endforeach
        </section>
    @endif
@endsection
