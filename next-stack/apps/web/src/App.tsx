import { Route, Routes, Navigate, useParams } from 'react-router-dom';
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage';
import { AdminMailTemplatesPage } from '@/features/admin/AdminMailTemplatesPage';
import { AdminSettingsPage } from '@/features/admin/AdminSettingsPage';
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
import { authStorage } from '@/features/auth/storage';
import { CartPage } from '@/features/cart/CartPage';
import { AdminProductsPage } from '@/features/catalogAdmin/AdminProductsPage';
import { AdminProductEditPage } from '@/features/catalogAdmin/AdminProductEditPage';
import { AdminDeviceCatalogPage } from '@/features/deviceCatalog/AdminDeviceCatalogPage';
import { CheckoutPage } from '@/features/orders/CheckoutPage';
import { AdminOrdersPage } from '@/features/orders/AdminOrdersPage';
import { AdminOrderDetailPage } from '@/features/orders/AdminOrderDetailPage';
import { AdminOrderPrintPage } from '@/features/orders/AdminOrderPrintPage';
import { AdminOrderTicketPage } from '@/features/orders/AdminOrderTicketPage';
import { MyOrdersPage } from '@/features/orders/MyOrdersPage';
import { OrderDetailPage } from '@/features/orders/OrderDetailPage';
import { AdminRepairsListPage } from '@/features/repairs/AdminRepairsListPage';
import { AdminRepairDetailPage } from '@/features/repairs/AdminRepairDetailPage';
import { AdminRepairPrintPage } from '@/features/repairs/AdminRepairPrintPage';
import { AdminRepairTicketPage } from '@/features/repairs/AdminRepairTicketPage';
import { MyRepairsPage } from '@/features/repairs/MyRepairsPage';
import { PublicRepairLookupPage } from '@/features/repairs/PublicRepairLookupPage';
import { RepairDetailPage } from '@/features/repairs/RepairDetailPage';
import { AdminWarrantyCreatePage } from '@/features/warranties/AdminWarrantyCreatePage';
import { AdminWarrantiesPage } from '@/features/warranties/AdminWarrantiesPage';
import { AdminProvidersPage } from '@/features/providers/AdminProvidersPage';
import { StorePage } from '@/features/store/StorePage';
import { StoreProductDetailPage } from '@/features/store/StoreProductDetailPage';
import { HelpPage } from '@/features/help/HelpPage';
import { AppShell } from '@/layouts/AppShell';
import { GlobalVisualEnhancements } from '@/components/GlobalVisualEnhancements';

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

function AdminProductEditAliasRedirect() {
  const { id = '' } = useParams();
  return <Navigate to={id ? `/admin/productos/${encodeURIComponent(id)}/editar` : '/admin/productos'} replace />;
}

