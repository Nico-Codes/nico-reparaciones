import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HelpCircle, LogOut, Menu, Package, Settings, User, Wrench, WrenchIcon, X } from 'lucide-react';
import { CartAddedPopup } from '@/features/cart/CartAddedPopup';
import { useCartCount } from '@/features/cart/useCart';
import { authStorage } from '@/features/auth/storage';
import type { AuthUser } from '@/features/auth/types';
import { storeApi } from '@/features/store/api';
import type { StoreBrandingAssets } from '@/features/store/types';

type AppShellProps = {
  children: ReactNode;
};

type LinkItem = {
  label: string;
  to: string;
  active?: boolean;
  icon?: string | null;
  highlight?: 'warning' | null;
  badgeCount?: number;
};

function isActiveGroup(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
}

function CartGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden="true">
      <path d="M4.00488 16V4H2.00488V2H5.00488C5.55717 2 6.00488 2.44772 6.00488 3V15H18.4433L20.4433 7H8.00488V5H21.7241C22.2764 5 22.7241 5.44772 22.7241 6C22.7241 6.08176 22.7141 6.16322 22.6942 6.24254L20.1942 16.2425C20.083 16.6877 19.683 17 19.2241 17H5.00488C4.4526 17 4.00488 16.5523 4.00488 16ZM6.00488 23C4.90031 23 4.00488 22.1046 4.00488 21C4.00488 19.8954 4.90031 19 6.00488 19C7.10945 19 8.00488 19.8954 8.00488 21C8.00488 22.1046 7.10945 23 6.00488 23ZM18.0049 23C16.9003 23 16.0049 22.1046 16.0049 21C16.0049 19.8954 16.9003 19 18.0049 19C19.1095 19 20.0049 19.8954 20.0049 21C20.0049 22.1046 19.1095 23 18.0049 23Z" />
    </svg>
  );
}

