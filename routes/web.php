<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

use App\Http\Controllers\AccountController;
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
use App\Http\Controllers\AdminOrderPrintController;
use App\Http\Controllers\AdminOrderTicketController;
use App\Http\Controllers\AdminRepairTicketController;


use App\Http\Controllers\AdminDeviceCatalogController;
use App\Http\Controllers\AdminDeviceCatalogManageController;
use App\Http\Controllers\AdminDeviceTypeController;


use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminCategoryController;
use App\Http\Controllers\AdminProductController;
use App\Http\Controllers\AdminBusinessSettingsController;
use App\Http\Controllers\AdminWhatsappTemplateController;

use App\Http\Controllers\AdminOrderWhatsappTemplateController;
use App\Http\Controllers\AdminPricingRuleController;
use App\Http\Controllers\AdminRepairTypeController;
use App\Http\Controllers\AdminModelGroupController;




/*
|--------------------------------------------------------------------------
| Rutas pÃºblicas
|--------------------------------------------------------------------------
*/
Route::get('/', [StoreController::class, 'index'])->name('home');
Route::get('/tienda', [StoreController::class, 'index'])->name('store.index');
Route::get('/tienda/categoria/{category:slug}', [StoreController::class, 'category'])->name('store.category');
Route::get('/producto/{slug}', [StoreController::class, 'product'])->name('store.product');

/*
|--------------------------------------------------------------------------
| Auth
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.post');

    Route::get('/registro', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/registro', [AuthController::class, 'register'])->name('register.post');

    // âœ… Google OAuth
    Route::get('/auth/google', [AuthController::class, 'googleRedirect'])->name('auth.google.redirect');
    Route::get('/auth/google/callback', [AuthController::class, 'googleCallback'])->name('auth.google.callback');
});


Route::post('/logout', [AuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

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

Route::get('/checkout', [CartController::class, 'checkout'])->middleware('auth')->name('checkout');
Route::post('/checkout/confirmar', [OrderController::class, 'confirm'])->middleware('auth')->name('checkout.confirm');

/*
|--------------------------------------------------------------------------
| Pedidos + Reparaciones (cliente)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {
    Route::get('/mi-cuenta', [AccountController::class, 'edit'])->name('account.edit');
    Route::put('/mi-cuenta', [AccountController::class, 'update'])->name('account.update');

    // âœ… Cambiar contraseÃ±a (simple)
    Route::put('/mi-cuenta/password', [AccountController::class, 'updatePassword'])->name('account.password');

    Route::get('/mis-pedidos', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/mis-pedidos/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::get('/pedido/{order}', [OrderController::class, 'thankYou'])->name('orders.thankyou');

  


    Route::get('/mis-reparaciones', [UserRepairController::class, 'index'])->name('repairs.my.index');
    Route::get('/mis-reparaciones/{repair}', [UserRepairController::class, 'show'])->name('repairs.my.show');

    

});

/*
|--------------------------------------------------------------------------
| ReparaciÃ³n - consulta pÃºblica (lookup)
|--------------------------------------------------------------------------
*/
Route::get('/reparacion', [RepairLookupController::class, 'form'])->name('repairs.lookup');
Route::post('/reparacion', [RepairLookupController::class, 'lookup'])
    ->middleware('throttle:repair-lookup')
    ->name('repairs.lookup.post');

