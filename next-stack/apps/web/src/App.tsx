import { Navigate, Route, Routes } from 'react-router-dom';
import { GlobalVisualEnhancements } from '@/components/GlobalVisualEnhancements';
import { BrandingHeadSync } from '@/components/BrandingHeadSync';
import {
  AdminProductCreateAliasRedirect,
  AdminProductEditAliasRedirect,
  AdminProductLabelAliasRedirect,
  ApiAuthAliasRedirect,
  LegacyAdminOrderPrintAliasRedirect,
  LegacyAdminOrdersAliasRedirect,
  LegacyAdminOrderTicketAliasRedirect,
  LegacyAdminPricingEditAliasRedirect,
  LegacyAdminRepairCreateAliasRedirect,
  LegacyAdminRepairPrintAliasRedirect,
  LegacyAdminRepairsAliasRedirect,
  LegacyAdminRepairTicketAliasRedirect,
  LegacyOrdersAliasRedirect,
  LegacyProductAliasRedirect,
  LegacyRepairsAliasRedirect,
  LegacyResetPasswordAliasRedirect,
  RootEntryRedirect,
  StoreCategoryAliasRedirect,
} from '@/app/routing/route-aliases';
import {
  AdminAccountingPage,
  Admin2faSecurityPage,
  AdminAlertsPage,
  AdminAutoReportsPage,
  AdminBusinessSettingsPage,
  AdminCheckoutSettingsPage,
  AppleAuthCallbackPage,
  AdminCalculationsHubPage,
  AdminCategoriesPage,
  AdminDashboardPage,
  AdminDeviceCatalogPage,
  AdminDeviceTypesPage,
  AdminDevicesCatalogPage,
  AdminHelpFaqPage,
  AdminMailTemplatesPage,
  AdminModelGroupsPage,
  AdminOrderDetailPage,
  AdminOrderPrintPage,
  AdminOrdersPage,
  AdminOrderTicketPage,
  AdminProductCreatePage,
  AdminProductEditPage,
  AdminProductLabelPage,
  AdminProductPricingRulesPage,
  AdminRepairCalculationsHubPage,
  AdminProductsPage,
  AdminSpecialOrderImportPage,
  AdminProvidersPage,
  AdminQuickSalesHistoryPage,
  AdminQuickSalesPage,
  AdminRepairCreatePage,
  AdminRepairDetailPage,
  AdminRepairPricingRuleCreatePage,
  AdminRepairPricingRuleEditPage,
  AdminRepairPricingRulesPage,
  AdminRepairPrintPage,
  AdminRepairsListPage,
  AdminRepairTicketPage,
  AdminRepairTypesPage,
  AdminSettingsHubPage,
  AdminSmtpSettingsPage,
  AdminStoreHeroSettingsPage,
  AdminUsersPage,
  AdminVisualIdentityPage,
  AdminWarrantyCreatePage,
  AdminWarrantiesPage,
  AdminWhatsappOrdersPage,
  AdminWhatsappPage,
  BootstrapAdminPage,
  CartPage,
  CheckoutPage,
  ForgotPasswordPage,
  GoogleAuthCallbackPage,
  HelpPage,
  LoginPage,
  MyAccountPage,
  MyOrdersPage,
  MyRepairsPage,
  OrderDetailPage,
  PublicRepairLookupPage,
  PublicRepairQuoteApprovalPage,
  RegisterPage,
  RepairDetailPage,
  ResetPasswordPage,
  StorePage,
  StoreProductDetailPage,
  VerifyEmailPage,
} from '@/app/routing/route-pages';
import { withShell, withShellSuspense, withSuspense } from '@/app/routing/route-shell';
import { RequireAdmin } from '@/features/auth/RequireAdmin';
import { RequireAuth } from '@/features/auth/RequireAuth';