function LinkBadge({ count }: { count?: number }) {
  if (!count || count <= 0) return null;
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1.5 text-[10px] font-black leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function MenuLinkIcon({ iconUrl, fallback }: { iconUrl?: string | null; fallback: ReactNode }) {
  if (iconUrl) {
    return <img src={iconUrl} alt="" className="h-5 w-5 shrink-0 object-contain" loading="lazy" decoding="async" />;
  }
  return <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">{fallback}</span>;
}

function BrandWordmark({ title }: { title: string }) {
  const normalized = title.replace(/\s+/g, '').toLowerCase();
  if (normalized !== 'nicoreparaciones') {
    return (
      <>
        <div className="hidden truncate font-black tracking-tight text-zinc-900 sm:block">{title}</div>
        <div className="truncate font-black tracking-tight text-zinc-900 sm:hidden">{title}</div>
      </>
    );
  }

  return (
    <>
      <div className="hidden truncate font-black tracking-tight text-zinc-900 sm:block">
        Nico<span className="text-sky-600">Reparaciones</span>
      </div>
      <div className="flex flex-col gap-0 font-black leading-none tracking-tight sm:hidden">
        <span className="block text-[13px] leading-none text-zinc-900">Nico</span>
        <span className="block text-[13px] leading-none text-sky-600">Reparaciones</span>
      </div>
    </>
  );
}

function lockScroll() {
  const docEl = document.documentElement;
  const scrollbarWidth = Math.max(0, window.innerWidth - docEl.clientWidth);
  document.body.style.setProperty('--nr-sbw', `${scrollbarWidth}px`);
  docEl.classList.add('nr-scroll-lock');
  document.body.classList.add('nr-scroll-lock');
}

function unlockScroll() {
  document.documentElement.classList.remove('nr-scroll-lock');
  document.body.classList.remove('nr-scroll-lock');
  document.body.style.removeProperty('--nr-sbw');
}

function MenuLink({
  link,
  onClick,
  menuItem = false,
  className,
  children,
}: {
  link: LinkItem;
  onClick?: () => void;
  menuItem?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={link.to}
      role={menuItem ? 'menuitem' : undefined}
      data-account-menu-item={menuItem || undefined}
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = useCartCount();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true,
  );
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => authStorage.getUser());
  const [branding, setBranding] = useState<StoreBrandingAssets | null>(null);
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
  const brandTitle = (branding?.siteTitle ?? 'NicoReparaciones').trim() || 'NicoReparaciones';
  const iconCartUrl = branding?.icons.carrito || null;
  const iconLogoutUrl = branding?.icons.logout || null;
  const iconSettingsUrl = branding?.icons.settings || null;
  const iconRepairLookupUrl = branding?.icons.consultarReparacion || null;
  const iconOrdersUrl = branding?.icons.misPedidos || null;
  const iconRepairsUrl = branding?.icons.misReparaciones || null;
  const iconDashboardUrl = branding?.icons.dashboard || null;
  const iconStoreUrl = branding?.icons.tienda || null;
  const emailStatusText = authUser?.emailVerified ? 'Email verificado' : 'Email pendiente de verificación';
  const userInitial = authUser?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  const desktopLinks = useMemo<LinkItem[]>(
    () => [
      { to: '/store', label: 'Tienda', active: isActiveGroup(location.pathname, ['/store']) || location.pathname === '/' },
      { to: '/reparacion', label: 'Reparación', active: isActiveGroup(location.pathname, ['/reparacion', '/repair-lookup']) },
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
            ...(!authUser.emailVerified ? [{ label: 'Verificar correo', to: '/auth/verify-email', active: isActiveGroup(location.pathname, ['/auth/verify-email']), highlight: 'warning' as const }] : []),
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
            { label: 'Venta rápida', to: '/admin/ventas-rapidas', active: isActiveGroup(location.pathname, ['/admin/ventas-rapidas']) },
            { label: 'Productos', to: '/admin/productos', active: isActiveGroup(location.pathname, ['/admin/productos']) },
            { label: 'Configuración', to: '/admin/configuraciones', active: isActiveGroup(location.pathname, ['/admin/configuraciones']), icon: iconSettingsUrl },
          ]
        : [],
    [iconDashboardUrl, iconSettingsUrl, isAdmin, location.pathname],
  );

  const sidebarNavLinks = useMemo<LinkItem[]>(
    () => [
      { label: 'Tienda', to: '/store', active: isActiveGroup(location.pathname, ['/store']) || location.pathname === '/', icon: iconStoreUrl },
      { label: 'Reparación', to: '/reparacion', active: isActiveGroup(location.pathname, ['/reparacion', '/repair-lookup']), icon: iconRepairLookupUrl },
      ...(isAdmin ? [{ label: 'Admin', to: '/admin', active: isActiveGroup(location.pathname, ['/admin']), icon: iconDashboardUrl }] : []),
    ],
    [iconDashboardUrl, iconRepairLookupUrl, iconStoreUrl, isAdmin, location.pathname],
  );

  const [adminSectionOpen, setAdminSectionOpen] = useState(isAdmin && adminLinks.some((link) => link.active));

  useEffect(() => {
    setAdminSectionOpen(isAdmin && adminLinks.some((link) => link.active));
  }, [adminLinks, isAdmin]);

  const logout = () => {
    authStorage.clear();
    setAccountOpen(false);
    setSidebarOpen(false);
    navigate('/store', { replace: true });
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

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-[80] border-b border-zinc-200 bg-white shadow-sm md:bg-white/90 md:backdrop-blur">
        <div className="container-page">
          <div className="flex h-14 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {!isDesktop ? (
                <button
                  className="icon-btn"
                  aria-label="Abrir menu"
                  aria-expanded={sidebarOpen ? 'true' : 'false'}
                  type="button"
                  onClick={() => {
                    setAccountOpen(false);
                    setSidebarOpen((prev) => !prev);
                  }}
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
                  <div className="hidden truncate text-[11px] text-zinc-500 sm:block">Servicio Tecnico Profesional y Tienda de Electronica</div>
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
                  <Link to="/auth/verify-email" className="hidden h-9 items-center rounded-full border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-800 transition hover:bg-amber-100 sm:inline-flex" aria-label="Correo sin verificar">
                    Correo sin verificar
                  </Link>
                  <Link to="/auth/verify-email" className="icon-btn text-amber-700 sm:hidden" aria-label="Correo sin verificar" title="Correo sin verificar">
                    <WarnIcon />
                  </Link>
                </>
              ) : null}

              <Link to="/carrito" className="relative mr-2 inline-flex items-center justify-center rounded-none border-0 bg-transparent p-0 text-zinc-800 transition-colors hover:bg-transparent hover:text-sky-700" aria-label="Carrito">
                {iconCartUrl ? <img src={iconCartUrl} alt="" className="h-7 w-7 object-contain" /> : <CartGlyph />}
                {cartCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-600 px-1 text-[10px] font-black leading-4 text-white ring-2 ring-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                ) : null}
              </Link>

              {!authUser ? (
                <>
                  <Link to="/auth/login" className="btn-outline hidden sm:inline-flex">Ingresar</Link>
                  <Link to="/auth/login" className="btn-primary sm:hidden">Ingresar</Link>
                </>
              ) : (
                <div
                  className="relative"
                  ref={accountRef}
                  onMouseEnter={isDesktop ? () => setAccountOpen(true) : undefined}
                  onMouseLeave={isDesktop ? () => setAccountOpen(false) : undefined}
                >
                  <button
                    id="account-menu-button"
                    ref={accountButtonRef}
                    className="btn-ghost px-3 py-2"
                    aria-expanded={accountOpen ? 'true' : 'false'}
                    aria-haspopup="menu"
                    aria-controls="account-menu"
                    aria-label="Abrir menu de cuenta"
                    type="button"
                    onClick={() => {
                      if (!isDesktop) setSidebarOpen(false);
                      setAccountOpen((prev) => !prev);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setAccountOpen(true);
                        window.setTimeout(() => focusFirstAccountItem(), 0);
                      }
                    }}
                  >
                    <span className="sm:hidden">
                      <User className="h-5 w-5" />
                    </span>
                    <span className="hidden max-w-[12rem] truncate sm:inline">{authUser.name || 'Cuenta'}</span>
                    <span className="hidden sm:inline">▼</span>
                  </button>
                  <div className="absolute right-0 top-full h-2 w-64" aria-hidden="true" />

                  <div
                    id="account-menu"
                    ref={accountMenuRef}
                    role="menu"
                    aria-labelledby="account-menu-button"
                    className={`dropdown-menu top-full ${accountOpen ? 'is-open' : 'hidden'}`}
                    onKeyDown={(event) => {
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
                    }}
                    style={{ overflow: 'visible', maxHeight: 'none' }}
                  >
                    <div className="px-3 py-2">
                      <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Estado de correo</div>
                      <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${authUser.emailVerified ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                        {emailStatusText}
                      </span>
                    </div>

                    <div className="my-2 border-t border-zinc-200" />

                    {accountLinks.map((link) => (
                      <MenuLink
                        key={link.label}
                        link={link}
                        menuItem
                        onClick={() => setAccountOpen(false)}
                        className={`dropdown-item ${link.active ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-100' : ''} ${link.highlight === 'warning' ? 'text-amber-700' : ''}`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <MenuLinkIcon
                            iconUrl={link.icon}
                            fallback={
                              link.label === 'Mis pedidos' ? <Package className="h-4 w-4 text-blue-600" /> :
                              link.label === 'Mis reparaciones' ? <WrenchIcon className="h-4 w-4 text-zinc-600" /> :
                              link.label === 'Ayuda' ? <HelpCircle className="h-4 w-4 text-zinc-700" /> :
                              link.label === 'Mi cuenta' ? <User className="h-4 w-4 text-zinc-500" /> :
                              <WarnIcon />
                            }
                          />
                          <span>{link.label}</span>
                        </span>
                      </MenuLink>
                    ))}

                    <div className="my-2 border-t border-zinc-200" />
                    <button type="button" role="menuitem" data-account-menu-item className="dropdown-item text-rose-700" onClick={logout}>
                      <span className="inline-flex items-center gap-2">
                        <MenuLinkIcon iconUrl={iconLogoutUrl} fallback={<LogOut className="h-4 w-4" />} />
                        <span>Cerrar sesión</span>
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {!isDesktop ? (
          <>
            <div className={`fixed inset-0 z-[90] bg-zinc-950/40 ${sidebarOpen ? '' : 'hidden'}`} aria-hidden="true" onClick={() => setSidebarOpen(false)} />

            <aside className={`fixed left-0 top-0 z-[100] flex h-full w-[86%] max-w-xs transform flex-col bg-white shadow-xl transition-transform duration-200 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} aria-label="Menu">
              <div className="flex h-14 items-center justify-between border-b border-zinc-100 px-4">
                <div className="flex items-center gap-2">
                  {brandLogoUrl ? (
                    <img src={brandLogoUrl} className="h-8 w-8 rounded-xl bg-white object-contain ring-1 ring-zinc-100" alt="NicoReparaciones" />
                  ) : (
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-white ring-1 ring-zinc-100">
                      <Wrench className="h-4 w-4 text-sky-600" />
                    </div>
                  )}
                  <div className="font-black text-zinc-900">Menu</div>
                </div>

                <button className="icon-btn" aria-label="Cerrar menu" type="button" onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {authUser ? (
                  <div className="card">
                    <div className="card-body flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 font-black text-sky-700 ring-1 ring-sky-100">{userInitial}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-black text-zinc-900">{authUser.name}</div>
                        <div className="sidebar-sub truncate">{authUser.email}</div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="sidebar-section space-y-2">
                  <div className="sidebar-title">Navegacion</div>
                  <div className="sidebar-links">
                    {sidebarNavLinks.map((link) => (
                      <Link key={link.label} className={`sidebar-link ${link.active ? 'active' : ''}`} to={link.to} onClick={() => setSidebarOpen(false)}>
                        <span className="inline-flex items-center gap-2">
                          <MenuLinkIcon iconUrl={link.icon} fallback={link.label === 'Tienda' ? <Wrench className="h-4 w-4 text-sky-600" /> : link.label === 'Reparación' ? <WrenchIcon className="h-4 w-4 text-zinc-700" /> : <Settings className="h-4 w-4 text-zinc-500" />} />
                          <span>{link.label}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="sidebar-section space-y-2">
                  <div className="sidebar-title">Cuenta</div>
                  <div className="sidebar-links">
                    {accountLinks.map((link) => (
                      <Link key={link.label} className={`sidebar-link ${link.active ? 'active' : ''} ${link.highlight === 'warning' ? 'text-amber-700' : ''}`} to={link.to} onClick={() => setSidebarOpen(false)}>
                        <span className="inline-flex items-center gap-2">
                          <MenuLinkIcon
                            iconUrl={link.icon}
                            fallback={
                              link.label === 'Mis pedidos' ? <Package className="h-4 w-4 text-blue-600" /> :
                              link.label === 'Mis reparaciones' ? <WrenchIcon className="h-4 w-4 text-zinc-700" /> :
                              link.label === 'Ayuda' ? <HelpCircle className="h-4 w-4 text-zinc-700" /> :
                              link.label === 'Mi cuenta' ? <User className="h-4 w-4 text-zinc-500" /> :
                              <WarnIcon />
                            }
                          />
                          <span>{link.label}</span>
                        </span>
                      </Link>
                    ))}

                    {isAdmin ? (
                      <>
                        <button type="button" className={`sidebar-link flex items-center justify-between gap-2 ${adminSectionOpen ? 'active' : ''}`} onClick={() => setAdminSectionOpen((prev) => !prev)}>
                          <span>Admin</span>
                          <span className={`transition-transform ${adminSectionOpen ? 'rotate-180' : ''}`}>⌄</span>
                        </button>
                        <div className={adminSectionOpen ? '' : 'hidden'}>
                          <div className="ml-2 grid gap-1 border-l border-zinc-200 pl-2">
                            {adminLinks.map((link) => (
                              <Link key={link.label} className={`sidebar-link font-semibold text-zinc-700 ${link.active ? 'active' : ''}`} to={link.to} onClick={() => setSidebarOpen(false)}>
                                <span className="inline-flex items-center gap-2">
                                  <MenuLinkIcon iconUrl={link.icon} fallback={link.label === 'Panel admin' ? <Settings className="h-4 w-4 text-zinc-500" /> : <Wrench className="h-4 w-4 text-zinc-500" />} />
                                  <span>{link.label}</span>
                                  <LinkBadge count={link.badgeCount} />
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : null}

                    {authUser ? (
                      <button type="button" className="sidebar-link text-rose-700" onClick={logout}>
                        <span className="inline-flex items-center gap-2">
                          <MenuLinkIcon iconUrl={iconLogoutUrl} fallback={<LogOut className="h-4 w-4" />} />
                          <span>Cerrar sesión</span>
                        </span>
                      </button>
                    ) : (
                      <>
                        <Link className="sidebar-link" to="/auth/login" onClick={() => setSidebarOpen(false)}><span>Iniciar sesión</span></Link>
                        <Link className="sidebar-link" to="/auth/register" onClick={() => setSidebarOpen(false)}><span>Crear cuenta</span></Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </>
        ) : null}
      </header>

      <main className="container-page py-6">{children}</main>

      <footer className="mt-8 border-t border-zinc-100 bg-white">
        <div className="container-page grid gap-6 py-6 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-sky-600 shadow-sm">
                {brandLogoUrl ? <img src={brandLogoUrl} alt="" className="h-6 w-6 object-contain" /> : <Wrench className="h-5 w-5" />}
              </div>
              <div className="font-black tracking-tight">{brandTitle}</div>
            </div>
            <p className="mt-2 text-sm text-zinc-500">Tienda simple + consulta de reparaciones.</p>
          </div>

          <div className="text-sm">
            <div className="mb-2 font-black text-zinc-900">Accesos</div>
            <div className="grid gap-1 text-zinc-700">
              <Link to="/store" className="hover:text-zinc-900">Tienda</Link>
              <Link to="/carrito" className="hover:text-zinc-900">Carrito</Link>
              <Link to="/reparacion" className="hover:text-zinc-900">Consultar Reparación</Link>
            </div>
          </div>

          <div className="text-sm">
            <div className="mb-2 font-black text-zinc-900">Cuenta</div>
            <div className="grid gap-1 text-zinc-700">
              {authUser ? (
                <>
                  <Link to="/orders" className="hover:text-zinc-900">Mis pedidos</Link>
                  <Link to="/repairs" className="hover:text-zinc-900">Mis reparaciones</Link>
                  <Link to="/help" className="hover:text-zinc-900">Ayuda</Link>
                  {isAdmin ? <Link to="/admin" className="hover:text-zinc-900">Panel admin</Link> : null}
                  <button type="button" className="text-left font-bold text-rose-700 hover:text-rose-800" onClick={logout}>Cerrar sesión</button>
                </>
              ) : (
                <>
                  <Link to="/help" className="hover:text-zinc-900">Ayuda</Link>
                  <Link to="/auth/login" className="hover:text-zinc-900">Ingresar</Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="container-page flex flex-col gap-2 pb-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} {brandTitle}</div>
          <div className="text-zinc-400">Hecho con React + NestJS</div>
        </div>
      </footer>

      <CartAddedPopup />
    </div>
  );
}
