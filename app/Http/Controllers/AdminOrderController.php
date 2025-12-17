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
        $status = (string) $request->query('status', '');
        $q = trim((string) $request->query('q', ''));

        $query = Order::query()
            ->with('user')
            ->latest();

        if ($status !== '') {
            $query->where('status', $status);
        }

        if ($q !== '') {
            $qDigits = preg_replace('/\D+/', '', $q);

            $query->where(function ($sub) use ($q, $qDigits) {
                // ID exacto si es numérico
                if (ctype_digit($q)) {
                    $sub->orWhere('id', (int) $q);
                }

                $sub->orWhere('pickup_name', 'like', "%{$q}%")
                    ->orWhere('payment_method', 'like', "%{$q}%");

                if ($qDigits !== '') {
                    $sub->orWhere('pickup_phone', 'like', "%{$qDigits}%");
                }

                $sub->orWhereHas('user', function ($u) use ($q) {
                    $u->where('name', 'like', "%{$q}%")
                      ->orWhere('email', 'like', "%{$q}%");
                });
            });
        }

        $orders = $query->paginate(20)->withQueryString();

        return view('admin.orders.index', [
            'orders' => $orders,
            'currentStatus' => $status,
            'q' => $q,
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
