import { lazy, type ComponentType } from 'react';

type LazyPageModule = Record<string, unknown>;
type LazyStyleLoader = () => Promise<unknown>;

const loadAdminStyles = () => import('@/styles/admin.css');
const loadAuthStyles = () => import('@/styles/auth.css');
const loadCommerceStyles = () => import('@/styles/commerce.css');
const loadRepairsStyles = () => import('@/styles/repairs.css');
const loadStoreStyles = () => import('@/styles/store.css');

function lazyPage<TProps = Record<string, never>>(
  loader: () => Promise<LazyPageModule>,
  exportName: string,
  styleLoaders: LazyStyleLoader[] = [],
) {
  return lazy(async () => {
    const [mod] = await Promise.all([loader(), ...styleLoaders.map((loadStyles) => loadStyles())]);
    return { default: mod[exportName] as ComponentType<TProps> };
  });
}

const adminPage = <TProps = Record<string, never>>(loader: () => Promise<LazyPageModule>, exportName: string) =>
  lazyPage<TProps>(loader, exportName, [loadAdminStyles, loadCommerceStyles]);

const adminRepairPage = <TProps = Record<string, never>>(loader: () => Promise<LazyPageModule>, exportName: string) =>
  lazyPage<TProps>(loader, exportName, [loadAdminStyles, loadRepairsStyles, loadCommerceStyles]);

const authPage = <TProps = Record<string, never>>(loader: () => Promise<LazyPageModule>, exportName: string) =>
  lazyPage<TProps>(loader, exportName, [loadAuthStyles]);

const commercePage = <TProps = Record<string, never>>(loader: () => Promise<LazyPageModule>, exportName: string) =>
  lazyPage<TProps>(loader, exportName, [loadCommerceStyles]);

const repairPage = <TProps = Record<string, never>>(loader: () => Promise<LazyPageModule>, exportName: string) =>
  lazyPage<TProps>(loader, exportName, [loadRepairsStyles, loadCommerceStyles]);

const storePage = <TProps = Record<string, never>>(loader: () => Promise<LazyPageModule>, exportName: string) =>
  lazyPage<TProps>(loader, exportName, [loadStoreStyles]);

const storeCommercePage = <TProps = Record<string, never>>(loader: () => Promise<LazyPageModule>, exportName: string) =>
  lazyPage<TProps>(loader, exportName, [loadStoreStyles, loadCommerceStyles]);

