<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AdminBusinessSettingsController;
use App\Http\Controllers\AdminCategoryController;
use App\Http\Controllers\AdminCalculationSettingsController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminHelpEntryController;
use App\Http\Controllers\AdminLedgerController;
use App\Http\Controllers\AdminDeviceCatalogController;
use App\Http\Controllers\AdminDeviceCatalogManageController;
use App\Http\Controllers\AdminDeviceTypeController;
use App\Http\Controllers\AdminModelGroupController;
use App\Http\Controllers\AdminMaintenanceController;
use App\Http\Controllers\AdminOrderController;
use App\Http\Controllers\AdminOrderPrintController;
use App\Http\Controllers\AdminOrderTicketController;
use App\Http\Controllers\AdminOrderWhatsappTemplateController;
use App\Http\Controllers\AdminPricingRuleController;
use App\Http\Controllers\AdminProductController;
use App\Http\Controllers\AdminProductPricingRuleController;
use App\Http\Controllers\AdminQuickSaleController;
use App\Http\Controllers\AdminRepairController;
use App\Http\Controllers\AdminRepairPrintController;
use App\Http\Controllers\AdminRepairTicketController;
use App\Http\Controllers\AdminRepairTypeController;
use App\Http\Controllers\AdminSupplierController;
use App\Http\Controllers\AdminSupplierPartSearchController;
use App\Http\Controllers\AdminTwoFactorController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminWarrantyIncidentController;
use App\Http\Controllers\AdminWhatsappTemplateController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\RepairLookupController;
use App\Http\Controllers\RepairQuoteApprovalController;
use App\Http\Controllers\HelpCenterController;
use App\Http\Controllers\LocalStorageController;
use App\Http\Controllers\SiteManifestController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\UserRepairController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Rutas publicas
|--------------------------------------------------------------------------
*/
Route::get('/', [StoreController::class, 'index'])->name('home');
Route::get('/manifest.webmanifest', SiteManifestController::class)->name('site.manifest');
Route::get('/tienda', [StoreController::class, 'index'])->name('store.index');
Route::get('/tienda/sugerencias', [StoreController::class, 'suggestions'])
    ->middleware('throttle:120,1')
    ->name('store.suggestions');
Route::get('/tienda/categoria/{category:slug}', [StoreController::class, 'category'])->name('store.category');
Route::get('/producto/{slug}', [StoreController::class, 'product'])->name('store.product');
Route::get('/ayuda', [HelpCenterController::class, 'index'])->name('help.index');

/*
|--------------------------------------------------------------------------
| Auth
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth-login')->name('login.post');

    Route::get('/registro', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/registro', [AuthController::class, 'register'])->middleware('throttle:auth-register')->name('register.post');

    Route::get('/olvide-contrasena', [AuthController::class, 'showForgotPassword'])->name('password.request');
    Route::post('/olvide-contrasena', [AuthController::class, 'sendResetLinkEmail'])
        ->middleware('throttle:6,1')
        ->name('password.email');
    Route::get('/resetear-contrasena/{token}', [AuthController::class, 'showResetPassword'])->name('password.reset');
    Route::post('/resetear-contrasena', [AuthController::class, 'resetPassword'])->name('password.update');

    // Google OAuth
    Route::get('/auth/google', [AuthController::class, 'googleRedirect'])->name('auth.google.redirect');
    Route::get('/auth/google/callback', [AuthController::class, 'googleCallback'])->name('auth.google.callback');
});

Route::post('/logout', [AuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/email/verificar', [AuthController::class, 'showEmailVerificationNotice'])->name('verification.notice');
    Route::post('/email/verification-notification', [AuthController::class, 'resendVerification'])
        ->middleware('throttle:6,1')
        ->name('verification.send');
    Route::get('/email/verificar/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
});

/*
|--------------------------------------------------------------------------
| Carrito + checkout
|--------------------------------------------------------------------------
*/
Route::get('/carrito', [CartController::class, 'index'])->name('cart.index');
Route::post('/carrito/agregar/{product}', [CartController::class, 'add'])->middleware('throttle:cart-write')->name('cart.add');
Route::post('/carrito/actualizar/{product}', [CartController::class, 'update'])->middleware('throttle:cart-write')->name('cart.update');
Route::post('/carrito/eliminar/{product}', [CartController::class, 'remove'])->middleware('throttle:cart-write')->name('cart.remove');
Route::post('/carrito/vaciar', [CartController::class, 'clear'])->middleware('throttle:cart-write')->name('cart.clear');

