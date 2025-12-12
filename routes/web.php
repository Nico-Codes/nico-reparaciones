<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

use App\Http\Controllers\StoreController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrderController;

use App\Http\Controllers\AdminOrderController;
use App\Http\Controllers\AdminRepairController;
use App\Http\Controllers\AdminRepairPrintController;

use App\Http\Controllers\RepairLookupController;
use App\Http\Controllers\UserRepairController;

/*
|--------------------------------------------------------------------------
| Tienda
|--------------------------------------------------------------------------
*/
Route::get('/', [StoreController::class, 'index'])->name('home');
Route::get('/tienda', [StoreController::class, 'index'])->name('store.index');
Route::get('/tienda/categoria/{slug}', [StoreController::class, 'category'])->name('store.category');
Route::get('/producto/{slug}', [StoreController::class, 'product'])->name('store.product');

/*
|--------------------------------------------------------------------------
| Carrito
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
*/
Route::get('/checkout', [CartController::class, 'checkout'])->name('checkout');
Route::post('/checkout/confirmar', [OrderController::class, 'confirm'])->name('checkout.confirm');

/*
|--------------------------------------------------------------------------
| Auth
|--------------------------------------------------------------------------
*/
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::get('/registro', [AuthController::class, 'showRegister'])->name('register');
Route::post('/registro', [AuthController::class, 'register'])->name('register.post');

/*
|--------------------------------------------------------------------------
| Cliente
|--------------------------------------------------------------------------
*/
Route::get('/mis-pedidos', [OrderController::class, 'index'])->name('orders.index');
Route::get('/mis-pedidos/{order}', [OrderController::class, 'show'])->name('orders.show');

Route::get('/mis-reparaciones', [UserRepairController::class, 'index'])->name('repairs.my.index');
Route::get('/mis-reparaciones/{repair}', [UserRepairController::class, 'show'])->name('repairs.my.show');

/*
|--------------------------------------------------------------------------
| Consulta pública de reparación
|--------------------------------------------------------------------------
*/
Route::get('/reparacion', [RepairLookupController::class, 'form'])->name('repairs.lookup');
Route::post('/reparacion', [RepairLookupController::class, 'lookup'])->name('repairs.lookup.post');

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/
Route::prefix('admin')
    ->middleware(['auth', 'admin'])
    ->name('admin.')
    ->group(function () {

        // Home admin
        Route::get('/', function () {
            return redirect()->route('admin.repairs.index');
        })->name('dashboard');

        // Pedidos
        Route::get('/pedidos', [AdminOrderController::class, 'index'])->name('orders.index');
        Route::get('/pedidos/{order}', [AdminOrderController::class, 'show'])->name('orders.show');
        Route::post('/pedidos/{order}/estado', [AdminOrderController::class, 'updateStatus'])->name('orders.updateStatus');

        // Reparaciones
        Route::get('/reparaciones', [AdminRepairController::class, 'index'])->name('repairs.index');
        Route::get('/reparaciones/crear', [AdminRepairController::class, 'create'])->name('repairs.create');
        Route::post('/reparaciones', [AdminRepairController::class, 'store'])->name('repairs.store');
        Route::get('/reparaciones/{repair}', [AdminRepairController::class, 'show'])->name('repairs.show');

        // ✅ ESTA ES LA QUE FALTABA (para el form de "Editar datos" en show.blade.php)
        Route::put('/reparaciones/{repair}', [AdminRepairController::class, 'update'])->name('repairs.update');

        Route::post('/reparaciones/{repair}/estado', [AdminRepairController::class, 'updateStatus'])->name('repairs.updateStatus');

        // WhatsApp logs
        Route::post('/reparaciones/{repair}/whatsapp', [AdminRepairController::class, 'logWhatsapp'])
            ->name('repairs.whatsappLog');

        Route::post('/reparaciones/{repair}/whatsapp-ajax', [AdminRepairController::class, 'logWhatsappAjax'])
            ->name('repairs.whatsappLogAjax');

        // Ticket imprimible
        Route::get('/reparaciones/{repair}/imprimir', AdminRepairPrintController::class)->name('repairs.print');
    });

/*
|--------------------------------------------------------------------------
| Storage local (fallback)
|--------------------------------------------------------------------------
*/
Route::get('/storage/{path}', function (string $path) {
    return Storage::disk('local')->response($path);
})->where('path', '.*')->name('storage.local');
