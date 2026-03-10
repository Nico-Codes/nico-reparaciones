import { Suspense, lazy, type ComponentType, type ReactNode } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { LoadingBlock } from '@/components/ui/loading-block';
import { SectionCard } from '@/components/ui/section-card';
import { GlobalVisualEnhancements } from '@/components/GlobalVisualEnhancements';
import { BrandingHeadSync } from '@/components/BrandingHeadSync';
import { RequireAdmin } from '@/features/auth/RequireAdmin';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { authStorage } from '@/features/auth/storage';
import { AppShell } from '@/layouts/AppShell';

type LazyPageModule = Record<string, unknown>;

function lazyPage<TProps = Record<string, never>>(
  loader: () => Promise<LazyPageModule>,
  exportName: string,
) {
  return lazy(async () => {
    const mod = await loader();
    return { default: mod[exportName] as ComponentType<TProps> };
  });
}

const AdminDashboardPage = lazyPage(() => import('@/features/admin/AdminDashboardPage'), 'AdminDashboardPage');
const AdminMailTemplatesPage = lazyPage(() => import('@/features/admin/AdminMailTemplatesPage'), 'AdminMailTemplatesPage');
const AdminSettingsHubPage = lazyPage(() => import('@/features/admin/AdminSettingsHubPage'), 'AdminSettingsHubPage');
const AdminSmtpSettingsPage = lazyPage(() => import('@/features/admin/AdminSmtpSettingsPage'), 'AdminSmtpSettingsPage');
const AdminAutoReportsPage = lazyPage(() => import('@/features/admin/AdminAutoReportsPage'), 'AdminAutoReportsPage');
const AdminBusinessSettingsPage = lazyPage(() => import('@/features/admin/AdminBusinessSettingsPage'), 'AdminBusinessSettingsPage');
const AdminVisualIdentityPage = lazyPage(() => import('@/features/admin/AdminVisualIdentityPage'), 'AdminVisualIdentityPage');
const AdminStoreHeroSettingsPage = lazyPage(() => import('@/features/admin/AdminStoreHeroSettingsPage'), 'AdminStoreHeroSettingsPage');
const Admin2faSecurityPage = lazyPage(() => import('@/features/admin/Admin2faSecurityPage'), 'Admin2faSecurityPage');
const AdminCalculationsHubPage = lazyPage(() => import('@/features/admin/AdminCalculationsHubPage'), 'AdminCalculationsHubPage');
const AdminProductPricingRulesPage = lazyPage(() => import('@/features/admin/AdminProductPricingRulesPage'), 'AdminProductPricingRulesPage');
const AdminRepairPricingRulesPage = lazyPage(() => import('@/features/admin/AdminRepairPricingRulesPage'), 'AdminRepairPricingRulesPage');
const AdminRepairPricingRuleCreatePage = lazyPage(() => import('@/features/admin/AdminRepairPricingRuleCreatePage'), 'AdminRepairPricingRuleCreatePage');
const AdminRepairPricingRuleEditPage = lazyPage(() => import('@/features/admin/AdminRepairPricingRuleEditPage'), 'AdminRepairPricingRuleEditPage');
const AdminModelGroupsPage = lazyPage(() => import('@/features/admin/AdminModelGroupsPage'), 'AdminModelGroupsPage');
const AdminRepairTypesPage = lazyPage(() => import('@/features/admin/AdminRepairTypesPage'), 'AdminRepairTypesPage');
const AdminDevicesCatalogPage = lazyPage(() => import('@/features/admin/AdminDevicesCatalogPage'), 'AdminDevicesCatalogPage');
const AdminDeviceTypesPage = lazyPage(() => import('@/features/admin/AdminDeviceTypesPage'), 'AdminDeviceTypesPage');
const AdminUsersPage = lazyPage(() => import('@/features/admin/AdminUsersPage'), 'AdminUsersPage');
const AdminWhatsappPage = lazyPage(() => import('@/features/admin/AdminWhatsappPage'), 'AdminWhatsappPage');
const AdminWhatsappOrdersPage = lazyPage(() => import('@/features/admin/AdminWhatsappOrdersPage'), 'AdminWhatsappOrdersPage');
const AdminHelpFaqPage = lazyPage(() => import('@/features/admin/AdminHelpFaqPage'), 'AdminHelpFaqPage');
const AdminAlertsPage = lazyPage(() => import('@/features/admin/AdminAlertsPage'), 'AdminAlertsPage');
const AdminAccountingPage = lazyPage(() => import('@/features/accounting/AdminAccountingPage'), 'AdminAccountingPage');
const BootstrapAdminPage = lazyPage(() => import('@/features/auth/BootstrapAdminPage'), 'BootstrapAdminPage');
const ForgotPasswordPage = lazyPage(() => import('@/features/auth/ForgotPasswordPage'), 'ForgotPasswordPage');
const LoginPage = lazyPage(() => import('@/features/auth/LoginPage'), 'LoginPage');
const RegisterPage = lazyPage(() => import('@/features/auth/RegisterPage'), 'RegisterPage');
const ResetPasswordPage = lazyPage(() => import('@/features/auth/ResetPasswordPage'), 'ResetPasswordPage');
const VerifyEmailPage = lazyPage(() => import('@/features/auth/VerifyEmailPage'), 'VerifyEmailPage');
const MyAccountPage = lazyPage(() => import('@/features/auth/MyAccountPage'), 'MyAccountPage');
const CartPage = lazyPage(() => import('@/features/cart/CartPage'), 'CartPage');
const AdminProductsPage = lazyPage(() => import('@/features/catalogAdmin/AdminProductsPage'), 'AdminProductsPage');
const AdminProductEditPage = lazyPage(() => import('@/features/catalogAdmin/AdminProductEditPage'), 'AdminProductEditPage');
const AdminProductCreatePage = lazyPage(() => import('@/features/catalogAdmin/AdminProductCreatePage'), 'AdminProductCreatePage');
const AdminProductLabelPage = lazyPage(() => import('@/features/catalogAdmin/AdminProductLabelPage'), 'AdminProductLabelPage');
const AdminCategoriesPage = lazyPage(() => import('@/features/catalogAdmin/AdminCategoriesPage'), 'AdminCategoriesPage');
const AdminDeviceCatalogPage = lazyPage(() => import('@/features/deviceCatalog/AdminDeviceCatalogPage'), 'AdminDeviceCatalogPage');
const CheckoutPage = lazyPage(() => import('@/features/orders/CheckoutPage'), 'CheckoutPage');
const AdminOrdersPage = lazyPage(() => import('@/features/orders/AdminOrdersPage'), 'AdminOrdersPage');
const AdminOrderDetailPage = lazyPage(() => import('@/features/orders/AdminOrderDetailPage'), 'AdminOrderDetailPage');
const AdminOrderPrintPage = lazyPage(() => import('@/features/orders/AdminOrderPrintPage'), 'AdminOrderPrintPage');
const AdminOrderTicketPage = lazyPage(() => import('@/features/orders/AdminOrderTicketPage'), 'AdminOrderTicketPage');
const AdminQuickSalesPage = lazyPage(() => import('@/features/orders/AdminQuickSalesPage'), 'AdminQuickSalesPage');
const AdminQuickSalesHistoryPage = lazyPage(() => import('@/features/orders/AdminQuickSalesHistoryPage'), 'AdminQuickSalesHistoryPage');
const MyOrdersPage = lazyPage(() => import('@/features/orders/MyOrdersPage'), 'MyOrdersPage');
const OrderDetailPage = lazyPage(() => import('@/features/orders/OrderDetailPage'), 'OrderDetailPage');
const AdminRepairsListPage = lazyPage(() => import('@/features/repairs/AdminRepairsListPage'), 'AdminRepairsListPage');
const AdminRepairDetailPage = lazyPage(() => import('@/features/repairs/AdminRepairDetailPage'), 'AdminRepairDetailPage');
const AdminRepairPrintPage = lazyPage(() => import('@/features/repairs/AdminRepairPrintPage'), 'AdminRepairPrintPage');
const AdminRepairTicketPage = lazyPage(() => import('@/features/repairs/AdminRepairTicketPage'), 'AdminRepairTicketPage');
const MyRepairsPage = lazyPage(() => import('@/features/repairs/MyRepairsPage'), 'MyRepairsPage');
const PublicRepairLookupPage = lazyPage(() => import('@/features/repairs/PublicRepairLookupPage'), 'PublicRepairLookupPage');
const PublicRepairQuoteApprovalPage = lazyPage(() => import('@/features/repairs/PublicRepairQuoteApprovalPage'), 'PublicRepairQuoteApprovalPage');
const RepairDetailPage = lazyPage(() => import('@/features/repairs/RepairDetailPage'), 'RepairDetailPage');
const AdminWarrantyCreatePage = lazyPage(() => import('@/features/warranties/AdminWarrantyCreatePage'), 'AdminWarrantyCreatePage');
const AdminWarrantiesPage = lazyPage(() => import('@/features/warranties/AdminWarrantiesPage'), 'AdminWarrantiesPage');
const AdminProvidersPage = lazyPage(() => import('@/features/providers/AdminProvidersPage'), 'AdminProvidersPage');
const StorePage = lazyPage(() => import('@/features/store/StorePage'), 'StorePage');
const StoreProductDetailPage = lazyPage(() => import('@/features/store/StoreProductDetailPage'), 'StoreProductDetailPage');
const HelpPage = lazyPage(() => import('@/features/help/HelpPage'), 'HelpPage');

