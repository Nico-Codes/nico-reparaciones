<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

use App\Http\Controllers\StoreController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;

use App\Http\Controllers\RepairLookupController;
use App\Http\Controllers\UserRepairController;

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminOrderController;
use App\Http\Controllers\AdminRepairController;
use App\Http\Controllers\AdminRepairPrintController;
use App\Http\Controllers\AdminCategoryController;
use App\Http\Controllers\AdminProductController;

/*
|--------------------------------------------------------------------------
| Rutas públicas
|--------------------------------------------------------------------------
*/

Route::get('/', [StoreController::class, 'index'])->name('home');

Route::get('/tienda', [StoreController::class, 'index'])->name('store.index');
Route::get('/tienda/categoria/{slug}', [StoreController::class, 'category'])->name('store.category');
Route::get('/producto/{slug}', [StoreController::class, 'product'])->name('store.product');

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
| Carrito + checkout
|--------------------------------------------------------------------------
*/

Route::get('/carrito', [CartController::class, 'index'])->name('cart.index');
Route::post('/carrito/agregar/{product}', [CartController::class, 'add'])->name('cart.add');
Route::post('/carrito/actualizar/{product}', [CartController::class, 'update'])->name('cart.update');
Route::post('/carrito/eliminar/{product}', [CartController::class, 'remove'])->name('cart.remove');
Route::post('/carrito/vaciar', [CartController::class, 'clear'])->name('cart.clear');

Route::get('/checkout', [CartController::class, 'checkout'])->name('checkout');
Route::post('/checkout/confirmar', [OrderController::class, 'confirm'])->name('checkout.confirm');

/*
|--------------------------------------------------------------------------
| Pedidos (cliente)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth'])->group(function () {
    Route::get('/mis-pedidos', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/mis-pedidos/{order}', [OrderController::class, 'show'])->name('orders.show');

    Route::get('/mis-reparaciones', [UserRepairController::class, 'index'])->name('repairs.my.index');
    Route::get('/mis-reparaciones/{repair}', [UserRepairController::class, 'show'])->name('repairs.my.show');
});

/*
|--------------------------------------------------------------------------
| Reparación - consulta pública (lookup)
|--------------------------------------------------------------------------
*/

Route::get('/reparacion', [RepairLookupController::class, 'form'])->name('repairs.lookup');
Route::post('/reparacion', [RepairLookupController::class, 'lookup'])->name('repairs.lookup.post');

/*
|--------------------------------------------------------------------------
| Storage local (solo dev) - si no querés depender del symlink
|--------------------------------------------------------------------------
*/
Route::get('/storage/{path}', function (string $path) {
    // Evitar exponer esto en producción.
    if (app()->environment('production')) {
        abort(404);
    }

    $path = ltrim($path, '/');

    // Bloqueo básico anti traversal
    if (str_contains($path, '..')) {
        abort(400);
    }

    $disk = Storage::disk('public');

    if (!$disk->exists($path)) {
        abort(404);
    }

    return $disk->response($path);
})->where('path', '.*')->name('storage.local');

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->middleware(['auth', 'admin'])->group(function () {

    // ✅ Dashboard (esto arregla /admin)
    Route::get('/', [AdminDashboardController::class, 'index'])->name('admin');
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');

    // Pedidos
    Route::get('/pedidos', [AdminOrderController::class, 'index'])->name('admin.orders.index');
    Route::get('/pedidos/{order}', [AdminOrderController::class, 'show'])->name('admin.orders.show');
    Route::post('/pedidos/{order}/estado', [AdminOrderController::class, 'updateStatus'])->name('admin.orders.updateStatus');

    // Reparaciones
    Route::get('/reparaciones', [AdminRepairController::class, 'index'])->name('admin.repairs.index');
    Route::get('/reparaciones/crear', [AdminRepairController::class, 'create'])->name('admin.repairs.create');
    Route::post('/reparaciones', [AdminRepairController::class, 'store'])->name('admin.repairs.store');

    Route::get('/reparaciones/{repair}', [AdminRepairController::class, 'show'])->name('admin.repairs.show');
    Route::put('/reparaciones/{repair}', [AdminRepairController::class, 'update'])->name('admin.repairs.update');

    Route::post('/reparaciones/{repair}/estado', [AdminRepairController::class, 'updateStatus'])->name('admin.repairs.updateStatus');

    // WhatsApp log
    Route::post('/reparaciones/{repair}/whatsapp', [AdminRepairController::class, 'whatsappLog'])->name('admin.repairs.whatsappLog');
    Route::post('/reparaciones/{repair}/whatsapp-ajax', [AdminRepairController::class, 'whatsappLogAjax'])->name('admin.repairs.whatsappLogAjax');

    // Imprimir
    Route::get('/reparaciones/{repair}/imprimir', [AdminRepairPrintController::class, '__invoke'])->name('admin.repairs.print');

    // Categorías
    Route::get('/categorias', [AdminCategoryController::class, 'index'])->name('admin.categories.index');
    Route::get('/categorias/crear', [AdminCategoryController::class, 'create'])->name('admin.categories.create');
    Route::post('/categorias', [AdminCategoryController::class, 'store'])->name('admin.categories.store');
    Route::get('/categorias/{category}/editar', [AdminCategoryController::class, 'edit'])->name('admin.categories.edit');
    Route::put('/categorias/{category}', [AdminCategoryController::class, 'update'])->name('admin.categories.update');
    Route::delete('/categorias/{category}', [AdminCategoryController::class, 'destroy'])->name('admin.categories.destroy');

    // Productos
    Route::get('/productos', [AdminProductController::class, 'index'])->name('admin.products.index');
    Route::get('/productos/crear', [AdminProductController::class, 'create'])->name('admin.products.create');
    Route::post('/productos', [AdminProductController::class, 'store'])->name('admin.products.store');
    Route::get('/productos/{product}/editar', [AdminProductController::class, 'edit'])->name('admin.products.edit');
    Route::put('/productos/{product}', [AdminProductController::class, 'update'])->name('admin.products.update');
    Route::delete('/productos/{product}', [AdminProductController::class, 'destroy'])->name('admin.products.destroy');
});
