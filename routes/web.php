<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

use App\Http\Controllers\StoreController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrderController;

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminOrderController;
use App\Http\Controllers\AdminRepairController;

use App\Http\Controllers\RepairLookupController;
use App\Http\Controllers\UserRepairController;

/*
|--------------------------------------------------------------------------
| Store (Público)
|--------------------------------------------------------------------------
*/
Route::get('/', [StoreController::class, 'index'])->name('home');

Route::get('/tienda', [StoreController::class, 'index'])->name('store.index');
Route::get('/tienda/categoria/{slug}', [StoreController::class, 'category'])->name('store.category');
Route::get('/producto/{slug}', [StoreController::class, 'product'])->name('store.product');

/*
|--------------------------------------------------------------------------
| Carrito (Público)
|--------------------------------------------------------------------------
*/
Route::get('/carrito', [CartController::class, 'index'])->name('cart.index');
Route::post('/carrito/agregar/{product}', [CartController::class, 'add'])->name('cart.add');
Route::post('/carrito/actualizar/{product}', [CartController::class, 'update'])->name('cart.update');
Route::post('/carrito/eliminar/{product}', [CartController::class, 'remove'])->name('cart.remove');
Route::post('/carrito/vaciar', [CartController::class, 'clear'])->name('cart.clear');

/*
|--------------------------------------------------------------------------
| Checkout
|--------------------------------------------------------------------------
| - GET checkout lo dejamos público (si no está logueado, el controller puede redirigir)
| - POST confirmar SI o SI con auth (evita pedidos “a mano” sin sesión)
*/
Route::get('/checkout', [CartController::class, 'checkout'])->name('checkout');
Route::post('/checkout/confirmar', [OrderController::class, 'confirm'])
    ->middleware('auth')
    ->name('checkout.confirm');

/*
|--------------------------------------------------------------------------
| Auth
|--------------------------------------------------------------------------
*/
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');

Route::get('/registro', [AuthController::class, 'showRegister'])->name('register');
Route::post('/registro', [AuthController::class, 'register'])->name('register.post');

Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

/*
|--------------------------------------------------------------------------
| Pedidos y Reparaciones del Cliente (Auth)
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    // Pedidos
    Route::get('/mis-pedidos', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/mis-pedidos/{order}', [OrderController::class, 'show'])->name('orders.show');

    // Reparaciones
    Route::get('/mis-reparaciones', [UserRepairController::class, 'index'])->name('repairs.my.index');
    Route::get('/mis-reparaciones/{repair}', [UserRepairController::class, 'show'])->name('repairs.my.show');
});

/*
|--------------------------------------------------------------------------
| Consulta pública de reparación (por código / dato)
|--------------------------------------------------------------------------
*/
Route::get('/reparacion', [RepairLookupController::class, 'form'])->name('repairs.lookup');
Route::post('/reparacion', [RepairLookupController::class, 'lookup'])->name('repairs.lookup.post');

/*
|--------------------------------------------------------------------------
| Admin (auth + admin)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        // Dashboard
        Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');

        // Pedidos
        Route::get('/pedidos', [AdminOrderController::class, 'index'])->name('orders.index');
        Route::get('/pedidos/{order}', [AdminOrderController::class, 'show'])->name('orders.show');
        Route::post('/pedidos/{order}/estado', [AdminOrderController::class, 'updateStatus'])->name('orders.updateStatus');

        // Reparaciones
        Route::get('/reparaciones', [AdminRepairController::class, 'index'])->name('repairs.index');
        Route::get('/reparaciones/crear', [AdminRepairController::class, 'create'])->name('repairs.create');
        Route::post('/reparaciones', [AdminRepairController::class, 'store'])->name('repairs.store');
        Route::get('/reparaciones/{repair}', [AdminRepairController::class, 'show'])->name('repairs.show');
        Route::post('/reparaciones/{repair}/estado', [AdminRepairController::class, 'updateStatus'])->name('repairs.updateStatus');
    });

/*
|--------------------------------------------------------------------------
| Storage local (porque no está el symlink public/storage)
|--------------------------------------------------------------------------
*/
Route::get('/storage/{path}', function (string $path) {
    if (str_contains($path, '..')) {
        abort(404);
    }

    $disk = Storage::disk('public');

    if (!$disk->exists($path)) {
        abort(404);
    }

    return response()->file($disk->path($path));
})->where('path', '.*')->name('storage.local');
