import { lazy, type ComponentType } from 'react';

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

export const AdminAccountingPage = lazyPage(() => import('@/features/accounting/AdminAccountingPage'), 'AdminAccountingPage');
export const Admin2faSecurityPage = lazyPage(() => import('@/features/admin/Admin2faSecurityPage'), 'Admin2faSecurityPage');
export const AdminAlertsPage = lazyPage(() => import('@/features/admin/AdminAlertsPage'), 'AdminAlertsPage');
export const AdminAutoReportsPage = lazyPage(() => import('@/features/admin/AdminAutoReportsPage'), 'AdminAutoReportsPage');
export const AdminBusinessSettingsPage = lazyPage(() => import('@/features/admin/AdminBusinessSettingsPage'), 'AdminBusinessSettingsPage');
export const AdminCalculationsHubPage = lazyPage(() => import('@/features/admin/AdminCalculationsHubPage'), 'AdminCalculationsHubPage');
export const AdminRepairCalculationsHubPage = lazyPage(() => import('@/features/admin/AdminRepairCalculationsHubPage'), 'AdminRepairCalculationsHubPage');
export const AdminDashboardPage = lazyPage(() => import('@/features/admin/AdminDashboardPage'), 'AdminDashboardPage');
export const AdminDeviceTypesPage = lazyPage(() => import('@/features/admin/AdminDeviceTypesPage'), 'AdminDeviceTypesPage');
export const AdminDevicesCatalogPage = lazyPage(() => import('@/features/admin/AdminDevicesCatalogPage'), 'AdminDevicesCatalogPage');
export const AdminHelpFaqPage = lazyPage(() => import('@/features/admin/AdminHelpFaqPage'), 'AdminHelpFaqPage');
export const AdminMailTemplatesPage = lazyPage(() => import('@/features/admin/AdminMailTemplatesPage'), 'AdminMailTemplatesPage');
export const AdminModelGroupsPage = lazyPage(() => import('@/features/admin/AdminModelGroupsPage'), 'AdminModelGroupsPage');
export const AdminProductPricingRulesPage = lazyPage(() => import('@/features/admin/AdminProductPricingRulesPage'), 'AdminProductPricingRulesPage');
export const AdminRepairPricingRuleCreatePage = lazyPage(() => import('@/features/admin/AdminRepairPricingRuleCreatePage'), 'AdminRepairPricingRuleCreatePage');
export const AdminRepairPricingRuleEditPage = lazyPage(() => import('@/features/admin/AdminRepairPricingRuleEditPage'), 'AdminRepairPricingRuleEditPage');
export const AdminRepairPricingRulesPage = lazyPage(() => import('@/features/admin/AdminRepairPricingRulesPage'), 'AdminRepairPricingRulesPage');
export const AdminRepairTypesPage = lazyPage(() => import('@/features/admin/AdminRepairTypesPage'), 'AdminRepairTypesPage');
export const AdminSettingsHubPage = lazyPage(() => import('@/features/admin/AdminSettingsHubPage'), 'AdminSettingsHubPage');
export const AdminSmtpSettingsPage = lazyPage(() => import('@/features/admin/AdminSmtpSettingsPage'), 'AdminSmtpSettingsPage');
export const AdminStoreHeroSettingsPage = lazyPage(() => import('@/features/admin/AdminStoreHeroSettingsPage'), 'AdminStoreHeroSettingsPage');
export const AdminUsersPage = lazyPage(() => import('@/features/admin/AdminUsersPage'), 'AdminUsersPage');
export const AdminVisualIdentityPage = lazyPage(() => import('@/features/admin/AdminVisualIdentityPage'), 'AdminVisualIdentityPage');
export const AdminWhatsappOrdersPage = lazyPage(() => import('@/features/admin/AdminWhatsappOrdersPage'), 'AdminWhatsappOrdersPage');
export const AdminWhatsappPage = lazyPage(() => import('@/features/admin/AdminWhatsappPage'), 'AdminWhatsappPage');
export const BootstrapAdminPage = lazyPage(() => import('@/features/auth/BootstrapAdminPage'), 'BootstrapAdminPage');
export const ForgotPasswordPage = lazyPage(() => import('@/features/auth/ForgotPasswordPage'), 'ForgotPasswordPage');
export const GoogleAuthCallbackPage = lazyPage(() => import('@/features/auth/GoogleAuthCallbackPage'), 'GoogleAuthCallbackPage');
export const LoginPage = lazyPage(() => import('@/features/auth/LoginPage'), 'LoginPage');
export const MyAccountPage = lazyPage(() => import('@/features/auth/MyAccountPage'), 'MyAccountPage');
export const RegisterPage = lazyPage(() => import('@/features/auth/RegisterPage'), 'RegisterPage');
export const ResetPasswordPage = lazyPage(() => import('@/features/auth/ResetPasswordPage'), 'ResetPasswordPage');
export const VerifyEmailPage = lazyPage(() => import('@/features/auth/VerifyEmailPage'), 'VerifyEmailPage');
export const CartPage = lazyPage(() => import('@/features/cart/CartPage'), 'CartPage');
export const AdminCategoriesPage = lazyPage(() => import('@/features/catalogAdmin/AdminCategoriesPage'), 'AdminCategoriesPage');
export const AdminProductCreatePage = lazyPage(() => import('@/features/catalogAdmin/AdminProductCreatePage'), 'AdminProductCreatePage');
export const AdminProductEditPage = lazyPage(() => import('@/features/catalogAdmin/AdminProductEditPage'), 'AdminProductEditPage');
export const AdminProductLabelPage = lazyPage(() => import('@/features/catalogAdmin/AdminProductLabelPage'), 'AdminProductLabelPage');
export const AdminProductsPage = lazyPage(() => import('@/features/catalogAdmin/AdminProductsPage'), 'AdminProductsPage');
export const AdminDeviceCatalogPage = lazyPage(() => import('@/features/deviceCatalog/AdminDeviceCatalogPage'), 'AdminDeviceCatalogPage');
export const HelpPage = lazyPage(() => import('@/features/help/HelpPage'), 'HelpPage');
export const AdminOrderDetailPage = lazyPage(() => import('@/features/orders/AdminOrderDetailPage'), 'AdminOrderDetailPage');
export const AdminOrderPrintPage = lazyPage(() => import('@/features/orders/AdminOrderPrintPage'), 'AdminOrderPrintPage');
export const AdminOrdersPage = lazyPage(() => import('@/features/orders/AdminOrdersPage'), 'AdminOrdersPage');
export const AdminOrderTicketPage = lazyPage(() => import('@/features/orders/AdminOrderTicketPage'), 'AdminOrderTicketPage');
export const AdminQuickSalesHistoryPage = lazyPage(() => import('@/features/orders/AdminQuickSalesHistoryPage'), 'AdminQuickSalesHistoryPage');
export const AdminQuickSalesPage = lazyPage(() => import('@/features/orders/AdminQuickSalesPage'), 'AdminQuickSalesPage');
export const CheckoutPage = lazyPage(() => import('@/features/orders/CheckoutPage'), 'CheckoutPage');
export const MyOrdersPage = lazyPage(() => import('@/features/orders/MyOrdersPage'), 'MyOrdersPage');
export const OrderDetailPage = lazyPage(() => import('@/features/orders/OrderDetailPage'), 'OrderDetailPage');
export const AdminProvidersPage = lazyPage(() => import('@/features/providers/AdminProvidersPage'), 'AdminProvidersPage');
export const AdminRepairCreatePage = lazyPage(() => import('@/features/repairs/AdminRepairCreatePage'), 'AdminRepairCreatePage');
export const AdminRepairDetailPage = lazyPage(() => import('@/features/repairs/AdminRepairDetailPage'), 'AdminRepairDetailPage');
export const AdminRepairPrintPage = lazyPage(() => import('@/features/repairs/AdminRepairPrintPage'), 'AdminRepairPrintPage');
export const AdminRepairsListPage = lazyPage(() => import('@/features/repairs/AdminRepairsListPage'), 'AdminRepairsListPage');
export const AdminRepairTicketPage = lazyPage(() => import('@/features/repairs/AdminRepairTicketPage'), 'AdminRepairTicketPage');
export const MyRepairsPage = lazyPage(() => import('@/features/repairs/MyRepairsPage'), 'MyRepairsPage');
export const PublicRepairLookupPage = lazyPage(() => import('@/features/repairs/PublicRepairLookupPage'), 'PublicRepairLookupPage');
export const PublicRepairQuoteApprovalPage = lazyPage(() => import('@/features/repairs/PublicRepairQuoteApprovalPage'), 'PublicRepairQuoteApprovalPage');
export const RepairDetailPage = lazyPage(() => import('@/features/repairs/RepairDetailPage'), 'RepairDetailPage');
export const StorePage = lazyPage(() => import('@/features/store/StorePage'), 'StorePage');
export const StoreProductDetailPage = lazyPage(() => import('@/features/store/StoreProductDetailPage'), 'StoreProductDetailPage');
export const AdminWarrantyCreatePage = lazyPage(() => import('@/features/warranties/AdminWarrantyCreatePage'), 'AdminWarrantyCreatePage');
export const AdminWarrantiesPage = lazyPage(() => import('@/features/warranties/AdminWarrantiesPage'), 'AdminWarrantiesPage');