Route::get('/checkout', [CartController::class, 'checkout'])->middleware(['auth', 'verified.context:checkout'])->name('checkout');
Route::post('/checkout/confirmar', [OrderController::class, 'confirm'])->middleware(['auth', 'verified.context:checkout', 'throttle:checkout-confirm'])->name('checkout.confirm');

/*
|--------------------------------------------------------------------------
| Pedidos + Reparaciones (cliente)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {
    Route::get('/mi-cuenta', [AccountController::class, 'edit'])->name('account.edit');
    Route::put('/mi-cuenta', [AccountController::class, 'update'])->name('account.update');

    // Cambiar contrasena (simple)
    Route::put('/mi-cuenta/password', [AccountController::class, 'updatePassword'])->name('account.password');

    Route::middleware('verified')->group(function () {
        Route::get('/mis-pedidos', [OrderController::class, 'index'])->name('orders.index');
        Route::get('/mis-pedidos/{order}', [OrderController::class, 'show'])->name('orders.show');
        Route::get('/pedido/{order}', [OrderController::class, 'thankYou'])->name('orders.thankyou');

        Route::get('/mis-reparaciones', [UserRepairController::class, 'index'])->name('repairs.my.index');
        Route::get('/mis-reparaciones/{repair}', [UserRepairController::class, 'show'])->name('repairs.my.show');
    });

});

/*
|--------------------------------------------------------------------------
| Reparacion - consulta publica (lookup)
|--------------------------------------------------------------------------
*/
Route::get('/reparacion', [RepairLookupController::class, 'form'])->name('repairs.lookup');
Route::post('/reparacion', [RepairLookupController::class, 'lookup'])
    ->middleware('throttle:repair-lookup')
    ->name('repairs.lookup.post');

Route::middleware('signed')->group(function () {
    Route::get('/reparacion/{repair}/presupuesto', [RepairQuoteApprovalController::class, 'show'])
        ->name('repairs.quote.show');
    Route::post('/reparacion/{repair}/presupuesto/aprobar', [RepairQuoteApprovalController::class, 'approve'])
        ->name('repairs.quote.approve');
    Route::post('/reparacion/{repair}/presupuesto/rechazar', [RepairQuoteApprovalController::class, 'reject'])
        ->name('repairs.quote.reject');
});

/*
|--------------------------------------------------------------------------
| Storage local (solo dev)
|--------------------------------------------------------------------------
*/
Route::get('/storage/{path}', LocalStorageController::class)
    ->where('path', '.*')
    ->name('storage.local');

