import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Wrench } from 'lucide-react';
import { CartAddedPopup } from '@/features/cart/CartAddedPopup';
import { useCartCount } from '@/features/cart/useCart';
import { authStorage } from '@/features/auth/storage';
import type { AuthUser } from '@/features/auth/types';
import { storeApi } from '@/features/store/api';
import type { StoreBrandingAssets } from '@/features/store/types';
import { AccountMenu } from '@/layouts/app-shell/account-menu';
import { AppShellFooter } from '@/layouts/app-shell/footer';
import { MobileSidebar } from '@/layouts/app-shell/mobile-sidebar';
import { BrandWordmark, CartGlyph, WarnIcon } from '@/layouts/app-shell/primitives';
import type { LinkItem } from '@/layouts/app-shell/types';
import { isActiveGroup, lockScroll, resolveShellContext, unlockScroll } from '@/layouts/app-shell/utils';
import { cn } from '@/lib/utils';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const shellContext = resolveShellContext(location.pathname);
  const cartCount = useCartCount();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true,
  );
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => authStorage.getUser());
  const [branding, setBranding] = useState<StoreBrandingAssets | null>(null);
  const [adminSectionOpen, setAdminSectionOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const accountButtonRef = useRef<HTMLButtonElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sync = () => setAuthUser(authStorage.getUser());
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('nico:auth-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('nico:auth-changed', sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void storeApi
      .branding()
      .then((data) => {
        if (!cancelled) setBranding(data);
      })
      .catch(() => {
        if (!cancelled) setBranding(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
    setAccountOpen(false);
    setAuthUser(authStorage.getUser());
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const syncViewport = (event?: MediaQueryListEvent) => setIsDesktop(event ? event.matches : mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);

    return () => mediaQuery.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    if (isDesktop) setSidebarOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (sidebarOpen) lockScroll();
    else unlockScroll();

    return () => unlockScroll();
  }, [sidebarOpen]);

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setAccountOpen(false);
      setSidebarOpen(false);
      accountButtonRef.current?.focus();
    };

    const onClickOutside = (event: MouseEvent) => {
      if (!accountOpen || !accountRef.current) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!accountRef.current.contains(target)) setAccountOpen(false);
    };

    document.addEventListener('keydown', onEsc);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [accountOpen]);

  const isAdmin = authUser?.role === 'ADMIN';
  const brandLogoUrl = branding?.logoPrincipal || null;
  const brandTitle = (branding?.siteTitle || 'NicoReparaciones').trim();
  const iconCartUrl = branding?.icons.carrito || null;
  const iconLogoutUrl = branding?.icons.logout || null;
  const iconSettingsUrl = branding?.icons.settings || null;
  const iconRepairLookupUrl = branding?.icons.consultarReparacion || null;
  const iconOrdersUrl = branding?.icons.misPedidos || null;
  const iconRepairsUrl = branding?.icons.misReparaciones || null;
  const iconDashboardUrl = branding?.icons.dashboard || null;
  const iconStoreUrl = branding?.icons.tienda || null;
  const emailStatusText = authUser?.emailVerified ? 'Correo verificado' : 'Correo pendiente de verificacion';
  const userInitial = authUser?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  const desktopLinks = useMemo<LinkItem[]>(
    () => [
      { to: '/store', label: 'Tienda', active: isActiveGroup(location.pathname, ['/store']) || location.pathname === '/' },
      { to: '/reparacion', label: 'Reparacion', active: isActiveGroup(location.pathname, ['/reparacion', '/repair-lookup']) },
      ...(isAdmin ? [{ to: '/admin', label: 'Admin', active: isActiveGroup(location.pathname, ['/admin']) }] : []),
    ],
    [isAdmin, location.pathname],
  );

  const accountLinks = useMemo<LinkItem[]>(
    () =>
      authUser
        ? [
            { label: 'Mis pedidos', to: '/orders', active: isActiveGroup(location.pathname, ['/orders']), icon: iconOrdersUrl },
            { label: 'Mis reparaciones', to: '/repairs', active: isActiveGroup(location.pathname, ['/repairs']), icon: iconRepairsUrl },
            { label: 'Ayuda', to: '/help', active: isActiveGroup(location.pathname, ['/help']) },
            { label: 'Mi cuenta', to: '/mi-cuenta', active: isActiveGroup(location.pathname, ['/mi-cuenta']) },
            ...(!authUser.emailVerified
              ? [
                  {
                    label: 'Verificar correo',
                    to: '/auth/verify-email',
                    active: isActiveGroup(location.pathname, ['/auth/verify-email']),
                    highlight: 'warning' as const,
                  },
                ]
              : []),
          ]
        : [],
    [authUser, iconOrdersUrl, iconRepairsUrl, location.pathname],
  );

  const adminLinks = useMemo<LinkItem[]>(
    () =>
      isAdmin
        ? [
            { label: 'Panel admin', to: '/admin', active: location.pathname === '/admin', icon: iconDashboardUrl },
            { label: 'Pedidos', to: '/admin/orders', active: isActiveGroup(location.pathname, ['/admin/orders']) },
            { label: 'Reparaciones', to: '/admin/repairs', active: isActiveGroup(location.pathname, ['/admin/repairs']) },
            { label: 'Venta rapida', to: '/admin/ventas-rapidas', active: isActiveGroup(location.pathname, ['/admin/ventas-rapidas']) },
            { label: 'Productos', to: '/admin/productos', active: isActiveGroup(location.pathname, ['/admin/productos']) },
            {
              label: 'Configuracion',
              to: '/admin/configuraciones',
              active: isActiveGroup(location.pathname, ['/admin/configuraciones']),
              icon: iconSettingsUrl,
            },
          ]
        : [],
    [iconDashboardUrl, iconSettingsUrl, isAdmin, location.pathname],
  );

  const sidebarNavLinks = useMemo<LinkItem[]>(
    () => [
      { label: 'Tienda', to: '/store', active: isActiveGroup(location.pathname, ['/store']) || location.pathname === '/', icon: iconStoreUrl },
      {
        label: 'Reparacion',
        to: '/reparacion',
        active: isActiveGroup(location.pathname, ['/reparacion', '/repair-lookup']),
        icon: iconRepairLookupUrl,
      },
      ...(isAdmin ? [{ label: 'Admin', to: '/admin', active: isActiveGroup(location.pathname, ['/admin']), icon: iconDashboardUrl }] : []),
    ],
    [iconDashboardUrl, iconRepairLookupUrl, iconStoreUrl, isAdmin, location.pathname],
  );

  useEffect(() => {
    setAdminSectionOpen(isAdmin && adminLinks.some((link) => link.active));
  }, [adminLinks, isAdmin]);

  const logout = () => {
    authStorage.clear();
    setAccountOpen(false);
    setSidebarOpen(false);
    navigate('/store', { replace: true });
  };

  const closeAccount = () => setAccountOpen(false);
  const closeSidebar = () => setSidebarOpen(false);

  const toggleSidebar = () => {
    setAccountOpen(false);
    setSidebarOpen((prev) => !prev);
  };

  const toggleAccount = () => {
    if (!isDesktop) setSidebarOpen(false);
    setAccountOpen((prev) => !prev);
  };

  const accountMenuItems = () => {
    if (!accountMenuRef.current) return [] as HTMLElement[];
    return Array.from(accountMenuRef.current.querySelectorAll<HTMLElement>('[data-account-menu-item]'));
  };

  const focusAccountItem = (index: number) => {
    const items = accountMenuItems();
    if (!items.length) return;
    const safeIndex = Math.max(0, Math.min(index, items.length - 1));
    items[safeIndex]?.focus();
  };

  const focusFirstAccountItem = () => focusAccountItem(0);

  const handleAccountButtonKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setAccountOpen(true);
      window.setTimeout(() => focusFirstAccountItem(), 0);
    }
  };

  const handleAccountMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setAccountOpen(false);
      accountButtonRef.current?.focus();
      return;
    }

    const items = accountMenuItems();
    if (!items.length) return;
    const currentIndex = items.findIndex((item) => item === document.activeElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusAccountItem(currentIndex >= 0 ? (currentIndex + 1) % items.length : 0);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusAccountItem(currentIndex >= 0 ? (currentIndex - 1 + items.length) % items.length : items.length - 1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusAccountItem(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusAccountItem(items.length - 1);
    }
  };

  return (
    <div className="app-shell text-zinc-900" data-shell-context={shellContext}>
      <header className="shell-header sticky top-0 z-[140] border-b shadow-sm">
        <div className="container-page">
          <div className="flex h-14 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {!isDesktop ? (
                <button
                  className="icon-btn"
                  aria-label="Abrir menu"
                  aria-expanded={sidebarOpen ? 'true' : 'false'}
                  type="button"
                  onClick={toggleSidebar}
                >
                  <Menu className="h-5 w-5" />
                </button>
              ) : null}

              <Link to={isAdmin ? '/admin' : '/store'} className="flex min-w-0 items-center gap-2">
                {brandLogoUrl ? (
                  <img src={brandLogoUrl} className="h-9 w-9 object-contain" alt="NicoReparaciones" />
                ) : (
                  <div className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-100 bg-white text-sky-600 ring-1 ring-zinc-100">
                    <Wrench className="h-4.5 w-4.5" />
                  </div>
                )}
                <div className="min-w-0 leading-tight">
                  <BrandWordmark title={brandTitle} />
                  <div className="hidden truncate text-[11px] text-zinc-500 sm:block">Servicio tecnico profesional y tienda de electronica</div>
                </div>
              </Link>
            </div>

            <nav className="hidden items-center gap-1 rounded-full bg-zinc-100/80 p-1 ring-1 ring-zinc-200 md:flex">
              {desktopLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold transition ${
                    link.active
                      ? 'bg-white text-sky-700 shadow-sm ring-1 ring-sky-200'
                      : 'text-zinc-700 hover:bg-white/70 hover:text-zinc-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {authUser && !authUser.emailVerified ? (
                <>
                  <Link
                    to="/auth/verify-email"
                    className="hidden h-9 items-center rounded-full border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-800 transition hover:bg-amber-100 sm:inline-flex"
                    aria-label="Correo sin verificar"
                  >
                    Correo sin verificar
                  </Link>
                  <Link to="/auth/verify-email" className="icon-btn text-amber-700 sm:hidden" aria-label="Correo sin verificar" title="Correo sin verificar">
                    <WarnIcon />
                  </Link>
                </>
              ) : null}

              <Link
                to="/cart"
                className="relative mr-2 inline-flex items-center justify-center rounded-none border-0 bg-transparent p-0 text-zinc-800 transition-colors hover:bg-transparent hover:text-sky-700"
                aria-label="Carrito"
              >
                {iconCartUrl ? <img src={iconCartUrl} alt="" className="h-7 w-7 object-contain" /> : <CartGlyph />}
                {cartCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-600 px-1 text-[10px] font-black leading-4 text-white ring-2 ring-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                ) : null}
              </Link>

              {!authUser ? (
                <>
                  <Link to="/auth/login" className="btn-outline hidden sm:inline-flex">
                    Ingresar
                  </Link>
                  <Link to="/auth/login" className="btn-primary sm:hidden">
                    Ingresar
                  </Link>
                </>
              ) : (
                <AccountMenu
                  authUser={authUser}
                  isDesktop={isDesktop}
                  accountOpen={accountOpen}
                  accountRef={accountRef}
                  accountButtonRef={accountButtonRef}
                  accountMenuRef={accountMenuRef}
                  accountLinks={accountLinks}
                  emailStatusText={emailStatusText}
                  iconLogoutUrl={iconLogoutUrl}
                  onButtonClick={toggleAccount}
                  onButtonKeyDown={handleAccountButtonKeyDown}
                  onMenuKeyDown={handleAccountMenuKeyDown}
                  onOpen={() => setAccountOpen(true)}
                  onClose={closeAccount}
                  onLinkClick={closeAccount}
                  onLogout={logout}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <MobileSidebar
        open={sidebarOpen}
        isDesktop={isDesktop}
        authUser={authUser}
        brandLogoUrl={brandLogoUrl}
        isAdmin={isAdmin}
        userInitial={userInitial}
        sidebarNavLinks={sidebarNavLinks}
        accountLinks={accountLinks}
        adminLinks={adminLinks}
        adminSectionOpen={adminSectionOpen}
        iconLogoutUrl={iconLogoutUrl}
        onClose={closeSidebar}
        onLogout={logout}
        onToggleAdminSection={() => setAdminSectionOpen((prev) => !prev)}
      />

      <main className={cn('shell-main container-page')}>{children}</main>

      <AppShellFooter authUser={authUser} brandLogoUrl={brandLogoUrl} brandTitle={brandTitle} isAdmin={isAdmin} onLogout={logout} />

      <CartAddedPopup />
    </div>
  );
}
