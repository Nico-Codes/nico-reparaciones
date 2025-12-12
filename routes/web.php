<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Controllers
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\StoreController;

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminOrderController;
use App\Http\Controllers\AdminRepairController;
use App\Http\Controllers\AdminRepairPrintController;
use App\Http\Controllers\RepairLookupController;
use App\Http\Controllers\UserRepairController;

use App\Http\Controllers\AdminProductController;
use App\Http\Controllers\AdminCategoryController;

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/
Route::get('/', [StoreController::class, 'index'])->name('home');

Route::get('/tienda', [StoreController::class, 'index'])->name('store.index');
Route::get('/tienda/categoria/{slug}', [StoreController::class, 'category'])->name('store.category');
Route::get('/producto/{slug}', [StoreController::class, 'product'])->name('store.product');

/*
|--------------------------------------------------------------------------
| Cart (sesión)
|--------------------------------------------------------------------------
*/
Route::get('/carrito', [CartController::class, 'index'])->name('cart.index');
Route::post('/carrito/agregar/{product}', [CartController::class, 'add'])->name('cart.add');
Route::post('/carrito/actualizar/{product}', [CartController::class, 'update'])->name('cart.update');
Route::post('/carrito/eliminar/{product}', [CartController::class, 'remove'])->name('cart.remove');
Route::post('/carrito/vaciar', [CartController::class, 'clear'])->name('cart.clear');

/*
|--------------------------------------------------------------------------
| Checkout (requiere login)
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    Route::get('/checkout', [CartController::class, 'checkout'])->name('checkout');
    Route::post('/checkout/confirmar', [OrderController::class, 'confirm'])->name('checkout.confirm');

    // Pedidos (cliente)
    Route::get('/mis-pedidos', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/mis-pedidos/{order}', [OrderController::class, 'show'])->name('orders.show');

    // Reparaciones (cliente logueado)
    Route::get('/mis-reparaciones', [UserRepairController::class, 'index'])->name('repairs.my.index');
    Route::get('/mis-reparaciones/{repair}', [UserRepairController::class, 'show'])->name('repairs.my.show');
});

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
| Reparación (consulta pública por código)
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
        Route::put('/reparaciones/{repair}', [AdminRepairController::class, 'update'])->name('repairs.update');

        Route::post('/reparaciones/{repair}/estado', [AdminRepairController::class, 'updateStatus'])->name('repairs.updateStatus');

        // WhatsApp logs
        Route::post('/reparaciones/{repair}/whatsapp', [AdminRepairController::class, 'whatsappLog'])->name('repairs.whatsappLog');
        Route::post('/reparaciones/{repair}/whatsapp-ajax', [AdminRepairController::class, 'whatsappLogAjax'])->name('repairs.whatsappLogAjax');

        // Imprimir (si tu controller es invokable)
        Route::get('/reparaciones/{repair}/imprimir', AdminRepairPrintController::class)->name('repairs.print');

        // Productos
        Route::get('/productos', [AdminProductController::class, 'index'])->name('products.index');
        Route::get('/productos/crear', [AdminProductController::class, 'create'])->name('products.create');
        Route::post('/productos', [AdminProductController::class, 'store'])->name('products.store');
        Route::get('/productos/{product}/editar', [AdminProductController::class, 'edit'])->name('products.edit');
        Route::put('/productos/{product}', [AdminProductController::class, 'update'])->name('products.update');
        Route::delete('/productos/{product}', [AdminProductController::class, 'destroy'])->name('products.destroy');

        // Categorías
        Route::get('/categorias', [AdminCategoryController::class, 'index'])->name('categories.index');
        Route::get('/categorias/crear', [AdminCategoryController::class, 'create'])->name('categories.create');
        Route::post('/categorias', [AdminCategoryController::class, 'store'])->name('categories.store');
        Route::get('/categorias/{category}/editar', [AdminCategoryController::class, 'edit'])->name('categories.edit');
        Route::put('/categorias/{category}', [AdminCategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categorias/{category}', [AdminCategoryController::class, 'destroy'])->name('categories.destroy');
    });
