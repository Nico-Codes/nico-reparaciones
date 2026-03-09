import { Route, Routes, Navigate, useParams } from 'react-router-dom';
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage';
import { AdminMailTemplatesPage } from '@/features/admin/AdminMailTemplatesPage';
import { AdminSettingsHubPage } from '@/features/admin/AdminSettingsHubPage';
import { AdminSmtpSettingsPage } from '@/features/admin/AdminSmtpSettingsPage';
import { AdminAutoReportsPage } from '@/features/admin/AdminAutoReportsPage';
import { AdminBusinessSettingsPage } from '@/features/admin/AdminBusinessSettingsPage';
import { AdminVisualIdentityPage } from '@/features/admin/AdminVisualIdentityPage';
import { AdminStoreHeroSettingsPage } from '@/features/admin/AdminStoreHeroSettingsPage';
import { Admin2faSecurityPage } from '@/features/admin/Admin2faSecurityPage';
import { AdminCalculationsHubPage } from '@/features/admin/AdminCalculationsHubPage';
import { AdminProductPricingRulesPage } from '@/features/admin/AdminProductPricingRulesPage';
import { AdminRepairPricingRulesPage } from '@/features/admin/AdminRepairPricingRulesPage';
import { AdminRepairPricingRuleCreatePage } from '@/features/admin/AdminRepairPricingRuleCreatePage';
import { AdminRepairPricingRuleEditPage } from '@/features/admin/AdminRepairPricingRuleEditPage';
import { AdminModelGroupsPage } from '@/features/admin/AdminModelGroupsPage';
import { AdminRepairTypesPage } from '@/features/admin/AdminRepairTypesPage';
import { AdminDevicesCatalogPage } from '@/features/admin/AdminDevicesCatalogPage';
import { AdminDeviceTypesPage } from '@/features/admin/AdminDeviceTypesPage';
import { AdminUsersPage } from '@/features/admin/AdminUsersPage';
import { AdminWhatsappPage } from '@/features/admin/AdminWhatsappPage';
import { AdminWhatsappOrdersPage } from '@/features/admin/AdminWhatsappOrdersPage';
import { AdminHelpFaqPage } from '@/features/admin/AdminHelpFaqPage';
import { AdminAlertsPage } from '@/features/admin/AdminAlertsPage';
import { AdminAccountingPage } from '@/features/accounting/AdminAccountingPage';
import { BootstrapAdminPage } from '@/features/auth/BootstrapAdminPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { RequireAdmin } from '@/features/auth/RequireAdmin';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/features/auth/VerifyEmailPage';
import { MyAccountPage } from '@/features/auth/MyAccountPage';
import { authStorage } from '@/features/auth/storage';
import { CartPage } from '@/features/cart/CartPage';
import { AdminProductsPage } from '@/features/catalogAdmin/AdminProductsPage';
import { AdminProductEditPage } from '@/features/catalogAdmin/AdminProductEditPage';
import { AdminProductCreatePage } from '@/features/catalogAdmin/AdminProductCreatePage';
import { AdminProductLabelPage } from '@/features/catalogAdmin/AdminProductLabelPage';
import { AdminCategoriesPage } from '@/features/catalogAdmin/AdminCategoriesPage';
import { AdminDeviceCatalogPage } from '@/features/deviceCatalog/AdminDeviceCatalogPage';
import { CheckoutPage } from '@/features/orders/CheckoutPage';
import { AdminOrdersPage } from '@/features/orders/AdminOrdersPage';
import { AdminOrderDetailPage } from '@/features/orders/AdminOrderDetailPage';
import { AdminOrderPrintPage } from '@/features/orders/AdminOrderPrintPage';
import { AdminOrderTicketPage } from '@/features/orders/AdminOrderTicketPage';
import { AdminQuickSalesPage } from '@/features/orders/AdminQuickSalesPage';
import { AdminQuickSalesHistoryPage } from '@/features/orders/AdminQuickSalesHistoryPage';
import { MyOrdersPage } from '@/features/orders/MyOrdersPage';
import { OrderDetailPage } from '@/features/orders/OrderDetailPage';
import { AdminRepairsListPage } from '@/features/repairs/AdminRepairsListPage';
import { AdminRepairDetailPage } from '@/features/repairs/AdminRepairDetailPage';
import { AdminRepairPrintPage } from '@/features/repairs/AdminRepairPrintPage';
import { AdminRepairTicketPage } from '@/features/repairs/AdminRepairTicketPage';
import { MyRepairsPage } from '@/features/repairs/MyRepairsPage';
import { PublicRepairLookupPage } from '@/features/repairs/PublicRepairLookupPage';
import { PublicRepairQuoteApprovalPage } from '@/features/repairs/PublicRepairQuoteApprovalPage';
import { RepairDetailPage } from '@/features/repairs/RepairDetailPage';
import { AdminWarrantyCreatePage } from '@/features/warranties/AdminWarrantyCreatePage';
import { AdminWarrantiesPage } from '@/features/warranties/AdminWarrantiesPage';
import { AdminProvidersPage } from '@/features/providers/AdminProvidersPage';
import { StorePage } from '@/features/store/StorePage';
import { StoreProductDetailPage } from '@/features/store/StoreProductDetailPage';
import { HelpPage } from '@/features/help/HelpPage';
import { AppShell } from '@/layouts/AppShell';
import { GlobalVisualEnhancements } from '@/components/GlobalVisualEnhancements';
import { BrandingHeadSync } from '@/components/BrandingHeadSync';

