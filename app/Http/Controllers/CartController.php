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

        // Calcular total
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

        // No permitir más que el stock disponible
        if ($product->stock > 0 && $quantity > $product->stock) {
            $quantity = $product->stock;
        }

        if (isset($cart[$product->id])) {
            // Ya existe: sumamos cantidad
            $newQuantity = $cart[$product->id]['quantity'] + $quantity;

            if ($product->stock > 0 && $newQuantity > $product->stock) {
                $newQuantity = $product->stock;
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

        // 🔴 ANTES: redirigía al carrito
        // return redirect()->route('cart.index')->with('success', 'Producto agregado al carrito.');

        // ✅ AHORA: volvemos a la página anterior y mostramos POPUP tipo MercadoLibre
        return redirect()
            ->back()
            ->with('cart_added', [
                'product_name' => $product->name,
                'quantity'     => $quantity,
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

        if ($product->stock > 0 && $quantity > $product->stock) {
            $quantity = $product->stock;
        }

        $cart[$product->id]['quantity'] = $quantity;

        $request->session()->put('cart', $cart);

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