export default function App() {
  return (
    <>
      <GlobalVisualEnhancements />
      <Routes>
        <Route path="/" element={<RootEntryRedirect />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/verify-email" element={withShell(<VerifyEmailPage />)} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/bootstrap-admin" element={<BootstrapAdminPage />} />
        <Route path="/store" element={withShell(<StorePage />)} />
        <Route path="/store/category/:slug" element={withShell(<StoreCategoryAliasRedirect />)} />
        <Route path="/store/:slug" element={withShell(<StoreProductDetailPage />)} />
        <Route path="/reparacion" element={withShell(<PublicRepairLookupPage />)} />
        <Route path="/repair-lookup" element={withShell(<PublicRepairLookupPage />)} />
        <Route path="/help" element={withShell(<HelpPage />)} />
        <Route path="/cart" element={withShell(<CartPage />)} />
        <Route path="/checkout" element={<RequireAuth>{withShell(<CheckoutPage />)}</RequireAuth>} />
        <Route path="/orders" element={<RequireAuth>{withShell(<MyOrdersPage />)}</RequireAuth>} />
        <Route path="/orders/:id" element={<RequireAuth>{withShell(<OrderDetailPage />)}</RequireAuth>} />
        <Route path="/repairs" element={<RequireAuth>{withShell(<MyRepairsPage />)}</RequireAuth>} />
        <Route path="/repairs/:id" element={<RequireAuth>{withShell(<RepairDetailPage />)}</RequireAuth>} />
        <Route path="/admin" element={<RequireAdmin>{withShell(<AdminDashboardPage />)}</RequireAdmin>} />
        <Route path="/admin/alertas" element={<RequireAdmin>{withShell(<AdminAlertsPage />)}</RequireAdmin>} />
        <Route path="/admin/alerts" element={<RequireAdmin><Navigate to="/admin/alertas" replace /></RequireAdmin>} />
        <Route path="/admin/orders" element={<RequireAdmin>{withShell(<AdminOrdersPage />)}</RequireAdmin>} />
        <Route path="/admin/orders/:id" element={<RequireAdmin>{withShell(<AdminOrderDetailPage />)}</RequireAdmin>} />
        <Route path="/admin/orders/:id/print" element={<RequireAdmin><AdminOrderPrintPage /></RequireAdmin>} />
        <Route path="/admin/orders/:id/ticket" element={<RequireAdmin><AdminOrderTicketPage /></RequireAdmin>} />
        <Route path="/admin/products" element={<RequireAdmin><Navigate to="/admin/productos" replace /></RequireAdmin>} />
        <Route path="/admin/products/:id/edit" element={<RequireAdmin><AdminProductEditAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/productos" element={<RequireAdmin>{withShell(<AdminProductsPage />)}</RequireAdmin>} />
        <Route path="/admin/productos/:id/editar" element={<RequireAdmin>{withShell(<AdminProductEditPage />)}</RequireAdmin>} />
        <Route path="/admin/users" element={<RequireAdmin>{withShell(<AdminUsersPage />)}</RequireAdmin>} />
        <Route path="/admin/configuraciones" element={<RequireAdmin>{withShell(<AdminSettingsHubPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/mail" element={<RequireAdmin>{withShell(<AdminSmtpSettingsPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/reportes" element={<RequireAdmin>{withShell(<AdminAutoReportsPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/negocio" element={<RequireAdmin>{withShell(<AdminBusinessSettingsPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/identidadvisual" element={<RequireAdmin>{withShell(<AdminVisualIdentityPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/portadatienda" element={<RequireAdmin>{withShell(<AdminStoreHeroSettingsPage />)}</RequireAdmin>} />
        <Route path="/admin/seguridad/2fa" element={<RequireAdmin>{withShell(<Admin2faSecurityPage />)}</RequireAdmin>} />
        <Route path="/admin/calculos" element={<RequireAdmin>{withShell(<AdminCalculationsHubPage />)}</RequireAdmin>} />
        <Route path="/admin/calculos/productos" element={<RequireAdmin>{withShell(<AdminProductPricingRulesPage />)}</RequireAdmin>} />
        <Route path="/admin/precios" element={<RequireAdmin>{withShell(<AdminRepairPricingRulesPage />)}</RequireAdmin>} />
        <Route path="/admin/precios/crear" element={<RequireAdmin>{withShell(<AdminRepairPricingRuleCreatePage />)}</RequireAdmin>} />
        <Route path="/admin/gruposmodelos" element={<RequireAdmin>{withShell(<AdminModelGroupsPage />)}</RequireAdmin>} />
        <Route path="/admin/tiposreparacion" element={<RequireAdmin>{withShell(<AdminRepairTypesPage />)}</RequireAdmin>} />
        <Route path="/admin/catalogodispositivos" element={<RequireAdmin>{withShell(<AdminDevicesCatalogPage />)}</RequireAdmin>} />
        <Route path="/admin/tiposdispositivo" element={<RequireAdmin>{withShell(<AdminDeviceTypesPage />)}</RequireAdmin>} />
        <Route path="/admin/device-types" element={<Navigate to="/admin/tiposdispositivo" replace />} />
        <Route path="/admin/settings" element={<RequireAdmin>{withShell(<AdminSettingsPage />)}</RequireAdmin>} />
        <Route path="/admin/mail-templates" element={<RequireAdmin>{withShell(<AdminMailTemplatesPage />)}</RequireAdmin>} />
        <Route path="/admin/whatsapp" element={<RequireAdmin>{withShell(<AdminWhatsappPage />)}</RequireAdmin>} />
        <Route path="/admin/whatsapppedidos" element={<RequireAdmin>{withShell(<AdminWhatsappOrdersPage />)}</RequireAdmin>} />
        <Route path="/admin/help" element={<RequireAdmin>{withShell(<AdminHelpFaqPage />)}</RequireAdmin>} />
        <Route path="/admin/repairs" element={<RequireAdmin>{withShell(<AdminRepairsListPage />)}</RequireAdmin>} />
        <Route path="/admin/repairs/:id" element={<RequireAdmin>{withShell(<AdminRepairDetailPage />)}</RequireAdmin>} />
        <Route path="/admin/repairs/:id/print" element={<RequireAdmin><AdminRepairPrintPage /></RequireAdmin>} />
        <Route path="/admin/repairs/:id/ticket" element={<RequireAdmin><AdminRepairTicketPage /></RequireAdmin>} />
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
