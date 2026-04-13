import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Wrench } from 'lucide-react';
import { useCartCount } from '@/features/cart/useCart';
import { authStorage } from './storage';
import { storeApi } from '@/features/store/api';
import type { StoreBrandingAssets } from '@/features/store/types';
import { MobileSidebar } from '@/layouts/app-shell/mobile-sidebar';
import { BrandWordmark, CartGlyph, WarnIcon } from '@/layouts/app-shell/primitives';
import {
  buildAccountLinks,
  buildAdminLinks,
  buildDesktopLinks,
  buildSidebarNavLinks,
  deriveAppShellDisplay,
} from '@/layouts/app-shell/helpers';
import { lockScroll, unlockScroll } from '@/layouts/app-shell/utils';
import { PageShell } from '@/components/ui/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';

export function AuthLayout({
  eyebrow = 'Cuenta',
  statusLabel = 'Acceso',
  title,
  subtitle,
  children,
  headerActions,
}: {
  eyebrow?: string;
  statusLabel?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  headerActions?: ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = useCartCount();
  const [branding, setBranding] = useState<StoreBrandingAssets | null>(null);
  const [authUser, setAuthUser] = useState(() => authStorage.getUser());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminSectionOpen, setAdminSectionOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true,
  );

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
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const syncViewport = (event?: MediaQueryListEvent) => setIsDesktop(event ? event.matches : mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);

    return () => mediaQuery.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
    setAuthUser(authStorage.getUser());
  }, [location.pathname]);

  useEffect(() => {
    if (isDesktop) setSidebarOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (sidebarOpen) lockScroll();
    else unlockScroll();

    return () => unlockScroll();
  }, [sidebarOpen]);

  const display = deriveAppShellDisplay(authUser, branding);
  const authPanelImageDesktopUrl = branding?.authPanelImages?.desktop || null;
  const authPanelImageMobileUrl = branding?.authPanelImages?.mobile || authPanelImageDesktopUrl;
  const hideGuestLoginCta = !authUser && location.pathname === '/auth/login';

  const desktopLinks = useMemo(
    () => buildDesktopLinks(location.pathname, display.isAdmin),
    [display.isAdmin, location.pathname],
  );

  const accountLinks = useMemo(
    () =>
      buildAccountLinks({
        authUser,
        pathname: location.pathname,
        iconOrdersUrl: display.iconOrdersUrl,
        iconRepairsUrl: display.iconRepairsUrl,
      }),
    [authUser, display.iconOrdersUrl, display.iconRepairsUrl, location.pathname],
  );

  const adminLinks = useMemo(
    () =>
      buildAdminLinks({
        pathname: location.pathname,
        isAdmin: display.isAdmin,
        iconDashboardUrl: display.iconDashboardUrl,
        iconSettingsUrl: display.iconSettingsUrl,
      }),
    [display.iconDashboardUrl, display.iconSettingsUrl, display.isAdmin, location.pathname],
  );

  const sidebarNavLinks = useMemo(
    () =>
      buildSidebarNavLinks({
        pathname: location.pathname,
        isAdmin: display.isAdmin,
        iconStoreUrl: display.iconStoreUrl,
        iconRepairLookupUrl: display.iconRepairLookupUrl,
        iconDashboardUrl: display.iconDashboardUrl,
      }),
    [display.iconDashboardUrl, display.iconRepairLookupUrl, display.iconStoreUrl, display.isAdmin, location.pathname],
  );

  useEffect(() => {
    setAdminSectionOpen(display.isAdmin && adminLinks.some((link) => link.active));
  }, [adminLinks, display.isAdmin]);

  const authCta = authUser
    ? {
        to: authUser.role === 'ADMIN' ? '/admin' : '/mi-cuenta',
        label: authUser.role === 'ADMIN' ? 'Panel admin' : 'Mi cuenta',
        variant: 'outline' as const,
      }
    : !hideGuestLoginCta
      ? {
          to: '/auth/login',
          label: 'Ingresar',
          variant: 'primary' as const,
        }
      : null;

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function logout() {
    authStorage.clear();
    setSidebarOpen(false);
    navigate('/store', { replace: true });
  }

  return (
    <PageShell context="account" className="auth-shell">
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
                  onClick={() => setSidebarOpen((current) => !current)}
                >
                  <Menu className="h-5 w-5" />
                </button>
              ) : null}

              <Link to={display.brandHomeTo} className="flex min-w-0 items-center gap-2">
                {display.brandLogoUrl ? (
                  <img src={display.brandLogoUrl} className="h-9 w-9 object-contain" alt={display.brandTitle} />
                ) : (
                  <div className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-100 bg-white text-sky-600 ring-1 ring-zinc-100">
                    <Wrench className="h-4.5 w-4.5" />
                  </div>
                )}
                <div className="min-w-0 leading-tight">
                  <BrandWordmark title={display.brandTitle} />
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
              {display.needsEmailVerification ? (
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
                {display.iconCartUrl ? <img src={display.iconCartUrl} alt="" className="h-7 w-7 object-contain" /> : <CartGlyph />}
                {cartCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-600 px-1 text-[10px] font-black leading-4 text-white ring-2 ring-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                ) : null}
              </Link>

              {authCta ? (
                <Link to={authCta.to} className={authCta.variant === 'primary' ? 'btn-primary' : 'btn-outline'}>
                  {authCta.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <MobileSidebar
        open={sidebarOpen}
        isDesktop={isDesktop}
        authUser={authUser}
        brandLogoUrl={display.brandLogoUrl}
        isAdmin={display.isAdmin}
        userInitial={display.userInitial}
        sidebarNavLinks={sidebarNavLinks}
        accountLinks={accountLinks}
        adminLinks={adminLinks}
        adminSectionOpen={adminSectionOpen}
        iconLogoutUrl={display.iconLogoutUrl}
        hideGuestLoginLink={hideGuestLoginCta}
        onClose={closeSidebar}
        onLogout={logout}
        onToggleAdminSection={() => setAdminSectionOpen((current) => !current)}
      />

      <div className="container-page auth-stage">
        <div className="auth-scene">
          <aside className={`auth-visual ${authPanelImageDesktopUrl || authPanelImageMobileUrl ? 'has-media' : ''}`}>
            {authPanelImageDesktopUrl || authPanelImageMobileUrl ? (
              <picture className="auth-visual__picture" aria-hidden="true">
                {authPanelImageMobileUrl ? <source media="(max-width: 1023.98px)" srcSet={authPanelImageMobileUrl} /> : null}
                <img
                  src={authPanelImageDesktopUrl || authPanelImageMobileUrl || undefined}
                  alt=""
                  className="auth-visual__media"
                />
              </picture>
            ) : null}
            <span className="auth-visual__shape auth-visual__shape--one" />
            <span className="auth-visual__shape auth-visual__shape--two" />
            <span className="auth-visual__shape auth-visual__shape--three" />
            <span className="auth-visual__shape auth-visual__shape--four" />
            <span className="auth-visual__shape auth-visual__shape--five" />

            <div className="auth-visual__content">
              <div className="auth-visual__brand-chip">
                <span className="auth-visual__brand-mark">
                  {display.brandLogoUrl ? (
                    <img src={display.brandLogoUrl} className="auth-visual__brand-logo" alt={display.brandTitle} />
                  ) : (
                    <span className="auth-visual__brand-fallback">
                      <Wrench className="h-4 w-4" />
                    </span>
                  )}
                </span>
                <span className="auth-visual__brand-title">{display.brandTitle}</span>
              </div>

              <span className="auth-visual__eyebrow">Cuenta web</span>
              <h2 className="auth-visual__title">Acceso claro y ordenado.</h2>
              <p className="auth-visual__copy">Tu cuenta Nico para entrar, seguir pedidos y consultar reparaciones sin friccion.</p>
            </div>
          </aside>

          <section className="auth-panel">
            <div className="auth-panel__surface">
              <div className="auth-panel__header">
                <div>
                  <p className="auth-panel__eyebrow">{eyebrow}</p>
                  <h1 className="auth-panel__title">{title}</h1>
                  {subtitle ? <p className="auth-panel__subtitle">{subtitle}</p> : null}
                </div>

                <div className="auth-panel__meta">
                  <StatusBadge tone="info" label={statusLabel} />
                  {headerActions}
                </div>
              </div>

              <div className="auth-panel__content">{children}</div>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