export default function App() {
  return (
    <>
      <GlobalVisualEnhancements />
      <BrandingHeadSync />
      <Routes>
        <Route path="/" element={<RootEntryRedirect />} />
        <Route path="/api/auth/*" element={<ApiAuthAliasRedirect />} />
        <Route path="/api/*" element={<RootEntryRedirect />} />
        <Route path="/auth/login" element={withSuspense(<LoginPage />)} />
        <Route path="/auth/apple/callback" element={withSuspense(<AppleAuthCallbackPage />)} />
        <Route path="/auth/google/callback" element={withSuspense(<GoogleAuthCallbackPage />)} />
        <Route path="/auth/register" element={withSuspense(<RegisterPage />)} />
        <Route path="/auth/verify-email" element={withSuspense(<VerifyEmailPage />)} />
        <Route path="/auth/forgot-password" element={withSuspense(<ForgotPasswordPage />)} />
        <Route path="/auth/reset-password" element={withSuspense(<ResetPasswordPage />)} />
        <Route path="/auth/bootstrap-admin" element={withSuspense(<BootstrapAdminPage />)} />
        <Route path="/store" element={withShellSuspense(<StorePage />)} />
        <Route path="/tienda" element={withShell(<Navigate to="/store" replace />)} />
        <Route path="/tienda/categoria/:slug" element={withShell(<StoreCategoryAliasRedirect />)} />
        <Route path="/store/category/:slug" element={withShell(<StoreCategoryAliasRedirect />)} />
        <Route path="/store/:slug" element={withShellSuspense(<StoreProductDetailPage />)} />
        <Route path="/producto/:slug" element={withShell(<LegacyProductAliasRedirect />)} />
        <Route path="/reparacion" element={withShellSuspense(<PublicRepairLookupPage />)} />
        <Route path="/reparacion/:id/presupuesto" element={withShellSuspense(<PublicRepairQuoteApprovalPage />)} />
        <Route path="/repair-lookup" element={withShellSuspense(<PublicRepairLookupPage />)} />
        <Route path="/help" element={withShellSuspense(<HelpPage />)} />
        <Route path="/ayuda" element={withShell(<Navigate to="/help" replace />)} />
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/registro" element={<Navigate to="/auth/register" replace />} />
        <Route path="/olvide-contrasena" element={<Navigate to="/auth/forgot-password" replace />} />
        <Route path="/resetear-contrasena/:token" element={<LegacyResetPasswordAliasRedirect />} />
        <Route path="/cart" element={withShellSuspense(<CartPage />)} />
        <Route path="/carrito" element={withShell(<Navigate to="/cart" replace />)} />
        <Route path="/checkout" element={<RequireAuth>{withShellSuspense(<CheckoutPage />)}</RequireAuth>} />
        <Route path="/orders" element={<RequireAuth>{withShellSuspense(<MyOrdersPage />)}</RequireAuth>} />
        <Route path="/orders/:id" element={<RequireAuth>{withShellSuspense(<OrderDetailPage />)}</RequireAuth>} />
        <Route path="/mis-pedidos" element={<RequireAuth>{withShell(<LegacyOrdersAliasRedirect />)}</RequireAuth>} />
        <Route path="/mis-pedidos/:id" element={<RequireAuth>{withShell(<LegacyOrdersAliasRedirect />)}</RequireAuth>} />
        <Route path="/pedido/:id" element={<RequireAuth>{withShell(<LegacyOrdersAliasRedirect />)}</RequireAuth>} />
        <Route path="/repairs" element={<RequireAuth>{withShellSuspense(<MyRepairsPage />)}</RequireAuth>} />
        <Route path="/repairs/:id" element={<RequireAuth>{withShellSuspense(<RepairDetailPage />)}</RequireAuth>} />
        <Route path="/mis-reparaciones" element={<RequireAuth>{withShell(<LegacyRepairsAliasRedirect />)}</RequireAuth>} />
        <Route path="/mis-reparaciones/:id" element={<RequireAuth>{withShell(<LegacyRepairsAliasRedirect />)}</RequireAuth>} />
        <Route path="/mi-cuenta" element={<RequireAuth>{withShellSuspense(<MyAccountPage />)}</RequireAuth>} />
        <Route path="/email/verificar" element={<RequireAuth>{withShell(<Navigate to="/auth/verify-email" replace />)}</RequireAuth>} />
        <Route path="/email/verificar/:id/:hash" element={<RequireAuth>{withShell(<Navigate to="/auth/verify-email" replace />)}</RequireAuth>} />
        <Route path="/admin" element={<RequireAdmin>{withShellSuspense(<AdminDashboardPage />)}</RequireAdmin>} />
        <Route path="/admin/dashboard" element={<RequireAdmin><Navigate to="/admin" replace /></RequireAdmin>} />
        <Route path="/admin/alertas" element={<RequireAdmin>{withShellSuspense(<AdminAlertsPage />)}</RequireAdmin>} />
        <Route path="/admin/alerts" element={<RequireAdmin><Navigate to="/admin/alertas" replace /></RequireAdmin>} />
        <Route path="/admin/orders" element={<RequireAdmin>{withShellSuspense(<AdminOrdersPage />)}</RequireAdmin>} />
        <Route path="/admin/orders/:id" element={<RequireAdmin>{withShellSuspense(<AdminOrderDetailPage />)}</RequireAdmin>} />
        <Route path="/admin/orders/:id/print" element={<RequireAdmin>{withSuspense(<AdminOrderPrintPage />)}</RequireAdmin>} />
        <Route path="/admin/orders/:id/ticket" element={<RequireAdmin>{withSuspense(<AdminOrderTicketPage />)}</RequireAdmin>} />
        <Route path="/admin/pedidos" element={<RequireAdmin><LegacyAdminOrdersAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/pedidos/:id" element={<RequireAdmin><LegacyAdminOrdersAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/pedidos/:id/imprimir" element={<RequireAdmin><LegacyAdminOrderPrintAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/pedidos/:id/ticket" element={<RequireAdmin><LegacyAdminOrderTicketAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/products" element={<RequireAdmin><Navigate to="/admin/productos" replace /></RequireAdmin>} />
        <Route path="/admin/products/create" element={<RequireAdmin><AdminProductCreateAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/products/:id/edit" element={<RequireAdmin><AdminProductEditAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/products/:id/label" element={<RequireAdmin><AdminProductLabelAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/productos" element={<RequireAdmin>{withShellSuspense(<AdminProductsPage />)}</RequireAdmin>} />
        <Route path="/admin/productos/crear" element={<RequireAdmin>{withShellSuspense(<AdminProductCreatePage />)}</RequireAdmin>} />
        <Route path="/admin/productos/encargues/nuevo" element={<RequireAdmin>{withShellSuspense(<AdminSpecialOrderImportPage />)}</RequireAdmin>} />
        <Route path="/admin/productos/:id/editar" element={<RequireAdmin>{withShellSuspense(<AdminProductEditPage />)}</RequireAdmin>} />
        <Route path="/admin/productos/:id/etiqueta" element={<RequireAdmin>{withSuspense(<AdminProductLabelPage />)}</RequireAdmin>} />
        <Route path="/admin/categorias" element={<RequireAdmin>{withShellSuspense(<AdminCategoriesPage />)}</RequireAdmin>} />
        <Route path="/admin/categorias/crear" element={<RequireAdmin>{withShellSuspense(<AdminCategoriesPage />)}</RequireAdmin>} />
        <Route path="/admin/categorias/:id/editar" element={<RequireAdmin>{withShellSuspense(<AdminCategoriesPage />)}</RequireAdmin>} />
        <Route path="/admin/users" element={<RequireAdmin>{withShellSuspense(<AdminUsersPage />)}</RequireAdmin>} />
        <Route path="/admin/usuarios" element={<RequireAdmin><Navigate to="/admin/users" replace /></RequireAdmin>} />
        <Route path="/admin/configuraciones" element={<RequireAdmin>{withShellSuspense(<AdminSettingsHubPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion" element={<RequireAdmin><Navigate to="/admin/configuraciones" replace /></RequireAdmin>} />
        <Route path="/admin/configuracion/mail" element={<RequireAdmin>{withShellSuspense(<AdminSmtpSettingsPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/reportes" element={<RequireAdmin>{withShellSuspense(<AdminAutoReportsPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/negocio" element={<RequireAdmin>{withShellSuspense(<AdminBusinessSettingsPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/checkoutpagos" element={<RequireAdmin>{withShellSuspense(<AdminCheckoutSettingsPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/checkout-pagos" element={<RequireAdmin><Navigate to="/admin/configuracion/checkoutpagos" replace /></RequireAdmin>} />
        <Route path="/admin/configuracion/identidadvisual" element={<RequireAdmin>{withShellSuspense(<AdminVisualIdentityPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/identidad-visual" element={<RequireAdmin><Navigate to="/admin/configuracion/identidadvisual" replace /></RequireAdmin>} />
        <Route path="/admin/configuracion/portadatienda" element={<RequireAdmin>{withShellSuspense(<AdminStoreHeroSettingsPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/portada-tienda" element={<RequireAdmin><Navigate to="/admin/configuracion/portadatienda" replace /></RequireAdmin>} />
        <Route path="/admin/configuracion/correos" element={<RequireAdmin><Navigate to="/admin/mail-templates" replace /></RequireAdmin>} />
        <Route path="/admin/configuracion/ayuda" element={<RequireAdmin><Navigate to="/admin/help" replace /></RequireAdmin>} />
        <Route path="/admin/seguridad/2fa" element={<RequireAdmin>{withShellSuspense(<Admin2faSecurityPage />)}</RequireAdmin>} />
        <Route path="/admin/calculos" element={<RequireAdmin>{withShellSuspense(<AdminCalculationsHubPage />)}</RequireAdmin>} />
        <Route path="/admin/calculos/productos" element={<RequireAdmin>{withShellSuspense(<AdminProductPricingRulesPage />)}</RequireAdmin>} />
        <Route path="/admin/calculos/reparaciones" element={<RequireAdmin>{withShellSuspense(<AdminRepairCalculationsHubPage />)}</RequireAdmin>} />
        <Route path="/admin/precios" element={<RequireAdmin>{withShellSuspense(<AdminRepairPricingRulesPage />)}</RequireAdmin>} />
        <Route path="/admin/precios/crear" element={<RequireAdmin>{withShellSuspense(<AdminRepairPricingRuleCreatePage />)}</RequireAdmin>} />
        <Route path="/admin/precios/:id/editar" element={<RequireAdmin>{withShellSuspense(<AdminRepairPricingRuleEditPage />)}</RequireAdmin>} />
        <Route path="/admin/pricing/:id/edit" element={<RequireAdmin><LegacyAdminPricingEditAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/gruposmodelos" element={<RequireAdmin>{withShellSuspense(<AdminModelGroupsPage />)}</RequireAdmin>} />
        <Route path="/admin/grupos-modelos" element={<RequireAdmin><Navigate to="/admin/gruposmodelos" replace /></RequireAdmin>} />
        <Route path="/admin/tiposreparacion" element={<RequireAdmin>{withShellSuspense(<AdminRepairTypesPage />)}</RequireAdmin>} />
        <Route path="/admin/tipos-reparacion" element={<RequireAdmin><Navigate to="/admin/tiposreparacion" replace /></RequireAdmin>} />
        <Route path="/admin/catalogodispositivos" element={<RequireAdmin>{withShellSuspense(<AdminDevicesCatalogPage />)}</RequireAdmin>} />
        <Route path="/admin/catalogo-dispositivos" element={<RequireAdmin><Navigate to="/admin/catalogodispositivos" replace /></RequireAdmin>} />
        <Route path="/admin/tiposdispositivo" element={<RequireAdmin>{withShellSuspense(<AdminDeviceTypesPage />)}</RequireAdmin>} />
        <Route path="/admin/tipos-dispositivo" element={<RequireAdmin><Navigate to="/admin/tiposdispositivo" replace /></RequireAdmin>} />
        <Route path="/admin/device-types" element={<Navigate to="/admin/tiposdispositivo" replace />} />
        <Route path="/admin/settings" element={<RequireAdmin><Navigate to="/admin/configuraciones" replace /></RequireAdmin>} />
        <Route path="/admin/mail-templates" element={<RequireAdmin>{withShellSuspense(<AdminMailTemplatesPage />)}</RequireAdmin>} />
        <Route path="/admin/whatsapp" element={<RequireAdmin>{withShellSuspense(<AdminWhatsappPage />)}</RequireAdmin>} />
        <Route path="/admin/whatsapppedidos" element={<RequireAdmin>{withShellSuspense(<AdminWhatsappOrdersPage />)}</RequireAdmin>} />
        <Route path="/admin/whatsapp-pedidos" element={<RequireAdmin><Navigate to="/admin/whatsapppedidos" replace /></RequireAdmin>} />
        <Route path="/admin/help" element={<RequireAdmin>{withShellSuspense(<AdminHelpFaqPage />)}</RequireAdmin>} />
        <Route path="/admin/repairs" element={<RequireAdmin>{withShellSuspense(<AdminRepairsListPage />)}</RequireAdmin>} />
        <Route path="/admin/repairs/create" element={<RequireAdmin>{withShellSuspense(<AdminRepairCreatePage />)}</RequireAdmin>} />
        <Route path="/admin/repairs/:id" element={<RequireAdmin>{withShellSuspense(<AdminRepairDetailPage />)}</RequireAdmin>} />
        <Route path="/admin/repairs/:id/print" element={<RequireAdmin>{withSuspense(<AdminRepairPrintPage />)}</RequireAdmin>} />
        <Route path="/admin/repairs/:id/ticket" element={<RequireAdmin>{withSuspense(<AdminRepairTicketPage />)}</RequireAdmin>} />
        <Route path="/admin/reparaciones" element={<RequireAdmin><LegacyAdminRepairsAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/reparaciones/crear" element={<RequireAdmin><LegacyAdminRepairCreateAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/reparaciones/:id" element={<RequireAdmin><LegacyAdminRepairsAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/reparaciones/:id/imprimir" element={<RequireAdmin><LegacyAdminRepairPrintAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/reparaciones/:id/ticket" element={<RequireAdmin><LegacyAdminRepairTicketAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/ventas-rapidas" element={<RequireAdmin>{withShellSuspense(<AdminQuickSalesPage />)}</RequireAdmin>} />
        <Route path="/admin/ventas-rapidas/ticket" element={<RequireAdmin>{withShellSuspense(<AdminQuickSalesPage />)}</RequireAdmin>} />
        <Route path="/admin/ventas-rapidas/historial" element={<RequireAdmin>{withShellSuspense(<AdminQuickSalesHistoryPage />)}</RequireAdmin>} />
        <Route path="/admin/garantias" element={<RequireAdmin>{withShellSuspense(<AdminWarrantiesPage />)}</RequireAdmin>} />
        <Route path="/admin/warranties" element={<RequireAdmin><Navigate to="/admin/garantias" replace /></RequireAdmin>} />
        <Route path="/admin/garantias/crear" element={<RequireAdmin>{withShellSuspense(<AdminWarrantyCreatePage />)}</RequireAdmin>} />
        <Route path="/admin/proveedores" element={<RequireAdmin>{withShellSuspense(<AdminProvidersPage />)}</RequireAdmin>} />
        <Route path="/admin/suppliers" element={<RequireAdmin><Navigate to="/admin/proveedores" replace /></RequireAdmin>} />
        <Route path="/admin/contabilidad" element={<RequireAdmin>{withShellSuspense(<AdminAccountingPage />)}</RequireAdmin>} />
        <Route path="/admin/accounting" element={<RequireAdmin><Navigate to="/admin/contabilidad" replace /></RequireAdmin>} />
        <Route path="/admin/device-catalog" element={<RequireAdmin>{withShellSuspense(<AdminDeviceCatalogPage />)}</RequireAdmin>} />
      </Routes>
    </>
  );
}