Route::prefix('admin')
    ->middleware(['auth', 'admin', 'can:access-admin', 'admin.restrict'])
    ->group(function () {
        Route::get('/two-factor/challenge', [AdminTwoFactorController::class, 'challenge'])
            ->name('admin.two_factor.challenge');
        Route::post('/two-factor/challenge', [AdminTwoFactorController::class, 'verifyChallenge'])
            ->middleware('throttle:admin-2fa')
            ->name('admin.two_factor.challenge.verify');
    });

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->middleware(['auth', 'admin', 'can:access-admin', 'admin.restrict', 'admin.2fa', 'throttle:admin-requests'])->group(function () {

    Route::get('/', [AdminDashboardController::class, 'index'])->name('admin');
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/dashboard/export.csv', [AdminDashboardController::class, 'exportCsv'])->name('admin.dashboard.export');
    Route::get('/dashboard/export.xlsx', [AdminDashboardController::class, 'exportXlsx'])->name('admin.dashboard.export_xlsx');
    Route::get('/contabilidad', [AdminLedgerController::class, 'index'])->name('admin.ledger.index');
    Route::post('/mantenimiento/migrar', [AdminMaintenanceController::class, 'migrate'])->name('admin.maintenance.migrate');
    Route::get('/calculos', [AdminCalculationSettingsController::class, 'index'])->name('admin.calculations.index');

    // Pedidos
    Route::get('/pedidos', [AdminOrderController::class, 'index'])->name('admin.orders.index');
    Route::get('/pedidos/{order}', [AdminOrderController::class, 'show'])->name('admin.orders.show');
    Route::post('/pedidos/{order}/estado', [AdminOrderController::class, 'updateStatus'])->name('admin.orders.updateStatus');

    // WhatsApp Pedidos (logs)
    Route::post('/pedidos/{order}/whatsapp', [AdminOrderController::class, 'whatsappLog'])->name('admin.orders.whatsappLog');
    Route::post('/pedidos/{order}/whatsapp-ajax', [AdminOrderController::class, 'whatsappLogAjax'])->name('admin.orders.whatsappLogAjax');

    // Venta rapida (mostrador)
    Route::get('/ventas-rapidas', [AdminQuickSaleController::class, 'index'])->name('admin.quick_sales.index');
    Route::get('/ventas-rapidas/ticket', [AdminQuickSaleController::class, 'ticketPartial'])->name('admin.quick_sales.ticket');
    Route::get('/ventas-rapidas/historial', [AdminQuickSaleController::class, 'history'])->name('admin.quick_sales.history');
    Route::get('/ventas-rapidas/historial/export.csv', [AdminQuickSaleController::class, 'exportCsv'])->name('admin.quick_sales.export_csv');
    Route::get('/ventas-rapidas/historial/export.xlsx', [AdminQuickSaleController::class, 'exportXlsx'])->name('admin.quick_sales.export_xlsx');
    Route::post('/ventas-rapidas/agregar', [AdminQuickSaleController::class, 'add'])->name('admin.quick_sales.add');
    Route::post('/ventas-rapidas/item/{product}', [AdminQuickSaleController::class, 'updateItem'])->name('admin.quick_sales.update_item');
    Route::delete('/ventas-rapidas/item/{product}', [AdminQuickSaleController::class, 'removeItem'])->name('admin.quick_sales.remove_item');
    Route::post('/ventas-rapidas/limpiar', [AdminQuickSaleController::class, 'clear'])->name('admin.quick_sales.clear');
    Route::post('/ventas-rapidas/confirmar', [AdminQuickSaleController::class, 'confirm'])->name('admin.quick_sales.confirm');

    // Garantias y perdidas
    Route::get('/garantias', [AdminWarrantyIncidentController::class, 'index'])->name('admin.warranty_incidents.index');
    Route::get('/garantias/crear', [AdminWarrantyIncidentController::class, 'create'])->name('admin.warranty_incidents.create');
    Route::post('/garantias', [AdminWarrantyIncidentController::class, 'store'])->name('admin.warranty_incidents.store');
    Route::post('/garantias/{incident}/cerrar', [AdminWarrantyIncidentController::class, 'close'])->name('admin.warranty_incidents.close');

    // Reparaciones
    Route::get('/reparaciones', [AdminRepairController::class, 'index'])->name('admin.repairs.index');
    Route::get('/reparaciones/crear', [AdminRepairController::class, 'create'])->name('admin.repairs.create');
    Route::post('/reparaciones', [AdminRepairController::class, 'store'])->name('admin.repairs.store');

    Route::get('/reparaciones/{repair}', [AdminRepairController::class, 'show'])->name('admin.repairs.show');
    Route::put('/reparaciones/{repair}', [AdminRepairController::class, 'update'])->name('admin.repairs.update');

    Route::post('/reparaciones/{repair}/estado', [AdminRepairController::class, 'updateStatus'])->name('admin.repairs.updateStatus');
    Route::post('/reparaciones/{repair}/reembolso-total', [AdminRepairController::class, 'refundTotal'])->name('admin.repairs.refundTotal');

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
    Route::get('/productos/precio-recomendado/resolve', [AdminProductController::class, 'resolveRecommendedPrice'])->name('admin.product_pricing_rules.resolve');
    Route::get('/productos/{product}/editar', [AdminProductController::class, 'edit'])->name('admin.products.edit');
    Route::get('/productos/{product}/etiqueta', [AdminProductController::class, 'label'])->name('admin.products.label');
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

    // Proveedores
    Route::get('/proveedores', [AdminSupplierController::class, 'index'])->name('admin.suppliers.index');
    Route::post('/proveedores', [AdminSupplierController::class, 'store'])->name('admin.suppliers.store');
    Route::post('/proveedores/importar-sugeridos', [AdminSupplierController::class, 'importDefaults'])->name('admin.suppliers.import_defaults');
    Route::post('/proveedores/reordenar', [AdminSupplierController::class, 'reorder'])->name('admin.suppliers.reorder');
    Route::put('/proveedores/{supplier}', [AdminSupplierController::class, 'update'])->name('admin.suppliers.update');
    Route::post('/proveedores/{supplier}/toggle', [AdminSupplierController::class, 'toggle'])->name('admin.suppliers.toggle');
    Route::post('/proveedores/{supplier}/probar-busqueda', [AdminSupplierController::class, 'probe'])->name('admin.suppliers.probe');
    Route::get('/proveedores/repuestos/search', AdminSupplierPartSearchController::class)
        ->middleware('throttle:60,1')
        ->name('admin.suppliers.parts.search');
    Route::get('/proveedores/repuestos/search/{supplier}', [AdminSupplierPartSearchController::class, 'bySupplier'])
        ->middleware('throttle:60,1')
        ->name('admin.suppliers.parts.search_by_supplier');

    // Configuracion del negocio
    Route::get('/configuracion', [AdminBusinessSettingsController::class, 'index'])->name('admin.settings.index');
    Route::get('/configuracion/negocio', [AdminBusinessSettingsController::class, 'business'])->name('admin.settings.business');
    Route::get('/configuracion/reportes', [AdminBusinessSettingsController::class, 'reports'])->name('admin.settings.reports.index');
    Route::get('/configuracion/mail', [AdminBusinessSettingsController::class, 'mail'])->name('admin.settings.mail.index');
    Route::post('/configuracion', [AdminBusinessSettingsController::class, 'update'])->name('admin.settings.update');
    Route::post('/configuracion/reportes/dashboard', [AdminBusinessSettingsController::class, 'updateReports'])
        ->name('admin.settings.reports.update');
    Route::post('/configuracion/reportes/dashboard/enviar', [AdminBusinessSettingsController::class, 'sendWeeklyReport'])
        ->name('admin.settings.reports.send');
    Route::post('/configuracion/mail/prueba', [AdminBusinessSettingsController::class, 'sendSmtpTestEmail'])
        ->name('admin.settings.smtp_test.send');
    Route::get('/configuracion/identidad-visual', [AdminBusinessSettingsController::class, 'assets'])
        ->name('admin.settings.assets.index');
    Route::get('/configuracion/portada-tienda', [AdminBusinessSettingsController::class, 'storeHero'])
        ->name('admin.settings.store_hero.index');
    Route::get('/configuracion/correos', [AdminBusinessSettingsController::class, 'mailTemplates'])
        ->name('admin.settings.mail_templates.index');
    Route::get('/configuracion/ayuda', [AdminHelpEntryController::class, 'index'])
        ->name('admin.settings.help.index');
    Route::post('/configuracion/ayuda', [AdminHelpEntryController::class, 'store'])
        ->name('admin.settings.help.store');
    Route::post('/configuracion/ayuda/config', [AdminHelpEntryController::class, 'updateConfig'])
        ->name('admin.settings.help.config.update');
    Route::put('/configuracion/ayuda/{helpEntry}', [AdminHelpEntryController::class, 'update'])
        ->name('admin.settings.help.update');
    Route::delete('/configuracion/ayuda/{helpEntry}', [AdminHelpEntryController::class, 'destroy'])
        ->name('admin.settings.help.destroy');
    Route::post('/configuracion/correos', [AdminBusinessSettingsController::class, 'updateMailTemplates'])
        ->name('admin.settings.mail_templates.update');
    Route::post('/configuracion/correos/{templateKey}/restaurar', [AdminBusinessSettingsController::class, 'resetMailTemplate'])
        ->where('templateKey', '[A-Za-z0-9_]+')
        ->name('admin.settings.mail_templates.reset');
    Route::post('/configuracion/identidad-visual/{assetKey}', [AdminBusinessSettingsController::class, 'updateAsset'])
        ->where('assetKey', '[A-Za-z0-9_]+')
        ->name('admin.settings.assets.update');
    Route::delete('/configuracion/identidad-visual/{assetKey}', [AdminBusinessSettingsController::class, 'resetAsset'])
        ->where('assetKey', '[A-Za-z0-9_]+')
        ->name('admin.settings.assets.reset');
    Route::get('/seguridad/2fa', [AdminTwoFactorController::class, 'settings'])
        ->name('admin.two_factor.settings');
    Route::post('/seguridad/2fa/regenerar', [AdminTwoFactorController::class, 'regenerate'])
        ->name('admin.two_factor.regenerate');
    Route::post('/seguridad/2fa/activar', [AdminTwoFactorController::class, 'enable'])
        ->middleware('throttle:admin-2fa')
        ->name('admin.two_factor.enable');
    Route::post('/seguridad/2fa/codigos-regenerar', [AdminTwoFactorController::class, 'regenerateRecoveryCodes'])
        ->middleware('throttle:admin-2fa')
        ->name('admin.two_factor.recovery.regenerate');
    Route::get('/seguridad/2fa/codigos/txt', [AdminTwoFactorController::class, 'downloadRecoveryCodesTxt'])
        ->name('admin.two_factor.recovery.download');
    Route::get('/seguridad/2fa/codigos/imprimir', [AdminTwoFactorController::class, 'printRecoveryCodes'])
        ->name('admin.two_factor.recovery.print');
    Route::post('/seguridad/2fa/codigos/ocultar', [AdminTwoFactorController::class, 'clearRecoveryExport'])
        ->name('admin.two_factor.recovery.clear');
    Route::post('/seguridad/2fa/desactivar', [AdminTwoFactorController::class, 'disable'])
        ->middleware('throttle:admin-2fa')
        ->name('admin.two_factor.disable');

    // WhatsApp Reparaciones
    Route::get('/whatsapp', [AdminWhatsappTemplateController::class, 'index'])->name('admin.whatsapp_templates.index');
    Route::post('/whatsapp', [AdminWhatsappTemplateController::class, 'update'])->name('admin.whatsapp_templates.update');

    // WhatsApp Pedidos (plantillas)
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

    // Reglas de cálculo para productos (costo -> venta)
    Route::get('/calculos/productos', [AdminProductPricingRuleController::class, 'index'])->name('admin.product_pricing_rules.index');
    Route::post('/calculos/productos/config', [AdminProductPricingRuleController::class, 'updateSettings'])->name('admin.product_pricing_rules.settings.update');
    Route::post('/calculos/productos', [AdminProductPricingRuleController::class, 'store'])->name('admin.product_pricing_rules.store');
    Route::put('/calculos/productos/{rule}', [AdminProductPricingRuleController::class, 'update'])->name('admin.product_pricing_rules.update');
    Route::delete('/calculos/productos/{rule}', [AdminProductPricingRuleController::class, 'destroy'])->name('admin.product_pricing_rules.destroy');

});
