<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\StoreController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrderController;

use App\Http\Controllers\AdminOrderController;
use App\Http\Controllers\AdminRepairController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminWhatsappTemplateController;

use App\Http\Controllers\RepairLookupController;
use App\Http\Controllers\UserRepairController;

/*
|--------------------------------------------------------------------------
| Home / Tienda
|--------------------------------------------------------------------------
*/
Route::get('/', [StoreController::class, 'index'])->name('home');

Route::get('tienda', [StoreController::class, 'index'])->name('store.index');
Route::get('tienda/categoria/{slug}', [StoreController::class, 'category'])->name('store.category');
Route::get('producto/{slug}', [StoreController::class, 'product'])->name('store.product');

/*
|--------------------------------------------------------------------------
| Carrito (público)
|--------------------------------------------------------------------------
*/
Route::get('carrito', [CartController::class, 'index'])->name('cart.index');
Route::post('carrito/agregar/{product}', [CartController::class, 'add'])->name('cart.add');
Route::post('carrito/actualizar/{product}', [CartController::class, 'update'])->name('cart.update');
Route::post('carrito/eliminar/{product}', [CartController::class, 'remove'])->name('cart.remove');
Route::post('carrito/vaciar', [CartController::class, 'clear'])->name('cart.clear');

/*
|--------------------------------------------------------------------------
| Reparaciones - consulta cliente (público)
|--------------------------------------------------------------------------
*/
Route::get('reparacion', [RepairLookupController::class, 'form'])->name('repairs.lookup');
Route::post('reparacion', [RepairLookupController::class, 'lookup'])->name('repairs.lookup.post');

/*
|--------------------------------------------------------------------------
| Auth (guest)
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login'])->name('login.post');

    Route::get('registro', [AuthController::class, 'showRegister'])->name('register');
    Route::post('registro', [AuthController::class, 'register'])->name('register.post');
});

/*
|--------------------------------------------------------------------------
| Usuario logueado
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');

    Route::get('checkout', [CartController::class, 'checkout'])->name('checkout');
    Route::post('checkout/confirmar', [OrderController::class, 'confirm'])->name('checkout.confirm');

    Route::get('mis-pedidos', [OrderController::class, 'index'])->name('orders.index');
    Route::get('mis-pedidos/{order}', [OrderController::class, 'show'])->name('orders.show');

    Route::get('mis-reparaciones', [UserRepairController::class, 'index'])->name('repairs.my.index');
    Route::get('mis-reparaciones/{repair}', [UserRepairController::class, 'show'])->name('repairs.my.show');
});

/*
|--------------------------------------------------------------------------
| Admin (auth + admin)
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->middleware(['auth', 'admin'])->group(function () {
    // Dashboard
    Route::get('/', [AdminDashboardController::class, 'index'])->name('admin.dashboard');

    // ✅ Plantillas WhatsApp
    Route::get('plantillas-whatsapp', [AdminWhatsappTemplateController::class, 'index'])->name('admin.whatsappTemplates.index');
    Route::post('plantillas-whatsapp', [AdminWhatsappTemplateController::class, 'update'])->name('admin.whatsappTemplates.update');

    // Pedidos
    Route::get('pedidos', [AdminOrderController::class, 'index'])->name('admin.orders.index');
    Route::get('pedidos/{order}', [AdminOrderController::class, 'show'])->name('admin.orders.show');
    Route::post('pedidos/{order}/estado', [AdminOrderController::class, 'updateStatus'])->name('admin.orders.updateStatus');

    // Reparaciones
    Route::get('reparaciones', [AdminRepairController::class, 'index'])->name('admin.repairs.index');
    Route::get('reparaciones/crear', [AdminRepairController::class, 'create'])->name('admin.repairs.create');
    Route::post('reparaciones', [AdminRepairController::class, 'store'])->name('admin.repairs.store');

    Route::get('reparaciones/{repair}', [AdminRepairController::class, 'show'])->name('admin.repairs.show');

    Route::put('reparaciones/{repair}', [AdminRepairController::class, 'update'])->name('admin.repairs.update');
    Route::post('reparaciones/{repair}/estado', [AdminRepairController::class, 'updateStatus'])->name('admin.repairs.updateStatus');

    Route::get('reparaciones/{repair}/imprimir', [AdminRepairController::class, 'print'])->name('admin.repairs.print');

    // Historial WhatsApp (manual)
    Route::post('reparaciones/{repair}/whatsapp', [AdminRepairController::class, 'logWhatsapp'])->name('admin.repairs.whatsappLog');

    // Log “silencioso” para 1-click
    Route::post('reparaciones/{repair}/whatsapp-ajax', [AdminRepairController::class, 'logWhatsappAjax'])->name('admin.repairs.whatsappLogAjax');
});
