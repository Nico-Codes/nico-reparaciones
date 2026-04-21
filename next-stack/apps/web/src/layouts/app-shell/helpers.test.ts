import { describe, expect, it } from 'vitest';
import type { AuthUser } from '@/features/auth/types';
import type { StoreBrandingAssets } from '@/features/store/types';
import {
  buildAccountLinks,
  buildAdminLinks,
  buildDesktopLinks,
  buildSidebarNavLinks,
  deriveAppShellDisplay,
} from './helpers';

const baseUser: AuthUser = {
  id: 'user-1',
  name: 'Nico',
  email: 'nico@example.com',
  role: 'USER',
  emailVerified: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('app-shell helpers', () => {
  it('derives stable branding and account display fallbacks', () => {
    expect(deriveAppShellDisplay(null, null)).toMatchObject({
      isAdmin: false,
      brandTitle: 'NicoReparaciones',
      brandHomeTo: '/store',
      userInitial: 'U',
      needsEmailVerification: false,
    });

    const branding: StoreBrandingAssets = {
      siteTitle: ' Nico Reparaciones ',
      logoPrincipal: '/logo.png',
      icons: {
        settings: '/settings.png',
        carrito: null,
        logout: '/logout.png',
        consultarReparacion: null,
        misPedidos: null,
        misReparaciones: null,
        dashboard: '/dashboard.png',
        tienda: '/store.png',
        ayuda: '/help.png',
        miCuenta: '/account.png',
        verificarCorreo: '/verify-email.png',
        adminPedidos: '/admin-orders.png',
        adminReparaciones: '/admin-repairs.png',
        adminVentaRapida: '/quick-sale.png',
        adminProductos: '/products.png',
      },
      favicons: {
        faviconIco: null,
        favicon16: null,
        favicon32: null,
        android192: null,
        android512: null,
        appleTouch: null,
        manifest: null,
      },
    };

    expect(deriveAppShellDisplay({ ...baseUser, role: 'ADMIN' }, branding)).toMatchObject({
      isAdmin: true,
      brandTitle: 'Nico Reparaciones',
      brandHomeTo: '/admin',
      userInitial: 'N',
      iconDashboardUrl: '/dashboard.png',
    });
  });

  it('builds account links and includes email verification only when needed', () => {
    const withPendingEmail = buildAccountLinks({
      authUser: baseUser,
      pathname: '/auth/verify-email',
      iconOrdersUrl: '/orders.png',
      iconRepairsUrl: '/repairs.png',
      iconHelpUrl: '/help.png',
      iconAccountUrl: '/account.png',
      iconVerifyEmailUrl: '/verify-email.png',
    });

    expect(withPendingEmail.map((link) => link.label)).toContain('Verificar correo');
    expect(withPendingEmail.find((link) => link.label === 'Verificar correo')?.active).toBe(true);
    expect(withPendingEmail.find((link) => link.label === 'Verificar correo')?.icon).toBe('/verify-email.png');
    expect(withPendingEmail.find((link) => link.label === 'Ayuda')?.icon).toBe('/help.png');
    expect(withPendingEmail.find((link) => link.label === 'Mi cuenta')?.icon).toBe('/account.png');

    const verifiedLinks = buildAccountLinks({
      authUser: { ...baseUser, emailVerified: true },
      pathname: '/orders',
      iconOrdersUrl: '/orders.png',
      iconRepairsUrl: '/repairs.png',
      iconHelpUrl: '/help.png',
      iconAccountUrl: '/account.png',
      iconVerifyEmailUrl: '/verify-email.png',
    });

    expect(verifiedLinks.map((link) => link.label)).not.toContain('Verificar correo');
    expect(verifiedLinks.find((link) => link.label === 'Mis pedidos')?.active).toBe(true);
  });

  it('builds desktop and sidebar navigation with admin awareness', () => {
    const desktopLinks = buildDesktopLinks('/admin/orders', true);
    expect(desktopLinks.map((link) => link.label)).toContain('Admin');
    expect(desktopLinks.find((link) => link.label === 'Admin')?.active).toBe(true);

    const sidebarLinks = buildSidebarNavLinks({
      pathname: '/',
      isAdmin: false,
      iconStoreUrl: '/store.png',
      iconRepairLookupUrl: '/repair.png',
      iconDashboardUrl: '/dashboard.png',
    });

    expect(sidebarLinks.find((link) => link.label === 'Tienda')?.active).toBe(true);
    expect(sidebarLinks.map((link) => link.label)).not.toContain('Admin');
  });

  it('builds admin links with configurable icons for every admin entry', () => {
    const adminLinks = buildAdminLinks({
      pathname: '/admin/productos',
      isAdmin: true,
      iconDashboardUrl: '/dashboard.png',
      iconSettingsUrl: '/settings.png',
      iconAdminOrdersUrl: '/admin-orders.png',
      iconAdminRepairsUrl: '/admin-repairs.png',
      iconAdminQuickSaleUrl: '/quick-sale.png',
      iconAdminProductsUrl: '/products.png',
    });

    expect(adminLinks.find((link) => link.label === 'Pedidos')?.icon).toBe('/admin-orders.png');
    expect(adminLinks.find((link) => link.label === 'Reparaciones')?.icon).toBe('/admin-repairs.png');
    expect(adminLinks.find((link) => link.label === 'Venta rapida')?.icon).toBe('/quick-sale.png');
    expect(adminLinks.find((link) => link.label === 'Productos')?.icon).toBe('/products.png');
    expect(adminLinks.find((link) => link.label === 'Productos')?.active).toBe(true);
  });
});
