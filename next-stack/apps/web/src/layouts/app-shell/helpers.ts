import type { AuthUser } from '@/features/auth/types';
import type { StoreBrandingAssets } from '@/features/store/types';
import type { LinkItem } from './types';
import { isActiveGroup } from './utils';

type BuildAccountLinksOptions = {
  authUser: AuthUser | null;
  pathname: string;
  iconOrdersUrl: string | null;
  iconRepairsUrl: string | null;
};

type BuildAdminLinksOptions = {
  pathname: string;
  isAdmin: boolean;
  iconDashboardUrl: string | null;
  iconSettingsUrl: string | null;
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
}: BuildAccountLinksOptions): LinkItem[] {
  if (!authUser) return [];

  return [
    { label: 'Mis pedidos', to: '/orders', active: isActiveGroup(pathname, ['/orders']), icon: iconOrdersUrl },
    { label: 'Mis reparaciones', to: '/repairs', active: isActiveGroup(pathname, ['/repairs']), icon: iconRepairsUrl },
    { label: 'Ayuda', to: '/help', active: isActiveGroup(pathname, ['/help']) },
    { label: 'Mi cuenta', to: '/mi-cuenta', active: isActiveGroup(pathname, ['/mi-cuenta']) },
    ...(!authUser.emailVerified
      ? [
          {
            label: 'Verificar correo',
            to: '/auth/verify-email',
            active: isActiveGroup(pathname, ['/auth/verify-email']),
            highlight: 'warning' as const,
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
}: BuildAdminLinksOptions): LinkItem[] {
  if (!isAdmin) return [];

  return [
    { label: 'Panel admin', to: '/admin', active: pathname === '/admin', icon: iconDashboardUrl },
    { label: 'Pedidos', to: '/admin/orders', active: isActiveGroup(pathname, ['/admin/orders']) },
    { label: 'Reparaciones', to: '/admin/repairs', active: isActiveGroup(pathname, ['/admin/repairs']) },
    { label: 'Venta rapida', to: '/admin/ventas-rapidas', active: isActiveGroup(pathname, ['/admin/ventas-rapidas']) },
    { label: 'Productos', to: '/admin/productos', active: isActiveGroup(pathname, ['/admin/productos']) },
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
