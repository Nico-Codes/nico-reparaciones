<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /**
     * Muestra el contenido del carrito.
     */
    public function index(Request $request)
    {
        $cart = $request->session()->get('cart', []);

        $total = 0;
        foreach ($cart as $item) {
            $total += $item['price'] * $item['quantity'];
        }

        return view('carrito.index', [
            'cart'  => $cart,
            'total' => $total,
        ]);
    }

    /**
     * Agrega un producto al carrito.
     */
    public function add(Request $request, Product $product)
    {
        $cart = $request->session()->get('cart', []);

        $quantity = (int) $request->input('quantity', 1);
        if ($quantity < 1) {
            $quantity = 1;
        }

        // ✅ Stock real: 0 = sin stock
        if ((int)$product->stock <= 0) {
            return back()->withErrors([
                'stock' => 'Este producto está sin stock.',
            ]);
        }


        // No permitir más que el stock disponible
        if ($quantity > $product->stock) {
            $quantity = (int) $product->stock;
        }


        if (isset($cart[$product->id])) {
            // Ya existe, sumo cantidad
            $newQuantity = $cart[$product->id]['quantity'] + $quantity;

            if ($newQuantity > $product->stock) {
                $newQuantity = (int) $product->stock;
            }


            $cart[$product->id]['quantity'] = $newQuantity;
        } else {
            // Nuevo ítem
            $cart[$product->id] = [
                'id'       => $product->id,
                'name'     => $product->name,
                'price'    => $product->price,
                'quantity' => $quantity,
                'slug'     => $product->slug,
            ];
        }

        $request->session()->put('cart', $cart);

        // Si es AJAX/Fetch: devolvemos JSON (por si en el futuro lo usás sin recarga)
        if ($request->expectsJson()) {
            $cartCount = 0;
            foreach ($cart as $it) {
                $q = (int) ($it['quantity'] ?? 1);
                if ($q < 1) {
                    $q = 1;
                }
                $cartCount += $q;
            }

            return response()->json([
                'ok' => true,
                'added' => [
                    'id'       => $product->id,
                    'name'     => $product->name,
                    'quantity' => $quantity,
                    'subtotal' => (float) $product->price * $quantity,
                ],
                'cartCount' => $cartCount,
            ]);
        }

        // Normal: volvemos atrás y disparamos el bottom-sheet “Agregado al carrito”
        return back()
            ->with('success', 'Producto agregado al carrito.')
            ->with('cart_added', [
                'name'     => $product->name,
                'quantity' => $quantity,
                'subtotal' => (float) $product->price * $quantity,
            ]);
    }

    public function update(Request $request, Product $product)
    {
        $cart = $request->session()->get('cart', []);
        if (!isset($cart[$product->id])) {
            return redirect()->route('cart.index');
        }

        $quantity = (int) $request->input('quantity', 1);
        if ($quantity < 1) {
            $quantity = 1;
        }

        // ✅ Si quedó sin stock, lo sacamos del carrito
        if ((int)$product->stock <= 0) {
            unset($cart[$product->id]);
            $request->session()->put('cart', $cart);

            return redirect()
                ->route('cart.index')
                ->withErrors(['stock' => 'Un producto del carrito se quedó sin stock y fue eliminado.']);
        }

        if ($quantity > $product->stock) {
            $quantity = (int) $product->stock;
        }

        $cart[$product->id]['quantity'] = $quantity;


        $request->session()->put('cart', $cart);

        // AJAX/Fetch: devolvemos datos para actualizar UI sin recargar
        if ($request->expectsJson()) {
            $itemsCount = 0;
            $total = 0.0;

            foreach ($cart as $it) {
                $q = (int) ($it['quantity'] ?? 1);
                if ($q < 1) $q = 1;

                $p = (float) ($it['price'] ?? 0);
                $itemsCount += $q;
                $total += ($p * $q);
            }

            $lineSubtotal = (float) ($cart[$product->id]['price'] ?? 0) * (int) ($cart[$product->id]['quantity'] ?? 1);

            return response()->json([
                'ok'          => true,
                'productId'   => $product->id,
                'quantity'    => (int) $cart[$product->id]['quantity'],
                'lineSubtotal'=> $lineSubtotal,
                'cartCount'   => $itemsCount,
                'itemsCount'  => $itemsCount,
                'total'       => $total,
            ]);
        }

        return redirect()
            ->route('cart.index')
            ->with('success', 'Cantidad actualizada.');
    }

    /**
     * Eliminar un producto del carrito.
     */
    public function remove(Request $request, Product $product)
    {
        $cart = $request->session()->get('cart', []);

        if (isset($cart[$product->id])) {
            unset($cart[$product->id]);
            $request->session()->put('cart', $cart);
        }

        // AJAX/Fetch: devolvemos totales para actualizar UI sin recargar
        if ($request->expectsJson()) {
            $itemsCount = 0;
            $total = 0.0;

            foreach ($cart as $it) {
                $q = (int) ($it['quantity'] ?? 1);
                if ($q < 1) {
                    $q = 1;
                }

                $p = (float) ($it['price'] ?? 0);
                $itemsCount += $q;
                $total += ($p * $q);
            }

            return response()->json([
                'ok'         => true,
                'cartCount'  => $itemsCount,
                'itemsCount' => $itemsCount,
                'total'      => $total,
                'empty'      => ($itemsCount <= 0),
                'message'    => 'Producto eliminado del carrito.',
            ]);
        }

        return redirect()
            ->route('cart.index')
            ->with('success', 'Producto eliminado del carrito.');
    }

    /**
     * Vaciar todo el carrito.
     */
        public function clear(Request $request)
        {
            $request->session()->forget('cart');

            // AJAX/Fetch: devolvemos totales para actualizar UI sin recargar
            if ($request->expectsJson()) {
                return response()->json([
                    'ok'         => true,
                    'cartCount'  => 0,
                    'itemsCount' => 0,
                    'total'      => 0,
                    'empty'      => true,
                    'message'    => 'Carrito vaciado.',
                ]);
            }

            return redirect()
                ->route('cart.index')
                ->with('success', 'Carrito vaciado.');
        }


    public function checkout(Request $request)
    {
        $cart = $request->session()->get('cart', []);

        if (empty($cart)) {
            // Si el carrito está vacío, lo mando a la tienda
            return redirect()
                ->route('store.index')
                ->with('success', 'Tu carrito está vacío. Agregá algunos productos antes de finalizar el pedido.');
        }

        // Por ahora, el checkout solo muestra un resumen.
        // Más adelante acá pedimos método de pago, notas, etc.
        $total = 0;
        foreach ($cart as $item) {
            $total += $item['price'] * $item['quantity'];
        }

        return view('carrito.checkout', [
            'cart'  => $cart,
            'total' => $total,
        ]);
    }
}