export const AdminAccountingPage = adminPage(() => import('@/features/accounting/AdminAccountingPage'), 'AdminAccountingPage');
export const Admin2faSecurityPage = adminPage(() => import('@/features/admin/Admin2faSecurityPage'), 'Admin2faSecurityPage');
export const AdminAlertsPage = adminPage(() => import('@/features/admin/AdminAlertsPage'), 'AdminAlertsPage');
export const AdminAutoReportsPage = adminPage(() => import('@/features/admin/AdminAutoReportsPage'), 'AdminAutoReportsPage');
export const AdminBusinessSettingsPage = adminPage(() => import('@/features/admin/AdminBusinessSettingsPage'), 'AdminBusinessSettingsPage');
export const AdminCalculationsHubPage = adminPage(() => import('@/features/admin/AdminCalculationsHubPage'), 'AdminCalculationsHubPage');
export const AdminCheckoutSettingsPage = adminPage(() => import('@/features/admin/AdminCheckoutSettingsPage'), 'AdminCheckoutSettingsPage');
export const AdminRepairCalculationsHubPage = adminPage(() => import('@/features/admin/AdminRepairCalculationsHubPage'), 'AdminRepairCalculationsHubPage');
export const AdminDashboardPage = adminPage(() => import('@/features/admin/AdminDashboardPage'), 'AdminDashboardPage');
export const AdminDeviceTypesPage = adminPage(() => import('@/features/admin/AdminDeviceTypesPage'), 'AdminDeviceTypesPage');
export const AdminDevicesCatalogPage = adminPage(() => import('@/features/admin/AdminDevicesCatalogPage'), 'AdminDevicesCatalogPage');
export const AdminHelpFaqPage = adminPage(() => import('@/features/admin/AdminHelpFaqPage'), 'AdminHelpFaqPage');
export const AdminMailTemplatesPage = adminPage(() => import('@/features/admin/AdminMailTemplatesPage'), 'AdminMailTemplatesPage');
export const AdminModelGroupsPage = adminPage(() => import('@/features/admin/AdminModelGroupsPage'), 'AdminModelGroupsPage');
export const AdminProductPricingRulesPage = adminPage(() => import('@/features/admin/AdminProductPricingRulesPage'), 'AdminProductPricingRulesPage');
export const AdminRepairPricingRuleCreatePage = adminPage(() => import('@/features/admin/AdminRepairPricingRuleCreatePage'), 'AdminRepairPricingRuleCreatePage');
export const AdminRepairPricingRuleEditPage = adminPage(() => import('@/features/admin/AdminRepairPricingRuleEditPage'), 'AdminRepairPricingRuleEditPage');
export const AdminRepairPricingRulesPage = adminPage(() => import('@/features/admin/AdminRepairPricingRulesPage'), 'AdminRepairPricingRulesPage');
export const AdminRepairTypesPage = adminPage(() => import('@/features/admin/AdminRepairTypesPage'), 'AdminRepairTypesPage');
export const AdminSettingsHubPage = adminPage(() => import('@/features/admin/AdminSettingsHubPage'), 'AdminSettingsHubPage');
export const AdminSmtpSettingsPage = adminPage(() => import('@/features/admin/AdminSmtpSettingsPage'), 'AdminSmtpSettingsPage');
export const AdminStoreHeroSettingsPage = adminPage(() => import('@/features/admin/AdminStoreHeroSettingsPage'), 'AdminStoreHeroSettingsPage');
export const AdminUsersPage = adminPage(() => import('@/features/admin/AdminUsersPage'), 'AdminUsersPage');
export const AdminVisualIdentityPage = adminPage(() => import('@/features/admin/AdminVisualIdentityPage'), 'AdminVisualIdentityPage');
export const AdminWhatsappOrdersPage = adminPage(() => import('@/features/admin/AdminWhatsappOrdersPage'), 'AdminWhatsappOrdersPage');
export const AdminWhatsappPage = adminPage(() => import('@/features/admin/AdminWhatsappPage'), 'AdminWhatsappPage');
export const AppleAuthCallbackPage = authPage(() => import('@/features/auth/AppleAuthCallbackPage'), 'AppleAuthCallbackPage');
export const BootstrapAdminPage = authPage(() => import('@/features/auth/BootstrapAdminPage'), 'BootstrapAdminPage');
export const ForgotPasswordPage = authPage(() => import('@/features/auth/ForgotPasswordPage'), 'ForgotPasswordPage');
export const GoogleAuthCallbackPage = authPage(() => import('@/features/auth/GoogleAuthCallbackPage'), 'GoogleAuthCallbackPage');
export const LoginPage = authPage(() => import('@/features/auth/LoginPage'), 'LoginPage');
export const MyAccountPage = lazyPage(() => import('@/features/auth/MyAccountPage'), 'MyAccountPage');
export const RegisterPage = authPage(() => import('@/features/auth/RegisterPage'), 'RegisterPage');
export const ResetPasswordPage = authPage(() => import('@/features/auth/ResetPasswordPage'), 'ResetPasswordPage');
export const VerifyEmailPage = authPage(() => import('@/features/auth/VerifyEmailPage'), 'VerifyEmailPage');
export const CartPage = commercePage(() => import('@/features/cart/CartPage'), 'CartPage');
export const AdminCategoriesPage = adminPage(() => import('@/features/catalogAdmin/AdminCategoriesPage'), 'AdminCategoriesPage');
export const AdminProductCreatePage = adminPage(() => import('@/features/catalogAdmin/AdminProductCreatePage'), 'AdminProductCreatePage');
export const AdminProductEditPage = adminPage(() => import('@/features/catalogAdmin/AdminProductEditPage'), 'AdminProductEditPage');
export const AdminProductLabelPage = adminPage(() => import('@/features/catalogAdmin/AdminProductLabelPage'), 'AdminProductLabelPage');
export const AdminProductsPage = adminPage(() => import('@/features/catalogAdmin/AdminProductsPage'), 'AdminProductsPage');
export const AdminSpecialOrderImportPage = adminPage(() => import('@/features/catalogAdmin/AdminSpecialOrderImportPage'), 'AdminSpecialOrderImportPage');
export const AdminDeviceCatalogPage = adminPage(() => import('@/features/deviceCatalog/AdminDeviceCatalogPage'), 'AdminDeviceCatalogPage');
export const HelpPage = lazyPage(() => import('@/features/help/HelpPage'), 'HelpPage');
export const AdminOrderDetailPage = adminPage(() => import('@/features/orders/AdminOrderDetailPage'), 'AdminOrderDetailPage');
export const AdminOrderPrintPage = adminPage(() => import('@/features/orders/AdminOrderPrintPage'), 'AdminOrderPrintPage');
export const AdminOrdersPage = adminPage(() => import('@/features/orders/AdminOrdersPage'), 'AdminOrdersPage');
export const AdminOrderTicketPage = adminPage(() => import('@/features/orders/AdminOrderTicketPage'), 'AdminOrderTicketPage');
export const AdminQuickSalesHistoryPage = adminPage(() => import('@/features/orders/AdminQuickSalesHistoryPage'), 'AdminQuickSalesHistoryPage');
export const AdminQuickSalesPage = adminPage(() => import('@/features/orders/AdminQuickSalesPage'), 'AdminQuickSalesPage');
export const CheckoutPage = commercePage(() => import('@/features/orders/CheckoutPage'), 'CheckoutPage');
export const MyOrdersPage = commercePage(() => import('@/features/orders/MyOrdersPage'), 'MyOrdersPage');
export const OrderDetailPage = commercePage(() => import('@/features/orders/OrderDetailPage'), 'OrderDetailPage');
export const AdminProvidersPage = adminPage(() => import('@/features/providers/AdminProvidersPage'), 'AdminProvidersPage');
export const AdminRepairCreatePage = adminRepairPage(() => import('@/features/repairs/AdminRepairCreatePage'), 'AdminRepairCreatePage');
export const AdminRepairDetailPage = adminRepairPage(() => import('@/features/repairs/AdminRepairDetailPage'), 'AdminRepairDetailPage');
export const AdminRepairPrintPage = adminRepairPage(() => import('@/features/repairs/AdminRepairPrintPage'), 'AdminRepairPrintPage');
export const AdminRepairsListPage = adminRepairPage(() => import('@/features/repairs/AdminRepairsListPage'), 'AdminRepairsListPage');
export const AdminRepairTicketPage = adminRepairPage(() => import('@/features/repairs/AdminRepairTicketPage'), 'AdminRepairTicketPage');
export const MyRepairsPage = repairPage(() => import('@/features/repairs/MyRepairsPage'), 'MyRepairsPage');
export const PublicRepairLookupPage = repairPage(() => import('@/features/repairs/PublicRepairLookupPage'), 'PublicRepairLookupPage');
export const PublicRepairQuoteApprovalPage = repairPage(() => import('@/features/repairs/PublicRepairQuoteApprovalPage'), 'PublicRepairQuoteApprovalPage');
export const RepairDetailPage = repairPage(() => import('@/features/repairs/RepairDetailPage'), 'RepairDetailPage');
export const StorePage = storePage(() => import('@/features/store/StorePage'), 'StorePage');
export const StoreProductDetailPage = storeCommercePage(() => import('@/features/store/StoreProductDetailPage'), 'StoreProductDetailPage');
export const AdminWarrantyCreatePage = adminPage(() => import('@/features/warranties/AdminWarrantyCreatePage'), 'AdminWarrantyCreatePage');
export const AdminWarrantiesPage = adminPage(() => import('@/features/warranties/AdminWarrantiesPage'), 'AdminWarrantiesPage');
