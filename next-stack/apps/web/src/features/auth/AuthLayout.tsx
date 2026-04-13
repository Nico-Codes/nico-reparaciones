import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
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
    <PageShell context="account" className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="container-page py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Link to="/store" className="flex min-w-0 items-center gap-3">
              {brandLogoUrl ? (
                <img src={brandLogoUrl} className="h-10 w-10 rounded-2xl bg-white object-contain ring-1 ring-zinc-100" alt={brandTitle} />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-100 bg-white text-sky-600 ring-1 ring-zinc-100">
                  <Wrench className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 leading-tight">
                <BrandWordmark title={brandTitle} />
                <div className="hidden truncate text-[11px] text-zinc-500 sm:block">Acceso a cuenta, pedidos y reparaciones</div>
              </div>
            </Link>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <nav className="flex flex-wrap items-center gap-2">
                {publicLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className={`inline-flex items-center rounded-full px-3 py-2 text-sm font-bold transition ${
                      link.active
                        ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
                        : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {authCta ? (
                <Button asChild variant={authCta.variant} className="justify-center rounded-full px-5">
                  <Link to={authCta.to}>{authCta.label}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="container-page px-4 py-6 md:py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <PageHeader
            context="account"
            eyebrow={eyebrow}
            title={title}
            subtitle={subtitle}
            actions={(
              <>
                <StatusBadge tone="info" label={statusLabel} />
                {headerActions}
              </>
            )}
          />

          <div className="mx-auto w-full max-w-2xl space-y-4">{children}</div>
        </div>
      </div>
    </PageShell>
  );
}
