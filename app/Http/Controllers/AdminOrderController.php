<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    /**
     * Listado de todos los pedidos (para admin).
     */
    public function index(Request $request)
    {
        $status = $request->query('status'); // filtro opcional

        $query = Order::with('user')->latest();

        if ($status) {
            $query->where('status', $status);
        }

        $orders = $query->get();

        return view('admin.orders.index', [
            'orders' => $orders,
            'currentStatus' => $status,
        ]);
    }

    /**
     * Detalle de un pedido.
     */
    public function show(Order $order)
    {
        $order->load(['user', 'items']);

        return view('admin.orders.show', [
            'order' => $order,
        ]);
    }

    /**
     * Actualizar estado de un pedido.
     */
    public function updateStatus(Request $request, Order $order)
    {
        $data = $request->validate([
            'status' => ['required', 'in:pendiente,confirmado,preparando,listo_retirar,entregado,cancelado'],
        ]);

        $order->status = $data['status'];
        $order->save();

        return redirect()
            ->route('admin.orders.show', $order->id)
            ->with('success', 'Estado del pedido actualizado.');
    }
}
