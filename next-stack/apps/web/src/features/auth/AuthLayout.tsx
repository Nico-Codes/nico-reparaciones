import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { authStorage } from './storage';
import { storeApi } from '@/features/store/api';
import type { StoreBrandingAssets } from '@/features/store/types';
import { BrandWordmark } from '@/layouts/app-shell/primitives';
import { isActiveGroup } from '@/layouts/app-shell/utils';

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
  const [branding, setBranding] = useState<StoreBrandingAssets | null>(null);
  const [authUser, setAuthUser] = useState(() => authStorage.getUser());

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

  const brandTitle = (branding?.siteTitle || 'NicoReparaciones').trim();
  const brandLogoUrl = branding?.logoPrincipal || null;

  const publicLinks = useMemo(
    () => [
      { to: '/store', label: 'Tienda', active: isActiveGroup(location.pathname, ['/store']) || location.pathname === '/' },
      { to: '/reparacion', label: 'Reparacion', active: isActiveGroup(location.pathname, ['/reparacion', '/repair-lookup']) },
      { to: '/help', label: 'Ayuda', active: isActiveGroup(location.pathname, ['/help']) },
    ],
    [location.pathname],
  );

  const authCta = useMemo(() => {
    if (authUser) {
      return {
        to: authUser.role === 'ADMIN' ? '/admin' : '/mi-cuenta',
        label: authUser.role === 'ADMIN' ? 'Panel admin' : 'Mi cuenta',
        variant: 'outline' as const,
      };
    }

    if (location.pathname === '/auth/login') return null;

    return {
      to: '/auth/login',
      label: 'Ingresar',
      variant: 'default' as const,
    };
  }, [authUser, location.pathname]);

  return (
    <PageShell context="account" className="auth-shell">
      <header className="auth-topbar">
        <div className="container-page">
          <div className="auth-topbar__row">
            <Link to="/store" className="auth-topbar__brand">
              <span className="auth-topbar__mark">
                {brandLogoUrl ? (
                  <img src={brandLogoUrl} className="auth-topbar__logo" alt={brandTitle} />
                ) : (
                  <span className="auth-topbar__fallback">
                    <Wrench className="h-5 w-5" />
                  </span>
                )}
              </span>
              <div className="auth-topbar__copy">
                <BrandWordmark title={brandTitle} />
                <span className="auth-topbar__tag">Cuenta, pedidos y reparaciones</span>
              </div>
            </Link>

            <div className="auth-topbar__nav-wrap">
              <nav className="auth-topbar__nav">
                {publicLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className={`auth-topbar__nav-link ${link.active ? 'is-active' : ''}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {authCta ? (
                <Button asChild variant={authCta.variant} className="auth-topbar__cta">
                  <Link to={authCta.to}>{authCta.label}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="container-page auth-stage">
        <div className="auth-scene">
          <aside className="auth-visual">
            <span className="auth-visual__shape auth-visual__shape--one" />
            <span className="auth-visual__shape auth-visual__shape--two" />
            <span className="auth-visual__shape auth-visual__shape--three" />
            <span className="auth-visual__shape auth-visual__shape--four" />
            <span className="auth-visual__shape auth-visual__shape--five" />

            <div className="auth-visual__content">
              <div className="auth-visual__brand-chip">
                <span className="auth-visual__brand-mark">
                  {brandLogoUrl ? (
                    <img src={brandLogoUrl} className="auth-visual__brand-logo" alt={brandTitle} />
                  ) : (
                    <span className="auth-visual__brand-fallback">
                      <Wrench className="h-4 w-4" />
                    </span>
                  )}
                </span>
                <span className="auth-visual__brand-title">{brandTitle}</span>
              </div>

              <span className="auth-visual__eyebrow">Cuenta web</span>
              <h2 className="auth-visual__title">Acceso claro, simple y seguro.</h2>
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