function ShellRouteFallback() {
  return (
    <div className="container-page py-8 md:py-10">
      <SectionCard title="Cargando vista" description="Preparando la pantalla.">
        <LoadingBlock lines={4} />
      </SectionCard>
    </div>
  );
}

function StandaloneRouteFallback() {
  return (
    <div className="container-page py-8 md:py-10">
      <SectionCard title="Cargando vista" description="Preparando la pantalla.">
        <LoadingBlock lines={4} />
      </SectionCard>
    </div>
  );
}

function withShell(element: ReactNode) {
  return <AppShell>{element}</AppShell>;
}

function withShellSuspense(element: ReactNode) {
  return (
    <AppShell>
      <Suspense fallback={<ShellRouteFallback />}>{element}</Suspense>
    </AppShell>
  );
}

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<StandaloneRouteFallback />}>{element}</Suspense>;
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
        <Route path="/auth/login" element={withSuspense(<LoginPage />)} />
        <Route path="/auth/register" element={withSuspense(<RegisterPage />)} />
        <Route path="/auth/verify-email" element={withShellSuspense(<VerifyEmailPage />)} />
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
        <Route path="/admin/configuracion/identidadvisual" element={<RequireAdmin>{withShellSuspense(<AdminVisualIdentityPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/identidad-visual" element={<RequireAdmin><Navigate to="/admin/configuracion/identidadvisual" replace /></RequireAdmin>} />
        <Route path="/admin/configuracion/portadatienda" element={<RequireAdmin>{withShellSuspense(<AdminStoreHeroSettingsPage />)}</RequireAdmin>} />
        <Route path="/admin/configuracion/portada-tienda" element={<RequireAdmin><Navigate to="/admin/configuracion/portadatienda" replace /></RequireAdmin>} />
        <Route path="/admin/configuracion/correos" element={<RequireAdmin><Navigate to="/admin/mail-templates" replace /></RequireAdmin>} />
        <Route path="/admin/configuracion/ayuda" element={<RequireAdmin><Navigate to="/admin/help" replace /></RequireAdmin>} />
        <Route path="/admin/seguridad/2fa" element={<RequireAdmin>{withShellSuspense(<Admin2faSecurityPage />)}</RequireAdmin>} />
        <Route path="/admin/calculos" element={<RequireAdmin>{withShellSuspense(<AdminCalculationsHubPage />)}</RequireAdmin>} />
        <Route path="/admin/calculos/productos" element={<RequireAdmin>{withShellSuspense(<AdminProductPricingRulesPage />)}</RequireAdmin>} />
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
        <Route path="/admin/repairs/:id" element={<RequireAdmin>{withShellSuspense(<AdminRepairDetailPage />)}</RequireAdmin>} />
        <Route path="/admin/repairs/:id/print" element={<RequireAdmin>{withSuspense(<AdminRepairPrintPage />)}</RequireAdmin>} />
        <Route path="/admin/repairs/:id/ticket" element={<RequireAdmin>{withSuspense(<AdminRepairTicketPage />)}</RequireAdmin>} />
        <Route path="/admin/reparaciones" element={<RequireAdmin><LegacyAdminRepairsAliasRedirect /></RequireAdmin>} />
        <Route path="/admin/reparaciones/crear" element={<RequireAdmin><LegacyAdminRepairsAliasRedirect /></RequireAdmin>} />
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
