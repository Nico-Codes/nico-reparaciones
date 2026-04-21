import type { AuthUser } from '@/features/auth/types';
import type { StoreBrandingAssets } from '@/features/store/types';
import type { LinkItem } from './types';
import { isActiveGroup } from './utils';

type BuildAccountLinksOptions = {
  authUser: AuthUser | null;
  pathname: string;
  iconOrdersUrl: string | null;
  iconRepairsUrl: string | null;
  iconHelpUrl: string | null;
  iconAccountUrl: string | null;
  iconVerifyEmailUrl: string | null;
};

type BuildAdminLinksOptions = {
  pathname: string;
  isAdmin: boolean;
  iconDashboardUrl: string | null;
  iconSettingsUrl: string | null;
  iconAdminOrdersUrl: string | null;
  iconAdminRepairsUrl: string | null;
  iconAdminQuickSaleUrl: string | null;
  iconAdminProductsUrl: string | null;
};

type BuildSidebarNavLinksOptions = {
  pathname: string;
  isAdmin: boolean;
  iconStoreUrl: string | null;
  iconRepairLookupUrl: string | null;
  iconDashboardUrl: string | null;
};

export function deriveAppShellDisplay(authUser: AuthUser | null, branding: StoreBrandingAssets | null) {
  const isAdmin = authUser?.role === 'ADMIN';

  return {
    isAdmin,
    brandLogoUrl: branding?.logoPrincipal || null,
    brandTitle: (branding?.siteTitle || 'NicoReparaciones').trim(),
    brandHomeTo: isAdmin ? '/admin' : '/store',
    iconCartUrl: branding?.icons.carrito || null,
    iconLogoutUrl: branding?.icons.logout || null,
    iconSettingsUrl: branding?.icons.settings || null,
    iconRepairLookupUrl: branding?.icons.consultarReparacion || null,
    iconOrdersUrl: branding?.icons.misPedidos || null,
    iconRepairsUrl: branding?.icons.misReparaciones || null,
    iconDashboardUrl: branding?.icons.dashboard || null,
    iconStoreUrl: branding?.icons.tienda || null,
    iconHelpUrl: branding?.icons.ayuda || null,
    iconAccountUrl: branding?.icons.miCuenta || null,
    iconVerifyEmailUrl: branding?.icons.verificarCorreo || null,
    iconAdminOrdersUrl: branding?.icons.adminPedidos || null,
    iconAdminRepairsUrl: branding?.icons.adminReparaciones || null,
    iconAdminQuickSaleUrl: branding?.icons.adminVentaRapida || null,
    iconAdminProductsUrl: branding?.icons.adminProductos || null,
    needsEmailVerification: !!authUser && !authUser.emailVerified,
    emailStatusText: authUser?.emailVerified ? 'Correo verificado' : 'Correo pendiente de verificacion',
    userInitial: authUser?.name?.trim()?.charAt(0)?.toUpperCase() || 'U',
  };
}

export function buildDesktopLinks(pathname: string, isAdmin: boolean): LinkItem[] {
  return [
    { to: '/store', label: 'Tienda', active: isActiveGroup(pathname, ['/store']) || pathname === '/' },
    { to: '/reparacion', label: 'Reparacion', active: isActiveGroup(pathname, ['/reparacion', '/repair-lookup']) },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', active: isActiveGroup(pathname, ['/admin']) }] : []),
  ];
}

export function buildAccountLinks({
  authUser,
  pathname,
  iconOrdersUrl,
  iconRepairsUrl,
  iconHelpUrl,
  iconAccountUrl,
  iconVerifyEmailUrl,
}: BuildAccountLinksOptions): LinkItem[] {
  if (!authUser) return [];

  return [
    { label: 'Mis pedidos', to: '/orders', active: isActiveGroup(pathname, ['/orders']), icon: iconOrdersUrl },
    { label: 'Mis reparaciones', to: '/repairs', active: isActiveGroup(pathname, ['/repairs']), icon: iconRepairsUrl },
    { label: 'Ayuda', to: '/help', active: isActiveGroup(pathname, ['/help']), icon: iconHelpUrl },
    { label: 'Mi cuenta', to: '/mi-cuenta', active: isActiveGroup(pathname, ['/mi-cuenta']), icon: iconAccountUrl },
    ...(!authUser.emailVerified
      ? [
          {
            label: 'Verificar correo',
            to: '/auth/verify-email',
            active: isActiveGroup(pathname, ['/auth/verify-email']),
            highlight: 'warning' as const,
            icon: iconVerifyEmailUrl,
          },
        ]
      : []),
  ];
}

export function buildAdminLinks({
  pathname,
  isAdmin,
  iconDashboardUrl,
  iconSettingsUrl,
  iconAdminOrdersUrl,
  iconAdminRepairsUrl,
  iconAdminQuickSaleUrl,
  iconAdminProductsUrl,
}: BuildAdminLinksOptions): LinkItem[] {
  if (!isAdmin) return [];

  return [
    { label: 'Panel admin', to: '/admin', active: pathname === '/admin', icon: iconDashboardUrl },
    { label: 'Pedidos', to: '/admin/orders', active: isActiveGroup(pathname, ['/admin/orders']), icon: iconAdminOrdersUrl },
    { label: 'Reparaciones', to: '/admin/repairs', active: isActiveGroup(pathname, ['/admin/repairs']), icon: iconAdminRepairsUrl },
    { label: 'Venta rapida', to: '/admin/ventas-rapidas', active: isActiveGroup(pathname, ['/admin/ventas-rapidas']), icon: iconAdminQuickSaleUrl },
    { label: 'Productos', to: '/admin/productos', active: isActiveGroup(pathname, ['/admin/productos']), icon: iconAdminProductsUrl },
    {
      label: 'Configuracion',
      to: '/admin/configuraciones',
      active: isActiveGroup(pathname, ['/admin/configuraciones']),
      icon: iconSettingsUrl,
    },
  ];
}

export function buildSidebarNavLinks({
  pathname,
  isAdmin,
  iconStoreUrl,
  iconRepairLookupUrl,
  iconDashboardUrl,
}: BuildSidebarNavLinksOptions): LinkItem[] {
  return [
    { label: 'Tienda', to: '/store', active: isActiveGroup(pathname, ['/store']) || pathname === '/', icon: iconStoreUrl },
    {
      label: 'Reparacion',
      to: '/reparacion',
      active: isActiveGroup(pathname, ['/reparacion', '/repair-lookup']),
      icon: iconRepairLookupUrl,
    },
    ...(isAdmin ? [{ label: 'Admin', to: '/admin', active: isActiveGroup(pathname, ['/admin']), icon: iconDashboardUrl }] : []),
  ];
}