function withShell(element: React.ReactNode) {
  return <AppShell>{element}</AppShell>;
}

function RootEntryRedirect() {
  const user = authStorage.getUser();
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/store" replace />;
}

function StoreCategoryAliasRedirect() {
  const { slug = '' } = useParams();
  const category = slug.trim();
  return <Navigate to={category ? `/store?category=${encodeURIComponent(category)}` : '/store'} replace />;
}

function LegacyProductAliasRedirect() {
  const { slug = '' } = useParams();
  return <Navigate to={slug ? `/store/${encodeURIComponent(slug)}` : '/store'} replace />;
}

function LegacyResetPasswordAliasRedirect() {
  const { token = '' } = useParams();
  const qs = token ? `?token=${encodeURIComponent(token)}` : '';
  return <Navigate to={`/auth/reset-password${qs}`} replace />;
}

function LegacyOrdersAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/orders/${encodeURIComponent(id)}` : '/orders'} replace />;
}

function LegacyRepairsAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/repairs/${encodeURIComponent(id)}` : '/repairs'} replace />;
}

function LegacyAdminOrdersAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/orders/${encodeURIComponent(id)}` : '/admin/orders'} replace />;
}

function LegacyAdminOrderPrintAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/orders/${encodeURIComponent(id)}/print` : '/admin/orders'} replace />;
}

function LegacyAdminOrderTicketAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/orders/${encodeURIComponent(id)}/ticket` : '/admin/orders'} replace />;
}

function LegacyAdminRepairsAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/repairs/${encodeURIComponent(id)}` : '/admin/repairs'} replace />;
}

function LegacyAdminRepairPrintAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/repairs/${encodeURIComponent(id)}/print` : '/admin/repairs'} replace />;
}

function LegacyAdminRepairTicketAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/repairs/${encodeURIComponent(id)}/ticket` : '/admin/repairs'} replace />;
}

function AdminProductEditAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/productos/${encodeURIComponent(id)}/editar` : '/admin/productos'} replace />;
}

function AdminProductCreateAliasRedirect() {
  return <Navigate to="/admin/productos/crear" replace />;
}

function AdminProductLabelAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/productos/${encodeURIComponent(id)}/etiqueta` : '/admin/productos'} replace />;
}

function LegacyAdminPricingEditAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/precios/${encodeURIComponent(id)}/editar` : '/admin/precios'} replace />;
}

function ApiAuthAliasRedirect() {
  const { '*': rest = '' } = useParams();
  const path = `/${rest}`.replace(/\/+/g, '/');
  if (path === '/login') return <Navigate to="/auth/login" replace />;
  if (path === '/register') return <Navigate to="/auth/register" replace />;
  if (path === '/forgot-password') return <Navigate to="/auth/forgot-password" replace />;
  if (path === '/reset-password') return <Navigate to="/auth/reset-password" replace />;
  if (path === '/verify-email') return <Navigate to="/auth/verify-email" replace />;
  return <Navigate to="/auth/login" replace />;
}

export default function App() {
  return (
    <>
      <GlobalVisualEnhancements />
      <BrandingHeadSync />
      <Routes>
        <Route path="/" element={<RootEntryRedirect />} />
        <Route path="/api/auth/*" element={<ApiAuthAliasRedirect />} />
        <Route path="/api/*" element={<RootEntryRedirect />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/verify-email" element={withShell(<VerifyEmailPage />)} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/bootstrap-admin" element={<BootstrapAdminPage />} />
        <Route path="/store" element={withShell(<StorePage />)} />
        <Route path="/tienda" element={withShell(<Navigate to="/store" replace />)} />
        <Route path="/tienda/categoria/:slug" element={withShell(<StoreCategoryAliasRedirect />)} />
        <Route path="/store/category/:slug" element={withShell(<StoreCategoryAliasRedirect />)} />
        <Route path="/store/:slug" element={withShell(<StoreProductDetailPage />)} />
        <Route path="/producto/:slug" element={withShell(<LegacyProductAliasRedirect />)} />
        <Route path="/reparacion" element={withShell(<PublicRepairLookupPage />)} />
        <Route path="/reparacion/:id/presupuesto" element={withShell(<PublicRepairQuoteApprovalPage />)} />
        <Route path="/repair-lookup" element={withShell(<PublicRepairLookupPage />)} />
        <Route path="/help" element={withShell(<HelpPage />)} />
        <Route path="/ayuda" element={withShell(<Navigate to="/help" replace />)} />
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/registro" element={<Navigate to="/auth/register" replace />} />
        <Route path="/olvide-contrasena" element={<Navigate to="/auth/forgot-password" replace />} />
        <Route path="/resetear-contrasena/:token" element={<LegacyResetPasswordAliasRedirect />} />
        <Route path="/cart" element={withShell(<CartPage />)} />
        <Route path="/carrito" element={withShell(<Navigate to="/cart" replace />)} />
        <Route path="/checkout" element={<RequireAuth>{withShell(<CheckoutPage />)}</RequireAuth>} />
        <Route path="/orders" element={<RequireAuth>{withShell(<MyOrdersPage />)}</RequireAuth>} />
        <Route path="/orders/:id" element={<RequireAuth>{withShell(<OrderDetailPage />)}</RequireAuth>} />
        <Route path="/mis-pedidos" element={<RequireAuth>{withShell(<LegacyOrdersAliasRedirect />)}</RequireAuth>} />
        <Route path="/mis-pedidos/:id" element={<RequireAuth>{withShell(<LegacyOrdersAliasRedirect />)}</RequireAuth>} />
        <Route path="/pedido/:id" element={<RequireAuth>{withShell(<LegacyOrdersAliasRedirect />)}</RequireAuth>} />
        <Route path="/repairs" element={<RequireAuth>{withShell(<MyRepairsPage />)}</RequireAuth>} />
        <Route path="/repairs/:id" element={<RequireAuth>{withShell(<RepairDetailPage />)}</RequireAuth>} />
        <Route path="/mis-reparaciones" element={<RequireAuth>{withShell(<LegacyRepairsAliasRedirect />)}</RequireAuth>} />
        <Route path="/mis-reparaciones/:id" element={<RequireAuth>{withShell(<LegacyRepairsAliasRedirect />)}</RequireAuth>} />
        <Route path="/mi-cuenta" element={<RequireAuth>{withShell(<MyAccountPage />)}</RequireAuth>} />
        <Route path="/email/verificar" element={<RequireAuth>{withShell(<Navigate to="/auth/verify-email" replace />)}</RequireAuth>} />
        <Route path="/email/verificar/:id/:hash" element={<RequireAuth>{withShell(<Navigate to="/auth/verify-email" replace />)}</RequireAuth>} />
        <Route path="/admin" element={<RequireAdmin>{withShell(<AdminDashboardPage />)}</RequireAdmin>} />
        <Route path="/admin/dashboard" element={<RequireAdmin><Navigate to="/admin" replace /></RequireAdmin>} />
        <Route path="/admin/alertas" element={<RequireAdmin>{withShell(<AdminAlertsPage />)}</RequireAdmin>} />
        <Route path="/admin/alerts" element={<RequireAdmin><Navigate to="/admin/alertas" replace /></RequireAdmin>} />
        <Route path="/admin/orders" element={<RequireAdmin>{withShell(<AdminOrdersPage />)}</RequireAdmin>} />
        <Route path="/admin/orders/:id" element={<RequireAdmin>{withShell(<AdminOrderDetailPage />)}</RequireAdmin>} />
        <Route path="/admin/orders/:id/print" element={<RequireAdmin><AdminOrderPrintPage /></RequireAdmin>} />
        <Route path="/admin/orders/:id/ticket" element={<RequireAdmin><AdminOrderTicketPage /></RequireAdmin>} />
        <Route path="/admin/pedidos" element={<RequireAdmin><LegacyAdminOrdersAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/pedidos/:id" element={<RequireAdmin><LegacyAdminOrdersAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/pedidos/:id/imprimir" element={<RequireAdmin><LegacyAdminOrderPrintAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/pedidos/:id/ticket" element={<RequireAdmin><LegacyAdminOrderTicketAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/products" element={<RequireAdmin><Navigate to="/admin/productos" replace /></RequireAdmin>} />
        <Route path="/admin/products/create" element={<RequireAdmin><AdminProductCreateAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/products/:id/edit" element={<RequireAdmin><AdminProductEditAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/products/:id/label" element={<RequireAdmin><AdminProductLabelAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/productos" element={<RequireAdmin>{withShell(<AdminProductsPage />)}</RequireAdmin>} />
        <Route path="/admin/productos/crear" element={<RequireAdmin>{withShell(<AdminProductCreatePage />)}</RequireAdmin>} />
        <Route path="/admin/productos/:id/editar" element={<RequireAdmin>{withShell(<AdminProductEditPage />)}</RequireAdmin>} />
        <Route path="/admin/productos/:id/etiqueta" element={<RequireAdmin><AdminProductLabelPage /></RequireAdmin>} />
        <Route path="/admin/categorias" element={<RequireAdmin>{withShell(<AdminCategoriesPage />)}</RequireAdmin>} />
        <Route path="/admin/categorias/crear" element={<RequireAdmin>{withShell(<AdminCategoriesPage />)}</RequireAdmin>} />
        <Route path="/admin/categorias/:id/editar" element={<RequireAdmin>{withShell(<AdminCategoriesPage />)}</RequireAdmin>} />
        <Route path="/admin/users" element={<RequireAdmin>{withShell(<AdminUsersPage />)}</RequireAdmin>} />
        <Route path="/admin/usuarios" element={<RequireAdmin><Navigate to="/admin/users" replace /></RequireAdmin>} />
        <Route path="/admin/configuraciones" element={<RequireAdmin>{withShell(<AdminSettingsHubPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion" element={<RequireAdmin><Navigate to="/admin/configuraciones" replace /></RequireAdmin>} />
        <Route path="/admin/configuracion/mail" element={<RequireAdmin>{withShell(<AdminSmtpSettingsPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/reportes" element={<RequireAdmin>{withShell(<AdminAutoReportsPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/negocio" element={<RequireAdmin>{withShell(<AdminBusinessSettingsPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/identidadvisual" element={<RequireAdmin>{withShell(<AdminVisualIdentityPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/identidad-visual" element={<RequireAdmin><Navigate to="/admin/configuracion/identidadvisual" replace /></RequireAdmin>} />
        <Route path="/admin/configuracion/portadatienda" element={<RequireAdmin>{withShell(<AdminStoreHeroSettingsPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/portada-tienda" element={<RequireAdmin><Navigate to="/admin/configuracion/portadatienda" replace /></RequireAdmin>} />
        <Route path="/admin/configuracion/correos" element={<RequireAdmin><Navigate to="/admin/mail-templates" replace /></RequireAdmin>} />
        <Route path="/admin/configuracion/ayuda" element={<RequireAdmin><Navigate to="/admin/help" replace /></RequireAdmin>} />
        <Route path="/admin/seguridad/2fa" element={<RequireAdmin>{withShell(<Admin2faSecurityPage />)}</RequireAdmin>} />
        <Route path="/admin/calculos" element={<RequireAdmin>{withShell(<AdminCalculationsHubPage />)}</RequireAdmin>} />
        <Route path="/admin/calculos/productos" element={<RequireAdmin>{withShell(<AdminProductPricingRulesPage />)}</RequireAdmin>} />
        <Route path="/admin/precios" element={<RequireAdmin>{withShell(<AdminRepairPricingRulesPage />)}</RequireAdmin>} />
        <Route path="/admin/precios/crear" element={<RequireAdmin>{withShell(<AdminRepairPricingRuleCreatePage />)}</RequireAdmin>} />
        <Route path="/admin/precios/:id/editar" element={<RequireAdmin>{withShell(<AdminRepairPricingRuleEditPage />)}</RequireAdmin>} />
        <Route path="/admin/pricing/:id/edit" element={<RequireAdmin><LegacyAdminPricingEditAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/gruposmodelos" element={<RequireAdmin>{withShell(<AdminModelGroupsPage />)}</RequireAdmin>} />
        <Route path="/admin/grupos-modelos" element={<RequireAdmin><Navigate to="/admin/gruposmodelos" replace /></RequireAdmin>} />
        <Route path="/admin/tiposreparacion" element={<RequireAdmin>{withShell(<AdminRepairTypesPage />)}</RequireAdmin>} />
        <Route path="/admin/tipos-reparacion" element={<RequireAdmin><Navigate to="/admin/tiposreparacion" replace /></RequireAdmin>} />
        <Route path="/admin/catalogodispositivos" element={<RequireAdmin>{withShell(<AdminDevicesCatalogPage />)}</RequireAdmin>} />
        <Route path="/admin/catalogo-dispositivos" element={<RequireAdmin><Navigate to="/admin/catalogodispositivos" replace /></RequireAdmin>} />
        <Route path="/admin/tiposdispositivo" element={<RequireAdmin>{withShell(<AdminDeviceTypesPage />)}</RequireAdmin>} />
        <Route path="/admin/tipos-dispositivo" element={<RequireAdmin><Navigate to="/admin/tiposdispositivo" replace /></RequireAdmin>} />
        <Route path="/admin/device-types" element={<Navigate to="/admin/tiposdispositivo" replace />} />
        <Route path="/admin/settings" element={<RequireAdmin><Navigate to="/admin/configuraciones" replace /></RequireAdmin>} />
        <Route path="/admin/mail-templates" element={<RequireAdmin>{withShell(<AdminMailTemplatesPage />)}</RequireAdmin>} />
        <Route path="/admin/whatsapp" element={<RequireAdmin>{withShell(<AdminWhatsappPage />)}</RequireAdmin>} />
        <Route path="/admin/whatsapppedidos" element={<RequireAdmin>{withShell(<AdminWhatsappOrdersPage />)}</RequireAdmin>} />
        <Route path="/admin/whatsapp-pedidos" element={<RequireAdmin><Navigate to="/admin/whatsapppedidos" replace /></RequireAdmin>} />
        <Route path="/admin/help" element={<RequireAdmin>{withShell(<AdminHelpFaqPage />)}</RequireAdmin>} />
        <Route path="/admin/repairs" element={<RequireAdmin>{withShell(<AdminRepairsListPage />)}</RequireAdmin>} />
        <Route path="/admin/repairs/:id" element={<RequireAdmin>{withShell(<AdminRepairDetailPage />)}</RequireAdmin>} />
        <Route path="/admin/repairs/:id/print" element={<RequireAdmin><AdminRepairPrintPage /></RequireAdmin>} />
        <Route path="/admin/repairs/:id/ticket" element={<RequireAdmin><AdminRepairTicketPage /></RequireAdmin>} />
        <Route path="/admin/reparaciones" element={<RequireAdmin><LegacyAdminRepairsAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/reparaciones/crear" element={<RequireAdmin><LegacyAdminRepairsAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/reparaciones/:id" element={<RequireAdmin><LegacyAdminRepairsAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/reparaciones/:id/imprimir" element={<RequireAdmin><LegacyAdminRepairPrintAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/reparaciones/:id/ticket" element={<RequireAdmin><LegacyAdminRepairTicketAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/ventas-rapidas" element={<RequireAdmin>{withShell(<AdminQuickSalesPage />)}</RequireAdmin>} />
        <Route path="/admin/ventas-rapidas/ticket" element={<RequireAdmin>{withShell(<AdminQuickSalesPage />)}</RequireAdmin>} />
        <Route path="/admin/ventas-rapidas/historial" element={<RequireAdmin>{withShell(<AdminQuickSalesHistoryPage />)}</RequireAdmin>} />
        <Route path="/admin/garantias" element={<RequireAdmin>{withShell(<AdminWarrantiesPage />)}</RequireAdmin>} />
        <Route path="/admin/warranties" element={<RequireAdmin><Navigate to="/admin/garantias" replace /></RequireAdmin>} />
        <Route path="/admin/garantias/crear" element={<RequireAdmin>{withShell(<AdminWarrantyCreatePage />)}</RequireAdmin>} />
        <Route path="/admin/proveedores" element={<RequireAdmin>{withShell(<AdminProvidersPage />)}</RequireAdmin>} />
        <Route path="/admin/suppliers" element={<RequireAdmin><Navigate to="/admin/proveedores" replace /></RequireAdmin>} />
        <Route path="/admin/contabilidad" element={<RequireAdmin>{withShell(<AdminAccountingPage />)}</RequireAdmin>} />
        <Route path="/admin/accounting" element={<RequireAdmin><Navigate to="/admin/contabilidad" replace /></RequireAdmin>} />
        <Route path="/admin/device-catalog" element={<RequireAdmin>{withShell(<AdminDeviceCatalogPage />)}</RequireAdmin>} />
      </Routes>
    </>
  );
}
