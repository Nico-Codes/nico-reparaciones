<?php

use App\Http\Controllers\AdminOrderController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;


// Home
Route::get('/', [StoreController::class, 'index'])->name('home');

// Tienda
Route::get('/tienda', [StoreController::class, 'index'])->name('store.index');
Route::get('/tienda/categoria/{slug}', [StoreController::class, 'category'])->name('store.category');
Route::get('/producto/{slug}', [StoreController::class, 'product'])->name('store.product');

// Auth (solo invitados)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.post');

    Route::get('/registro', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/registro', [AuthController::class, 'register'])->name('register.post');
});

// Logout (solo logueados)
Route::post('/logout', [AuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

// 🛒 CARRITO — LIBRE (FUNCIONA SIN LOGIN)
Route::get('/carrito', [CartController::class, 'index'])->name('cart.index');
Route::post('/carrito/agregar/{product}', [CartController::class, 'add'])->name('cart.add');
Route::post('/carrito/actualizar/{product}', [CartController::class, 'update'])->name('cart.update');
Route::post('/carrito/eliminar/{product}', [CartController::class, 'remove'])->name('cart.remove');
Route::post('/carrito/vaciar', [CartController::class, 'clear'])->name('cart.clear');

// ✅ CHECKOUT — SOLO LOGUEADOS
Route::middleware('auth')->group(function () {
    Route::get('/checkout', [CartController::class, 'checkout'])->name('checkout');
    // más adelante: Route::post('/checkout/confirmar', [OrderController::class, 'confirm'])...
});

// Checkout + pedidos (sólo logueados)
Route::middleware('auth')->group(function () {
    Route::get('/checkout', [CartController::class, 'checkout'])->name('checkout');
    Route::post('/checkout/confirmar', [OrderController::class, 'confirm'])->name('checkout.confirm');

    Route::get('/mis-pedidos', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/mis-pedidos/{order}', [OrderController::class, 'show'])->name('orders.show');
});

//Solo Admin
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {

    Route::get('/pedidos', [AdminOrderController::class, 'index'])->name('orders.index');
    Route::get('/pedidos/{order}', [AdminOrderController::class, 'show'])->name('orders.show');
    Route::post('/pedidos/{order}/estado', [AdminOrderController::class, 'updateStatus'])->name('orders.updateStatus');

});