/*
|--------------------------------------------------------------------------
| Storage local (solo dev)
|--------------------------------------------------------------------------
*/
Route::get('/storage/{path}', function (string $path) {

    $path = ltrim($path, '/');

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

    Route::get('/', [AdminDashboardController::class, 'index'])->name('admin');
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');

    // Pedidos
    Route::get('/pedidos', [AdminOrderController::class, 'index'])->name('admin.orders.index');
    Route::get('/pedidos/{order}', [AdminOrderController::class, 'show'])->name('admin.orders.show');
    Route::post('/pedidos/{order}/estado', [AdminOrderController::class, 'updateStatus'])->name('admin.orders.updateStatus');

    // âœ… WhatsApp Pedidos (logs)
    Route::post('/pedidos/{order}/whatsapp', [AdminOrderController::class, 'whatsappLog'])->name('admin.orders.whatsappLog');
    Route::post('/pedidos/{order}/whatsapp-ajax', [AdminOrderController::class, 'whatsappLogAjax'])->name('admin.orders.whatsappLogAjax');

    // Reparaciones
    Route::get('/reparaciones', [AdminRepairController::class, 'index'])->name('admin.repairs.index');
    Route::get('/reparaciones/crear', [AdminRepairController::class, 'create'])->name('admin.repairs.create');
    Route::post('/reparaciones', [AdminRepairController::class, 'store'])->name('admin.repairs.store');

    Route::get('/reparaciones/{repair}', [AdminRepairController::class, 'show'])->name('admin.repairs.show');
    Route::put('/reparaciones/{repair}', [AdminRepairController::class, 'update'])->name('admin.repairs.update');

    Route::post('/reparaciones/{repair}/estado', [AdminRepairController::class, 'updateStatus'])->name('admin.repairs.updateStatus');

    Route::post('/reparaciones/{repair}/whatsapp', [AdminRepairController::class, 'whatsappLog'])->name('admin.repairs.whatsappLog');
    Route::post('/reparaciones/{repair}/whatsapp-ajax', [AdminRepairController::class, 'whatsappLogAjax'])->name('admin.repairs.whatsappLogAjax');

    Route::get('/reparaciones/{repair}/imprimir', AdminRepairPrintController::class)->name('admin.repairs.print');
    Route::get('/reparaciones/{repair}/ticket', AdminRepairTicketController::class)->name('admin.repairs.ticket');

    // ✅ Device catalog (AJAX)
    Route::get('/device-catalog/brands', [AdminDeviceCatalogController::class, 'brands'])->name('admin.deviceCatalog.brands');
    Route::get('/device-catalog/models', [AdminDeviceCatalogController::class, 'models'])->name('admin.deviceCatalog.models');

    Route::get('/device-catalog/issues', [AdminDeviceCatalogController::class, 'issues'])->name('admin.deviceCatalog.issues');

    Route::post('/device-catalog/brands', [AdminDeviceCatalogController::class, 'storeBrand'])->name('admin.deviceCatalog.ajax.brands.store');
    Route::post('/device-catalog/models', [AdminDeviceCatalogController::class, 'storeModel'])->name('admin.deviceCatalog.ajax.models.store');

    Route::post('/device-catalog/issues', [AdminDeviceCatalogController::class, 'storeIssue'])->name('admin.deviceCatalog.ajax.issues.store');


    Route::get('/pedidos/{order}/imprimir', AdminOrderPrintController::class)->name('admin.orders.print');
    Route::get('/pedidos/{order}/ticket', AdminOrderTicketController::class)->name('admin.orders.ticket');


    // Categorías
    Route::get('/categorias', [AdminCategoryController::class, 'index'])->name('admin.categories.index');
    Route::get('/categorias/crear', [AdminCategoryController::class, 'create'])->name('admin.categories.create');
    Route::post('/categorias', [AdminCategoryController::class, 'store'])->name('admin.categories.store');
    Route::get('/categorias/{category}/editar', [AdminCategoryController::class, 'edit'])->name('admin.categories.edit');
    Route::put('/categorias/{category}', [AdminCategoryController::class, 'update'])->name('admin.categories.update');
    Route::delete('/categorias/{category}', [AdminCategoryController::class, 'destroy'])->name('admin.categories.destroy');

    Route::post('/categorias/{category}/toggle-active', [AdminCategoryController::class, 'toggleActive'])->name('admin.categories.toggleActive');

    // Productos
    Route::get('/productos', [AdminProductController::class, 'index'])->name('admin.products.index');
    Route::get('/productos/crear', [AdminProductController::class, 'create'])->name('admin.products.create');
    Route::post('/productos', [AdminProductController::class, 'store'])->name('admin.products.store');
    Route::get('/productos/{product}/editar', [AdminProductController::class, 'edit'])->name('admin.products.edit');
    Route::put('/productos/{product}', [AdminProductController::class, 'update'])->name('admin.products.update');
    Route::delete('/productos/{product}', [AdminProductController::class, 'destroy'])->name('admin.products.destroy');

    // Productos (acciones rápidas)
    Route::post('/productos/{product}/toggle-active', [AdminProductController::class, 'toggleActive'])->name('admin.products.toggleActive');
    Route::post('/productos/{product}/toggle-featured', [AdminProductController::class, 'toggleFeatured'])->name('admin.products.toggleFeatured');
    Route::post('/productos/{product}/stock', [AdminProductController::class, 'updateStock'])->name('admin.products.updateStock');

    // Productos (acciones masivas)
    Route::post('/productos/bulk', [AdminProductController::class, 'bulk'])->name('admin.products.bulk');

    // Usuarios
    Route::get('/usuarios', [AdminUserController::class, 'index'])->name('admin.users.index');
    Route::get('/usuarios/{user}', [AdminUserController::class, 'show'])->name('admin.users.show');
    Route::post('/usuarios/{user}/rol', [AdminUserController::class, 'updateRole'])->name('admin.users.updateRole');


    // ConfiguraciÃ³n negocio
    Route::get('/configuracion', [AdminBusinessSettingsController::class, 'index'])->name('admin.settings.index');
    Route::post('/configuracion', [AdminBusinessSettingsController::class, 'update'])->name('admin.settings.update');

    // WhatsApp Reparaciones
    Route::get('/whatsapp', [AdminWhatsappTemplateController::class, 'index'])->name('admin.whatsapp_templates.index');
    Route::post('/whatsapp', [AdminWhatsappTemplateController::class, 'update'])->name('admin.whatsapp_templates.update');

    // âœ… WhatsApp Pedidos (plantillas)
    Route::get('/whatsapp-pedidos', [AdminOrderWhatsappTemplateController::class, 'index'])->name('admin.orders_whatsapp_templates.index');
    Route::post('/whatsapp-pedidos', [AdminOrderWhatsappTemplateController::class, 'update'])->name('admin.orders_whatsapp_templates.update');

    // ✅ Reparaciones: Tipos / Grupos / Reglas de precios
    Route::get('/tipos-reparacion', [AdminRepairTypeController::class, 'index'])->name('admin.repairTypes.index');
    Route::post('/tipos-reparacion', [AdminRepairTypeController::class, 'store'])->name('admin.repairTypes.store');
    Route::put('/tipos-reparacion/{repairType}', [AdminRepairTypeController::class, 'update'])->name('admin.repairTypes.update');

    Route::get('/grupos-modelos', [AdminModelGroupController::class, 'index'])->name('admin.modelGroups.index');
    Route::post('/grupos-modelos', [AdminModelGroupController::class, 'store'])->name('admin.modelGroups.store');
    Route::put('/grupos-modelos/{group}', [AdminModelGroupController::class, 'update'])->name('admin.modelGroups.update');
    Route::post('/grupos-modelos/modelo/{model}/asignar', [AdminModelGroupController::class, 'assignModel'])->name('admin.modelGroups.assignModel');

    // Tipos de dispositivo (admin)
    Route::get('/tipos-dispositivo', [AdminDeviceTypeController::class, 'index'])->name('admin.deviceTypes.index');
    Route::post('/tipos-dispositivo', [AdminDeviceTypeController::class, 'store'])->name('admin.deviceTypes.store');
    Route::put('/tipos-dispositivo/{deviceType}', [AdminDeviceTypeController::class, 'update'])->name('admin.deviceTypes.update');

    // Catálogo de dispositivos (admin)
    Route::get('/catalogo-dispositivos', [AdminDeviceCatalogManageController::class, 'index'])->name('admin.deviceCatalog.index');

    Route::post('/catalogo-dispositivos/marcas', [AdminDeviceCatalogManageController::class, 'storeBrand'])->name('admin.deviceCatalog.brands.store');
    Route::put('/catalogo-dispositivos/marcas/{brand}', [AdminDeviceCatalogManageController::class, 'updateBrand'])->name('admin.deviceCatalog.brands.update');
    Route::post('/catalogo-dispositivos/marcas/{brand}/toggle', [AdminDeviceCatalogManageController::class, 'toggleBrand'])->name('admin.deviceCatalog.brands.toggle');

    Route::post('/catalogo-dispositivos/modelos', [AdminDeviceCatalogManageController::class, 'storeModel'])->name('admin.deviceCatalog.models.store');
    Route::put('/catalogo-dispositivos/modelos/{model}', [AdminDeviceCatalogManageController::class, 'updateModel'])->name('admin.deviceCatalog.models.update');
    Route::post('/catalogo-dispositivos/modelos/{model}/toggle', [AdminDeviceCatalogManageController::class, 'toggleModel'])->name('admin.deviceCatalog.models.toggle');

    Route::post('/catalogo-dispositivos/fallas', [AdminDeviceCatalogManageController::class, 'storeIssue'])->name('admin.deviceCatalog.issues.store');
    Route::put('/catalogo-dispositivos/fallas/{issue}', [AdminDeviceCatalogManageController::class, 'updateIssue'])->name('admin.deviceCatalog.issues.update');
    Route::post('/catalogo-dispositivos/fallas/{issue}/toggle', [AdminDeviceCatalogManageController::class, 'toggleIssue'])->name('admin.deviceCatalog.issues.toggle');

  
    // Precios (auto cálculo)
    Route::get('/precios', [AdminPricingRuleController::class, 'index'])->name('admin.pricing.index');
    Route::get('/precios/crear', [AdminPricingRuleController::class, 'create'])->name('admin.pricing.create');
    Route::post('/precios', [AdminPricingRuleController::class, 'store'])->name('admin.pricing.store');
    Route::get('/precios/{rule}/editar', [AdminPricingRuleController::class, 'edit'])->name('admin.pricing.edit');
    Route::put('/precios/{rule}', [AdminPricingRuleController::class, 'update'])->name('admin.pricing.update');

    // JSON resolver (para el cálculo automático en Crear Reparación)
    Route::get('/precios/resolve', [AdminPricingRuleController::class, 'resolve'])->name('admin.pricing.resolve');

 
});

