<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    /**
     * Confirmar y guardar un pedido a partir del carrito.
     */
    public function confirm(Request $request)
    {
        $cart = $request->session()->get('cart', []);

        if (empty($cart)) {
            return redirect()
                ->route('store.index')
                ->with('success', 'Tu carrito está vacío.');
        }

        $data = $request->validate([
            'payment_method' => ['required', 'in:local,mercado_pago,transferencia'],
            'pickup_name'    => ['nullable', 'string', 'max:255'],
            'pickup_phone'   => ['nullable', 'string', 'max:50'],
            'notes'          => ['nullable', 'string'],
        ]);

        $total = 0;
        foreach ($cart as $item) {
            $total += $item['price'] * $item['quantity'];
        }

        $order = Order::create([
            'user_id'        => Auth::id(),
            'status'         => 'pendiente',
            'payment_method' => $data['payment_method'],
            'total'          => $total,
            'pickup_name'    => $data['pickup_name'] ?: Auth::user()->name,
            'pickup_phone'   => $data['pickup_phone'] ?: (Auth::user()->phone ?? null),
            'notes'          => $data['notes'] ?? null,
        ]);

        // Historial inicial
        OrderStatusHistory::create([
            'order_id'    => $order->id,
            'from_status' => null,
            'to_status'   => 'pendiente',
            'changed_by'  => Auth::id(),
            'changed_at'  => now(),
            'comment'     => 'Pedido creado',
        ]);

        foreach ($cart as $item) {
            OrderItem::create([
                'order_id'     => $order->id,
                'product_id'   => $item['id'],
                'product_name' => $item['name'],
                'price'        => $item['price'],
                'quantity'     => $item['quantity'],
                'subtotal'     => $item['price'] * $item['quantity'],
            ]);

            $product = Product::find($item['id']);
            if ($product && $product->stock >= $item['quantity']) {
                $product->stock -= $item['quantity'];
                $product->save();
            }
        }

        $request->session()->forget('cart');

        return redirect()
            ->route('orders.show', $order->id)
            ->with('success', 'Pedido realizado correctamente. Te vamos avisando el estado.');
    }

    /**
     * Listado de pedidos del usuario logueado.
     */
    public function index()
    {
        $orders = Auth::user()
            ->orders()
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return view('orders.index', [
            'orders' => $orders,
        ]);
    }

    /**
     * Detalle de un pedido del usuario.
     */
    public function show(Order $order)
    {
        if ($order->user_id !== Auth::id()) {
            abort(403);
        }

        $order->load(['items', 'statusHistories']);

        return view('orders.show', [
            'order' => $order,
        ]);
    }
}
